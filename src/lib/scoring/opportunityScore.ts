import { BusinessSignals, OpportunityBreakdown, ScoreComponent } from '@/types/scoring';

/**
 * Opportunity Score™ — Deterministic & Category-Aware (0–100)
 * 
 * Enforces category-specific weights:
 * - Dentist: Review Gap (40%), Website (20%), Google Profile (20%), Activity (20%)
 * - Plumber: Website (35%), Lead Capture (35%), Review Gap (20%), Activity (10%)
 * - Lawyer: Website (40%), Review Gap (30%), Google Presence (20%), Activity (10%)
 * - Gym: Website (30%), Review (30%), Booking (25%), Activity (15%)
 * - Default: Website (25%), Review (25%), Google Presence (20%), Booking (15%), Activity (15%)
 */

type NormalizedCategory = 'dentist' | 'plumber' | 'lawyer' | 'gym' | 'default';

/** Weights for the five opportunity components. Each set MUST sum to 1.00 (±0.001). */
interface CategoryWeights {
  wWeb: number;
  wRev: number;
  wGBP: number;
  wBook: number;
  wAct: number;
}

const CATEGORY_WEIGHTS: Record<NormalizedCategory, CategoryWeights> = {
  default: { wWeb: 0.25, wRev: 0.25, wGBP: 0.20, wBook: 0.15, wAct: 0.15 },
  dentist: { wWeb: 0.20, wRev: 0.40, wGBP: 0.20, wBook: 0.00, wAct: 0.20 },
  plumber: { wWeb: 0.35, wRev: 0.20, wGBP: 0.00, wBook: 0.35, wAct: 0.10 },
  lawyer: { wWeb: 0.40, wRev: 0.30, wGBP: 0.20, wBook: 0.00, wAct: 0.10 },
  gym: { wWeb: 0.30, wRev: 0.30, wGBP: 0.00, wBook: 0.25, wAct: 0.15 },
};

// Req 5.5: assert every category's five weights sum to 1.00 within ±0.001.
// Validated once at module load so future edits to the table cannot silently break the invariant.
for (const [cat, w] of Object.entries(CATEGORY_WEIGHTS)) {
  const sum = w.wWeb + w.wRev + w.wGBP + w.wBook + w.wAct;
  if (Math.abs(sum - 1.0) > 0.001) {
    throw new Error(
      `Opportunity score weights for category "${cat}" must sum to 1.00 (±0.001), got ${sum}`
    );
  }
}

function getNormalizedCategory(cat?: string): NormalizedCategory {
  if (!cat) return 'default';
  const c = cat.toLowerCase();
  if (c.includes('dent')) return 'dentist';
  if (c.includes('plumb')) return 'plumber';
  if (c.includes('law') || c.includes('legal') || c.includes('attorney')) return 'lawyer';
  if (c.includes('gym') || c.includes('fit') || c.includes('crossfit') || c.includes('yoga')) return 'gym';
  return 'default';
}

function calcWebsiteOppPercent(signals: BusinessSignals): { score: number; reasons: string[] } {
  if (!signals.hasWebsite && !signals.isInstagramOnly && !signals.isFacebookOnly) {
    return { score: 100, reasons: ['No website detected — full web design opportunity (100% gap)'] };
  }
  if (signals.isInstagramOnly) {
    return { score: 75, reasons: ['No website — Instagram-only presence (75% gap)'] };
  }
  if (signals.isFacebookOnly) {
    return { score: 65, reasons: ['No website — Facebook-only presence (65% gap)'] };
  }
  if (signals.isOldWebsite) {
    return { score: 50, reasons: ['Outdated website detected — redesign opportunity (50% gap)'] };
  }
  return { score: 0, reasons: [] };
}

function calcReviewGapPercent(signals: BusinessSignals): { score: number; reasons: string[] } {
  const gap = signals.competitorAvgReviews - signals.reviewCount;
  if (gap > 200) {
    return { score: 100, reasons: [`Reviews ${gap} below competitor average — critical gap`] };
  }
  if (gap > 100) {
    return { score: 85, reasons: [`Reviews ${gap} below competitor average — major gap`] };
  }
  if (gap > 50) {
    return { score: 70, reasons: [`Reviews ${gap} below competitor average — significant gap`] };
  }
  if (gap > 10) {
    return { score: 50, reasons: [`Reviews ${gap} below competitor average — moderate gap`] };
  }
  if (signals.lowRating) {
    return { score: 40, reasons: [`Below-average rating (${signals.rating} ⭐) below competitor average`] };
  }
  return { score: 0, reasons: [] };
}

function calcGooglePresencePercent(signals: BusinessSignals): { score: number; reasons: string[] } {
  let gap = 0;
  const reasons: string[] = [];
  if (!signals.hasPhone) {
    gap += 30;
    reasons.push('Incomplete Google listing: phone number is missing');
  }
  if (!signals.hasAddress) {
    gap += 20;
    reasons.push('Incomplete Google listing: address is missing');
  }
  if (signals.rating < 4.0) {
    gap += 25;
    reasons.push(`Low public rating (${signals.rating} ⭐) harming local visibility`);
  }
  if (signals.fewReviews) {
    gap += 25;
    reasons.push(`Fewer than 10 customer reviews on profile`);
  }
  return { score: Math.min(100, gap), reasons };
}

