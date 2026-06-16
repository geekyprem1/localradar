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
  Send
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

  const loadingStages = [
    'Connecting to Google Business API...',
    'Scanning local map listings...',
    'Extracting business metadata & website domains...',
    'Analyzing website SEO and mobile optimization...',
    'Evaluating reputation strength & review velocities...',
    'Calculating LocalRadar closing opportunities...'
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
      }, 1000);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load last searches on mount
  useEffect(() => {
    const cachedLeads = localStorage.getItem('localradar_latest_leads');
    const cachedOpps = localStorage.getItem('localradar_latest_opps');
    if (cachedLeads && cachedOpps) {
      setLeads(JSON.parse(cachedLeads));
      setOpportunities(JSON.parse(cachedOpps));
      setSearched(true);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !city) return;

    setLoading(true);
    setSearched(false);

    // Simulate search duration
    setTimeout(() => {
      const { businesses, opportunities: opps } = generateLeads(niche, city, country);
      
      setLeads(businesses);
      setOpportunities(opps);
      
      // Cache in localStorage for cross-page usage
      localStorage.setItem('localradar_latest_leads', JSON.stringify(businesses));
      localStorage.setItem('localradar_latest_opps', JSON.stringify(opps));
      
      setLoading(false);
      setSearched(true);
    }, 6000);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score <= 50) return 'text-red-400 bg-red-500/10 border-red-500/20'; // High Opportunity (Red)
    if (score <= 75) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'; // Medium Opportunity
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; // Low Opportunity
  };

  const getOpportunityLabel = (score: number) => {
    if (score <= 50) return 'High';
    if (score <= 75) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Lead Finder</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Search for local businesses in any niche and discover critical conversion vulnerabilities.
        </p>
      </div>

      {/* Search Bar Panel */}
      <div className="glass-panel p-6 shadow-[0_0_30px_rgba(255,45,45,0.02)]">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-[#FF2D2D]" />
              Business Type / Niche
            </label>
            <input
              type="text"
              placeholder="e.g. Dentists, Plumbers, Roofer"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-3 px-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FF2D2D] focus:ring-1 focus:ring-[#FF2D2D] transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF2D2D]" />
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Dallas, Austin, Chicago"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl py-3 px-4 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FF2D2D] focus:ring-1 focus:ring-[#FF2D2D] transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-[#FF2D2D]" />
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-[#050505] border border-white/[0.08] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#FF2D2D] focus:ring-1 focus:ring-[#FF2D2D] transition-all"
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF2D2D] hover:bg-[#e62222] disabled:bg-[#FF2D2D]/50 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(255,45,45,0.25)] flex items-center justify-center gap-2 cursor-pointer h-[46px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                Find Leads
              </>
            )}
          </button>
        </form>
      </div>

      {/* Scanning loading state animation */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-8 text-center space-y-6"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-[#FF2D2D]/15 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#FF2D2D] border-t-transparent rounded-full animate-spin"></div>
                <Search className="w-6 h-6 text-[#FF2D2D] animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-white text-sm font-semibold">Running Opportunity Scan</h3>
                <p className="text-zinc-500 text-xs">This takes about 5-8 seconds as we scan search indexes.</p>
              </div>
            </div>

            {/* Scanning stages checklist */}
            <div className="max-w-md mx-auto bg-black/20 rounded-xl p-4 border border-white/[0.04] text-left space-y-2.5">
              {loadingStages.map((stage, idx) => {
                const isPassed = loadingStage > idx;
                const isActive = loadingStage === idx;
                return (
                  <div key={stage} className="flex items-center gap-3 text-xs">
                    {isPassed ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[9px]">✓</span>
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#FF2D2D] animate-spin" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-white/10 bg-white/[0.01]"></span>
                    )}
                    <span className={isPassed ? 'text-zinc-500 line-through' : isActive ? 'text-[#FF2D2D] font-semibold' : 'text-zinc-500'}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results View */}
      {searched && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel overflow-hidden border border-white/[0.08]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.01]">
                  <th className="p-4 text-xs font-semibold text-zinc-400">Business Name</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400">Website</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400">Rating / Reviews</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400">Phone</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-center">LocalRadar Score</th>
                  <th className="p-4 text-xs font-semibold text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {leads.map((biz) => {
                  const opp = opportunities[biz.id];
                  const score = opp?.total_score || 0;
                  return (
                    <tr key={biz.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-sm text-white truncate max-w-[200px]">{biz.name}</div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[200px]">{biz.address}</div>
                      </td>
                      <td className="p-4">
                        {biz.website ? (
                          <a
                            href={biz.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#FF2D2D] hover:underline flex items-center gap-1 max-w-[150px] truncate"
                          >
                            <Globe className="w-3.5 h-3.5 text-zinc-500" />
                            {biz.website.replace('https://www.', '')}
                          </a>
                        ) : (
                          <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full font-medium">
                            No Website
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-xs text-white">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{biz.rating}</span>
                          <span className="text-zinc-500">({biz.reviews_count} reviews)</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          {biz.phone || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${getScoreBadgeColor(score)}`}>
                            {score} / 100
                          </span>
                          <span className="text-[9px] text-zinc-500 mt-1 capitalize">{getOpportunityLabel(score)} Opportunity</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/audit/${biz.id}`)}
                            className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                            Audit
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/pitch?bizId=${biz.id}`)}
                            className="bg-[#FF2D2D] hover:bg-[#e62222] text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-white" />
                            Pitch
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!searched && !loading && (
        <div className="glass-panel p-12 text-center max-w-lg mx-auto border border-dashed border-white/[0.08]">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <Search className="w-5 h-5 text-[#FF2D2D]" />
          </div>
          <h3 className="text-white text-sm font-semibold">Start Scanning Local Leads</h3>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">
            Input a business type (like "Roofer" or "Dentist") and a city name to scan opportunities in seconds.
          </p>
        </div>
      )}
    </div>
  );
}
