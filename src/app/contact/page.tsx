import type { Metadata } from 'next';
import type { ComponentType } from 'react';
import Link from 'next/link';
import MarketingShell from '@/components/marketing/MarketingShell';
import ContactForm from '@/components/marketing/ContactForm';
import { Mail, Building2, LifeBuoy, MessageSquare } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description:
    'Contact LocalRadar for product support, sales, enterprise security reviews, and general questions. Business email and support form.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <MarketingShell>
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="type-overline text-primary">Contact</p>
        <h1 className="type-display-sm mt-3 max-w-2xl sm:text-5xl">
          Talk to a real team
        </h1>
        <p className="type-body-lg mt-6 max-w-xl">
          Support, sales, and general questions—pick a channel or use the form. No fake chatbots, no invented headcount.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Channel
            icon={Mail}
            title="Business email"
            body="Primary inbox for product & partnerships"
            href="mailto:hello@localradar.io"
            cta="hello@localradar.io"
          />
          <Channel
            icon={LifeBuoy}
            title="Support"
            body="Account, scans, billing issues"
            href="mailto:hello@localradar.io?subject=Support%20request"
            cta="Open support email"
          />
          <Channel
            icon={Building2}
            title="Sales"
            body="Enterprise, custom limits, security reviews"
            href="mailto:sales@localradar.io"
            cta="sales@localradar.io"
          />
          <Channel
            icon={MessageSquare}
            title="General questions"
            body="Product fit, demos, press"
            href="mailto:hello@localradar.io?subject=General%20question"
            cta="Ask anything"
          />
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-white">Support form</h2>
            <p className="mt-2 text-sm text-white/45">
              Structured intake so we can route Sales, Support, and Security correctly.
            </p>
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#0B0C0D] p-6 sm:p-8">
              <ContactForm />
            </div>
          </div>
          <aside className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm text-white/50">
              <p className="font-semibold text-white">Prefer self-serve?</p>
              <p className="mt-2 leading-relaxed">
                Most teams evaluate LocalRadar with a free account—no credit card, 20 free scans.
              </p>
              <Link
                href="/signup"
                className="mt-4 inline-flex text-sm font-semibold text-[#2DD4A7] hover:underline"
              >
                Start Free →
              </Link>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-sm text-white/50">
              <p className="font-semibold text-white">Security questionnaires</p>
              <p className="mt-2 leading-relaxed">
                Share your vendor review packet to{' '}
                <a href="mailto:sales@localradar.io" className="text-[#2DD4A7] hover:underline">
                  sales@localradar.io
                </a>
                . See also our{' '}
                <Link href="/security-policy" className="text-[#2DD4A7] hover:underline">
                  Security Policy
                </Link>
                .
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 text-xs text-white/35">
              Prefer email? hello@localradar.io · sales@localradar.io · privacy@localradar.io
            </div>
          </aside>
        </div>
      </div>
    </MarketingShell>
  );
}

function Channel({
  icon: Icon,
  title,
  body,
  href,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl border border-white/[0.08] bg-[#0B0C0D] p-5 transition-colors hover:border-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7]"
    >
      <Icon className="h-5 w-5 text-[#2DD4A7]" aria-hidden />
      <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-white/45">{body}</p>
      <p className="mt-3 font-mono text-2xs text-[#2DD4A7]">{cta}</p>
    </a>
  );
}
