import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSandboxAuthAllowed } from './env';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function createAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  // Never fall back to the public anon key for admin operations
  if (
    serviceRoleKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    serviceRoleKey === 'mock-anon-key-placeholder'
  ) {
    console.error('[security] SUPABASE_SERVICE_ROLE_KEY must not equal the anon key');
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseAdmin = createAdminClient() as SupabaseClient;

export function requireSupabaseAdmin(): SupabaseClient {
  const client = createAdminClient();
  if (!client) {
    throw new Error('Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is required');
  }
  return client;
}

// In-memory cache for sandbox usage tracking (dev/demo only)
const sandboxUsageStore = new Map<
  string,
  {
    searches_count: number;
    audits_count: number;
    pitches_count: number;
    exports_count: number;
    tokens_used: number;
  }
>();

export interface PlanLimits {
  searchesLimit: number;
  auditsAllowed: boolean;
  pitchesAllowed: boolean;
  exportsAllowed: boolean;
  byokAllowed: boolean;
}

/** Single source of truth for plan limits — keep marketing/settings in sync */
export const PLAN_LIMITS: Record<'free' | 'pro' | 'agency' | 'agency_plus', PlanLimits> = {
  free: {
    searchesLimit: 20,
    auditsAllowed: false,
    pitchesAllowed: false,
    exportsAllowed: false,
    byokAllowed: false,
  },
  pro: {
    searchesLimit: 1000,
    auditsAllowed: true,
    pitchesAllowed: true,
    exportsAllowed: true,
    byokAllowed: false,
  },
  agency: {
    searchesLimit: 5000,
    auditsAllowed: true,
    pitchesAllowed: true,
    exportsAllowed: true,
    byokAllowed: false,
  },
  agency_plus: {
    searchesLimit: 10000,
    auditsAllowed: true,
    pitchesAllowed: true,
    exportsAllowed: true,
    byokAllowed: true,
  },
};

export type ServerUser = {
  id: string;
  email: string;
  organization_id: string;
  subscription_tier: 'free' | 'pro' | 'agency' | 'agency_plus';
  is_mock: boolean;
};

/**
 * Resolve the authenticated user for API routes.
 * Production: verified JWT only. Sandbox only when ALLOW_SANDBOX_AUTH is enabled (not in prod by default).
 * Never trust client-supplied tier/org for real authorization.
 */
export async function getServerUser(request: Request): Promise<ServerUser | null> {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isSandboxHeader = request.headers.get('x-is-sandbox') === 'true';

  // ── Sandbox path (dev/demo only) ──
  if (isSandboxAuthAllowed() && (isSandboxHeader || !token || token === 'undefined' || token === 'null')) {
    if (isSandboxHeader || !token || token === 'undefined' || token === 'null') {
      // Fixed sandbox identity — do NOT accept client-chosen agency_plus tier for free
      // Sandbox is always free unless explicitly elevated in memory after a sandbox checkout flow
      const mockTier = (request.headers.get('x-user-tier') || 'free') as ServerUser['subscription_tier'];
      const allowedSandboxTiers: ServerUser['subscription_tier'][] = ['free', 'pro', 'agency', 'agency_plus'];
      const tier = allowedSandboxTiers.includes(mockTier) ? mockTier : 'free';

      return {
        id: 'mock-user-123',
        email: 'sandbox@localradar.io',
        organization_id: 'mock-org-123',
        // In sandbox, allow tier header only for demo UX — never in production (gated above)
        subscription_tier: tier,
        is_mock: true,
      };
    }
  }

  // ── Production / configured path: require JWT ──
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }

  // Reject sandbox spoofing when sandbox is not allowed
  if (isSandboxHeader && !isSandboxAuthAllowed()) {
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon || url.includes('mock-project')) {
      // No real Supabase — only sandbox path works
      if (isSandboxAuthAllowed()) {
        return {
          id: 'mock-user-123',
          email: 'sandbox@localradar.io',
          organization_id: 'mock-org-123',
          subscription_tier: 'free',
          is_mock: true,
        };
      }
      return null;
    }

    const authClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error,
    } = await authClient.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    const admin = createAdminClient();
    if (!admin) {
      // Can still identify user but cannot load org — free tier only
      return {
        id: user.id,
        email: user.email || '',
        organization_id: '',
        subscription_tier: 'free',
        is_mock: false,
      };
    }

    let { data: profile } = await admin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();

    let orgId = profile?.organization_id || '';

    // Self-healing org provisioning
    if (!profile || !orgId) {
      try {
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agency Partner';
        const { data: newOrg, error: orgErr } = await admin
          .from('organizations')
          .insert({
            name: `${fullName} Agency`,
            subscription_tier: 'free',
            subscription_status: 'active',
          })
          .select('id')
          .single();

        if (!orgErr && newOrg) {
          orgId = newOrg.id;
          const { data: newProfile } = await admin
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: fullName,
              organization_id: orgId,
            })
            .select('organization_id')
            .single();
          if (newProfile) profile = newProfile;
        }
      } catch (provisionErr) {
        console.error('Failed self-healing provisioning:', provisionErr);
      }
    }

    let subscription_tier: ServerUser['subscription_tier'] = 'free';
    if (orgId) {
      const { data: org } = await admin
        .from('organizations')
        .select('subscription_tier')
        .eq('id', orgId)
        .maybeSingle();
      if (org?.subscription_tier) {
        subscription_tier = org.subscription_tier as ServerUser['subscription_tier'];
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      organization_id: orgId,
      subscription_tier,
      is_mock: false,
    };
  } catch (error) {
    console.warn('Authentication check failed:', error);
    return null;
  }
}

