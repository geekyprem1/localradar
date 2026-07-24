// Feature: real-data-intelligence-engine, Property 19: Error responses never leak secrets
//
// Property-based test for Task 15.7 / Property 19 (Validates: Requirements 12.5).
//
// For ANY triggered live-provider failure — a non-2xx response, a rejected
// (network) fetch, or an aborted (timeout) fetch — the POST /api/search handler
// must return a single honest, structured error:
//   { success:false, error_code:'live_provider_unavailable', message:<generic> }
// and the serialized response body must contain NONE of:
//   - the configured API key value,
//   - any secret value carried by the raw provider payload,
//   - the raw underlying error message,
//   - any 'stack' / 'Error:' text.
//
// The generic message may name the data provider ("Google Places") only as the
// failure source.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

// ── Shared, mutable state used by the hoisted module mocks ──────────────────
const h = vi.hoisted(() => {
  return {
    state: {
      user: {
        id: 'user-1',
        email: 'partner@agency.io',
        organization_id: 'org-1',
        subscription_tier: 'pro' as 'free' | 'pro' | 'agency' | 'agency_plus',
        is_mock: false,
      },
    },
  };
});

// ── Mock: entitlements (auth + usage gating; always a non-mock pro user) ────
vi.mock('@/lib/entitlements', () => ({
  getServerUser: vi.fn(async () => h.state.user),
  validateUsageAndEntitlement: vi.fn(async () => ({ allowed: true, reason: undefined })),
  incrementUsage: vi.fn(async () => undefined),
}));

// ── Mock: rate limiting (always allow) ──────────────────────────────────────
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 99, resetTime: Date.now() + 1000 })),
  checkSearchThrottle: vi.fn(async () => ({ allowed: true })),
  checkHourlySearchLimit: vi.fn(async () => ({ allowed: true })),
}));

// ── Mock: encryption (only used on the agency_plus BYOK path) ───────────────
vi.mock('@/lib/encryption', () => ({
  decrypt: vi.fn(() => ''),
}));

// ── Mock: Supabase client — chainable stub, empty cache, benign inserts ─────
vi.mock('@/lib/supabase', () => {
  function makeBuilder() {
    const builder: any = {
      select: (..._a: any[]) => builder,
      insert: (..._a: any[]) => builder,
      upsert: (..._a: any[]) => builder,
      update: (..._a: any[]) => builder,
      delete: (..._a: any[]) => builder,
      eq: (..._a: any[]) => builder,
      in: (..._a: any[]) => builder,
      gt: (..._a: any[]) => builder,
      gte: (..._a: any[]) => builder,
      lt: (..._a: any[]) => builder,
      order: (..._a: any[]) => builder,
      limit: (..._a: any[]) => builder,
      // select chains resolve to an empty cache; insert().single() → { id }
      single: () => Promise.resolve({ data: { id: 's1' }, error: null }),
      maybeSingle: () => Promise.resolve({ data: { id: 's1' }, error: null }),
      then: (onFulfilled: any, onRejected: any) =>
        Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected),
    };
    return builder;
  }

  return {
    supabase: {
      from: vi.fn(() => makeBuilder()),
    },
  };
});

// ── Mock: contact enricher (honest no-op; not reached on the failure path) ──
vi.mock('@/lib/enrichment/contactEnricher', () => ({
  NoGuessContactEnricher: class {
    async enrich() {
      return {
        fields: { business_email: '', contact_email: '', contact_page: '' },
        provenance: {
          business_email: 'unavailable',
          contact_email: 'unavailable',
          contact_page: 'unavailable',
        },
      };
    }
  },
}));

// Import AFTER mocks are registered.
import { POST } from './route';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
      'x-forwarded-for': '203.0.113.5',
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.state.user = {
    id: 'user-1',
    email: 'partner@agency.io',
    organization_id: 'org-1',
    subscription_tier: 'pro',
    is_mock: false,
  };
});

// ── Generators ──────────────────────────────────────────────────────────────
// Hex-only suffixes keep every generated value distinctive AND guarantee the
// key never accidentally matches an `isUsableKey` placeholder pattern (e.g.
// 'todo', 'example'), so the handler always reaches the live fetch path.
const hex = (min: number, max: number) =>
  fc.hexaString({ minLength: min, maxLength: max });

// A distinctive, non-empty secret API key: 'SECRET_KEY_' + hex.
const arbApiKey = hex(8, 24).map((s) => `SECRET_KEY_${s}`);

// An arbitrary provider error payload whose *values* are distinctive secrets.
// Returns { payload, secrets } where `secrets` are the values that must NOT leak.
const arbPayload = fc
  .array(
    fc.record({
      key: fc
        .hexaString({ minLength: 3, maxLength: 10 })
        .map((k) => `field_${k}`),
      secret: hex(8, 20).map((s) => `SECRET_${s}`),
    }),
    { minLength: 1, maxLength: 6 }
  )
  .map((entries) => {
    const payload: Record<string, string> = {};
    const secrets: string[] = [];
    entries.forEach(({ key, secret }, i) => {
      payload[`${key}_${i}`] = secret;
      secrets.push(secret);
    });
    return { payload, secrets };
  });

// The three failure modes a live provider call can hit.
const arbFailure = fc.oneof(
  // (a) provider responded with a non-2xx status
  fc.record({ kind: fc.constant('non-2xx' as const), status: fc.integer({ min: 500, max: 503 }) }),
  // (b) network-level rejection carrying a distinctive secret message
  fc.record({ kind: fc.constant('reject' as const), secret: hex(6, 16).map((s) => `SECRET_ERR_${s}`) }),
  // (c) timeout — an AbortError-style rejection
  fc.constant({ kind: 'abort' as const })
);

describe('Property 19: POST /api/search error responses never leak secrets (Req 12.5)', () => {
  it('returns a generic live_provider_unavailable error that leaks no secrets', async () => {
    await fc.assert(
      fc.asyncProperty(arbApiKey, arbPayload, arbFailure, async (apiKey, { payload, secrets }, failure) => {
        process.env.GOOGLE_PLACES_API_KEY = apiKey;

        let rawErrorMessage: string | null = null;
        const fetchMock = vi.fn(async () => {
          if (failure.kind === 'non-2xx') {
            return {
              ok: false,
              status: (failure as { status: number }).status,
              json: async () => payload,
              text: async () => JSON.stringify(payload),
            } as any;
          }
          if (failure.kind === 'reject') {
            rawErrorMessage = (failure as { secret: string }).secret;
            throw new Error(rawErrorMessage);
          }
          // abort / timeout
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          throw err;
        });
        vi.stubGlobal('fetch', fetchMock);

        const res = await POST(
          makeRequest({ niche: 'plumber', city: 'Austin', country: 'US' })
        );
        const body = await res.json();
        const raw = JSON.stringify(body);

        // Honest, structured failure contract.
        expect(body.success).toBe(false);
        expect(body.error_code).toBe('live_provider_unavailable');
        // No lead records surface on a failure.
        expect(body.businesses).toBeUndefined();

        // No secrets of any kind leak into the serialized response body.
        expect(raw).not.toContain(apiKey);
        for (const secret of secrets) {
          expect(raw).not.toContain(secret);
        }
        if (rawErrorMessage) {
          expect(raw).not.toContain(rawErrorMessage);
        }
        expect(raw).not.toContain('stack');
        expect(raw).not.toContain('Error:');

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
