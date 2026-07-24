import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  getCurrencyForCountry,
  formatCurrency,
  formatCurrencyRange,
} from './currency';

/**
 * Supported countries and the currency code each MUST resolve to.
 * (Req 4.3 — supported set: United States, India, Canada, United Kingdom, Australia.)
 */
const SUPPORTED = [
  { name: 'United States', code: 'USD' },
  { name: 'India', code: 'INR' },
  { name: 'Canada', code: 'CAD' },
  { name: 'United Kingdom', code: 'GBP' },
  { name: 'Australia', code: 'AUD' },
] as const;

const SUPPORTED_NAMES = new Set(SUPPORTED.map((c) => c.name.toLowerCase()));

/** Strip every non-digit character, leaving only the numeric magnitude's digits. */
const digitsOf = (s: string): string => s.replace(/\D/g, '');

/** Randomly re-case each character of `base` (e.g. "iNdIa", "INDIA", "india"). */
function caseVariant(base: string): fc.Arbitrary<string> {
  return fc
    .tuple(
      ...[...base].map((ch) =>
        fc.boolean().map((upper) => (upper ? ch.toUpperCase() : ch.toLowerCase()))
      )
    )
    .map((chars) => chars.join(''));
}

/** A supported country in an arbitrary letter-casing, paired with its expected code. */
const supportedCountryArb = fc
  .constantFrom(...SUPPORTED)
  .chain((c) => caseVariant(c.name).map((input) => ({ input, code: c.code })));

/** Empty / null / undefined / any string that is not a supported country name. */
const unsupportedCountryArb = fc.oneof(
  fc.constant(''),
  fc.constant(null),
  fc.constant(undefined),
  fc
    .string()
    .filter((s) => !SUPPORTED_NAMES.has(s.trim().toLowerCase()))
);

/** Non-negative integer amounts within the documented deal-value magnitude. */
const amountArb = fc.nat({ max: 999_999_999 });

describe('currency multi-currency formatting', () => {
  // Feature: real-data-intelligence-engine, Property 12: Multi-currency formats without conversion
  // Validates: Requirements 4.2, 4.3, 4.4, 4.5
  it('preserves numeric magnitude across currencies with no FX conversion (Property 12)', () => {
    fc.assert(
      fc.property(amountArb, supportedCountryArb, supportedCountryArb, (amount, a, b) => {
        const expectedDigits = String(amount);

        // Case-insensitive resolution to the correct currency code (Req 4.3).
        expect(getCurrencyForCountry(a.input).code).toBe(a.code);
        expect(getCurrencyForCountry(b.input).code).toBe(b.code);

        // Formatting only reformats — the underlying magnitude is unchanged (Req 4.2, 4.5).
        // No FX scaling: the same amount in two currencies keeps identical digit runs.
        const formattedA = formatCurrency(amount, a.input);
        const formattedB = formatCurrency(amount, b.input);
        expect(digitsOf(formattedA)).toBe(expectedDigits);
        expect(digitsOf(formattedB)).toBe(expectedDigits);
        expect(digitsOf(formattedA)).toBe(digitsOf(formattedB));
      }),
      { numRuns: 200 }
    );
  });

  // Validates: Requirement 4.4 (default USD)
  it('defaults empty/null/unsupported countries to USD without altering magnitude', () => {
    fc.assert(
      fc.property(amountArb, unsupportedCountryArb, (amount, country) => {
        expect(getCurrencyForCountry(country).code).toBe('USD');
        // Magnitude preserved and matches the USD-formatted amount (no conversion).
        expect(digitsOf(formatCurrency(amount, country))).toBe(String(amount));
        expect(formatCurrency(amount, country)).toBe(formatCurrency(amount, 'United States'));
      }),
      { numRuns: 200 }
    );
  });

  // Validates: Requirement 4.2 (range formats both endpoints, no conversion)
  it('formatCurrencyRange formats both endpoints without conversion', () => {
    fc.assert(
      fc.property(amountArb, amountArb, supportedCountryArb, (x, y, c) => {
        const min = Math.min(x, y);
        const max = Math.max(x, y);
        const range = formatCurrencyRange(min, max, c.input);

        // Both endpoints appear formatted with the resolved currency (Req 4.2).
        expect(range).toContain(formatCurrency(min, c.input));
        expect(range).toContain(formatCurrency(max, c.input));

        // Endpoint magnitudes are preserved (no FX scaling of either bound).
        expect(digitsOf(formatCurrency(min, c.input))).toBe(String(min));
        expect(digitsOf(formatCurrency(max, c.input))).toBe(String(max));
      }),
      { numRuns: 200 }
    );
  });
});
