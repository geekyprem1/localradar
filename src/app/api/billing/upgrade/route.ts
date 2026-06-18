import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/entitlements';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // 1. Apply rate limit on billing endpoint (max 20 requests per 15 minutes per IP)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, 20);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: 'Too many upgrade attempts. Please try again later.' 
      }, { status: 429 });
    }

    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await request.json();
    if (!tier || !['free', 'pro', 'agency', 'agency_plus'].includes(tier)) {
      return NextResponse.json({ success: false, message: 'Invalid subscription tier.' }, { status: 400 });
    }

    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || '';
    const proProductId = process.env.DODO_PAYMENTS_PRO_PRODUCT_ID || '';
    const agencyProductId = process.env.DODO_PAYMENTS_AGENCY_PRODUCT_ID || '';
    const agencyPlusProductId = process.env.DODO_PAYMENTS_AGENCY_PLUS_PRODUCT_ID || '';
    const isLive = process.env.DODO_PAYMENTS_MODE === 'live';

    // 2. Sandbox/Mock Mode Fallback (if credentials are not configured in local environment)
    if (!dodoApiKey) {
      if (user.is_mock) {
        console.warn('[Sandbox] DodoPayments key not set. Executing sandbox checkout bypass.');
        return NextResponse.json({
          success: true,
          message: `[Sandbox] Successfully updated organization to ${tier.toUpperCase()}`,
          tier,
          is_sandbox: true
        });
      } else {
        console.error('[Billing Alert] DodoPayments API Key is missing in production environment variables.');
        return NextResponse.json({ 
          success: false, 
          message: 'Billing provider is currently unconfigured. Please contact support.' 
        }, { status: 500 });
      }
    }

    if (user.is_mock) {
      console.warn('Running in mock mode. Executing sandbox database fallback.');
      return NextResponse.json({
        success: true,
        message: `[Sandbox] Successfully updated organization to ${tier.toUpperCase()}`,
        tier,
        is_sandbox: true
      });
    }

    // 3. Resolve Product ID for checkout
    let targetProductId = '';
    if (tier === 'pro') targetProductId = proProductId;
    else if (tier === 'agency') targetProductId = agencyProductId;
    else if (tier === 'agency_plus') targetProductId = agencyPlusProductId;

    if (!targetProductId) {
      return NextResponse.json({ 
        success: false, 
        message: `Product configuration missing for tier: ${tier}` 
      }, { status: 500 });
    }

    // 4. Call DodoPayments REST API to generate a hosted checkout session
    const baseUrl = isLive ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
    const originUrl = request.headers.get('origin') || 'http://localhost:3000';

    const dodoResponse = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dodoApiKey}`
      },
      body: JSON.stringify({
        product_cart: [
          {
            product_id: targetProductId,
            quantity: 1
          }
        ],
        customer: {
          email: user.email
        },
        return_url: `${originUrl}/dashboard/settings?status=success`,
        metadata: {
          organization_id: user.organization_id,
          tier: tier
        }
      })
    });

    if (!dodoResponse.ok) {
      const errorText = await dodoResponse.text();
      console.error('DodoPayments API error:', errorText);
      return NextResponse.json({ 
        success: false, 
        message: `DodoPayments error: ${errorText}` 
      }, { status: dodoResponse.status });
    }

    const checkoutSession = await dodoResponse.json();

    return NextResponse.json({
      success: true,
      checkout_url: checkoutSession.checkout_url,
      tier
    });

  } catch (error: any) {
    console.error('Billing upgrade execution error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Billing checkout generation failed.' 
    }, { status: 500 });
  }
}
