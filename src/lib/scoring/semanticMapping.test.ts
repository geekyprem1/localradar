// Feature: real-data-intelligence-engine, Property 13: Backward-compatible scores map to their semantic components
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Business } from '@/types';
import { scoreBusinessOpportunity } from './index';
import {
  ResultSetCompetitorBenchmarkService,
  PlaceLite,
} from './competitorBenchmark';

const benchmarkService = new ResultSetCompetitorBenchmarkService();

// ---------------------------------------------------------------------------
// Smart generators — realistic Business + competitor result set
// ---------------------------------------------------------------------------

// Websites cover the meaningful branches: none, real site, Instagram-only,
// Facebook-only, and arbitrary strings — so every website-opportunity path and
// thus every breakdown component is exercised.
const websiteArb = fc.oneof(
  fc.constant(''),
  fc.constant('https://example.com'),
  fc.constant('https://instagram.com/somebiz'),
  fc.constant('https://facebook.com/somebiz'),
  fc.webUrl(),
);

const businessArb: fc.Arbitrary<Business> = fc.record({
  id: fc.uuid(),
  created_at: fc.constant('2024-01-01T00:00:00.000Z'),
  organization_id: fc.uuid(),
  place_id: fc.constantFrom('p0', 'p1', 'p2', 'p3', 'p4', 'self'),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  website: websiteArb,
  rating: fc.double({ min: 0, max: 5, noNaN: true }),
  reviews_count: fc.nat({ max: 5000 }),
  phone: fc.oneof(fc.constant(''), fc.constant('+1 555 111 2222')),
  address: fc.oneof(fc.constant(''), fc.constant('123 Main St, Springfield')),
});

const placeLiteArb: fc.Arbitrary<PlaceLite> = fc.record({
  placeId: fc.constantFrom('p0', 'p1', 'p2', 'p3', 'p4', 'self'),
  rating: fc.double({ min: 0, max: 5, noNaN: true }),
  reviewsCount: fc.nat({ max: 5000 }),
  website: fc.oneof(fc.constant(''), fc.webUrl()),
});

const categoryArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom('Dentists', 'Plumbers', 'Lawyers', 'Gyms', 'Coffee Shops'),
);

const countryArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom('US', 'United Kingdom', 'India', 'Brazil'),
);

const caseArb = fc.record({
  business: businessArb,
  resultSet: fc.array(placeLiteArb, { maxLength: 10 }),
  category: categoryArb,
  country: countryArb,
});

describe('scoreBusinessOpportunity — Property 13: legacy scores map to semantic breakdown components', () => {
  it('maps each backward-compatible score field to its corresponding breakdown component score exactly', () => {
    // Validates: Requirements 8.1
    fc.assert(
      fc.property(caseArb, ({ business, resultSet, category, country }) => {
        const benchmark = benchmarkService.build({
          scoredPlaceId: business.place_id,
          resultSet,
        });

        const scored = scoreBusinessOpportunity(business, benchmark, category, country);

        // Req 8.1: the legacy fields are semantic aliases of the breakdown.
        expect(scored.websiteScore).toBe(scored.breakdown.websiteOpportunity.score);
        expect(scored.reviewsScore).toBe(scored.breakdown.reviewGap.score);
        expect(scored.seoScore).toBe(scored.breakdown.gbpWeakness.score);
        expect(scored.gbpScore).toBe(scored.breakdown.revenueLeakage.score);
        expect(scored.socialScore).toBe(scored.breakdown.growthIntent.score);
      }),
      { numRuns: 200 },
    );
  });
});
