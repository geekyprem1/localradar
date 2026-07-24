'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useRouter } from 'next/navigation';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  full_name?: string;
  subscription_tier: 'free' | 'pro' | 'agency' | 'agency_plus';
  is_mock?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithSandbox: () => void;
  signOut: () => Promise<void>;
  updateSubscriptionTier: (tier: 'free' | 'pro' | 'agency' | 'agency_plus') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function buildUserFromSession(sessionUser: SupabaseUser): Promise<User> {
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, organization_id')
    .eq('id', sessionUser.id)
    .single();

  let subscription_tier: User['subscription_tier'] = 'free';
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', profile.organization_id)
      .single();
    if (org?.subscription_tier) {
      subscription_tier = org.subscription_tier as User['subscription_tier'];
    }
  }

  return {
    id: sessionUser.id,
    email: sessionUser.email || '',
    full_name:
      profile?.full_name ||
      sessionUser.user_metadata?.full_name ||
      'Agency Owner',
    subscription_tier,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const applySession = useCallback(async (session: Session | null) => {
    if (session?.user) {
      // Real session wins over sandbox mock
      localStorage.removeItem('localradar_mock_user');
      try {
        const nextUser = await buildUserFromSession(session.user);
        setUser(nextUser);
      } catch (err) {
        console.warn('Profile load failed, using session basics.', err);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Agency Owner',
          subscription_tier: 'free',
        });
      }
      return;
    }

    const mockUser = localStorage.getItem('localradar_mock_user');
    if (mockUser) {
      try {
        setUser(JSON.parse(mockUser));
      } catch {
        localStorage.removeItem('localradar_mock_user');
        setUser(null);
      }
      return;
    }

    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled) await applySession(session);
      } catch (err) {
        console.warn('Supabase auth not fully configured, running in client-only fallback.', err);
        if (!cancelled) {
          const mockUser = localStorage.getItem('localradar_mock_user');
          if (mockUser) {
            try {
              setUser(JSON.parse(mockUser));
            } catch {
              setUser(null);
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer Supabase calls — awaiting inside this callback can deadlock the client lock
      setTimeout(async () => {
        if (cancelled) return;
        await applySession(session);
        if (!cancelled) setLoading(false);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signInWithSandbox = () => {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_ALLOW_SANDBOX !== 'true'
    ) {
      console.warn('Sandbox sign-in is disabled in production.');
      return;
    }
    const sandboxUser: User = {
      id: 'mock-user-123',
      email: 'sandbox@localradar.io',
      full_name: 'Alex Rivera (Sandbox)',
      subscription_tier: 'free',
      is_mock: true,
    };
    localStorage.setItem('localradar_mock_user', JSON.stringify(sandboxUser));
    setUser(sandboxUser);
    router.push('/dashboard');
  };

  const signOut = async () => {
    localStorage.removeItem('localradar_mock_user');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out of Supabase:', err);
    }
    setUser(null);
    router.push('/');
  };

  const updateSubscriptionTier = (tier: 'free' | 'pro' | 'agency' | 'agency_plus') => {
    if (user) {
      const updatedUser = { ...user, subscription_tier: tier };
      if (user.is_mock) {
        localStorage.setItem('localradar_mock_user', JSON.stringify(updatedUser));
      }
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithSandbox, signOut, updateSubscriptionTier }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
