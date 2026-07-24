// LocalRadar Intelligence Engine™ — Scoring Types
// All types for the proprietary deterministic scoring system

// ─────────────────────────────────────────────────────────────────────────────
// Provenance primitives (honesty model)
// A small set of primitives threaded through every layer so that each value is
// either sourced from real data or explicitly labeled with its origin.
// ─────────────────────────────────────────────────────────────────────────────

/** Origin of a single data field. */
export type ProvenanceLabel = 'real' | 'estimated' | 'heuristic' | 'unavailable';

/** Origin of an entire result set. */
export type DataSource = 'live' | 'cache' | 'sandbox';

/** 0-100 integer reliability score. Validated to Number.isInteger && 0..100. */
export type ConfidenceValue = number;

/** A value carrying its provenance. `value` is null when label === 'unavailable'. */
export interface Provenanced<T> {
  value: T | null;
  provenance: ProvenanceLabel;
}

/** Per-field provenance for contact information (Req 1, 11). */
export interface ContactProvenance {
  business_email: ProvenanceLabel;
  contact_email: ProvenanceLabel;
  contact_page: ProvenanceLabel;
}

/** The set of signal keys that carry a provenance label (Req 3). */
export type SignalKey =
  | 'hasWebsite'
  | 'isInstagramOnly'
  | 'isFacebookOnly'
  | 'isOldWebsite'
  | 'noBookingSystem'
  | 'noLeadForm'
  | 'noWhatsApp'
  | 'noAppointment'
  | 'reviewCount'
  | 'rating'
  | 'competitorAvgReviews';

/** Per-signal provenance emitted by the Signal_Extractor (Req 3). */
export type SignalProvenance = Record<SignalKey, ProvenanceLabel>;

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

// Authoritative shape lives in the Deal_Value_Engine; imported for local use
// (e.g. ScoredOpportunity) and re-exported so existing consumers keep importing
// from one place.
import type { DealValueResult } from '@/lib/scoring/dealValue';
export type { DealValueResult };

export interface CompetitorBenchmark {
  currentReviews: number;
  competitorAvgReviews: number;
  currentRating: number;
  competitorAvgRating: number;
  hasWebsite: boolean;
  competitorWebsiteRatio: number; // 0-100 percentage
  hasBooking: boolean;
  competitorBookingRatio: number; // 0-100 percentage

  // Honesty labels for the benchmark (Req 2, 11)
  // `provenance`: 'real' when computed from >= 3 competitors, 'estimated' when < 3 (incl. 0).
  // `sampleSize`: number of competitors AFTER self-exclusion.
  // Optional for backward compatibility until the Competitor_Benchmark_Service is wired in.
  provenance?: ProvenanceLabel;
  sampleSize?: number;
}

export interface ScoredOpportunity {
  // Core metrics
  opportunityScore: number;
  opportunityLevel: 'High' | 'Medium' | 'Low';
  closingProbability: number;
  dealValue: DealValueResult;
  
  // New Revenue Intelligence fields
  confidenceScore: ConfidenceValue;
  businessSize: 'Solo Practice' | 'Small Clinic' | 'Growing Business' | 'Multi-location Business' | 'Enterprise Local Brand';
  competitorBenchmark: CompetitorBenchmark;
  category: string;

  // Provenance maps (honesty model, Req 3, 11)
  // Per-signal labels emitted by the Signal_Extractor. Optional for backward
  // compatibility until the extractor emits provenance (later tasks).
  signalProvenance?: SignalProvenance;
  // Per-contact-field labels; absent when no contact enrichment ran.
  contactProvenance?: ContactProvenance;
  
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