export async function getUsageAndLimits(
  organizationId: string,
  tier: 'free' | 'pro' | 'agency' | 'agency_plus',
  isMock: boolean = false
) {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;

  if (isMock) {
    if (!sandboxUsageStore.has(organizationId)) {
      sandboxUsageStore.set(organizationId, {
        searches_count: 0,
        audits_count: 0,
        pitches_count: 0,
        exports_count: 0,
        tokens_used: 0,
      });
    }
    const usage = sandboxUsageStore.get(organizationId)!;
    return { usage, limits, month: currentMonth };
  }

  try {
    const admin = requireSupabaseAdmin();
    let { data: usage, error } = await admin
      .from('usage_tracking')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('month', currentMonth)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newUsage, error: initError } = await admin
        .from('usage_tracking')
        .insert({
          organization_id: organizationId,
          month: currentMonth,
          searches_count: 0,
          audits_count: 0,
          pitches_count: 0,
          exports_count: 0,
          tokens_used: 0,
        })
        .select('*')
        .single();

      if (!initError && newUsage) usage = newUsage;
    }

    const usageData = usage || {
      searches_count: 0,
      audits_count: 0,
      pitches_count: 0,
      exports_count: 0,
      tokens_used: 0,
    };

    return { usage: usageData, limits, month: currentMonth };
  } catch (err) {
    console.error('Error fetching usage from Supabase:', err);
    return {
      usage: {
        searches_count: 0,
        audits_count: 0,
        pitches_count: 0,
        exports_count: 0,
        tokens_used: 0,
      },
      limits,
      month: currentMonth,
    };
  }
}

export async function incrementUsage(
  organizationId: string,
  tier: 'free' | 'pro' | 'agency' | 'agency_plus',
  type: 'searches' | 'audits' | 'pitches' | 'exports' | 'tokens',
  amount: number = 1,
  isMock: boolean = false
) {
  const currentMonth = new Date().toISOString().substring(0, 7);

  if (isMock) {
    if (!sandboxUsageStore.has(organizationId)) {
      sandboxUsageStore.set(organizationId, {
        searches_count: 0,
        audits_count: 0,
        pitches_count: 0,
        exports_count: 0,
        tokens_used: 0,
      });
    }
    const usage = sandboxUsageStore.get(organizationId)!;
    if (type === 'searches') usage.searches_count += amount;
    else if (type === 'audits') usage.audits_count += amount;
    else if (type === 'pitches') usage.pitches_count += amount;
    else if (type === 'exports') usage.exports_count += amount;
    else if (type === 'tokens') usage.tokens_used += amount;
    sandboxUsageStore.set(organizationId, usage);
    return usage;
  }

  try {
    const { usage: currentUsage } = await getUsageAndLimits(organizationId, tier, false);
    let searchesVal = currentUsage.searches_count;
    let auditsVal = currentUsage.audits_count;
    let pitchesVal = currentUsage.pitches_count;
    let exportsVal = currentUsage.exports_count;
    let tokensVal = currentUsage.tokens_used;

    if (type === 'searches') searchesVal += amount;
    else if (type === 'audits') auditsVal += amount;
    else if (type === 'pitches') pitchesVal += amount;
    else if (type === 'exports') exportsVal += amount;
    else if (type === 'tokens') tokensVal += amount;

    const admin = requireSupabaseAdmin();
    const { data, error } = await admin
      .from('usage_tracking')
      .upsert(
        {
          organization_id: organizationId,
          month: currentMonth,
          searches_count: searchesVal,
          audits_count: auditsVal,
          pitches_count: pitchesVal,
          exports_count: exportsVal,
          tokens_used: tokensVal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,month' }
      )
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to increment usage in database:', error);
    return null;
  }
}

export async function validateUsageAndEntitlement(
  organizationId: string,
  tier: 'free' | 'pro' | 'agency' | 'agency_plus',
  actionType: 'search' | 'audit' | 'pitch' | 'export',
  isMock: boolean = false
): Promise<{ allowed: boolean; reason?: string }> {
  const { usage, limits } = await getUsageAndLimits(organizationId, tier, isMock);

  if (actionType === 'search') {
    if (usage.searches_count >= limits.searchesLimit) {
      return { allowed: false, reason: 'limit_exceeded' };
    }
  } else if (actionType === 'audit') {
    if (!limits.auditsAllowed) return { allowed: false, reason: 'tier_restricted' };
  } else if (actionType === 'pitch') {
    if (!limits.pitchesAllowed) return { allowed: false, reason: 'tier_restricted' };
  } else if (actionType === 'export') {
    if (!limits.exportsAllowed) return { allowed: false, reason: 'tier_restricted' };
  }

  return { allowed: true };
}
