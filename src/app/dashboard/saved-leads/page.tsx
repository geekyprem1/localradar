'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bookmark, 
  FileText, 
  Send, 
  Trash2, 
  Globe, 
  Star, 
  Phone, 
  MapPin, 
  Sparkles,
  AlertTriangle,
  Layers,
  Target,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { Business, Opportunity } from '@/types';
import { scoreBusinessOpportunity, getVulnerabilityTags } from '@/lib/scoring';
import { generateMockCompetitors } from '@/lib/mockData';
import { ScoredOpportunity } from '@/types/scoring';

export default function SavedLeadsPage() {
  const router = useRouter();
  const [savedLeads, setSavedLeads] = useState<Business[]>([]);
  const [opportunities, setOpportunities] = useState<Record<string, Opportunity>>({});
  const [scoredMap, setScoredMap] = useState<Record<string, ScoredOpportunity>>({});

  useEffect(() => {
    const cachedLeads = localStorage.getItem('localradar_saved_leads');
    const cachedOpps = localStorage.getItem('localradar_saved_opps');
    
    if (cachedLeads) {
      setSavedLeads(JSON.parse(cachedLeads));
    }
    if (cachedOpps) {
      setOpportunities(JSON.parse(cachedOpps));
    }
  }, []);

  // Compute Intelligence Engine scores
  useEffect(() => {
    if (savedLeads.length === 0) return;
    const map: Record<string, ScoredOpportunity> = {};
    savedLeads.forEach(biz => {
      const competitors = generateMockCompetitors(biz);
      map[biz.id] = scoreBusinessOpportunity(biz, competitors);
    });
    setScoredMap(map);
  }, [savedLeads]);

  const handleRemoveLead = (bizId: string) => {
    const updatedLeads = savedLeads.filter(b => b.id !== bizId);
    
    const updatedOpps = { ...opportunities };
    delete updatedOpps[bizId];

    setSavedLeads(updatedLeads);
    setOpportunities(updatedOpps);

    localStorage.setItem('localradar_saved_leads', JSON.stringify(updatedLeads));
    localStorage.setItem('localradar_saved_opps', JSON.stringify(updatedOpps));
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 60) return 'text-[#E54D80] bg-[#E54D80]/10 border-[#E54D80]/20';
    if (score >= 35) return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
  };

  const getOpportunityLabel = (score: number) => {
    if (score >= 60) return 'High';
    if (score >= 35) return 'Medium';
    return 'Low';
  };

  const getFitColor = (level: string) => {
    if (level === 'Perfect Fit') return 'text-[#E54D80] bg-[#E54D80]/10 border-[#E54D80]/20';
    if (level === 'Strong Fit') return 'text-violet-600 bg-violet-500/10 border-violet-500/20';
    if (level === 'Moderate Fit') return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    return 'text-zinc-500 bg-zinc-100 border-zinc-200';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-[#0F0F11] pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#0F0F11] flex items-center gap-2">
          Saved Leads
          <Bookmark className="w-5 h-5 text-[#E54D80] fill-[#E54D80]" />
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Review and access your persistently bookmarked prospects across searches.
        </p>
      </div>

      {savedLeads.length > 0 ? (
        <div className="bg-white border border-[#E5E5E8] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E8] bg-[#F9F9FB] text-zinc-500 text-[9px] font-mono uppercase tracking-wider">
                  <th className="p-4">Business Name</th>
                  <th className="p-4">Website</th>
                  <th className="p-4">Rating / Reviews</th>
                  <th className="p-4 text-center">Opportunity Score™</th>
                  <th className="p-4 text-center">Service Fit™</th>
                  <th className="p-4 text-center">Deal Value</th>
                  <th className="p-4 text-center">Closing %</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E8]">
                {savedLeads.map((biz) => {
                  const scored = scoredMap[biz.id];
                  const score = scored?.opportunityScore ?? 0;
                  const bestFit = scored?.bestFit;
                  return (
                    <tr key={biz.id} className="hover:bg-zinc-50 transition-colors text-[#0F0F11]">
                      <td className="p-4">
                        <div className="font-serif font-extrabold text-sm text-[#0F0F11] truncate max-w-[200px]">{biz.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[200px] mt-0.5 font-mono">{biz.address}</div>
                      </td>
                      <td className="p-4">
                        {biz.website ? (
                           <a
                            href={biz.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#E54D80] hover:underline flex items-center gap-1 max-w-[150px] truncate font-mono"
                          >
                            <Globe className="w-3.5 h-3.5 text-zinc-400" />
                            {biz.website.replace('https://www.', '')}
                          </a>
                        ) : (
                          <span className="text-[10px] text-[#E54D80] bg-[#E54D80]/10 border border-[#E54D80]/20 px-2.5 py-0.5 rounded-full font-bold font-mono">
                            No Website
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-xs text-[#0F0F11]">
                          <Star className="w-3.5 h-3.5 text-[#FACC15] fill-[#FACC15]" />
                          <span>{biz.rating}</span>
                          <span className="text-zinc-400 font-mono">({biz.reviews_count} reviews)</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border font-mono ${getScoreBadgeColor(score)}`}>
                            {score} / 100
                          </span>
                          <span className="text-[9px] text-zinc-400 mt-1 capitalize font-mono">{getOpportunityLabel(score)} Opportunity</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {bestFit ? (
                          <div className="inline-flex flex-col items-center">
                            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono ${getFitColor(bestFit.level)}`}>
                              {bestFit.agencyType}
                            </span>
                            <span className="text-[8px] text-zinc-400 font-mono mt-1">{bestFit.level}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-mono">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-[#059669] font-mono">
                          {scored?.dealValue.formatted ?? '—'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-xs font-bold font-mono ${(scored?.closingProbability ?? 0) >= 60 ? 'text-[#E54D80]' : (scored?.closingProbability ?? 0) >= 30 ? 'text-amber-600' : 'text-zinc-500'}`}>
                          {scored?.closingProbability ?? 0}%
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRemoveLead(biz.id)}
                            className="p-2 rounded-xl border border-[#E5E5E8] bg-[#F4F4F6] text-zinc-500 hover:text-[#E54D80] hover:bg-[#E54D80]/10 hover:border-[#E54D80]/20 transition-all cursor-pointer"
                            title="Remove Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/audit/${biz.id}`)}
                            className="bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-[#0F0F11] text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-mono"
                          >
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                            Audit
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/pitch?bizId=${biz.id}`)}
                            className="bg-[#E54D80] hover:bg-[#FF5E8C] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
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
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#E5E5E8] p-12 text-center max-w-lg mx-auto rounded-3xl shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#F4F4F6] border border-[#E5E5E8] flex items-center justify-center mx-auto mb-4 text-[#E54D80]">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-[#0F0F11] text-sm font-bold font-serif">No Saved Leads Yet</h3>
          <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto font-mono">
            Bookmarked leads from your searches will appear here. Go to Lead Finder and click the bookmark button next to any lead to save it.
          </p>
        </div>
      )}
    </div>
  );
}
