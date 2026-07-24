import type { Metadata } from 'next';
import LegalShell from '@/components/marketing/LegalShell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | LocalRadar',
  description: 'Terms governing use of the LocalRadar platform.',
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="July 24, 2026">
      <p>
        These Terms of Service (“Terms”) govern access to and use of LocalRadar’s websites, applications, and services (the “Services”). By creating an account or using the Services, you agree to these Terms.
      </p>
      <p>
        Related policies: <Link href="/privacy">Privacy</Link>, <Link href="/acceptable-use">Acceptable Use</Link>, <Link href="/refund">Refunds</Link>, <Link href="/ai-usage">AI Usage</Link>.
      </p>

      <h2>1. The Services</h2>
      <p>
        LocalRadar provides software tools to research local markets using publicly available business signals, score opportunities, and generate draft audits/outreach. Features vary by plan. We may modify or discontinue features with reasonable notice when practical.
      </p>

      <h2>2. Accounts</h2>
      <p>You must provide accurate registration information and keep credentials secure. You are responsible for activity under your account. Notify us promptly of unauthorized use.</p>

      <h2>3. Eligibility</h2>
      <p>You must be able to form a binding contract and may not use the Services if prohibited by applicable law. The Services are for business use.</p>

      <h2>4. Subscriptions and billing</h2>
      <p>
        Paid plans renew according to the billing cycle you select until canceled. Taxes may apply. Failure to pay may result in suspension. Enterprise plans may be governed by a separate order form.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        You must comply with our <Link href="/acceptable-use">Acceptable Use Policy</Link>, including all laws governing marketing, anti-spam, data protection, and solicitation. You are solely responsible for how you contact third parties.
      </p>

      <h2>6. Public data and accuracy</h2>
      <p>
        Business data shown in the product may come from third-party public sources and can be incomplete, outdated, or incorrect. Scores and estimates are decision-support tools, not guarantees of revenue, close rates, or results. Always verify before outreach or commercial decisions.
      </p>

      <h2>7. AI outputs</h2>
      <p>
        AI-generated content may be inaccurate or inappropriate. You must review outputs before sending. You retain responsibility for messages, proposals, and claims you make to third parties. See <Link href="/ai-usage">AI Usage Policy</Link>.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        We and our licensors own the Services, branding, and software. Subject to these Terms, we grant you a limited, non-exclusive, non-transferable license to use the Services for your internal business purposes. You retain rights to your inputs; you grant us a license to process them to provide the Services.
      </p>

      <h2>9. Confidentiality</h2>
      <p>Each party may receive confidential information from the other and will use reasonable care to protect it, except for information that is public, independently developed, or required to be disclosed by law.</p>

      <h2>10. Third-party services</h2>
      <p>The Services may integrate with third parties (auth, payments, maps data providers, AI providers). Their terms govern those services. We are not responsible for third-party outages or policy changes.</p>

      <h2>11. Disclaimers</h2>
      <p>
        THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOCALRADAR WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS/REVENUE/DATA. OUR AGGREGATE LIABILITY ARISING OUT OF THE SERVICES WILL NOT EXCEED THE AMOUNTS YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM.
      </p>

      <h2>13. Indemnity</h2>
      <p>
        You will defend and indemnify LocalRadar against claims arising from your use of the Services, your outreach content, your violation of law or these Terms, or your misuse of third-party data.
      </p>

      <h2>14. Termination</h2>
      <p>You may stop using the Services at any time. We may suspend or terminate access for breach, risk, or non-payment. Provisions that should survive will survive termination.</p>

      <h2>15. Governing law</h2>
      <p>
        Unless a separate enterprise agreement states otherwise, these Terms are governed by the laws applicable in the jurisdiction where LocalRadar is organized, without regard to conflict-of-law rules. Courts there have exclusive jurisdiction, subject to mandatory consumer protections where they apply.
      </p>

      <h2>16. Changes</h2>
      <p>We may update these Terms. Continued use after the effective date constitutes acceptance where permitted. If you disagree, stop using the Services.</p>

      <h2>17. Contact</h2>
      <p>
        Questions: <a href="mailto:hello@localradar.io">hello@localradar.io</a> · <Link href="/contact">Contact page</Link>
      </p>
    </LegalShell>
  );
}
