import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

const TOPICS = new Set(['general', 'support', 'sales', 'security', 'billing']);

/**
 * Contact intake API.
 * - Always validates input
 * - If CONTACT_WEBHOOK_URL is set, POSTs structured payload (Zapier/Make/Resend webhook)
 * - Otherwise returns instructions to email hello@ without false "delivered" claims
 */
export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
    const rate = checkRateLimit(`contact:${ip}`, 10, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many messages. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
    }

    const name = String(body.name || '').trim().slice(0, 120);
    const email = String(body.email || '').trim().slice(0, 200);
    const company = String(body.company || '').trim().slice(0, 200);
    const topic = String(body.topic || 'general').trim();
    const message = String(body.message || '').trim().slice(0, 5000);

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!TOPICS.has(topic)) {
      return NextResponse.json({ success: false, message: 'Invalid topic.' }, { status: 400 });
    }

    const payload = {
      name,
      email,
      company,
      topic,
      message,
      received_at: new Date().toISOString(),
      source: 'localradar-contact-form',
    };

    const webhook = process.env.CONTACT_WEBHOOK_URL;
    if (webhook) {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error('Contact webhook failed', res.status);
        return NextResponse.json(
          {
            success: false,
            message: 'Could not deliver message. Email hello@localradar.io directly.',
          },
          { status: 502 }
        );
      }
      return NextResponse.json({
        success: true,
        delivered: true,
        message: 'Message received. We typically respond within 1–2 business days.',
      });
    }

    // No webhook configured — honest response (not a fake "sent")
    console.info('[contact]', JSON.stringify({ ...payload, message: '[redacted length ' + message.length + ']' }));
    return NextResponse.json({
      success: true,
      delivered: false,
      mailto: `mailto:hello@localradar.io?subject=${encodeURIComponent(`[LocalRadar ${topic}] ${name}`)}&body=${encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nCompany: ${company || '—'}\nTopic: ${topic}\n\n${message}`
      )}`,
      message:
        'Form validated. Configure CONTACT_WEBHOOK_URL for server delivery, or use the provided mailto link / hello@localradar.io.',
    });
  } catch (err) {
    console.error('Contact API error', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
