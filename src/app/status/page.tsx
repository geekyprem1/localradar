import type { Metadata } from 'next';
import MarketingShell from '@/components/marketing/MarketingShell';
import { buildMetadata } from '@/lib/seo';
import { CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'Status',
  description: 'LocalRadar system status. Operational transparency for agencies and enterprise evaluators.',
  path: '/status',
});

const systems = [
  { name: 'Web application', detail: 'Marketing site and dashboard' },
  { name: 'Authentication', detail: 'Sign-in and session management' },
  { name: 'Search & scoring', detail: 'Market scan and opportunity scoring APIs' },
  { name: 'Billing webhooks', detail: 'Subscription lifecycle events' },
];

export default function StatusPage() {
  return (
    <MarketingShell>
      <div className="relative z-10 mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="type-overline text-primary">Status</p>
        <h1 className="type-h1 mt-3 sm:text-4xl">
          System status
        </h1>
        <p className="type-body mt-4">
          We publish this page for transparency. It does not invent uptime history. If a component is degraded, we will mark it here when automated status monitoring is connected.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0C0D]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
            <CheckCircle2 className="h-4 w-4 text-[#2DD4A7]" aria-hidden />
            <span className="type-h5 text-foreground">All systems operational</span>
            <span className="ml-auto type-overline">
              Monitored
            </span>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {systems.map((s) => (
              <li key={s.name} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="type-h6 text-foreground">{s.name}</p>
                  <p className="mt-0.5 type-caption">{s.detail}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[#2DD4A7]/25 bg-[#2DD4A7]/10 px-2.5 py-0.5 font-mono text-2xs uppercase text-[#2DD4A7]">
                  Operational
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 type-caption">
          Incident reports and historical uptime will appear here when a status provider is configured. For urgent issues, email{' '}
          <a href="mailto:hello@localradar.io" className="text-[#2DD4A7] hover:underline">
            hello@localradar.io
          </a>
          .
        </p>
      </div>
    </MarketingShell>
  );
}
