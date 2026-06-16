import { Business, Competitor } from '@/types';
import { BusinessSignals, ScoredOpportunity, CompetitorBenchmark } from '@/types/scoring';
import { calculateOpportunityScore } from './opportunityScore';
import { calculateClosingProbability } from './closingProbability';
import { calculateDealValue, detectBusinessSize } from './dealValue';
import { calculateServiceFit } from './serviceFit';

export { generateExplanation, getVulnerabilityTags } from './explainScore';
export { calculateServiceFit } from './serviceFit';

/**
 * Infer category/niche based on business name or query.
 */
export function inferCategory(name: string, category?: string): string {
  if (category && category.trim().length > 0) {
    const c = category.trim().toLowerCase();
    if (c.includes('dent')) return 'Dentists';
    if (c.includes('plumb')) return 'Plumbers';
    if (c.includes('law') || c.includes('legal') || c.includes('attorney')) return 'Lawyers';
    if (c.includes('gym') || c.includes('fit') || c.includes('crossfit') || c.includes('yoga')) return 'Gyms';
    return category;
  }
  
  const n = name.toLowerCase();
  if (n.includes('dent') || n.includes('dental') || n.includes('ortho') || n.includes('smile') || n.includes('tooth') || n.includes('teeth')) {
    return 'Dentists';
  }
  if (n.includes('plumb') || n.includes('drain') || n.includes('sewer') || n.includes('pipe') || n.includes('leak')) {
    return 'Plumbers';
  }
  if (n.includes('law') || n.includes('legal') || n.includes('attorney') || n.includes('barrister') || n.includes('solicitor') || n.includes('advocate') || n.includes('firm')) {
    return 'Lawyers';
  }
  if (n.includes('gym') || n.includes('fit') || n.includes('crossfit') || n.includes('yoga') || n.includes('studio') || n.includes('athletic')) {
    return 'Gyms';
  }
  return 'General Local';
}

/**
 * Extract deterministic signals from a Business and its competitors.
 * No randomness. Only uses available data.
 */
export function extractSignals(
  business: Business,
  competitors: Competitor[] = []
): BusinessSignals {
  const website = (business.website || '').trim().toLowerCase();
  const hasWebsite = website.length > 0 
    && !website.includes('instagram.com') 
    && !website.includes('facebook.com');
  
  const isInstagramOnly = website.includes('instagram.com');
  const isFacebookOnly = website.includes('facebook.com') && !isInstagramOnly;
  
  // Outdated website heuristic: if has website but rating < 4.0 and reviews < 30
  const isOldWebsite = hasWebsite && business.rating < 4.0 && business.reviews_count < 30;

  const competitorAvgReviews = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + c.reviews_count, 0) / competitors.length)
    : 180; // Default competitor benchmark

  return {
    hasWebsite,
    isInstagramOnly,
    isFacebookOnly,
    isOldWebsite,
    reviewCount: business.reviews_count,
    rating: business.rating,
    competitorAvgReviews,
    hasPhone: !!(business.phone && business.phone.trim().length > 0),
    hasAddress: !!(business.address && business.address.trim().length > 0),
    lowRating: business.rating < 4.0,
    fewReviews: business.reviews_count < 10,
    noBookingSystem: !hasWebsite, // no website = no booking
    noLeadForm: !hasWebsite, // no website = no lead form
    noWhatsApp: !hasWebsite || !business.phone, // no phone = no whatsapp
    noAppointment: !hasWebsite, // no website = no appointment system
    hasRecentReviews: business.reviews_count > 5,
    hasRecentActivity: business.rating > 0,
  };
}

/**
 * Master scoring function.
 * Runs all intelligence modules and returns a unified ScoredOpportunity.
 */
export function scoreBusinessOpportunity(
  business: Business,
  competitors: Competitor[] = [],
  categoryInput?: string
): ScoredOpportunity {
  const category = inferCategory(business.name, categoryInput);
  const signals = extractSignals(business, competitors);
  
  // 1. Opportunity Score™
  const { score: opportunityScore, level, breakdown, reasons } = calculateOpportunityScore(signals, category);
  
  // 2. Closing Probability™
  const closingProbability = calculateClosingProbability(opportunityScore, signals, business.id);
  
  // 3. Deal Value Engine™
  const dealValue = calculateDealValue(signals, opportunityScore, category, business.address, business.name);
  
  // 4. Business Size Detection
  const businessSize = detectBusinessSize(business.reviews_count, business.rating, business.name);

  // 5. Competitor Benchmark Calculations
  const competitorAvgReviews = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + c.reviews_count, 0) / competitors.length)
    : 180;
  
  const competitorAvgRating = competitors.length > 0
    ? Math.round((competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length) * 10) / 10
    : 4.5;
  
  const competitorWebsiteCount = competitors.length > 0
    ? competitors.filter(c => c.website && c.website.trim().length > 0 && !c.website.includes('instagram.com') && !c.website.includes('facebook.com')).length
    : Math.min(competitors.length, 3);
  const competitorWebsiteRatio = competitors.length > 0
    ? Math.round((competitorWebsiteCount / competitors.length) * 100)
    : 85;
  
  const competitorBookingCount = competitors.length > 0
    ? competitors.filter(c => c.rating > 4.2).length
    : Math.min(competitors.length, 2);
  const competitorBookingRatio = competitors.length > 0
    ? Math.round((competitorBookingCount / competitors.length) * 100)
    : 70;

  const competitorBenchmark: CompetitorBenchmark = {
    currentReviews: business.reviews_count,
    competitorAvgReviews,
    currentRating: business.rating,
    competitorAvgRating,
    hasWebsite: signals.hasWebsite,
    competitorWebsiteRatio,
    hasBooking: !signals.noBookingSystem,
    competitorBookingRatio
  };

  // 6. Confidence Score™
  let confidence = 72; // baseline
  if (signals.hasPhone && signals.hasAddress) confidence += 10;
  else confidence -= 5;
  
  if (business.reviews_count > 100) confidence += 8;
  else if (business.reviews_count > 20) confidence += 4;
  else if (business.reviews_count === 0) confidence -= 10;
  
  if (competitors.length >= 3) confidence += 5;
  else confidence -= 5;
  
  if (signals.hasWebsite) confidence += 3;
  
  const confidenceScore = Math.min(98, Math.max(55, confidence));

  // 7. Service Fit Score™
  const { scores: serviceFitScores, bestFit } = calculateServiceFit(signals, business.id);

  // Map component scores for backward compatibility
  const websiteScore = breakdown.websiteOpportunity.score;
  const reviewsScore = breakdown.reviewGap.score;
  const seoScore = breakdown.gbpWeakness.score;
  const gbpScore = breakdown.revenueLeakage.score;
  const socialScore = breakdown.growthIntent.score;

  return {
    opportunityScore,
    opportunityLevel: level,
    closingProbability,
    dealValue,
    confidenceScore,
    businessSize,
    competitorBenchmark,
    category,
    serviceFitScores,
    bestFit,
    breakdown,
    reasons,
    websiteScore,
    reviewsScore,
    seoScore,
    gbpScore,
    socialScore,
  };
}
