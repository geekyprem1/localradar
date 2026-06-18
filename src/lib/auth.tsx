'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useRouter } from 'next/navigation';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if there is a mock session in localStorage first
    const mockUser = localStorage.getItem('localradar_mock_user');
    if (mockUser) {
      setUser(JSON.parse(mockUser));
      setLoading(false);
      return;
    }

    // Otherwise check Supabase session
    const checkSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch additional profile details if tables exist
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, organization_id')
            .eq('id', session.user.id)
            .single();

          let subscription_tier: 'free' | 'pro' | 'agency' | 'agency_plus' = 'free';
          if (profile?.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('subscription_tier')
              .eq('id', profile.organization_id)
              .single();
            if (org?.subscription_tier) {
              subscription_tier = org.subscription_tier as any;
            }
          }

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Agency Owner',
            subscription_tier,
          });
        }
      } catch (err) {
        console.warn('Supabase auth not fully configured, running in client-only fallback.', err);
      } finally {
        setLoading(false);
      }
    };

    checkSupabaseSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Agency Owner',
          subscription_tier: 'free',
        });
      } else if (!localStorage.getItem('localradar_mock_user')) {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithSandbox = () => {
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
