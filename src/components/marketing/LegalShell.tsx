import MarketingShell from './MarketingShell';

export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingShell>
      <article className="relative z-10 mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-overline text-[#2DD4A7]">Legal</p>
        <h1 className="text-display-sm mt-3 text-[var(--text-primary)]">{title}</h1>
        <p className="text-caption mt-2">Last updated: {updated}</p>
        <div className="prose-legal prose-body mt-10 max-w-[40rem] space-y-8 text-[0.9375rem] leading-[1.65] tracking-[-0.011em] text-[var(--text-secondary)] [&_h2]:mt-10 [&_h2]:text-[1.125rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-[var(--text-primary)] [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-[var(--text-link)] [&_a]:underline-offset-3 hover:[&_a]:underline [&_code]:font-mono [&_code]:text-[0.85em]">
          {children}
        </div>
      </article>
    </MarketingShell>
  );
}
