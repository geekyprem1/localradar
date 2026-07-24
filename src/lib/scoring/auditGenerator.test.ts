// Feature: real-data-intelligence-engine, Property 14: Audit messages are presence-derived from the correct component and honestly phrased
//
// Property 14 validates the Audit_Generator's honesty contract (Req 8.2–8.6):
//   - 8.2 Each audit message is derived exclusively from the opportunity component
//         that semantically corresponds to that message category.
//   - 8.3 A business with no website and a social-only presence produces no
//         website-category message stating an outdated/slow website was detected.
//   - 8.4 Messages are derived from the presence of component reasons, not from
//         fixed numeric thresholds on weight-scaled scores.
//   - 8.5 Messages derived from `heuristic` signals use assumption language and no
//         confirmation terms.
//   - 8.6 Messages derived from `unavailable` signals never read as confirmed
//         detections.
//
// Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateAudit } from './auditGenerator';
import {
  ScoredOpportunity,
  ScoreComponent,
  OpportunityBreakdown,
  SignalProvenance,
  ProvenanceLabel,
  DealValueResult,
  ServiceFitResult,
  CompetitorBenchmark,
} from '@/types/scoring';

// ---------------------------------------------------------------------------
// Realistic reason pools — the exact strings each Opportunity_Scorer component
// emits (see calc*Percent in opportunityScore.ts). Kept disjoint in content so
// a message can be traced back to exactly one component.
// ---------------------------------------------------------------------------

const WEBSITE_NO_SITE = 'No website detected — full web design opportunity (100% gap)';
const WEBSITE_INSTAGRAM = 'No website — Instagram-only presence (75% gap)';
const WEBSITE_FACEBOOK = 'No website — Facebook-only presence (65% gap)';
const WEBSITE_OUTDATED = 'Outdated website detected — redesign opportunity (50% gap)';
const WEBSITE_REASONS = [WEBSITE_NO_SITE, WEBSITE_INSTAGRAM, WEBSITE_FACEBOOK, WEBSITE_OUTDATED];

const REVIEW_REASONS = [
  'Reviews 150 below competitor average — major gap',
  'Below-average rating (3.2 ⭐) below competitor average',
];

const GBP_REASONS = [
  'Incomplete Google listing: phone number is missing',
  'Incomplete Google listing: address is missing',
  'Low public rating (3.5 ⭐) harming local visibility',
  'Fewer than 10 customer reviews on profile',
];

const REVENUE_REASONS = [
  'No direct booking engine detected (40% leakage)',
  'No conversion lead form detected on domain (30% leakage)',
  'Missing instant WhatsApp/chat integration (20% leakage)',
  'No automated scheduling option available (10% leakage)',
];

const GROWTH_REASONS = [
  'Lacks recent customer review velocity (inactive)',
  'Profile shows zero recent updates or listing activity',
];

// ---------------------------------------------------------------------------
// Independent reference checks, written from the acceptance criteria (not by
// reusing the implementation, so the property is a true cross-check).
// ---------------------------------------------------------------------------

/** Confirmation verbs that must not read as a confirmed detection (Req 8.5, 8.6). */
const CONFIRMATION_TERM = /\b(detected|confirmed|verified|found)\b/i;
/** Assumption markers that satisfy the heuristic phrasing rule (Req 8.5). */
const ASSUMPTION_MARKERS = ['likely', 'may', 'possibly', 'not verified'];

function withoutAllowedPhrase(text: string): string {
  return text.replace(/\bnot verified\b/gi, ' ');
}
function hasConfirmationTerm(text: string): boolean {
  return CONFIRMATION_TERM.test(withoutAllowedPhrase(text));
}
function hasAssumptionMarker(text: string): boolean {
  const lower = text.toLowerCase();
  return ASSUMPTION_MARKERS.some((m) => lower.includes(m));
}

/**
 * Reduce a reason/message to its stable "core" content by stripping the words
 * that phrasing may rewrite (confirmation terms and their assumption-language
 * replacements) plus punctuation/symbols. Two strings share a core iff they
 * describe the same underlying weakness regardless of provenance phrasing. Used
 * to trace an emitted audit message back to a source reason.
 */
