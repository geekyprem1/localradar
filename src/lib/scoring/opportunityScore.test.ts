// Feature: real-data-intelligence-engine, Property 6: Opportunity score is the clamped weighted sum with no flat booking bonus
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateOpportunityScore } from './opportunityScore';
import { BusinessSignals } from '@/types/scoring';

// ---------------------------------------------------------------------------
// Independent reference model.
//
// This reimplements the expected opportunity-score computation directly from
// the acceptance criteria and the documented component logic (Req 5.1–5.4),
// deliberately re-derived here rather than importing the production internals
// so the property is a genuine cross-check:
//   - pre-clamp score = weighted sum of EXACTLY five components (5.3)
//   - booking signals contribute ONLY via the weighted booking component,
//     with no additive flat bonus (5.1, 5.2)
//   - documented floors (no website / social-only) applied to the weighted sum
//   - final score = round(...) clamped to the inclusive range [0, 100] (5.4)
// ---------------------------------------------------------------------------

type NormalizedCategory = 'dentist' | 'plumber' | 'lawyer' | 'gym' | 'default';

interface CategoryWeights {
  wWeb: number;
  wRev: number;
  wGBP: number;
  wBook: number;
  wAct: number;
}

const REF_CATEGORY_WEIGHTS: Record<NormalizedCategory, CategoryWeights> = {
  default: { wWeb: 0.25, wRev: 0.25, wGBP: 0.2, wBook: 0.15, wAct: 0.15 },
  dentist: { wWeb: 0.2, wRev: 0.4, wGBP: 0.2, wBook: 0.0, wAct: 0.2 },
  plumber: { wWeb: 0.35, wRev: 0.2, wGBP: 0.0, wBook: 0.35, wAct: 0.1 },
  lawyer: { wWeb: 0.4, wRev: 0.3, wGBP: 0.2, wBook: 0.0, wAct: 0.1 },
  gym: { wWeb: 0.3, wRev: 0.3, wGBP: 0.0, wBook: 0.25, wAct: 0.15 },
};

function refNormalizeCategory(cat?: string): NormalizedCategory {
  if (!cat) return 'default';
  const c = cat.toLowerCase();
  if (c.includes('dent')) return 'dentist';
  if (c.includes('plumb')) return 'plumber';
  if (c.includes('law') || c.includes('legal') || c.includes('attorney')) return 'lawyer';
  if (c.includes('gym') || c.includes('fit') || c.includes('crossfit') || c.includes('yoga')) return 'gym';
  return 'default';
}

function refWebsitePercent(s: BusinessSignals): number {
  if (!s.hasWebsite && !s.isInstagramOnly && !s.isFacebookOnly) return 100;
  if (s.isInstagramOnly) return 75;
  if (s.isFacebookOnly) return 65;
  if (s.isOldWebsite) return 50;
  return 0;
}

function refReviewGapPercent(s: BusinessSignals): number {
  const gap = s.competitorAvgReviews - s.reviewCount;
  if (gap > 200) return 100;
  if (gap > 100) return 85;
  if (gap > 50) return 70;
  if (gap > 10) return 50;
  if (s.lowRating) return 40;
  return 0;
}

function refGooglePresencePercent(s: BusinessSignals): number {
  let gap = 0;
  if (!s.hasPhone) gap += 30;
  if (!s.hasAddress) gap += 20;
  if (s.rating < 4.0) gap += 25;
  if (s.fewReviews) gap += 25;
  return Math.min(100, gap);
}

function refBookingPercent(s: BusinessSignals): number {
  let gap = 0;
  if (s.noBookingSystem) gap += 40;
  if (s.noLeadForm) gap += 30;
  if (s.noWhatsApp) gap += 20;
  if (s.noAppointment) gap += 10;
  return Math.min(100, gap);
}

function refActivityPercent(s: BusinessSignals): number {
  let gap = 100;
  if (s.hasRecentReviews) gap -= 50;
  if (s.hasRecentActivity) gap -= 50;
  return Math.max(0, gap);
}

