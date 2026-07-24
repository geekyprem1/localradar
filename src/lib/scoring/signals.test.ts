// Feature: real-data-intelligence-engine, Property 4: Signals are exhaustively and honestly labeled
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Business } from '@/types';
import { SignalKey, ProvenanceLabel } from '@/types/scoring';
import { extractSignals, WebsiteInspection } from './index';
import {
  ResultSetCompetitorBenchmarkService,
  PlaceLite,
  CompetitorBenchmarkResult,
} from './competitorBenchmark';

// ---------------------------------------------------------------------------
// Validates: Requirements 3.1, 3.2, 3.6
//
// Req 3.1: every emitted signal carries exactly one honesty label. The
//          Signal_Extractor's detection signals use {real, heuristic,
//          unavailable}; the benchmark passthrough signal (competitorAvgReviews)
//          carries the benchmark's own honesty label {real, estimated,
//          unavailable} per the design's provenance-threading model.
// Req 3.2: booking / lead-form / WhatsApp / appointment / website-age signals
//          inferred from website+phone presence (no inspection) → `heuristic`.
//          When an inspection confirms/denies the feature → `real`.
// Req 3.6: Instagram-only / Facebook-only derived ONLY from the website URL.
// ---------------------------------------------------------------------------

// The complete SignalKey set that the provenance map MUST cover exhaustively.
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

// Signals derived directly from real business-record values → always `real`.
const REAL_DERIVED_KEYS: SignalKey[] = [
  'hasWebsite',
  'isInstagramOnly',
  'isFacebookOnly',
  'reviewCount',
  'rating',
];

// Signals that are `heuristic` without inspection and `real` when the matching
// inspection field is provided. Maps SignalKey → inspection field name.
const INSPECTABLE_KEYS: Record<
  Extract<
    SignalKey,
    'isOldWebsite' | 'noBookingSystem' | 'noLeadForm' | 'noWhatsApp' | 'noAppointment'
  >,
  keyof WebsiteInspection
> = {
  isOldWebsite: 'ageConfirmed',
  noBookingSystem: 'bookingConfirmed',
  noLeadForm: 'leadFormConfirmed',
  noWhatsApp: 'chatConfirmed',
  noAppointment: 'appointmentConfirmed',
};

const ALL_HONESTY_LABELS: ProvenanceLabel[] = ['real', 'estimated', 'heuristic', 'unavailable'];

// ---------------------------------------------------------------------------
// Smart generators
// ---------------------------------------------------------------------------

// Website values that exercise every branch of the URL-derived signals:
// empty, whitespace, Instagram (any case), Facebook, and a plain website.
const websiteArb = fc.oneof(
  fc.constant(''),
  fc.constant('   '),
  fc.constant('https://instagram.com/acme'),
  fc.constant('HTTPS://INSTAGRAM.COM/Acme'),
  fc.constant('https://facebook.com/acme'),
  fc.constant('https://www.facebook.com/Acme/'),
  fc.constant('https://acme-plumbing.example'),
  fc.webUrl(),
);

const businessArb: fc.Arbitrary<Business> = fc.record({
  id: fc.uuid(),
  created_at: fc.constant('2024-01-01T00:00:00.000Z'),
  organization_id: fc.uuid(),
  place_id: fc.string({ minLength: 1, maxLength: 12 }),
  name: fc.string({ minLength: 0, maxLength: 40 }),
  website: websiteArb,
  rating: fc.double({ min: 0, max: 5, noNaN: true }),
  reviews_count: fc.nat({ max: 5000 }),
  phone: fc.oneof(fc.constant(''), fc.constant('   '), fc.string({ minLength: 1, maxLength: 15 })),
  address: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 40 })),
});

// Build a realistic benchmark from a live-style result set so sampleSize (and
// thus provenance: real >=3 / estimated 1-2 / unavailable 0) varies naturally.
const benchmarkService = new ResultSetCompetitorBenchmarkService();

const placeLiteArb: fc.Arbitrary<PlaceLite> = fc.record({
  placeId: fc.string({ minLength: 1, maxLength: 12 }),
  rating: fc.double({ min: 0, max: 5, noNaN: true }),
  reviewsCount: fc.nat({ max: 5000 }),
  website: fc.oneof(fc.constant(''), fc.webUrl()),
});

const benchmarkArb: fc.Arbitrary<CompetitorBenchmarkResult> = fc
  .array(placeLiteArb, { maxLength: 8 })
  .map((resultSet) => benchmarkService.build({ scoredPlaceId: 'scored-not-in-set', resultSet }));

