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
  TrendingUp,
  Zap,
  Flame
} from 'lucide-react';
import { Business, Opportunity } from '@/types';
import { scoreBusinessOpportunity, getVulnerabilityTags } from '@/lib/scoring';
import { generateMockCompetitors } from '@/lib/mockData';
import { ScoredOpportunity } from '@/types/scoring';
import OpportunityIntelligenceDrawer from '@/components/OpportunityIntelligenceDrawer';

export default function SavedLeadsPage() {
  const router = useRouter();
  const [savedLeads, setSavedLeads] = useState<Business[]>([]);
  const [opportunities, setOpportunities] = useState<Record<string, Opportunity>>({});
  const [scoredMap, setScoredMap] = useState<Record<string, ScoredOpportunity>>({});
  const [country, setCountry] = useState('United States');
  
  // Drawer state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [hotLeadsMap, setHotLeadsMap] = useState<Record<string, boolean>>({});

  const refreshHotLeadsMap = (leadsList = savedLeads) => {
    const hotMap: Record<string, boolean> = {};
    leadsList.forEach(biz => {
      hotMap[biz.id] = localStorage.getItem(`localradar_hot_${biz.id}`) === 'true';
    });
    setHotLeadsMap(hotMap);
  };

  useEffect(() => {
    const cachedLeads = localStorage.getItem('localradar_saved_leads');
    const cachedOpps = localStorage.getItem('localradar_saved_opps');
    const cachedCountry = localStorage.getItem('localradar_latest_country');
    if (cachedCountry) setCountry(cachedCountry);
    
    let parsedLeads: Business[] = [];
    if (cachedLeads) {
      parsedLeads = JSON.parse(cachedLeads);
      setSavedLeads(parsedLeads);
    }
    if (cachedOpps) {
      setOpportunities(JSON.parse(cachedOpps));
    }

    refreshHotLeadsMap(parsedLeads);
  }, []);

  // Compute Intelligence Engine scores
  useEffect(() => {
    if (savedLeads.length === 0) return;
    const map: Record<string, ScoredOpportunity> = {};
    savedLeads.forEach(biz => {
      const competitors = generateMockCompetitors(biz);
      map[biz.id] = scoreBusinessOpportunity(biz, competitors, undefined, country);
    });
    setScoredMap(map);
  }, [savedLeads, country]);

  const handleRemoveLead = (bizId: string) => {
    const updatedLeads = savedLeads.filter(b => b.id !== bizId);
    
    const updatedOpps = { ...opportunities };
    delete updatedOpps[bizId];

    setSavedLeads(updatedLeads);
    setOpportunities(updatedOpps);

    localStorage.setItem('localradar_saved_leads', JSON.stringify(updatedLeads));
    localStorage.setItem('localradar_saved_opps', JSON.stringify(updatedOpps));
    
    refreshHotLeadsMap(updatedLeads);
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-primary border-primary/25 bg-primary/10';
    if (score >= 35) return 'text-[#F5A623] border-[#F5A623]/20 bg-[#F5A623]/10';
    return 'text-[#FF5C5C] border-[#FF5C5C]/20 bg-[#FF5C5C]/10';
  };

  const getOpportunityLabel = (score: number) => {
    if (score >= 60) return 'HIGH';
    if (score >= 35) return 'MEDIUM';
    return 'LOW';
  };

  const getFitColor = (level: string) => {
    if (level === 'Perfect Fit') return 'text-foreground bg-border border-border';
    if (level === 'Strong Fit') return 'text-secondary-text bg-secondary-bg border-border';
    if (level === 'Moderate Fit') return 'text-muted-text bg-transparent border-border/60';
    return 'text-muted-text bg-transparent border-border/40';
  };

  const getCleanTopReason = (scored: any) => {
    if (!scored) return '✓ Strong Target';
    const reasons = scored.reasons || [];
    
    const noWebsite = reasons.some((r: string) => r.toLowerCase().includes('no website'));
    if (noWebsite) return '✓ No Website';
    
    const reviewGap = reasons.find((r: string) => r.toLowerCase().includes('reviews') && r.toLowerCase().includes('below'));
    if (reviewGap) {
      const match = reviewGap.match(/\d+/);
      if (match) {
        return `✓ Review Gap ${match[0]}+`;
      }
      return '✓ Review Gap';
    }

    const noBooking = reasons.some((r: string) => r.toLowerCase().includes('booking') || r.toLowerCase().includes('appointment'));
    if (noBooking) return '✓ No Booking Flow';

    const gbpWeakness = reasons.some((r: string) => r.toLowerCase().includes('gbp') || r.toLowerCase().includes('google business') || r.toLowerCase().includes('phone'));
    if (gbpWeakness) return '✓ Weak Google Presence';

    return '✓ Verified Gaps';
  };

  const getTableWhyThisLead = (scored: any) => {
    const reason = getCleanTopReason(scored);
    if (reason.includes('No Website')) return 'No Website';
    if (reason.includes('Review Gap')) return 'Review Gap';
    if (reason.includes('Booking')) return 'Revenue Leak';
    if (reason.includes('Google') || reason.includes('Presence')) return 'Weak Visibility';
    return 'Low Reviews';
  };

  const selectedLead = savedLeads.find(l => l.id === selectedLeadId);
  const selectedScored = selectedLead ? scoredMap[selectedLead.id] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-foreground pb-16">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          Saved Opportunities
          <Bookmark className="w-5 h-5 text-foreground" />
        </h1>
        <p className="text-secondary-text text-xs mt-1 font-mono">
          Review and access your persistently bookmarked prospects across searches.
        </p>
      </div>

      {savedLeads.length > 0 ? (
        <div className="bg-secondary-bg border border-border rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/90 text-secondary-text text-2xs font-mono uppercase tracking-widest">
                  <th className="py-5 px-6">Business Name</th>
                  <th className="py-5 px-6">Website</th>
                  <th className="py-5 px-6">Rating / Reviews</th>
                  <th className="py-5 px-6 text-center">Opportunity Score™</th>
                  <th className="py-5 px-6 text-center">Why This Lead™</th>
                  <th className="py-5 px-6 text-center">Service Fit Engine™</th>
                  <th className="py-5 px-6 text-center">Closing Probability™</th>
                  <th className="py-5 px-6 text-center">Revenue Potential™</th>
                  <th className="py-5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {savedLeads.map((biz) => {
                  const scored = scoredMap[biz.id];
                  const score = scored?.opportunityScore ?? 0;
                  const bestFit = scored?.bestFit;
                  return (
                    <tr 
                      key={biz.id} 
                      onClick={() => setSelectedLeadId(biz.id)}
                      className="hover:bg-background transition-colors text-foreground cursor-pointer select-none"
                    >
                      <td className="py-5 px-6">
                        <div className="font-sans font-semibold text-base text-foreground flex items-center gap-1.5 truncate max-w-[200px]">
                          {biz.name}
                          {hotLeadsMap[biz.id] && <Flame className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623] shrink-0" />}
                        </div>
                        <div className="text-xs text-muted-text truncate max-w-[200px] mt-1 font-mono">{biz.address}</div>
                      </td>
                      <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                        {biz.website ? (
                           <a
                            href={biz.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-300 hover:text-foreground hover:underline flex items-center gap-1 max-w-[150px] truncate font-mono"
                          >
                            <Globe className="w-3.5 h-3.5 text-secondary-text" />
                            {biz.website.replace('https://www.', '')}
                          </a>
                        ) : (
                          <span className="text-2xs text-[#FF5C5C] bg-[#FF5C5C]/10 border border-[#FF5C5C]/20 px-2.5 py-0.5 rounded-full font-normal font-mono">
                            No Website
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-1 text-xs text-foreground">
                          <Star className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" />
                          <span>{biz.rating}</span>
                          <span className="text-secondary-text font-mono">({biz.reviews_count} reviews)</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border font-mono ${getScoreColor(score)}`}>
                            {score} {getOpportunityLabel(score)}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className="text-xs text-[#FF5C5C] font-semibold font-mono bg-[#FF5C5C]/5 border border-[#FF5C5C]/15 px-2 py-1 rounded">
                          {getTableWhyThisLead(scored)}
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
                          <span className="text-xs text-muted-text font-mono">—</span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className={`text-sm font-semibold font-mono ${
                          (scored?.closingProbability ?? 0) >= 70 
                            ? 'text-primary' 
                            : (scored?.closingProbability ?? 0) >= 40 
                              ? 'text-[#F5A623]' 
                              : 'text-[#FF5C5C]'
                        }`}>
                          {scored?.closingProbability ?? 0}%
                        </span>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className="text-sm font-semibold text-primary font-mono">
                          {scored?.dealValue.formatted ?? '—'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRemoveLead(biz.id)}
                            className="p-2 rounded-lg border border-border bg-background text-secondary-text hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/10 hover:border-[#FF5C5C]/20 transition-all cursor-pointer"
                            title="Remove Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/audit/${biz.id}`)}
                            className="bg-background hover:bg-secondary-bg border border-border text-secondary-text hover:text-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-mono"
                          >
                            <FileText className="w-3.5 h-3.5 text-zinc-500" />
                            Audit
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/pitch?bizId=${biz.id}`)}
                            className="bg-gradient-to-r from-primary to-[#14B88C] hover:opacity-95 text-on-primary text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
                          >
                            <Send className="w-3.5 h-3.5 text-on-primary" />
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
        <div className="bg-secondary-bg border border-border p-12 text-center max-w-lg mx-auto rounded-3xl shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mx-auto mb-4 text-secondary-text">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-foreground text-sm font-semibold">No Saved Opportunities Yet</h3>
          <p className="text-secondary-text text-xs mt-1 max-w-sm mx-auto font-mono">
            Bookmarked prospects from your searches will appear here. Go to the Opportunity Finder and bookmark any record to save.
          </p>
        </div>
      )}

      {/* Slide-over Intelligence Drawer */}
      {selectedLead && selectedScored && (
        <OpportunityIntelligenceDrawer
          isOpen={!!selectedLeadId && !!selectedLead && !!selectedScored}
          onClose={() => {
            setSelectedLeadId(null);
            refreshHotLeadsMap();
          }}
          business={selectedLead}
          scored={selectedScored}
          isSaved={true}
          onToggleSave={(biz) => handleRemoveLead(biz.id)}
          onOpenPitch={(bizId) => {
            setSelectedLeadId(null);
            router.push(`/dashboard/pitch?bizId=${bizId}`);
          }}
          onOpenAudit={(bizId) => {
            setSelectedLeadId(null);
            router.push(`/dashboard/audit/${bizId}`);
          }}
          categoryName="Saved Opportunity"
          country={country}
        />
      )}
    </div>
  );
}
