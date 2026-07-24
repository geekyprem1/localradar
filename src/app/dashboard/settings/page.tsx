'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  CreditCard, 
  Key, 
  Check, 
  Zap,
  Save,
  Lock,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import UnlockModal from '@/components/UnlockModal';
import { trackEvent } from '@/lib/analytics';
import { useTheme, type Theme } from '@/lib/theme';

export default function SettingsPage() {
  const { user, updateSubscriptionTier } = useAuth();
  const { theme, setTheme } = useTheme();

  // Track billing checkout completion on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success') {
        trackEvent('upgrade_checkout_completed', { tier: user?.subscription_tier || 'free' });
      }
    }
  }, [user]);
  
  // Profile state
  const [name, setName] = useState(user?.full_name || 'Agency Owner');
  const [email, setEmail] = useState(user?.email || 'agency@owner.com');
  const [orgName, setOrgName] = useState('My Local Agency');
  
  // API Keys state
  const [googlePlacesKey, setGooglePlacesKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnon, setSupabaseAnon] = useState('');
  const [byokEnabled, setByokEnabled] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Settings saved successfully!');
  
  // Unlock Modal control
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const [unlockType, setUnlockType] = useState<'audit' | 'pitch' | 'export' | 'developer_keys'>('developer_keys');

  // Load profile and credentials
  useEffect(() => {
    const fetchProfileSettings = async () => {
      if (!user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const mockUserStr = localStorage.getItem('localradar_mock_user');
        if (mockUserStr) {
          const mu = JSON.parse(mockUserStr);
          headers['x-is-sandbox'] = 'true';
          headers['x-user-id'] = mu.id;
          headers['x-org-id'] = 'mock-org-123';
          headers['x-user-tier'] = mu.subscription_tier;
        }

        const res = await fetch('/api/settings/profile', { headers });
        const data = await res.json();
        
        if (data.success) {
          setName(data.full_name || '');
          setEmail(user.email || 'agency@owner.com');
          setOrgName(data.organization_name || 'My Local Agency');
        }
      } catch (err) {
        console.warn('Failed to load profile settings:', err);
      }
    };

    fetchProfileSettings();
  }, [user]);

  useEffect(() => {
    const fetchBYOKSettings = async () => {
      if (user?.subscription_tier !== 'agency_plus') return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const mockUserStr = localStorage.getItem('localradar_mock_user');
        if (mockUserStr) {
          const mu = JSON.parse(mockUserStr);
          headers['x-is-sandbox'] = 'true';
          headers['x-user-id'] = mu.id;
          headers['x-org-id'] = 'mock-org-123';
          headers['x-user-tier'] = mu.subscription_tier;
        }

        const res = await fetch('/api/settings/byok', { headers });
        const data = await res.json();
        
        if (data.success) {
          setByokEnabled(data.byok_enabled);
          setGooglePlacesKey(data.has_google_places_key ? '••••••••' : '');
          setOpenrouterKey(data.has_openrouter_key ? '••••••••' : '');
          setSupabaseUrl(data.has_supabase_url ? '••••••••' : '');
          setSupabaseAnon(data.has_supabase_anon ? '••••••••' : '');
        }
      } catch (err) {
        console.warn('Failed to load BYOK credentials:', err);
      }
    };

    fetchBYOKSettings();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const mockUserStr = localStorage.getItem('localradar_mock_user');
      if (mockUserStr) {
        const mu = JSON.parse(mockUserStr);
        headers['x-is-sandbox'] = 'true';
        headers['x-user-id'] = mu.id;
        headers['x-org-id'] = 'mock-org-123';
        headers['x-user-tier'] = mu.subscription_tier;
      }

      const payload = {
        full_name: name,
        organization_name: orgName,
      };

      const res = await fetch('/api/settings/profile', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (mockUserStr) {
          const mu = JSON.parse(mockUserStr);
          mu.full_name = name;
          localStorage.setItem('localradar_mock_user', JSON.stringify(mu));
        }
        
        setSaveMessage('Profile settings updated successfully!');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        alert(data.message || 'Failed to update profile settings.');
      }
    } catch (err) {
      console.error('Failed to save profile settings:', err);
      alert('An error occurred while saving your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const mockUserStr = localStorage.getItem('localradar_mock_user');
      if (mockUserStr) {
        const mu = JSON.parse(mockUserStr);
        headers['x-is-sandbox'] = 'true';
        headers['x-user-id'] = mu.id;
        headers['x-org-id'] = 'mock-org-123';
        headers['x-user-tier'] = mu.subscription_tier;
      }

      const payload = {
        byok_enabled: byokEnabled,
        google_places_key: googlePlacesKey,
        openrouter_key: openrouterKey,
        supabase_url: supabaseUrl,
        supabase_anon: supabaseAnon,
      };

      const res = await fetch('/api/settings/byok', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage('Developer credentials saved securely!');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        alert(data.message || 'Failed to save credentials.');
      }
    } catch (err) {
      console.error('Failed to save BYOK keys:', err);
      alert('An error occurred while saving your credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubscriptionUpgrade = async (tier: 'free' | 'pro' | 'agency' | 'agency_plus') => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const mockUserStr = localStorage.getItem('localradar_mock_user');
      if (mockUserStr) {
        const mu = JSON.parse(mockUserStr);
        headers['x-is-sandbox'] = 'true';
        headers['x-user-id'] = mu.id;
        headers['x-org-id'] = 'mock-org-123';
        headers['x-user-tier'] = mu.subscription_tier;
      }

      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          updateSubscriptionTier(tier);
          setSaveMessage(`Successfully upgraded to ${tier.toUpperCase()} plan!`);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        }
      } else {
        alert(data.message || 'Upgrade failed.');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      alert('Failed to process plan upgrade.');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerLockedModal = (type: 'audit' | 'pitch' | 'export' | 'developer_keys') => {
    setUnlockType(type);
    setIsUnlockOpen(true);
  };

  const pricingTiers = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '$0',
      period: 'forever',
      features: [
        '10 searches / month',
        'Live Google Places searches',
        '10 visible results per search',
        'Opportunity Score™',
        'Why This Lead™ insights',
      ],
      buttonText: 'Current Plan',
    },
    {
      id: 'pro',
      name: 'Pro Partner',
      price: '$29',
      period: 'month',
      features: [
        '500 searches / month',
        'Live Google Places searches',
        'Full results visibility',
        'Audit Drawer™ access',
        'AI Pitch Generator™ access',
        'PDF Export™ functionality',
      ],
      buttonText: 'Upgrade to Pro',
    },
    {
      id: 'agency',
      name: 'Agency Growth',
      price: '$79',
      period: 'month',
      features: [
        '2,000 searches / month',
        'Live Google Places searches',
        'Full results visibility',
        'Lead CRM Integration',
        'Add Team Members',
        'White Label PDF Exports',
      ],
      buttonText: 'Upgrade to Agency',
    },
    {
      id: 'agency_plus',
      name: 'Agency Plus',
      price: '$149',
      period: 'month',
      features: [
        '5,000 searches / month',
        'BYOK Required (Places Key)',
        'BYOK Required (OpenRouter Key)',
        'White Label branding',
        'Developer API Access',
      ],
      buttonText: 'Upgrade to Plus',
    }
  ];

  const currentTier = user?.subscription_tier || 'free';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans text-foreground">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-serif font-bold text-foreground">Settings & Billing</h1>
        <p className="text-secondary-text text-xs mt-1">
          Manage your account profile, upgrade subscription plans, or configure live API credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Profile & Subscription cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance */}
          <div className="bg-secondary-bg border border-border p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider font-mono">
              <Palette className="w-4 h-4 text-secondary-text" />
              Appearance
            </h3>
            <p className="text-[11px] text-secondary-text font-mono">
              Choose how LocalRadar looks on this device. Preference is saved locally.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'light' as Theme, label: 'Light', icon: Sun, desc: 'Bright surfaces' },
                { id: 'dark' as Theme, label: 'Dark', icon: Moon, desc: 'Terminal default' },
              ]).map((opt) => {
                const Icon = opt.icon;
                const active = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border bg-background hover:border-muted-text'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                      active ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-secondary-bg text-secondary-text'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${active ? 'text-foreground' : 'text-secondary-text'}`}>{opt.label}</p>
                      <p className="text-[10px] text-muted-text font-mono">{opt.desc}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-primary ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile form */}
          <div className="bg-secondary-bg border border-border p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider font-mono">
              <User className="w-4 h-4 text-secondary-text" />
              Agency Profile Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-secondary-text uppercase tracking-widest font-mono">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-foreground text-xs focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-secondary-text uppercase tracking-widest font-mono">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-background/50 border border-border/40 text-zinc-500 rounded-xl py-2.5 px-4 text-xs cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-secondary-text uppercase tracking-widest font-mono">Agency Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-4 text-foreground text-xs focus:outline-none focus:border-zinc-500 transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="bg-background hover:bg-secondary-bg border border-border text-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-auto shadow-sm font-mono"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </form>
          </div>

          {/* Pricing Billing Section */}
          <div className="bg-secondary-bg border border-border p-6 rounded-2xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider font-mono">
                <CreditCard className="w-4 h-4 text-secondary-text" />
                Subscription Plans
              </h3>
              <span className="text-[9px] text-zinc-400 font-bold bg-background border border-border px-2.5 py-1 rounded-full uppercase tracking-wider font-mono flex items-center gap-1.5">
                Active Tier: 
                <span className="text-primary uppercase">{currentTier}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => {
                const isActive = currentTier === tier.id;
                return (
                  <div 
                    key={tier.id} 
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isActive 
                        ? 'bg-card-hover border-foreground shadow-lg relative' 
                        : 'bg-background border-border'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}

                    <div>
                      <h4 className="text-xs font-bold text-foreground">{tier.name}</h4>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-xl font-serif font-extrabold text-foreground">{tier.price}</span>
                        <span className="text-[10px] text-secondary-text font-semibold ml-1">/{tier.period}</span>
                      </div>

                      <ul className="mt-4 space-y-2 text-[10px] text-secondary-text font-mono">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSubscriptionUpgrade(tier.id as any)}
                      disabled={isActive}
                      className={`w-full text-center text-xs font-bold py-2.5 rounded-xl mt-6 transition-all cursor-pointer font-mono ${
                        isActive 
                          ? 'bg-border border border-border text-foreground cursor-default' 
                          : 'bg-gradient-to-r from-primary to-[#14B88C] hover:opacity-95 text-on-primary font-extrabold shadow-md'
                      }`}
                    >
                      {isActive ? 'Active Plan' : tier.buttonText}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: API Keys block (Tier Gated) */}
        <div className="space-y-6">
          
          {/* FREE USER: Hide developer keys and show lock feature */}
          {currentTier === 'free' && (
            <div className="bg-secondary-bg border border-border p-6 rounded-2xl space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#F5A623]/25 to-transparent" />
              
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#F5A623] font-bold">
                <Lock className="w-4 h-4 text-[#F5A623]" />
                🔒 Agency Feature
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground">Developer Keys</h3>
                <p className="text-[10px] text-secondary-text leading-relaxed mt-2">
                  Bring Your Own Keys (BYOK) mode allows you to bypass monthly scan limits and connect to your own database schemas.
                </p>
              </div>

              <div className="space-y-3 bg-background border border-[#202226] p-4 rounded-xl text-xs font-mono text-muted-text">
                <div className="flex justify-between border-b border-[#202226] pb-2">
                  <span>Google Places API</span>
                  <span className="text-red-400/80">Locked</span>
                </div>
                <div className="flex justify-between border-b border-[#202226] pb-2">
                  <span>OpenRouter AI Key</span>
                  <span className="text-red-400/80">Locked</span>
                </div>
                <div className="flex justify-between">
                  <span>Supabase Pipeline</span>
                  <span className="text-red-400/80">Locked</span>
                </div>
              </div>

              <button
                onClick={() => triggerLockedModal('developer_keys')}
                className="w-full bg-[#1C1E22] hover:bg-[#26282F] border border-[#2B2D33] text-foreground font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono"
              >
                Upgrade to Agency Plus
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* PRO & AGENCY USER: Hide developer keys and show infrastructure note */}
          {(currentTier === 'pro' || currentTier === 'agency') && (
            <div className="bg-secondary-bg border border-border p-6 rounded-2xl space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-primary font-bold">
                <ShieldCheck className="w-4 h-4 text-primary" />
                SaaS Infrastructure
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground">Developer Keys</h3>
                <p className="text-[10px] text-secondary-text leading-relaxed mt-2">
                  Your requests are fully powered by LocalRadar's internal servers and APIs. You do not need to provide any API credentials.
                </p>
              </div>

              <div className="space-y-3 bg-background border border-[#202226] p-4 rounded-xl text-xs font-mono text-secondary-text">
                <div className="flex justify-between items-center border-b border-[#202226] pb-2.5">
                  <span className="text-foreground">Google Places API</span>
                  <span className="text-[9px] bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full font-bold uppercase">Included</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#202226] pb-2.5">
                  <span className="text-foreground">AI Search Credits</span>
                  <span className="text-[9px] bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full font-bold uppercase">Included</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground">Vulnerability Audit</span>
                  <span className="text-[9px] bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full font-bold uppercase">Included</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#202226] space-y-3">
                <p className="text-[9px] text-muted-text leading-relaxed">
                  Need to bring your own keys or hook up a custom database? Advanced Integrations are available on the Agency Plus Plan.
                </p>
                <button
                  onClick={() => triggerLockedModal('developer_keys')}
                  className="w-full bg-[#1C1E22] hover:bg-[#26282F] border border-[#2B2D33] text-foreground font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                >
                  Upgrade to Agency Plus
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* AGENCY PLUS USER: Show full advanced integrations & BYOK controls */}
          {currentTier === 'agency_plus' && (
            <div className="bg-secondary-bg border border-border p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider font-mono">
                  <Key className="w-4 h-4 text-secondary-text" />
                  Advanced Integrations
                </h3>
                <span className="p-1.5 rounded-lg bg-background border border-border" title="Server-side Encrypted Credentials">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                </span>
              </div>

              <p className="text-[10px] text-secondary-text leading-relaxed">
                Configure custom infrastructure credentials. Enabling BYOK bypasses LocalRadar server limits and routes requests using your keys.
              </p>

              {/* BYOK Toggle */}
              <div className="flex items-center justify-between bg-background border border-border p-3 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">BYOK Mode</span>
                  <span className="text-[9px] text-muted-text block font-mono">Bring Your Own Keys</span>
                </div>
                <button
                  type="button"
                  onClick={() => setByokEnabled(!byokEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer border ${
                    byokEnabled 
                      ? 'bg-primary border-primary' 
                      : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 bg-white w-4.5 h-4.5 rounded-full transition-transform shadow-md ${
                      byokEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <form onSubmit={handleSaveKeys} className="space-y-4 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Google Places API Key</label>
                  <input
                    type="password"
                    placeholder={googlePlacesKey === '••••••••' ? '••••••••' : 'AIzaSy...'}
                    value={googlePlacesKey === '••••••••' ? '' : googlePlacesKey}
                    onChange={(e) => setGooglePlacesKey(e.target.value)}
                    onFocus={(e) => {
                      if (googlePlacesKey === '••••••••') {
                        setGooglePlacesKey('');
                      }
                    }}
                    onBlur={(e) => {
                      if (googlePlacesKey === '') {
                        setGooglePlacesKey('••••••••');
                      }
                    }}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-foreground text-xs focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">OpenRouter API Key</label>
                  <input
                    type="password"
                    placeholder={openrouterKey === '••••••••' ? '••••••••' : 'sk-or-v1-...'}
                    value={openrouterKey === '••••••••' ? '' : openrouterKey}
                    onChange={(e) => setOpenrouterKey(e.target.value)}
                    onFocus={(e) => {
                      if (openrouterKey === '••••••••') {
                        setOpenrouterKey('');
                      }
                    }}
                    onBlur={(e) => {
                      if (openrouterKey === '') {
                        setOpenrouterKey('••••••••');
                      }
                    }}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-foreground text-xs focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Supabase URL</label>
                  <input
                    type="text"
                    placeholder={supabaseUrl === '••••••••' ? '••••••••' : 'https://your-project.supabase.co'}
                    value={supabaseUrl === '••••••••' ? '' : supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    onFocus={(e) => {
                      if (supabaseUrl === '••••••••') {
                        setSupabaseUrl('');
                      }
                    }}
                    onBlur={(e) => {
                      if (supabaseUrl === '') {
                        setSupabaseUrl('••••••••');
                      }
                    }}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-foreground text-xs focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Supabase Anon Key</label>
                  <input
                    type="password"
                    placeholder={supabaseAnon === '••••••••' ? '••••••••' : 'eyJhbG...'}
                    value={supabaseAnon === '••••••••' ? '' : supabaseAnon}
                    onChange={(e) => setSupabaseAnon(e.target.value)}
                    onFocus={(e) => {
                      if (supabaseAnon === '••••••••') {
                        setSupabaseAnon('');
                      }
                    }}
                    onBlur={(e) => {
                      if (supabaseAnon === '') {
                        setSupabaseAnon('••••••••');
                      }
                    }}
                    className="w-full bg-background border border-border rounded-xl py-2 px-3 text-foreground text-xs focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-primary to-[#14B88C] hover:opacity-95 text-on-primary font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Credentials
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Save Success Banner */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 right-6 bg-primary/10 border border-primary/20 text-primary text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg z-50 font-mono"
          >
            <Check className="w-4 h-4" />
            <span>{saveMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock Upsell Dialog */}
      <UnlockModal
        isOpen={isUnlockOpen}
        onClose={() => setIsUnlockOpen(false)}
        type={unlockType}
      />
    </div>
  );
}
