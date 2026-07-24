'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

function VerifyContent() {
  const params = useSearchParams();
  const email = params.get('email') || 'your inbox';
  const mode = params.get('mode');
  const isMagic = mode === 'magic';

  return (
    <AuthShell
      title={isMagic ? 'Check your email for a magic link' : 'Verify your email'}
      subtitle={
        isMagic
          ? `We sent a one-click sign-in link to ${email}. It expires shortly for security.`
          : `We sent a verification link to ${email}. Confirm your address to activate full access.`
      }
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[#2DD4A7]/25 bg-[#2DD4A7]/10">
          <Mail className="h-6 w-6 text-[#2DD4A7]" aria-hidden />
        </div>
        <ol className="w-full space-y-3 text-left text-xs leading-relaxed text-[#A1A1AA]">
          <li className="flex gap-2">
            <span className="font-mono text-[#2DD4A7]">1.</span>
            Open the message from LocalRadar (check spam if needed).
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-[#2DD4A7]">2.</span>
            Click the secure link in the email.
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-[#2DD4A7]">3.</span>
            You will return here signed in and ready to scan.
          </li>
        </ol>
        <p className="mt-6 text-[11px] text-zinc-600">
          Wrong email?{' '}
          <Link href={isMagic ? '/login' : '/signup'} className="font-bold text-[#2DD4A7] hover:underline">
            Try again
          </Link>
        </p>
        <Link
          href="/login"
          className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthShell title="Loading…" />}>
      <VerifyContent />
    </Suspense>
  );
}
