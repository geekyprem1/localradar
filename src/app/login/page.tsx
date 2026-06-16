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
    <main className="min-h-screen bg-gradient-to-br from-[#8B5CF6] via-[#EC4899] to-[#FB7185] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#E54D80]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#FF5E8C]/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Brand logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
            </svg>
            <span className="font-serif italic font-extrabold tracking-wide text-2xl">LocalRadar</span>
          </Link>
          <p className="text-white/80 text-xs mt-2 font-mono uppercase tracking-wider">Find local businesses losing customers online.</p>
        </div>

        {/* Card */}
        <div className="bg-white text-[#0F0F11] p-8 rounded-[32px] shadow-2xl border border-white/20 relative z-10">
          <h2 className="text-xl font-serif font-bold text-[#0F0F11] mb-6 text-center">
            {isSignUp ? 'Create your agency account' : 'Sign in to your dashboard'}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-red-200 text-red-600 text-xs flex gap-2 items-start font-mono">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-500 text-[10px] font-bold tracking-wider uppercase mb-2" htmlFor="email">
                Agency Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@agency.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F4F4F6] border border-[#E5E5E8] rounded-xl py-3 pl-10 pr-4 text-[#0F0F11] placeholder-zinc-400 text-sm focus:outline-none focus:border-[#E54D80] focus:ring-1 focus:ring-[#E54D80] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 text-[10px] font-bold tracking-wider uppercase mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F4F4F6] border border-[#E5E5E8] rounded-xl py-3 pl-10 pr-4 text-[#0F0F11] placeholder-zinc-400 text-sm focus:outline-none focus:border-[#E54D80] focus:ring-1 focus:ring-[#E54D80] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E54D80] hover:bg-[#FF5E8C] text-white font-bold text-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-sm"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="relative my-6 text-center font-mono">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5E8]"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] text-zinc-400 uppercase tracking-widest">OR TEST INSTANTLY</span>
          </div>

          {/* Sandbox login button */}
          <button
            onClick={signInWithSandbox}
            className="w-full bg-[#E54D80]/10 hover:bg-[#E54D80]/20 border border-[#E54D80]/30 text-[#E54D80] font-bold text-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#E54D80] animate-pulse" />
            Sign In via Sandbox Mode
            <ArrowRight className="w-4 h-4 text-[#E54D80]/70 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Google Auth mock */}
          <button
            onClick={signInWithSandbox}
            className="w-full mt-3 bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-[#0F0F11] font-bold text-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
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

          <div className="mt-6 text-center text-xs text-zinc-500 font-sans">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button onClick={() => setIsSignUp(false)} className="text-[#E54D80] font-bold hover:underline cursor-pointer">
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to LocalRadar?{' '}
                <button onClick={() => setIsSignUp(true)} className="text-[#E54D80] font-bold hover:underline cursor-pointer">
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