function core(text: string): string {
  return text
    .toLowerCase()
    .replace(/\bnot verified\b/g, ' ')
    .replace(/\b(detected|confirmed|verified|found|likely|assumed|present|may|possibly)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every emitted message must trace back to a reason in its own component. */
function assertDerivedFrom(messages: string[], componentReasons: string[]): void {
  const reasonCores = componentReasons.map(core);
  for (const m of messages) {
    expect(reasonCores).toContain(core(m));
  }
}

// ---------------------------------------------------------------------------
// Fixture + generators.
// ---------------------------------------------------------------------------

const DEAL_VALUE: DealValueResult = {
  min: 1000,
  max: 3000,
  representative: 2000,
  formatted: '$1,000–$3,000',
  services: ['Website redesign'],
  provenance: 'estimated',
};

const SERVICE_FIT: ServiceFitResult = {
  agencyType: 'Web Design',
  score: 80,
  level: 'Strong Fit',
  reasons: ['Strong website opportunity'],
};

const BENCHMARK: CompetitorBenchmark = {
  currentReviews: 10,
  competitorAvgReviews: 120,
  currentRating: 4.1,
  competitorAvgRating: 4.5,
  hasWebsite: true,
  competitorWebsiteRatio: 90,
  hasBooking: false,
  competitorBookingRatio: 70,
  provenance: 'estimated',
  sampleSize: 4,
};

function makeComponent(name: string, reasons: string[]): ScoreComponent {
  return { name, score: 10, maxScore: 25, reasons };
}

function makeBreakdown(reasons: {
  website: string[];
  review: string[];
  gbp: string[];
  revenue: string[];
  growth: string[];
}): OpportunityBreakdown {
  return {
    websiteOpportunity: makeComponent('Website Opportunity', reasons.website),
    reviewGap: makeComponent('Review Gap Deficit', reasons.review),
    gbpWeakness: makeComponent('Google Business Weakness', reasons.gbp),
    revenueLeakage: makeComponent('Revenue Leakage Points', reasons.revenue),
    growthIntent: makeComponent('Growth Intent Indicator', reasons.growth),
  };
}

function makeScored(
  breakdown: OpportunityBreakdown,
  signalProvenance: SignalProvenance,
): ScoredOpportunity {
  return {
    opportunityScore: 60,
    opportunityLevel: 'High',
    closingProbability: 50,
    dealValue: DEAL_VALUE,
    confidenceScore: 50,
    businessSize: 'Small Clinic',
    competitorBenchmark: BENCHMARK,
    category: 'Dentists',
    signalProvenance,
    serviceFitScores: [SERVICE_FIT],
    bestFit: SERVICE_FIT,
    breakdown,
    reasons: [],
    websiteScore: breakdown.websiteOpportunity.score,
    reviewsScore: breakdown.reviewGap.score,
    seoScore: breakdown.gbpWeakness.score,
    gbpScore: breakdown.revenueLeakage.score,
    socialScore: breakdown.growthIntent.score,
  };
}

const ALL_KEYS: (keyof SignalProvenance)[] = [
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

function provWith(label: ProvenanceLabel, overrides: Partial<SignalProvenance> = {}): SignalProvenance {
  const base = {} as SignalProvenance;
  for (const k of ALL_KEYS) base[k] = label;
  return { ...base, ...overrides };
}

const labelArb = fc.constantFrom<ProvenanceLabel>('real', 'estimated', 'heuristic', 'unavailable');

const provenanceArb: fc.Arbitrary<SignalProvenance> = fc.record({
  hasWebsite: labelArb,
  isInstagramOnly: labelArb,
  isFacebookOnly: labelArb,
  isOldWebsite: labelArb,
  noBookingSystem: labelArb,
  noLeadForm: labelArb,
  noWhatsApp: labelArb,
  noAppointment: labelArb,
  reviewCount: labelArb,
  rating: labelArb,
  competitorAvgReviews: labelArb,
});

// The website component emits at most one reason.
const websiteReasonsArb = fc.oneof(
  fc.constant<string[]>([]),
  fc.constantFrom(...WEBSITE_REASONS).map((r) => [r]),
);

const breakdownArb: fc.Arbitrary<OpportunityBreakdown> = fc
  .record({
    website: websiteReasonsArb,
    review: fc.subarray(REVIEW_REASONS),
    gbp: fc.subarray(GBP_REASONS),
    revenue: fc.subarray(REVENUE_REASONS),
    growth: fc.subarray(GROWTH_REASONS),
  })
  .map(makeBreakdown);

describe('generateAudit', () => {
  it('Property 14 (8.2/8.4): each issue list is derived only from its semantically-corresponding component', () => {
    fc.assert(
      fc.property(breakdownArb, provenanceArb, (breakdown, provenance) => {
        const audit = generateAudit(makeScored(breakdown, provenance));
        assertDerivedFrom(audit.website_issues, breakdown.websiteOpportunity.reasons);
        assertDerivedFrom(audit.review_issues, breakdown.reviewGap.reasons);
        assertDerivedFrom(audit.seo_issues, breakdown.gbpWeakness.reasons);
        assertDerivedFrom(audit.gbp_issues, breakdown.revenueLeakage.reasons);
        assertDerivedFrom(audit.social_issues, breakdown.growthIntent.reasons);
      }),
      { numRuns: 200 },
    );
  });

  it('Property 14 (8.3): a no-website social-only business emits no "outdated/slow website detected" message', () => {
    const socialReasonArb = fc.constantFrom(WEBSITE_INSTAGRAM, WEBSITE_FACEBOOK);
    fc.assert(
      fc.property(socialReasonArb, provenanceArb, (websiteReason, provenance) => {
        const breakdown = makeBreakdown({
          website: [websiteReason],
          review: REVIEW_REASONS,
          gbp: GBP_REASONS,
          revenue: REVENUE_REASONS,
          growth: GROWTH_REASONS,
        });
        const audit = generateAudit(makeScored(breakdown, provenance));
        for (const msg of audit.website_issues) {
          expect(/outdated/i.test(msg)).toBe(false);
          expect(/slow/i.test(msg)).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('Property 14 (8.5): messages from heuristic-labeled signals use assumption language and no confirmation terms', () => {
    const heuristicProv = provWith('real', {
      isOldWebsite: 'heuristic',
      noBookingSystem: 'heuristic',
      noLeadForm: 'heuristic',
      noWhatsApp: 'heuristic',
      noAppointment: 'heuristic',
      reviewCount: 'heuristic',
      rating: 'heuristic',
      competitorAvgReviews: 'heuristic',
    });
    fc.assert(
      fc.property(
        fc.subarray(REVENUE_REASONS, { minLength: 1 }),
        fc.subarray(REVIEW_REASONS, { minLength: 1 }),
        (revenueReasons, reviewReasons) => {
          const breakdown = makeBreakdown({
            website: [WEBSITE_OUTDATED],
            review: reviewReasons,
            gbp: [],
            revenue: revenueReasons,
            growth: [],
          });
          const audit = generateAudit(makeScored(breakdown, heuristicProv));

          const heuristicMessages = [
            ...audit.website_issues, // outdated → driven by heuristic isOldWebsite
            ...audit.review_issues, // reviewGap → heuristic review signals
            ...audit.gbp_issues, // revenueLeakage → heuristic booking signals
          ];
          // The heuristic components actually produced messages (test is meaningful).
          expect(heuristicMessages.length).toBeGreaterThan(0);
          for (const msg of heuristicMessages) {
            expect(hasConfirmationTerm(msg)).toBe(false);
            expect(hasAssumptionMarker(msg)).toBe(true);
          }
        },
      ),
      { numRuns: 150 },
    );
  });

  it('Property 14 (8.6): a component whose contributing signals are all unavailable emits no confirmed-detection message', () => {
    const unavailableProv = provWith('real', {
      isOldWebsite: 'unavailable',
      noBookingSystem: 'unavailable',
      noLeadForm: 'unavailable',
      noWhatsApp: 'unavailable',
      noAppointment: 'unavailable',
      reviewCount: 'unavailable',
      rating: 'unavailable',
      competitorAvgReviews: 'unavailable',
    });
    fc.assert(
      fc.property(
        fc.subarray(REVENUE_REASONS, { minLength: 1 }),
        fc.subarray(REVIEW_REASONS, { minLength: 1 }),
        (revenueReasons, reviewReasons) => {
          const breakdown = makeBreakdown({
            website: [WEBSITE_OUTDATED], // outdated reason is heuristic-derived → unavailable here
            review: reviewReasons,
            gbp: [],
            revenue: revenueReasons,
            growth: [],
          });
          const audit = generateAudit(makeScored(breakdown, unavailableProv));

          // Unavailable-signal components emit nothing at all — and therefore no
          // confirmed-detection message.
          expect(audit.gbp_issues).toEqual([]);
          expect(audit.review_issues).toEqual([]);
          for (const msg of audit.website_issues) {
            expect(/outdated/i.test(msg)).toBe(false);
            expect(hasConfirmationTerm(msg)).toBe(false);
          }
        },
      ),
      { numRuns: 150 },
    );
  });
});
