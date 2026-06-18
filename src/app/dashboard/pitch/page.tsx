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
  Building,
  Zap,
  Phone
} from 'lucide-react';
import { generateMockAudit, generateMockPitch, calculateLocalRadarScore } from '@/lib/mockData';
import { Business, Opportunity, Pitch, Audit } from '@/types';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type PitchTab = 'firstEmail' | 'followup' | 'linkedin' | 'whatsapp';

export default function PitchGeneratorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const preselectedBizId = searchParams ? searchParams.get('bizId') : null;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  
  const [activeTab, setActiveTab] = useState<PitchTab>('firstEmail');
  const [pitches, setPitches] = useState<Record<PitchTab, string | null>>({
    firstEmail: null,
    followup: null,
    linkedin: null,
    whatsapp: null
  });

  const [loadingStates, setLoadingStates] = useState<Record<PitchTab, boolean>>({
    firstEmail: false,
    followup: false,
    linkedin: false,
    whatsapp: false
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.subscription_tier === 'free') {
      router.replace('/dashboard/lead-finder');
    }
  }, [user, authLoading, router]);

  // Load leads from cache
  useEffect(() => {
    const cachedLeadsStr = localStorage.getItem('localradar_latest_leads');
    const savedLeadsStr = localStorage.getItem('localradar_saved_leads');
    
    let leads: Business[] = [];
    if (cachedLeadsStr) {
      leads = JSON.parse(cachedLeadsStr) as Business[];
    }
    
    const savedList: Business[] = savedLeadsStr ? JSON.parse(savedLeadsStr) : [];
    const savedIdsSet = new Set(savedList.map(b => b.id));
    setSavedIds(savedIdsSet);
    
    // Merge saved leads, avoiding duplicates
    savedList.forEach(savedBiz => {
      if (!leads.some(b => b.id === savedBiz.id)) {
        leads.push(savedBiz);
      }
    });

    if (leads.length > 0) {
      setBusinesses(leads);
      
      if (preselectedBizId && leads.some(b => b.id === preselectedBizId)) {
        setSelectedBizId(preselectedBizId);
      } else {
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

  // Reset pitch when selected business changes
  useEffect(() => {
    setPitches({
      firstEmail: null,
      followup: null,
      linkedin: null,
      whatsapp: null
    });
    setLoadingStates({
      firstEmail: false,
      followup: false,
      linkedin: false,
      whatsapp: false
    });
  }, [selectedBizId]);

  const handleGenerateTabPitch = async (tab: PitchTab) => {
    if (!selectedBizId) return;

    setLoadingStates(prev => ({ ...prev, [tab]: true }));
    
    // Retrieve associated opportunity score from cache or compute it
    const cachedOppsStr = localStorage.getItem('localradar_latest_opps');
    const savedOppsStr = localStorage.getItem('localradar_saved_opps');
    let opp: Opportunity | null = null;
    
    if (cachedOppsStr) {
      const opps = JSON.parse(cachedOppsStr) as Record<string, Opportunity>;
      opp = opps[selectedBizId] || null;
    }
    
    if (!opp && savedOppsStr) {
      const opps = JSON.parse(savedOppsStr) as Record<string, Opportunity>;
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
      const mockPitches = generateMockPitch(currentBiz, opp, audit);
      
      let mockValue = '';

      if (tab === 'firstEmail') {
        mockValue = mockPitches.cold_email;
      } else if (tab === 'followup') {
        mockValue = `Subject: Following up on local audit details\n\nHi Team,\n\nI wanted to follow up on the site audit checklist I put together for ${currentBiz.name}.\n\nSpecifically, fixing your booking system leakage represents an estimated revenue potential of ₹${(opp.estimated_deal_value || 0).toLocaleString('en-IN')} in monthly appointments. Is this something you'd like to check out?\n\nBest,\n[Your Name]`;
      } else if (tab === 'linkedin') {
        mockValue = mockPitches.cold_dm;
      } else if (tab === 'whatsapp') {
        mockValue = `Hey Team! 👋 I noticed your profile on Google Maps. Your business is highly rated, but you have a gap of reviews compared to competitors, and your phone list shows missed appointment inquiries. We put together a short checklist showing how you can easily automate bookings. Can I drop the checklist link here?`;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const mockUserStr = localStorage.getItem('localradar_mock_user');
        if (mockUserStr) {
          const mu = JSON.parse(mockUserStr);
          headers['x-is-sandbox'] = 'true';
          headers['x-user-id'] = mu.id;
          headers['x-org-id'] = 'mock-org-123';
          headers['x-user-tier'] = mu.subscription_tier;
        }

        const res = await fetch('/api/generate-pitch', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            businessId: currentBiz.id,
            pitchType: tab
          })
        });

        if (!res.ok) {
          throw new Error(`API failed with status ${res.status}`);
        }

        const responseData = await res.json();
        if (responseData.success && responseData.data) {
          const data = responseData.data;
          setPitches(prev => ({
            ...prev,
            [tab]: data
          }));
        } else {
          setPitches(prev => ({ ...prev, [tab]: mockValue }));
        }
      } catch (err) {
        console.error(`Error generating pitch for ${tab} via AI:`, err);
        setPitches(prev => ({ ...prev, [tab]: mockValue }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [tab]: false }));
      }
    }
  };

  const getActiveContent = () => {
    const val = pitches[activeTab];
    if (!val) return '';

    if (val && typeof val === 'object') {
      const sub = (val as any).Subject || (val as any).subject || '';
      const body = (val as any).Body || (val as any).body || '';
      if (sub || body) {
        return `Subject: ${sub}\n\n${body}`;
      }
      return JSON.stringify(val, null, 2);
    }
    return typeof val === 'string' ? val : '';
  };

  const handleCopy = () => {
    const textToCopy = getActiveContent();
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTabLabel = (tab: PitchTab) => {
    if (tab === 'firstEmail') return 'First Email';
    if (tab === 'followup') return 'Follow Up';
    if (tab === 'linkedin') return 'LinkedIn DM';
    if (tab === 'whatsapp') return 'WhatsApp Message';
    return 'Pitch';
  };

  const tabsConfig = [
    { id: 'firstEmail' as const, name: 'First Email', icon: Mail },
    { id: 'followup' as const, name: 'Follow Up', icon: FileText },
    { id: 'linkedin' as const, name: 'LinkedIn DM', icon: MessageSquare },
    { id: 'whatsapp' as const, name: 'WhatsApp Message', icon: Phone }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans text-white pb-16">
      {/* Header */}
      <div className="border-b border-[#26282D] pb-6">
        <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
          AI Pitch Engine
          <Sparkles className="w-5 h-5 text-[#FAFAF9] fill-[#FAFAF9]/10 animate-pulse" />
        </h1>
        <p className="text-[#A1A1AA] text-xs mt-1">
          Draft personalized client acquisition sequences using diagnostic data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left selector */}
        <div className="bg-[#141517] border border-[#26282D] p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-[#A1A1AA] flex items-center gap-1.5 uppercase tracking-wider font-mono">
            <Building className="w-4 h-4 text-[#A1A1AA]" />
            Target Business Lead
          </h3>

          <div className="space-y-3">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
              Select Client
            </label>
            <select
              value={selectedBizId}
              onChange={(e) => setSelectedBizId(e.target.value)}
              className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-zinc-500 transition-all font-mono cursor-pointer"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#0B0B0C]">
                  {b.name} {savedIds.has(b.id) ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-[#26282D] pt-4 mt-2">
            <button
              onClick={() => router.push('/dashboard/lead-finder')}
              className="w-full bg-[#0B0B0C] hover:bg-[#141517] border border-[#26282D] text-white text-xs font-bold py-2.5 rounded-xl transition-all block text-center cursor-pointer font-mono"
            >
              Back to Opportunity Finder
            </button>
          </div>
        </div>

        {/* Right Output panel */}
        <div className="lg:col-span-2 bg-[#141517] border border-[#26282D] p-6 rounded-2xl min-h-[400px] flex flex-col justify-between shadow-xl">
          <div>
            {/* Tabs Row */}
            <div className="flex border-b border-[#26282D] pb-3 mb-6 overflow-x-auto gap-2.5">
              {tabsConfig.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap font-mono ${
                      isActive 
                        ? 'bg-[#26282D] border-[#26282D] text-[#FAFAF9]' 
                        : 'text-[#A1A1AA] border-transparent hover:text-white'
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
              {loadingStates[activeTab] ? (
                <div className="h-60 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#FAFAF9] animate-spin" />
                  <span className="text-xs text-[#A1A1AA] font-medium font-mono">Re-writing outreach sequence...</span>
                </div>
              ) : pitches[activeTab] ? (
                <pre className="text-xs text-white font-mono leading-relaxed bg-[#0B0B0C] border border-[#26282D] p-5 rounded-xl whitespace-pre-wrap overflow-x-auto select-text min-h-[220px]">
                  {getActiveContent()}
                </pre>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center space-y-4 border border-dashed border-[#26282D] bg-[#0B0B0C]/40 rounded-xl p-6">
                  <Sparkles className="w-8 h-8 text-[#A1A1AA] animate-pulse" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white font-mono">{getTabLabel(activeTab)} Not Generated</p>
                    <p className="text-[10px] text-[#71717A] font-mono mt-1">
                      Click the button below to generate personalized copy using AI diagnostic tools.
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateTabPitch(activeTab)}
                    className="bg-gradient-to-r from-[#2DD4A7] to-[#14B88C] hover:opacity-95 text-[#0B0B0C] text-xs font-mono font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate {getTabLabel(activeTab)}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions Row */}
          {!loadingStates[activeTab] && pitches[activeTab] && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#26282D] pt-6 mt-6 gap-3">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
                Customize variables prior to sending.
              </span>

              <button
                onClick={handleCopy}
                className="bg-gradient-to-r from-[#2DD4A7] to-[#14B88C] hover:opacity-95 text-[#0B0B0C] text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-mono"
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
