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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !city) return;

    setLoading(true);
    setSearched(false);

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
      console.warn('Live search failed or key is not set, falling back to sandbox simulator:', err);
    }

    // Graceful fallback to sandbox lead generator
    setTimeout(() => {
      const { businesses, opportunities: opps } = generateLeads(niche, city, country);
      
      setLeads(businesses);
      setOpportunities(opps);
      
      // Cache in localStorage for cross-page usage
      localStorage.setItem('localradar_latest_leads', JSON.stringify(businesses));
      localStorage.setItem('localradar_latest_opps', JSON.stringify(opps));
      
      setLoading(false);
      setSearched(true);
    }, 4000);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score <= 50) return 'text-[#E54D80] bg-[#E54D80]/10 border-[#E54D80]/20'; // High Opportunity (Red/Pink)
    if (score <= 75) return 'text-amber-600 bg-amber-500/10 border-amber-500/20'; // Medium Opportunity
    return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'; // Low Opportunity
  };

  const getOpportunityLabel = (score: number) => {
    if (score <= 50) return 'High';
    if (score <= 75) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0F0F11]">Lead Finder</h1>
        <p className="text-zinc-500 text-xs mt-1">
          Search for local businesses in any niche and discover critical conversion vulnerabilities.
        </p>
      </div>

      {/* Search Bar Panel */}
      <div className="bg-white border border-[#E5E5E8] p-6 rounded-2xl shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1 font-mono">
              <Search className="w-3.5 h-3.5 text-[#E54D80]" />
              Business Type / Niche
            </label>
            <input
              type="text"
              placeholder="e.g. Dentists, Plumbers, Roofer"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-[#F4F4F6] border border-[#E5E5E8] rounded-xl py-3 px-4 text-[#0F0F11] placeholder-zinc-400 text-sm focus:outline-none focus:border-[#E54D80] focus:ring-1 focus:ring-[#E54D80] transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1 font-mono">
              <MapPin className="w-3.5 h-3.5 text-[#E54D80]" />
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Dallas, Austin, Chicago"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#F4F4F6] border border-[#E5E5E8] rounded-xl py-3 px-4 text-[#0F0F11] placeholder-zinc-400 text-sm focus:outline-none focus:border-[#E54D80] focus:ring-1 focus:ring-[#E54D80] transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1 font-mono">
              <Globe className="w-3.5 h-3.5 text-[#E54D80]" />
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-[#F4F4F6] border border-[#E5E5E8] rounded-xl py-3 px-4 text-[#0F0F11] text-sm focus:outline-none focus:border-[#E54D80] focus:ring-1 focus:ring-[#E54D80] transition-all"
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
            className="w-full bg-[#E54D80] hover:bg-[#FF5E8C] disabled:bg-[#E54D80]/50 text-white font-bold text-sm py-3 rounded-full transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer h-[46px]"
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
            className="bg-white border border-[#E5E5E8] p-8 rounded-3xl text-center space-y-6 shadow-sm"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-[#E54D80]/15 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#E54D80] border-t-transparent rounded-full animate-spin"></div>
                <Search className="w-6 h-6 text-[#E54D80] animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[#0F0F11] text-sm font-bold">Running Opportunity Scan</h3>
                <p className="text-zinc-500 text-xs">This takes about 5-8 seconds as we scan search indexes.</p>
              </div>
            </div>

            {/* Scanning stages checklist */}
            <div className="max-w-md mx-auto bg-[#F9F9FB] rounded-2xl p-4 border border-[#E5E5E8] text-left space-y-2.5 shadow-sm">
              {loadingStages.map((stage, idx) => {
                const isPassed = loadingStage > idx;
                const isActive = loadingStage === idx;
                return (
                  <div key={stage} className="flex items-center gap-3 text-xs font-mono">
                    {isPassed ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center justify-center font-bold text-[9px]">✓</span>
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#E54D80] animate-spin" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-[#E5E5E8] bg-white"></span>
                    )}
                    <span className={isPassed ? 'text-zinc-400 line-through' : isActive ? 'text-[#E54D80] font-bold' : 'text-zinc-400'}>
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
          className="bg-white border border-[#E5E5E8] rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E8] bg-[#F9F9FB] text-zinc-500">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-mono">Business Name</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-mono">Website</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-mono">Rating / Reviews</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-mono">Phone</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-mono text-center">LocalRadar Score</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-mono text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E8]">
                {leads.map((biz) => {
                  const opp = opportunities[biz.id];
                  const score = opp?.total_score || 0;
                  return (
                    <tr key={biz.id} className="hover:bg-zinc-50 transition-colors text-[#0F0F11]">
                      <td className="p-4">
                        <div className="font-semibold text-sm text-[#0F0F11] truncate max-w-[200px]">{biz.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[200px] mt-0.5 font-mono">{biz.address}</div>
                      </td>
                      <td className="p-4">
                        {biz.website ? (
                          <a
                            href={biz.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#E54D80] hover:underline flex items-center gap-1 max-w-[150px] truncate"
                          >
                            <Globe className="w-3.5 h-3.5 text-zinc-400" />
                            {biz.website.replace('https://www.', '')}
                          </a>
                        ) : (
                          <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full font-bold font-mono">
                            No Website
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-xs text-[#0F0F11]">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{biz.rating}</span>
                          <span className="text-zinc-400 font-mono">({biz.reviews_count} reviews)</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-zinc-400" />
                          {biz.phone || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border font-mono ${getScoreBadgeColor(score)}`}>
                            {score} / 100
                          </span>
                          <span className="text-[9px] text-zinc-400 mt-1 capitalize font-mono">{getOpportunityLabel(score)} Opportunity</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/audit/${biz.id}`)}
                            className="bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-[#0F0F11] text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-zinc-500" />
                            Audit
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/pitch?bizId=${biz.id}`)}
                            className="bg-[#E54D80] hover:bg-[#FF5E8C] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
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
        <div className="bg-white border border-dashed border-[#E5E5E8] p-12 text-center max-w-lg mx-auto rounded-3xl shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#F4F4F6] border border-[#E5E5E8] flex items-center justify-center mx-auto mb-4 text-[#E54D80]">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-[#0F0F11] text-sm font-bold">Start Scanning Local Leads</h3>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">
            Input a business type (like "Roofer" or "Dentist") and a city name to scan opportunities in seconds.
          </p>
        </div>
      )}
    </div>
  );
}
