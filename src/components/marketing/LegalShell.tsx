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
        <p className="type-overline text-primary">Legal</p>
        <h1 className="type-display-sm mt-3">{title}</h1>
        <p className="type-caption mt-2">Last updated: {updated}</p>
        <div className="prose-legal prose-body type-body mt-10 max-w-[40rem] space-y-8 [&_h2]:type-h4 [&_h2]:mt-10 [&_h3]:type-h5 [&_h3]:mt-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_code]:font-mono [&_code]:text-sm">
          {children}
        </div>
      </article>
    </MarketingShell>
  );
}
