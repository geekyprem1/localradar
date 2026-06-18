import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project-url.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-placeholder';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);


// In-memory cache for sandbox usage tracking (survives dev server reloads)
const sandboxUsageStore = new Map<string, {
  searches_count: number;
  audits_count: number;
  pitches_count: number;
  exports_count: number;
  tokens_used: number;
}>();

export interface PlanLimits {
  searchesLimit: number;
  auditsAllowed: boolean;
  pitchesAllowed: boolean;
  exportsAllowed: boolean;
  byokAllowed: boolean;
}

export const PLAN_LIMITS: Record<'free' | 'pro' | 'agency' | 'agency_plus', PlanLimits> = {
  free: {
    searchesLimit: 10,
    auditsAllowed: false,
    pitchesAllowed: false,
    exportsAllowed: false,
    byokAllowed: false,
  },
  pro: {
    searchesLimit: 250,
    auditsAllowed: true,
    pitchesAllowed: true,
    exportsAllowed: true,
    byokAllowed: false,
  },
  agency: {
    searchesLimit: 1000,
    auditsAllowed: true,
    pitchesAllowed: true,
    exportsAllowed: true,
    byokAllowed: false,
  },
  agency_plus: {
    searchesLimit: 5000,
    auditsAllowed: true,
    pitchesAllowed: true,
    exportsAllowed: true,
    byokAllowed: true,
  },
};

/**
 * Helper to fetch or initialize the current user's profile and subscription tier server-side.
 */
export async function getServerUser(request: Request) {
  // Check headers
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  
  const isSandbox = request.headers.get('x-is-sandbox') === 'true';
  const mockUserId = request.headers.get('x-user-id') || 'mock-user-123';
  const mockOrgId = request.headers.get('x-org-id') || 'mock-org-123';
  const mockTier = (request.headers.get('x-user-tier') || 'free') as 'free' | 'pro' | 'agency' | 'agency_plus';

  // If we are in Sandbox mode, or if Supabase keys aren't set, return mock info
  if (!token || token === 'undefined' || token === 'null' || isSandbox) {
    return {
      id: mockUserId,
      email: isSandbox ? 'sandbox@localradar.io' : 'guest@localradar.io',
      organization_id: mockOrgId,
      subscription_tier: mockTier,
      is_mock: true,
    };
  }

  try {
    // Verify user JWT token with Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      if (process.env.NODE_ENV === 'development') {
        return {
          id: mockUserId,
          email: 'sandbox-fallback@localradar.io',
          organization_id: mockOrgId,
          subscription_tier: mockTier,
          is_mock: true,
        };
      }
      throw new Error('Unauthorized');
    }

    // Load profile from public.users using admin client to ensure reliable retrieval
    let { data: profile } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();

    let orgId = profile?.organization_id || '';

    // Self-healing onboarding provisioning fallback if DB trigger failed or was bypassed
    if (!profile || !orgId) {
      try {
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agency Partner';
        
        // 1. Create a default organization for the user
        const { data: newOrg, error: orgErr } = await supabaseAdmin
          .from('organizations')
          .insert({
            name: `${fullName} Agency`,
            subscription_tier: 'free',
            subscription_status: 'active'
          })
          .select('id')
          .single();

        if (!orgErr && newOrg) {
          orgId = newOrg.id;
          
          // 2. Create the user profile row
          const { data: newProfile, error: profErr } = await supabaseAdmin
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: fullName,
              organization_id: orgId
            })
            .select('organization_id')
            .single();

          if (!profErr && newProfile) {
            profile = newProfile;
          }
        }
      } catch (provisionErr) {
        console.error('Failed self-healing provisioning:', provisionErr);
      }
    }

    let subscription_tier: 'free' | 'pro' | 'agency' | 'agency_plus' = 'free';

    if (orgId) {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('subscription_tier')
        .eq('id', orgId)
        .maybeSingle();
      if (org?.subscription_tier) {
        subscription_tier = org.subscription_tier as 'free' | 'pro' | 'agency' | 'agency_plus';
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      organization_id: orgId || mockOrgId,
      subscription_tier,
      is_mock: false,
    };
  } catch (error) {
    console.warn('Authentication check failed, running in fallback mode:', error);
    return {
      id: mockUserId,
      email: 'sandbox-fallback@localradar.io',
      organization_id: mockOrgId,
      subscription_tier: mockTier,
      is_mock: true,
    };
  }
}

export async function getUsageAndLimits(
  organizationId: string,
  tier: 'free' | 'pro' | 'agency' | 'agency_plus',
  isMock: boolean = false
) {
  const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
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
    return {
      usage,
      limits,
      month: currentMonth,
    };
  }

  try {
    let { data: usage, error } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('month', currentMonth)
      .single();

    if (error && error.code === 'PGRST116') {
      // Row not found, create new record using admin client (bypasses RLS restrictions)
      const { data: newUsage, error: initError } = await supabaseAdmin
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
      
      if (!initError && newUsage) {
        usage = newUsage;
      }
    }

    const usageData = usage || {
      searches_count: 0,
      audits_count: 0,
      pitches_count: 0,
      exports_count: 0,
      tokens_used: 0,
    };

    return {
      usage: usageData,
      limits,
      month: currentMonth,
    };
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

    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .upsert({
        organization_id: organizationId,
        month: currentMonth,
        searches_count: searchesVal,
        audits_count: auditsVal,
        pitches_count: pitchesVal,
        exports_count: exportsVal,
        tokens_used: tokensVal,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,month' })
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
    if (!limits.auditsAllowed) {
      return { allowed: false, reason: 'tier_restricted' };
    }
  } else if (actionType === 'pitch') {
    if (!limits.pitchesAllowed) {
      return { allowed: false, reason: 'tier_restricted' };
    }
  } else if (actionType === 'export') {
    if (!limits.exportsAllowed) {
      return { allowed: false, reason: 'tier_restricted' };
    }
  }

  return { allowed: true };
}
