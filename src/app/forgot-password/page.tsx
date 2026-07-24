'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase-config';
import AuthShell, {
  AuthError,
  AuthSuccess,
  authInputClass,
  authLabelClass,
  authPrimaryBtn,
} from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Enter the email associated with your account.');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Password reset requires Supabase to be configured. Contact support if you need help recovering access.');
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      });
      if (resetError) throw resetError;
      setSuccess('If an account exists for that email, we sent a reset link. Check your inbox and spam folder.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a secure link to choose a new password."
    >
      {error && <AuthError message={error} />}
      {success && <AuthSuccess message={success} />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className={authLabelClass} htmlFor="email">Work email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              id="email"
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

        <button type="submit" disabled={loading} className={authPrimaryBtn}>
          {loading ? 'Sending…' : 'Send reset link'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to sign in
      </Link>
    </AuthShell>
  );
}
