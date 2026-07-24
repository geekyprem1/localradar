import { Audit } from '@/types';
import {
  ScoredOpportunity,
  ScoreComponent,
  SignalProvenance,
  SignalKey,
  ProvenanceLabel,
} from '@/types/scoring';
import { phraseReason } from './index';

/**
 * Audit_Generator — presence-based, honestly-phrased audit messages.
 *
 * Replaces the legacy `generateMockAudit` (src/lib/mockData.ts). Instead of
 * applying fixed numeric thresholds to weight-scaled component scores (e.g.
 * `opp.website_score >= 20`), each audit message is derived from the *presence*
 * of signals in the semantically-matching opportunity component and phrased
 * according to that signal's provenance:
 *
 *   - website_issues  ← websiteOpportunity (website weakness/absence)
 *   - review_issues   ← reviewGap          (review deficit vs benchmark)
 *   - seo_issues      ← gbpWeakness        (Google Business Profile weakness)
 *   - gbp_issues      ← revenueLeakage     (booking / lead-capture leakage)
 *   - social_issues   ← growthIntent       (activity / growth intent)
 *
 * Honesty rules (Req 8):
 *   - 8.2 Each message comes only from its semantically-corresponding component.
 *   - 8.3 A social-only / no-website business produces no "outdated website
 *         detected" message (that signal is simply not present, so no reason is
 *         emitted for it).
 *   - 8.4 Messages come from signal presence (a component actually produced a
 *         reason), never from thresholds on weight-scaled scores.
 *   - 8.5 Heuristic-labeled signals are phrased with assumption language via the
 *         central `phraseReason` helper.
 *   - 8.6 Signals labeled `unavailable` produce no confirmed-detection message.
 */

/**
 * Default provenance for each signal when the ScoredOpportunity does not carry
 * an explicit `signalProvenance` map. These mirror the engine's honest defaults
 * (Req 3.2): website-age and booking/lead-capture signals are inferred rather
 * than inspected, so they default to `heuristic`; presence signals derived from
 * real URL/Places data default to `real`; the competitor average is `estimated`.
 */
const DEFAULT_SIGNAL_LABELS: Record<SignalKey, ProvenanceLabel> = {
  hasWebsite: 'real',
  isInstagramOnly: 'real',
  isFacebookOnly: 'real',
  isOldWebsite: 'heuristic',
  noBookingSystem: 'heuristic',
  noLeadForm: 'heuristic',
  noWhatsApp: 'heuristic',
  noAppointment: 'heuristic',
  reviewCount: 'real',
  rating: 'real',
  competitorAvgReviews: 'estimated',
};

/** Signals that semantically feed each opportunity component. */
const REVIEW_SIGNALS: SignalKey[] = ['reviewCount', 'rating', 'competitorAvgReviews'];
const BOOKING_SIGNALS: SignalKey[] = ['noBookingSystem', 'noLeadForm', 'noWhatsApp', 'noAppointment'];

function labelFor(key: SignalKey, provenance?: SignalProvenance): ProvenanceLabel {
  return provenance?.[key] ?? DEFAULT_SIGNAL_LABELS[key];
}

/**
 * Resolve a single phrasing label for a component from its contributing signals.
 * Severity order: if every contributing signal is `unavailable` the component is
 * treated as unavailable (its messages are dropped, Req 8.6); otherwise the most
 * cautious present label wins so nothing is over-stated (heuristic > estimated >
 * real).
 */
function resolveComponentLabel(keys: SignalKey[], provenance?: SignalProvenance): ProvenanceLabel {
  const labels = keys.map((k) => labelFor(k, provenance));
  if (labels.length > 0 && labels.every((l) => l === 'unavailable')) return 'unavailable';
  if (labels.some((l) => l === 'heuristic')) return 'heuristic';
  if (labels.some((l) => l === 'estimated')) return 'estimated';
  return 'real';
}

