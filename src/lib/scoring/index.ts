import { Business } from '@/types';
import {
  BusinessSignals,
  ScoredOpportunity,
  CompetitorBenchmark,
  SignalProvenance,
  ProvenanceLabel,
  ConfidenceValue,
} from '@/types/scoring';
import { CompetitorBenchmarkResult } from './competitorBenchmark';
import { calculateOpportunityScore } from './opportunityScore';
import { calculateClosingProbability } from './closingProbability';
import { calculateDealValue, detectBusinessSize } from './dealValue';
import { calculateServiceFit } from './serviceFit';

export { generateExplanation, getVulnerabilityTags } from './explainScore';
export { calculateServiceFit } from './serviceFit';

/**
 * Confirmation verbs that may only appear on `real` (inspected/verified) signal
 * reasons. On any non-real label these are rewritten so the reason is never
 * presented as a confirmed detection (Req 3.3, 3.4, 3.7).
 */
const CONFIRMATION_REWRITES: ReadonlyArray<[RegExp, string]> = [
  [/\bdetected\b/gi, 'likely'],
  [/\bconfirmed\b/gi, 'likely'],
  [/\bverified\b/gi, 'assumed'],
  [/\bfound\b/gi, 'likely present'],
];

/** Assumption-indicating markers that satisfy the heuristic phrasing rule. */
const ASSUMPTION_MARKERS: ReadonlyArray<string> = ['likely', 'may', 'possibly', 'not verified'];

// ─────────────────────────────────────────────────────────────────────────────
// Confidence model (Req 11.2, 11.5, 11.6, 12.4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-provenance contribution weight used to build the data-availability portion
 * of the Confidence_Value. A value labeled `unavailable` contributes 0 (Req 11.5);
 * verified values count fully; inferred/estimated values count partially so the
 * confidence honestly reflects how much of the result is real vs assumed.
 */
const PROVENANCE_CONFIDENCE_WEIGHT: Record<ProvenanceLabel, number> = {
  real: 1.0,
  estimated: 0.6,
  heuristic: 0.5,
  unavailable: 0.0,
};

/**
 * Maximum points contributed by data availability. The remaining headroom up to
 * 100 is reserved for the competitor-benchmark bonus so that a benchmark of
 * `>= 5` real competitors is always at least 20 points more confident than the
 * `< 5` case (Req 11.6, 12.4) while the total stays within `[0, 100]` (Req 11.2).
 */
const AVAILABILITY_CONFIDENCE_MAX = 80;

/**
 * Confidence bonus granted only when the competitor benchmark is backed by
 * `>= 5` real competitors. Because it is a fixed additive term and the
 * availability portion is always `>= 0`, the `< 5` case is guaranteed to be at
 * least this many points lower than the `>= 5` case, floored at 0 (Req 11.6).
 */
const STRONG_BENCHMARK_CONFIDENCE_BONUS = 20;

/** Threshold of real competitors at/above which the benchmark is "strong" (Req 11.6). */
const STRONG_BENCHMARK_MIN_COMPETITORS = 5;

/**
 * Per-field weights for the business data-completeness factor. These sum to 1.0
 * so a business carrying all four core real data points scores a completeness of
 * 1.0, and each missing point reduces it proportionally. A real website is
 * weighted highest; a social-only presence earns partial web credit.
 */
const DATA_COMPLETENESS_WEIGHTS = {
  realWebsite: 0.35,
  socialOnly: 0.15,
  reviews: 0.25,
  phone: 0.2,
  address: 0.2,
} as const;

/**
 * Compute a per-business data-completeness factor in `[0, 1]` from the real
 * fields actually present on the business (website / reviews / phone / address).
 *
 * This is what lets confidence vary between businesses: two leads run through the
 * identical (heuristic) signal pipeline still differ in how much real underlying
 * data backs them. A lead with a real website, reviews, phone and address scores
 * 1.0; a bare listing with only a phone scores much lower. Signal provenance
 * labels are left untouched (they stay spec-compliant per Req 3.2); this factor
 * is an additional honest reduction, never an inflation.
 */
