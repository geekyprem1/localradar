import type { Metadata } from 'next';
import LegalShell from '@/components/marketing/LegalShell';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Subprocessors',
  description: 'Third-party subprocessors used by LocalRadar to deliver the service.',
  path: '/subprocessors',
});

export default function SubprocessorsPage() {
  return (
    <LegalShell title="Subprocessors" updated="July 24, 2026">
      <p>
        LocalRadar uses carefully selected subprocessors to host infrastructure, process payments,
        and provide AI generation features. This list supports vendor security reviews (including
        cloud credit and startup program questionnaires).
      </p>

      <h2>Infrastructure &amp; data</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication, Postgres database, row-level security, storage as configured
        </li>
        <li>
          <strong>Vercel</strong> (or your chosen host) — application hosting, edge network, build pipeline
        </li>
      </ul>

      <h2>Payments</h2>
      <ul>
        <li>
          <strong>DodoPayments</strong> — subscription checkout and billing webhooks
        </li>
      </ul>

      <h2>Intelligence &amp; maps data</h2>
      <ul>
        <li>
          <strong>Google Places / Maps Platform</strong> — public local business listing signals when configured
        </li>
        <li>
          <strong>OpenRouter and/or OpenAI</strong> — AI text generation for outreach drafts when configured
          (or customer-supplied keys under BYOK)
        </li>
      </ul>

      <h2>Communications (optional)</h2>
      <ul>
        <li>
          <strong>Email / webhook tools</strong> (e.g. Resend, Zapier, Make) — only if you set{' '}
          <code>CONTACT_WEBHOOK_URL</code> for contact form delivery
        </li>
      </ul>

      <h2>Notes</h2>
      <ul>
        <li>We do not sell customer account data.</li>
        <li>Customer BYOK credentials are encrypted at rest when <code>ENCRYPTION_SECRET</code> is configured.</li>
        <li>For DPA / security questionnaires, email sales@localradar.io.</li>
      </ul>
    </LegalShell>
  );
}
