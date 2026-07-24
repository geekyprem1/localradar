// Feature: real-data-intelligence-engine, Property 18: Confidence is a bounded integer with honest contributions
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { SignalKey, SignalProvenance, ProvenanceLabel } from '@/types/scoring';
import { computeConfidence, computeDataCompleteness } from './index';
import type { BusinessSignals } from '@/types/scoring';

// ---------------------------------------------------------------------------
// Property 18: Confidence is a bounded integer with honest contributions
// Validates: Requirements 11.2, 11.5, 11.6, 12.4
//
// Req 11.2: Confidence_Value is an integer in [0, 100].
// Req 11.5: `unavailable` signals contribute 0 — missing/failed data can never
//           inflate confidence.
// Req 11.6 / 12.4: a benchmark backed by >= 5 real competitors yields a
//           confidence at least 20 points higher than the < 5 case for an
//           otherwise-identical signalProvenance, floored at 0.
// ---------------------------------------------------------------------------

// The complete SignalKey set that the provenance map covers exhaustively.
const ALL_SIGNAL_KEYS: SignalKey[] = [
  'hasWebsite',
  'isInstagramOnly',
  'isFacebookOnly',
  'isOldWebsite',
  'noBookingSystem',
  'noLeadForm',
  'noWhatsApp',
  'noAppointment',
  'reviewCount',
  'rating',
  'competitorAvgReviews',
];

const ALL_HONESTY_LABELS: ProvenanceLabel[] = ['real', 'estimated', 'heuristic', 'unavailable'];

// ---------------------------------------------------------------------------
// Smart generators
// ---------------------------------------------------------------------------

// A SignalProvenance map over all 11 SignalKeys, each key labeled with any of
// the four honesty labels.
const labelArb = fc.constantFrom<ProvenanceLabel>(...ALL_HONESTY_LABELS);

const provenanceArb: fc.Arbitrary<SignalProvenance> = fc
  .record(
    Object.fromEntries(ALL_SIGNAL_KEYS.map((key) => [key, labelArb])) as Record<
      SignalKey,
      fc.Arbitrary<ProvenanceLabel>
    >,
  )
  .map((rec) => rec as SignalProvenance);

// Sample sizes spanning the strong/weak benchmark boundary (0..20).
const sampleSizeArb = fc.nat({ max: 20 });

// A weak (< 5) and a strong (>= 5) sample size.
const weakSampleArb = fc.nat({ max: 4 });
const strongSampleArb = fc.integer({ min: 5, max: 20 });

// An all-`unavailable` provenance map.
const allUnavailable: SignalProvenance = Object.fromEntries(
  ALL_SIGNAL_KEYS.map((key) => [key, 'unavailable' as ProvenanceLabel]),
) as SignalProvenance;

