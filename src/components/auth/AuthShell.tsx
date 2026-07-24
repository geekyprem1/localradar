'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0B0C] p-4 font-sans">
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
      >
        Skip to form
      </a>
      <div className="pointer-events-none absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-[#2DD4A7]/5 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-[#2DD4A7]/5 blur-[120px]" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0C] rounded-lg"
          >
            <svg className="h-6 w-6 text-[#2DD4A7]" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
            </svg>
            <span className="text-h3 tracking-tight">LocalRadar</span>
          </Link>
          <p className="text-overline mt-2 text-[#A1A1AA]">
            AI local growth intelligence
          </p>
        </div>

        <div
          id="auth-main"
          className="relative z-10 rounded-[28px] border border-[#26282D] bg-[#141517] p-8 shadow-2xl"
        >
          <h1 className="text-h4 mb-2 text-center text-[#F4F4F5]">{title}</h1>
          {subtitle && (
            <p className="text-body-sm mb-6 text-center text-[#A1A1AA]">{subtitle}</p>
          )}
          {children}
        </div>

        <p className="mt-6 text-center text-2xs text-zinc-600">
          <Link href="/privacy" className="hover:text-zinc-400 focus:outline-none focus-visible:underline">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-zinc-400 focus:outline-none focus-visible:underline">Terms</Link>
          {' · '}
          <Link href="/contact" className="hover:text-zinc-400 focus:outline-none focus-visible:underline">Help</Link>
        </p>
      </motion.div>
    </main>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/10 p-3.5 font-mono text-xs text-[#EF4444]"
    >
      <span className="mt-0.5 shrink-0" aria-hidden>⚠</span>
      <span>{message}</span>
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mb-5 rounded-xl border border-[#2DD4A7]/25 bg-[#2DD4A7]/10 p-3.5 font-mono text-xs text-[#2DD4A7]"
    >
      {message}
    </div>
  );
}

export const authInputClass =
  'type-input w-full rounded-xl border border-[#26282D] bg-[#0B0B0C] py-3 pl-10 pr-4 text-[#F4F4F5] transition-all focus:border-[#2DD4A7] focus:outline-none focus:ring-1 focus:ring-[#2DD4A7]';

export const authLabelClass =
  'type-overline mb-2 block text-[#A1A1AA]';

export const authPrimaryBtn =
  'type-button flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#2DD4A7] px-5 text-[#042F2E] transition-all hover:bg-[#3ee2b6] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141517]';
