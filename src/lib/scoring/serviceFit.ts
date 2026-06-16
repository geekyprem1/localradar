import { BusinessSignals, ServiceFitResult } from '@/types/scoring';

/**
 * Service Fit Score™ — Deterministic
 *
 * Determines how suitable a lead is for a specific service provider.
 * Returns scores for all 4 agency types.
 */

function calcWebDesignFit(signals: BusinessSignals): ServiceFitResult {
  let score = 0;
  const reasons: string[] = [];

  // No Website = +50
  if (!signals.hasWebsite) {
    score += 50;
    reasons.push('No website — needs full web design (+50)');
  }

  // Old Website = +30
  if (signals.hasWebsite && signals.isOldWebsite) {
    score += 30;
    reasons.push('Outdated website — redesign opportunity (+30)');
  }

  // Instagram/Facebook only = +20
  if (signals.isInstagramOnly || signals.isFacebookOnly) {
    score += 20;
    reasons.push('Social-media-only presence — needs proper site (+20)');
  }

  return {
    agencyType: 'Web Design',
    score: Math.min(100, score),
    level: getFitLevel(score),
    reasons,
  };
}

function calcSEOFit(signals: BusinessSignals): ServiceFitResult {
  let score = 0;
  const reasons: string[] = [];

  // Weak SEO Signals = +50
  if (!signals.hasWebsite || signals.isOldWebsite) {
    score += 50;
    reasons.push('Weak/no web presence — critical SEO gap (+50)');
  }

  // Weak Reviews = +20
  if (signals.fewReviews || signals.lowRating) {
    score += 20;
    reasons.push('Low reviews/rating — hurting local SEO ranking (+20)');
  }

  // Review gap with competitors = +15
  if (signals.competitorAvgReviews - signals.reviewCount > 50) {
    score += 15;
    reasons.push('Major review gap vs competitors — losing map pack (+15)');
  }

  // No phone = +10
  if (!signals.hasPhone) {
    score += 10;
    reasons.push('No phone on listing — incomplete NAP data (+10)');
  }

  return {
    agencyType: 'SEO',
    score: Math.min(100, score),
    level: getFitLevel(score),
    reasons,
  };
}

function calcAIAutomationFit(signals: BusinessSignals): ServiceFitResult {
  let score = 0;
  const reasons: string[] = [];

  // No Booking System = +40
  if (signals.noBookingSystem) {
    score += 40;
    reasons.push('No booking system — AI scheduling opportunity (+40)');
  }

  // No Chatbot = +30
  if (!signals.hasWebsite || signals.noLeadForm) {
    score += 30;
    reasons.push('No chatbot/live chat — AI assistant opportunity (+30)');
  }

  // No Lead Capture = +30
  if (signals.noLeadForm) {
    score += 30;
    reasons.push('No lead capture — AI funnel opportunity (+30)');
  }

  return {
    agencyType: 'AI Automation',
    score: Math.min(100, score),
    level: getFitLevel(score),
    reasons,
  };
}

function calcMarketingFit(signals: BusinessSignals): ServiceFitResult {
  let score = 0;
  const reasons: string[] = [];

  // Low reviews = +25
  if (signals.fewReviews) {
    score += 25;
    reasons.push('Low review count — reputation marketing needed (+25)');
  }

  // Low rating = +20
  if (signals.lowRating) {
    score += 20;
    reasons.push('Below 4.0 rating — brand perception campaign needed (+20)');
  }

  // No social presence = +25
  if (!signals.isInstagramOnly && !signals.isFacebookOnly && !signals.hasWebsite) {
    score += 25;
    reasons.push('No social presence — needs full marketing setup (+25)');
  }

  // No WhatsApp = +15
  if (signals.noWhatsApp) {
    score += 15;
    reasons.push('No WhatsApp marketing — missing direct channel (+15)');
  }

  // Review gap = +15
  if (signals.competitorAvgReviews - signals.reviewCount > 20) {
    score += 15;
    reasons.push('Behind competitors in reviews — needs review campaign (+15)');
  }

  return {
    agencyType: 'Marketing Agency',
    score: Math.min(100, score),
    level: getFitLevel(score),
    reasons,
  };
}

function getFitLevel(score: number): 'Perfect Fit' | 'Strong Fit' | 'Moderate Fit' | 'Weak Fit' {
  if (score >= 70) return 'Perfect Fit';
  if (score >= 45) return 'Strong Fit';
  if (score >= 20) return 'Moderate Fit';
  return 'Weak Fit';
}

export function calculateServiceFit(signals: BusinessSignals): {
  scores: ServiceFitResult[];
  bestFit: ServiceFitResult;
} {
  const scores = [
    calcWebDesignFit(signals),
    calcSEOFit(signals),
    calcAIAutomationFit(signals),
    calcMarketingFit(signals),
  ];

  // Sort by score descending to find best fit
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const bestFit = sorted[0];

  return { scores, bestFit };
}
