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
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-[#26282D] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FAFAF9] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Opportunity Finder', href: '/dashboard/lead-finder', icon: Search },
    { name: 'Saved Opportunities', href: '/dashboard/saved-leads', icon: Bookmark },
    { name: 'Pitch Engine', href: '/dashboard/pitch', icon: Volume2 },
    { name: 'Settings & Billing', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#FFFFFF] flex relative font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#26282D] bg-[#141517] p-6 shrink-0 relative z-20">
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#26282D] border border-[#26282D] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-[#FAFAF9] fill-[#FAFAF9]/10" />
            </div>
            <span className="font-serif italic font-semibold tracking-wide text-lg text-[#FFFFFF]">LocalRadar</span>
          </div>
          <div className="mt-2 text-[9px] uppercase tracking-wider text-[#A1A1AA] font-mono leading-tight">
            Revenue Intelligence Platform
          </div>
          <div className="text-[7px] text-[#71717A] font-mono">
            Powered by LocalRadar Intelligence Engine™
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer border ${
                  isActive 
                    ? 'bg-[#0B0B0C] border-[#26282D] text-[#FFFFFF]' 
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#0B0B0C]/50 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFFFFF]' : 'text-[#A1A1AA]'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile section & logout */}
        <div className="border-t border-[#26282D] pt-6 mt-auto space-y-4">
          {user.subscription_tier !== 'free' && (
            <div className="bg-[#0B0B0C] border border-[#26282D] p-3 rounded-xl flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FAFAF9] fill-[#FAFAF9]/15" />
              <div className="text-[10px] font-mono">
                <p className="font-bold text-white uppercase tracking-wider">{user.subscription_tier} Account</p>
                <p className="text-[#A1A1AA]">Intelligence Active</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0B0B0C] border border-[#26282D] flex items-center justify-center">
                <User className="w-4 h-4 text-[#A1A1AA]" />
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-[#FFFFFF] truncate max-w-[120px]">{user.full_name || 'Agency Partner'}</p>
                <p className="text-[10px] text-[#A1A1AA] truncate max-w-[120px] font-mono">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut()} 
              className="p-2 text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#0B0B0C] rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:hidden max-w-full">
        <header className="h-16 border-b border-[#26282D] bg-[#141517] px-6 flex items-center justify-between relative z-35">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#26282D] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#FAFAF9] fill-[#FAFAF9]/10" />
              </div>
              <span className="font-serif italic font-semibold tracking-wide text-base text-[#FFFFFF]">LocalRadar</span>
            </div>
            <div className="text-[7px] text-[#71717A] font-mono leading-none mt-0.5">
              Powered by LocalRadar Intelligence Engine™
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border border-[#26282D] bg-[#0B0B0C] rounded-xl text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer"
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
              className="border-b border-[#26282D] bg-[#141517] relative z-30 px-6 py-4 space-y-3 overflow-hidden shadow-md"
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
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                        isActive 
                          ? 'bg-[#0B0B0C] border-[#26282D] text-[#FFFFFF]' 
                          : 'text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#0B0B0C]/50 border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-[#26282D] pt-4 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0B0B0C] flex items-center justify-center border border-[#26282D]">
                    <User className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-[#FFFFFF]">{user.full_name}</p>
                    <p className="text-[9px] text-[#A1A1AA] font-mono">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => signOut()} 
                  className="flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#FFFFFF] px-3 py-1.5 rounded-lg bg-[#0B0B0C] border border-[#26282D]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content panel for Mobile */}
        <main className="flex-1 p-4 relative z-10 overflow-y-auto max-w-full bg-[#0B0B0C]">
          {children}
        </main>
      </div>

      {/* Content panel for Desktop */}
      <main className="hidden md:block flex-1 p-8 relative z-10 overflow-y-auto max-w-full bg-[#0B0B0C]">
        {children}
      </main>
    </div>
  );
}