export function computeDataCompleteness(signals: BusinessSignals): number {
  let score = 0;
  if (signals.hasWebsite) score += DATA_COMPLETENESS_WEIGHTS.realWebsite;
  else if (signals.isInstagramOnly || signals.isFacebookOnly)
    score += DATA_COMPLETENESS_WEIGHTS.socialOnly;
  if (signals.reviewCount > 0) score += DATA_COMPLETENESS_WEIGHTS.reviews;
  if (signals.hasPhone) score += DATA_COMPLETENESS_WEIGHTS.phone;
  if (signals.hasAddress) score += DATA_COMPLETENESS_WEIGHTS.address;
  return Math.max(0, Math.min(1, score));
}

/**
 * Compute a bounded, honest {@link ConfidenceValue} in `[0, 100]` from the
 * per-signal provenance map, the competitor sample size, and a per-business
 * data-completeness factor (Req 11.2, 11.5, 11.6, 12.4).
 *
 * The value has two independent parts:
 *  1. **Data availability** (`[0, {@link AVAILABILITY_CONFIDENCE_MAX}]`): the
 *     mean provenance weight across every emitted signal, scaled — then further
 *     scaled by `dataCompleteness` so a business missing real fields (website,
 *     reviews, phone, address) is honestly less confident than one with them.
 *     Signals labeled `unavailable` contribute exactly 0, so missing/failed data
 *     can never inflate confidence (Req 11.5). `dataCompleteness` defaults to 1
 *     (backward compatible) and is clamped to `[0, 1]`.
 *  2. **Benchmark bonus** (`+{@link STRONG_BENCHMARK_CONFIDENCE_BONUS}` only when
 *     `sampleSize >= {@link STRONG_BENCHMARK_MIN_COMPETITORS}`): because this is
 *     additive and the availability part is non-negative, an otherwise-identical
 *     opportunity backed by `< 5` real competitors always lands at least 20
 *     points below the `>= 5` case, and never below 0 (Req 11.6, 12.4). The bonus
 *     reflects market-data quality and is intentionally not scaled by the
 *     per-business completeness factor, preserving that guarantee.
 *
 * The result is rounded to an integer and clamped to `[0, 100]`.
 */
