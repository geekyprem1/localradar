// Feature: real-data-intelligence-engine
// Unit tests for Cache_Manager edge cases: missing stable key on write and
// orphaned cached opportunity on read.
//
// Validates: Requirements 9.4, 9.5
import { describe, it, expect } from 'vitest';
import {
  buildOpportunityCacheRows,
  reconstructAssociations,
  type BusinessCacheRow,
  type OpportunityCacheRow,
} from './opportunityCache';
import type { Business, Opportunity } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/** Build a valid Business with a stable place_id, overridable per test. */
function makeBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: 'biz-1',
    created_at: '2024-01-01T00:00:00.000Z',
    organization_id: 'org-1',
    place_id: 'place-1',
    name: 'Valid Business',
    website: 'https://valid.example',
    rating: 4.5,
    reviews_count: 42,
    phone: '+1000000000',
    address: '1 Main St',
    ...overrides,
  };
}

/** Build an Opportunity owned by a business id, overridable per test. */
function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-1',
    created_at: '2024-01-01T00:00:00.000Z',
    business_id: 'biz-1',
    place_id: 'place-1',
    website_score: 10,
    reviews_score: 20,
    seo_score: 30,
    gbp_score: 15,
    social_score: 5,
    total_score: 80,
    opportunity_level: 'High',
    estimated_deal_value: 5000,
    deal_value_min: 3000,
    deal_value_max: 7000,
    deal_value_provenance: 'estimated',
    closing_probability: 60,
    confidence: 75,
    data_source: 'live',
    ...overrides,
  };
}

/** Build a valid cache business row, overridable per test. */
function makeBusinessRow(overrides: Partial<BusinessCacheRow> = {}): BusinessCacheRow {
  return {
    place_id: 'place-1',
    name: 'Valid Business',
    website: 'https://valid.example',
    rating: 4.5,
    reviews_count: 42,
    phone: '+1000000000',
    address: '1 Main St',
    business_email: '',
    contact_email: '',
    contact_page: '',
    contact_provenance: null,
    ...overrides,
  };
}

/** Build a valid cache opportunity row, overridable per test. */
function makeOpportunityRow(overrides: Partial<OpportunityCacheRow> = {}): OpportunityCacheRow {
  return {
    place_id: 'place-1',
    website_score: 10,
    reviews_score: 20,
    seo_score: 30,
    gbp_score: 15,
    social_score: 5,
    total_score: 80,
    opportunity_level: 'High',
    estimated_deal_value: 5000,
    deal_value_min: 3000,
    deal_value_max: 7000,
    deal_value_provenance: 'estimated',
    closing_probability: 60,
    confidence: 75,
    data_source: 'cache',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.4 — missing stable key rejected, leaving other cache rows unchanged
// ─────────────────────────────────────────────────────────────────────────────

describe('buildOpportunityCacheRows — missing stable key (Req 9.4)', () => {
  it('rejects a business with a missing/empty place_id and omits its rows, while keeping the valid business', () => {
    const validBusiness = makeBusiness({ id: 'biz-valid', place_id: 'place-valid', name: 'Keeper' });
    const invalidBusiness = makeBusiness({ id: 'biz-invalid', place_id: '', name: 'No Key' });

    const opportunities: Record<string, Opportunity> = {
      'biz-valid': makeOpportunity({ id: 'opp-valid', business_id: 'biz-valid', place_id: 'place-valid' }),
      'biz-invalid': makeOpportunity({ id: 'opp-invalid', business_id: 'biz-invalid', place_id: '' }),
    };

    const result = buildOpportunityCacheRows({
      businesses: [validBusiness, invalidBusiness],
      opportunities,
    });

    // The invalid business is reported as rejected with the expected reason.
    expect(result.rejected).toEqual([{ name: 'No Key', reason: 'missing_stable_key' }]);

    // Its business row and opportunity row are omitted entirely.
    expect(result.businessRows.map((r) => r.name)).not.toContain('No Key');
    expect(result.businessRows.map((r) => r.place_id)).not.toContain('');
    expect(result.opportunityRows.every((r) => r.place_id !== '')).toBe(true);

    // The valid business's rows remain present and unchanged (prior/other cache unaffected).
    expect(result.businessRows).toHaveLength(1);
    expect(result.businessRows[0].place_id).toBe('place-valid');
    expect(result.businessRows[0].name).toBe('Keeper');
    expect(result.opportunityRows).toHaveLength(1);
    expect(result.opportunityRows[0].place_id).toBe('place-valid');
  });

  it('rejects a business whose place_id is only whitespace', () => {
    const validBusiness = makeBusiness({ id: 'biz-valid', place_id: 'place-valid', name: 'Keeper' });
    const blankBusiness = makeBusiness({ id: 'biz-blank', place_id: '   ', name: 'Blank Key' });

    const result = buildOpportunityCacheRows({
      businesses: [validBusiness, blankBusiness],
      opportunities: {},
    });

    expect(result.rejected).toEqual([{ name: 'Blank Key', reason: 'missing_stable_key' }]);
    expect(result.businessRows).toHaveLength(1);
    expect(result.businessRows[0].place_id).toBe('place-valid');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Req 9.5 — orphaned cached opportunity skipped on read
// ─────────────────────────────────────────────────────────────────────────────

describe('reconstructAssociations — orphaned opportunity skipped (Req 9.5)', () => {
  it('excludes an opportunity whose place_id matches no business and records it as orphaned, while associating the matching one', () => {
    const businessRows: BusinessCacheRow[] = [makeBusinessRow({ place_id: 'place-known', name: 'Known' })];

    const matchingOpp = makeOpportunityRow({ place_id: 'place-known', total_score: 88 });
    const orphanOpp = makeOpportunityRow({ place_id: 'place-orphan', total_score: 12 });

    const result = reconstructAssociations({
      businessRows,
      opportunityRows: [matchingOpp, orphanOpp],
    });

    // The orphan is recorded with the expected reason.
    expect(result.orphanedSkipped).toEqual([{ place_id: 'place-orphan', reason: 'orphaned_skipped' }]);

    // The orphan is not associated with any business.
    const associatedOpps = result.associations
      .map((a) => a.opportunity)
      .filter((o): o is OpportunityCacheRow => o !== null);
    expect(associatedOpps.map((o) => o.place_id)).not.toContain('place-orphan');

    // The matching opportunity associates correctly to its business.
    expect(result.associations).toHaveLength(1);
    expect(result.associations[0].placeId).toBe('place-known');
    expect(result.associations[0].business.name).toBe('Known');
    expect(result.associations[0].opportunity).not.toBeNull();
    expect(result.associations[0].opportunity?.place_id).toBe('place-known');
    expect(result.associations[0].opportunity?.total_score).toBe(88);
  });

  it('records no orphans when every opportunity matches a known business', () => {
    const businessRows: BusinessCacheRow[] = [
      makeBusinessRow({ place_id: 'place-a', name: 'A' }),
      makeBusinessRow({ place_id: 'place-b', name: 'B' }),
    ];
    const opportunityRows: OpportunityCacheRow[] = [
      makeOpportunityRow({ place_id: 'place-a' }),
      makeOpportunityRow({ place_id: 'place-b' }),
    ];

    const result = reconstructAssociations({ businessRows, opportunityRows });

    expect(result.orphanedSkipped).toEqual([]);
    expect(result.associations).toHaveLength(2);
    expect(result.associations.every((a) => a.opportunity !== null)).toBe(true);
  });
});
