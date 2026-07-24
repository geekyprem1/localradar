// Feature: real-data-intelligence-engine, Property 3: Competitor benchmark is computed, never hardcoded, and self-excluding
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ResultSetCompetitorBenchmarkService,
  competitorBenchmarkService,
  PlaceLite,
} from './competitorBenchmark';

const service = new ResultSetCompetitorBenchmarkService();

// ---------------------------------------------------------------------------
// Independent reference model (reimplements the expected computation).
// This is deliberately written from the acceptance criteria (Req 2.3–2.6),
// NOT by reusing the implementation, so the property is a true cross-check.
// ---------------------------------------------------------------------------
function referenceRoundRatingToTenth(value: number): number {
  const clamped = Math.min(5, Math.max(0, value));
  return Math.round(clamped * 10) / 10;
}

function referenceBenchmark(scoredPlaceId: string, resultSet: PlaceLite[]) {
  const competitors = resultSet.filter((p) => p.placeId !== scoredPlaceId);
  const sampleSize = competitors.length;

  if (sampleSize === 0) {
    return {
      competitorAvgReviews: null as number | null,
      competitorAvgRating: null as number | null,
      sampleSize: 0,
      provenance: 'estimated' as const,
    };
  }

  const totalReviews = competitors.reduce((s, c) => s + c.reviewsCount, 0);
  const totalRating = competitors.reduce((s, c) => s + c.rating, 0);

  return {
    competitorAvgReviews: Math.round(totalReviews / sampleSize),
    competitorAvgRating: referenceRoundRatingToTenth(totalRating / sampleSize),
    sampleSize,
    provenance: (sampleSize >= 3 ? 'real' : 'estimated') as 'real' | 'estimated',
  };
}

// ---------------------------------------------------------------------------
// Smart generators
// ---------------------------------------------------------------------------

// A small pool of place ids so the scored id frequently collides with records
// in the result set — this exercises the self-exclusion path (Req 2.4).
const placeIdArb = fc.constantFrom('p0', 'p1', 'p2', 'p3', 'p4', 'p5');

const placeLiteArb: fc.Arbitrary<PlaceLite> = fc.record({
  placeId: placeIdArb,
  // ratings on the real 0–5 scale, including fractional values
  rating: fc.double({ min: 0, max: 5, noNaN: true }),
  reviewsCount: fc.nat({ max: 5000 }),
  website: fc.oneof(
    fc.constant(''),
    fc.constant('   '),
    fc.webUrl(),
    fc.string(),
  ),
});

// A scored id that may or may not appear in the result set.
const scoredPlaceIdArb = fc.oneof(placeIdArb, fc.constant('not-in-set'));

const caseArb = fc.record({
  scoredPlaceId: scoredPlaceIdArb,
  resultSet: fc.array(placeLiteArb, { maxLength: 12 }),
});

describe('ResultSetCompetitorBenchmarkService — Property 3', () => {
  it('computes a self-excluding benchmark matching an independent reference model (never hardcoded)', () => {
    fc.assert(
      fc.property(caseArb, ({ scoredPlaceId, resultSet }) => {
        const result = service.build({ scoredPlaceId, resultSet });
        const expected = referenceBenchmark(scoredPlaceId, resultSet);

        // Req 2.4: the scored business is excluded by place id — sample size is
        // the count of records whose placeId differs from the scored id.
        const nonMatching = resultSet.filter((p) => p.placeId !== scoredPlaceId).length;
        expect(result.sampleSize).toBe(nonMatching);
        expect(result.sampleSize).toBe(expected.sampleSize);

        if (expected.sampleSize === 0) {
          // Req 2.6: zero competitors → null averages, sampleSize 0, 'estimated'.
          expect(result.competitorAvgReviews).toBeNull();
          expect(result.competitorAvgRating).toBeNull();
          expect(result.sampleSize).toBe(0);
          expect(result.provenance).toBe('estimated');
          return;
        }

        // Req 2.3: avg reviews rounded to whole; avg rating rounded to 0.1 on 0–5.
        expect(result.competitorAvgReviews).toBe(expected.competitorAvgReviews);
        expect(result.competitorAvgRating).toBe(expected.competitorAvgRating);
        expect(Number.isInteger(result.competitorAvgReviews as number)).toBe(true);

        // Rating stays within the 0–5 scale and is a tenth.
        const rating = result.competitorAvgRating as number;
        expect(rating).toBeGreaterThanOrEqual(0);
        expect(rating).toBeLessThanOrEqual(5);
        expect(Math.round(rating * 10)).toBeCloseTo(rating * 10, 9);

        // Req 2.3 / 2.5: provenance is 'real' when sample >= 3, else 'estimated'.
        if (expected.sampleSize >= 3) {
          expect(result.provenance).toBe('real');
        } else {
          expect(result.provenance).toBe('estimated');
        }
        expect(result.provenance).toBe(expected.provenance);
      }),
      { numRuns: 200 },
    );
  });

  it('never counts a record whose placeId equals the scored id (self-exclusion)', () => {
    fc.assert(
      fc.property(caseArb, ({ scoredPlaceId, resultSet }) => {
        // Build a result set guaranteed to contain the scored id, then confirm
        // adding more copies of the scored business does not change the benchmark.
        const withSelf: PlaceLite[] = [
          { placeId: scoredPlaceId, rating: 5, reviewsCount: 99999, website: 'https://self.example' },
          ...resultSet,
        ];
        const withMoreSelf: PlaceLite[] = [
          ...withSelf,
          { placeId: scoredPlaceId, rating: 0, reviewsCount: 0, website: '' },
        ];

        const a = service.build({ scoredPlaceId, resultSet: withSelf });
        const b = service.build({ scoredPlaceId, resultSet: withMoreSelf });

        // The scored business's own extreme values must not leak into the average.
        expect(a).toEqual(b);
      }),
      { numRuns: 200 },
    );
  });

  it('exposes a shared default instance behaving identically', () => {
    fc.assert(
      fc.property(caseArb, ({ scoredPlaceId, resultSet }) => {
        expect(competitorBenchmarkService.build({ scoredPlaceId, resultSet })).toEqual(
          service.build({ scoredPlaceId, resultSet }),
        );
      }),
      { numRuns: 100 },
    );
  });
});
