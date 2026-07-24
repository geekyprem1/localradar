// Feature: real-data-intelligence-engine, Property 8: Opportunity score is deterministic
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateOpportunityScore } from './opportunityScore';
import { BusinessSignals } from '@/types/scoring';

// ---------------------------------------------------------------------------
// Smart generator for BusinessSignals.
// Constrains numeric fields to realistic ranges so the generated inputs exercise
// the full opportunity-scoring surface (website/review/GBP/booking/activity).
// ---------------------------------------------------------------------------
const businessSignalsArb: fc.Arbitrary<BusinessSignals> = fc.record({
  // Website signals
  hasWebsite: fc.boolean(),
  isInstagramOnly: fc.boolean(),
  isFacebookOnly: fc.boolean(),
  isOldWebsite: fc.boolean(),

  // Review signals
  reviewCount: fc.nat({ max: 5000 }),
  rating: fc.double({ min: 0, max: 5, noNaN: true }),
  competitorAvgReviews: fc.nat({ max: 5000 }),

  // GBP signals
  hasPhone: fc.boolean(),
  hasAddress: fc.boolean(),
  lowRating: fc.boolean(),
  fewReviews: fc.boolean(),

  // Revenue leakage signals
  noBookingSystem: fc.boolean(),
  noLeadForm: fc.boolean(),
  noWhatsApp: fc.boolean(),
  noAppointment: fc.boolean(),

  // Growth intent signals
  hasRecentReviews: fc.boolean(),
  hasRecentActivity: fc.boolean(),
});

// Categories chosen to hit every normalized bucket (dentist/plumber/lawyer/gym/default)
// plus undefined and arbitrary strings with varied casing.
const categoryArb: fc.Arbitrary<string | undefined> = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom(
    'Dentist',
    'DENTAL clinic',
    'Plumber',
    'emergency plumbing',
    'Lawyer',
    'legal services',
    'attorney',
    'Gym',
    'CrossFit box',
    'yoga studio',
    'Coffee Shop',
    'Restaurant',
    '',
  ),
  fc.string(),
);

// Deep clone that produces a structurally-identical but independently-constructed object.
function cloneSignals(s: BusinessSignals): BusinessSignals {
  return { ...s };
}

describe('calculateOpportunityScore — Property 8: deterministic', () => {
  // Validates: Requirements 5.6
  it('yields identical results when called twice with identical inputs', () => {
    fc.assert(
      fc.property(businessSignalsArb, categoryArb, (signals, category) => {
        const a = calculateOpportunityScore(signals, category);
        const b = calculateOpportunityScore(signals, category);

        expect(b.score).toBe(a.score);
        expect(b.level).toBe(a.level);
        expect(b.reasons).toEqual(a.reasons);
        expect(b.breakdown).toEqual(a.breakdown);
        // Full structural equality of the entire result.
        expect(b).toEqual(a);
      }),
      { numRuns: 200 },
    );
  });

  // Validates: Requirements 5.6
  it('produces identical results for two independently-constructed structurally-identical inputs', () => {
    fc.assert(
      fc.property(businessSignalsArb, categoryArb, (signals, category) => {
        const first = calculateOpportunityScore(cloneSignals(signals), category);
        // Reconstruct category as a fresh, equal string value (or undefined).
        const category2 = category === undefined ? undefined : `${category}`;
        const second = calculateOpportunityScore(cloneSignals(signals), category2);

        expect(second).toEqual(first);
      }),
      { numRuns: 200 },
    );
  });

  // Validates: Requirements 5.6
  it('is deterministic across categories that normalize to the same bucket', () => {
    fc.assert(
      fc.property(businessSignalsArb, (signals) => {
        // Two different raw strings that normalize to 'dentist' must score identically.
        const a = calculateOpportunityScore(signals, 'Dentist');
        const b = calculateOpportunityScore(signals, 'family DENTAL practice');
        expect(b).toEqual(a);
      }),
      { numRuns: 100 },
    );
  });
});
