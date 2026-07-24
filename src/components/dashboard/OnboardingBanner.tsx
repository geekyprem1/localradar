'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, X, Search, ArrowRight } from 'lucide-react';
import VideoModal from '@/components/marketing/VideoModal';

const STORAGE_KEY = 'localradar-onboarding-dismissed';

export default function OnboardingBanner({ hasData }: { hasData: boolean }) {
  const [dismissed, setDismissed] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (hasData || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-secondary-text hover:bg-background hover:text-foreground cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Dismiss onboarding"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Get started</p>
        <h2 className="mt-2 pr-8 text-lg font-semibold text-foreground">
          Run your first market scan
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-secondary-text">
          Pick a niche and city. LocalRadar scores opportunities and prepares outreach—your metrics stay empty until you scan real data.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/dashboard/lead-finder"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary transition-opacity hover:opacity-90"
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            Start scanning
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setVideoOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary-bg cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
            Watch onboarding
          </button>
        </div>
      </div>
      <VideoModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        title="Dashboard onboarding"
        description="How to run your first scan and read opportunity scores"
      />
    </>
  );
}