// Optional inspection: each field is present (boolean) or absent (undefined).
const optBool = fc.option(fc.boolean(), { nil: undefined });
const inspectionArb: fc.Arbitrary<WebsiteInspection | undefined> = fc.option(
  fc.record({
    bookingConfirmed: optBool,
    leadFormConfirmed: optBool,
    chatConfirmed: optBool,
    appointmentConfirmed: optBool,
    ageConfirmed: optBool,
  }),
  { nil: undefined },
);

describe('extractSignals — Property 4: signals are exhaustively and honestly labeled', () => {
  it('assigns every SignalKey exactly one honest label, heuristic vs real per inspection, URL-derived social flags', () => {
    fc.assert(
      fc.property(
        businessArb,
        benchmarkArb,
        inspectionArb,
        (business, benchmark, inspection) => {
          const { signals, provenance } = extractSignals(business, benchmark, inspection);

          // --- Req 3.1: exhaustive coverage ---------------------------------
          // Every SignalKey present in the signals must have a label, and the
          // provenance map must contain exactly the known SignalKey set.
          const provKeys = Object.keys(provenance).sort();
          expect(provKeys).toEqual([...ALL_SIGNAL_KEYS].sort());

          for (const key of ALL_SIGNAL_KEYS) {
            const label = provenance[key];
            // Exactly one label, drawn from the honesty label set.
            expect(ALL_HONESTY_LABELS).toContain(label);
          }

          // --- Req 3.6 + 3.1: URL-derived / real-derived signals ------------
          const website = (business.website || '').trim().toLowerCase();
          const expectInstagram = website.includes('instagram.com');
          const expectFacebook = website.includes('facebook.com') && !expectInstagram;
          const expectHasWebsite =
            website.length > 0 &&
            !website.includes('instagram.com') &&
            !website.includes('facebook.com');

          // Instagram-only / Facebook-only derived ONLY from the website URL.
          expect(signals.isInstagramOnly).toBe(expectInstagram);
          expect(signals.isFacebookOnly).toBe(expectFacebook);
          expect(signals.hasWebsite).toBe(expectHasWebsite);

          // These signals come straight from real record values → `real`.
          for (const key of REAL_DERIVED_KEYS) {
            expect(provenance[key]).toBe('real');
          }
          // Confined to {real, heuristic, unavailable} (Req 3.1 enumerated set).
          for (const key of REAL_DERIVED_KEYS) {
            expect(['real', 'heuristic', 'unavailable']).toContain(provenance[key]);
          }

          // --- Req 3.2 / 3.5: inspectable signals ---------------------------
          for (const key of Object.keys(INSPECTABLE_KEYS) as (keyof typeof INSPECTABLE_KEYS)[]) {
            const field = INSPECTABLE_KEYS[key];
            const inspected = inspection?.[field];
            const label = provenance[key];

            // Confined to {real, heuristic, unavailable} (Req 3.1 enumerated set).
            expect(['real', 'heuristic', 'unavailable']).toContain(label);

            if (inspected === undefined) {
              // No inspection value → inferred from website+phone → heuristic.
              expect(label).toBe('heuristic');
            } else {
              // Inspection confirmed/denied the feature → real detection.
              expect(label).toBe('real');
            }
          }

          // --- Req 3.1: benchmark passthrough signal ------------------------
          // competitorAvgReviews carries the benchmark's honesty label when a
          // sample exists, otherwise `unavailable`.
          const benchmarkAvailable = benchmark.competitorAvgReviews !== null;
          if (benchmarkAvailable) {
            expect(provenance.competitorAvgReviews).toBe(benchmark.provenance);
          } else {
            expect(provenance.competitorAvgReviews).toBe('unavailable');
          }
          expect(['real', 'estimated', 'unavailable']).toContain(
            provenance.competitorAvgReviews,
          );
        },
      ),
      { numRuns: 200 },
    );
  });

  it('is deterministic: identical inputs produce identical labels', () => {
    fc.assert(
      fc.property(businessArb, benchmarkArb, inspectionArb, (business, benchmark, inspection) => {
        const a = extractSignals(business, benchmark, inspection);
        const b = extractSignals(business, benchmark, inspection);
        expect(a.provenance).toEqual(b.provenance);
      }),
      { numRuns: 100 },
    );
  });
});
