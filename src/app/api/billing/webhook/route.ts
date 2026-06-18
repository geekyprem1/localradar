import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

/**
 * Constant-time webhook signature verification using SHA-256 HMAC (Standard Webhooks spec)
 */
function verifyWebhook(
  id: string,
  timestamp: string,
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    if (!id || !timestamp || !rawBody || !signatureHeader || !secret) return false;

    // 1. Construct the signed content
    const signedContent = `${id}.${timestamp}.${rawBody}`;

    // 2. Prepare secret key (remove whsec_ prefix and decode from base64)
    const cleanSecret = secret.replace('whsec_', '');
    const secretBytes = Buffer.from(cleanSecret, 'base64');

    // 3. Compute HMAC SHA-256
    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    // 4. Compare with signature header (Standard Webhooks format: v1,signature_hash)
    const passedSignatures = signatureHeader.split(' ');
    for (const passedSignature of passedSignatures) {
      const parts = passedSignature.split(',');
      if (parts.length !== 2) continue;
      
      const [version, hash] = parts;
      if (version !== 'v1') continue;

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const passedBuffer = Buffer.from(hash, 'utf8');

      // Constant-time check to prevent timing attacks
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

    // Extract headers (support both standard webhook headers and Svix headers)
    const webhookId = request.headers.get('webhook-id') || request.headers.get('svix-id') || '';
    const webhookTimestamp = request.headers.get('webhook-timestamp') || request.headers.get('svix-timestamp') || '';
    const webhookSignature = request.headers.get('webhook-signature') || request.headers.get('svix-signature') || '';

    // Verify webhook signature (skip only if secret is 'mock-key' for developer local sandbox testing)
    if (webhookSecret !== 'mock-key') {
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
    } else {
      console.warn('[Sandbox] Bypassing webhook signature verification.');
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const eventData = payload.data;
    const metadata = eventData?.metadata || {};

    const orgId = metadata.organization_id;
    const targetTier = metadata.tier || 'free';
    const subscriptionId = eventData?.subscription_id || eventData?.id || '';

    if (!orgId) {
      console.warn('Webhook received without organization ID metadata. Payload:', payload);
      return NextResponse.json({ success: true, message: 'Skipped - no org metadata.' });
    }

    // Process DodoPayments subscription states
    if (eventType === 'subscription.active' || eventType === 'subscription.updated') {
      console.log(`Syncing active subscription for organization: ${orgId} to plan: ${targetTier}`);

      // 1. Update organization billing tier
      const { error: orgErr } = await supabase
        .from('organizations')
        .update({
          subscription_tier: targetTier,
          subscription_status: 'active'
        })
        .eq('id', orgId);

      if (orgErr) throw orgErr;

      // 2. Sync active subscription cycle details
      const start = eventData?.current_period_start 
        ? new Date(eventData.current_period_start) 
        : new Date();
      const end = eventData?.current_period_end 
        ? new Date(eventData.current_period_end) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const { error: subErr } = await supabase
        .from('subscriptions')
        .upsert({
          organization_id: orgId,
          stripe_subscription_id: subscriptionId,
          plan_tier: targetTier,
          status: 'active',
          current_period_start: start.toISOString(),
          current_period_end: end.toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id' });

      if (subErr) throw subErr;

    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.failed') {
      console.log(`Downgrading subscription for organization: ${orgId} to FREE due to cancel/fail`);

      // 1. Reset organization back to free
      const { error: orgErr } = await supabase
        .from('organizations')
        .update({
          subscription_tier: 'free',
          subscription_status: 'inactive'
        })
        .eq('id', orgId);

      if (orgErr) throw orgErr;

      // 2. Update subscription record status
      const { error: subErr } = await supabase
        .from('subscriptions')
        .update({
          status: eventType === 'subscription.cancelled' ? 'cancelled' : 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', orgId);

      if (subErr) throw subErr;
    }

    return NextResponse.json({ success: true, event: eventType });

  } catch (error: any) {
    console.error('Webhook processing failure:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Webhook internal error.' 
    }, { status: 500 });
  }
}
