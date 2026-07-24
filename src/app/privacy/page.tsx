import type { Metadata } from 'next';
import LegalShell from '@/components/marketing/LegalShell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | LocalRadar',
  description: 'How LocalRadar collects, uses, and protects personal data.',
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="July 24, 2026">
      <p>
        This Privacy Policy explains how LocalRadar (“LocalRadar,” “we,” “us,” or “our”) collects, uses, shares, and protects information when you use our websites, applications, and related services (the “Services”).
      </p>
      <p>
        Contact for privacy requests: <a href="mailto:privacy@localradar.io">privacy@localradar.io</a>.
      </p>

      <h2>1. Information we collect</h2>
      <h3>Account information</h3>
      <p>When you create an account, we may collect name, email address, organization name, password or auth tokens, and plan/billing-related identifiers.</p>
      <h3>Usage and product data</h3>
      <p>We collect information about how you use the Services, including search queries, features used, scan activity counts, device/browser type, IP address, and approximate location derived from IP.</p>
      <h3>Payment data</h3>
      <p>Payments are processed by third-party processors (e.g., Stripe). We do not store full card numbers on our servers. We may receive limited billing metadata (last4, plan status, invoices).</p>
      <h3>Business research data</h3>
      <p>The product surfaces publicly available business listing information (e.g., Google Business / Maps-related public signals). That data is not treated as your personal data when it refers to businesses, but your saved lists and notes may be associated with your account.</p>
      <h3>Communications</h3>
      <p>If you contact us, we keep the content of those messages and related metadata to respond and improve support.</p>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, operate, and improve the Services</li>
        <li>Authenticate users and secure accounts</li>
        <li>Process subscriptions and prevent fraud</li>
        <li>Generate product outputs you request (scores, audits, outreach drafts)</li>
        <li>Communicate product updates and transactional messages</li>
        <li>Comply with law and enforce our Terms</li>
      </ul>

      <h2>3. AI processing</h2>
      <p>
        Certain features use AI systems to analyze inputs and generate outputs (e.g., outreach drafts). Content you submit for generation may be processed by our infrastructure and, where configured, third-party model providers. See our{' '}
        <Link href="/ai-usage">AI Usage Policy</Link>. Do not submit secrets you are not authorized to process.
      </p>

      <h2>4. Legal bases (EEA/UK where applicable)</h2>
      <p>Where GDPR/UK GDPR applies, we rely on: contract performance, legitimate interests (product improvement, security), consent (where required), and legal obligation.</p>

      <h2>5. Sharing</h2>
      <p>We may share data with:</p>
      <ul>
        <li>Infrastructure and analytics providers under contract</li>
        <li>Payment processors</li>
        <li>AI providers you or we configure for generation features</li>
        <li>Professional advisors and authorities when required by law</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>6. International transfers</h2>
      <p>Data may be processed in countries outside your own. Where required, we use appropriate safeguards (e.g., standard contractual clauses) with vendors.</p>

      <h2>7. Retention</h2>
      <p>We retain account data for as long as your account is active and as needed for legal, security, and accounting purposes. You may request deletion subject to legal holds.</p>

      <h2>8. Security</h2>
      <p>We implement technical and organizational measures appropriate to risk. No method of transmission is 100% secure. See our <Link href="/security-policy">Security Policy</Link>.</p>

      <h2>9. Your rights</h2>
      <p>Depending on your location, you may have rights to access, correct, delete, port, or restrict processing of personal data, and to object or withdraw consent. Contact privacy@localradar.io. You may also lodge a complaint with a supervisory authority.</p>

      <h2>10. Cookies</h2>
      <p>We use essential cookies and similar technologies. See our <Link href="/cookies">Cookie Policy</Link>.</p>

      <h2>11. Children</h2>
      <p>The Services are not directed to children under 16. We do not knowingly collect personal data from children.</p>

      <h2>12. Changes</h2>
      <p>We may update this Policy. Material changes will be posted with an updated date. Continued use after changes constitutes acceptance where permitted by law.</p>
    </LegalShell>
  );
}
