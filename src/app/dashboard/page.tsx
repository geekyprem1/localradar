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
import { Business, Opportunity } from '@/types';
import { scoreBusinessOpportunity } from '@/lib/scoring';
import { generateMockCompetitors } from '@/lib/mockData';
import { ScoredOpportunity } from '@/types/scoring';

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

  useEffect(() => {
    // Try to compute live stats from cached leads
    const cachedLeads = localStorage.getItem('localradar_latest_leads');
    const cachedOpps = localStorage.getItem('localradar_latest_opps');

    if (cachedLeads && cachedOpps) {
      const leads = JSON.parse(cachedLeads) as Business[];
      const opps = JSON.parse(cachedOpps) as Record<string, Opportunity>;

      if (leads.length > 0) {
        const scoredResults: Record<string, ScoredOpportunity> = {};
        leads.forEach(biz => {
          const competitors = generateMockCompetitors(biz);
          scoredResults[biz.id] = scoreBusinessOpportunity(biz, competitors);
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
          potentialRevenue: formatLakhs(totalPipeline),
          highProbClients,
          highOppClients,
          weightedOpportunity: formatLakhs(weightedOpportunity),
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

  const formatLakhs = (num: number): string => {
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const stats = [
    { 
      name: 'Potential Revenue', 
      value: liveStats?.potentialRevenue || '₹22.4L', 
      change: '+15%', 
      icon: DollarSign, 
      color: '#2DD4A7' 
    },
    { 
      name: 'High Probability Clients', 
      value: liveStats?.highProbClients.toString() || '17', 
      change: '+24%', 
      icon: Target, 
      color: '#FAFAF9' 
    },
    { 
      name: 'High Opportunity Clients', 
      value: liveStats?.highOppClients.toString() || '8', 
      change: '+12%', 
      icon: Zap, 
      color: '#F5A623' 
    },
    { 
      name: 'Weighted Opportunity', 
      value: liveStats?.weightedOpportunity || '₹19.3L', 
      change: '+8%', 
      icon: TrendingUp, 
      color: '#2DD4A7' 
    },
    { 
      name: 'Avg Closing Probability', 
      value: liveStats ? `${liveStats.avgClosingProb}%` : '81%', 
      change: '+5%', 
      icon: Activity, 
      color: '#2DD4A7' 
    },
  ];

  const recentLeads = recentLeadsData.length > 0 ? recentLeadsData : [
    { name: 'Preston Hollow Family Dental', city: 'Dallas, TX', score: 72, opportunity: 'High', bestFit: 'Web Design', dealValue: '₹75,000 – ₹2,55,000', date: '2 hours ago' },
    { name: 'Capital Plumbing & Drain', city: 'Austin, TX', score: 58, opportunity: 'Medium', bestFit: 'SEO', dealValue: '₹20,000 – ₹90,000', date: '4 hours ago' },
    { name: 'Lone Star Spine Clinic', city: 'Houston, TX', score: 45, opportunity: 'Medium', bestFit: 'AI Automation', dealValue: '₹30,000 – ₹70,000', date: '1 day ago' },
    { name: 'Downtown Eats Diner', city: 'Fort Worth, TX', score: 28, opportunity: 'Low', bestFit: 'Marketing Agency', dealValue: '₹5,000 – ₹15,000', date: '2 days ago' },
  ];

  return (
    <div className="space-y-8 font-sans text-white">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-white flex items-center gap-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Agency Partner'} 
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </h1>
          <p className="text-[#A1A1AA] text-xs mt-1 font-mono">LocalRadar Intelligence Engine™ dashboard overview.</p>
        </div>
        <Link 
          href="/dashboard/lead-finder" 
          className="bg-gradient-to-r from-[#2DD4A7] to-[#14B88C] hover:opacity-95 text-[#0B0B0C] text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(45,212,167,0.15)] flex items-center gap-2 cursor-pointer w-fit uppercase tracking-wider font-mono"
        >
          <Search className="w-4 h-4 text-[#0B0B0C]" />
          Find Opportunities
        </Link>
      </div>

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
              className="bg-[#141517] border-t-2 border-x border-b border-[#26282D] p-5 rounded-2xl relative overflow-hidden shadow-lg group transition-all duration-300"
              style={{ borderTopColor: stat.color }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1AA] text-[9px] font-semibold uppercase tracking-wider font-mono truncate max-w-[80%]">{stat.name}</span>
                <div 
                  className="p-2 rounded-lg bg-[#0B0B0C] border border-[#26282D] transition-colors"
                  style={{ color: stat.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-serif font-semibold text-white tracking-tight">{stat.value}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom SVG Performance Chart */}
        <div className="bg-[#141517] border border-[#26282D] p-6 lg:col-span-2 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Lead Discovery Trends</h3>
              <p className="text-[#A1A1AA] text-xs mt-0.5 font-mono">Discovered leads by week over the last month</p>
            </div>
            <span className="text-[10px] font-bold text-[#A1A1AA] bg-[#0B0B0C] border border-[#26282D] px-2.5 py-1 rounded-full font-mono uppercase">
              Last 30 Days
            </span>
          </div>

          {/* Simple Beautiful SVG Line and Bar Chart */}
          <div className="relative h-60 w-full flex items-end">
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Gradients */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2DD4A7" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#2DD4A7" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Graph Line Area */}
              <path
                d="M 10 180 Q 120 120 220 140 T 400 60 T 490 30 L 490 200 L 10 200 Z"
                fill="url(#chartGradient)"
              />

              {/* Graph Line */}
              <path
                d="M 10 180 Q 120 120 220 140 T 400 60 T 490 30"
                fill="none"
                stroke="#5C636E"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Data Dots */}
              <circle cx="10" cy="180" r="4" fill="#5C636E" stroke="#141517" strokeWidth="2" />
              <circle cx="150" cy="130" r="4" fill="#5C636E" stroke="#141517" strokeWidth="2" />
              <circle cx="280" cy="110" r="4" fill="#5C636E" stroke="#141517" strokeWidth="2" />
              <circle cx="400" cy="60" r="4" fill="#5C636E" stroke="#141517" strokeWidth="2" />
              <circle cx="490" cy="30" r="5" fill="#FFFFFF" stroke="#2DD4A7" strokeWidth="2.5" />
            </svg>
            
            {/* Chart X Labels */}
            <div className="w-full flex justify-between text-[10px] text-zinc-500 pt-2 absolute bottom-[-24px] font-mono">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
              <span>Today</span>
            </div>
          </div>

          <div className="pt-4 flex gap-6 text-[10px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5C636E]" />
              <span>Scanned Lead Velocity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A1A1AA]" />
              <span>Closing Conversion Rate</span>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-[#141517] border border-[#26282D] p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Recent Opportunities</h3>
              <Activity className="w-4 h-4 text-[#A1A1AA]" />
            </div>
            
            <div className="space-y-4 font-normal">
              {recentLeads.map((lead) => (
                <div key={lead.name} className="flex items-center justify-between border-b border-[#26282D] pb-3 last:border-0 last:pb-0">
                  <div className="max-w-[55%]">
                    <p className="text-xs font-bold text-white truncate">{lead.name}</p>
                    <p className="text-[10px] text-[#A1A1AA] mt-0.5 font-mono">{lead.city} • {lead.date}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border font-mono ${
                        lead.opportunity === 'High' 
                          ? 'bg-[#2DD4A7]/10 text-[#2DD4A7] border-[#2DD4A7]/25' 
                          : lead.opportunity === 'Medium'
                            ? 'bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/25'
                            : 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/25'
                      }`}>
                        {lead.score}pts
                      </span>
                    </div>
                    <p className="text-[9px] text-[#2DD4A7] font-mono font-bold">{lead.dealValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link 
            href="/dashboard/lead-finder" 
            className="w-full mt-6 bg-[#0B0B0C] hover:bg-[#141517] border border-[#26282D] text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer group font-mono"
          >
            Scan More Businesses
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
