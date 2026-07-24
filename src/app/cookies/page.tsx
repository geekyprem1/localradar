import type { Metadata } from 'next';
import LegalShell from '@/components/marketing/LegalShell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | LocalRadar',
  description: 'How LocalRadar uses cookies and similar technologies.',
};

export default function CookiesPage() {
  return (
    <LegalShell title="Cookie Policy" updated="July 24, 2026">
      <p>
        This Cookie Policy explains how LocalRadar uses cookies and similar technologies on our websites and applications. For broader data practices, see our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device. Similar technologies include local storage, session storage, and pixels. We use these to run the product securely and understand basic usage.
      </p>

      <h2>2. Types we use</h2>
      <h3>Strictly necessary</h3>
      <ul>
        <li>Authentication and session management</li>
        <li>Security and fraud prevention</li>
        <li>Load balancing and preference storage required for core features (e.g., theme)</li>
      </ul>
      <h3>Functional</h3>
      <ul>
        <li>Remember UI preferences such as light/dark theme</li>
        <li>Improve form and dashboard experience</li>
      </ul>
      <h3>Analytics (if enabled)</h3>
      <ul>
        <li>Aggregate traffic and feature usage to improve the product</li>
        <li>We aim to minimize personal data in analytics configurations</li>
      </ul>

      <h2>3. Local storage</h2>
      <p>
        The product may store non-sensitive preferences in browser local storage (for example, theme selection under <code>localradar-theme</code>). Clearing site data removes these preferences.
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        You can control cookies through your browser settings. Blocking strictly necessary cookies may prevent login or core product functions from working.
      </p>

      <h2>5. Third parties</h2>
      <p>
        Payment, authentication, and infrastructure providers may set their own cookies when you interact with their services. Review those providers’ policies for details.
      </p>

      <h2>6. Updates</h2>
      <p>We may update this Policy as our practices evolve. The “Last updated” date reflects the latest revision.</p>

      <h2>7. Contact</h2>
      <p>
        <a href="mailto:privacy@localradar.io">privacy@localradar.io</a>
      </p>
    </LegalShell>
  );
}
