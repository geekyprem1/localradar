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
    { name: 'High Opportunities', value: '42', change: '+12%', icon: AlertTriangle, color: '#FF4D4D' },
    { name: 'AI Audits Generated', value: '29', change: '+8%', icon: ShieldCheck, color: '#22C55E' },
    { name: 'Closing Value (Est.)', value: '$24,600', change: '+15%', icon: TrendingUp, color: '#FACC15' },
  ];

  const recentLeads = [
    { name: 'Preston Hollow Family Dental', city: 'Dallas, TX', score: 38, opportunity: 'High', date: '2 hours ago' },
    { name: 'Capital Plumbing & Drain', city: 'Austin, TX', score: 45, opportunity: 'High', date: '4 hours ago' },
    { name: 'Lone Star Spine Clinic', city: 'Houston, TX', score: 62, opportunity: 'Medium', date: '1 day ago' },
    { name: 'Downtown Eats Diner', city: 'Fort Worth, TX', score: 82, opportunity: 'Low', date: '2 days ago' },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#0F0F11] flex items-center gap-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Agency Owner'} 
            <Sparkles className="w-5 h-5 text-[#E54D80] animate-pulse" />
          </h1>
          <p className="text-zinc-500 text-xs mt-1">Here is your local business intelligence overview.</p>
        </div>
        <Link 
          href="/dashboard/lead-finder" 
          className="bg-[#E54D80] hover:bg-[#FF5E8C] text-white text-xs font-bold px-4 py-3 rounded-full transition-all shadow-sm flex items-center gap-2 cursor-pointer w-fit"
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
              className="bg-white border border-[#E5E5E8] p-5 rounded-2xl relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider font-mono">{stat.name}</span>
                <div 
                  className="p-2 rounded-lg bg-zinc-50 border border-[#E5E5E8]"
                  style={{ color: stat.color === '#FF2D2D' ? '#E54D80' : stat.color === '#FF4D4D' ? '#FF5E8C' : stat.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-serif font-bold text-[#0F0F11] tracking-tight">{stat.value}</span>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center font-mono">
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
        <div className="bg-white border border-[#E5E5E8] p-6 lg:col-span-2 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F0F11]">Lead Discovery Trends</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Discovered leads by week over the last month</p>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 bg-[#F4F4F6] border border-[#E5E5E8] px-2.5 py-1 rounded-full font-mono uppercase">
              Last 30 Days
            </span>
          </div>

          {/* Simple Beautiful SVG Line and Bar Chart */}
          <div className="relative h-60 w-full flex items-end">
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Gradients */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E54D80" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#E54D80" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(15,15,17,0.04)" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(15,15,17,0.04)" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(15,15,17,0.04)" strokeWidth="1" />

              {/* Graph Line Area */}
              <path
                d="M 10 180 Q 120 120 220 140 T 400 60 T 490 30 L 490 200 L 10 200 Z"
                fill="url(#chartGradient)"
              />

              {/* Graph Line */}
              <path
                d="M 10 180 Q 120 120 220 140 T 400 60 T 490 30"
                fill="none"
                stroke="#E54D80"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Dots */}
              <circle cx="10" cy="180" r="5" fill="#E54D80" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="150" cy="130" r="5" fill="#E54D80" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="280" cy="110" r="5" fill="#E54D80" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="400" cy="60" r="5" fill="#FF5E8C" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="490" cy="30" r="6" fill="#FFFFFF" stroke="#E54D80" strokeWidth="2.5" />
            </svg>
            
            {/* Chart X Labels */}
            <div className="w-full flex justify-between text-[10px] text-zinc-400 pt-2 absolute bottom-[-24px] font-mono">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
              <span>Today</span>
            </div>
          </div>

          <div className="pt-4 flex gap-6 text-[10px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E54D80]" />
              <span>Scanned Lead Velocity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E8C]" />
              <span>Closing Conversion Rate (Avg: 38%)</span>
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white border border-[#E5E5E8] p-6 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F0F11]">Recent Opportunities</h3>
              <Activity className="w-4 h-4 text-[#E54D80]" />
            </div>
            
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.name} className="flex items-center justify-between border-b border-[#E5E5E8] pb-3 last:border-0 last:pb-0">
                  <div className="max-w-[70%]">
                    <p className="text-xs font-bold text-[#0F0F11] truncate">{lead.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">{lead.city} • {lead.date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                      lead.opportunity === 'High' 
                        ? 'bg-[#E54D80]/10 text-[#E54D80] border-[#E54D80]/20' 
                        : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {lead.opportunity}
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">Score: {lead.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link 
            href="/dashboard/lead-finder" 
            className="w-full mt-6 bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-zinc-600 hover:text-[#0F0F11] font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer group font-mono"
          >
            Scan More Businesses
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