describe('computeConfidence — Property 18: bounded integer with honest contributions', () => {
  // (a) Req 11.2: bounded integer in [0, 100] for arbitrary inputs.
  it('always returns an integer in [0, 100]', () => {
    fc.assert(
      fc.property(provenanceArb, sampleSizeArb, (provenance, sampleSize) => {
        const c = computeConfidence(provenance, sampleSize);
        expect(Number.isInteger(c)).toBe(true);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(100);
      }),
      { numRuns: 300 },
    );
  });

  // (b) Req 11.5: unavailable signals contribute 0.
  // An all-unavailable provenance map with a weak (< 5) sample yields 0.
  it('yields 0 for an all-unavailable map with a weak (< 5) benchmark sample', () => {
    fc.assert(
      fc.property(weakSampleArb, (sampleSize) => {
        expect(computeConfidence(allUnavailable, sampleSize)).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  // (b continued) unavailable signals never increase confidence: flipping any
  // real-heavy signals to `unavailable` can only lower (or equal) the score.
  it('never increases confidence when signals are flipped to unavailable', () => {
    fc.assert(
      fc.property(
        provenanceArb,
        sampleSizeArb,
        // Pick a subset of keys to flip to `unavailable`.
        fc.subarray(ALL_SIGNAL_KEYS),
        (provenance, sampleSize, keysToFlip) => {
          const base = computeConfidence(provenance, sampleSize);

          const flipped: SignalProvenance = { ...provenance };
          for (const key of keysToFlip) {
            flipped[key] = 'unavailable';
          }
          const flippedConfidence = computeConfidence(flipped, sampleSize);

          // Flipping any signals to unavailable can only lower or keep the
          // availability contribution — it can never raise confidence.
          expect(flippedConfidence).toBeLessThanOrEqual(base);
        },
      ),
      { numRuns: 300 },
    );
  });

  // (c) Req 11.6 / 12.4: for the SAME provenance map, a strong (>= 5) sample is
  // at least 20 points higher than a weak (< 5) sample, floored at 0.
  it('gives a strong (>= 5) benchmark at least 20 points more than a weak (< 5) one', () => {
    fc.assert(
      fc.property(
        provenanceArb,
        weakSampleArb,
        strongSampleArb,
        (provenance, weak, strong) => {
          const weakConfidence = computeConfidence(provenance, weak);
          const strongConfidence = computeConfidence(provenance, strong);

          // The delta is exactly the strong-benchmark bonus for the same
          // availability portion, and is >= 20 (floored at 0 keeps both in
          // range but never removes the +20 gap since availability >= 0).
          expect(strongConfidence - weakConfidence).toBeGreaterThanOrEqual(20);
          // And both remain bounded (Req 11.2).
          expect(weakConfidence).toBeGreaterThanOrEqual(0);
          expect(strongConfidence).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 300 },
    );
  });

  // (d) Per-business data-completeness factor. Confidence must stay bounded for
  // any completeness in [0, 1], and lowering completeness can only lower (never
  // raise) confidence for the same provenance + sample. The strong/weak
  // benchmark gap (>= 20) must still hold at a fixed completeness.
  const completenessArb = fc.double({ min: 0, max: 1, noNaN: true });

  it('stays a bounded integer in [0, 100] for any data-completeness factor', () => {
    fc.assert(
      fc.property(provenanceArb, sampleSizeArb, completenessArb, (provenance, sampleSize, completeness) => {
        const c = computeConfidence(provenance, sampleSize, completeness);
        expect(Number.isInteger(c)).toBe(true);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(100);
      }),
      { numRuns: 300 },
    );
  });

  it('is monotonic in completeness: less real data never yields higher confidence', () => {
    fc.assert(
      fc.property(
        provenanceArb,
        sampleSizeArb,
        completenessArb,
        completenessArb,
        (provenance, sampleSize, a, b) => {
          const lo = Math.min(a, b);
          const hi = Math.max(a, b);
          const loConf = computeConfidence(provenance, sampleSize, lo);
          const hiConf = computeConfidence(provenance, sampleSize, hi);
          expect(loConf).toBeLessThanOrEqual(hiConf);
        },
      ),
      { numRuns: 300 },
    );
  });

  it('defaults to full completeness (omitted arg equals dataCompleteness = 1)', () => {
    fc.assert(
      fc.property(provenanceArb, sampleSizeArb, (provenance, sampleSize) => {
        expect(computeConfidence(provenance, sampleSize)).toBe(
          computeConfidence(provenance, sampleSize, 1),
        );
      }),
      { numRuns: 200 },
    );
  });

  it('preserves the >= 20 strong-vs-weak benchmark gap at a fixed completeness', () => {
    fc.assert(
      fc.property(
        provenanceArb,
        weakSampleArb,
        strongSampleArb,
        completenessArb,
        (provenance, weak, strong, completeness) => {
          const weakConf = computeConfidence(provenance, weak, completeness);
          const strongConf = computeConfidence(provenance, strong, completeness);
          expect(strongConf - weakConf).toBeGreaterThanOrEqual(20);
        },
      ),
      { numRuns: 300 },
    );
  });
});

// ---------------------------------------------------------------------------
// computeDataCompleteness: per-business real-data factor in [0, 1].
// ---------------------------------------------------------------------------
const baseSignals: BusinessSignals = {
  hasWebsite: false,
  isInstagramOnly: false,
  isFacebookOnly: false,
  isOldWebsite: false,
  reviewCount: 0,
  rating: 0,
  competitorAvgReviews: 0,
  hasPhone: false,
  hasAddress: false,
  lowRating: false,
  fewReviews: true,
  noBookingSystem: true,
  noLeadForm: true,
  noWhatsApp: true,
  noAppointment: true,
  hasRecentReviews: false,
  hasRecentActivity: false,
};

describe('computeDataCompleteness — per-business real-data factor', () => {
  it('is always within [0, 1]', () => {
    const signalsArb: fc.Arbitrary<BusinessSignals> = fc.record({
      ...Object.fromEntries(
        Object.entries(baseSignals).map(([k, v]) => [
          k,
          typeof v === 'boolean' ? fc.boolean() : fc.nat({ max: 5000 }),
        ]),
      ),
    }) as unknown as fc.Arbitrary<BusinessSignals>;

    fc.assert(
      fc.property(signalsArb, (signals) => {
        const c = computeDataCompleteness(signals);
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }),
      { numRuns: 300 },
    );
  });

  it('scores a fully-populated business at 1.0 and a bare listing near 0', () => {
    const full: BusinessSignals = {
      ...baseSignals,
      hasWebsite: true,
      reviewCount: 42,
      hasPhone: true,
      hasAddress: true,
    };
    expect(computeDataCompleteness(full)).toBeCloseTo(1, 5);

    const bare: BusinessSignals = { ...baseSignals };
    expect(computeDataCompleteness(bare)).toBeCloseTo(0, 5);
  });

  it('gives a real website more credit than a social-only presence', () => {
    const realSite: BusinessSignals = { ...baseSignals, hasWebsite: true };
    const socialOnly: BusinessSignals = { ...baseSignals, isInstagramOnly: true };
    expect(computeDataCompleteness(realSite)).toBeGreaterThan(
      computeDataCompleteness(socialOnly),
    );
  });
});
