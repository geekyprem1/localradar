// Feature: real-data-intelligence-engine, Property 17: Sandbox results are fully flagged non-real
//
// Property-based test for the /api/search POST route handler on the sandbox path.
//
// For any sandbox search (user.is_mock === true), the handler MUST:
//   - respond with success:true
//   - label the result set data_source:'sandbox'                        (Req 10.5)
//   - carry a non-real-data indicator is_real_data:false                (Req 10.7)
//   - flag EVERY returned business AND every opportunity is_real:false  (Req 10.5)
//   - never contact a live provider (fetch is never called)            (Req 10.5)
//
// The real generateLeads (mockData) is intentionally NOT mocked so the actual
// sandbox output is validated end-to-end through the handler.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

// ── Shared, mutable state used by the hoisted module mocks ──────────────────
const h = vi.hoisted(() => {
  return {
    state: {
      // Auth / entitlements — a sandbox (mock) user.
      user: {
        id: 'user-mock-1',
        email: 'sandbox@demo.io',
        organization_id: 'org-mock-1',
        subscription_tier: 'pro' as 'free' | 'pro' | 'agency' | 'agency_plus',
        is_mock: true,
      } as {
        id: string;
        email: string;
        organization_id: string;
        subscription_tier: 'free' | 'pro' | 'agency' | 'agency_plus';
        is_mock: boolean;
      } | null,
      entitlementAllowed: true as boolean,
    },
  };
});

// ── Mock: entitlements (auth + usage gating) ────────────────────────────────
vi.mock('@/lib/entitlements', () => ({
  getServerUser: vi.fn(async () => h.state.user),
  validateUsageAndEntitlement: vi.fn(async () => ({
    allowed: h.state.entitlementAllowed,
    reason: h.state.entitlementAllowed ? undefined : 'limit_exceeded',
  })),
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

// ── Mock: Supabase client with a small chainable query-builder stub ─────────
vi.mock('@/lib/supabase', () => {
  async function resolve() {
    return { data: null, error: null };
  }

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
      single: () => resolve(),
      maybeSingle: () => resolve(),
      then: (onFulfilled: any, onRejected: any) => resolve().then(onFulfilled, onRejected),
    };
    return builder;
  }

  return {
    supabase: {
      from: vi.fn(() => makeBuilder()),
    },
  };
});

// ── Mock: contact enricher (honest no-op) ───────────────────────────────────
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

// Import AFTER mocks are registered. The real generateLeads (mockData) runs.
import { POST } from './route';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sandbox-token',
      'x-forwarded-for': '203.0.113.9',
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.state.user = {
    id: 'user-mock-1',
    email: 'sandbox@demo.io',
    organization_id: 'org-mock-1',
    subscription_tier: 'pro',
    is_mock: true,
  };
  h.state.entitlementAllowed = true;
  // Stub fetch so we can assert the sandbox path never hits a live provider.
  vi.stubGlobal('fetch', vi.fn());
});

describe('POST /api/search — Property 17: sandbox results are fully flagged non-real', () => {
  it('flags every sandbox record non-real, labels data_source sandbox, never hits the provider', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Non-empty niche / city / country strings. Trim to guarantee the handler
        // sees non-blank required fields (it validates truthiness before trimming).
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        async (niche, city, country) => {
          (globalThis.fetch as any).mockClear();

          const res = await POST(makeRequest({ niche, city, country }));
          const body = await res.json();

          // Successful, sandbox-labeled result set with the non-real indicator.
          expect(res.status).toBe(200);
          expect(body.success).toBe(true);
          expect(body.data_source).toBe('sandbox');
          expect(body.is_real_data).toBe(false);

          // Every returned business is flagged non-real.
          expect(Array.isArray(body.businesses)).toBe(true);
          body.businesses.forEach((b: any) => {
            expect(b.is_real).toBe(false);
          });

          // Every returned opportunity is flagged non-real.
          const opps = Object.values(body.opportunities ?? {}) as any[];
          opps.forEach((o) => {
            expect(o.is_real).toBe(false);
          });

          // The sandbox path never contacts a live provider.
          expect(globalThis.fetch as any).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
