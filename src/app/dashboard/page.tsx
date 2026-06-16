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
    found: number;
    high: number;
    pipeline: string;
    avgScore: number;
    topFit: string;
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

        const high = leads.filter(l => (scoredResults[l.id]?.opportunityScore ?? 0) >= 60).length;
        const totalPipeline = leads.reduce((sum, l) => sum + (scoredResults[l.id]?.dealValue.max ?? 0), 0);
        const avgScore = Math.round(leads.reduce((sum, l) => sum + (scoredResults[l.id]?.opportunityScore ?? 0), 0) / leads.length);

        // Count best fit categories
        const fitCounts: Record<string, number> = {};
        leads.forEach(l => {
          const fit = scoredResults[l.id]?.bestFit.agencyType;
          if (fit) fitCounts[fit] = (fitCounts[fit] || 0) + 1;
        });
        const topFit = Object.entries(fitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Web Design';

        setLiveStats({
          found: leads.length,
          high,
          pipeline: `₹${totalPipeline.toLocaleString('en-IN')}`,
          avgScore,
          topFit,
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

  const stats = [
    { name: 'Total Leads Discovered', value: liveStats?.found.toString() || '148', change: '+24%', icon: Search, color: '#A1A1AA' },
    { name: 'High Opportunity Engine™ Leads', value: liveStats?.high.toString() || '42', change: '+12%', icon: AlertTriangle, color: '#10B981' },
    { name: 'AI Audits Generated', value: '29', change: '+8%', icon: ShieldCheck, color: '#22C55E' },
    { name: 'Pipeline (Revenue Potential™)', value: liveStats?.pipeline || '₹5,82,000', change: '+15%', icon: DollarSign, color: '#F59E0B' },
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
            <Sparkles className="w-5 h-5 text-[#10B981] animate-pulse" />
          </h1>
          <p className="text-[#A1A1AA] text-xs mt-1">LocalRadar Intelligence Engine™ dashboard overview.</p>
        </div>
        <Link 
          href="/dashboard/lead-finder" 
          className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-2 cursor-pointer w-fit uppercase tracking-wider font-mono"
        >
          <Search className="w-4 h-4" />
          Find Opportunities
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-[#141517] border border-[#26282D] p-5 rounded-2xl relative overflow-hidden shadow-lg group transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider font-mono">{stat.name}</span>
                <div 
                  className="p-2 rounded-lg bg-[#0B0B0C] border border-[#26282D] transition-colors"
                  style={{ color: stat.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-serif font-semibold text-white tracking-tight">{stat.value}</span>
                <span className="text-[10px] font-semibold text-[#22C55E] flex items-center font-mono">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </span>
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
              <p className="text-[#A1A1AA] text-xs mt-0.5">Discovered leads by week over the last month</p>
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
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
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
                stroke="#10B981"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Dots */}
              <circle cx="10" cy="180" r="4" fill="#10B981" stroke="#141517" strokeWidth="2" />
              <circle cx="150" cy="130" r="4" fill="#10B981" stroke="#141517" strokeWidth="2" />
              <circle cx="280" cy="110" r="4" fill="#10B981" stroke="#141517" strokeWidth="2" />
              <circle cx="400" cy="60" r="4" fill="#10B981" stroke="#141517" strokeWidth="2" />
              <circle cx="490" cy="30" r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
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
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
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
            
            <div className="space-y-4">
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
                          ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25' 
                          : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25'
                      }`}>
                        {lead.score}pts
                      </span>
                    </div>
                    <p className="text-[9px] text-[#22C55E] font-mono font-bold">{lead.dealValue}</p>
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
