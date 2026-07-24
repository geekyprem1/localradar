import type { Metadata } from 'next';
import LegalShell from '@/components/marketing/LegalShell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | LocalRadar',
  description: 'Rules for responsible use of LocalRadar.',
};

export default function AcceptableUsePage() {
  return (
    <LegalShell title="Acceptable Use Policy" updated="July 24, 2026">
      <p>
        This Acceptable Use Policy (“AUP”) is part of our <Link href="/terms">Terms of Service</Link>. Violation may result in suspension or termination.
      </p>

      <h2>1. Lawful use only</h2>
      <p>You may use LocalRadar only for lawful purposes. You must comply with all applicable laws, including marketing, privacy, consumer protection, anti-spam, and export rules.</p>

      <h2>2. Prohibited activities</h2>
      <ul>
        <li>Scraping or abusing the platform beyond plan limits or circumventing rate limits</li>
        <li>Attempting to breach security, probe systems, or reverse engineer except as allowed by law</li>
        <li>Uploading malware or interfering with other customers</li>
        <li>Using the Services to harass, defraud, or impersonate others</li>
        <li>Sending unsolicited bulk messages in violation of CAN-SPAM, CASL, GDPR e-privacy rules, or local equivalents</li>
        <li>Misrepresenting affiliation with LocalRadar or fabricating endorsements</li>
        <li>Processing special-category personal data or children’s data without lawful basis</li>
        <li>Using outputs to discriminate unlawfully or for illegal surveillance</li>
      </ul>

      <h2>3. Outreach responsibility</h2>
      <p>
        LocalRadar helps you research public business signals and draft messages. You are solely responsible for verifying data accuracy, obtaining any required consents, honoring opt-outs, and the content of communications you send.
      </p>

      <h2>4. Fair usage</h2>
      <p>
        We may throttle or suspend accounts that create abnormal load, automate access in ways that harm service stability, or resell access without authorization.
      </p>

      <h2>5. Reporting abuse</h2>
      <p>
        Report abuse to <a href="mailto:hello@localradar.io">hello@localradar.io</a>.
      </p>
    </LegalShell>
  );
}