function calcBookingPercent(signals: BusinessSignals): { score: number; reasons: string[] } {
  let gap = 0;
  const reasons: string[] = [];
  if (signals.noBookingSystem) {
    gap += 40;
    reasons.push('No direct booking engine detected (40% leakage)');
  }
  if (signals.noLeadForm) {
    gap += 30;
    reasons.push('No conversion lead form detected on domain (30% leakage)');
  }
  if (signals.noWhatsApp) {
    gap += 20;
    reasons.push('Missing instant WhatsApp/chat integration (20% leakage)');
  }
  if (signals.noAppointment) {
    gap += 10;
    reasons.push('No automated scheduling option available (10% leakage)');
  }
  return { score: Math.min(100, gap), reasons };
}

function calcActivityGapPercent(signals: BusinessSignals): { score: number; reasons: string[] } {
  let gap = 100;
  const reasons: string[] = [];
  if (signals.hasRecentReviews) {
    gap -= 50;
  } else {
    reasons.push('Lacks recent customer review velocity (inactive)');
  }
  if (signals.hasRecentActivity) {
    gap -= 50;
  } else {
    reasons.push('Profile shows zero recent updates or listing activity');
  }
  return { score: Math.max(0, gap), reasons };
}

export function calculateOpportunityScore(
  signals: BusinessSignals,
  category?: string
): {
  score: number;
  level: 'High' | 'Medium' | 'Low';
  breakdown: OpportunityBreakdown;
  reasons: string[];
} {
  const cat = getNormalizedCategory(category);

  // Category-specific weights (asserted to sum to 1.00 ±0.001 at module load).
  const { wWeb, wRev, wGBP, wBook, wAct } = CATEGORY_WEIGHTS[cat];

  const webOpp = calcWebsiteOppPercent(signals);
  const revOpp = calcReviewGapPercent(signals);
  const gbpOpp = calcGooglePresencePercent(signals);
  const bookOpp = calcBookingPercent(signals);
  const actOpp = calcActivityGapPercent(signals);

  // Pre-clamp score = weighted sum of exactly five components, each contributing once.
  // Booking signals (noBookingSystem/noLeadForm/noWhatsApp/noAppointment) count solely via
  // the weighted booking component (bookOpp) — no additive flat bonus is applied (Req 5.1–5.3).
  let rawScore =
    (webOpp.score * wWeb) +
    (revOpp.score * wRev) +
    (gbpOpp.score * wGBP) +
    (bookOpp.score * wBook) +
    (actOpp.score * wAct);

  // Category-independent floors applied to the weighted sum (not additive stacking).
  // They correct the "no real website" under-scoring bias by enforcing a minimum opportunity:
  //   - no website at all           ⇒ max(55, weighted sum)
  //   - Instagram-/Facebook-only    ⇒ max(45, weighted sum)
  if (!signals.hasWebsite) {
    rawScore = Math.max(55, rawScore);
  } else if (signals.isInstagramOnly || signals.isFacebookOnly) {
    rawScore = Math.max(45, rawScore);
  }

  // Final score is an integer clamped to the inclusive range [0, 100] (Req 5.4).
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let level: 'High' | 'Medium' | 'Low' = 'Low';
  if (score >= 60) level = 'High';
  else if (score >= 35) level = 'Medium';

  // Construct backward-compatible components for UI rendering
  const websiteOpportunity: ScoreComponent = {
    name: 'Website Opportunity',
    score: Math.round((webOpp.score / 100) * Math.max(10, wWeb * 100)),
    maxScore: Math.round(wWeb * 100),
    reasons: webOpp.reasons
  };

  const reviewGap: ScoreComponent = {
    name: 'Review Gap Deficit',
    score: Math.round((revOpp.score / 100) * Math.max(10, wRev * 100)),
    maxScore: Math.round(wRev * 100),
    reasons: revOpp.reasons
  };

  const gbpWeakness: ScoreComponent = {
    name: 'Google Business Weakness',
    score: Math.round((gbpOpp.score / 100) * Math.max(10, wGBP * 100)),
    maxScore: Math.round(wGBP * 100),
    reasons: gbpOpp.reasons
  };

  const revenueLeakage: ScoreComponent = {
    name: 'Revenue Leakage Points',
    score: Math.round((bookOpp.score / 100) * Math.max(10, wBook * 100)),
    maxScore: Math.round(wBook * 100),
    reasons: bookOpp.reasons
  };

  const growthIntent: ScoreComponent = {
    name: 'Growth Intent Indicator',
    score: Math.round((actOpp.score / 100) * Math.max(10, wAct * 100)),
    maxScore: Math.round(wAct * 100),
    reasons: actOpp.reasons
  };

  const breakdown: OpportunityBreakdown = {
    websiteOpportunity,
    reviewGap,
    gbpWeakness,
    revenueLeakage,
    growthIntent,
  };

  const reasons = [
    ...webOpp.reasons,
    ...revOpp.reasons,
    ...gbpOpp.reasons,
    ...bookOpp.reasons,
    ...actOpp.reasons,
  ];

  return { score, level, breakdown, reasons };
}
