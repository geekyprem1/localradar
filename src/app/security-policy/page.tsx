import type { Metadata } from 'next';
import LegalShell from '@/components/marketing/LegalShell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security Policy | LocalRadar',
  description: 'LocalRadar security practices and responsible disclosure.',
};

export default function SecurityPolicyPage() {
  return (
    <LegalShell title="Security Policy" updated="July 24, 2026">
      <p>
        LocalRadar takes security seriously. This page summarizes our approach for customers evaluating the product for agency and enterprise use. It is not a formal certification claim.
      </p>

      <h2>1. Principles</h2>
      <ul>
        <li>Least privilege access to production systems</li>
        <li>Encryption in transit (TLS) for application traffic</li>
        <li>Encryption at rest for sensitive data stores where the platform is configured to do so</li>
        <li>Secure authentication for user accounts</li>
        <li>Separation of customer workspaces by account/organization controls</li>
      </ul>

      <h2>2. Application security</h2>
      <ul>
        <li>Authenticated API routes for protected resources</li>
        <li>Input validation and server-side authorization checks</li>
        <li>Dependency and platform updates as part of ongoing maintenance</li>
        <li>Secrets and API keys stored via environment configuration / encrypted storage patterns (not committed to source control)</li>
      </ul>

      <h2>3. Authentication & sessions</h2>
      <p>
        User authentication is provided through our configured auth provider. Sessions are protected according to provider best practices. Users should enable strong passwords and protect their email accounts.
      </p>

      <h2>4. Payments</h2>
      <p>
        Card payments are handled by PCI-compliant payment processors. LocalRadar does not store full payment card numbers.
      </p>

      <h2>5. Third parties</h2>
      <p>
        We rely on reputable infrastructure, database, and AI providers. Vendor access is limited to what is required to operate the Services. Review our <Link href="/privacy">Privacy Policy</Link> for processing details.
      </p>

      <h2>6. Customer responsibilities</h2>
      <ul>
        <li>Protect account credentials and team access</li>
        <li>Use BYOK / API keys carefully and rotate when needed</li>
        <li>Review AI-generated content before sending to clients or prospects</li>
        <li>Comply with marketing and privacy laws in your outreach</li>
      </ul>

      <h2>7. Incident response</h2>
      <p>
        If we become aware of a security incident affecting customer personal data, we will investigate and notify affected customers and regulators as required by applicable law.
      </p>

      <h2>8. Vulnerability reporting</h2>
      <p>
        If you believe you have found a vulnerability, email <a href="mailto:security@localradar.io">security@localradar.io</a> with details and reproduction steps. Please avoid privacy-invasive testing and give us reasonable time to respond before public disclosure.
      </p>

      <h2>9. No false certifications</h2>
      <p>
        We do not claim SOC 2, ISO, or similar certifications on this site unless we have completed and can evidence them. When certifications are obtained, this page will be updated.
      </p>
    </LegalShell>
  );
}
