// Contact_Enricher — honest contact-field enrichment (Req 1)
// The default implementation NEVER pattern-guesses emails. Every contact field
// is labeled with its provenance, and unavailable fields are returned as empty
// strings so guessed addresses can never reach a user.

import type { ContactProvenance, ProvenanceLabel } from '@/types/scoring';

/**
 * Contact fields for a business. Each value is either a real, retrieved value
 * or an empty string when unavailable — never a guess derived from the domain
 * or business name.
 */
export interface ContactFields {
  business_email: string; // '' when unavailable — never a guess
  contact_email: string; // '' when unavailable
  contact_page: string; // '' when unavailable
}

/** A set of contact fields together with per-field provenance labels. */
export interface EnrichedContact {
  fields: ContactFields;
  provenance: ContactProvenance;
}

/**
 * Produces contact fields for a business behind a single interface so that a
 * real external provider can be swapped in later without changing callers. The
 * enrichment MUST resolve within `timeoutMs`; on failure or timeout it returns
 * all-unavailable fields (Req 1.7).
 */
export interface ContactEnricher {
  enrich(input: {
    website: string;
    name: string;
    existing?: Partial<ContactFields>; // preserved, never overwritten by a guess (Req 1.7)
    timeoutMs?: number; // default 10_000 (Req 1.7)
  }): Promise<EnrichedContact>;
}

/** Default enrichment timeout in milliseconds (Req 1.7). */
export const DEFAULT_ENRICHMENT_TIMEOUT_MS = 10_000;

/**
 * Default enricher: an honest no-op. It never guesses an email from the domain
 * or business name. Email fields are empty with a Provenance_Label of
 * `unavailable` by default and whenever the business has no website (Req 1.1,
 * 1.2, 1.5, 1.6).
 *
 * Any `existing` values passed in are treated as previously-stored real values
 * and are preserved as-is (labeled `real`); they are never overwritten with a
 * guess. Fields with no existing value stay empty and `unavailable`.
 */
export class NoGuessContactEnricher implements ContactEnricher {
  async enrich(input: {
    website: string;
    name: string;
    existing?: Partial<ContactFields>;
    timeoutMs?: number;
  }): Promise<EnrichedContact> {
    const existing = input.existing ?? {};

    // A previously-stored non-empty value is preserved and labeled `real`.
    // Everything else is empty with an `unavailable` label — no guessing,
    // including when the business has no website (Req 1.6).
    const resolveField = (
      value: string | undefined
    ): { value: string; provenance: ProvenanceLabel } => {
      const trimmed = (value ?? '').trim();
      if (trimmed !== '') {
        return { value: trimmed, provenance: 'real' };
      }
      return { value: '', provenance: 'unavailable' };
    };

    const businessEmail = resolveField(existing.business_email);
    const contactEmail = resolveField(existing.contact_email);
    const contactPage = resolveField(existing.contact_page);

    return {
      fields: {
        business_email: businessEmail.value,
        contact_email: contactEmail.value,
        contact_page: contactPage.value,
      },
      provenance: {
        business_email: businessEmail.provenance,
        contact_email: contactEmail.provenance,
        contact_page: contactPage.provenance,
      },
    };
  }
}

/**
 * Result of an external email lookup for a business. `email` is the located
 * address ('' when none was found); `confirmed` indicates whether the located
 * address's association with the business was verified by the provider.
 */
export interface EmailLookupResult {
  email: string; // '' when the provider found nothing
  confirmed: boolean; // true when the association is verified
  contactPage?: string; // located contact page, when available
}

/**
 * External source that attempts to locate a contact email for a business. The
 * lookup receives an `AbortSignal` so a well-behaved provider can cancel work
 * once the enrichment timeout elapses; the enricher enforces the timeout
 * regardless via `Promise.race` (Req 1.7).
 */
export interface EmailLookupProvider {
  lookup(input: {
    website: string;
    name: string;
    signal?: AbortSignal;
  }): Promise<EmailLookupResult>;
}

