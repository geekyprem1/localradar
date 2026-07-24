// Feature: real-data-intelligence-engine, Property 10: Deal value produces a valid, estimated range
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateDealValue } from './dealValue';
import { BusinessSignals } from '@/types/scoring';

// ---------------------------------------------------------------------------
// Inclusive bounds a valid deal value amount must satisfy (Req 7.1).
// ---------------------------------------------------------------------------
const MIN_DEAL_VALUE = 0.01;
const MAX_DEAL_VALUE = 999_999_999.99;

// ---------------------------------------------------------------------------
// Smart generators — constrain to the real calculateDealValue input space.
// Signals mirror the BusinessSignals shape; reviewCount/competitorAvgReviews
// span the size-detection thresholds and the competition-gap multipliers so
// the generator exercises every pricing branch and multiplier combination.
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

// Addresses include tier-1 metros (which trigger the location multiplier) and
// arbitrary strings so both multiplier and non-multiplier paths are covered.
const addressArb = fc.oneof(
  fc.constant(undefined),
  fc.string(),
  fc.constantFrom(
    'Downtown Austin, TX',
    'New York, NY',
    'London, UK',
    'Mumbai, India',
    'Nowhere Township',
  ),
);

const businessNameArb = fc.oneof(
  fc.constant(undefined),
  fc.string(),
  fc.constantFrom(
    'Dr. Smith Solo Practice',
    'National Dental Center',
    'Downtown Chain Group',
    'Acme Associates',
    'Enterprise Plumbing',
  ),
);

const countryArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom('United States', 'India', 'Canada', 'United Kingdom', 'Australia', 'Narnia', ''),
);

describe('calculateDealValue — Property 10: deal value produces a valid, estimated range', () => {
  // Validates: Requirements 7.1, 7.3, 7.4
  it('produces a valid estimated range OR an unavailable result, never both', () => {
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

          const isEstimated = result.provenance === 'estimated';
          const isUnavailable = result.provenance === 'unavailable';

          // Exactly one of the two states holds.
          expect(isEstimated !== isUnavailable).toBe(true);

          if (isEstimated) {
            // Req 7.3: both min and max are exposed for a range.
            expect(result.min).not.toBeNull();
            expect(result.max).not.toBeNull();
            expect(typeof result.min).toBe('number');
            expect(typeof result.max).toBe('number');

            const min = result.min as number;
            const max = result.max as number;

            // Req 7.1: each endpoint within [0.01, 999,999,999.99], min <= max.
            expect(Number.isFinite(min)).toBe(true);
            expect(Number.isFinite(max)).toBe(true);
            expect(min).toBeGreaterThanOrEqual(MIN_DEAL_VALUE);
            expect(max).toBeGreaterThanOrEqual(MIN_DEAL_VALUE);
            expect(min).toBeLessThanOrEqual(MAX_DEAL_VALUE);
            expect(max).toBeLessThanOrEqual(MAX_DEAL_VALUE);
            expect(min).toBeLessThanOrEqual(max);

            // Req 7.4: provenance is 'estimated' for a produced deal value.
            expect(result.provenance).toBe('estimated');
          } else {
            // Req 7.5: unavailable results expose null figures and empty label.
            expect(result.min).toBeNull();
            expect(result.max).toBeNull();
            expect(result.representative).toBeNull();
            expect(result.formatted).toBe('');
          }
        },
      ),
      { numRuns: 300 },
    );
  });
});
