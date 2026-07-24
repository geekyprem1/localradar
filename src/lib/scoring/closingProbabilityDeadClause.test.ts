// Feature: real-data-intelligence-engine
// Unit test for the removed dead `|| opportunityScore >= 20` clause.
// Scores in [20, 34] must classify as Weak (probability 10-34), not Average (35-54).
//
// Validates: Requirements 6.4
import { describe, it, expect } from 'vitest';
import { calculateClosingProbability } from './closingProbability';
import { BusinessSignals } from '@/types/scoring';

// Representative signals that force the Weak branch:
// - no phone => cannot qualify for the Good tier's `(score >= 35 && hasPhone)` path
// - no recent activity => cannot qualify for the Excellent tier
// Neutral otherwise so the base Weak probability is not pushed around.
const weakSignals: BusinessSignals = {
  hasWebsite: true,
  isInstagramOnly: false,
  isFacebookOnly: false,
  isOldWebsite: false,
  reviewCount: 3,
  rating: 4.2,
  competitorAvgReviews: 10,
  hasPhone: false,
  hasAddress: true,
  lowRating: false,
  fewReviews: true,
  noBookingSystem: false,
  noLeadForm: false,
  noWhatsApp: false,
  noAppointment: false,
  hasRecentReviews: false,
  hasRecentActivity: false,
};

const WEAK_LOWER = 10;
const WEAK_UPPER = 34;
const AVERAGE_LOWER = 35;

describe('closingProbability — removed dead `>= 20` clause (Weak tier)', () => {
  // Every score in [20, 34] must land in the Weak tier, never Average.
  for (let score = 20; score <= 34; score++) {
    it(`classifies score ${score} as Weak (probability within [10, 34], strictly < 35)`, () => {
      const probability = calculateClosingProbability(score, weakSignals);
      expect(probability).toBeGreaterThanOrEqual(WEAK_LOWER);
      expect(probability).toBeLessThanOrEqual(WEAK_UPPER);
      expect(probability).toBeLessThan(AVERAGE_LOWER);
    });
  }

  it.each([20, 27, 34])(
    'boundary/representative score %i stays in the Weak tier (NOT Average)',
    (score) => {
      const probability = calculateClosingProbability(score, weakSignals);
      expect(probability).toBeGreaterThanOrEqual(WEAK_LOWER);
      expect(probability).toBeLessThanOrEqual(WEAK_UPPER);
      expect(probability).toBeLessThan(AVERAGE_LOWER);
    }
  );

  // Control: score 35 crosses the boundary into the Average tier (>= 35).
  it('control: score 35 crosses into the Average tier (probability >= 35)', () => {
    const probability = calculateClosingProbability(35, weakSignals);
    expect(probability).toBeGreaterThanOrEqual(AVERAGE_LOWER);
    expect(probability).toBeLessThanOrEqual(54);
  });
});
