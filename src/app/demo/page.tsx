'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketingShell from '@/components/marketing/MarketingShell';
import VideoModal from '@/components/marketing/VideoModal';
import VideoThumbnail from '@/components/marketing/VideoThumbnail';
import { ArrowRight, Check } from 'lucide-react';

export default function DemoPage() {
  const [open, setOpen] = useState(false);
  const [which, setWhich] = useState<'product' | 'onboarding'>('product');

  return (
    <MarketingShell>
      <div className="relative z-10 mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="type-overline text-primary">Demo</p>
        <h1 className="type-display-sm mt-3 sm:text-5xl">
          See LocalRadar in action
        </h1>
        <p className="type-body-lg mt-5 max-w-2xl">
          Watch a product walkthrough or jump straight into a free account. No credit card. No invented customer stories—just the product.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <VideoThumbnail
            title="Product overview"
            subtitle="Scan → score → outreach workflow"
            onPlay={() => {
              setWhich('product');
              setOpen(true);
            }}
          />
          <VideoThumbnail
            title="Dashboard onboarding"
            subtitle="First scan in under two minutes"
            onPlay={() => {
              setWhich('onboarding');
              setOpen(true);
            }}
          />
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/45">
          {['AI Powered', 'No Credit Card Required', '20 Free Scans', 'Built for Agencies'].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#2DD4A7]" aria-hidden />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2DD4A7] px-7 py-3.5 text-sm font-semibold text-[#04130E] transition-all hover:bg-[#3ee2b6]"
          >
            Start Free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/#demo"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-7 py-3.5 text-sm font-medium text-white/80 transition-all hover:bg-white/[0.06]"
          >
            Try interactive scanner
          </Link>
        </div>
      </div>

      <VideoModal
        open={open}
        onClose={() => setOpen(false)}
        title={which === 'product' ? 'Product overview' : 'Dashboard onboarding'}
        description="Hosted demo video when configured · otherwise opens the live product walkthrough"
      />
    </MarketingShell>
  );
}
