// Feature: real-data-intelligence-engine, Property 5: Reason phrasing matches provenance
//
// Property 5 validates that `phraseReason(text, label)` rewrites a raw reason so its
// wording matches the provenance of the signal it describes (Req 3.3, 3.4, 3.5):
//   - `heuristic`: assumption language only — no standalone confirmation term
//     (detected/confirmed/verified/found), except the allowed phrase "not verified",
//     and at least one assumption marker is present.
//   - `unavailable` / `estimated`: no standalone confirmation term.
//   - `real`: content is preserved unchanged (confirmation language may stand).
//
// Validates: Requirements 3.3, 3.4, 3.5
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { phraseReason } from './index';
import { ProvenanceLabel } from '@/types/scoring';

// ---------------------------------------------------------------------------
// Independent reference checks (written from the acceptance criteria, not by
// reusing the implementation, so the property is a true cross-check).
// ---------------------------------------------------------------------------

/** Confirmation verbs that must never appear as a confirmed detection on a non-real label. */
const CONFIRMATION_TERM = /\b(detected|confirmed|verified|found)\b/i;

/** Assumption markers that satisfy the heuristic phrasing rule (Req 3.3). */
const ASSUMPTION_MARKERS = ['likely', 'may', 'possibly', 'not verified'];

/** Remove the allowed "not verified" phrase before scanning for confirmation terms. */
function withoutAllowedPhrase(text: string): string {
  return text.replace(/\bnot verified\b/gi, ' ');
}

function hasConfirmationTerm(text: string): boolean {
  return CONFIRMATION_TERM.test(withoutAllowedPhrase(text));
}

function hasAssumptionMarker(text: string): boolean {
  const lower = text.toLowerCase();
  return ASSUMPTION_MARKERS.some((marker) => lower.includes(marker));
}

// ---------------------------------------------------------------------------
// Smart generators: bias the text toward strings that actually exercise the
// rewrite rules (embedded confirmation terms and the allowed "not verified"
// phrase), mixed with arbitrary tokens and free-form strings.
// ---------------------------------------------------------------------------

const tokenArb = fc.oneof(
  fc.constantFrom(
    'detected',
    'confirmed',
    'verified',
    'found',
    'not verified',
    'Detected',
    'CONFIRMED',
    'Verified',
    'FOUND',
    'booking',
    'system',
    'website',
    'the',
    'a',
    'online',
    'presence',
    'founded', // near-miss that must NOT be treated as "found"
  ),
  fc.string(),
);

// Non-blank reason text (a reason with no visible content is not meaningful to phrase).
const reasonTextArb = fc
  .array(tokenArb, { minLength: 1, maxLength: 8 })
  .map((tokens) => tokens.join(' '))
  .filter((s) => s.trim().length > 0);

const labelArb: fc.Arbitrary<ProvenanceLabel> = fc.constantFrom(
  'real',
  'estimated',
  'heuristic',
  'unavailable',
);

describe('phraseReason', () => {
  it('Property 5: heuristic reasons use assumption language and drop confirmation terms', () => {
    fc.assert(
      fc.property(reasonTextArb, (text) => {
        const out = phraseReason(text, 'heuristic');
        // No standalone confirmation term survives (except the allowed "not verified").
        expect(hasConfirmationTerm(out)).toBe(false);
        // The reason reads as an assumption.
        expect(hasAssumptionMarker(out)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('Property 5: unavailable/estimated reasons contain no confirmed-detection wording', () => {
    fc.assert(
      fc.property(
        reasonTextArb,
        fc.constantFrom<ProvenanceLabel>('unavailable', 'estimated'),
        (text, label) => {
          const out = phraseReason(text, label);
          expect(hasConfirmationTerm(out)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('Property 5: real reasons preserve their content (confirmation language may stand)', () => {
    fc.assert(
      fc.property(reasonTextArb, (text) => {
        const out = phraseReason(text, 'real');
        // Real signals are backed by an actual inspection, so wording is retained verbatim.
        expect(out).toBe(text.trim());
      }),
      { numRuns: 200 },
    );
  });

  it('Property 5: any non-real label never emits a confirmed-detection term', () => {
    fc.assert(
      fc.property(reasonTextArb, labelArb, (text, label) => {
        const out = phraseReason(text, label);
        if (label !== 'real') {
          expect(hasConfirmationTerm(out)).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });
});
