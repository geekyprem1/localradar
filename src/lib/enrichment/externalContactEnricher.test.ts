// Feature: real-data-intelligence-engine, Property 2: External enricher label mapping is honest
//
// Property 2 validates that ExternalContactEnricher maps a provider's lookup
// result to an honest Provenance_Label:
//   - confirmed + non-empty email        -> `real`     (Req 1.3)
//   - located-but-unconfirmed non-empty  -> `estimated` (Req 1.4)
//   - miss / empty email                 -> `unavailable` (Req 1.5)
//   - provider failure or timeout        -> `unavailable`, existing preserved (Req 1.7)
//
// Validates: Requirements 1.3, 1.4

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  ExternalContactEnricher,
  type EmailLookupProvider,
  type EmailLookupResult,
} from './contactEnricher';

/** A stub provider whose result is driven entirely by fast-check arbitraries. */
function stubProvider(result: EmailLookupResult): EmailLookupProvider {
  return {
    async lookup(): Promise<EmailLookupResult> {
      return result;
    },
  };
}

describe('ExternalContactEnricher label mapping (Property 2)', () => {
  it('maps a located email to real/estimated and a miss to unavailable', () => {
    const websiteArb = fc.webUrl();
    const nameArb = fc.string();
    // Either a real-looking located email or a miss ('').
    const emailArb = fc.oneof(fc.emailAddress(), fc.constant(''));
    const confirmedArb = fc.boolean();

    fc.assert(
      fc.asyncProperty(
        websiteArb,
        nameArb,
        emailArb,
        confirmedArb,
        async (website, name, email, confirmed) => {
          const enricher = new ExternalContactEnricher(
            stubProvider({ email, confirmed })
          );

          const { fields, provenance } = await enricher.enrich({
            website,
            name,
          });

          const located = email.trim();

          if (located === '') {
            // Miss: empty + unavailable (Req 1.5).
            expect(fields.contact_email).toBe('');
            expect(provenance.contact_email).toBe('unavailable');
          } else if (confirmed) {
            // Confirmed association -> real (Req 1.3).
            expect(fields.contact_email).toBe(located);
            expect(provenance.contact_email).toBe('real');
          } else {
            // Located but unconfirmed -> estimated (Req 1.4).
            expect(fields.contact_email).toBe(located);
            expect(provenance.contact_email).toBe('estimated');
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('treats a throwing provider as unavailable and preserves existing values (Req 1.7)', () => {
    const websiteArb = fc.webUrl();
    const nameArb = fc.string();
    const existingEmailArb = fc.emailAddress();

    fc.assert(
      fc.asyncProperty(
        websiteArb,
        nameArb,
        existingEmailArb,
        async (website, name, existingEmail) => {
          const throwingProvider: EmailLookupProvider = {
            async lookup(): Promise<EmailLookupResult> {
              throw new Error('provider_failure');
            },
          };
          const enricher = new ExternalContactEnricher(throwingProvider);

          const { fields, provenance } = await enricher.enrich({
            website,
            name,
            existing: { contact_email: existingEmail },
          });

          // Failure -> unavailable, but the previously-stored value is preserved
          // (labeled `real`) and never overwritten with a guess.
          expect(fields.contact_email).toBe(existingEmail.trim());
          expect(provenance.contact_email).toBe('real');
          // A field with no existing value stays empty + unavailable.
          expect(fields.business_email).toBe('');
          expect(provenance.business_email).toBe('unavailable');
        }
      ),
      { numRuns: 200 }
    );
  });

  it('treats a timeout as unavailable and preserves existing values (Req 1.7)', () => {
    const websiteArb = fc.webUrl();
    const nameArb = fc.string();
    const existingEmailArb = fc.emailAddress();

    fc.assert(
      fc.asyncProperty(
        websiteArb,
        nameArb,
        existingEmailArb,
        async (website, name, existingEmail) => {
          // A provider that never resolves forces the enricher's timeout to fire.
          const hangingProvider: EmailLookupProvider = {
            lookup(): Promise<EmailLookupResult> {
              return new Promise<EmailLookupResult>(() => {
                /* never resolves */
              });
            },
          };
          const enricher = new ExternalContactEnricher(hangingProvider, 10_000);

          const { fields, provenance } = await enricher.enrich({
            website,
            name,
            existing: { contact_email: existingEmail },
            timeoutMs: 5, // small timeout so the test resolves quickly
          });

          expect(fields.contact_email).toBe(existingEmail.trim());
          expect(provenance.contact_email).toBe('real');
        }
      ),
      { numRuns: 100 }
    );
  });
});
