'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase-config';
import AuthShell, {
  AuthError,
  authInputClass,
  authLabelClass,
  authPrimaryBtn,
} from '@/components/auth/AuthShell';

function LoginForm() {
  const { signInWithSandbox, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError(decodeURIComponent(err));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Enter your email and password to continue.');
      setLoading(false);
      return;
    }

    if (!configured) {
      setError('Email sign-in needs Supabase keys in .env.local. Use Sandbox Mode below to explore the product.');
      setLoading(false);
      return;
    }

    try {
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
      if (signError) throw signError;
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!configured) {
      signInWithSandbox();
      return;
    }
    try {
      setLoading(true);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Enter your work email first, then request a magic link.');
      return;
    }
    if (!configured) {
      setError('Magic link requires Supabase configuration.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (otpError) throw otpError;
      router.push(`/verify-email?email=${encodeURIComponent(email)}&mode=magic`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send magic link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to your dashboard"
      subtitle="Access scans, opportunity scores, saved leads, and outreach tools."
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className={authLabelClass} htmlFor="email">Work email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={`${authLabelClass} !mb-0`} htmlFor="password">Password</label>
            <Link href="/forgot-password" className="font-mono text-2xs font-bold text-[#2DD4A7] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className={authPrimaryBtn}>
          {loading ? 'Signing in…' : 'Sign in'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="relative my-5 text-center font-mono">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[#26282D]" />
        </div>
        <span className="relative bg-[#141517] px-3 text-2xs uppercase tracking-widest text-zinc-500">or</span>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#26282D] bg-[#0B0B0C] py-3 font-mono text-sm font-bold text-[#A1A1AA] transition-all hover:bg-[#1a1b1e] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {configured ? 'Continue with Google' : 'Continue via Sandbox'}
      </button>

      {configured && (
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={loading}
          className="mt-3 w-full cursor-pointer rounded-full border border-[#26282D] py-2.5 font-mono text-xs font-bold text-[#A1A1AA] transition-colors hover:text-white"
        >
          Email me a magic link
        </button>
      )}

      {!configured && (
        <button
          type="button"
          onClick={signInWithSandbox}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#2DD4A7]/30 bg-[#2DD4A7]/10 py-3 font-mono text-sm font-bold text-[#2DD4A7] transition-all hover:bg-[#2DD4A7]/20"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Explore with Sandbox Mode
        </button>
      )}

      <p className="mt-6 text-center text-xs text-zinc-500">
        New to LocalRadar?{' '}
        <Link href="/signup" className="font-bold text-[#2DD4A7] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell title="Loading…" />}>
      <LoginForm />
    </Suspense>
  );
}
