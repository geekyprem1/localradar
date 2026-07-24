// Feature: real-data-intelligence-engine, Property 11: Stored deal value is the midpoint below the maximum
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateDealValue } from './dealValue';
import { BusinessSignals } from '@/types/scoring';

// ---------------------------------------------------------------------------
// Independent reference for the rounding rule (Req 7.2).
//
// The Deal_Value_Engine stores `representative = round((min + max) / 2, 2)`.
// This reimplements the two-decimal rounding here rather than importing the
// production `round2` so the property is a genuine cross-check of the stored
// midpoint. Uses the same EPSILON-nudge that avoids binary float drift.
// ---------------------------------------------------------------------------
function refRound2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Smart generators — constrain to the real calculateDealValue input space.
// ---------------------------------------------------------------------------
const signalsArb: fc.Arbitrary<BusinessSignals> = fc.record({
  hasWebsite: fc.boolean(),
  isInstagramOnly: fc.boolean(),
  isFacebookOnly: fc.boolean(),
  isOldWebsite: fc.boolean(),
  reviewCount: fc.nat({ max: 5000 }),
  rating: fc.double({ min: 0, max: 5, noNaN: true }),
  competitorAvgReviews: fc.nat({ max: 5000 }),
  hasPhone: fc.boolean(),
  hasAddress: fc.boolean(),
  lowRating: fc.boolean(),
  fewReviews: fc.boolean(),
  noBookingSystem: fc.boolean(),
  noLeadForm: fc.boolean(),
  noWhatsApp: fc.boolean(),
  noAppointment: fc.boolean(),
  hasRecentReviews: fc.boolean(),
  hasRecentActivity: fc.boolean(),
});

const opportunityScoreArb = fc.integer({ min: 0, max: 100 });

const categoryArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom(
    'Dentist',
    'Emergency Plumber',
    'Personal Injury Lawyer',
    'CrossFit Gym',
    'Yoga Studio',
    'Coffee Shop',
    'Restaurant',
    '',
  ),
);

const addressArb = fc.oneof(
  fc.constant(''),
  fc.constantFrom(
    'Austin, TX',
    'New York, NY',
    'London, UK',
    'Mumbai, India',
    'Small Town, NV',
    '123 Main St',
  ),
);

const businessNameArb = fc.oneof(
  fc.constant(''),
  fc.constantFrom(
    'Dr. Smith',
    'Downtown Dental Group',
    'National Enterprise Center',
    'Acme Associates',
    'Joe Solo',
  ),
);

const countryArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom('US', 'India', 'Canada', 'UK', 'Australia', 'us', 'unknown-place'),
);

describe('calculateDealValue — Property 11: midpoint stored value', () => {
  it('stores representative as the two-decimal midpoint, at least min and below max', () => {
    fc.assert(
      fc.property(
        signalsArb,
        opportunityScoreArb,
        categoryArb,
        addressArb,
        businessNameArb,
        countryArb,
        (signals, opportunityScore, category, address, businessName, country) => {
          const result = calculateDealValue(
            signals,
            opportunityScore,
            category,
            address,
            businessName,
            country,
          );

          // Property 11 constrains valid, estimated ranges only. When the engine
          // cannot produce a valid range it returns an `unavailable` result with
          // null figures, which this property does not govern.
          if (result.provenance !== 'estimated') return;

          const { min, max, representative } = result;
          expect(min).not.toBeNull();
          expect(max).not.toBeNull();
          expect(representative).not.toBeNull();

          const lo = min as number;
          const hi = max as number;
          const rep = representative as number;

          // representative === round((min + max) / 2, 2) (Req 7.2)
          expect(rep).toBe(refRound2((lo + hi) / 2));

          // The stored midpoint never exceeds the maximum.
          expect(rep).toBeLessThanOrEqual(hi);

          // The stored midpoint is never below the minimum.
          expect(rep).toBeGreaterThanOrEqual(lo);

          // Whenever the range is non-degenerate the midpoint sits strictly
          // below the maximum (Req 7.2 — "below the maximum").
          if (lo < hi) {
            expect(rep).toBeLessThan(hi);
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});