/**
 * Determine the phrasing label for a single website reason. The website
 * component emits exactly one reason describing the dominant weakness, so we key
 * off its content: an "outdated website" reason is driven by the heuristic
 * `isOldWebsite` signal, while no-website / social-only reasons are derived from
 * real URL values.
 */
function websiteReasonLabel(reason: string, provenance?: SignalProvenance): ProvenanceLabel {
  if (/outdated/i.test(reason)) {
    return labelFor('isOldWebsite', provenance);
  }
  return 'real';
}

/**
 * Push the phrased reasons of a component into the target issue list, dropping
 * everything when the component's signals are unavailable (Req 8.6). Returns
 * whether any message was emitted (used to decide recommended services).
 */
function emitComponentIssues(
  target: string[],
  component: ScoreComponent,
  label: ProvenanceLabel,
): boolean {
  if (label === 'unavailable' || component.reasons.length === 0) return false;
  for (const reason of component.reasons) {
    const phrased = phraseReason(reason, label);
    if (phrased.length > 0) target.push(phrased);
  }
  return target.length > 0;
}

export function generateAudit(scored: ScoredOpportunity): Audit {
  const { breakdown, signalProvenance } = scored;

  const websiteIssues: string[] = [];
  const seoIssues: string[] = [];
  const reviewIssues: string[] = [];
  const gbpIssues: string[] = [];
  const socialIssues: string[] = [];
  const recommendedServices: string[] = [];

  // ── Website (websiteOpportunity) — phrased per-reason so "outdated" (heuristic)
  //     never reads as a confirmed detection, and social-only businesses emit no
  //     "outdated website" message at all (Req 8.3, 8.4, 8.5).
  for (const reason of breakdown.websiteOpportunity.reasons) {
    const label = websiteReasonLabel(reason, signalProvenance);
    if (label === 'unavailable') continue;
    const phrased = phraseReason(reason, label);
    if (phrased.length === 0) continue;
    websiteIssues.push(phrased);
    if (/no website detected/i.test(reason)) {
      recommendedServices.push('Custom high-converting website design & deployment');
    } else if (/instagram-only|facebook-only/i.test(reason)) {
      recommendedServices.push('Conversion-focused website to capture social traffic');
    } else if (/outdated/i.test(reason)) {
      recommendedServices.push('Website redesign & mobile optimization');
    }
  }

  // ── Reviews (reviewGap) — deficit vs the competitor benchmark (Req 8.2).
  if (
    emitComponentIssues(
      reviewIssues,
      breakdown.reviewGap,
      resolveComponentLabel(REVIEW_SIGNALS, signalProvenance),
    )
  ) {
    recommendedServices.push('Review generation & reputation campaign');
  }

  // ── SEO / Google Business Profile weakness (gbpWeakness). Derived from real
  //     Places listing data (phone/address/rating/review count), so `real`.
  if (emitComponentIssues(seoIssues, breakdown.gbpWeakness, 'real')) {
    recommendedServices.push('Local SEO & Google Business Profile optimization');
  }

  // ── Booking / lead-capture leakage (revenueLeakage). These signals are
  //     inferred (heuristic) by default, so messages read as assumptions and an
  //     all-unavailable component emits nothing (Req 8.5, 8.6).
  if (
    emitComponentIssues(
      gbpIssues,
      breakdown.revenueLeakage,
      resolveComponentLabel(BOOKING_SIGNALS, signalProvenance),
    )
  ) {
    recommendedServices.push('Online booking & lead capture setup');
  }

  // ── Growth intent / activity (growthIntent). Derived from real activity data.
  if (emitComponentIssues(socialIssues, breakdown.growthIntent, 'real')) {
    recommendedServices.push('Social media branding & automation');
  }

  if (recommendedServices.length === 0) {
    recommendedServices.push('AI chatbot lead capture integration');
  }

  return {
    id: '',
    created_at: new Date().toISOString(),
    business_id: '',
    website_issues: websiteIssues,
    seo_issues: seoIssues,
    review_issues: reviewIssues,
    gbp_issues: gbpIssues,
    social_issues: socialIssues,
    recommended_services: recommendedServices,
  };
}
