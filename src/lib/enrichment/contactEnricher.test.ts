import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  NoGuessContactEnricher,
  type ContactFields,
} from './contactEnricher';
import type { ProvenanceLabel } from '@/types/scoring';

// The default enricher may only ever use these three labels (Req 1.2).
const ALLOWED_DEFAULT_LABELS: ReadonlySet<ProvenanceLabel> = new Set<ProvenanceLabel>([
  'real',
  'estimated',
  'unavailable',
]);

/** Extract a bare domain from an arbitrary website string, mirroring the kind
 *  of value a naive pattern-guesser would build addresses from. Returns '' when
 *  no domain can be derived. */
function extractDomain(website: string): string {
  const trimmed = (website ?? '').trim();
  if (trimmed === '') return '';
  const noScheme = trimmed.replace(/^[a-zA-Z]+:\/\//, '');
  const host = noScheme.split(/[/?#]/)[0];
  return host.toLowerCase();
}

/** Build the set of email/page values a pattern-guesser could construct from
 *  the given inputs. The honest enricher must never emit any of these unless
 *  the value was a preserved, previously-stored real value. */
function guessedPatterns(website: string, name: string): string[] {
  const domain = extractDomain(website);
  const slug = (name ?? '').trim().toLowerCase().replace(/\s+/g, '');
  const guesses: string[] = [];
  if (domain !== '') {
    guesses.push(
      `info@${domain}`,
      `owner@${domain}`,
      `contact@${domain}`,
      `hello@${domain}`,
      `admin@${domain}`,
      `https://${domain}/contact`,
      `${domain}/contact`
    );
  }
  if (slug !== '') {
    guesses.push(`${slug}@gmail.com`, `contact.${slug}@gmail.com`, `${slug}@${domain}`);
  }
  return guesses;
}

// Generators ---------------------------------------------------------------

/** Websites including empty/whitespace, bare domains, and full URLs. */
const websiteArb = fc.oneof(
  fc.constantFrom('', '   ', '\t'),
  fc
    .tuple(
      fc.constantFrom('', 'http://', 'https://'),
      fc.domain(),
      fc.constantFrom('', '/', '/contact', '/about?x=1#top')
    )
    .map(([scheme, domain, path]) => `${scheme}${domain}${path}`)
);

const nameArb = fc.string({ maxLength: 40 });

/** An optional existing field value: absent, empty, whitespace, or a real value. */
const existingValueArb = fc.oneof(
  fc.constant(undefined),
  fc.constantFrom('', '  '),
  fc.emailAddress(),
  fc.webUrl(),
  fc.string({ maxLength: 30 })
);

const existingArb: fc.Arbitrary<Partial<ContactFields>> = fc.record({
  business_email: existingValueArb,
  contact_email: existingValueArb,
  contact_page: existingValueArb,
});

// Property -----------------------------------------------------------------

describe('NoGuessContactEnricher', () => {
  // Feature: real-data-intelligence-engine, Property 1: Default contact enricher never guesses and always labels
  it('Property 1: never guesses and always labels within {real, estimated, unavailable}', async () => {
    const enricher = new NoGuessContactEnricher();

    await fc.assert(
      fc.asyncProperty(
        websiteArb,
        nameArb,
        existingArb,
        async (website, name, existing) => {
          const result = await enricher.enrich({ website, name, existing });

          const { fields, provenance } = result;

          // (Req 1.2) Every provenance label is in the allowed set.
          for (const label of Object.values(provenance)) {
            expect(ALLOWED_DEFAULT_LABELS.has(label)).toBe(true);
          }

          const trimmedExisting = {
            business_email: (existing.business_email ?? '').trim(),
            contact_email: (existing.contact_email ?? '').trim(),
            contact_page: (existing.contact_page ?? '').trim(),
          } as const;

          const guesses = new Set(guessedPatterns(website, name));

          (
            ['business_email', 'contact_email', 'contact_page'] as const
          ).forEach((key) => {
            const value = fields[key];
            const preserved = trimmedExisting[key];

            // (Req 1.1) Never a freshly-constructed guess: any guessed pattern
            // may only appear if it equals a preserved existing (real) value.
            if (guesses.has(value)) {
              expect(value).toBe(preserved);
            }

            if (value === '') {
              // Empty field must be labeled unavailable (Req 1.5, 1.6).
              expect(provenance[key]).toBe('unavailable');
            } else {
              // A non-empty value is only ever a preserved existing value
              // (labeled real) — the default enricher never invents one.
              expect(value).toBe(preserved);
              expect(provenance[key]).toBe('real');
            }
          });

          // (Req 1.6) No website: every field without a preserved real value is
          // empty and unavailable.
          if (website.trim() === '') {
            (
              ['business_email', 'contact_email', 'contact_page'] as const
            ).forEach((key) => {
              if (trimmedExisting[key] === '') {
                expect(fields[key]).toBe('');
                expect(provenance[key]).toBe('unavailable');
              }
            });
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
