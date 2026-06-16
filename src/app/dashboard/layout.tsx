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
  Volume2,
  Bookmark
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
      <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-[#E54D80]/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#E54D80] border-t-transparent rounded-full animate-spin"></div>
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
    { name: 'Saved Leads', href: '/dashboard/saved-leads', icon: Bookmark },
    { name: 'Pitch Generator', href: '/dashboard/pitch', icon: Volume2 },
    { name: 'Settings & Billing', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#0F0F11] flex relative font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E5E5E8] bg-white p-6 shrink-0 relative z-20">
        <div className="flex items-center gap-2 mb-8">
          <svg className="w-5 h-5 text-[#E54D80]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
            <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" />
            <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" />
            <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
          </svg>
          <span className="font-serif italic font-extrabold tracking-wide text-lg text-[#0F0F11]">LocalRadar</span>
        </div>

        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-[#E54D80]/10 border border-[#E54D80]/20 text-[#E54D80] shadow-sm' 
                    : 'text-zinc-500 hover:text-[#0F0F11] hover:bg-[#F4F4F6] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#E54D80]' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile section & logout */}
        <div className="border-t border-[#E5E5E8] pt-6 mt-auto space-y-4">
          {user.subscription_tier !== 'free' && (
            <div className="bg-[#E54D80]/10 border border-[#E54D80]/20 p-3 rounded-xl flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#E54D80] fill-[#E54D80]" />
              <div className="text-[10px] font-mono">
                <p className="font-bold text-[#E54D80] uppercase tracking-wider">{user.subscription_tier} Account</p>
                <p className="text-zinc-500">Premium unlocked</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F4F4F6] border border-[#E5E5E8] flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-[#0F0F11] truncate max-w-[120px]">{user.full_name || 'Agency Owner'}</p>
                <p className="text-[10px] text-zinc-400 truncate max-w-[120px] font-mono">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()} 
              className="p-2 text-zinc-400 hover:text-[#E54D80] hover:bg-[#F4F4F6] rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:hidden max-w-full">
        <header className="h-16 border-b border-[#E5E5E8] bg-white px-6 flex items-center justify-between relative z-35">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#E54D80]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" />
              <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
            </svg>
            <span className="font-serif italic font-extrabold tracking-wide text-base">LocalRadar</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border border-[#E5E5E8] bg-[#F4F4F6] rounded-xl text-zinc-500 hover:text-[#0F0F11] cursor-pointer"
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
              className="border-b border-[#E5E5E8] bg-white relative z-30 px-6 py-4 space-y-3 overflow-hidden shadow-md"
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
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        isActive 
                          ? 'bg-[#E54D80]/10 border border-[#E54D80]/20 text-[#E54D80]' 
                          : 'text-zinc-500 hover:text-[#0F0F11] hover:bg-[#F4F4F6]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-[#E5E5E8] pt-4 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F4F4F6] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-[#0F0F11]">{user.full_name}</p>
                    <p className="text-[9px] text-zinc-400 font-mono">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => signOut()} 
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#E54D80] px-3 py-1.5 rounded-lg bg-[#F4F4F6] border border-[#E5E5E8]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content panel for Mobile */}
        <main className="flex-1 p-4 relative z-10 overflow-y-auto max-w-full">
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
