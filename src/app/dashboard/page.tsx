'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Sparkles, 
  Search, 
  ArrowUpRight, 
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function DashboardOverviewPage() {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Leads Discovered', value: '148', change: '+24%', icon: Search, color: '#FF2D2D' },
    { name: 'High Opportunities', value: '42', change: '+12%', icon: AlertTriangle, color: '#EF4444' },
    { name: 'AI Audits Generated', value: '29', change: '+8%', icon: ShieldCheck, color: '#10B981' },
    { name: 'Closing Value (Est.)', value: '$24,600', change: '+15%', icon: TrendingUp, color: '#FF4D4D' },
  ];

  const recentLeads = [
    { name: 'Preston Hollow Family Dental', city: 'Dallas, TX', score: 38, opportunity: 'High', date: '2 hours ago' },
    { name: 'Capital Plumbing & Drain', city: 'Austin, TX', score: 45, opportunity: 'High', date: '4 hours ago' },
    { name: 'Lone Star Spine Clinic', city: 'Houston, TX', score: 62, opportunity: 'Medium', date: '1 day ago' },
    { name: 'Downtown Eats Diner', city: 'Fort Worth, TX', score: 82, opportunity: 'Low', date: '2 days ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Agency Owner'} 
            <Sparkles className="w-5 h-5 text-[#FF2D2D] animate-pulse" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Here is your local business intelligence overview.</p>
        </div>
        <Link 
          href="/dashboard/lead-finder" 
          className="bg-[#FF2D2D] hover:bg-[#e62222] text-white text-xs font-semibold px-4 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(255,45,45,0.25)] flex items-center gap-2 cursor-pointer w-fit"
        >
          <Search className="w-4 h-4" />
          Find New Leads
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
              className="glass-panel p-5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs font-medium">{stat.name}</span>
                <div 
                  className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.08]"
                  style={{ color: stat.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
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
        <div className="glass-panel p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Lead Discovery Trends</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Discovered leads by week over the last month</p>
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 bg-white/[0.03] border border-white/[0.08] px-2.5 py-1 rounded-full">
              Last 30 Days
            </span>
          </div>

          {/* Simple Beautiful SVG Line and Bar Chart */}
          <div className="relative h-60 w-full flex items-end">
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Gradients */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF2D2D" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FF2D2D" stopOpacity="0" />
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
                stroke="#FF2D2D"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Dots */}
              <circle cx="10" cy="180" r="5" fill="#FF2D2D" stroke="#050505" strokeWidth="2" />
              <circle cx="150" cy="130" r="5" fill="#FF2D2D" stroke="#050505" strokeWidth="2" />
              <circle cx="280" cy="110" r="5" fill="#FF2D2D" stroke="#050505" strokeWidth="2" />
              <circle cx="400" cy="60" r="5" fill="#FF4D4D" stroke="#050505" strokeWidth="2" />
              <circle cx="490" cy="30" r="6" fill="#FFFFFF" stroke="#FF2D2D" strokeWidth="2.5" />
            </svg>
            
            {/* Chart X Labels */}
            <div className="w-full flex justify-between text-[10px] text-zinc-500 pt-2 absolute bottom-[-24px]">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
              <span>Today</span>
            </div>
          </div>

          <div className="pt-4 flex gap-6 text-[10px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF2D2D]" />
              <span>Scanned Lead Velocity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D]" />
              <span>Closing Conversion Rate (Avg: 38%)</span>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Recent Opportunities</h3>
              <Activity className="w-4 h-4 text-[#FF2D2D]" />
            </div>
            
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.name} className="flex items-center justify-between border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
                  <div className="max-w-[70%]">
                    <p className="text-xs font-semibold text-white truncate">{lead.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{lead.city} • {lead.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      lead.opportunity === 'High' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-[#FF4D4D]/10 text-[#FF4D4D] border border-[#FF4D4D]/20'
                    }`}>
                      {lead.opportunity} Opportunity
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Score: {lead.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link 
            href="/dashboard/lead-finder" 
            className="w-full mt-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-white font-medium text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            Scan More Businesses
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
