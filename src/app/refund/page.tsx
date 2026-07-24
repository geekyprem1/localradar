import type { Metadata } from 'next';
import LegalShell from '@/components/marketing/LegalShell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy | LocalRadar',
  description: 'LocalRadar subscription refund and cancellation policy.',
};

export default function RefundPage() {
  return (
    <LegalShell title="Refund Policy" updated="July 24, 2026">
      <p>
        This Refund Policy applies to paid LocalRadar subscriptions purchased through our self-serve billing. Enterprise contracts may include different commercial terms in a signed order form.
      </p>

      <h2>1. Free plan</h2>
      <p>The Free plan has no charge. No refunds apply.</p>

      <h2>2. Cancellations</h2>
      <p>
        You may cancel a paid subscription at any time from account billing settings (or by contacting support). Cancellation stops future renewals. You typically retain access until the end of the current paid period unless otherwise stated.
      </p>

      <h2>3. Refunds</h2>
      <p>
        Unless required by law or expressly stated for a promotion:
      </p>
      <ul>
        <li>Monthly plans are generally non-refundable for the current billing period once charged.</li>
        <li>Annual plans may be eligible for a partial refund within 14 days of initial purchase if you have not substantially consumed plan limits (we evaluate fair use).</li>
        <li>Duplicate charges or verified billing errors will be corrected.</li>
      </ul>

      <h2>4. How to request a refund</h2>
      <p>
        Email <a href="mailto:hello@localradar.io">hello@localradar.io</a> with your account email, invoice ID, and reason. We aim to respond within a few business days.
      </p>

      <h2>5. Chargebacks</h2>
      <p>
        Please contact us before filing a chargeback so we can resolve issues quickly. Unfounded chargebacks may result in account suspension.
      </p>

      <h2>6. Changes</h2>
      <p>
        We may update this Policy. Continued purchases after updates are subject to the version in effect at purchase time. See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalShell>
  );
}
