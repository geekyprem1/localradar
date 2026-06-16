// LocalRadar Intelligence Engine™ — Scoring Types
// All types for the proprietary deterministic scoring system

export interface BusinessSignals {
  // Website signals
  hasWebsite: boolean;
  isInstagramOnly: boolean;
  isFacebookOnly: boolean;
  isOldWebsite: boolean; // deterministic: derived from heuristics
  
  // Review signals
  reviewCount: number;
  rating: number;
  competitorAvgReviews: number;
  
  // GBP signals
  hasPhone: boolean;
  hasAddress: boolean;
  lowRating: boolean; // rating < 4.0
  fewReviews: boolean; // reviews < 10
  
  // Revenue leakage signals
  noBookingSystem: boolean;
  noLeadForm: boolean;
  noWhatsApp: boolean;
  noAppointment: boolean;
  
  // Growth intent signals
  hasRecentReviews: boolean; // reviews > 5
  hasRecentActivity: boolean; // rating > 0
}

export interface ScoreComponent {
  name: string;
  score: number;
  maxScore: number;
  reasons: string[];
}

export interface OpportunityBreakdown {
  websiteOpportunity: ScoreComponent;
  reviewGap: ScoreComponent;
  gbpWeakness: ScoreComponent;
  revenueLeakage: ScoreComponent;
  growthIntent: ScoreComponent;
}

export interface ServiceFitResult {
  agencyType: string;
  score: number;
  level: 'Perfect Fit' | 'Strong Fit' | 'Moderate Fit' | 'Weak Fit';
  reasons: string[];
}

export interface DealValueResult {
  min: number;
  max: number;
  formatted: string;
  services: string[];
}

export interface ScoredOpportunity {
  // Core metrics
  opportunityScore: number;
  opportunityLevel: 'High' | 'Medium' | 'Low';
  closingProbability: number;
  dealValue: DealValueResult;
  
  // Service Fit Score™
  serviceFitScores: ServiceFitResult[];
  bestFit: ServiceFitResult;
  
  // Explainability
  breakdown: OpportunityBreakdown;
  reasons: string[];
  
  // Component scores (for backward compat with Opportunity type)
  websiteScore: number;
  reviewsScore: number;
  seoScore: number;
  gbpScore: number;
  socialScore: number;
}
