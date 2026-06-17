'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { ShieldAlert, Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const { signInWithSandbox, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if Supabase keys are configured (not pointing to placeholders)
  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://mock-project-url.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'mock-anon-key-placeholder';

  // Auto redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Offline/Local Sandbox fallback warning
      setError('Real email auth requires setting up your Supabase project keys in Vercel or your local .env.local file. Please use "Sign In via Sandbox Mode" below to test instantly!');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up with email
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: 'Agency Partner',
            }
          }
        });
        if (error) throw error;
        alert('Verification email sent! Please check your inbox.');
      } else {
        // Sign In with password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSupabaseConfigured) {
      try {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      } catch (err: any) {
        setError(err.message || 'Google Sign-In failed.');
        setLoading(false);
      }
    } else {
      signInWithSandbox();
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0B0C] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#10B981]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#10B981]/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Brand logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <svg className="w-6 h-6 text-[#10B981]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
            </svg>
            <span className="font-serif italic font-extrabold tracking-wide text-2xl">LocalRadar</span>
          </Link>
          <p className="text-[#A1A1AA] text-xs mt-2 font-mono uppercase tracking-wider">Find local businesses losing customers online.</p>
        </div>

        {/* Card */}
        <div className="bg-[#141517] border border-[#26282D] p-8 rounded-[32px] shadow-2xl relative z-10">
          <h2 className="text-xl font-serif font-semibold text-[#FAFAF9] mb-6 text-center">
            {isSignUp ? 'Create your agency account' : 'Sign in to your dashboard'}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs flex gap-2 items-start font-mono">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#A1A1AA] text-[10px] font-bold tracking-wider uppercase mb-2 font-mono" htmlFor="email">
                Agency Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-3 pl-10 pr-4 text-[#FAFAF9] placeholder-zinc-600 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A1A1AA] text-[10px] font-bold tracking-wider uppercase mb-2 font-mono" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-3 pl-10 pr-4 text-[#FAFAF9] placeholder-zinc-600 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-md font-mono"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Conditional Sandbox Test Trigger Panel */}
          {!isSupabaseConfigured && (
            <>
              <div className="relative my-6 text-center font-mono">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#26282D]"></div>
                </div>
                <span className="relative bg-[#141517] px-3 text-[10px] text-zinc-500 uppercase tracking-widest">OR TEST INSTANTLY</span>
              </div>

              {/* Sandbox login button */}
              <button
                onClick={signInWithSandbox}
                className="w-full bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] font-bold text-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-sm font-mono"
              >
                <Sparkles className="w-4 h-4 text-[#10B981] animate-pulse" />
                Sign In via Sandbox Mode
                <ArrowRight className="w-4 h-4 text-[#10B981]/70 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}

          {/* Google Auth button (Dynamic redirect or sandbox) */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full mt-3 bg-[#0B0B0C] hover:bg-[#141517] border border-[#26282D] text-[#A1A1AA] hover:text-white font-bold text-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isSupabaseConfigured ? 'Continue with Google' : 'Continue via Sandbox Google'}
          </button>

          <div className="mt-6 text-center text-xs text-zinc-500 font-sans">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button onClick={() => setIsSignUp(false)} className="text-[#10B981] font-bold hover:underline cursor-pointer">
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to LocalRadar?{' '}
                <button onClick={() => setIsSignUp(true)} className="text-[#10B981] font-bold hover:underline cursor-pointer">
                  Create Account
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
