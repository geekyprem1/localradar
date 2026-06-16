'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { ShieldAlert, Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { signInWithSandbox } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    // Since we are running local and Supabase might not be initialized,
    // let's show an error if they try to sign in with non-sandbox but fall back gracefully
    setError('Real email auth requires setting up your Supabase project keys in .env.local. Please use "Sign In via Sandbox Mode" below to test instantly!');
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#FF2D2D]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#FF4D4D]/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Brand logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-wider bg-gradient-to-r from-white via-zinc-200 to-[#FF4D4D] bg-clip-text text-transparent">
            <Sparkles className="w-6 h-6 text-[#FF2D2D]" />
            LOCALRADAR
          </Link>
          <p className="text-zinc-400 text-sm mt-2">Find local businesses losing customers online.</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 shadow-[0_0_50px_rgba(255,45,45,0.03)] border border-white/[0.08] relative z-10">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            {isSignUp ? 'Create your agency account' : 'Sign in to your dashboard'}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2 items-start">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-300 text-xs font-semibold mb-2" htmlFor="email">
                Agency Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FF2D2D] focus:ring-1 focus:ring-[#FF2D2D] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 text-xs font-semibold mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FF2D2D] focus:ring-1 focus:ring-[#FF2D2D] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF2D2D] hover:bg-[#e62222] text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(255,45,45,0.25)] hover:shadow-[0_0_20px_rgba(255,45,45,0.45)] flex items-center justify-center gap-2 group cursor-pointer"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]"></div>
            </div>
            <span className="relative bg-[#050505] px-3 text-xs text-zinc-500">OR TEST INSTANTLY</span>
          </div>

          {/* Sandbox login button */}
          <button
            onClick={signInWithSandbox}
            className="w-full bg-gradient-to-r from-[#FF2D2D]/10 to-[#FF4D4D]/10 hover:from-[#FF2D2D]/20 hover:to-[#FF4D4D]/20 border border-[#FF2D2D]/35 text-white font-medium text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-[0_0_15px_rgba(255,45,45,0.1)]"
          >
            <Sparkles className="w-4 h-4 text-[#FF4D4D] animate-pulse" />
            Sign In via Sandbox Mode
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Google Auth mock */}
          <button
            onClick={signInWithSandbox}
            className="w-full mt-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-medium text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            Continue with Google
          </button>

          <div className="mt-6 text-center text-xs text-zinc-500">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button onClick={() => setIsSignUp(false)} className="text-[#FF2D2D] hover:underline cursor-pointer">
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to LocalRadar?{' '}
                <button onClick={() => setIsSignUp(true)} className="text-[#FF2D2D] hover:underline cursor-pointer">
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
