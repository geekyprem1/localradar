'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Search, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Volume2,
  User,
  Zap,
  Bookmark,
  Lock,
  Sun,
  Moon
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import UnlockModal from '@/components/UnlockModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const [unlockType, setUnlockType] = useState<'audit' | 'pitch' | 'export' | 'developer_keys'>('pitch');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-border rounded-full"></div>
          <div className="absolute inset-0 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
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

  const navActive =
    'bg-background border-border text-foreground';
  const navInactive =
    'text-secondary-text hover:text-foreground hover:bg-background/50 border-transparent';

  return (
    <div className="min-h-screen bg-background text-foreground flex relative font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-secondary-bg p-6 shrink-0 relative z-20">
        <div className="mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-border border border-border flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-foreground fill-foreground/10" />
            </div>
            <span className="font-serif italic font-semibold tracking-wide text-lg text-foreground">LocalRadar</span>
          </div>
          <div className="mt-2 text-[9px] uppercase tracking-wider text-secondary-text font-mono leading-tight">
            Revenue Intelligence Platform
          </div>
          <div className="text-[7px] text-muted-text font-mono">
            Powered by LocalRadar Intelligence Engine™
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const isLockedPitch = user.subscription_tier === 'free' && item.name === 'Pitch Engine';

            if (isLockedPitch) {
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setUnlockType('pitch');
                    setIsUnlockOpen(true);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer border ${
                    isActive ? navActive : navInactive
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-foreground' : 'text-secondary-text'}`} />
                    {item.name}
                  </div>
                  <Lock className="w-3.5 h-3.5 text-[#F5A623]" />
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer border ${
                  isActive ? navActive : navInactive
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-foreground' : 'text-secondary-text'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile section & logout */}
        <div className="border-t border-border pt-6 mt-auto space-y-4">
          {user.subscription_tier !== 'free' && (
            <div className="bg-background border border-border p-3 rounded-xl flex items-center gap-2">
              <Zap className="w-4 h-4 text-foreground fill-foreground/15" />
              <div className="text-[10px] font-mono">
                <p className="font-bold text-foreground uppercase tracking-wider">{user.subscription_tier} Account</p>
                <p className="text-secondary-text">Intelligence Active</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-secondary-text" />
              </div>
              <div className="text-left leading-tight min-w-0">
                <p className="text-xs font-bold text-foreground truncate max-w-[100px]">{user.full_name || 'Agency Partner'}</p>
                <p className="text-[10px] text-secondary-text truncate max-w-[100px] font-mono">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={toggleTheme}
                className="p-2 text-secondary-text hover:text-foreground hover:bg-background rounded-xl transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => signOut()} 
                className="p-2 text-secondary-text hover:text-foreground hover:bg-background rounded-xl transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen md:hidden max-w-full">
        <header className="h-16 border-b border-border bg-secondary-bg px-6 flex items-center justify-between relative z-35">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-border flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-foreground fill-foreground/10" />
              </div>
              <span className="font-serif italic font-semibold tracking-wide text-base text-foreground">LocalRadar</span>
            </div>
            <div className="text-[7px] text-muted-text font-mono leading-none mt-0.5">
              Powered by LocalRadar Intelligence Engine™
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 border border-border bg-background rounded-xl text-secondary-text hover:text-foreground cursor-pointer"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-border bg-background rounded-xl text-secondary-text hover:text-foreground cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border bg-secondary-bg relative z-30 px-6 py-4 space-y-3 overflow-hidden shadow-md"
            >
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const isLockedPitch = user.subscription_tier === 'free' && item.name === 'Pitch Engine';

                  if (isLockedPitch) {
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setUnlockType('pitch');
                          setIsUnlockOpen(true);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                          isActive ? navActive : navInactive
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </div>
                        <Lock className="w-3.5 h-3.5 text-[#F5A623]" />
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                        isActive ? navActive : navInactive
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-border pt-4 mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-background flex items-center justify-center border border-border">
                    <User className="w-3.5 h-3.5 text-secondary-text" />
                  </div>
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-foreground">{user.full_name}</p>
                    <p className="text-[9px] text-secondary-text font-mono">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => signOut()} 
                  className="flex items-center gap-1.5 text-xs text-secondary-text hover:text-foreground px-3 py-1.5 rounded-lg bg-background border border-border"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content panel for Mobile */}
        <main className="flex-1 p-4 relative z-10 overflow-y-auto max-w-full bg-background">
          {children}
        </main>
      </div>

      {/* Content panel for Desktop */}
      <main className="hidden md:block flex-1 p-8 relative z-10 overflow-y-auto max-w-full bg-background">
        {children}
      </main>

      {/* Unlock Upsell Dialog */}
      <UnlockModal
        isOpen={isUnlockOpen}
        onClose={() => setIsUnlockOpen(false)}
        type={unlockType}
      />
    </div>
  );
}
