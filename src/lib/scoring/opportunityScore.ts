import { BusinessSignals, OpportunityBreakdown, ScoreComponent } from '@/types/scoring';

/**
 * Opportunity Score™ — Deterministic (0–100)
 * 
 * Formula:
 *   Website Opportunity (max 30)
 *   + Review Gap (max 25)
 *   + Google Business Weakness (max 20)
 *   + Revenue Leakage (max 15)
 *   + Growth Intent (max 10)
 */

function calcWebsiteOpportunity(signals: BusinessSignals): ScoreComponent {
  let score = 0;
  const reasons: string[] = [];

  if (!signals.hasWebsite && !signals.isInstagramOnly && !signals.isFacebookOnly) {
    score = 30;
    reasons.push('No website detected — full web design opportunity (+30)');
  } else if (signals.isInstagramOnly) {
    score = 25;
    reasons.push('Instagram-only presence — needs professional website (+25)');
  } else if (signals.isFacebookOnly) {
    score = 20;
    reasons.push('Facebook-only presence — needs dedicated website (+20)');
  } else if (signals.isOldWebsite) {
    score = 15;
    reasons.push('Outdated website detected — redesign opportunity (+15)');
  } else {
    score = 0;
  }

  return { name: 'Website Opportunity', score, maxScore: 30, reasons };
}

function calcReviewGap(signals: BusinessSignals): ScoreComponent {
  let score = 0;
  const reasons: string[] = [];
  const gap = signals.competitorAvgReviews - signals.reviewCount;

  if (gap > 200) {
    score = 25;
    reasons.push(`Reviews ${gap} below competitor average — critical gap (+25)`);
  } else if (gap > 100) {
    score = 20;
    reasons.push(`Reviews ${gap} below competitor average — major gap (+20)`);
  } else if (gap > 50) {
    score = 15;
    reasons.push(`Reviews ${gap} below competitor average — significant gap (+15)`);
  } else if (gap > 20) {
    score = 10;
    reasons.push(`Reviews ${gap} below competitor average — moderate gap (+10)`);
  } else {
    score = 0;
  }

  return { name: 'Review Gap', score, maxScore: 25, reasons };
}

function calcGBPWeakness(signals: BusinessSignals): ScoreComponent {
  let score = 0;
  const reasons: string[] = [];

  // Missing photos — inferred from no website (no source for photos)
  if (!signals.hasWebsite) {
    score += 5;
    reasons.push('No web photos available for GBP (+5)');
  }

  // Missing description — inferred from low review count
  if (signals.fewReviews) {
    score += 5;
    reasons.push('Low review count suggests incomplete GBP setup (+5)');
  }

  // Low reviews
  if (signals.lowRating) {
    score += 5;
    reasons.push(`Low rating (${signals.rating}) hurting visibility (+5)`);
  }

  // Low activity — no phone listed
  if (!signals.hasPhone) {
    score += 5;
    reasons.push('No phone number on profile — low activity signal (+5)');
  }

  return { name: 'Google Business Weakness', score, maxScore: 20, reasons };
}

function calcRevenueLeakage(signals: BusinessSignals): ScoreComponent {
  let score = 0;
  const reasons: string[] = [];

  if (signals.noBookingSystem) {
    score += 5;
    reasons.push('No booking system detected — losing appointments (+5)');
  }

  if (signals.noLeadForm) {
    score += 5;
    reasons.push('No lead capture form — losing potential customers (+5)');
  }

  if (signals.noWhatsApp) {
    score += 3;
    reasons.push('No WhatsApp/chat integration — missing instant inquiries (+3)');
  }

  if (signals.noAppointment) {
    score += 2;
    reasons.push('No appointment scheduling system (+2)');
  }

  return { name: 'Revenue Leakage', score, maxScore: 15, reasons };
}

function calcGrowthIntent(signals: BusinessSignals): ScoreComponent {
  let score = 0;
  const reasons: string[] = [];

  if (signals.hasRecentReviews) {
    score += 5;
    reasons.push('Recent review activity — business is actively operating (+5)');
  }

  if (signals.hasRecentActivity) {
    score += 5;
    reasons.push('Active Google listing — engaged business owner (+5)');
  }

  return { name: 'Growth Intent', score, maxScore: 10, reasons };
}

export function calculateOpportunityScore(signals: BusinessSignals): {
  score: number;
  level: 'High' | 'Medium' | 'Low';
  breakdown: OpportunityBreakdown;
  reasons: string[];
} {
  const websiteOpportunity = calcWebsiteOpportunity(signals);
  const reviewGap = calcReviewGap(signals);
  const gbpWeakness = calcGBPWeakness(signals);
  const revenueLeakage = calcRevenueLeakage(signals);
  const growthIntent = calcGrowthIntent(signals);

  const score = Math.min(100,
    websiteOpportunity.score +
    reviewGap.score +
    gbpWeakness.score +
    revenueLeakage.score +
    growthIntent.score
  );

  let level: 'High' | 'Medium' | 'Low' = 'Low';
  if (score >= 60) level = 'High';
  else if (score >= 35) level = 'Medium';

  const breakdown: OpportunityBreakdown = {
    websiteOpportunity,
    reviewGap,
    gbpWeakness,
    revenueLeakage,
    growthIntent,
  };

  const reasons = [
    ...websiteOpportunity.reasons,
    ...reviewGap.reasons,
    ...gbpWeakness.reasons,
    ...revenueLeakage.reasons,
    ...growthIntent.reasons,
  ];

  return { score, level, breakdown, reasons };
}
