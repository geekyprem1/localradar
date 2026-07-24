import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/entitlements';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSiteUrl, isProduction, isSandboxAuthAllowed } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
    const rateCheck = checkRateLimit(`billing:${ip}`, 20);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many upgrade attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { tier } = body as { tier?: string };
    if (!tier || !['pro', 'agency', 'agency_plus'].includes(tier)) {
      return NextResponse.json(
        { success: false, message: 'Invalid subscription tier. Choose pro, agency, or agency_plus.' },
        { status: 400 }
      );
    }

    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || '';
    const proProductId = process.env.DODO_PAYMENTS_PRO_PRODUCT_ID || '';
    const agencyProductId = process.env.DODO_PAYMENTS_AGENCY_PRODUCT_ID || '';
    const agencyPlusProductId = process.env.DODO_PAYMENTS_AGENCY_PLUS_PRODUCT_ID || '';
    const isLive = process.env.DODO_PAYMENTS_MODE === 'live';

    // Sandbox demo upgrade — only when sandbox is allowed AND user is mock
    if (user.is_mock && isSandboxAuthAllowed() && !dodoApiKey) {
      return NextResponse.json({
        success: true,
        message: `[Sandbox] Demo upgrade to ${tier.toUpperCase()} (no payment processed)`,
        tier,
        is_sandbox: true,
      });
    }

    if (user.is_mock && isProduction()) {
      return NextResponse.json(
        { success: false, message: 'Sandbox billing is disabled in production.' },
        { status: 403 }
      );
    }

    if (!dodoApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Billing provider is not configured. Contact sales@localradar.io for enterprise onboarding.',
        },
        { status: 503 }
      );
    }

    if (user.is_mock) {
      return NextResponse.json({
        success: true,
        message: `[Sandbox] Demo upgrade to ${tier.toUpperCase()}`,
        tier,
        is_sandbox: true,
      });
    }

    if (!user.organization_id) {
      return NextResponse.json(
        { success: false, message: 'Organization not provisioned. Contact support.' },
        { status: 400 }
      );
    }

    let targetProductId = '';
    if (tier === 'pro') targetProductId = proProductId;
    else if (tier === 'agency') targetProductId = agencyProductId;
    else if (tier === 'agency_plus') targetProductId = agencyPlusProductId;

    if (!targetProductId) {
      return NextResponse.json(
        { success: false, message: `Product configuration missing for tier: ${tier}` },
        { status: 500 }
      );
    }

    const baseUrl = isLive ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
    const siteUrl = getSiteUrl();

    const dodoResponse = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dodoApiKey}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: targetProductId, quantity: 1 }],
        customer: { email: user.email },
        return_url: `${siteUrl}/dashboard/settings?status=success`,
        metadata: {
          organization_id: user.organization_id,
          tier,
          product_id: targetProductId,
          user_id: user.id,
        },
      }),
    });

    if (!dodoResponse.ok) {
      const errorText = await dodoResponse.text();
      console.error('DodoPayments API error:', errorText);
      return NextResponse.json(
        { success: false, message: 'Unable to start checkout. Please try again or contact support.' },
        { status: 502 }
      );
    }

    const checkoutSession = await dodoResponse.json();

    return NextResponse.json({
      success: true,
      checkout_url: checkoutSession.checkout_url,
      tier,
    });
  } catch (error: unknown) {
    console.error('Billing upgrade error:', error);
    return NextResponse.json(
      { success: false, message: 'Billing checkout generation failed.' },
      { status: 500 }
    );
  }
}