export function computeConfidence(
  signalProvenance: SignalProvenance,
  sampleSize: number,
  dataCompleteness: number = 1
): ConfidenceValue {
  const labels = Object.values(signalProvenance) as ProvenanceLabel[];

  const meanWeight =
    labels.length === 0
      ? 0
      : labels.reduce((sum, label) => sum + PROVENANCE_CONFIDENCE_WEIGHT[label], 0) /
        labels.length;

  // Per-business completeness factor, clamped to [0, 1] (defaults to 1).
  const completeness = Math.max(0, Math.min(1, dataCompleteness));

  // Data-availability portion: mean provenance weight scaled to [0, MAX], then
  // reduced by how much real underlying data the business actually has.
  const availability = meanWeight * completeness * AVAILABILITY_CONFIDENCE_MAX;

  // Benchmark bonus only for a strong (>= 5) real-competitor sample.
  const benchmarkBonus =
    sampleSize >= STRONG_BENCHMARK_MIN_COMPETITORS ? STRONG_BENCHMARK_CONFIDENCE_BONUS : 0;

  const confidence = Math.round(availability + benchmarkBonus);

  // Bounded integer in [0, 100] (Req 11.2).
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Central, single-source-of-truth reason phrasing helper (Design §4/§Signal_Extractor).
 *
 * Rewrites a raw reason string so its wording matches the provenance of the
 * signal it describes. This is the ONE place that decides which reasons may use
 * confirmation language; both the Scoring_Engine and the Audit_Generator import
 * it so heuristic and unavailable signals can never leak "detected"/"confirmed"
 * wording to the user.
 *
 * - `real`: value came from an actual inspection/verified source, so
 *   confirmation language ("detected", "confirmed") is kept unchanged (Req 3.5).
 * - `heuristic`: rewritten into assumption language ("likely", "may", ...) with
 *   all confirmation terms stripped, so an inferred signal is never stated as a
 *   confirmed detection (Req 3.3, 3.4).
 * - `unavailable` / `estimated`: confirmation terms are stripped so the reason
 *   is never presented as a confirmed detection (Req 3.7).
 */
export function phraseReason(text: string, label: ProvenanceLabel): string {
  const input = (text || '').trim();

  // Real signals are backed by an actual inspection/verified value; their
  // confirmation language is allowed to stand.
  if (label === 'real' || input.length === 0) {
    return input;
  }

  // Protect the allowed assumption phrase "not verified" from the `verified`
  // rewrite, then restore it afterwards.
  const NOT_VERIFIED_TOKEN = '\u0000NOT_VERIFIED\u0000';
  let out = input.replace(/\bnot verified\b/gi, NOT_VERIFIED_TOKEN);

  for (const [pattern, replacement] of CONFIRMATION_REWRITES) {
    out = out.replace(pattern, replacement);
  }

  out = out.split(NOT_VERIFIED_TOKEN).join('not verified');

  // Heuristic reasons must read as assumptions; ensure a marker is present and
  // otherwise lead with "Likely".
  if (label === 'heuristic') {
    const lower = out.toLowerCase();
    const hasMarker = ASSUMPTION_MARKERS.some((marker) => lower.includes(marker));
    if (!hasMarker) {
      out = `Likely ${out.charAt(0).toLowerCase()}${out.slice(1)}`;
    }
  }

  return out;
}

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
 * Optional website-inspection result. When a business website is actually
 * inspected, confirmed features let the Signal_Extractor emit `real` signals
 * with confirmation-language reasons. Absent fields fall back to heuristics.
 * (Design §4, Req 3.5)
 */
export interface WebsiteInspection {
  bookingConfirmed?: boolean;
  leadFormConfirmed?: boolean;
  chatConfirmed?: boolean;
  appointmentConfirmed?: boolean;
  ageConfirmed?: boolean;
}

/**
 * Extension point for real website inspection (future). The default pipeline
 * supplies no inspection, so the inspected signals are labeled `heuristic`.
 */
export interface WebsiteInspector {
  inspect(website: string): Promise<WebsiteInspection>;
}

/**
 * Extract deterministic signals from a Business and a competitor benchmark,
 * together with a per-signal provenance map (Req 3).
 *
 * No randomness. Only uses available data.
 *
 * Provenance rules:
 * - `hasWebsite`, `isInstagramOnly`, `isFacebookOnly`, `reviewCount`, `rating`
 *   are derived directly from the real values on the business record → `real`.
 * - Booking / lead-form / WhatsApp-chat / appointment / website-age signals are
 *   inferred from website+phone presence when no `WebsiteInspection` is supplied
 *   → `heuristic`. When an inspection confirms (or denies) a feature, that
 *   signal is derived from the inspection → `real`.
 * - `competitorAvgReviews` reflects the benchmark's provenance; when the
 *   benchmark has no sample (null) it is `unavailable`.
 */
export function extractSignals(
  business: Business,
  benchmark: CompetitorBenchmarkResult,
  inspection?: WebsiteInspection
): { signals: BusinessSignals; provenance: SignalProvenance } {
  const website = (business.website || '').trim().toLowerCase();
  const hasWebsite = website.length > 0 
    && !website.includes('instagram.com') 
    && !website.includes('facebook.com');
  
  const isInstagramOnly = website.includes('instagram.com');
  const isFacebookOnly = website.includes('facebook.com') && !isInstagramOnly;

  const hasPhone = !!(business.phone && business.phone.trim().length > 0);

  // Website-age signal: `real` when inspected, otherwise a heuristic derived
  // from rating/review activity.
  const ageConfirmed = inspection?.ageConfirmed;
  const isOldWebsite = ageConfirmed !== undefined
    ? ageConfirmed
    : hasWebsite && business.rating < 4.0 && business.reviews_count < 30;

  // Revenue-leakage signals: `real` when an inspection confirms/denies the
  // feature, otherwise heuristics from website+phone presence.
  const bookingConfirmed = inspection?.bookingConfirmed;
  const noBookingSystem = bookingConfirmed !== undefined ? !bookingConfirmed : !hasWebsite;

  const leadFormConfirmed = inspection?.leadFormConfirmed;
  const noLeadForm = leadFormConfirmed !== undefined ? !leadFormConfirmed : !hasWebsite;

  const chatConfirmed = inspection?.chatConfirmed;
  const noWhatsApp = chatConfirmed !== undefined ? !chatConfirmed : (!hasWebsite || !hasPhone);

  const appointmentConfirmed = inspection?.appointmentConfirmed;
  const noAppointment = appointmentConfirmed !== undefined ? !appointmentConfirmed : !hasWebsite;

  // Competitor benchmark: consume the real benchmark; when unavailable (no
  // sample) treat the review gap as neutral by mirroring the business's own
  // review count so it contributes nothing.
  const benchmarkAvailable = benchmark.competitorAvgReviews !== null;
  const competitorAvgReviews = benchmarkAvailable
    ? (benchmark.competitorAvgReviews as number)
    : business.reviews_count;

  const signals: BusinessSignals = {
    hasWebsite,
    isInstagramOnly,
    isFacebookOnly,
    isOldWebsite,
    reviewCount: business.reviews_count,
    rating: business.rating,
    competitorAvgReviews,
    hasPhone,
    hasAddress: !!(business.address && business.address.trim().length > 0),
    lowRating: business.rating < 4.0,
    fewReviews: business.reviews_count < 10,
    noBookingSystem,
    noLeadForm,
    noWhatsApp,
    noAppointment,
    hasRecentReviews: business.reviews_count > 5,
    hasRecentActivity: business.rating > 0,
  };

  // A signal is `real` when it comes from an inspection confirmation; otherwise
  // the inspected-feature signals are `heuristic`.
  const bookingLabel = bookingConfirmed !== undefined ? 'real' : 'heuristic';
  const leadFormLabel = leadFormConfirmed !== undefined ? 'real' : 'heuristic';
  const whatsAppLabel = chatConfirmed !== undefined ? 'real' : 'heuristic';
  const appointmentLabel = appointmentConfirmed !== undefined ? 'real' : 'heuristic';
  const ageLabel = ageConfirmed !== undefined ? 'real' : 'heuristic';

  const provenance: SignalProvenance = {
    // Derived directly from real values on the business record.
    hasWebsite: 'real',
    isInstagramOnly: 'real',
    isFacebookOnly: 'real',
    reviewCount: 'real',
    rating: 'real',
    // Inspected-or-heuristic signals.
    isOldWebsite: ageLabel,
    noBookingSystem: bookingLabel,
    noLeadForm: leadFormLabel,
    noWhatsApp: whatsAppLabel,
    noAppointment: appointmentLabel,
    // Benchmark provenance: real/estimated when a sample exists, else unavailable.
    competitorAvgReviews: benchmarkAvailable ? benchmark.provenance : 'unavailable',
  };

  return { signals, provenance };
}

/**
 * Master scoring function (Scoring facade — Design §9).
 *
 * Runs every intelligence module against a single business and returns a
 * unified {@link ScoredOpportunity}. The facade now consumes a real
 * {@link CompetitorBenchmarkResult} (produced once per result set by the
 * Competitor_Benchmark_Service) instead of fabricating a competitor list, and
 * forwards `country` + an optional {@link WebsiteInspection} to the
 * sub-components so deal values format in the right currency and inspected
 * signals can be labeled `real` (Req 4.1).
 *
 * Legacy → semantic component mapping (Req 8.1). The backward-compatible
 * component score fields map to opportunity components *by meaning*, so
 * downstream consumers (e.g. the Audit_Generator) can key off the semantically
 * correct weakness rather than a misnamed field:
 *
 * | Legacy field   | Opportunity component | Meaning                                   |
 * |----------------|-----------------------|-------------------------------------------|
 * | `websiteScore` | `websiteOpportunity`  | Website weakness / absence                |
 * | `reviewsScore` | `reviewGap`           | Review deficit vs benchmark               |
 * | `seoScore`     | `gbpWeakness`         | Google Business Profile weakness          |
 * | `gbpScore`     | `revenueLeakage`      | Booking / lead-capture leakage            |
 * | `socialScore`  | `growthIntent`        | Activity / growth intent                  |
 *
 * @param business    The business being scored.
 * @param benchmark   Real (or estimated) competitor benchmark for this niche+city,
 *                    already self-excluding the scored business by place id.
 * @param categoryInput Optional niche hint used to infer the category.
 * @param country     Optional ISO/country name forwarded to currency formatting.
 * @param inspection  Optional confirmed website features; when present, the
 *                    inspected signals are labeled `real` instead of `heuristic`.
 */
export function scoreBusinessOpportunity(
  business: Business,
  benchmark: CompetitorBenchmarkResult,
  categoryInput?: string,
  country?: string,
  inspection?: WebsiteInspection
): ScoredOpportunity {
  const category = inferCategory(business.name, categoryInput);

  // Extract deterministic signals from the business and the real competitor
  // benchmark, forwarding any confirmed website inspection so inspected signals
  // are labeled `real` rather than `heuristic`.
  const { signals, provenance: signalProvenance } = extractSignals(
    business,
    benchmark,
    inspection
  );

  // 1. Opportunity Score™
  const { score: opportunityScore, level, breakdown, reasons } = calculateOpportunityScore(signals, category);

  // 2. Closing Probability™
  const closingProbability = calculateClosingProbability(opportunityScore, signals, business.id);

  // 3. Deal Value Engine™ (country forwarded for currency formatting, Req 4.1)
  const dealValue = calculateDealValue(
    signals,
    opportunityScore,
    category,
    business.address,
    business.name,
    country
  );

  // 4. Business Size Detection
  const businessSize = detectBusinessSize(business.reviews_count, business.rating, business.name);

  // 5. Competitor Benchmark — surface the real benchmark result on the display
  // shape. Null averages (sample size 0) fall back to the business's own values
  // so the comparison reads as neutral; the honesty labels (`provenance`,
  // `sampleSize`) carry the real data availability. The benchmark service does
  // not compute a booking ratio, so it is reported as 0 (no competitor data).
  const competitorBenchmark: CompetitorBenchmark = {
    currentReviews: business.reviews_count,
    competitorAvgReviews: benchmark.competitorAvgReviews ?? business.reviews_count,
    currentRating: business.rating,
    competitorAvgRating: benchmark.competitorAvgRating ?? business.rating,
    hasWebsite: signals.hasWebsite,
    competitorWebsiteRatio: benchmark.competitorWebsiteRatio ?? 0,
    hasBooking: !signals.noBookingSystem,
    competitorBookingRatio: 0,
    provenance: benchmark.provenance,
    sampleSize: benchmark.sampleSize,
  };

  // 6. Confidence Score™ — honest, per-contribution confidence model (Req 11.2,
  // 11.5, 11.6, 12.4). Data availability is derived from the per-signal
  // provenance map (values labeled `unavailable` contribute 0) and further scaled
  // by how much real underlying data this specific business carries (website /
  // reviews / phone / address), so confidence varies per business instead of
  // being uniform. A benchmark backed by fewer than 5 real competitors yields a
  // confidence at least 20 points lower than the >= 5 case, floored at 0.
  const dataCompleteness = computeDataCompleteness(signals);
  const confidenceScore: ConfidenceValue = computeConfidence(
    signalProvenance,
    benchmark.sampleSize,
    dataCompleteness
  );

  // 7. Service Fit Score™
  const { scores: serviceFitScores, bestFit } = calculateServiceFit(signals, business.id);

  // Map component scores to their semantic components (Req 8.1). See the JSDoc
  // table above for the legacy → semantic mapping.
  const websiteScore = breakdown.websiteOpportunity.score; // website weakness/absence
  const reviewsScore = breakdown.reviewGap.score; // review deficit vs benchmark
  const seoScore = breakdown.gbpWeakness.score; // Google Business Profile weakness
  const gbpScore = breakdown.revenueLeakage.score; // booking/lead-capture leakage
  const socialScore = breakdown.growthIntent.score; // activity/growth intent

  return {
    opportunityScore,
    opportunityLevel: level,
    closingProbability,
    dealValue,
    confidenceScore,
    businessSize,
    competitorBenchmark,
    category,
    signalProvenance,
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
