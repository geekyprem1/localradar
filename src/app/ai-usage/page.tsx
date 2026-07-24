import type { Metadata } from 'next';
import LegalShell from '@/components/marketing/LegalShell';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Usage Policy | LocalRadar',
  description: 'How LocalRadar uses AI and your responsibilities when using AI features.',
};

export default function AiUsagePage() {
  return (
    <LegalShell title="AI Usage Policy" updated="July 24, 2026">
      <p>
        This AI Usage Policy explains how artificial intelligence features work in LocalRadar and what you should expect. It complements our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>1. What AI is used for</h2>
      <p>LocalRadar may use AI systems to:</p>
      <ul>
        <li>Analyze public business listing signals and related research inputs</li>
        <li>Help score and prioritize opportunities</li>
        <li>Generate draft audits, emails, DMs, proposals, and recommendations</li>
        <li>Summarize findings to speed human decision-making</li>
      </ul>
      <p>We do not require naming specific model vendors in the product UI unless you configure your own keys.</p>

      <h2>2. Human oversight</h2>
      <p>
        AI outputs are assistive. They can be incomplete, outdated, or incorrect. You must review, edit, and approve any content before sending it to a prospect, client, or third party.
      </p>

      <h2>3. Data you provide</h2>
      <p>
        Do not submit passwords, payment card data, government IDs, health records, or other sensitive personal data into generation features unless you have a lawful basis and the product is designed for that processing (it is not a medical or legal advice system).
      </p>

      <h2>4. Bring-your-own-key (BYOK)</h2>
      <p>
        On eligible plans, you may connect your own provider credentials. When you do, processing may occur under that provider’s terms and your account with them. You are responsible for securing those keys and complying with the provider’s policies.
      </p>

      <h2>5. Training</h2>
      <p>
        We do not sell your private workspace content as a dataset. Whether prompts/outputs are retained by third-party model providers depends on your configuration and that provider’s settings. Prefer enterprise/no-training options where available.
      </p>

      <h2>6. Prohibited AI uses</h2>
      <ul>
        <li>Generating deceptive or fraudulent content</li>
        <li>Impersonating individuals or organizations without authorization</li>
        <li>Producing unlawful, harassing, or discriminatory outreach</li>
        <li>Attempting to reverse-engineer or extract model weights via the product</li>
      </ul>

      <h2>7. Transparency</h2>
      <p>
        When you use LocalRadar outputs in client work, you remain responsible for disclosure obligations that apply to your industry or jurisdiction (for example, advertising rules about AI-generated content where required).
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions: <a href="mailto:hello@localradar.io">hello@localradar.io</a>
      </p>
    </LegalShell>
  );
}
