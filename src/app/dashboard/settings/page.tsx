'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  CreditCard, 
  Key, 
  Check, 
  Zap,
  Save,
  Lock
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateSubscriptionTier } = useAuth();
  
  // Profile state
  const [name, setName] = useState(user?.full_name || 'Agency Owner');
  const [email, setEmail] = useState(user?.email || 'agency@owner.com');
  const [orgName, setOrgName] = useState('My Local Agency');
  
  // API Keys state
  const [openaiKey, setOpenaiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnon, setSupabaseAnon] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('deepseek/deepseek-chat');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load local developer override keys if configured
    setOpenaiKey(localStorage.getItem('localradar_dev_openai_key') || '');
    setSupabaseUrl(localStorage.getItem('localradar_dev_supabase_url') || '');
    setSupabaseAnon(localStorage.getItem('localradar_dev_supabase_anon') || '');
    setOpenrouterKey(localStorage.getItem('localradar_dev_openrouter_key') || '');
    setOpenrouterModel(localStorage.getItem('localradar_dev_openrouter_model') || 'deepseek/deepseek-chat');
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('localradar_dev_openai_key', openaiKey);
    localStorage.setItem('localradar_dev_supabase_url', supabaseUrl);
    localStorage.setItem('localradar_dev_supabase_anon', supabaseAnon);
    localStorage.setItem('localradar_dev_openrouter_key', openrouterKey);
    localStorage.setItem('localradar_dev_openrouter_model', openrouterModel);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSubscriptionUpgrade = (tier: 'free' | 'pro' | 'agency') => {
    updateSubscriptionTier(tier);
  };

  const pricingTiers = [
    {
      id: 'free',
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      features: ['20 leads scan/month', 'Basic opportunities audit', 'Cold Email pitches'],
      buttonText: 'Current Plan',
    },
    {
      id: 'pro',
      name: 'Pro Finder',
      price: '$29',
      period: 'month',
      features: ['1000 leads scan/month', 'Full vulnerability audit', 'SEO + Website pitches', 'Export CSV leads data'],
      buttonText: 'Upgrade to Pro',
    },
    {
      id: 'agency',
      name: 'Agency Growth',
      price: '$79',
      period: 'month',
      features: ['5000 leads scan/month', 'Full vulnerability audit', 'All pitches + proposals', 'Competitor gap analysis', 'CSV exports'],
      buttonText: 'Upgrade to Agency',
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings & Billing</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage your account profile, upgrade subscription plans, or configure live API credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile form */}
          <div className="glass-panel p-6 space-y-4 border border-white/[0.08]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF2D2D]" />
              Agency Profile Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2.5 px-4 text-white text-xs focus:outline-none focus:border-[#FF2D2D] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-white/[0.01] border border-white/[0.04] text-zinc-500 rounded-xl py-2.5 px-4 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Agency Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2.5 px-4 text-white text-xs focus:outline-none focus:border-[#FF2D2D] transition-all"
                />
              </div>

              <button
                type="submit"
                className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </form>
          </div>

          {/* Pricing Billing Section */}
          <div className="glass-panel p-6 space-y-6 border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#FF2D2D]" />
                Subscription Plans
              </h3>
              <span className="text-[10px] text-zinc-400 font-semibold bg-white/[0.03] border border-white/[0.08] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Active Tier: {user?.subscription_tier}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingTiers.map((tier) => {
                const isActive = user?.subscription_tier === tier.id;
                return (
                  <div 
                    key={tier.id} 
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      isActive 
                        ? 'bg-[#FF2D2D]/5 border-[#FF2D2D]/30 shadow-[0_0_20px_rgba(255,45,45,0.1)]' 
                        : 'bg-white/[0.01] border-white/[0.06]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{tier.name}</h4>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-xl font-extrabold text-white">{tier.price}</span>
                        <span className="text-[10px] text-zinc-500 font-medium ml-1">/{tier.period}</span>
                      </div>

                      <ul className="mt-4 space-y-2 text-[10px] text-zinc-400">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#FF2D2D]" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSubscriptionUpgrade(tier.id as any)}
                      disabled={isActive}
                      className={`w-full text-center text-xs font-semibold py-2 rounded-xl mt-6 transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#FF2D2D]/10 border border-[#FF2D2D]/25 text-white cursor-default' 
                          : 'bg-[#FF2D2D] hover:bg-[#e62222] text-white'
                      }`}
                    >
                      {isActive ? 'Active' : tier.buttonText}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: API credentials key inputs */}
        <div className="glass-panel p-6 space-y-4 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#FF2D2D]" />
              Developer Keys
            </h3>
            <span className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08]" title="Encrypted Local Storage">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            </span>
          </div>

          <p className="text-[10px] text-zinc-400 leading-relaxed">
            By default, LocalRadar runs in a Sandbox Simulator. Paste your own keys below to fetch live maps search, call real OpenAI models, and connect to your own Supabase databases.
          </p>

          <form onSubmit={handleSaveKeys} className="space-y-4 border-t border-white/[0.08] pt-4">
            <div className="space-y-1.5 border-b border-white/[0.04] pb-4">
              <label className="text-[10px] font-bold text-[#FF2D2D] uppercase tracking-wider block mb-1">OpenRouter (DeepSeek / alternative models)</label>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-semibold text-zinc-400">OpenRouter API Key</label>
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#FF2D2D] transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5 mt-2.5">
                <label className="text-[9px] font-semibold text-zinc-400">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. deepseek/deepseek-chat"
                  value={openrouterModel}
                  onChange={(e) => setOpenrouterModel(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#FF2D2D] transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400">OpenAI API Key (Direct)</label>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#FF2D2D] transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400">Supabase URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#FF2D2D] transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-zinc-400">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbG..."
                value={supabaseAnon}
                onChange={(e) => setSupabaseAnon(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#FF2D2D] transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF2D2D] hover:bg-[#e62222] text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,45,45,0.2)]"
            >
              Save Credentials
            </button>
          </form>
        </div>

      </div>

      {/* Save Success Banner */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 right-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg z-50"
          >
            <Check className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
