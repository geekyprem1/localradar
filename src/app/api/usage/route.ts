import { NextResponse } from 'next/server';
import { getServerUser, getUsageAndLimits } from '@/lib/entitlements';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { usage, limits } = await getUsageAndLimits(
      user.organization_id,
      user.subscription_tier,
      user.is_mock
    );

    let nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    let stripeSubscriptionId = null;

    if (!user.is_mock) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('current_period_end, stripe_subscription_id')
        .eq('organization_id', user.organization_id)
        .eq('status', 'active')
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub?.current_period_end) {
        nextBillingDate = new Date(sub.current_period_end);
        stripeSubscriptionId = sub.stripe_subscription_id;
      }
    }

    const searchesUsed = usage.searches_count;
    const searchesLimit = limits.searchesLimit;
    const searchesRemaining = Math.max(0, searchesLimit - searchesUsed);

    const ratio = searchesLimit > 0 ? searchesUsed / searchesLimit : 0;
    let softAlert = null;
    if (ratio >= 1.0) {
      softAlert = '100% of searches used. Please upgrade your plan to continue scanning.';
    } else if (ratio >= 0.9) {
      softAlert = 'You have used 90% of your monthly searches. Upgrade soon to prevent service interruption.';
    } else if (ratio >= 0.75) {
      softAlert = 'You have used 75% of your monthly searches.';
    }

    return NextResponse.json({
      success: true,
      subscription_tier: user.subscription_tier,
      searches_used: searchesUsed,
      searches_limit: searchesLimit,
      searches_remaining: searchesRemaining,
      soft_alert: softAlert,
      audits_used: usage.audits_count,
      pitches_used: usage.pitches_count,
      exports_used: usage.exports_count,
      tokens_used: usage.tokens_used,
      next_billing_date: nextBillingDate.toISOString(),
      stripe_subscription_id: stripeSubscriptionId,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Error loading usage details.'
    }, { status: 500 });
  }
}
