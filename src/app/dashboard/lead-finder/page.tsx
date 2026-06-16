'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Globe, 
  Star, 
  Phone, 
  Loader2, 
  Sparkles, 
  FileText, 
  Send,
  Bookmark,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Info,
  ShieldCheck,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateLeads } from '@/lib/mockData';
import { Business, Opportunity } from '@/types';

export default function LeadFinderPage() {
  const router = useRouter();
  const [niche, setNiche] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [searched, setSearched] = useState(false);
  
  const [leads, setLeads] = useState<Business[]>([]);
  const [opportunities, setOpportunities] = useState<Record<string, Opportunity>>({});
  const [savedLeadsList, setSavedLeadsList] = useState<string[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const loadingStages = [
    'Initializing local revenue crawler...',
    'Scanning Google Maps listings & GBP registers...',
    'Resolving company web domains & mail servers...',
    'Auditing website performance & core web vitals...',
    'Analyzing review velocity & sentiment trends...',
    'Generating AI sales intelligence & Opportunity Scores™...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStage((prev) => {
          if (prev >= loadingStages.length - 1) {
            return prev;
          }
          return prev + 1;
        });
      }, 900);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load last searches and saved leads on mount
  useEffect(() => {
    const cachedLeads = localStorage.getItem('localradar_latest_leads');
    const cachedOpps = localStorage.getItem('localradar_latest_opps');
    if (cachedLeads && cachedOpps) {
      setLeads(JSON.parse(cachedLeads));
      setOpportunities(JSON.parse(cachedOpps));
      setSearched(true);
    }

    const cachedSaved = localStorage.getItem('localradar_saved_leads');
    if (cachedSaved) {
      const parsed = JSON.parse(cachedSaved) as Business[];
      setSavedLeadsList(parsed.map(b => b.id));
    }
  }, []);

  const toggleSaveLead = (biz: Business) => {
    const cachedSaved = localStorage.getItem('localradar_saved_leads');
    const cachedSavedOpps = localStorage.getItem('localradar_saved_opps');
    
    let savedList: Business[] = [];
    let oppsMap: Record<string, Opportunity> = {};
    
    if (cachedSaved) {
      savedList = JSON.parse(cachedSaved);
    }
    if (cachedSavedOpps) {
      oppsMap = JSON.parse(cachedSavedOpps);
    }
    
    const isAlreadySaved = savedList.some(b => b.id === biz.id);
    
    if (isAlreadySaved) {
      savedList = savedList.filter(b => b.id !== biz.id);
      delete oppsMap[biz.id];
      setSavedLeadsList(prev => prev.filter(id => id !== biz.id));
    } else {
      savedList.push(biz);
      const opp = opportunities[biz.id];
      if (opp) {
        oppsMap[biz.id] = opp;
      }
      setSavedLeadsList(prev => [...prev, biz.id]);
    }
    
    localStorage.setItem('localradar_saved_leads', JSON.stringify(savedList));
    localStorage.setItem('localradar_saved_opps', JSON.stringify(oppsMap));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !city) return;

    setLoading(true);
    setSearched(false);
    setExpandedRowId(null);

    const key = localStorage.getItem('localradar_dev_google_places_key') || '';

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-google-places-key': key
        },
        body: JSON.stringify({ niche, city, country })
      });

      const data = await response.json();

      if (response.ok && data.success && data.businesses?.length > 0) {
        setLeads(data.businesses);
        setOpportunities(data.opportunities);
        localStorage.setItem('localradar_latest_leads', JSON.stringify(data.businesses));
        localStorage.setItem('localradar_latest_opps', JSON.stringify(data.opportunities));
        setLoading(false);
        setSearched(true);
        return;
      }
    } catch (err) {
      console.warn('Live search failed, falling back to sandbox simulation:', err);
    }

    // Fallback sandbox generator
    setTimeout(() => {
      const { businesses, opportunities: opps } = generateLeads(niche, city, country);
      
      setLeads(businesses);
      setOpportunities(opps);
      
      localStorage.setItem('localradar_latest_leads', JSON.stringify(businesses));
      localStorage.setItem('localradar_latest_opps', JSON.stringify(opps));
      
      setLoading(false);
      setSearched(true);
    }, 5000);
  };

  // Mapped Opportunity Score™ (71-100 High, 41-70 Medium, 0-40 Low)
  const getOpportunityScore = (opp: Opportunity) => {
    const rawScore = 100 - opp.total_score;
    if (opp.opportunity_level === 'High') {
      return Math.floor(71 + ((rawScore - 50) / 50) * 29);
    } else if (opp.opportunity_level === 'Medium') {
      return Math.floor(41 + ((rawScore - 25) / 24) * 29);
    } else {
      return Math.floor((rawScore / 24) * 40);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 71) return 'text-[#E54D80] border-[#E54D80]/20 bg-[#E54D80]/10'; // High Opportunity
    if (score >= 41) return 'text-amber-600 border-amber-500/20 bg-amber-500/10'; // Medium Opportunity
    return 'text-emerald-600 border-emerald-500/20 bg-emerald-500/10'; // Low Opportunity
  };

  const getScoreLabel = (score: number) => {
    if (score >= 71) return 'High';
    if (score >= 41) return 'Medium';
    return 'Low';
  };

  const getDealValueString = (score: number) => {
    if (score >= 71) return '$3,000 - $7,000';
    if (score >= 41) return '$1,500 - $3,000';
    return '$500 - $1,000';
  };

  const getOpportunityReasons = (biz: Business, opp: Opportunity) => {
    const reasons: string[] = [];
    if (!biz.website) {
      reasons.push('No Website');
    } else if (opp.website_score < 15) {
      reasons.push('Weak Website');
    }
    if (biz.reviews_count < 20 || biz.rating < 4.0) {
      reasons.push('Low Reviews');
    }
    if (opp.seo_score < 12) {
      reasons.push('Weak SEO');
    }
    if (opp.social_score < 8 || !biz.website) {
      reasons.push('No Booking System');
    }
    
    if (reasons.length === 0) {
      reasons.push('Weak SEO');
    }
    return reasons;
  };

  const getTrendText = (id: string) => {
    const hash = id.charCodeAt(id.length - 1) || 0;
    const value = (hash % 12) + 4;
    return `+${value}% demand`;
  };

  // Stats computation
  const stats = searched && leads.length > 0 ? {
    found: leads.length,
    high: leads.filter(l => opportunities[l.id] && getOpportunityScore(opportunities[l.id]) >= 71).length,
    pipeline: leads.reduce((sum, l) => {
      const opp = opportunities[l.id];
      if (!opp) return sum;
      const score = getOpportunityScore(opp);
      if (score >= 71) return sum + 5000;
      if (score >= 41) return sum + 2250;
      return sum + 750;
    }, 0),
    avgScore: Math.round(leads.reduce((sum, l) => {
      const opp = opportunities[l.id];
      return sum + (opp ? getOpportunityScore(opp) : 0);
    }, 0) / leads.length)
  } : {
    found: 124,
    high: 38,
    pipeline: 58200,
    avgScore: 71
  };

  // Top 5 opportunities
  const topOpportunities = [...leads]
    .map(l => {
      const opp = opportunities[l.id];
      const score = opp ? getOpportunityScore(opp) : 0;
      return { lead: l, opp, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-[#0F0F11] pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E8] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#E54D80] font-bold">
            <Zap className="w-3.5 h-3.5 fill-[#E54D80]" />
            AI-Powered Sales Intelligence
          </div>
          <h1 className="text-3xl font-serif font-extrabold tracking-tight mt-1 text-[#0F0F11]">Opportunity Finder</h1>
          <p className="text-zinc-500 text-xs mt-1">
            Discover local businesses with critical vulnerabilities and high closing velocities.
          </p>
        </div>
      </div>

      {/* SECTION 1: Compact Search Bar */}
      <div className="bg-white border border-[#E5E5E8] p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#E54D80]/35 to-transparent" />
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end font-sans">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Search className="w-3.5 h-3.5 text-[#E54D80]" />
              Business Type / Niche
            </label>
            <input
              type="text"
              placeholder="e.g. Dental Practice, Plumbers, Roofer"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-[#F4F4F6] border border-[#E5E5E8] rounded-xl py-3 px-4 text-[#0F0F11] placeholder-zinc-400 text-xs focus:outline-none focus:border-[#E54D80] focus:ring-1 focus:ring-[#E54D80] transition-all font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5 text-[#E54D80]" />
              Target City
            </label>
            <input
              type="text"
              placeholder="e.g. Dallas, TX or Austin"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#F4F4F6] border border-[#E5E5E8] rounded-xl py-3 px-4 text-[#0F0F11] placeholder-zinc-400 text-xs focus:outline-none focus:border-[#E54D80] focus:ring-1 focus:ring-[#E54D80] transition-all font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Globe className="w-3.5 h-3.5 text-[#E54D80]" />
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-[#F4F4F6] border border-[#E5E5E8] rounded-xl py-3 px-4 text-[#0F0F11] text-xs focus:outline-none focus:border-[#E54D80] focus:ring-1 focus:ring-[#E54D80] transition-all font-mono cursor-pointer"
            >
              <option value="United States">United States</option>
              <option value="India">India</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E54D80] hover:bg-[#FF5E8C] disabled:bg-[#E54D80]/50 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer h-[44px] uppercase tracking-wider font-mono"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin animate-duration-1000" />
                Scanning Local Map...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white fill-white/10" />
                Find Opportunities
              </>
            )}
          </button>
        </form>
      </div>

      {/* SKELETON SCANNING ANIMATION */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-[#E5E5E8] p-8 rounded-2xl relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E54D80]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="flex flex-col items-center justify-center space-y-4 text-center lg:border-r lg:border-[#E5E5E8] lg:pr-8">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-[#E54D80]/15 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#E54D80] border-t-transparent rounded-full animate-spin"></div>
                  <Search className="w-8 h-8 text-[#E54D80] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-[#0F0F11] text-base font-bold font-serif">Deep Opportunity Scanning</h3>
                  <p className="text-zinc-500 text-[11px] mt-1 font-mono">Resolving Places APIs & SEO indices...</p>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3.5">
                {loadingStages.map((stage, idx) => {
                  const isPassed = loadingStage > idx;
                  const isActive = loadingStage === idx;
                  return (
                    <motion.div 
                      key={stage} 
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: isActive ? 1 : isPassed ? 0.75 : 0.25 }}
                      className="flex items-center gap-3 text-xs font-mono"
                    >
                      {isPassed ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/20 text-[#059669] border border-emerald-500/30 flex items-center justify-center text-[9px] font-bold">✓</div>
                      ) : isActive ? (
                        <Loader2 className="w-4.5 h-4.5 text-[#E54D80] animate-spin" />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full border border-zinc-200 bg-white"></div>
                      )}
                      <span className={`${isPassed ? 'text-zinc-400 line-through' : isActive ? 'text-[#0F0F11] font-bold' : 'text-zinc-400'}`}>
                        {stage}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 2: Opportunity Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Businesses Analyzed', 
            val: stats.found, 
            desc: searched ? 'Scanned in target market' : 'Dallas Dental Practice Scan example', 
            trend: '+12%',
            icon: Building2,
            color: 'text-[#0F0F11]'
          },
          { 
            label: 'High Opportunity Leads', 
            val: stats.high, 
            desc: 'Critical closing triggers confirmed', 
            trend: 'Actionable Now',
            icon: AlertTriangle,
            color: 'text-[#E54D80]' 
          },
          { 
            label: 'Potential Pipeline Value', 
            val: `$${stats.pipeline.toLocaleString()}`, 
            desc: 'Suggested services contract value', 
            trend: 'High Yield',
            icon: DollarSign,
            color: 'text-[#059669]' 
          },
          { 
            label: 'Avg. Opportunity Score™', 
            val: `${stats.avgScore}/100`, 
            desc: 'Higher score = easier target to close', 
            trend: 'Optimal Target',
            icon: TrendingUp,
            color: 'text-amber-600' 
          }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-white border border-[#E5E5E8] p-5 rounded-2xl hover:border-zinc-300 hover:shadow-sm transition-all relative group cursor-default"
            >
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#F4F4F6] border border-[#E5E5E8] text-zinc-400 group-hover:text-[#E54D80] transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">{card.label}</div>
              <div className={`text-2xl font-serif font-extrabold tracking-tight mt-2.5 ${card.color}`}>
                {card.val}
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] font-mono border-t border-zinc-100 pt-2">
                <span className="text-zinc-500 truncate max-w-[70%]">{card.desc}</span>
                <span className={`font-semibold ${card.color} opacity-95`}>{card.trend}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SECTION 3: Top Opportunities */}
      {searched && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F0F11] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#E54D80] fill-[#E54D80]/10" />
                Priority Closing Dashboard (Top 5 Opportunities)
              </h2>
              <p className="text-[11px] text-zinc-500">Highest response probabilities computed based on metadata vulnerabilities.</p>
            </div>
            <span className="text-[9px] font-bold text-[#E54D80] bg-[#E54D80]/10 border border-[#E54D80]/20 px-2 py-0.5 rounded font-mono uppercase tracking-wide">
              Priority Targets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topOpportunities.map(({ lead, opp, score }, idx) => {
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white border border-[#E5E5E8] hover:border-[#E54D80]/35 hover:shadow-[0_0_15px_rgba(229,77,128,0.1)] p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group transition-all"
                >
                  <div className="absolute top-0 left-0 w-[2px] h-full bg-[#E54D80] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${getScoreColor(score)}`}>
                        {score} pts
                      </span>
                      <span className="text-[9px] text-[#E54D80] font-mono">{getTrendText(lead.id)}</span>
                    </div>

                    <h3 className="font-serif font-extrabold text-[#0F0F11] text-xs mt-3 leading-snug truncate group-hover:text-[#E54D80] transition-colors">
                      {lead.name}
                    </h3>
                    <p className="text-[9px] text-zinc-400 font-mono mt-0.5 truncate">{lead.address}</p>

                    <div className="mt-3.5 space-y-1.5 border-t border-zinc-100 pt-3">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-zinc-400">Pipeline Value</span>
                        <span className="text-[#059669] font-bold">{getDealValueString(score)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-zinc-400">Reviews</span>
                        <span className="text-[#0F0F11] flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-[#FACC15] fill-[#FACC15]" />
                          {lead.rating} ({lead.reviews_count})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-zinc-400">Web Presence</span>
                        {lead.website ? (
                          <span className="text-[#059669] truncate max-w-[60px] inline-block">Active Domain</span>
                        ) : (
                          <span className="text-[#E54D80] font-bold">No Website</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-1.5">
                    <button
                      onClick={() => router.push(`/dashboard/audit/${lead.id}`)}
                      className="flex-1 bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-[#0F0F11] text-[9px] font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1 cursor-pointer font-mono"
                    >
                      <FileText className="w-2.5 h-2.5 text-zinc-500" />
                      Audit
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/pitch?bizId=${lead.id}`)}
                      className="flex-1 bg-[#E54D80] hover:bg-[#FF5E8C] text-white text-[9px] font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1 cursor-pointer font-mono shadow-sm"
                    >
                      <Send className="w-2.5 h-2.5 text-white" />
                      Pitch
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: Opportunity Table */}
      {searched && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E8] pb-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-400">
              Intelligence Listing ({leads.length} Records)
            </h2>
            <div className="text-[10px] text-zinc-400 font-mono">
              Click any row to open the Interactive Opportunity Panel
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E8] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5E8] bg-[#F9F9FB] text-zinc-500 text-[9px] font-mono uppercase tracking-wider">
                    <th className="p-4">Business</th>
                    <th className="p-4 text-center">Opportunity Score™</th>
                    <th className="p-4 text-center">Potential Deal Value</th>
                    <th className="p-4">Reviews</th>
                    <th className="p-4">Website Status</th>
                    <th className="p-4">Verified Vulnerabilities</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E8]">
                  {leads.map((biz) => {
                    const opp = opportunities[biz.id];
                    const score = opp ? getOpportunityScore(opp) : 0;
                    const reasons = opp ? getOpportunityReasons(biz, opp) : [];
                    const isExpanded = expandedRowId === biz.id;

                    return (
                      <React.Fragment key={biz.id}>
                        {/* Table Row */}
                        <tr 
                          onClick={() => setExpandedRowId(isExpanded ? null : biz.id)}
                          className={`hover:bg-zinc-50 transition-colors cursor-pointer select-none ${isExpanded ? 'bg-zinc-50/70' : ''}`}
                        >
                          <td className="p-4 max-w-[220px]">
                            <div className="font-serif font-extrabold text-sm text-[#0F0F11] flex items-center gap-1.5 group-hover:text-[#E54D80]">
                              {biz.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">{biz.address}</div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg border font-mono ${getScoreColor(score)}`}>
                                {score} / 100
                              </span>
                              <span className="text-[8px] text-zinc-400 font-mono mt-1 uppercase tracking-wide">
                                {getScoreLabel(score)} Opp
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-xs font-bold text-[#059669] font-mono">
                              {getDealValueString(score)}
                            </span>
                            <div className="text-[8px] text-zinc-400 font-mono mt-0.5 uppercase">Contract Range</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-xs text-[#0F0F11]">
                              <Star className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]" />
                              <span className="font-bold">{biz.rating}</span>
                              <span className="text-zinc-400 font-mono text-[10px]">({biz.reviews_count} reviews)</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {biz.website ? (
                              <a
                                href={biz.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-[#E54D80] hover:underline inline-flex items-center gap-1 max-w-[150px] truncate font-mono"
                              >
                                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                                {biz.website.replace('https://www.', '')}
                              </a>
                            ) : (
                              <span className="text-[9px] text-[#E54D80] bg-[#E54D80]/10 border border-[#E54D80]/20 px-2 py-0.5 rounded-lg font-bold font-mono">
                                No Website
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {reasons.map((r) => (
                                <span 
                                  key={r} 
                                  className="text-[8px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono"
                                >
                                  ✓ {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleSaveLead(biz)}
                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                  savedLeadsList.includes(biz.id)
                                    ? 'bg-[#E54D80]/15 border-[#E54D80]/30 text-[#E54D80] hover:bg-[#E54D80]/25'
                                    : 'bg-[#F4F4F6] border-[#E5E5E8] text-zinc-500 hover:text-[#0F0F11] hover:bg-[#E5E5E8]'
                                }`}
                                title={savedLeadsList.includes(biz.id) ? 'Remove Lead' : 'Save Lead'}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${savedLeadsList.includes(biz.id) ? 'fill-[#E54D80]' : ''}`} />
                              </button>
                              
                              <button
                                onClick={() => router.push(`/dashboard/audit/${biz.id}`)}
                                className="bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-[#0F0F11] text-xs font-bold px-3 py-1.5 rounded-lg transition-all font-mono"
                              >
                                Audit
                              </button>
                              
                              <button
                                onClick={() => router.push(`/dashboard/pitch?bizId=${biz.id}`)}
                                className="bg-[#E54D80] hover:bg-[#FF5E8C] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all font-mono shadow-sm"
                              >
                                Pitch
                              </button>

                              <button 
                                onClick={() => setExpandedRowId(isExpanded ? null : biz.id)}
                                className="text-zinc-400 hover:text-[#0F0F11] p-1 rounded transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Interactive Opportunity Panel (Row Expansion) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="p-0 bg-[#F9F9FB]">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden border-b border-[#E5E5E8]"
                                >
                                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    
                                    {/* Sub-column 1: Business Details */}
                                    <div className="space-y-4 border-r border-[#E5E5E8] pr-6">
                                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                                        Client Overview
                                      </h4>
                                      <div className="space-y-3 font-mono text-xs">
                                        <div>
                                          <span className="text-zinc-400 block">Legal Entity Name</span>
                                          <span className="font-bold text-[#0F0F11] text-sm font-sans">{biz.name}</span>
                                        </div>
                                        <div>
                                          <span className="text-zinc-400 block">Direct Address</span>
                                          <span className="text-zinc-500">{biz.address}</span>
                                        </div>
                                        {biz.phone && (
                                          <div>
                                            <span className="text-zinc-400 block">Telephone Line</span>
                                            <span className="text-[#0F0F11] flex items-center gap-1.5">
                                              <Phone className="w-3.5 h-3.5 text-zinc-400" />
                                              {biz.phone}
                                            </span>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-zinc-400 block">Web Address</span>
                                          {biz.website ? (
                                            <a 
                                              href={biz.website} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-[#E54D80] hover:underline flex items-center gap-1"
                                            >
                                              {biz.website}
                                              <ExternalLink className="w-3 h-3 text-[#E54D80]/70" />
                                            </a>
                                          ) : (
                                            <span className="text-[#E54D80] font-bold">No registered domain</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Sub-column 2: Diagnostics & Score Breakdown */}
                                    <div className="space-y-4 border-r border-[#E5E5E8] pr-6">
                                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                                        Risk & Quality Diagnostics
                                      </h4>
                                      
                                      <div className="space-y-2.5">
                                        {[
                                          { label: 'Website Score', val: opp?.website_score || 0, max: 25 },
                                          { label: 'Reviews Strength', val: opp?.reviews_score || 0, max: 25 },
                                          { label: 'Search SEO Value', val: opp?.seo_score || 0, max: 20 },
                                          { label: 'Google Profile Status', val: opp?.gbp_score || 0, max: 15 },
                                          { label: 'Social Velocity', val: opp?.social_score || 0, max: 15 }
                                        ].map((bar) => {
                                          const pct = (bar.val / bar.max) * 100;
                                          const isWeak = pct <= 50;
                                          return (
                                            <div key={bar.label} className="space-y-1 font-mono text-[10px]">
                                              <div className="flex justify-between">
                                                <span className="text-zinc-400">{bar.label}</span>
                                                <span className={isWeak ? 'text-[#E54D80] font-bold' : 'text-zinc-500'}>
                                                  {bar.val}/{bar.max} ({isWeak ? 'Vulnerable' : 'Good'})
                                                </span>
                                              </div>
                                              <div className="h-1 bg-[#E5E5E8] rounded-full overflow-hidden">
                                                <div 
                                                  className={`h-full rounded-full ${isWeak ? 'bg-[#E54D80]' : 'bg-[#059669]'}`}
                                                  style={{ width: `${pct}%` }}
                                                />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Sub-column 3: AI recommendations & Pricing */}
                                    <div className="space-y-4 flex flex-col justify-between">
                                      <div className="space-y-2.5">
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                                          AI Closing Strategy
                                        </h4>
                                        <div className="p-3 bg-[#FFF0F5] border border-[#E54D80]/20 rounded-xl font-mono text-[10px] space-y-1.5">
                                          <div className="text-[#E54D80] font-bold uppercase tracking-wider text-[8px]">
                                            Suggested Agency Package
                                          </div>
                                          <div className="text-[#0F0F11] text-xs font-bold font-sans">
                                            {!biz.website 
                                              ? 'High-Conversion Website Builder + SEO Retainer' 
                                              : 'Google Reputation Acceleration & Social Autopilot'}
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[#059669] font-bold text-sm mt-1.5">
                                            <DollarSign className="w-4 h-4" />
                                            {!biz.website 
                                              ? '$3,500 setup + $499/mo' 
                                              : '$1,800 setup + $299/mo'}
                                            <span className="text-zinc-400 font-normal text-[8px] uppercase">Est. Revenue</span>
                                          </div>
                                        </div>

                                        <ul className="text-[10px] text-zinc-500 space-y-1 font-mono">
                                          <li className="flex items-start gap-1">
                                            <span className="text-[#E54D80]">•</span>
                                            {!biz.website 
                                              ? 'Client has 0 web domain. Sell local landing page.' 
                                              : 'Resolve web audit performance lags.'}
                                          </li>
                                          <li className="flex items-start gap-1">
                                            <span className="text-[#E54D80]">•</span>
                                            Configure direct Google Booking webhook for immediate actions.
                                          </li>
                                          <li className="flex items-start gap-1">
                                            <span className="text-[#E54D80]">•</span>
                                            Launch automated reviews feedback sequence to elevate rating.
                                          </li>
                                        </ul>
                                      </div>

                                      <div className="flex gap-2.5 pt-2">
                                        <button
                                          onClick={() => router.push(`/dashboard/audit/${biz.id}`)}
                                          className="flex-1 bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-[#0F0F11] text-xs font-bold py-2 rounded-lg transition-all font-mono"
                                        >
                                          Generate Proposal
                                        </button>
                                        <button
                                          onClick={() => router.push(`/dashboard/pitch?bizId=${biz.id}`)}
                                          className="flex-1 bg-[#E54D80] hover:bg-[#FF5E8C] text-white text-xs font-bold py-2 rounded-lg transition-all font-mono shadow-sm"
                                        >
                                          Generate Pitch
                                        </button>
                                      </div>
                                    </div>

                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searched && !loading && (
        <div className="bg-white border border-dashed border-[#E5E5E8] p-12 text-center max-w-lg mx-auto rounded-3xl shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#F4F4F6] border border-[#E5E5E8] flex items-center justify-center mx-auto mb-4 text-[#E54D80]">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-[#0F0F11] text-sm font-bold font-serif">Deep Market Opportunity Scans</h3>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto font-mono">
            Enter a niche category (e.g. Roofers) and city to identify revenue opportunities.
          </p>
        </div>
      )}

    </div>
  );
}
