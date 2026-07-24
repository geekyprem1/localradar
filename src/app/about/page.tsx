import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '@/components/marketing/MarketingShell';
import { ArrowRight, Compass, Eye, Target } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About',
  description: 'LocalRadar builds AI-powered local growth intelligence for agencies and SMBs—honest product, no fake social proof.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <MarketingShell>
      <div className="relative z-10 mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2DD4A7]">About LocalRadar</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
          Local growth intelligence for operators who ship work
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-white/55">
          LocalRadar helps agencies, freelancers, and consultants turn public Google Maps and local business signals into scored opportunities and personalized outreach—without spreadsheets and without invented credibility theater.
        </p>

        <section className="mt-16 space-y-4">
          <div className="flex items-center gap-2 text-[#2DD4A7]">
            <Target className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-white">Mission</h2>
          </div>
          <p className="text-[15px] leading-relaxed text-white/55">
            Make high-quality local prospecting accessible to small teams. We believe the best pipeline starts with truth: real listings, transparent scores, and outreach you can defend in a sales call.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center gap-2 text-[#2DD4A7]">
            <Eye className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-white">Vision</h2>
          </div>
          <p className="text-[15px] leading-relaxed text-white/55">
            A world where every agency and SMB operator can identify local demand gaps in minutes, prioritize who to contact, and show up with research that earns trust—at a global scale, with privacy-first product standards.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center gap-2 text-[#2DD4A7]">
            <Compass className="h-5 w-5" />
            <h2 className="text-xl font-semibold text-white">Why we built LocalRadar</h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-white/55">
            <p>
              Selling to local businesses usually looks the same: open Maps, open a spreadsheet, open ten tabs, guess who might need a website or SEO, then write a cold email from scratch. The work is valuable—the process is broken.
            </p>
            <p>
              LocalRadar was built to compress that loop: scan a market, score digital opportunity, surface gaps, and draft outreach grounded in what the listing actually shows. We use AI where it accelerates analysis and writing—not as a substitute for human judgment.
            </p>
            <p>
              We do not invent customer logos, fake funding rounds, or fabricated pipeline metrics. If we claim it, the product does it—or we say it is roadmap. That is how we build for Google for Startups, cloud credits programs, Product Hunt, investor demos, and first paying customers: with substance.
            </p>
          </div>
        </section>

        <div className="mt-14 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2DD4A7] px-6 py-3 text-sm font-semibold text-[#04130E] transition-all hover:bg-[#3ee2b6]"
          >
            Start Free
            <ArrowRight className="h-4 w-4" />
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
