import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isUsableKey } from './apiKey';

// Feature: real-data-intelligence-engine, Property 16: API key usability classification
// Validates: Requirements 10.3

/**
 * Known placeholder substrings that mark a key as unusable. Mirrors the
 * classifier's own list; a key containing any of these (case-insensitively)
 * must be rejected. (Req 10.3)
 */
const PLACEHOLDER_PATTERNS = [
  'your-api-key',
  'your_api_key',
  'yourapikey',
  'your-google-places-key',
  'changeme',
  'change-me',
  'placeholder',
  'example',
  'todo',
  'xxxx',
] as const;

/** Randomly re-case each character of `base` (e.g. "MOCK-key", "Mock-Key"). */
function caseVariant(base: string): fc.Arbitrary<string> {
  return fc
    .tuple(
      ...[...base].map((ch) =>
        fc.boolean().map((upper) => (upper ? ch.toUpperCase() : ch.toLowerCase()))
      )
    )
    .map((chars) => chars.join(''));
}

/**
 * Unusable keys: empty/whitespace-only, null, undefined, the sandbox sentinel
 * 'mock-key' (any casing), and any string embedding a known placeholder pattern
 * (any casing, with arbitrary surrounding text). (Req 10.3)
 */
const unusableKeyArb: fc.Arbitrary<string | null | undefined> = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(''),
  // whitespace-only
  fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 8 }),
  // 'mock-key' in any casing, possibly padded with surrounding whitespace
  caseVariant('mock-key').chain((mid) =>
    fc
      .tuple(
        fc.stringOf(fc.constantFrom(' ', '\t'), { maxLength: 3 }),
        fc.stringOf(fc.constantFrom(' ', '\t'), { maxLength: 3 })
      )
      .map(([pre, post]) => `${pre}${mid}${post}`)
  ),
  // any placeholder pattern embedded in arbitrary (non-placeholder-conflicting) text
  fc
    .constantFrom(...PLACEHOLDER_PATTERNS)
    .chain((p) =>
      fc
        .tuple(caseVariant(p), fc.stringMatching(/^[a-zA-Z0-9]*$/), fc.stringMatching(/^[a-zA-Z0-9]*$/))
        .map(([pat, pre, post]) => `${pre}${pat}${post}`)
    )
);

/**
 * Plausible real keys: alphanumeric (plus '-' and '_') strings of length >= 20
 * that do NOT contain any placeholder substring and are not the 'mock-key'
 * sentinel. Models realistic 'AIza...'-style provider keys. (Req 10.3)
 */
const realKeyArb: fc.Arbitrary<string> = fc
  .stringOf(
    fc.constantFrom(
      ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('')
    ),
    { minLength: 20, maxLength: 60 }
  )
  .map((s) => `AIza${s}`)
  .filter((s) => {
    const lower = s.toLowerCase();
    if (lower.trim() === 'mock-key') return false;
    return !PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
  });

describe('isUsableKey API key usability classification', () => {
  // Feature: real-data-intelligence-engine, Property 16: API key usability classification
  // Validates: Requirements 10.3
  it('rejects empty, whitespace, null, undefined, mock-key, and placeholder keys (Property 16)', () => {
    fc.assert(
      fc.property(unusableKeyArb, (key) => {
        expect(isUsableKey(key)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  // Feature: real-data-intelligence-engine, Property 16: API key usability classification
  // Validates: Requirements 10.3
  it('accepts plausibly-valid configured keys with no placeholder substring (Property 16)', () => {
    fc.assert(
      fc.property(realKeyArb, (key) => {
        expect(isUsableKey(key)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });
});
