import { BusinessSignals, ServiceFitResult } from '@/types/scoring';

/**
 * Service Fit Score™ — Deterministic
 *
 * Calculates realistic, granular fit percentages for all 4 agency types.
 * Applies a seed-based offset to prevent flat values and clamps maximum fit below 90%.
 */

function seededRandom(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(Math.sin(hash)) % 1;
}

function calcWebDesignFit(signals: BusinessSignals, offset: number): ServiceFitResult {
  let score = 0;
  const reasons: string[] = [];

  if (!signals.hasWebsite) {
    score = 83 + offset;
    reasons.push('No website domain — full web design opportunity (+83%)');
  } else if (signals.isInstagramOnly || signals.isFacebookOnly) {
    score = 71 + offset;
    reasons.push('Social-media-only presence — needs professional website (+71%)');
  } else if (signals.isOldWebsite) {
    score = 58 + offset;
    reasons.push('Outdated website detected — redesign opportunity (+58%)');
  } else {
    score = 23 + offset;
    reasons.push('Existing website looks stable, minor design tweaks (+23%)');
  }

  score = Math.min(89, Math.max(10, score));

  return {
    agencyType: 'Web Design',
    score,
    level: getFitLevel(score),
    reasons,
  };
}

function calcSEOFit(signals: BusinessSignals, offset: number): ServiceFitResult {
  let score = 25; // base
  const reasons: string[] = [];

  const gap = signals.competitorAvgReviews - signals.reviewCount;
  if (gap > 100) {
    score += 42;
    reasons.push(`Significant competitor review gap of ${gap} (+42%)`);
  } else if (gap > 30) {
    score += 28;
    reasons.push(`Moderate competitor review gap of ${gap} (+28%)`);
  }

  if (signals.fewReviews || signals.lowRating) {
    score += 15;
    reasons.push('Low review count or below-average rating hurts Map Pack (+15%)');
  }

  if (!signals.hasPhone || !signals.hasAddress) {
    score += 10;
    reasons.push('Incomplete directory NAP listings (+10%)');
  }

  score = score + offset;
  score = Math.min(88, Math.max(10, score));

  return {
    agencyType: 'SEO',
    score,
    level: getFitLevel(score),
    reasons,
  };
}

function calcAIAutomationFit(signals: BusinessSignals, offset: number): ServiceFitResult {
  let score = 20; // base
  const reasons: string[] = [];

  if (signals.noBookingSystem) {
    score += 36;
    reasons.push('Missing booking integration — AI appointment scheduling opportunity (+36%)');
  }
  if (signals.noLeadForm) {
    score += 24;
    reasons.push('No conversational lead capture — AI agent opportunity (+24%)');
  }
  if (signals.noWhatsApp) {
    score += 14;
    reasons.push('No instant chat funnel — WhatsApp chatbot integration (+14%)');
  }

  score = score + offset;
  score = Math.min(84, Math.max(10, score));

  return {
    agencyType: 'AI Automation',
    score,
    level: getFitLevel(score),
    reasons,
  };
}

function calcMarketingFit(signals: BusinessSignals, offset: number): ServiceFitResult {
  let score = 20; // base
  const reasons: string[] = [];

  if (signals.fewReviews) {
    score += 24;
    reasons.push('Low review volume — reputation marketing setup needed (+24%)');
  }
  if (signals.lowRating) {
    score += 21;
    reasons.push('Rating below 4.0 ⭐ — customer perception campaign needed (+21%)');
  }
  if (!signals.hasWebsite) {
    score += 14;
    reasons.push('Lacks domain authority — needs full-stack local marketing launch (+14%)');
  }
  if (signals.noWhatsApp) {
    score += 9;
    reasons.push('Lacks direct mobile channel — WhatsApp marketing setup (+9%)');
  }

  score = score + offset;
  score = Math.min(81, Math.max(10, score));

  return {
    agencyType: 'Marketing Agency',
    score,
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

export function calculateServiceFit(
  signals: BusinessSignals,
  businessId?: string
): {
  scores: ServiceFitResult[];
  bestFit: ServiceFitResult;
} {
  let offset = 0;
  if (businessId) {
    const r = seededRandom(businessId);
    offset = Math.floor(r * 6) - 3; // yields -3, -2, -1, 0, 1, 2
  }

  const scores = [
    calcWebDesignFit(signals, offset),
    calcSEOFit(signals, offset),
    calcAIAutomationFit(signals, offset),
    calcMarketingFit(signals, offset),
  ];

  // Sort by score descending to find best fit
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const bestFit = sorted[0];

  return { scores, bestFit };
}
