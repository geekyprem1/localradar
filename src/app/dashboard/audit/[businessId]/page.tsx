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
  ListTodo,
  Layers,
  Zap
} from 'lucide-react';
import { generateMockAudit, generateMockCompetitors } from '@/lib/mockData';
import { scoreBusinessOpportunity } from '@/lib/scoring';
import { Business, Opportunity, Audit, Competitor } from '@/types';
import { ScoredOpportunity } from '@/types/scoring';

export default function AuditDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.businessId as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [scored, setScored] = useState<ScoredOpportunity | null>(null);
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

    // Fallback: If not found, generate it on the fly
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
    }

    // Use Intelligence Engine™ for scoring
    const mockCompetitors = generateMockCompetitors(selectedBiz);
    const scoredResult = scoreBusinessOpportunity(selectedBiz, mockCompetitors);

    // Build opportunity from engine if not cached
    if (!selectedOpp) {
      selectedOpp = {
        id: `opp-${businessId}`,
        created_at: new Date().toISOString(),
        business_id: businessId,
        website_score: scoredResult.websiteScore,
        reviews_score: scoredResult.reviewsScore,
        seo_score: scoredResult.seoScore,
        gbp_score: scoredResult.gbpScore,
        social_score: scoredResult.socialScore,
        total_score: scoredResult.opportunityScore,
        opportunity_level: scoredResult.opportunityLevel,
        estimated_deal_value: scoredResult.dealValue.max,
        closing_probability: scoredResult.closingProbability
      };
    }

    const mockAudit = generateMockAudit(selectedBiz, selectedOpp);

    setBusiness(selectedBiz);
    setOpportunity(selectedOpp);
    setAudit(mockAudit);
    setCompetitors(mockCompetitors);
    setScored(scoredResult);
    setLoading(false);
  }, [businessId]);

  const handleCopyReport = () => {
    if (!business || !scored) return;
    const text = `LocalRadar Intelligence Report: ${business.name}
Opportunity Score™: ${scored.opportunityScore}/100
Opportunity Level: ${scored.opportunityLevel}
Closing Probability™: ${scored.closingProbability}%
Estimated Deal Value™: ${scored.dealValue.formatted}
Best Service Fit™: ${scored.bestFit.agencyType} (${scored.bestFit.level})
Recommended Services:
${audit?.recommended_services.map(s => `- ${s}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFitColor = (level: string) => {
    if (level === 'Perfect Fit') return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20';
    if (level === 'Strong Fit') return 'text-[#10B981]/90 bg-[#10B981]/5 border-[#10B981]/10';
    if (level === 'Moderate Fit') return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
    return 'text-[#A1A1AA] bg-[#141517] border-[#26282D]';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <LoaderComponent />
      </div>
    );
  }

  if (!business || !opportunity || !audit || !scored) {
    return (
      <div className="p-8 text-center space-y-4 font-mono text-xs text-white bg-[#0B0B0C]">
        <p className="text-[#EF4444]">Error loading audit details.</p>
        <button onClick={() => router.push('/dashboard/lead-finder')} className="text-[#71717A] hover:text-white underline">
          Back to Opportunity Finder
        </button>
      </div>
    );
  }

  const sections = [
    { title: 'Website Opportunity', score: scored.breakdown.websiteOpportunity.score, max: scored.breakdown.websiteOpportunity.maxScore, issues: audit.website_issues },
    { title: 'Review Gap', score: scored.breakdown.reviewGap.score, max: scored.breakdown.reviewGap.maxScore, issues: audit.review_issues },
    { title: 'GBP Weakness', score: scored.breakdown.gbpWeakness.score, max: scored.breakdown.gbpWeakness.maxScore, issues: audit.seo_issues },
    { title: 'Revenue Leakage', score: scored.breakdown.revenueLeakage.score, max: scored.breakdown.revenueLeakage.maxScore, issues: audit.gbp_issues },
    { title: 'Growth Intent', score: scored.breakdown.growthIntent.score, max: scored.breakdown.growthIntent.maxScore, issues: audit.social_issues },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans text-white">
      {/* Back link */}
      <button 
        onClick={() => router.push('/dashboard/lead-finder')}
        className="flex items-center gap-2 text-[#A1A1AA] hover:text-white text-xs font-bold transition-colors cursor-pointer font-mono"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Opportunity Finder
      </button>

      {/* Hero Overview Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left main info */}
        <div className="bg-[#141517] border border-[#26282D] p-6 flex-1 flex flex-col justify-between relative overflow-hidden rounded-2xl shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-normal text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Intelligence Engine™ Scanned
                </span>
                <span className="text-[9px] font-normal text-[#A1A1AA] bg-[#0B0B0C] border border-[#26282D] px-2.5 py-0.5 rounded-full font-mono">
                  ID: {business.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-2xl font-serif font-semibold text-white mt-3">{business.name}</h1>
              <p className="text-[#A1A1AA] text-xs mt-1 flex items-center gap-1.5 font-mono font-normal">
                <MapPin className="w-3.5 h-3.5 text-[#71717A]" />
                {business.address}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-[#26282D] pt-4">
              <div>
                <span className="text-[#A1A1AA] text-[9px] font-normal uppercase tracking-wider block font-mono">Google Rating</span>
                <div className="flex items-center gap-1 text-xs text-white mt-1 font-mono">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{business.rating}</span>
                  <span className="text-[#71717A] font-normal">({business.reviews_count} reviews)</span>
                </div>
              </div>
              <div>
                <span className="text-[#A1A1AA] text-[9px] font-normal uppercase tracking-wider block font-mono">Website Domain</span>
                <span className="text-xs text-[#10B981] font-semibold truncate block mt-1">
                  {business.website ? (
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-[#71717A]" />
                      {business.website.replace('https://www.', '')}
                    </a>
                  ) : (
                    'None Detected'
                  )}
                </span>
              </div>
              <div>
                <span className="text-[#A1A1AA] text-[9px] font-normal uppercase tracking-wider block font-mono">Phone Line</span>
                <span className="text-xs text-white font-semibold block mt-1 font-mono">{business.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 border-t border-[#26282D] pt-6 mt-6">
            <button
              onClick={handleCopyReport}
              className="bg-[#0B0B0C] hover:bg-[#141517] border border-[#26282D] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5 text-[#71717A]" />}
              {copied ? 'Copied Report' : 'Copy Report'}
            </button>
            <button
              onClick={() => router.push(`/dashboard/pitch?bizId=${business.id}`)}
              className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Pitch Copy
            </button>
          </div>
        </div>

        {/* Intelligence Metrics Panel */}
        <div className="bg-[#141517] border border-[#26282D] p-6 w-full lg:w-96 flex flex-col gap-6 rounded-2xl shadow-xl relative overflow-hidden">
          {/* Radial score container */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#0B0B0C"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke={scored.opportunityScore >= 60 ? '#10B981' : scored.opportunityScore >= 35 ? '#F59E0B' : '#71717A'}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - scored.opportunityScore / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-semibold text-white tracking-tight">{scored.opportunityScore}</span>
                <span className="text-[7px] text-[#71717A] uppercase tracking-widest font-normal mt-0.5 font-mono">OPPORTUNITY</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className={`text-[9px] font-normal px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-mono inline-block ${
                scored.opportunityScore >= 60 ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' : scored.opportunityScore >= 35 ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20' : 'text-[#A1A1AA] bg-[#141517] border-[#26282D]'
              }`}>
                {scored.opportunityLevel} Opportunity
              </div>
              <div className="text-xs text-[#A1A1AA] font-mono font-normal">LocalRadar Intelligence Engine™</div>
            </div>
          </div>

          {/* All 4 Metrics */}
          <div className="space-y-3.5 font-mono">
            <div className="flex items-center justify-between border-b border-[#26282D] pb-2.5">
              <div className="flex items-center gap-2 text-[#A1A1AA] text-xs">
                <Target className="w-4 h-4 text-[#10B981]" />
                <span>Opportunity Engine™</span>
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                scored.opportunityScore >= 60 ? 'text-[#10B981]' : scored.opportunityScore >= 35 ? 'text-[#F59E0B]' : 'text-[#A1A1AA]'
              }`}>
                {scored.opportunityScore}/100
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#26282D] pb-2.5 font-normal">
              <div className="flex items-center gap-2 text-[#A1A1AA] text-xs">
                <Layers className="w-4 h-4 text-[#10B981]" />
                <span>Service Fit Engine™</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getFitColor(scored.bestFit.level)}`}>
                {scored.bestFit.agencyType}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#26282D] pb-2.5 font-normal">
              <div className="flex items-center gap-2 text-[#A1A1AA] text-xs">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                <span>Closing Probability™</span>
              </div>
              <span className="text-xs font-semibold text-[#22C55E]">
                {scored.closingProbability}%
              </span>
            </div>

            <div className="flex items-center justify-between font-normal">
              <div className="flex items-center gap-2 text-[#A1A1AA] text-xs">
                <DollarSign className="w-4 h-4 text-[#22C55E]" />
                <span>Revenue Potential™</span>
              </div>
              <span className="text-xs font-semibold text-white">
                {scored.dealValue.formatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Breakdown + Service Fit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vulnerability Diagnostics */}
          <div className="bg-[#141517] border border-[#26282D] p-6 space-y-6 rounded-2xl shadow-xl">
            <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2 uppercase tracking-wider font-mono">
              <ListTodo className="w-4 h-4 text-[#10B981]" />
              AI Vulnerability Diagnostics
            </h2>

            <div className="space-y-6 font-normal">
              {sections.map((sec) => {
                const percent = sec.max > 0 ? (sec.score / sec.max) * 100 : 0;
                const isActive = sec.score > 0;
                return (
                  <div key={sec.title} className="border-b border-[#26282D] pb-5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-[#FFFFFF]">{sec.title}</span>
                      <span className="text-xs text-[#A1A1AA] font-mono">
                        +{sec.score} / {sec.max} points
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-[#0B0B0C] h-2 rounded-full border border-[#26282D] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isActive ? 'bg-[#EF4444]' : 'bg-[#22C55E]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Issues checklist */}
                    <div className="mt-3.5 space-y-2">
                      {sec.issues.length > 0 ? (
                        sec.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-[#EF4444] bg-[#EF4444]/5 border border-[#EF4444]/15 p-2.5 rounded-xl font-mono">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
                            <span>{issue}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2.5 text-xs text-[#22C55E] bg-[#22C55E]/5 border border-[#22C55E]/15 p-2.5 rounded-xl font-mono">
                          <CheckCircle className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                          <span>No critical vulnerabilities discovered. Strong performance.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Fit Score™ Panel */}
          <div className="bg-[#141517] border border-[#26282D] p-6 space-y-4 rounded-2xl shadow-xl">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
              <Layers className="w-4 h-4 text-[#10B981]" />
              Service Fit Engine™ — Agency Compatibility
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scored.serviceFitScores.map(fit => (
                <div key={fit.agencyType} className="bg-[#0B0B0C] border border-[#26282D] p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-white">{fit.agencyType}</span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border font-mono ${getFitColor(fit.level)}`}>
                      {fit.level}
                    </span>
                  </div>
                  
                  {/* Score bar */}
                  <div className="w-full bg-[#141517] h-1.5 border border-[#26282D] rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full ${fit.score >= 70 ? 'bg-[#10B981]' : fit.score >= 45 ? 'bg-[#10B981]/80' : fit.score >= 20 ? 'bg-[#F59E0B]' : 'bg-[#71717A]'}`}
                      style={{ width: `${fit.score}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] font-mono font-normal">
                    <span className="text-[#A1A1AA]">Compatibility</span>
                    <span className="font-semibold text-white">{fit.score}/100</span>
                  </div>
                  
                  {fit.reasons.length > 0 && (
                    <div className="mt-2 space-y-1 font-normal">
                      {fit.reasons.slice(0, 2).map((r, i) => (
                        <div key={i} className="text-[9px] text-[#A1A1AA] font-mono">• {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Competitor Gap & Recommended Services */}
        <div className="space-y-6">
          
          {/* Competitor Gap Analysis */}
          <div className="bg-[#141517] border border-[#26282D] p-6 space-y-4 rounded-2xl shadow-xl">
            <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2 uppercase tracking-wider font-mono">
              <Building2 className="w-4 h-4 text-[#10B981]" />
              Competitor Gap Analysis
            </h3>
            
            <div className="space-y-3">
              {/* Subject Business card */}
              <div className="bg-[#10B981]/5 border border-[#10B981]/20 p-3 rounded-xl shadow-md">
                <p className="text-xs font-semibold text-[#10B981] truncate">{business.name}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-[#A1A1AA] font-mono font-normal">
                  <div>
                    <span>Rating:</span>
                    <span className="text-white font-semibold block mt-0.5">⭐ {business.rating}</span>
                  </div>
                  <div>
                    <span>Reviews:</span>
                    <span className="text-white font-semibold block mt-0.5">{business.reviews_count}</span>
                  </div>
                  <div>
                    <span>Opp. Score:</span>
                    <span className="text-[#10B981] font-semibold block mt-0.5">{scored.opportunityScore}</span>
                  </div>
                </div>
              </div>

              {/* Competitors list */}
              {competitors.map((comp) => (
                <div key={comp.id} className="bg-[#0B0B0C] border border-[#26282D] p-3 rounded-xl">
                  <p className="text-xs font-semibold text-white truncate">{comp.name}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-[#A1A1AA] font-mono font-normal">
                    <div>
                      <span>Rating:</span>
                      <span className="text-white font-semibold block mt-0.5">⭐ {comp.rating}</span>
                    </div>
                    <div>
                      <span>Reviews:</span>
                      <span className="text-white font-semibold block mt-0.5">{comp.reviews_count}</span>
                    </div>
                    <div>
                      <span>SEO Score:</span>
                      <span className="text-white font-semibold block mt-0.5">{comp.seo_score}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Services Panel */}
          <div className="bg-[#141517] border border-[#26282D] p-6 space-y-4 rounded-2xl shadow-xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
              Recommended Pitches
            </h3>
            
            <div className="space-y-2.5">
              {audit.recommended_services.map((service, idx) => (
                <div key={idx} className="bg-[#0B0B0C] border border-[#26282D] p-3.5 rounded-xl flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center font-normal text-[9px] text-[#10B981] mt-0.5 shrink-0 font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs text-white font-semibold leading-relaxed">{service.split(' (')[0]}</p>
                    <p className="text-[10px] text-[#10B981] font-semibold mt-1 font-mono">
                      Est. Service Fee: {service.includes('₹') ? '₹' + service.split('₹')[1] : 'Included'}
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
      <div className="absolute inset-0 border-4 border-[#10B981]/10 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
