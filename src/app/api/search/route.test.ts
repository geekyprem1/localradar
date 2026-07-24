// Feature: real-data-intelligence-engine, Task 15.8
// Integration tests for the /api/search POST route handler.
//
// These are example-based integration tests that exercise the route with the
// external boundaries mocked (auth/entitlements, rate limiting, Supabase, the
// contact enricher, and global fetch). They assert the honest-data-source
// contract of the handler:
//   - Live success returns only real place-id records         (Req 10.1, 10.6)
//   - Provider failure omits payload, names provider, no rows (Req 10.2, 12.2)
//   - Zero results stays `live` with no_matches               (Req 10.4, 12.1)
//   - Enrichment failure keeps the business with `unavailable` (Req 12.3)
//   - Cache hit sets data_source:'cache'                      (Req 9.8)

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Shared, mutable state used by the hoisted module mocks ──────────────────
const h = vi.hoisted(() => {
  return {
    state: {
      // Auth / entitlements
      user: {
        id: 'user-1',
        email: 'partner@agency.io',
        organization_id: 'org-1',
        subscription_tier: 'pro' as const,
        is_mock: false,
      } as {
        id: string;
        email: string;
        organization_id: string;
        subscription_tier: 'free' | 'pro' | 'agency' | 'agency_plus';
        is_mock: boolean;
      } | null,
      entitlementAllowed: true as boolean,

      // Supabase query results, keyed by table + operation
      cachedSearches: { data: [] as any[], error: null as any },
      cachedBizs: { data: [] as any[], error: null as any },
      cachedOpps: { data: [] as any[], error: null as any },
      searchInsert: { data: { id: 'search-1' }, error: null as any },
      bizInsert: { data: [] as any[], error: null as any },

      // Contact enrichment behavior
      enrichShouldThrow: false as boolean,
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
  async function resolve(op: string, table: string) {
    const s = h.state;
    if (table === 'searches' && op === 'select') return s.cachedSearches;
    if (table === 'businesses' && op === 'select') return s.cachedBizs;
    if (table === 'opportunities' && op === 'select') return s.cachedOpps;
    if (table === 'searches' && op === 'insert') return s.searchInsert;
    if (table === 'businesses' && op === 'insert') return s.bizInsert;
    // search_logs inserts, opportunities inserts, byok_credentials, etc.
    return { data: null, error: null };
  }

  function makeBuilder(table: string) {
    const ctx = { op: 'select' };
    const builder: any = {
      select: (..._a: any[]) => builder,
      insert: (..._a: any[]) => {
        ctx.op = 'insert';
        return builder;
      },
      upsert: (..._a: any[]) => {
        ctx.op = 'upsert';
        return builder;
      },
      update: (..._a: any[]) => {
        ctx.op = 'update';
        return builder;
      },
      delete: (..._a: any[]) => {
        ctx.op = 'delete';
        return builder;
      },
      eq: (..._a: any[]) => builder,
      in: (..._a: any[]) => builder,
      gt: (..._a: any[]) => builder,
      gte: (..._a: any[]) => builder,
      lt: (..._a: any[]) => builder,
      order: (..._a: any[]) => builder,
      limit: (..._a: any[]) => builder,
      single: () => resolve(ctx.op, table),
      maybeSingle: () => resolve(ctx.op, table),
      // Make the builder awaitable for chains that don't end in single()/maybeSingle()
      then: (onFulfilled: any, onRejected: any) =>
        resolve(ctx.op, table).then(onFulfilled, onRejected),
    };
    return builder;
  }

  return {
    supabase: {
      from: vi.fn((table: string) => makeBuilder(table)),
    },
  };
});

// ── Mock: contact enricher (default honest no-op; can be forced to throw) ───
vi.mock('@/lib/enrichment/contactEnricher', () => ({
  NoGuessContactEnricher: class {
    async enrich() {
      if (h.state.enrichShouldThrow) {
        throw new Error('enrichment provider failed');
      }
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

const REAL_API_KEY = 'AIzaTestPlacesKey1234567890';

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

function place(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    displayName: { text: `Business ${id}` },
    formattedAddress: '123 Main St',
    nationalPhoneNumber: '+1 555-0100',
    websiteUri: 'https://example.com',
    rating: 4.2,
    userRatingCount: 37,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset shared state to a clean, non-mock pro user, no cache, allowed usage.
  h.state.user = {
    id: 'user-1',
    email: 'partner@agency.io',
    organization_id: 'org-1',
    subscription_tier: 'pro',
    is_mock: false,
  };
  h.state.entitlementAllowed = true;
  h.state.cachedSearches = { data: [], error: null };
  h.state.cachedBizs = { data: [], error: null };
  h.state.cachedOpps = { data: [], error: null };
  h.state.searchInsert = { data: { id: 'search-1' }, error: null };
  h.state.bizInsert = { data: [], error: null };
  h.state.enrichShouldThrow = false;

  process.env.GOOGLE_PLACES_API_KEY = REAL_API_KEY;
  vi.stubGlobal('fetch', vi.fn());
});

describe('POST /api/search — live success (Req 10.1, 10.6)', () => {
  it('returns only real place-id records with data_source:live', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ places: [place('places/AAA'), place('places/BBB')] }),
    });

    const res = await POST(makeRequest({ niche: 'plumber', city: 'Austin', country: 'US' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data_source).toBe('live');
    expect(body.businesses).toHaveLength(2);

    // Every returned business carries a real (non-empty) place_id from the
    // provider response — no fabricated records.
    const placeIds = body.businesses.map((b: any) => b.place_id);
    expect(placeIds).toEqual(['places/AAA', 'places/BBB']);
    body.businesses.forEach((b: any) => {
      expect(typeof b.place_id).toBe('string');
      expect(b.place_id.trim()).not.toBe('');
    });
  });
});

describe('POST /api/search — provider failure (Req 10.2, 12.2)', () => {
  it('omits payload, names the provider, returns no records on non-2xx', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ secretField: 'should-never-surface', error: 'internal' }),
    });

    const res = await POST(makeRequest({ niche: 'plumber', city: 'Austin', country: 'US' }));
    const body = await res.json();
    const raw = JSON.stringify(body);

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error_code).toBe('live_provider_unavailable');
    expect(body.businesses).toBeUndefined();
    // Provider named only as the source; no raw provider payload or secret leaks.
    expect(body.message).toContain('Google Places');
    expect(raw).not.toContain(REAL_API_KEY);
    expect(raw).not.toContain('secretField');
    expect(raw).not.toContain('should-never-surface');
  });

  it('returns the same honest error on a network-level failure', async () => {
    (globalThis.fetch as any).mockRejectedValue(new Error('ECONNRESET boom'));

    const res = await POST(makeRequest({ niche: 'plumber', city: 'Austin', country: 'US' }));
    const body = await res.json();
    const raw = JSON.stringify(body);

    expect(res.status).toBe(502);
    expect(body.success).toBe(false);
    expect(body.error_code).toBe('live_provider_unavailable');
    expect(body.businesses).toBeUndefined();
    expect(raw).not.toContain('ECONNRESET');
    expect(raw).not.toContain(REAL_API_KEY);
  });
});

