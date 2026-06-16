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
  const [googlePlacesKey, setGooglePlacesKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnon, setSupabaseAnon] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('deepseek/deepseek-chat');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load local developer override keys if configured
    setOpenaiKey(localStorage.getItem('localradar_dev_openai_key') || '');
    setGooglePlacesKey(localStorage.getItem('localradar_dev_google_places_key') || '');
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
    localStorage.setItem('localradar_dev_google_places_key', googlePlacesKey);
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
    <div className="space-y-8 max-w-6xl mx-auto pb-16 font-sans text-white">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-6">
        <h1 className="text-2xl font-serif font-bold text-white">Settings & Billing</h1>
        <p className="text-[#9CA3AF] text-xs mt-1">
          Manage your account profile, upgrade subscription plans, or configure live API credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile form */}
          <div className="bg-[#141517] border border-[#26282D] p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
              <User className="w-4 h-4 text-[#10B981]" />
              Agency Profile Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest font-mono">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-2.5 px-4 text-white text-xs focus:outline-none focus:border-[#10B981] transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest font-mono">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-[#0B0B0C]/50 border border-[#26282D]/40 text-zinc-500 rounded-xl py-2.5 px-4 text-xs cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest font-mono">Agency Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-2.5 px-4 text-white text-xs focus:outline-none focus:border-[#10B981] transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="bg-[#0B0B0C] hover:bg-[#141517] border border-[#26282D] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ml-auto shadow-sm font-mono"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </form>
          </div>

          {/* Pricing Billing Section */}
          <div className="bg-[#141517] border border-[#26282D] p-6 rounded-2xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                <CreditCard className="w-4 h-4 text-[#10B981]" />
                Subscription Plans
              </h3>
              <span className="text-[9px] text-zinc-400 font-bold bg-[#0B0B0C] border border-[#26282D] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
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
                        ? 'bg-[#10B981]/5 border-[#10B981] shadow-lg' 
                        : 'bg-[#0B0B0C] border-[#26282D]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{tier.name}</h4>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-xl font-serif font-extrabold text-white">{tier.price}</span>
                        <span className="text-[10px] text-[#A1A1AA] font-semibold ml-1">/{tier.period}</span>
                      </div>

                      <ul className="mt-4 space-y-2 text-[10px] text-[#A1A1AA] font-mono">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
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
                          ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] cursor-default' 
                          : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-md'
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
        <div className="bg-[#141517] border border-[#26282D] p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
              <Key className="w-4 h-4 text-[#10B981]" />
              Developer Keys
            </h3>
            <span className="p-1.5 rounded-lg bg-[#0B0B0C] border border-[#26282D]" title="Encrypted Local Storage">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            </span>
          </div>

          <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
            By default, LocalRadar runs in a Sandbox Simulator. Paste your own keys below to fetch live maps search, call real OpenAI models, and connect to your own Supabase databases.
          </p>

          <form onSubmit={handleSaveKeys} className="space-y-4 border-t border-[#26282D] pt-4">
            <div className="space-y-1.5 border-b border-[#26282D] pb-4">
              <label className="text-[9px] font-bold text-[#10B981] uppercase tracking-wider block mb-1 font-mono">OpenRouter (DeepSeek v4 Flash)</label>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">API Key</label>
                <input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#10B981] transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5 mt-2.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. deepseek/deepseek-chat"
                  value={openrouterModel}
                  onChange={(e) => setOpenrouterModel(e.target.value)}
                  className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#10B981] transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Google Places API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={googlePlacesKey}
                onChange={(e) => setGooglePlacesKey(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#10B981] transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">OpenAI API Key (Direct)</label>
              <input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#10B981] transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Supabase URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#10B981] transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbG..."
                value={supabaseAnon}
                onChange={(e) => setSupabaseAnon(e.target.value)}
                className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-[#10B981] transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md font-mono"
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
            className="fixed bottom-6 right-6 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-xs px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg z-50 font-mono"
          >
            <Check className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
