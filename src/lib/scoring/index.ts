import { Business, Competitor } from '@/types';
import { BusinessSignals, ScoredOpportunity } from '@/types/scoring';
import { calculateOpportunityScore } from './opportunityScore';
import { calculateClosingProbability } from './closingProbability';
import { calculateDealValue } from './dealValue';
import { calculateServiceFit } from './serviceFit';

export { generateExplanation, getVulnerabilityTags } from './explainScore';
export { calculateServiceFit } from './serviceFit';

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
  
  // Deterministic "old website" detection:
  // If has website but rating < 3.5 and reviews < 20, likely an outdated business with outdated site
  const isOldWebsite = hasWebsite && business.rating < 3.5 && business.reviews_count < 20;

  const competitorAvgReviews = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + c.reviews_count, 0) / competitors.length)
    : 200; // Default competitor benchmark

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
 * Runs all 4 intelligence modules and returns a unified ScoredOpportunity.
 */
export function scoreBusinessOpportunity(
  business: Business,
  competitors: Competitor[] = []
): ScoredOpportunity {
  const signals = extractSignals(business, competitors);
  
  // 1. Opportunity Score™
  const { score: opportunityScore, level, breakdown, reasons } = calculateOpportunityScore(signals);
  
  // 2. Closing Probability™
  const closingProbability = calculateClosingProbability(opportunityScore, signals, business.id);
  
  // 3. Deal Value Engine™
  const dealValue = calculateDealValue(signals, opportunityScore);
  
  // 4. Service Fit Score™
  const { scores: serviceFitScores, bestFit } = calculateServiceFit(signals);

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
