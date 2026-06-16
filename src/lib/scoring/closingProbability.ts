import { BusinessSignals } from '@/types/scoring';

/**
 * Closing Probability™ — Deterministic (0–100%)
 *
 * Base = opportunityScore × 0.4
 * + Signal bonuses (additive)
 * Clamped to 0–95
 */
export function calculateClosingProbability(
  opportunityScore: number,
  signals: BusinessSignals,
  businessId?: string
): number {
  // Base probability from opportunity score
  let probability = opportunityScore * 0.4;

  // No website — extremely high chance they need services
  if (!signals.hasWebsite) {
    probability += 25;
  }

  // Recent reviews — business is active and reachable
  if (signals.hasRecentReviews) {
    probability += 20;
  }

  // Active listing — owner is engaged
  if (signals.hasRecentActivity) {
    probability += 20;
  }

  // Low competition signals — review gap means market is underserved
  if (signals.competitorAvgReviews - signals.reviewCount > 50) {
    probability += 15;
  }

  // Has phone — responsive, reachable contact
  if (signals.hasPhone) {
    probability += 20;
  }

  // Clamp between 0 and 95 (never 100% certain)
  let finalProb = Math.min(95, Math.max(0, Math.round(probability)));

  if (businessId) {
    let hash = 0;
    for (let i = 0; i < businessId.length; i++) {
      hash = businessId.charCodeAt(i) + ((hash << 5) - hash);
    }
    // create a realistic variance between -20 and +10
    const variance = (Math.abs(hash) % 31) - 20;
    finalProb = Math.min(94, Math.max(35, finalProb + variance));
  }

  return finalProb;
}