/** Reference opportunity score: clamped weighted sum with NO flat booking bonus. */
function referenceScore(s: BusinessSignals, category?: string): number {
  const { wWeb, wRev, wGBP, wBook, wAct } = REF_CATEGORY_WEIGHTS[refNormalizeCategory(category)];

  let raw =
    refWebsitePercent(s) * wWeb +
    refReviewGapPercent(s) * wRev +
    refGooglePresencePercent(s) * wGBP +
    refBookingPercent(s) * wBook +
    refActivityPercent(s) * wAct;

  if (!s.hasWebsite) {
    raw = Math.max(55, raw);
  } else if (s.isInstagramOnly || s.isFacebookOnly) {
    raw = Math.max(45, raw);
  }

  return Math.min(100, Math.max(0, Math.round(raw)));
}

// ---------------------------------------------------------------------------
// Smart generators — constrain to the real BusinessSignals input space.
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

// Booking flags only, used to build two signal sets differing solely in booking.
const bookingFlagsArb = fc.record({
  noBookingSystem: fc.boolean(),
  noLeadForm: fc.boolean(),
  noWhatsApp: fc.boolean(),
  noAppointment: fc.boolean(),
});

const REF_WEIGHTS_BY_CAT = REF_CATEGORY_WEIGHTS;

describe('calculateOpportunityScore — Property 6', () => {
  it('equals the reference clamped weighted sum for any signals and category', () => {
    fc.assert(
      fc.property(signalsArb, categoryArb, (signals, category) => {
        const { score } = calculateOpportunityScore(signals, category);
        const expected = referenceScore(signals, category);

        // (a) matches the reference model after floors + rounding + clamp (5.1–5.4)
        expect(score).toBe(expected);

        // (c) final score is an integer in the inclusive range [0, 100] (5.4)
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 300 },
    );
  });

  it('has NO flat booking bonus: toggling only booking flags shifts the score by at most the booking component contribution', () => {
    fc.assert(
      fc.property(
        signalsArb,
        bookingFlagsArb,
        bookingFlagsArb,
        categoryArb,
        (base, flagsA, flagsB, category) => {
          const signalsA: BusinessSignals = { ...base, ...flagsA };
          const signalsB: BusinessSignals = { ...base, ...flagsB };

          const scoreA = calculateOpportunityScore(signalsA, category).score;
          const scoreB = calculateOpportunityScore(signalsB, category).score;

          const wBook = REF_WEIGHTS_BY_CAT[refNormalizeCategory(category)].wBook;

          // Weighted booking-component delta between the two flag sets. Since booking
          // signals may only influence the score through this weighted component (5.1, 5.2),
          // the actual score delta can never exceed |weighted booking delta| (plus rounding).
          // A flat +5/+5 bonus would make the observed delta exceed this bound.
          const bookingContribDelta = Math.abs(
            (refBookingPercent(signalsA) - refBookingPercent(signalsB)) * wBook,
          );

          // Allow 1 point of slack for integer rounding at the boundary.
          expect(Math.abs(scoreA - scoreB)).toBeLessThanOrEqual(bookingContribDelta + 1);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('is insensitive to booking flags for categories whose booking weight is zero', () => {
    fc.assert(
      fc.property(signalsArb, bookingFlagsArb, (base, flags) => {
        // Lawyer and dentist have wBook = 0, so booking flags must not move the score at all.
        for (const category of ['Personal Injury Lawyer', 'Dentist']) {
          const withFlags = calculateOpportunityScore({ ...base, ...flags }, category).score;
          const withoutFlags = calculateOpportunityScore(
            {
              ...base,
              noBookingSystem: false,
              noLeadForm: false,
              noWhatsApp: false,
              noAppointment: false,
            },
            category,
          ).score;
          expect(withFlags).toBe(withoutFlags);
        }
      }),
      { numRuns: 200 },
    );
  });
});
