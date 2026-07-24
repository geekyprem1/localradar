import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireSupabaseAdmin } from '@/lib/entitlements';
import { isProduction } from '@/lib/env';

/**
 * Map paid product IDs → tier. Never trust client metadata.tier alone.
 */
function resolveTierFromProduct(productId: string | undefined, metadataTier: string | undefined): string | null {
  const pro = process.env.DODO_PAYMENTS_PRO_PRODUCT_ID || '';
  const agency = process.env.DODO_PAYMENTS_AGENCY_PRODUCT_ID || '';
  const agencyPlus = process.env.DODO_PAYMENTS_AGENCY_PLUS_PRODUCT_ID || '';

  if (productId && productId === pro) return 'pro';
  if (productId && productId === agency) return 'agency';
  if (productId && productId === agencyPlus) return 'agency_plus';

  // Allow metadata tier only if it matches a known paid tier and product map is incomplete (migration)
  if (metadataTier && ['pro', 'agency', 'agency_plus'].includes(metadataTier)) {
    if (!pro && !agency && !agencyPlus) {
      // Dev without product IDs configured
      if (!isProduction()) return metadataTier;
    }
  }

  return null;
}

function verifyWebhook(
  id: string,
  timestamp: string,
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    if (!id || !timestamp || !rawBody || !signatureHeader || !secret) return false;

    // Reject stale timestamps (5 min skew)
    const ts = parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) return false;
    const ageMs = Math.abs(Date.now() - ts * 1000);
    if (ageMs > 5 * 60 * 1000) return false;

    const signedContent = `${id}.${timestamp}.${rawBody}`;
    const cleanSecret = secret.replace('whsec_', '');
    const secretBytes = Buffer.from(cleanSecret, 'base64');

    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    const passedSignatures = signatureHeader.split(' ');
    for (const passedSignature of passedSignatures) {
      const parts = passedSignature.split(',');
      if (parts.length !== 2) continue;
      const [version, hash] = parts;
      if (version !== 'v1') continue;

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const passedBuffer = Buffer.from(hash, 'utf8');

      if (
        expectedBuffer.length === passedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, passedBuffer)
      ) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY || '';

    // Fail closed: never skip verification in production; never accept mock-key outside local dev
    if (!webhookSecret || webhookSecret === 'mock-key') {
      if (isProduction() || webhookSecret === 'mock-key') {
        if (isProduction()) {
          console.error('[billing] DODO_PAYMENTS_WEBHOOK_KEY missing or invalid in production');
          return new Response('Webhook not configured', { status: 503 });
        }
        if (webhookSecret === 'mock-key' && isProduction()) {
          return new Response('Invalid webhook configuration', { status: 503 });
        }
      }
      if (!webhookSecret) {
        return new Response('Webhook secret not configured', { status: 503 });
      }
    }

    if (webhookSecret === 'mock-key' && !isProduction()) {
      console.warn('[dev] Bypassing webhook signature verification (mock-key). Never use in production.');
    } else {
      const webhookId = request.headers.get('webhook-id') || request.headers.get('svix-id') || '';
      const webhookTimestamp =
        request.headers.get('webhook-timestamp') || request.headers.get('svix-timestamp') || '';
      const webhookSignature =
        request.headers.get('webhook-signature') || request.headers.get('svix-signature') || '';

      const isValid = verifyWebhook(
        webhookId,
        webhookTimestamp,
        rawBody,
        webhookSignature,
        webhookSecret
      );

      if (!isValid) {
        return new Response('Invalid signature verification.', { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const eventData = payload.data;
    const metadata = eventData?.metadata || {};

    const orgId = metadata.organization_id;
    if (!orgId || typeof orgId !== 'string') {
      console.warn('Webhook without organization_id metadata');
      return NextResponse.json({ success: true, message: 'Skipped - no org metadata.' });
    }

    // UUID-ish org ids only
    if (!/^[a-zA-Z0-9\-_]{8,64}$/.test(orgId)) {
      return NextResponse.json({ success: false, message: 'Invalid organization id' }, { status: 400 });
    }

    const productId =
      eventData?.product_id ||
      eventData?.product?.id ||
      eventData?.items?.[0]?.product_id ||
      metadata.product_id;

    const targetTier = resolveTierFromProduct(productId, metadata.tier);
    const subscriptionId = eventData?.subscription_id || eventData?.id || '';

    let admin;
    try {
      admin = requireSupabaseAdmin();
    } catch {
      console.error('[billing] Service role not configured for webhook');
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 503 });
    }

    if (eventType === 'subscription.active' || eventType === 'subscription.updated') {
      if (!targetTier) {
        console.warn('Could not resolve tier from product; refusing privilege elevation', {
          productId,
          metadataTier: metadata.tier,
        });
        return NextResponse.json({ success: false, message: 'Unknown product tier mapping' }, { status: 400 });
      }

      console.log(`Syncing subscription for org ${orgId} → ${targetTier}`);

      const { error: orgErr } = await admin
        .from('organizations')
        .update({
          subscription_tier: targetTier,
          subscription_status: 'active',
        })
        .eq('id', orgId);

      if (orgErr) throw orgErr;

      const start = eventData?.current_period_start
        ? new Date(eventData.current_period_start)
        : new Date();
      const end = eventData?.current_period_end
        ? new Date(eventData.current_period_end)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const { error: subErr } = await admin.from('subscriptions').upsert(
        {
          organization_id: orgId,
          stripe_subscription_id: subscriptionId,
          plan_tier: targetTier,
          status: 'active',
          current_period_start: start.toISOString(),
          current_period_end: end.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
      );

      if (subErr) {
        // Fallback if unique constraint missing: update then insert
        console.warn('subscriptions upsert failed, attempting update:', subErr.message);
        await admin
          .from('subscriptions')
          .update({
            plan_tier: targetTier,
            status: 'active',
            current_period_start: start.toISOString(),
            current_period_end: end.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId);
      }
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.failed') {
      console.log(`Downgrading org ${orgId} to free`);

      const { error: orgErr } = await admin
        .from('organizations')
        .update({
          subscription_tier: 'free',
          subscription_status: 'inactive',
        })
        .eq('id', orgId);

      if (orgErr) throw orgErr;

      await admin
        .from('subscriptions')
        .update({
          status: eventType === 'subscription.cancelled' ? 'cancelled' : 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', orgId);
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (error: unknown) {
    console.error('Webhook processing failure:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook internal error.' },
      { status: 500 }
    );
  }
}
