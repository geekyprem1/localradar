'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Sparkles, 
  Star, 
  Globe, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Target,
  AlertTriangle,
  CheckCircle,
  FileText,
  Copy,
  Check,
  Building2,
  ListTodo
} from 'lucide-react';
import { generateMockAudit, generateMockCompetitors, calculateLocalRadarScore } from '@/lib/mockData';
import { Business, Opportunity, Audit, Competitor } from '@/types';

export default function AuditDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!businessId) return;

    // Retrieve from latest scanned leads cache
    const cachedLeadsStr = localStorage.getItem('localradar_latest_leads');
    const cachedOppsStr = localStorage.getItem('localradar_latest_opps');

    let selectedBiz: Business | null = null;
    let selectedOpp: Opportunity | null = null;

    if (cachedLeadsStr && cachedOppsStr) {
      const leads = JSON.parse(cachedLeadsStr) as Business[];
      const opps = JSON.parse(cachedOppsStr) as Record<string, Opportunity>;
      selectedBiz = leads.find((b) => b.id === businessId) || null;
      selectedOpp = opps[businessId] || null;
    }

    // Look in saved leads if not found in latest scan cache
    if (!selectedBiz) {
      const savedLeadsStr = localStorage.getItem('localradar_saved_leads');
      const savedOppsStr = localStorage.getItem('localradar_saved_opps');
      if (savedLeadsStr && savedOppsStr) {
        const savedLeads = JSON.parse(savedLeadsStr) as Business[];
        const savedOpps = JSON.parse(savedOppsStr) as Record<string, Opportunity>;
        selectedBiz = savedLeads.find((b) => b.id === businessId) || null;
        selectedOpp = savedOpps[businessId] || null;
      }
    }

    // Fallback: If not found, generate it on the fly so page doesn't error
    if (!selectedBiz) {
      selectedBiz = {
        id: businessId,
        created_at: new Date().toISOString(),
        name: 'Preston Dental Practice',
        website: 'https://www.prestondentalpractice.com',
        rating: 3.8,
        reviews_count: 24,
        phone: '(214) 555-0199',
        address: '8383 Preston Rd, Dallas, TX 75225',
        organization_id: 'mock-org-123'
      };

      const scoring = calculateLocalRadarScore(15, 12, 10, 8, 5); // Scored 50/100
      selectedOpp = {
        id: `opp-${businessId}`,
        created_at: new Date().toISOString(),
        business_id: businessId,
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

    const mockAudit = generateMockAudit(selectedBiz, selectedOpp!);
    const mockCompetitors = generateMockCompetitors(selectedBiz);

    setBusiness(selectedBiz);
    setOpportunity(selectedOpp);
    setAudit(mockAudit);
    setCompetitors(mockCompetitors);
    setLoading(false);
  }, [businessId]);

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

  const getOpportunityLabel = (score: number) => {
    if (score >= 71) return 'High';
    if (score >= 41) return 'Medium';
    return 'Low';
  };

  const handleCopyReport = () => {
    if (!business || !opportunity) return;
    const score = getOpportunityScore(opportunity);
    const text = `LocalRadar Opportunity Report: ${business.name}
Opportunity Score™: ${score}/100
Opportunity Level: ${getOpportunityLabel(score)}
Recommended Services:
${audit?.recommended_services.map(s => `- ${s}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
        <LoaderComponent />
      </div>
    );
  }

  if (!business || !opportunity || !audit) {
    return (
      <div className="p-8 text-center space-y-4 font-mono text-xs text-[#0F0F11] bg-[#F9F9FB]">
        <p className="text-[#E54D80]">Error loading audit details.</p>
        <button onClick={() => router.push('/dashboard/lead-finder')} className="text-zinc-500 hover:text-[#0F0F11] underline">
          Back to Lead Finder
        </button>
      </div>
    );
  }

  const sections = [
    { title: 'Website Quality', score: opportunity.website_score, max: 25, issues: audit.website_issues },
    { title: 'Review Strength', score: opportunity.reviews_score, max: 25, issues: audit.review_issues },
    { title: 'SEO Presence', score: opportunity.seo_score, max: 20, issues: audit.seo_issues },
    { title: 'Google Business Profile', score: opportunity.gbp_score, max: 15, issues: audit.gbp_issues },
    { title: 'Social Activity', score: opportunity.social_score, max: 15, issues: audit.social_issues },
  ];

  const currentScore = getOpportunityScore(opportunity);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans text-[#0F0F11]">
      {/* Back link */}
      <button 
        onClick={() => router.push('/dashboard/lead-finder')}
        className="flex items-center gap-2 text-zinc-500 hover:text-[#0F0F11] text-xs font-bold transition-colors cursor-pointer font-mono"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lead Finder
      </button>

      {/* Hero Overview Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left main info */}
        <div className="bg-white border border-[#E5E5E8] p-6 flex-1 flex flex-col justify-between relative overflow-hidden rounded-3xl shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E54D80]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-[#E54D80] bg-[#E54D80]/10 border border-[#E54D80]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  AI Opportunity Scanned
                </span>
                <span className="text-[9px] font-bold text-zinc-500 bg-[#F4F4F6] border border-[#E5E5E8] px-2.5 py-0.5 rounded-full font-mono">
                  ID: {business.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#0F0F11] mt-3">{business.name}</h1>
              <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1.5 font-mono">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {business.address}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-[#E5E5E8] pt-4">
              <div>
                <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block font-mono">Google Rating</span>
                <div className="flex items-center gap-1 text-xs text-[#0F0F11] mt-1 font-mono">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-bold">{business.rating}</span>
                  <span className="text-zinc-500">({business.reviews_count} reviews)</span>
                </div>
              </div>
              <div>
                <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block font-mono">Website Domain</span>
                <span className="text-xs text-[#E54D80] font-bold truncate block mt-1">
                  {business.website ? (
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      {business.website.replace('https://www.', '')}
                    </a>
                  ) : (
                    'None Detected'
                  )}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block font-mono">Phone Line</span>
                <span className="text-xs text-[#0F0F11] font-bold block mt-1 font-mono">{business.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 border-t border-[#E5E5E8] pt-6 mt-6">
            <button
              onClick={handleCopyReport}
              className="bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-[#0F0F11] text-xs font-bold px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              {copied ? 'Copied Report' : 'Copy Report'}
            </button>
            <button
              onClick={() => router.push(`/dashboard/pitch?bizId=${business.id}`)}
              className="bg-[#E54D80] hover:bg-[#FF5E8C] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Pitch Copy
            </button>
          </div>
        </div>

        {/* Circular score dial & intelligence metrics */}
        <div className="bg-white border border-[#E5E5E8] p-6 w-full lg:w-96 flex flex-col md:flex-row lg:flex-col justify-around gap-6 items-center text-center rounded-3xl shadow-sm relative overflow-hidden">
          {/* Radial score container */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="rgba(15,15,17,0.04)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke={currentScore >= 71 ? '#E54D80' : currentScore >= 41 ? '#D97706' : '#059669'}
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - currentScore / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-serif font-bold text-[#0F0F11] tracking-tight">{currentScore}</span>
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5 font-mono">OPPORTUNITY</span>
            </div>
          </div>

          {/* Metrics indicators */}
          <div className="flex-1 w-full space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#E5E5E8] pb-2.5">
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Target className="w-4 h-4 text-[#E54D80]" />
                <span>Opportunity Level</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${
                currentScore >= 71 ? 'text-[#E54D80]' : 'text-amber-600'
              }`}>
                {getOpportunityLabel(currentScore)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#E5E5E8] pb-2.5">
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <DollarSign className="w-4 h-4 text-[#059669]" />
                <span>Est. Service Value</span>
              </div>
              <span className="text-xs font-bold text-[#0F0F11]">
                ${opportunity.estimated_deal_value.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <TrendingUp className="w-4 h-4 text-[#E54D80]" />
                <span>Closing Probability</span>
              </div>
              <span className="text-xs font-bold text-[#059669]">
                {opportunity.closing_probability}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Audited components vs Competitor Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Breakdown items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E5E5E8] p-6 space-y-6 rounded-3xl shadow-sm">
            <h2 className="text-sm font-bold text-[#0F0F11] flex items-center gap-2 uppercase tracking-wider font-mono">
              <ListTodo className="w-4 h-4 text-[#E54D80]" />
              AI Vulnerability Diagnostics
            </h2>

            <div className="space-y-6">
              {sections.map((sec) => {
                const percent = (sec.score / sec.max) * 100;
                const isCrit = percent <= 50;
                return (
                  <div key={sec.title} className="border-b border-[#E5E5E8] pb-5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#0F0F11]">{sec.title}</span>
                      <span className="text-xs text-zinc-500 font-mono">
                        {sec.score} / {sec.max} points
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-[#F4F4F6] h-2 rounded-full border border-[#E5E5E8] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCrit ? 'bg-[#E54D80]' : percent <= 75 ? 'bg-[#D97706]' : 'bg-[#059669]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Issues checklist */}
                    <div className="mt-3.5 space-y-2">
                      {sec.issues.length > 0 ? (
                        sec.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-[#E54D80] bg-[#E54D80]/10 border border-[#E54D80]/20 p-2.5 rounded-xl font-mono">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#E54D80] shrink-0 mt-0.5" />
                            <span>{issue}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2.5 text-xs text-[#059669] bg-[#059669]/10 border border-[#059669]/20 p-2.5 rounded-xl font-mono">
                          <CheckCircle className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                          <span>No critical vulnerabilities discovered. Strong performance.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Competitor Gap & Recommended Services */}
        <div className="space-y-6">
          
          {/* Competitor Gap Analysis */}
          <div className="bg-white border border-[#E5E5E8] p-6 space-y-4 rounded-3xl shadow-sm">
            <h3 className="text-sm font-bold text-[#0F0F11] flex items-center gap-2 uppercase tracking-wider font-mono">
              <Building2 className="w-4 h-4 text-[#E54D80]" />
              Competitor Gap Analysis
            </h3>
            
            <div className="space-y-3">
              {/* Subject Business card */}
              <div className="bg-[#E54D80]/5 border border-[#E54D80]/20 p-3 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-[#E54D80] truncate">{business.name}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-zinc-500 font-mono">
                  <div>
                    <span>Rating:</span>
                    <span className="text-[#0F0F11] font-bold block mt-0.5">⭐ {business.rating}</span>
                  </div>
                  <div>
                    <span>Reviews:</span>
                    <span className="text-[#0F0F11] font-bold block mt-0.5">{business.reviews_count}</span>
                  </div>
                  <div>
                    <span>Opp. Score:</span>
                    <span className="text-[#E54D80] font-bold block mt-0.5">{currentScore}</span>
                  </div>
                </div>
              </div>

              {/* Competitors list */}
              {competitors.map((comp) => (
                <div key={comp.id} className="bg-[#F9F9FB] border border-[#E5E5E8] p-3 rounded-xl">
                  <p className="text-xs font-semibold text-[#0F0F11] truncate">{comp.name}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-zinc-500 font-mono">
                    <div>
                      <span>Rating:</span>
                      <span className="text-[#0F0F11] font-bold block mt-0.5">⭐ {comp.rating}</span>
                    </div>
                    <div>
                      <span>Reviews:</span>
                      <span className="text-[#0F0F11] font-bold block mt-0.5">{comp.reviews_count}</span>
                    </div>
                    <div>
                      <span>SEO Score:</span>
                      <span className="text-[#0F0F11] font-bold block mt-0.5">{comp.seo_score}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Services Panel */}
          <div className="bg-white border border-[#E5E5E8] p-6 space-y-4 rounded-3xl shadow-sm">
            <h3 className="text-sm font-bold text-[#0F0F11] flex items-center gap-2 uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-[#E54D80]" />
              Recommended Pitches
            </h3>
            
            <div className="space-y-2.5">
              {audit.recommended_services.map((service, idx) => (
                <div key={idx} className="bg-[#E54D80]/5 border border-[#E54D80]/15 p-3.5 rounded-xl flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#E54D80]/10 border border-[#E54D80]/20 flex items-center justify-center font-bold text-[9px] text-[#E54D80] mt-0.5 shrink-0 font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs text-[#0F0F11] font-bold leading-relaxed">{service.split(' ($')[0]}</p>
                    <p className="text-[10px] text-[#E54D80] font-bold mt-1 font-mono">
                      Est. Service Fee: {service.includes('$') ? '$' + service.split('$')[1] : 'Included'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function LoaderComponent() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div className="absolute inset-0 border-4 border-[#E54D80]/10 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-[#E54D80] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
