'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#08090A] px-6 text-center text-white">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#2DD4A7]">500</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Server error</h1>
      <p className="mt-3 max-w-md text-sm text-white/50">
        We hit an unexpected issue. Try again, or return home. If it persists, contact hello@localradar.io.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#2DD4A7] px-5 py-2.5 text-sm font-semibold text-[#04130E] cursor-pointer"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
