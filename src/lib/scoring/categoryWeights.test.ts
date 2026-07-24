// Feature: real-data-intelligence-engine, Property 7: Category weights sum to one
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { BusinessSignals } from '@/types/scoring';

// The CATEGORY_WEIGHTS table is internal (not exported). Requirement 5.5 states
// that each category's five component weights must sum to 1.00 (±0.001). The
// implementation enforces this with a module-load assertion that THROWS if any
// category's weights fail to sum to 1.00. Therefore, if the module imports
// successfully, the invariant already holds at load time. We additionally verify
// it behaviorally: calculateOpportunityScore must never throw and must always
// return an integer score in [0, 100] for arbitrary categories and signals —
// which is only coherent when the weighted sum uses weights summing to one.

// Category strings that exercise every branch of getNormalizedCategory plus
// unknown/empty inputs that fall through to the 'default' weight set.
const categoryArb = fc.oneof(
  fc.constantFrom(
    'dentist',
    'plumber',
    'lawyer',
    'gym',
    'Dentist Office',
    'Emergency Plumber',
    'Personal Injury Attorney',
    'CrossFit Yoga Studio',
    'legal services',
    '',
    'unknown-category',
    'restaurant',
  ),
  fc.string(),
);

const signalsArb: fc.Arbitrary<BusinessSignals> = fc.record({
  hasWebsite: fc.boolean(),
  isInstagramOnly: fc.boolean(),
  isFacebookOnly: fc.boolean(),
  isOldWebsite: fc.boolean(),
  reviewCount: fc.integer({ min: 0, max: 100_000 }),
  rating: fc.float({ min: 0, max: 5, noNaN: true }),
  competitorAvgReviews: fc.integer({ min: 0, max: 100_000 }),
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

describe('Property 7: Category weights sum to one', () => {
  it('imports the scoring module without throwing (module-load weight assertion holds)', async () => {
    // A throw here would mean some category weights do not sum to 1.00 (±0.001).
    await expect(import('./opportunityScore')).resolves.toBeDefined();
  });

  it('never throws and returns an integer score in [0, 100] for any category and signals', async () => {
    const { calculateOpportunityScore } = await import('./opportunityScore');

    fc.assert(
      fc.property(categoryArb, signalsArb, (category, signals) => {
        const result = calculateOpportunityScore(signals, category);
        expect(Number.isInteger(result.score)).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 300 },
    );
  });

  it('keeps maxed-out signals within [0, 100] per category (consistent with weights summing to one)', async () => {
    const { calculateOpportunityScore } = await import('./opportunityScore');

    // Every component driven to its worst case; with weights summing to 1.00 the
    // weighted sum of five 100%-gap components can never exceed 100.
    const maxedSignals: BusinessSignals = {
      hasWebsite: false,
      isInstagramOnly: false,
      isFacebookOnly: false,
      isOldWebsite: true,
      reviewCount: 0,
      rating: 0,
      competitorAvgReviews: 100_000,
      hasPhone: false,
      hasAddress: false,
      lowRating: true,
      fewReviews: true,
      noBookingSystem: true,
      noLeadForm: true,
      noWhatsApp: true,
      noAppointment: true,
      hasRecentReviews: false,
      hasRecentActivity: false,
    };

    fc.assert(
      fc.property(categoryArb, (category) => {
        const result = calculateOpportunityScore(maxedSignals, category);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 },
    );
  });
});
