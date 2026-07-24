import { ProvenanceLabel } from '@/types/scoring';

/**
 * Competitor_Benchmark_Service — real, self-excluding competitor benchmarks
 *
 * Replaces the old hardcoded/mock competitor generation. The benchmark is built
 * entirely from the live Places result set already fetched for the searched
 * niche + city, so it adds zero extra provider calls. The business being scored
 * is excluded from its own benchmark by matching on the Places place id.
 *
 * Provenance rules (Req 2):
 * - sample size >= 3  → averages computed, provenance 'real'
 * - sample size 1–2   → averages computed, provenance 'estimated'
 * - sample size 0     → null averages, provenance 'estimated', sampleSize 0
 * Values are never hardcoded.
 */

/** Minimal competitor record derived from a real Places result. */
export interface PlaceLite {
  placeId: string;
  rating: number; // 0..5
  reviewsCount: number; // >= 0
  website: string;
}

export interface CompetitorBenchmarkResult {
  competitorAvgReviews: number | null; // rounded to whole; null when sampleSize === 0
  competitorAvgRating: number | null; // rounded to 0.1, clamped 0..5; null when sampleSize === 0
  competitorWebsiteRatio: number | null; // 0-100 percentage; null when sampleSize === 0
  sampleSize: number; // count AFTER self-exclusion
  provenance: ProvenanceLabel; // 'real' (>=3) | 'estimated' (<3 incl. 0)
}

export interface CompetitorBenchmarkService {
  /** Build benchmark for the scored business, excluding it by place id (Req 2.4). */
  build(input: { scoredPlaceId: string; resultSet: PlaceLite[] }): CompetitorBenchmarkResult;
}

/** Minimum number of real competitors required for a `real` provenance label. */
const MIN_REAL_SAMPLE = 3;

/** Round a rating to one decimal place and clamp to the 0.0–5.0 scale. */
function roundRatingToTenth(value: number): number {
  const clamped = Math.min(5, Math.max(0, value));
  return Math.round(clamped * 10) / 10;
}

/**
 * Default Competitor_Benchmark_Service. Computes averages from the real result
 * set after excluding the scored business by place id. Never hardcodes values.
 */
export class ResultSetCompetitorBenchmarkService implements CompetitorBenchmarkService {
  build(input: { scoredPlaceId: string; resultSet: PlaceLite[] }): CompetitorBenchmarkResult {
    const { scoredPlaceId, resultSet } = input;

    // Exclude the business being scored by matching on the Places place id (Req 2.4).
    const competitors = resultSet.filter((place) => place.placeId !== scoredPlaceId);
    const sampleSize = competitors.length;

    // Zero competitors: no benchmark, never substitute hardcoded values (Req 2.6).
    if (sampleSize === 0) {
      return {
        competitorAvgReviews: null,
        competitorAvgRating: null,
        competitorWebsiteRatio: null,
        sampleSize: 0,
        provenance: 'estimated',
      };
    }

    const totalReviews = competitors.reduce((sum, c) => sum + c.reviewsCount, 0);
    const totalRating = competitors.reduce((sum, c) => sum + c.rating, 0);
    const withWebsite = competitors.filter((c) => c.website.trim() !== '').length;

    // Avg reviews rounded to nearest whole number (Req 2.3).
    const competitorAvgReviews = Math.round(totalReviews / sampleSize);
    // Avg rating rounded to 0.1 and clamped to 0–5 (Req 2.3).
    const competitorAvgRating = roundRatingToTenth(totalRating / sampleSize);
    const competitorWebsiteRatio = Math.round((withWebsite / sampleSize) * 100);

    // >= 3 competitors → 'real'; 1–2 → 'estimated' (Req 2.3, 2.5).
    const provenance: ProvenanceLabel = sampleSize >= MIN_REAL_SAMPLE ? 'real' : 'estimated';

    return {
      competitorAvgReviews,
      competitorAvgRating,
      competitorWebsiteRatio,
      sampleSize,
      provenance,
    };
  }
}

/** Shared default instance of the Competitor_Benchmark_Service. */
export const competitorBenchmarkService: CompetitorBenchmarkService =
  new ResultSetCompetitorBenchmarkService();