/**
 * Enricher that wraps an external {@link EmailLookupProvider} behind the shared
 * {@link ContactEnricher} interface. It still never guesses: a value is only
 * populated when the provider actually locates one.
 *
 * Label mapping (Req 1.3, 1.4, 1.5, 1.7):
 * - `real` when the provider confirms the email's association with the business.
 * - `estimated` when the email is located but its association is unconfirmed.
 * - `unavailable` on a miss, a provider failure, or a timeout — in which case
 *   any previously-stored `existing` value is preserved (labeled `real`) rather
 *   than overwritten with a guess.
 *
 * The lookup MUST resolve within `timeoutMs` (default 10_000ms, configurable via
 * the constructor); otherwise it is treated as `unavailable` (Req 1.7).
 */
export class ExternalContactEnricher implements ContactEnricher {
  constructor(
    private readonly provider: EmailLookupProvider,
    private readonly timeoutMs: number = DEFAULT_ENRICHMENT_TIMEOUT_MS
  ) {}

  async enrich(input: {
    website: string;
    name: string;
    existing?: Partial<ContactFields>;
    timeoutMs?: number;
  }): Promise<EnrichedContact> {
    const existing = input.existing ?? {};
    const website = (input.website ?? '').trim();
    const timeoutMs = input.timeoutMs ?? this.timeoutMs;

    // No website → nothing to look up. Preserve existing values without
    // guessing, mirroring the default enricher (Req 1.6).
    if (website === '') {
      return this.fromExisting(existing);
    }

    let result: EmailLookupResult | null = null;
    try {
      result = await this.lookupWithTimeout(
        { website, name: input.name },
        timeoutMs
      );
    } catch {
      // Provider failure or timeout — treat as unavailable (Req 1.7).
      result = null;
    }

    const locatedEmail = (result?.email ?? '').trim();
    if (result === null || locatedEmail === '') {
      // Miss, failure, or timeout: unavailable, existing values preserved
      // without overwriting them with a guess (Req 1.5, 1.7).
      return this.fromExisting(existing);
    }

    // The provider located an email. Confirmed → `real`, otherwise
    // located-but-unconfirmed → `estimated` (Req 1.3, 1.4).
    const label: ProvenanceLabel = result.confirmed ? 'real' : 'estimated';

    // A located contact page shares the located email's provenance; fields the
    // provider did not resolve fall back to preserved existing values.
    const preserved = this.fromExisting(existing);
    const locatedContactPage = (result.contactPage ?? '').trim();

    const contactPage =
      locatedContactPage !== ''
        ? { value: locatedContactPage, provenance: label }
        : {
            value: preserved.fields.contact_page,
            provenance: preserved.provenance.contact_page,
          };

    return {
      fields: {
        business_email: preserved.fields.business_email,
        contact_email: locatedEmail,
        contact_page: contactPage.value,
      },
      provenance: {
        business_email: preserved.provenance.business_email,
        contact_email: label,
        contact_page: contactPage.provenance,
      },
    };
  }

  /**
   * Runs the provider lookup, rejecting if it does not resolve within
   * `timeoutMs`. The `AbortController` lets a cooperative provider cancel its
   * own work; `Promise.race` guarantees the timeout is honored regardless.
   */
  private async lookupWithTimeout(
    input: { website: string; name: string },
    timeoutMs: number
  ): Promise<EmailLookupResult> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error('enrichment_timeout'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([
        this.provider.lookup({ ...input, signal: controller.signal }),
        timeout,
      ]);
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }

  /**
   * Builds an {@link EnrichedContact} from previously-stored values only: a
   * non-empty existing value is preserved and labeled `real`, everything else
   * is empty and `unavailable`. No value is ever guessed (Req 1.5, 1.7).
   */
  private fromExisting(existing: Partial<ContactFields>): EnrichedContact {
    const resolveField = (
      value: string | undefined
    ): { value: string; provenance: ProvenanceLabel } => {
      const trimmed = (value ?? '').trim();
      if (trimmed !== '') {
        return { value: trimmed, provenance: 'real' };
      }
      return { value: '', provenance: 'unavailable' };
    };

    const businessEmail = resolveField(existing.business_email);
    const contactEmail = resolveField(existing.contact_email);
    const contactPage = resolveField(existing.contact_page);

    return {
      fields: {
        business_email: businessEmail.value,
        contact_email: contactEmail.value,
        contact_page: contactPage.value,
      },
      provenance: {
        business_email: businessEmail.provenance,
        contact_email: contactEmail.provenance,
        contact_page: contactPage.provenance,
      },
    };
  }
}
