import { BusinessSignals } from '@/types/scoring';

/**
 * Closing Probability™ — Deterministic (0–100%)
 * 
 * Maps into 4 strict tiers:
 * - Excellent Opportunity: 75–85%
 * - Good Opportunity: 55–75%
 * - Average Opportunity: 35–55%
 * - Weak Opportunity: 10–35%
 */
export function calculateClosingProbability(
  opportunityScore: number,
  signals: BusinessSignals,
  businessId?: string
): number {
  let baseProb = 40; // baseline
  
  if (opportunityScore >= 60) {
    if (signals.hasPhone && signals.hasRecentActivity) {
      // Excellent Opportunity tier (75-85%)
      baseProb = 78;
    } else {
      // Good Opportunity tier (55-75%)
      baseProb = 65;
    }
  } else if (opportunityScore >= 35) {
    if (signals.hasPhone) {
      // Good Opportunity tier
      baseProb = 58;
    } else {
      // Average Opportunity tier (35-55%)
      baseProb = 43;
    }
  } else {
    // Weak Opportunity tier (10-35%)
    baseProb = 22;
  }

  // Add small signal modifiers to create variance before applying clamps
  if (!signals.hasWebsite) baseProb += 3;
  if (signals.hasRecentReviews) baseProb += 2;
  if (signals.lowRating) baseProb -= 1;

  // Apply deterministic name-based/ID-based offset to avoid flat numbers
  let variance = 0;
  if (businessId) {
    let hash = 0;
    for (let i = 0; i < businessId.length; i++) {
      hash = businessId.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Yields an offset between -4 and +4
    variance = (Math.abs(hash) % 9) - 4;
  }

  let finalProb = baseProb + variance;

  // Enforce strict tier ranges
  if (opportunityScore >= 60 && signals.hasPhone && signals.hasRecentActivity) {
    // Excellent range: 75% to 85%
    finalProb = Math.min(85, Math.max(75, finalProb));
  } else if (opportunityScore >= 60 || (opportunityScore >= 35 && signals.hasPhone)) {
    // Good range: 55% to 75%
    finalProb = Math.min(74, Math.max(55, finalProb));
  } else if (opportunityScore >= 35 || opportunityScore >= 20) {
    // Average range: 35% to 55%
    finalProb = Math.min(54, Math.max(35, finalProb));
  } else {
    // Weak range: 10% to 35%
    finalProb = Math.min(34, Math.max(10, finalProb));
  }

  return finalProb;
}

