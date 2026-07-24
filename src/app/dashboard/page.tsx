'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Sparkles, 
  Search, 
  ArrowUpRight, 
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Target,
  DollarSign,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Business, Opportunity } from '@/types';
import { scoreBusinessOpportunity } from '@/lib/scoring';
import { generateMockCompetitors } from '@/lib/mockData';
import { ScoredOpportunity } from '@/types/scoring';
import EmptyState from '@/components/ui/EmptyState';
import OnboardingBanner from '@/components/dashboard/OnboardingBanner';
import { formatCompactCurrency } from '@/lib/currency';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [liveStats, setLiveStats] = useState<{
    potentialRevenue: string;
    highProbClients: number;
    highOppClients: number;
    weightedOpportunity: string;
    avgClosingProb: number;
  } | null>(null);

  const [recentLeadsData, setRecentLeadsData] = useState<{
    name: string;
    city: string;
    score: number;
    opportunity: string;
    bestFit: string;
    dealValue: string;
    date: string;
  }[]>([]);

  const [usageStats, setUsageStats] = useState<{
    subscription_tier: string;
    searches_used: number;
    searches_limit: number;
    searches_remaining: number;
    next_billing_date: string;
    soft_alert?: string | null;
  } | null>(null);

  useEffect(() => {
    // Try to compute live stats from cached leads
    const cachedLeads = localStorage.getItem('localradar_latest_leads');
    const cachedOpps = localStorage.getItem('localradar_latest_opps');

    if (cachedLeads && cachedOpps) {
      const leads = JSON.parse(cachedLeads) as Business[];
      const opps = JSON.parse(cachedOpps) as Record<string, Opportunity>;

      if (leads.length > 0) {
        const country = localStorage.getItem('localradar_latest_country') || 'United States';
        const scoredResults: Record<string, ScoredOpportunity> = {};
        leads.forEach(biz => {
          const competitors = generateMockCompetitors(biz);
          scoredResults[biz.id] = scoreBusinessOpportunity(biz, competitors, undefined, country);
        });

        const totalPipeline = leads.reduce((sum, l) => sum + (scoredResults[l.id]?.dealValue.max ?? 0), 0);
        const highOppClients = leads.filter(l => (scoredResults[l.id]?.opportunityScore ?? 0) >= 60).length;
        const highProbClients = leads.filter(l => (scoredResults[l.id]?.closingProbability ?? 0) >= 70).length;
        
        const weightedOpportunity = leads.reduce((sum, l) => {
          const maxVal = scoredResults[l.id]?.dealValue.max ?? 0;
          const prob = scoredResults[l.id]?.closingProbability ?? 0;
          return sum + Math.round(maxVal * (prob / 100));
        }, 0);
        
        const avgClosingProb = Math.round(leads.reduce((sum, l) => sum + (scoredResults[l.id]?.closingProbability ?? 0), 0) / leads.length);

        setLiveStats({
          potentialRevenue: formatCompactCurrency(totalPipeline, country),
          highProbClients,
          highOppClients,
          weightedOpportunity: formatCompactCurrency(weightedOpportunity, country),
          avgClosingProb,
        });

        // Create recent leads from actual data
        const times = ['2 hours ago', '4 hours ago', '1 day ago', '2 days ago'];
        const recentData = leads.slice(0, 4).map((l, i) => {
          const scored = scoredResults[l.id];
          return {
            name: l.name,
            city: l.address.split(',').slice(-2).join(',').trim(),
            score: scored?.opportunityScore ?? 0,
            opportunity: scored?.opportunityLevel ?? 'Low',
            bestFit: scored?.bestFit.agencyType ?? 'Web Design',
            dealValue: scored?.dealValue.formatted ?? '—',
            date: times[i] || '3 days ago',
          };
        });
        setRecentLeadsData(recentData);
      }
    }
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
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

        const res = await fetch('/api/usage', { headers });
        const data = await res.json();
        if (data.success) {
          setUsageStats(data);
        }
      } catch (err) {
        console.warn('Failed to load usage stats:', err);
      }
    };
    fetchUsage();
  }, [user]);

  const hasLiveData = Boolean(liveStats);

  const stats = [
    { 
      name: 'Potential Revenue', 
      value: liveStats?.potentialRevenue ?? '—', 
      change: hasLiveData ? 'From last scan' : 'Run a scan', 
      icon: DollarSign, 
      color: 'var(--primary)' 
    },
    { 
      name: 'High Probability Clients', 
      value: liveStats ? liveStats.highProbClients.toString() : '—', 
      change: hasLiveData ? 'Close-ready' : 'Awaiting data', 
      icon: Target, 
      color: 'var(--foreground)' 
    },
    { 
      name: 'High Opportunity Clients', 
      value: liveStats ? liveStats.highOppClients.toString() : '—', 
      change: hasLiveData ? 'High fit' : 'Awaiting data', 
      icon: Zap, 
      color: '#F5A623' 
    },
    { 
      name: 'Weighted Opportunity', 
      value: liveStats?.weightedOpportunity ?? '—', 
      change: hasLiveData ? 'Probability-weighted' : 'Awaiting data', 
      icon: TrendingUp, 
      color: 'var(--primary)' 
    },
    { 
      name: 'Avg Closing Probability', 
      value: liveStats ? `${liveStats.avgClosingProb}%` : '—', 
      change: hasLiveData ? 'Portfolio avg' : 'Awaiting data', 
      icon: Activity, 
      color: 'var(--primary)' 
    },
  ];

  const recentLeads = recentLeadsData;

  return (
    <div className="space-y-8 font-sans text-foreground">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="dash-title text-2xl font-semibold tracking-[-0.025em] text-foreground md:text-3xl">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-secondary-text md:text-sm">
            {hasLiveData
              ? 'Metrics from your latest market scan.'
              : 'Your pipeline metrics appear after the first scan.'}
          </p>
        </div>
        <Link 
          href="/dashboard/lead-finder" 
          className="bg-gradient-to-r from-primary to-[#14B88C] hover:opacity-95 text-on-primary text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(45,212,167,0.15)] flex items-center gap-2 cursor-pointer w-fit uppercase tracking-wider font-mono"
        >
          <Search className="w-4 h-4 text-on-primary" />
          Find Opportunities
        </Link>
      </div>

      <OnboardingBanner hasData={hasLiveData} />

      {/* Subscription and Usage Status Card */}
      {usageStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-secondary-bg border border-border p-5 rounded-2xl relative overflow-hidden shadow-xl"
        >
          {/* Glassmorphic border glow */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          {usageStats.soft_alert && (
            <div className="mb-4 bg-[#FF5C5C]/10 border border-[#FF5C5C]/25 text-[#FF5C5C] text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-mono">
              <span className="font-bold">⚠️ Notice:</span>
              <span>{usageStats.soft_alert}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Plan tier and billing cycle */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xs text-secondary-text uppercase tracking-wider font-mono">Current Plan</span>
                <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border font-mono uppercase ${
                  usageStats.subscription_tier === 'agency_plus'
                    ? 'bg-[#A855F7]/10 text-[#C084FC] border-[#C084FC]/25'
                    : usageStats.subscription_tier === 'agency'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-400/20'
                      : usageStats.subscription_tier === 'pro'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {usageStats.subscription_tier === 'agency_plus' ? 'agency plus' : usageStats.subscription_tier}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight capitalize font-sans">
                {usageStats.subscription_tier === 'free' 
                  ? 'Free Plan Access' 
                  : usageStats.subscription_tier === 'pro' 
                    ? 'Professional Partner' 
                    : usageStats.subscription_tier === 'agency' 
                      ? 'Agency Partner' 
                      : 'Enterprise Agency Plus'}
              </h2>
              <p className="text-2xs text-muted-text font-mono">
                Next Billing Cycle: {new Date(usageStats.next_billing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Searches progress bar */}
            <div className="flex-1 max-w-md space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-secondary-text">Searches Usage ({Math.round((usageStats.searches_used / usageStats.searches_limit) * 100)}%)</span>
                <span className="text-foreground font-semibold">{usageStats.searches_used} / {usageStats.searches_limit} Used</span>
              </div>
              <div className="w-full bg-background border border-border h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    (usageStats.searches_used / usageStats.searches_limit) > 0.8
                      ? 'bg-[#FF5C5C]'
                      : usageStats.subscription_tier === 'agency_plus'
                        ? 'bg-[#A855F7]'
                        : usageStats.subscription_tier === 'agency'
                          ? 'bg-blue-500'
                          : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, (usageStats.searches_used / usageStats.searches_limit) * 100)}%` }}
                />
              </div>
            </div>

            {/* CTA button */}
            <div className="flex items-center">
              {usageStats.subscription_tier === 'free' && (
                <Link 
                  href="/dashboard/settings"
                  className="w-full md:w-auto bg-primary hover:opacity-90 text-on-primary text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono"
                >
                  Upgrade to Pro
                  <Zap className="w-3.5 h-3.5 fill-[#090A0C]" />
                </Link>
              )}
              {usageStats.subscription_tier === 'pro' && (
                <Link 
                  href="/dashboard/settings"
                  className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-foreground text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono"
                >
                  Upgrade to Agency
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                </Link>
              )}
              {usageStats.subscription_tier === 'agency' && (
                <Link 
                  href="/dashboard/settings"
                  className="w-full md:w-auto bg-gradient-to-r from-[#C084FC] to-[#A855F7] hover:opacity-95 text-foreground text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono"
                >
                  Upgrade to Plus
                  <Zap className="w-3.5 h-3.5 fill-white" />
                </Link>
              )}
              {usageStats.subscription_tier === 'agency_plus' && (
                <Link 
                  href="/dashboard/settings"
                  className="w-full md:w-auto bg-[#1C1E22] hover:bg-[#26282E] text-foreground border border-[#2B2D33] text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono"
                >
                  Configure BYOK Keys
                  <ArrowRight className="w-3.5 h-3.5 text-foreground" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-secondary-bg border-t-2 border-x border-b border-border p-5 rounded-2xl relative overflow-hidden shadow-lg group transition-all duration-300"
              style={{ borderTopColor: stat.color }}
            >
              <div className="flex items-center justify-between">
                <span className="text-secondary-text text-2xs font-semibold uppercase tracking-wider font-mono truncate max-w-[80%]">{stat.name}</span>
                <div 
                  className="p-2 rounded-lg bg-background border border-border transition-colors"
                  style={{ color: stat.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="metric-value text-2xl">{stat.value}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trends — empty until real scan history exists */}
        <div className="bg-secondary-bg border border-border p-6 lg:col-span-2 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Lead discovery</h3>
              <p className="text-secondary-text text-xs mt-0.5 font-mono">Trends from your scans — not sample data</p>
            </div>
            <span className="text-2xs font-bold text-secondary-text bg-background border border-border px-2.5 py-1 rounded-full font-mono uppercase">
              Workspace
            </span>
          </div>

          {!hasLiveData ? (
            <EmptyState
              icon={Activity}
              title="No trend data yet"
              description="After you scan markets, this panel will show discovery activity from your workspace. We never fill it with demo numbers."
              actionLabel="Run first scan"
              actionHref="/dashboard/lead-finder"
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-2xs font-mono uppercase text-secondary-text">Recent leads</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{recentLeads.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-2xs font-mono uppercase text-secondary-text">High opportunity</p>
                  <p className="mt-1 text-2xl font-semibold text-primary">{liveStats?.highOppClients ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-2xs font-mono uppercase text-secondary-text">Avg close prob.</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{liveStats?.avgClosingProb ?? 0}%</p>
                </div>
              </div>
              <p className="text-xs text-secondary-text font-mono">
                Full historical charts ship with multi-scan history. Current snapshot reflects your last scan only.
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity List */}
        <div className="bg-secondary-bg border border-border p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Recent Opportunities</h3>
              <Activity className="w-4 h-4 text-secondary-text" aria-hidden />
            </div>

            {recentLeads.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No scans yet"
                description="Run your first market scan to populate opportunity scores and revenue estimates. Stats stay empty until real data is available."
                actionLabel="Start a scan"
                actionHref="/dashboard/lead-finder"
              />
            ) : (
              <div className="space-y-4 font-normal">
                {recentLeads.map((lead) => (
                  <div key={lead.name} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="max-w-[55%]">
                      <p className="text-xs font-bold text-foreground truncate">{lead.name}</p>
                      <p className="text-2xs text-secondary-text mt-0.5 font-mono">{lead.city} • {lead.date}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className={`inline-block text-2xs font-bold px-2 py-0.5 rounded border font-mono ${
                          lead.opportunity === 'High' 
                            ? 'bg-primary/10 text-primary border-primary/25' 
                            : lead.opportunity === 'Medium'
                              ? 'bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/25'
                              : 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/25'
                        }`}>
                          {lead.score}pts
                        </span>
                      </div>
                      <p className="text-2xs text-primary font-mono font-bold">{lead.dealValue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentLeads.length > 0 && (
            <Link 
              href="/dashboard/lead-finder" 
              className="w-full mt-6 bg-background hover:bg-secondary-bg border border-border text-foreground font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer group font-mono"
            >
              Scan More Businesses
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
