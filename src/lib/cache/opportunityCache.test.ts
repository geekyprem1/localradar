// Feature: real-data-intelligence-engine, Property 15: Cache association and honesty labels round-trip by place id
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { Business, Opportunity } from '@/types';
import type { ProvenanceLabel, DataSource, ConfidenceValue } from '@/types/scoring';
import { buildOpportunityCacheRows, reconstructAssociations } from './opportunityCache';

// ─────────────────────────────────────────────────────────────────────────────
// Smart generators
//
// We deliberately draw names from a tiny pool so that same-name collisions
// happen frequently across a result set, while place ids (and business ids) are
// assigned uniquely per record by index. That combination exercises Req 9.2:
// two businesses can share a name yet must never cross-associate opportunities,
// because association is keyed strictly on the stable unique key (place_id).
// ─────────────────────────────────────────────────────────────────────────────

const nameArb = fc.constantFrom(
  'Joe Pizza',
  'Acme Dental',
  'Bright Smile Clinic',
  'Corner Cafe',
);

const provenanceArb = fc.constantFrom<ProvenanceLabel>(
  'real',
  'estimated',
  'heuristic',
  'unavailable',
);

const dataSourceArb = fc.constantFrom<DataSource>('live', 'cache', 'sandbox');
const confidenceArb: fc.Arbitrary<ConfidenceValue> = fc.integer({ min: 0, max: 100 });
const levelArb = fc.constantFrom<'High' | 'Medium' | 'Low'>('High', 'Medium', 'Low');
const nullableNat = fc.option(fc.nat({ max: 1_000_000 }), { nil: null });

/**
 * Per-record spec: everything needed to synthesize a business plus the
 * opportunity it produced. Unique id / place_id are assigned by index later, so
 * the generator only supplies the parts that vary (including a possibly-shared
 * name and the honesty labels that must round-trip).
 */
const recordSpecArb = fc.record({
  name: nameArb,
  website: fc.webUrl(),
  rating: fc.double({ min: 0, max: 5, noNaN: true }),
  reviews_count: fc.nat({ max: 5000 }),
  // opportunity scores
  website_score: fc.nat({ max: 100 }),
  reviews_score: fc.nat({ max: 100 }),
  seo_score: fc.nat({ max: 100 }),
  gbp_score: fc.nat({ max: 100 }),
  social_score: fc.nat({ max: 100 }),
  total_score: fc.nat({ max: 100 }),
  opportunity_level: levelArb,
  estimated_deal_value: nullableNat,
  deal_value_min: nullableNat,
  deal_value_max: nullableNat,
  closing_probability: fc.nat({ max: 100 }),
  // honesty labels that must round-trip unchanged (Req 9.6, 9.7)
  deal_value_provenance: provenanceArb,
  confidence: confidenceArb,
  data_source: dataSourceArb,
});

const casesArb = fc.array(recordSpecArb, { minLength: 1, maxLength: 15 });

type RecordSpec = typeof recordSpecArb extends fc.Arbitrary<infer T> ? T : never;

/** Build the in-memory businesses + opportunities from specs, keyed uniquely by index. */
function synthesize(specs: RecordSpec[]): {
  businesses: Business[];
  opportunities: Record<string, Opportunity>;
} {
  const businesses: Business[] = specs.map((s, i) => ({
    id: `biz-${i}`,
    created_at: '2024-01-01T00:00:00Z',
    organization_id: 'org-1',
    place_id: `place-${i}`,
    name: s.name,
    website: s.website,
    rating: s.rating,
    reviews_count: s.reviews_count,
    phone: '',
    address: '',
  }));

  const opportunities: Record<string, Opportunity> = {};
  specs.forEach((s, i) => {
    const business = businesses[i];
    // Each business's opportunity carries the SAME place_id as its business.
    opportunities[business.id] = {
      id: `opp-${i}`,
      created_at: '2024-01-01T00:00:00Z',
      business_id: business.id,
      place_id: business.place_id,
      website_score: s.website_score,
      reviews_score: s.reviews_score,
      seo_score: s.seo_score,
      gbp_score: s.gbp_score,
      social_score: s.social_score,
      total_score: s.total_score,
      opportunity_level: s.opportunity_level,
      estimated_deal_value: s.estimated_deal_value,
      deal_value_min: s.deal_value_min,
      deal_value_max: s.deal_value_max,
      deal_value_provenance: s.deal_value_provenance,
      closing_probability: s.closing_probability,
      confidence: s.confidence,
      data_source: s.data_source,
    };
  });

  return { businesses, opportunities };
}

describe('opportunityCache — Property 15: cache association + honesty labels round-trip by place id', () => {
  it('reconstructs associations by place id (no cross-association) and round-trips provenance/data_source/confidence', () => {
    fc.assert(
      fc.property(casesArb, (specs) => {
        const { businesses, opportunities } = synthesize(specs);

        // Persist → read through the pure cache model.
        const { businessRows, opportunityRows } = buildOpportunityCacheRows({
          businesses,
          opportunities,
        });
        const { associations } = reconstructAssociations({ businessRows, opportunityRows });

        // Every business (all have a stable key here) is reconstructed exactly once.
        expect(associations).toHaveLength(businesses.length);

        // Index the original businesses/opportunities by their stable place id so
        // we can assert the reconstructed association points back to the right one.
        const businessByPlaceId = new Map(businesses.map((b) => [b.place_id, b]));

        for (const assoc of associations) {
          const originalBusiness = businessByPlaceId.get(assoc.placeId);
          // Req 9.1/9.3: the association's place id maps to a real business.
          expect(originalBusiness).toBeDefined();
          expect(assoc.business.place_id).toBe(assoc.placeId);
          expect(assoc.business.name).toBe(originalBusiness!.name);

          // Req 9.2: the reconstructed opportunity belongs to the business with the
          // matching place id — never a same-named business with a different id.
          expect(assoc.opportunity).not.toBeNull();
          const opp = assoc.opportunity!;
          expect(opp.place_id).toBe(assoc.placeId);

          const originalOpp = opportunities[originalBusiness!.id];
          // Req 9.6/9.7: honesty labels stored at persist time are returned unchanged.
          expect(opp.deal_value_provenance).toBe(originalOpp.deal_value_provenance);
          expect(opp.data_source).toBe(originalOpp.data_source);
          expect(opp.confidence).toBe(originalOpp.confidence);

          // The full scored payload round-trips too (association carries the right rows).
          expect(opp.total_score).toBe(originalOpp.total_score);
          expect(opp.opportunity_level).toBe(originalOpp.opportunity_level);
          expect(opp.estimated_deal_value).toBe(originalOpp.estimated_deal_value);
          expect(opp.closing_probability).toBe(originalOpp.closing_probability);
        }

        // Explicit cross-association guard for same-named businesses (Req 9.2):
        // group associations by name; within each name group the opportunities'
        // place ids must exactly match their own business's place id.
        for (const assoc of associations) {
          const sameName = associations.filter((a) => a.business.name === assoc.business.name);
          for (const other of sameName) {
            expect(other.opportunity!.place_id).toBe(other.business.place_id);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});
