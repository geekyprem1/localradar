// Feature: real-data-intelligence-engine, Property 9: Closing probability falls in exactly one non-overlapping tier
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateClosingProbability } from './closingProbability';
import { BusinessSignals } from '@/types/scoring';

// ---------------------------------------------------------------------------
// Smart generator for BusinessSignals.
// Numeric fields are constrained to realistic ranges. The tier selection only
// depends on hasPhone and hasRecentActivity (plus opportunityScore), but the
// other boolean/numeric signals feed the pre-clamp variance modifiers, so we
// randomize all of them to exercise the full surface.
// ---------------------------------------------------------------------------
const businessSignalsArb: fc.Arbitrary<BusinessSignals> = fc.record({
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

// opportunityScore is documented as an integer in [0, 100]; cover the whole range.
const opportunityScoreArb: fc.Arbitrary<number> = fc.integer({ min: 0, max: 100 });

const businessIdArb: fc.Arbitrary<string | undefined> = fc.oneof(
  fc.constant(undefined),
  fc.string(),
  fc.string({ minLength: 1, maxLength: 40 }),
);

type TierName = 'Excellent' | 'Good' | 'Average' | 'Weak';

interface Tier {
  name: TierName;
  lower: number;
  upper: number;
}

// Canonical, non-overlapping inclusive tier bounds (Req 6.3).
const TIERS: Record<TierName, Tier> = {
  Excellent: { name: 'Excellent', lower: 75, upper: 85 },
  Good: { name: 'Good', lower: 55, upper: 74 },
  Average: { name: 'Average', lower: 35, upper: 54 },
  Weak: { name: 'Weak', lower: 10, upper: 34 },
};

// Independent re-derivation of the tier-selection rules (Req 6.1). This mirrors
// the documented selection logic without reusing the implementation's clamping.
function expectedTier(opportunityScore: number, signals: BusinessSignals): Tier {
  const { hasPhone, hasRecentActivity } = signals;
  if (opportunityScore >= 60 && hasPhone && hasRecentActivity) return TIERS.Excellent;
  if (opportunityScore >= 60 || (opportunityScore >= 35 && hasPhone)) return TIERS.Good;
  if (opportunityScore >= 35) return TIERS.Average;
  return TIERS.Weak;
}

describe('calculateClosingProbability — Property 9: non-overlapping tiers', () => {
  // Validates: Requirements 6.1, 6.2, 6.3, 6.5
  it('produces an integer within exactly the selected tier and within [0, 100]', () => {
    fc.assert(
      fc.property(opportunityScoreArb, businessSignalsArb, businessIdArb, (score, signals, businessId) => {
        const tier = expectedTier(score, signals);
        const prob = calculateClosingProbability(score, signals, businessId);

        // Req 6.5: probability is in [0, 100].
        expect(prob).toBeGreaterThanOrEqual(0);
        expect(prob).toBeLessThanOrEqual(100);

        // Output must be an integer.
        expect(Number.isInteger(prob)).toBe(true);

        // Req 6.1 & 6.3: falls within the selected tier's inclusive bounds.
        expect(prob).toBeGreaterThanOrEqual(tier.lower);
        expect(prob).toBeLessThanOrEqual(tier.upper);
      }),
      { numRuns: 300 },
    );
  });

  // Validates: Requirements 6.2
  it('never reports a Weak-tier opportunity (score < 35) at 35 or higher', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 34 }),
        businessSignalsArb,
        businessIdArb,
        (score, signals, businessId) => {
          // score < 35 always selects the Weak tier under the documented rules.
          expect(expectedTier(score, signals).name).toBe('Weak');
          const prob = calculateClosingProbability(score, signals, businessId);
          // Must stay in Weak's inclusive range and never be raised into Average+.
          expect(prob).toBeGreaterThanOrEqual(10);
          expect(prob).toBeLessThan(35);
          expect(prob).toBeLessThanOrEqual(34);
        },
      ),
      { numRuns: 300 },
    );
  });

  // Validates: Requirements 6.3
  it('assigns each produced probability to exactly one tier (bounds are non-overlapping)', () => {
    fc.assert(
      fc.property(opportunityScoreArb, businessSignalsArb, businessIdArb, (score, signals, businessId) => {
        const prob = calculateClosingProbability(score, signals, businessId);

        // Count how many tiers claim this probability. Non-overlapping bounds
        // guarantee exactly one match for any value in [10, 85].
        const matches = Object.values(TIERS).filter(
          (t) => prob >= t.lower && prob <= t.upper,
        );
        expect(matches).toHaveLength(1);

        // And the tier that claims it must be the one selected by the rules.
        expect(matches[0].name).toBe(expectedTier(score, signals).name);
      }),
      { numRuns: 300 },
    );
  });
});
