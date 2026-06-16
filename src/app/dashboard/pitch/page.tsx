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
  Zap
} from 'lucide-react';
import { generateMockAudit, generateMockPitch, calculateLocalRadarScore } from '@/lib/mockData';
import { Business, Opportunity, Pitch, Audit } from '@/types';

export default function PitchGeneratorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedBizId = searchParams ? searchParams.get('bizId') : null;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string>('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  
  const [activeTab, setActiveTab] = useState<'email' | 'dm' | 'website' | 'seo'>('email');
  const [pitches, setPitches] = useState<{
    email: string | null;
    dm: string | null;
    website: string | null;
    seo: string | null;
  }>({
    email: null,
    dm: null,
    website: null,
    seo: null
  });

  const [loadingStates, setLoadingStates] = useState<{
    email: boolean;
    dm: boolean;
    website: boolean;
    seo: boolean;
  }>({
    email: false,
    dm: false,
    website: false,
    seo: false
  });

  const [copied, setCopied] = useState(false);

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
      email: null,
      dm: null,
      website: null,
      seo: null
    });
    setLoadingStates({
      email: false,
      dm: false,
      website: false,
      seo: false
    });
  }, [selectedBizId]);

  const handleGenerateTabPitch = async (tab: 'email' | 'dm' | 'website' | 'seo') => {
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
      let jsonKey = '';
      let systemPrompt = '';

      if (tab === 'email') {
        mockValue = mockPitches.cold_email;
        jsonKey = 'cold_email';
        systemPrompt = `You are a Conversion Rate Optimization expert, Senior Product Designer, and SaaS Growth Copywriter.
Your task is to generate a highly personalized, high-converting Cold Email for a local business based on their scanned diagnostic details and web/GBP vulnerabilities.
Respond with a JSON object containing exactly one key "cold_email":
{
  "cold_email": "A professional and compelling cold email with a Subject line, customized for the business. Mention specific website issues. Keep it brief, and end with a direct call to action."
}
Ensure the output is clean JSON. Do not write any markdown code block wrappers (like \`\`\`json or \`\`\`) in your response. Just return the raw JSON text.`;
      } else if (tab === 'dm') {
        mockValue = mockPitches.cold_dm;
        jsonKey = 'cold_dm';
        systemPrompt = `You are a Conversion Rate Optimization expert, Senior Product Designer, and SaaS Growth Copywriter.
Your task is to generate a friendly, casual, and short social media direct message (Cold DM) for a local business offering value first based on their scanned diagnostic details and web/GBP vulnerabilities.
Respond with a JSON object containing exactly one key "cold_dm":
{
  "cold_dm": "A friendly, casual, and short social media direct message (Instagram/Facebook) offering value first. Mention one critical vulnerability."
}
Ensure the output is clean JSON. Do not write any markdown code block wrappers (like \`\`\`json or \`\`\`) in your response. Just return the raw JSON text.`;
      } else if (tab === 'website') {
        mockValue = mockPitches.website_proposal;
        jsonKey = 'website_proposal';
        systemPrompt = `You are a Conversion Rate Optimization expert, Senior Product Designer, and SaaS Growth Copywriter.
Your task is to generate a structured website proposal in Markdown formatting detailing the website redesign action plan, benefits, and investment for a local business.
Respond with a JSON object containing exactly one key "website_proposal":
{
  "website_proposal": "A structured proposal in Markdown formatting detailing the website redesign action plan, benefits, and investment."
}
Ensure the output is clean JSON. Do not write any markdown code block wrappers (like \`\`\`json or \`\`\`) in your response. Just return the raw JSON text.`;
      } else if (tab === 'seo') {
        mockValue = mockPitches.seo_proposal;
        jsonKey = 'seo_proposal';
        systemPrompt = `You are a Conversion Rate Optimization expert, Senior Product Designer, and SaaS Growth Copywriter.
Your task is to generate a structured local SEO proposal in Markdown formatting detailing the local SEO action plan, ranking benefits, and monthly retainer for a local business.
Respond with a JSON object containing exactly one key "seo_proposal":
{
  "seo_proposal": "A structured proposal in Markdown formatting detailing the local SEO action plan, ranking benefits, and monthly retainer."
}
Ensure the output is clean JSON. Do not write any markdown code block wrappers (like \`\`\`json or \`\`\`) in your response. Just return the raw JSON text.`;
      }

      try {
        const orKey = localStorage.getItem('localradar_dev_openrouter_key') || '';
        const orModel = localStorage.getItem('localradar_dev_openrouter_model') || 'deepseek/deepseek-chat';
        const oaKey = localStorage.getItem('localradar_dev_openai_key') || '';
        
        const apiKey = orKey || oaKey || '';
        const modelName = orKey ? orModel : (oaKey ? 'gpt-4o-mini' : '');

        if (!apiKey) {
          // No API Key, fallback to mock after small delay for Sandbox feel
          await new Promise((resolve) => setTimeout(resolve, 850));
          setPitches(prev => ({ ...prev, [tab]: mockValue }));
          setLoadingStates(prev => ({ ...prev, [tab]: false }));
          return;
        }

        const userPrompt = `Generate the ${tab} proposal/sequence for:
Business Name: ${currentBiz.name}
Website: ${currentBiz.website || 'No website detected'}
Rating: ${currentBiz.rating}/5 stars (${currentBiz.reviews_count} reviews)
Phone: ${currentBiz.phone || 'None'}
Address: ${currentBiz.address || 'None'}
Opportunity Score: ${opp.total_score}/100
Opportunity Level: ${opp.opportunity_level}

Website Issues:
${audit.website_issues.map(i => `- ${i}`).join('\n')}

SEO & Google Business Profile Issues:
${audit.seo_issues.map(i => `- ${i}`).join('\n')}

Revenue Leakage / Other Issues:
${audit.gbp_issues.map(i => `- ${i}`).join('\n')}`;

        const res = await fetch('/api/generate-pitch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            systemPrompt,
            userPrompt,
            fallbackData: { [jsonKey]: mockValue },
            clientApiKey: apiKey,
            clientModel: modelName
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
            [tab]: data[jsonKey] || mockValue
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
    const val = pitches[activeTab] as any;
    if (!val) return '';

    if (val && typeof val === 'object') {
      if (val.Subject || val.Body || val.subject || val.body) {
        const sub = val.Subject || val.subject || '';
        const body = val.Body || val.body || '';
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

  const getTabLabel = (tab: 'email' | 'dm' | 'website' | 'seo') => {
    if (tab === 'email') return 'Cold Email';
    if (tab === 'dm') return 'Cold DM';
    if (tab === 'website') return 'Website Proposal';
    if (tab === 'seo') return 'SEO Proposal';
    return 'Pitch';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans text-white pb-16">
      {/* Header */}
      <div className="border-b border-[#26282D] pb-6">
        <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
          AI Pitch Engine
          <Sparkles className="w-5 h-5 text-[#10B981] fill-[#10B981]/10 animate-pulse" />
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
              className="w-full bg-[#0B0B0C] border border-[#26282D] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#10B981] transition-all font-mono cursor-pointer"
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap font-mono ${
                      isActive 
                        ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]' 
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
                  <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
                  <span className="text-xs text-[#A1A1AA] font-medium font-mono">Re-writing outreach sequence...</span>
                </div>
              ) : pitches[activeTab] ? (
                <pre className="text-xs text-white font-mono leading-relaxed bg-[#0B0B0C] border border-[#26282D] p-5 rounded-xl whitespace-pre-wrap overflow-x-auto select-text min-h-[220px]">
                  {getActiveContent()}
                </pre>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center space-y-4 border border-dashed border-[#26282D] bg-[#0B0B0C]/40 rounded-xl p-6">
                  <Sparkles className="w-8 h-8 text-[#10B981] animate-pulse" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white font-mono">{getTabLabel(activeTab)} Not Generated</p>
                    <p className="text-[10px] text-[#71717A] font-mono mt-1">
                      Click the button below to generate personalized copy using AI diagnostic tools.
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateTabPitch(activeTab)}
                    className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-mono font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
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
                className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-mono"
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