describe('POST /api/search — zero results (Req 10.4, 12.1)', () => {
  it('stays data_source:live with no_matches:true and an empty result set', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ places: [] }),
    });

    const res = await POST(makeRequest({ niche: 'plumber', city: 'Nowhere', country: 'US' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data_source).toBe('live');
    expect(body.no_matches).toBe(true);
    expect(body.businesses).toEqual([]);
    expect(body.totalResults).toBe(0);
  });
});

describe('POST /api/search — enrichment resilience (Req 12.3)', () => {
  it('keeps the business with contact provenance unavailable when enrichment throws', async () => {
    h.state.enrichShouldThrow = true;
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ places: [place('places/CCC')] }),
    });

    const res = await POST(makeRequest({ niche: 'dentist', city: 'Austin', country: 'US' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data_source).toBe('live');
    expect(body.businesses).toHaveLength(1);

    const biz = body.businesses[0];
    expect(biz.place_id).toBe('places/CCC');
    expect(biz.contact_provenance).toEqual({
      business_email: 'unavailable',
      contact_email: 'unavailable',
      contact_page: 'unavailable',
    });
    // No guessed contact values reach the client.
    expect(biz.business_email).toBe('');
    expect(biz.contact_email).toBe('');
    expect(biz.contact_page).toBe('');
  });
});

describe('POST /api/search — cache hit (Req 9.8)', () => {
  it('sets data_source:cache and cached:true without calling the provider', async () => {
    h.state.cachedSearches = {
      data: [{ id: 'cached-search-1', created_at: new Date().toISOString() }],
      error: null,
    };
    h.state.cachedBizs = {
      data: [
        {
          id: 'biz-db-1',
          created_at: new Date().toISOString(),
          search_id: 'cached-search-1',
          organization_id: 'org-1',
          place_id: 'places/CACHED',
          name: 'Cached Co',
          website: 'https://cached.example',
          rating: 4.5,
          reviews_count: 88,
          phone: '+1 555-0111',
          address: '9 Cache Rd',
          business_email: '',
          contact_email: '',
          contact_page: '',
          contact_provenance: {
            business_email: 'unavailable',
            contact_email: 'unavailable',
            contact_page: 'unavailable',
          },
        },
      ],
      error: null,
    };
    h.state.cachedOpps = {
      data: [
        {
          id: 'opp-db-1',
          created_at: new Date().toISOString(),
          business_id: 'biz-db-1',
          place_id: 'places/CACHED',
          website_score: 10,
          reviews_score: 10,
          seo_score: 10,
          gbp_score: 10,
          social_score: 10,
          total_score: 50,
          opportunity_level: 'Medium',
          estimated_deal_value: 1200,
          deal_value_min: 800,
          deal_value_max: 1600,
          deal_value_provenance: 'estimated',
          closing_probability: 40,
          confidence: 60,
        },
      ],
      error: null,
    };

    const res = await POST(makeRequest({ niche: 'plumber', city: 'Austin', country: 'US' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data_source).toBe('cache');
    expect(body.cached).toBe(true);
    expect(body.businesses).toHaveLength(1);
    expect(body.businesses[0].place_id).toBe('places/CACHED');
    // Cached opportunities are labeled cache on the way out.
    expect(body.opportunities['biz-db-1'].data_source).toBe('cache');
    // The provider was never contacted on a cache hit.
    expect(globalThis.fetch as any).not.toHaveBeenCalled();
  });
});
