'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Mail, Lock, User, ArrowRight, Sparkles, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase-config';
import AuthShell, {
  AuthError,
  authInputClass,
  authLabelClass,
  authPrimaryBtn,
} from '@/components/auth/AuthShell';

export default function SignupPage() {
  const { signInWithSandbox, user } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName || !email || !password) {
      setError('Fill in name, email, and password to create your account.');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      setLoading(false);
      return;
    }

    if (!configured) {
      setError('Signup needs Supabase keys. Use Sandbox Mode to explore, or configure .env.local.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signError) throw signError;
      if (data.session) {
        router.push('/dashboard');
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your agency account"
      subtitle="Start free with 20 scans. No credit card required."
    >
      {error && <AuthError message={error} />}

      <ul className="mb-5 space-y-1.5 text-2xs text-[#A1A1AA]">
        {['AI opportunity scoring', 'Google Business analysis', 'Personalized outreach drafts'].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-[#2DD4A7]" aria-hidden />
            {t}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className={authLabelClass} htmlFor="fullName">Full name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Alex Rivera"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={authInputClass}
            />
          </div>
        </div>

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
          <label className={authLabelClass} htmlFor="password">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className={authPrimaryBtn}>
          {loading ? 'Creating account…' : 'Create free account'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </form>

      {!configured && (
        <button
          type="button"
          onClick={signInWithSandbox}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#2DD4A7]/30 bg-[#2DD4A7]/10 py-3 font-mono text-sm font-bold text-[#2DD4A7]"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Explore with Sandbox Mode
        </button>
      )}

      <p className="mt-6 text-center text-xs text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-[#2DD4A7] hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-3 text-center text-2xs leading-relaxed text-zinc-600">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="underline hover:text-zinc-400">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}
