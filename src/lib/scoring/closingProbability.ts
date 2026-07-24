import { BusinessSignals } from '@/types/scoring';

/**
 * Closing Probability™ — Deterministic (0–100%)
 *
 * Classifies an opportunity into exactly one of four mutually-exclusive tiers
 * with non-overlapping inclusive probability bounds:
 * - Excellent Opportunity: 75–85%
 * - Good Opportunity: 55–74%
 * - Average Opportunity: 35–54%
 * - Weak Opportunity: 10–34%
 *
 * A deterministic ±4 id-based variance is applied BEFORE clamping to the
 * selected tier's bounds, so variance can never push a probability out of its
 * tier. Same inputs always yield the same output.
 */
export function calculateClosingProbability(
  opportunityScore: number,
  signals: BusinessSignals,
  businessId?: string
): number {
  // Select exactly one tier (mutually exclusive) and its inclusive bounds.
  let baseProb: number;
  let lowerBound: number;
  let upperBound: number;

  if (opportunityScore >= 60 && signals.hasPhone && signals.hasRecentActivity) {
    // Excellent Opportunity tier (75-85%)
    baseProb = 78;
    lowerBound = 75;
    upperBound = 85;
  } else if (
    opportunityScore >= 60 ||
    (opportunityScore >= 35 && signals.hasPhone)
  ) {
    // Good Opportunity tier (55-74%)
    baseProb = 65;
    lowerBound = 55;
    upperBound = 74;
  } else if (opportunityScore >= 35) {
    // Average Opportunity tier (35-54%)
    baseProb = 45;
    lowerBound = 35;
    upperBound = 54;
  } else {
    // Weak Opportunity tier (10-34%)
    baseProb = 22;
    lowerBound = 10;
    upperBound = 34;
  }

  // Add small signal modifiers to create variance before applying clamps
  if (!signals.hasWebsite) baseProb += 3;
  if (signals.hasRecentReviews) baseProb += 2;
  if (signals.lowRating) baseProb -= 1;

  // Apply deterministic ID-based offset to avoid flat numbers, BEFORE clamping.
  let variance = 0;
  if (businessId) {
    let hash = 0;
    for (let i = 0; i < businessId.length; i++) {
      hash = businessId.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Yields an offset between -4 and +4
    variance = (Math.abs(hash) % 9) - 4;
  }

  const withVariance = baseProb + variance;

  // Clamp into the selected tier's inclusive bounds so the output always
  // belongs to exactly one tier, then round to an integer in [0, 100].
  const clamped = Math.min(upperBound, Math.max(lowerBound, withVariance));

  return Math.min(100, Math.max(0, Math.round(clamped)));
}

