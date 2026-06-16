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
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  AlertTriangle,
  Zap,
  Info,
  Building2,
  ExternalLink,
  Target,
  Layers,
  ArrowRight,
  X,
  History,
  Briefcase,
  Compass,
  LineChart,
  ShieldCheck,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateLeads, generateMockCompetitors } from '@/lib/mockData';
import { scoreBusinessOpportunity, getVulnerabilityTags } from '@/lib/scoring';
import { Business, Opportunity } from '@/types';
import { ScoredOpportunity } from '@/types/scoring';
import OpportunityIntelligenceDrawer from '@/components/OpportunityIntelligenceDrawer';


interface RecentSearch {
  niche: string;
  city: string;
  country: string;
}

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
  const [scoredMap, setScoredMap] = useState<Record<string, ScoredOpportunity>>({});
  const [savedLeadsList, setSavedLeadsList] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  
  // Drawer state for the slide-over intelligence panel
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [hotLeadsMap, setHotLeadsMap] = useState<Record<string, boolean>>({});

  const refreshHotLeadsMap = () => {
    const hotMap: Record<string, boolean> = {};
    leads.forEach(biz => {
      hotMap[biz.id] = localStorage.getItem(`localradar_hot_${biz.id}`) === 'true';
    });
    setHotLeadsMap(hotMap);
  };


  const loadingStages = [
    'Initializing LocalRadar Intelligence Engine™...',
    'Scanning targets via Opportunity Engine™...',
    'Computing closing likelihood via Closing Probability™...',
    'Running Revenue Potential™ metrics analysis...',
    'Evaluating suitability via Service Fit Engine™...',
    'Running diagnostics through Why This Lead™...'
  ];

  const popularNiches = ['Dentists', 'Roofers', 'Plumbers', 'Lawyers', 'Gyms'];

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
      }, 700);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Compute scored map whenever leads change
  useEffect(() => {
    if (leads.length === 0) return;
    const map: Record<string, ScoredOpportunity> = {};
    leads.forEach(biz => {
      const competitors = generateMockCompetitors(biz);
      map[biz.id] = scoreBusinessOpportunity(biz, competitors);
    });
    setScoredMap(map);
    refreshHotLeadsMap();
  }, [leads]);

  // Load last searches, recent searches, and saved leads on mount
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

    const cachedRecent = localStorage.getItem('localradar_recent_searches');
    if (cachedRecent) {
      setRecentSearches(JSON.parse(cachedRecent));
    } else {
      // Seed some mock recent searches
      const seeds = [
        { niche: 'Dentists', city: 'Austin', country: 'United States' },
        { niche: 'Gyms', city: 'Dallas', country: 'United States' }
      ];
      setRecentSearches(seeds);
      localStorage.setItem('localradar_recent_searches', JSON.stringify(seeds));
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

  const handleSearch = async (e?: React.FormEvent, searchNiche?: string, searchCity?: string, searchCountry?: string) => {
    if (e) e.preventDefault();
    
    const finalNiche = searchNiche || niche;
    const finalCity = searchCity || city;
    const finalCountry = searchCountry || country;

    if (!finalNiche || !finalCity) return;

    // Set input values back to UI just in case
    setNiche(finalNiche);
    setCity(finalCity);
    setCountry(finalCountry);

    setLoading(true);
    setSearched(false);
    setSelectedLeadId(null);

    // Save recent search
    const updatedRecent = [
      { niche: finalNiche, city: finalCity, country: finalCountry },
      ...recentSearches.filter(s => !(s.niche.toLowerCase() === finalNiche.toLowerCase() && s.city.toLowerCase() === finalCity.toLowerCase()))
    ].slice(0, 5);

    setRecentSearches(updatedRecent);
    localStorage.setItem('localradar_recent_searches', JSON.stringify(updatedRecent));

    const key = localStorage.getItem('localradar_dev_google_places_key') || '';

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-google-places-key': key
        },
        body: JSON.stringify({ niche: finalNiche, city: finalCity, country: finalCountry })
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
      const { businesses, opportunities: opps } = generateLeads(finalNiche, finalCity, finalCountry);
      
      setLeads(businesses);
      setOpportunities(opps);
      
      localStorage.setItem('localradar_latest_leads', JSON.stringify(businesses));
      localStorage.setItem('localradar_latest_opps', JSON.stringify(opps));
      
      setLoading(false);
      setSearched(true);
    }, 4500);
  };

  const executePopularNiche = (nicheName: string) => {
    const defaultCity = city || 'Austin';
    handleSearch(undefined, nicheName, defaultCity, country);
  };

  // Intelligence Engine™ helper functions
  const getScore = (bizId: string) => scoredMap[bizId]?.opportunityScore ?? opportunities[bizId]?.total_score ?? 0;
  const getLevel = (bizId: string) => scoredMap[bizId]?.opportunityLevel ?? opportunities[bizId]?.opportunity_level ?? 'Low';
  const getClosing = (bizId: string) => scoredMap[bizId]?.closingProbability ?? opportunities[bizId]?.closing_probability ?? 0;
  const getDealValue = (bizId: string) => scoredMap[bizId]?.dealValue?.formatted ?? `₹${(opportunities[bizId]?.estimated_deal_value || 0).toLocaleString()}`;
  const getBestFit = (bizId: string) => scoredMap[bizId]?.bestFit;
  const getServiceFits = (bizId: string) => scoredMap[bizId]?.serviceFitScores ?? [];

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-[#2DD4A7] border-[#2DD4A7]/25 bg-[#2DD4A7]/10';
    if (score >= 35) return 'text-[#F5A623] border-[#F5A623]/20 bg-[#F5A623]/10';
    return 'text-[#FF5C5C] border-[#FF5C5C]/20 bg-[#FF5C5C]/10';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 60) return 'bg-[#2DD4A7] text-[#0B0B0C]';
    if (score >= 35) return 'bg-[#F5A623] text-[#0B0B0C]';
    return 'bg-[#FF5C5C] text-[#FFFFFF]';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 60) return 'HIGH';
    if (score >= 35) return 'MEDIUM';
    return 'LOW';
  };

  const getFitColor = (level: string) => {
    if (level === 'Perfect Fit') return 'text-[#FFFFFF] bg-[#26282D] border-[#26282D]';
    if (level === 'Strong Fit') return 'text-[#A1A1AA] bg-[#141517] border-[#26282D]';
    if (level === 'Moderate Fit') return 'text-[#71717A] bg-transparent border-[#26282D]/60';
    return 'text-[#71717A] bg-transparent border-[#26282D]/40';
  };

  const getTags = (bizId: string) => {
    const scored = scoredMap[bizId];
    if (scored) return getVulnerabilityTags(scored);
    return ['Analyzing...'];
  };

  const getCleanTopReason = (bizId: string) => {
    const scored = scoredMap[bizId];
    if (!scored) return 'Strong Target';
    const reasons = scored.reasons || [];
    
    const noWebsite = reasons.some((r: string) => r.toLowerCase().includes('no website'));
    if (noWebsite) return 'No Website';
    
    const reviewGap = reasons.find((r: string) => r.toLowerCase().includes('reviews') && r.toLowerCase().includes('below'));
    if (reviewGap) {
      const match = reviewGap.match(/\d+/);
      if (match) {
        return `Review Gap ${match[0]}+`;
      }
      return 'Review Gap';
    }

    const noBooking = reasons.some((r: string) => r.toLowerCase().includes('booking') || r.toLowerCase().includes('appointment'));
    if (noBooking) return 'Revenue Leak';

    const gbpWeakness = reasons.some((r: string) => r.toLowerCase().includes('gbp') || r.toLowerCase().includes('google business') || r.toLowerCase().includes('phone'));
    if (gbpWeakness) return 'Weak Visibility';

    return 'Low Reviews';
  };

  // Indian currency abbreviator
  const formatLakhs = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Dynamic metrics calculations
  const stats = searched && leads.length > 0 ? {
    found: leads.length,
    highOppCount: leads.filter(l => getScore(l.id) >= 60).length,
    highProbCount: leads.filter(l => getClosing(l.id) >= 70).length,
    pipeline: leads.reduce((sum, l) => {
      const scored = scoredMap[l.id];
      if (scored) return sum + scored.dealValue.max;
      return sum + (opportunities[l.id]?.estimated_deal_value || 0);
    }, 0),
    weightedPipeline: leads.reduce((sum, l) => {
      const scored = scoredMap[l.id];
      const maxVal = scored ? scored.dealValue.max : (opportunities[l.id]?.estimated_deal_value || 0);
      const prob = getClosing(l.id);
      return sum + Math.round(maxVal * (prob / 100));
    }, 0),
    avgClosing: Math.round(leads.reduce((sum, l) => sum + getClosing(l.id), 0) / leads.length)
  } : {
    found: 0,
    highOppCount: 0,
    highProbCount: 0,
    pipeline: 0,
    weightedPipeline: 0,
    avgClosing: 0
  };

  // Top 5 opportunities
  const topOpportunities = [...leads]
    .map(l => ({
      lead: l,
      opp: opportunities[l.id],
      score: getScore(l.id),
      scored: scoredMap[l.id],
      closing: getClosing(l.id)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const selectedScored = selectedLead ? scoredMap[selectedLead.id] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-[#FFFFFF] pb-16 relative">
      
      {/* Top Header / Premium Context Line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#A1A1AA] font-semibold">
            <Zap className="w-3.5 h-3.5 text-[#A1A1AA] animate-pulse" />
            Opportunity Engine™
          </div>
          <h1 className="text-3xl font-serif font-semibold tracking-tight mt-1 text-[#FFFFFF]">Opportunity Finder™</h1>
          <p className="text-[#9CA3AF] text-xs mt-1 flex items-center gap-1.5 font-normal">
            <span className="text-[#A1A1AA] font-normal uppercase tracking-wider text-[10px] font-mono">Powered by LocalRadar Intelligence Engine™</span>
            <span className="text-[#71717A]">•</span>
            <span>Real-time local lead auditing and transaction valuation terminal.</span>
          </p>
        </div>
        
        {/* Saved Searches / Counters top metadata */}
        <div className="flex items-center gap-4 text-xs font-mono font-normal">
          <div className="bg-[#141517] border border-[#26282D] px-3 py-1.5 rounded-lg">
            <span className="text-[#A1A1AA]">Saved Opportunities:</span>{' '}
            <span className="text-white font-semibold">{savedLeadsList.length}</span>
          </div>
          <div className="bg-[#141517] border border-[#26282D] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <LineChart className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span className="text-[#A1A1AA]">Trend:</span>{' '}
            <span className="text-white font-semibold">Optimal Target</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Compact Search Experience */}
      <div className="bg-[#141517] border border-[#26282D] p-6 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FAFAF9]/10 to-transparent" />
        
        <form onSubmit={(e) => handleSearch(e)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end font-sans">
          <div className="space-y-2">
            <label className="text-[10px] font-normal text-[#A1A1AA] uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Compass className="w-3.5 h-3.5 text-[#A1A1AA]" />
              Niche / Industry
            </label>
            <input
              type="text"
              placeholder="e.g. Dentists, Gyms, Roofers"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-3 px-4 text-[#FFFFFF] placeholder-[#71717A]/60 text-xs focus:outline-none focus:border-[#FAFAF9] focus:ring-1 focus:ring-[#FAFAF9] transition-all font-mono font-normal"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-normal text-[#A1A1AA] uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5 text-[#A1A1AA]" />
              Target City
            </label>
            <input
              type="text"
              placeholder="e.g. Dallas, TX or Austin"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-3 px-4 text-[#FFFFFF] placeholder-[#71717A]/60 text-xs focus:outline-none focus:border-[#FAFAF9] focus:ring-1 focus:ring-[#FAFAF9] transition-all font-mono font-normal"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-normal text-[#A1A1AA] uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Globe className="w-3.5 h-3.5 text-[#A1A1AA]" />
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-3 px-4 text-[#FFFFFF] text-xs focus:outline-none focus:border-[#FAFAF9] transition-all font-mono cursor-pointer font-normal"
            >
              <option value="United States">United States</option>
              <option value="India">India</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2DD4A7] to-[#14B88C] hover:opacity-95 disabled:opacity-50 text-[#0B0B0C] font-semibold text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(45,212,167,0.15)] flex items-center justify-center gap-2 cursor-pointer h-[44px] uppercase tracking-wider font-mono"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0B0B0C]" />
                Scanning Market...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#0B0B0C]" />
                Find Opportunities
              </>
            )}
          </button>
        </form>

        {/* Recent Searches, Saved Searches & Popular Niches */}
        <div className="mt-4 pt-4 border-t border-[#26282D] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-normal">
          {recentSearches.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#A1A1AA] font-mono flex items-center gap-1">
                <History className="w-3 h-3 text-[#A1A1AA]" />
                Recent:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSearch(undefined, search.niche, search.city, search.country)}
                    className="bg-[#0B0B0C] border border-[#26282D] px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-300 hover:text-white hover:border-white transition-all cursor-pointer"
                  >
                    🔍 {search.niche} ({search.city})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#A1A1AA] font-mono flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-[#A1A1AA]" />
                Popular:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Gyms', 'Salons', 'Plumbers'].map((recNiche) => (
                  <button
                    key={recNiche}
                    onClick={() => executePopularNiche(recNiche)}
                    className="bg-[#0B0B0C] border border-[#26282D] px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-300 hover:text-white hover:border-white transition-all cursor-pointer"
                  >
                    🔍 {recNiche}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Niches Link */}
          <div className="flex items-center gap-2 flex-wrap md:justify-end">
            <span className="text-[#A1A1AA] font-mono flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-[#A1A1AA]" />
              Popular Niches:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularNiches.map((nicheName) => (
                <button
                  key={nicheName}
                  type="button"
                  onClick={() => executePopularNiche(nicheName)}
                  className="bg-[#0B0B0C] border border-[#26282D] px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-300 hover:text-white hover:border-white transition-all cursor-pointer"
                >
                  {nicheName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OPPORTUNITY SCANNING SKELETON */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-[#141517] border border-[#26282D] p-8 rounded-2xl relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FAFAF9]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="flex flex-col items-center justify-center space-y-4 text-center lg:border-r lg:border-[#26282D] lg:pr-8">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-[#26282D] rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#FAFAF9] border-t-transparent rounded-full animate-spin"></div>
                  <Search className="w-8 h-8 text-[#FAFAF9] animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white text-base font-bold font-serif">Deep Opportunity Scanning</h3>
                  <p className="text-[#A1A1AA] text-[11px] mt-1 font-mono">Resolving Places APIs & SEO indices...</p>
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
                      animate={{ opacity: isActive ? 1 : isPassed ? 0.75 : 0.2 }}
                      className="flex items-center gap-3 text-xs font-mono"
                    >
                      {isPassed ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-[#2DD4A7]/10 text-[#2DD4A7] border border-[#2DD4A7]/30 flex items-center justify-center text-[9px] font-bold">✓</div>
                      ) : isActive ? (
                        <Loader2 className="w-4.5 h-4.5 text-[#2DD4A7] animate-spin" />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full border border-[#26282D] bg-[#0B0B0C]"></div>
                      )}
                      <span className={`${isPassed ? 'text-[#71717A] line-through' : isActive ? 'text-[#FFFFFF] font-bold' : 'text-[#71717A]'}`}>
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

      {/* SECTION 2: Revenue Intelligence Overview (KPI Trading Dashboard style) */}
      {searched && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { 
              label: 'Potential Revenue', 
              val: formatLakhs(stats.pipeline), 
              desc: 'Generated by Revenue Potential™', 
              accent: 'text-[#2DD4A7]',
              color: '#2DD4A7',
              pill: 'REVENUE'
            },
            { 
              label: 'High Probability Clients', 
              val: `${stats.highProbCount}`, 
              desc: 'Ranked by Closing Probability™', 
              accent: 'text-[#FAFAF9]',
              color: '#FAFAF9',
              pill: 'PROBABLE'
            },
            { 
              label: 'High Opportunity Clients', 
              val: `${stats.highOppCount}`, 
              desc: 'Ranked by Opportunity Engine™', 
              accent: 'text-[#F5A623]',
              color: '#F5A623',
              pill: 'ATTENTION'
            },
            { 
              label: 'Weighted Opportunity', 
              val: formatLakhs(stats.weightedPipeline), 
              desc: 'Generated by LocalRadar Intelligence Engine™', 
              accent: 'text-[#2DD4A7]',
              color: '#2DD4A7',
              pill: 'WEIGHTED'
            },
            { 
              label: 'Avg Closing Probability™', 
              val: `${stats.avgClosing}%`, 
              desc: 'Ranked by Closing Probability™', 
              accent: 'text-[#2DD4A7]',
              color: '#2DD4A7',
              pill: 'ACCURACY'
            }
          ].map((card, idx) => {
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                className="bg-[#141517] border-t-2 border-x border-b border-[#26282D] p-4 rounded-xl transition-all relative group cursor-default"
                style={{ borderTopColor: card.color }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-[#A1A1AA] uppercase tracking-widest font-mono truncate max-w-[80%]">{card.label}</span>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#0B0B0C] text-[#A1A1AA] border border-[#26282D] font-mono">{card.pill}</span>
                </div>
                <div className={`text-2xl font-mono font-extrabold tracking-tight mt-3 ${card.accent}`}>
                  {card.val}
                </div>
                <p className="text-[10px] text-[#71717A] mt-2 font-mono leading-tight border-t border-[#26282D] pt-2 truncate">{card.desc}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* SECTION 3: Priority Opportunity Board (Hero Section) */}
      {searched && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#A1A1AA]" />
                Priority Opportunity Board™
              </h2>
              <p className="text-[11px] text-[#A1A1AA] font-mono">Top opportunities ranked by Opportunity Engine™</p>
            </div>
            <span className="text-[9px] font-bold text-[#A1A1AA] bg-[#0B0B0C] border border-[#26282D] px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              High-Value Targets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topOpportunities.map(({ lead, score, scored, closing }, idx) => {
              const bestFit = scored?.bestFit;
              const topVulnerability = scored ? getVulnerabilityTags(scored)[0] : 'None';
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ y: -4, borderColor: '#26282D' }}
                  className="bg-[#141517] border border-[#26282D] p-4 rounded-xl flex flex-col justify-between relative group transition-all duration-300"
                >
                  {/* Subtle accent line on top hover */}
                  <div 
                    className="absolute top-0 left-0 w-full h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity" 
                    style={{ backgroundColor: score >= 60 ? '#2DD4A7' : score >= 35 ? '#F5A623' : '#FF5C5C' }}
                  />
                  
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-[9px] font-semibold font-mono px-2 py-0.5 rounded ${getScoreBadgeColor(score)}`}>
                        {score} {getScoreLabel(score)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-semibold ${
                          closing >= 70 
                            ? 'text-[#2DD4A7]' 
                            : closing >= 40 
                              ? 'text-[#F5A623]' 
                              : 'text-[#FF5C5C]'
                        }`}>{closing}% Close</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveLead(lead);
                          }}
                          className={`p-1 rounded-md border transition-all cursor-pointer ${
                            savedLeadsList.includes(lead.id)
                              ? 'bg-[#2DD4A7]/10 border-[#2DD4A7]/30 text-[#2DD4A7]'
                              : 'bg-[#0B0B0C] border-[#26282D] text-[#71717A] hover:text-[#FFFFFF] hover:border-[#71717A]'
                          }`}
                          title={savedLeadsList.includes(lead.id) ? 'Remove Lead' : 'Save Lead'}
                        >
                          <Bookmark className={`w-3 h-3 ${savedLeadsList.includes(lead.id) ? 'fill-[#2DD4A7]' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-serif font-semibold text-[#FFFFFF] text-sm mt-4 leading-snug truncate group-hover:text-white transition-colors flex items-center gap-1.5">
                      {lead.name}
                      {hotLeadsMap[lead.id] && <Flame className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623] shrink-0" />}
                    </h3>
                    <p className="text-[10px] text-[#A1A1AA] font-mono mt-1 truncate">{lead.address}</p>

                    {/* Stats */}
                    <div className="mt-4 space-y-2 border-t border-[#26282D] pt-3 text-[11px] font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-[#71717A]">Opportunity Score™</span>
                        <span className="text-white font-semibold text-xs">{score}/100</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#71717A]">Closing Probability™</span>
                        <span className={`font-semibold text-xs ${
                          closing >= 70 
                            ? 'text-[#2DD4A7]' 
                            : closing >= 40 
                              ? 'text-[#F5A623]' 
                              : 'text-[#FF5C5C]'
                        }`}>{closing}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#71717A]">Revenue Potential™</span>
                        <span className="text-[#2DD4A7] font-semibold text-xs">{getDealValue(lead.id)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-[#26282D]/40 pt-1.5 mt-1.5">
                        <span className="text-[#71717A]">Top Reason</span>
                        <span className="text-[#FF5C5C] font-semibold text-[10px] tracking-wide truncate max-w-[110px]" title={getCleanTopReason(lead.id)}>
                          {getCleanTopReason(lead.id)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-[#26282D] space-y-2">
                    <button
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="w-full bg-[#0B0B0C] hover:bg-[#141517] border border-[#26282D] text-[#A1A1AA] hover:text-[#FFFFFF] text-[10px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-mono"
                    >
                      <Info className="w-3.5 h-3.5 text-[#71717A]" />
                      View Intelligence
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/pitch?bizId=${lead.id}`)}
                      className="w-full bg-gradient-to-r from-[#2DD4A7] to-[#14B88C] hover:opacity-95 text-[#0B0B0C] text-[10px] font-extrabold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer font-mono shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 text-[#0B0B0C]" />
                      Generate Pitch
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: Opportunity Intelligence Table */}
      {searched && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#26282D] pb-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#A1A1AA]">
              All Opportunity Diagnostics ({leads.length} Records)
            </h2>
            <div className="text-[10px] text-[#71717A] font-mono">
              Ranked by LocalRadar Intelligence Engine™ • Click any row to reveal full intelligence dossier.
            </div>
          </div>

          <div className="bg-[#141517] border border-[#26282D] rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#26282D] bg-[#0B0B0C]/90 text-[#A1A1AA] text-[11px] font-mono uppercase tracking-widest">
                    <th className="py-5 px-6">Business</th>
                    <th className="py-5 px-6 text-center">Opportunity Score™</th>
                    <th className="py-5 px-6 text-center">Why This Lead™</th>
                    <th className="py-5 px-6 text-center">Service Fit Engine™</th>
                    <th className="py-5 px-6 text-center">Closing Probability™</th>
                    <th className="py-5 px-6 text-center">Revenue Potential™</th>
                    <th className="py-5 px-6">Top Vulnerability</th>
                    <th className="py-5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26282D]">
                  {leads.map((biz) => {
                    const score = getScore(biz.id);
                    const tags = getTags(biz.id);
                    const bestFit = getBestFit(biz.id);

                    return (
                      <motion.tr 
                        key={biz.id}
                        onClick={() => setSelectedLeadId(biz.id)}
                        whileHover={{ backgroundColor: '#0B0B0C' }}
                        className="transition-colors cursor-pointer select-none"
                      >
                        <td className="py-5 px-6 max-w-[220px]">
                          <div className="font-sans font-semibold text-base text-[#FFFFFF] flex items-center gap-1.5">
                            {biz.name}
                            {hotLeadsMap[biz.id] && <Flame className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623] shrink-0" />}
                          </div>
                          <div className="text-xs text-[#71717A] font-mono mt-1 truncate">{biz.address}</div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border font-mono ${getScoreColor(score)}`}>
                              {score} {getScoreLabel(score)}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className="text-xs text-[#FF5C5C] font-semibold font-mono bg-[#FF5C5C]/5 border border-[#FF5C5C]/15 px-2 py-1 rounded">
                            {(() => {
                              const reason = getCleanTopReason(biz.id);
                              if (reason.includes('No Website')) return 'No Website';
                              if (reason.includes('Review Gap')) return 'Review Gap';
                              if (reason.includes('Booking')) return 'Revenue Leak';
                              if (reason.includes('Google') || reason.includes('Presence')) return 'Weak Visibility';
                              return 'Low Reviews';
                            })()}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-center">
                          {bestFit ? (
                            <div className="inline-flex flex-col items-center">
                              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border font-mono ${getFitColor(bestFit.level)}`}>
                                {bestFit.agencyType} {bestFit.score}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#71717A] font-mono">—</span>
                          )}
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className={`text-sm font-mono font-semibold ${
                            getClosing(biz.id) >= 70 
                              ? 'text-[#2DD4A7]' 
                              : getClosing(biz.id) >= 40 
                                ? 'text-[#F5A623]' 
                                : 'text-[#FF5C5C]'
                          }`}>
                            {getClosing(biz.id)}%
                          </span>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className="text-sm font-semibold text-[#2DD4A7] font-mono">
                            {getDealValue(biz.id)}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 2).map((r) => (
                              <span 
                                key={r} 
                                className="text-[10px] text-[#FF5C5C] bg-[#FF5C5C]/5 border border-[#FF5C5C]/15 px-2 py-1 rounded font-mono"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleSaveLead(biz)}
                              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                                savedLeadsList.includes(biz.id)
                                  ? 'bg-[#2DD4A7]/10 border-[#2DD4A7]/30 text-[#2DD4A7] hover:bg-[#2DD4A7]/20'
                                  : 'bg-[#0B0B0C] border-[#26282D] text-[#A1A1AA] hover:text-[#FFFFFF]'
                              }`}
                              title={savedLeadsList.includes(biz.id) ? 'Remove Lead' : 'Save Lead'}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${savedLeadsList.includes(biz.id) ? 'fill-[#2DD4A7]' : ''}`} />
                            </button>
                            
                            <button
                              onClick={() => router.push(`/dashboard/audit/${biz.id}`)}
                              className="bg-[#0B0B0C] hover:bg-[#141517] border border-[#26282D] text-[#A1A1AA] hover:text-[#FFFFFF] text-xs font-semibold px-4 py-2 rounded-lg transition-all font-mono cursor-pointer"
                            >
                              Audit
                            </button>
                            
                            <button
                              onClick={() => router.push(`/dashboard/pitch?bizId=${biz.id}`)}
                              className="bg-gradient-to-r from-[#2DD4A7] to-[#14B88C] hover:opacity-95 text-[#0B0B0C] text-xs font-bold px-4 py-2 rounded-lg transition-all font-mono shadow-sm cursor-pointer"
                            >
                              Pitch
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State / Premium Onboarding */}
      {!searched && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141517] border border-[#26282D] p-12 text-center max-w-xl mx-auto rounded-3xl relative overflow-hidden shadow-2xl mt-12"
        >
          {/* Subtle glow ring */}
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#FAFAF9]/2 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#FAFAF9]/2 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-[#0B0B0C] border border-[#26282D] flex items-center justify-center mx-auto mb-6 text-white">
            <Target className="w-6 h-6 animate-pulse" />
          </div>
          
          <h2 className="text-[#FFFFFF] text-2xl font-serif font-extrabold tracking-tight">
            Find businesses that need your services.
          </h2>
          <p className="text-[#A1A1AA] text-xs mt-2 max-w-sm mx-auto font-mono">
            Search any niche and instantly discover high-probability opportunities losing revenue online.
          </p>

          {/* Quick-action helper niches */}
          <div className="mt-8 pt-6 border-t border-[#26282D] space-y-4">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#71717A]">
              Popular Agency Target Profiles
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {popularNiches.map((nicheName) => (
                <button
                  key={nicheName}
                  onClick={() => executePopularNiche(nicheName)}
                  className="bg-[#0B0B0C] border border-[#26282D] text-xs text-[#A1A1AA] px-4 py-2 rounded-xl hover:text-white hover:border-white transition-all cursor-pointer font-mono"
                >
                  🚀 {nicheName}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* SLIDE-OVER INTELLIGENCE PANEL (Slide-over drawer) */}
      {selectedLead && selectedScored && (
        <OpportunityIntelligenceDrawer
          isOpen={!!selectedLeadId && !!selectedLead && !!selectedScored}
          onClose={() => {
            setSelectedLeadId(null);
            refreshHotLeadsMap();
          }}
          business={selectedLead}
          scored={selectedScored}
          isSaved={savedLeadsList.includes(selectedLead.id)}
          onToggleSave={(biz) => toggleSaveLead(biz)}
          onOpenPitch={(bizId) => {
            setSelectedLeadId(null);
            router.push(`/dashboard/pitch?bizId=${bizId}`);
          }}
          onOpenAudit={(bizId) => {
            setSelectedLeadId(null);
            router.push(`/dashboard/audit/${bizId}`);
          }}
          categoryName={niche || 'Agency Lead'}
        />
      )}

    </div>
  );
}
