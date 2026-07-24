import Link from 'next/link';
import MarketingShell from './MarketingShell';
import { ArrowRight } from 'lucide-react';

export default function ComingSoonPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <MarketingShell>
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
        <span className="rounded-full border border-[#2DD4A7]/25 bg-[#2DD4A7]/10 px-3 py-1 font-mono text-2xs uppercase tracking-[0.18em] text-[#2DD4A7]">
          {eyebrow}
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-white/50">{description}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2DD4A7] px-6 py-3 text-sm font-semibold text-[#04130E] transition-all hover:bg-[#3ee2b6]"
          >
            Start Free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/[0.06]"
          >
            Contact us
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
