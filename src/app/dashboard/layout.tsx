'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  User,
  Zap,
  Volume2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-[#FF2D2D]/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF2D2D] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Lead Finder', href: '/dashboard/lead-finder', icon: Search },
    { name: 'Pitch Generator', href: '/dashboard/pitch', icon: Volume2 },
    { name: 'Settings & Billing', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex relative">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#FF2D2D]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[#FF4D4D]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.08] bg-white/[0.01] backdrop-blur-md p-6 shrink-0 relative z-20">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="w-6 h-6 text-[#FF2D2D]" />
          <span className="font-bold tracking-wider text-white">LOCALRADAR</span>
        </div>

        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-[#FF2D2D]/10 border border-[#FF2D2D]/25 text-white shadow-[0_0_15px_rgba(255,45,45,0.05)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF2D2D]' : 'text-zinc-400 group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile section & logout */}
        <div className="border-t border-white/[0.08] pt-6 mt-auto space-y-4">
          {user.subscription_tier !== 'free' && (
            <div className="bg-gradient-to-r from-[#FF2D2D]/10 to-[#FF4D4D]/10 border border-[#FF2D2D]/25 p-3 rounded-xl flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FF4D4D] fill-[#FF4D4D]" />
              <div className="text-xs">
                <p className="font-semibold text-white capitalize">{user.subscription_tier} Account</p>
                <p className="text-zinc-400">Premium unlocked</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-300" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-sm font-medium text-white truncate max-w-[120px]">{user.full_name || 'Agency Owner'}</p>
                <p className="text-[10px] text-zinc-500 truncate max-w-[120px]">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()} 
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden w-full flex flex-col min-h-screen">
        <header className="h-16 border-b border-white/[0.08] bg-white/[0.01] backdrop-blur-md px-6 flex items-center justify-between relative z-30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF2D2D]" />
            <span className="font-bold tracking-wider text-sm">LOCALRADAR</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border border-white/[0.08] bg-white/[0.02] rounded-xl text-zinc-300 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-white/[0.08] bg-[#050505]/95 backdrop-blur-lg relative z-20 px-6 py-4 space-y-3 md:hidden overflow-hidden"
            >
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-[#FF2D2D]/10 border border-[#FF2D2D]/25 text-white' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-white/[0.08] pt-4 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-xs font-medium text-white">{user.full_name}</p>
                    <p className="text-[9px] text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => signOut()} 
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.08]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content panel for Mobile */}
        <main className="flex-1 p-6 relative z-10 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>

      {/* Content panel for Desktop */}
      <main className="hidden md:block flex-1 p-8 relative z-10 overflow-y-auto max-w-full">
        {children}
      </main>
    </div>
  );
}
