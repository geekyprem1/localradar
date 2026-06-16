'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Mail, 
  Globe, 
  FileText, 
  Copy, 
  Check, 
  Loader2, 
  MessageSquare,
  AlertTriangle,
  Building
} from 'lucide-react';
import { generateMockAudit, generateMockPitch, calculateLocalRadarScore } from '@/lib/mockData';
import { Business, Opportunity, Pitch, Audit } from '@/types';

export default function PitchGeneratorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedBizId = searchParams ? searchParams.get('bizId') : null;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'dm' | 'website' | 'seo'>('email');
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [copied, setCopied] = useState(false);

  // Load leads from cache
  useEffect(() => {
    const cachedLeadsStr = localStorage.getItem('localradar_latest_leads');
    if (cachedLeadsStr) {
      const leads = JSON.parse(cachedLeadsStr) as Business[];
      setBusinesses(leads);
      
      if (preselectedBizId && leads.some(b => b.id === preselectedBizId)) {
        setSelectedBizId(preselectedBizId);
      } else if (leads.length > 0) {
        setSelectedBizId(leads[0].id);
      }
    } else {
      // Fallback lead if cache is empty, to keep the UI interactive
      const fallbackBiz: Business = {
        id: 'fallback-dental',
        created_at: new Date().toISOString(),
        name: 'Preston Dental Clinic',
        website: 'https://www.prestondentalpractice.com',
        rating: 3.9,
        reviews_count: 34,
        phone: '(214) 555-0199',
        address: '8383 Preston Rd, Dallas, TX 75225',
        organization_id: 'mock-org-123'
      };
      setBusinesses([fallbackBiz]);
      setSelectedBizId(fallbackBiz.id);
    }
  }, [preselectedBizId]);

  // Generate pitch when selected business changes
  useEffect(() => {
    if (!selectedBizId) return;

    setLoading(true);
    
    // Retrieve associated opportunity score from cache or compute it
    const cachedOppsStr = localStorage.getItem('localradar_latest_opps');
    let opp: Opportunity | null = null;
    
    if (cachedOppsStr) {
      const opps = JSON.parse(cachedOppsStr) as Record<string, Opportunity>;
      opp = opps[selectedBizId] || null;
    }

    const currentBiz = businesses.find(b => b.id === selectedBizId) || businesses[0];
    
    if (!opp && currentBiz) {
      const scoring = calculateLocalRadarScore(15, 12, 10, 8, 5); // 50/100
      opp = {
        id: `opp-${currentBiz.id}`,
        created_at: new Date().toISOString(),
        business_id: currentBiz.id,
        website_score: scoring.website,
        reviews_score: scoring.reviews,
        seo_score: scoring.seo,
        gbp_score: scoring.gbp,
        social_score: scoring.social,
        total_score: scoring.total,
        opportunity_level: scoring.opportunityLevel,
        estimated_deal_value: scoring.estimatedDealValue,
        closing_probability: scoring.closingProbability
      };
    }

    if (currentBiz && opp) {
      const audit = generateMockAudit(currentBiz, opp);
      
      // Simulate API load times for realistic feel
      setTimeout(() => {
        const generatedPitch = generateMockPitch(currentBiz, opp!, audit);
        setPitch(generatedPitch);
        setLoading(false);
      }, 1000);
    }
  }, [selectedBizId, businesses]);

  const handleCopy = () => {
    if (!pitch) return;
    
    let textToCopy = '';
    if (activeTab === 'email') textToCopy = pitch.cold_email;
    if (activeTab === 'dm') textToCopy = pitch.cold_dm;
    if (activeTab === 'website') textToCopy = pitch.website_proposal;
    if (activeTab === 'seo') textToCopy = pitch.seo_proposal;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActiveContent = () => {
    if (!pitch) return '';
    if (activeTab === 'email') return pitch.cold_email;
    if (activeTab === 'dm') return pitch.cold_dm;
    if (activeTab === 'website') return pitch.website_proposal;
    if (activeTab === 'seo') return pitch.seo_proposal;
    return '';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          AI Pitch Generator
          <Sparkles className="w-5 h-5 text-[#FF2D2D] fill-[#FF2D2D]/10 animate-pulse" />
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Draft personalized client acquisition sequences using diagnostic data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left selector */}
        <div className="glass-panel p-6 space-y-4 border border-white/[0.08]">
          <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#FF2D2D]" />
            Target Business Lead
          </h3>

          <div className="space-y-3">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Select Client
            </label>
            <select
              value={selectedBizId}
              onChange={(e) => setSelectedBizId(e.target.value)}
              className="w-full bg-[#050505] border border-white/[0.08] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#FF2D2D] focus:ring-1 focus:ring-[#FF2D2D] transition-all"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-white/[0.08] pt-4 mt-2">
            <button
              onClick={() => router.push('/dashboard/lead-finder')}
              className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all block text-center cursor-pointer"
            >
              Search Different Niche
            </button>
          </div>
        </div>

        {/* Right Output panel */}
        <div className="lg:col-span-2 glass-panel p-6 border border-white/[0.08] min-h-[400px] flex flex-col justify-between">
          <div>
            {/* Tabs Row */}
            <div className="flex border-b border-white/[0.08] pb-3 mb-6 overflow-x-auto gap-2.5">
              {[
                { id: 'email', name: 'Cold Email', icon: Mail },
                { id: 'dm', name: 'Cold DM', icon: MessageSquare },
                { id: 'website', name: 'Website Proposal', icon: Globe },
                { id: 'seo', name: 'SEO Proposal', icon: FileText }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap ${
                      isActive 
                        ? 'bg-[#FF2D2D]/10 border-[#FF2D2D]/25 text-white' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* Generated Content Box */}
            <div className="relative">
              {loading ? (
                <div className="h-60 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#FF2D2D] animate-spin" />
                  <span className="text-xs text-zinc-500 font-medium">Re-writing outreach sequence...</span>
                </div>
              ) : (
                <pre className="text-xs text-zinc-300 font-mono leading-relaxed bg-white/[0.01] border border-white/[0.04] p-5 rounded-xl whitespace-pre-wrap overflow-x-auto select-text min-h-[220px]">
                  {getActiveContent()}
                </pre>
              )}
            </div>
          </div>

          {/* Bottom Actions Row */}
          {!loading && pitch && (
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-6 mt-6">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-600" />
                Customize variables prior to sending.
              </span>

              <button
                onClick={handleCopy}
                className="bg-[#FF2D2D] hover:bg-[#e62222] text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(255,45,45,0.25)] flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Pitch'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
