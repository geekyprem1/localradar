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
import { useAuth } from '@/lib/auth';

export default function AuditDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const businessId = params?.businessId as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [scored, setScored] = useState<ScoredOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.subscription_tier === 'free') {
      router.replace('/dashboard/lead-finder');
    }
  }, [user, authLoading, router]);

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
    if (level === 'Perfect Fit') return 'text-foreground bg-border border-border';
    if (level === 'Strong Fit') return 'text-secondary-text bg-secondary-bg border-border';
    if (level === 'Moderate Fit') return 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/25';
    return 'text-[#FF5C5C] bg-[#FF5C5C]/10 border-[#FF5C5C]/25';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoaderComponent />
      </div>
    );
  }

  if (!business || !opportunity || !audit || !scored) {
    return (
      <div className="p-8 text-center space-y-4 font-mono text-xs text-foreground bg-background">
        <p className="text-[#FF5C5C]">Error loading audit details.</p>
        <button onClick={() => router.push('/dashboard/lead-finder')} className="text-muted-text hover:text-foreground underline">
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans text-foreground">
      {/* Back link */}
      <button 
        onClick={() => router.push('/dashboard/lead-finder')}
        className="flex items-center gap-2 text-secondary-text hover:text-foreground text-xs font-bold transition-colors cursor-pointer font-mono"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Opportunity Finder
      </button>

      {/* Hero Overview Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left main info */}
        <div className="bg-secondary-bg border border-border p-6 flex-1 flex flex-col justify-between relative overflow-hidden rounded-2xl shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-normal text-foreground bg-border border border-border px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  Intelligence Engine™ Scanned
                </span>
                <span className="text-[9px] font-normal text-secondary-text bg-background border border-border px-2.5 py-0.5 rounded-full font-mono">
                  ID: {business.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-2xl font-serif font-semibold text-foreground mt-3">{business.name}</h1>
              <p className="text-secondary-text text-xs mt-1 flex items-center gap-1.5 font-mono font-normal">
                <MapPin className="w-3.5 h-3.5 text-muted-text" />
                {business.address}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-border pt-4">
              <div>
                <span className="text-secondary-text text-[9px] font-normal uppercase tracking-wider block font-mono">Google Rating</span>
                <div className="flex items-center gap-1 text-xs text-foreground mt-1 font-mono">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{business.rating}</span>
                  <span className="text-muted-text font-normal">({business.reviews_count} reviews)</span>
                </div>
              </div>
              <div>
                <span className="text-secondary-text text-[9px] font-normal uppercase tracking-wider block font-mono">Website Domain</span>
                <span className="text-xs text-foreground font-semibold truncate block mt-1">
                  {business.website ? (
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-secondary-text" />
                      {business.website.replace('https://www.', '')}
                    </a>
                  ) : (
                    'None Detected'
                  )}
                </span>
              </div>
              <div>
                <span className="text-secondary-text text-[9px] font-normal uppercase tracking-wider block font-mono">Phone Line</span>
                <span className="text-xs text-foreground font-semibold block mt-1 font-mono">{business.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 border-t border-border pt-6 mt-6">
            <button
              onClick={handleCopyReport}
              className="bg-background hover:bg-secondary-bg border border-border text-foreground text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-text" />}
              {copied ? 'Copied Report' : 'Copy Report'}
            </button>
            <button
              onClick={() => router.push(`/dashboard/pitch?bizId={business.id}`)}
              className="bg-gradient-to-r from-primary to-[#14B88C] hover:opacity-95 text-on-primary text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
            >
              <Sparkles className="w-3.5 h-3.5 text-on-primary" />
              Generate Pitch Copy
            </button>
          </div>
        </div>

        {/* Intelligence Metrics Panel */}
        <div className="bg-secondary-bg border border-border p-6 w-full lg:w-96 flex flex-col gap-6 rounded-2xl shadow-xl relative overflow-hidden">
          {/* Radial score container */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="var(--background)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke={scored.opportunityScore >= 60 ? 'var(--primary)' : scored.opportunityScore >= 35 ? '#F5A623' : '#FF5C5C'}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - scored.opportunityScore / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-semibold text-foreground tracking-tight">{scored.opportunityScore}</span>
                <span className="text-[7px] text-muted-text uppercase tracking-widest font-normal mt-0.5 font-mono">OPPORTUNITY</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className={`text-[9px] font-normal px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-mono inline-block ${
                scored.opportunityScore >= 60 ? 'text-primary bg-primary/10 border-primary/20' : scored.opportunityScore >= 35 ? 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/20' : 'text-[#FF5C5C] bg-[#FF5C5C]/10 border-[#FF5C5C]/20'
              }`}>
                {scored.opportunityLevel} Opportunity
              </div>
              <div className="text-xs text-secondary-text font-mono font-normal">LocalRadar Intelligence Engine™</div>
            </div>
          </div>

          {/* All 4 Metrics */}
          <div className="space-y-3.5 font-mono">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2 text-secondary-text text-xs">
                <Target className="w-4 h-4 text-secondary-text" />
                <span>Opportunity Score™</span>
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                scored.opportunityScore >= 60 ? 'text-primary' : scored.opportunityScore >= 35 ? 'text-[#F5A623]' : 'text-[#FF5C5C]'
              }`}>
                {scored.opportunityScore}/100
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-2.5 font-normal">
              <div className="flex items-center gap-2 text-secondary-text text-xs">
                <Layers className="w-4 h-4 text-secondary-text" />
                <span>Service Fit Engine™</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getFitColor(scored.bestFit.level)}`}>
                {scored.bestFit.agencyType}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border pb-2.5 font-normal">
              <div className="flex items-center gap-2 text-secondary-text text-xs">
                <TrendingUp className="w-4 h-4 text-secondary-text" />
                <span>Closing Probability™</span>
              </div>
              <span className={`text-xs font-semibold ${
                scored.closingProbability >= 70 
                  ? 'text-primary' 
                  : scored.closingProbability >= 40 
                    ? 'text-[#F5A623]' 
                    : 'text-[#FF5C5C]'
              }`}>
                {scored.closingProbability}%
              </span>
            </div>

            <div className="flex items-center justify-between font-normal">
              <div className="flex items-center gap-2 text-secondary-text text-xs">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Revenue Potential™</span>
              </div>
              <span className="text-xs font-semibold text-primary">
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
          <div className="bg-secondary-bg border border-border p-6 space-y-6 rounded-2xl shadow-xl">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider font-mono">
              <ListTodo className="w-4 h-4 text-secondary-text" />
              AI Vulnerability Diagnostics
            </h2>

            <div className="space-y-6 font-normal">
              {sections.map((sec) => {
                const percent = sec.max > 0 ? (sec.score / sec.max) * 100 : 0;
                const isActive = sec.score > 0;
                return (
                  <div key={sec.title} className="border-b border-border pb-5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-foreground">{sec.title}</span>
                      <span className="text-xs text-secondary-text font-mono">
                        +{sec.score} / {sec.max} points
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-background h-2 rounded-full border border-border overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isActive ? 'bg-[#FF5C5C]' : 'bg-primary'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Issues checklist */}
                    <div className="mt-3.5 space-y-2">
                      {sec.issues.length > 0 ? (
                        sec.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-[#FF5C5C] bg-[#FF5C5C]/5 border border-[#FF5C5C]/15 p-2.5 rounded-xl font-mono">
                            <AlertTriangle className="w-3.5 h-3.5 text-[#FF5C5C] shrink-0 mt-0.5" />
                            <span>{issue}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2.5 text-xs text-primary bg-primary/5 border border-primary/15 p-2.5 rounded-xl font-mono">
                          <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
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
          <div className="bg-secondary-bg border border-border p-6 space-y-4 rounded-2xl shadow-xl">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider font-mono">
              <Layers className="w-4 h-4 text-secondary-text" />
              Service Fit Engine™ — Agency Compatibility
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scored.serviceFitScores.map(fit => (
                <div key={fit.agencyType} className="bg-background border border-border p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-foreground">{fit.agencyType}</span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border font-mono ${getFitColor(fit.level)}`}>
                      {fit.level}
                    </span>
                  </div>
                  
                  {/* Score bar */}
                  <div className="w-full bg-secondary-bg h-1.5 border border-border rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full ${fit.score >= 70 ? 'bg-foreground' : fit.score >= 45 ? 'bg-secondary-text' : fit.score >= 20 ? 'bg-[#F5A623]' : 'bg-muted-text'}`}
                      style={{ width: `${fit.score}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] font-mono font-normal">
                    <span className="text-secondary-text">Compatibility</span>
                    <span className="font-semibold text-foreground">{fit.score}/100</span>
                  </div>
                  
                  {fit.reasons.length > 0 && (
                    <div className="mt-2 space-y-1 font-normal">
                      {fit.reasons.slice(0, 2).map((r, i) => (
                        <div key={i} className="text-[9px] text-secondary-text font-mono">• {r}</div>
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
          <div className="bg-secondary-bg border border-border p-6 space-y-4 rounded-2xl shadow-xl">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider font-mono">
              <Building2 className="w-4 h-4 text-secondary-text" />
              Competitor Gap Analysis
            </h3>
            
            <div className="space-y-3">
              {/* Subject Business card */}
              <div className="bg-border border border-border p-3 rounded-xl shadow-md">
                <p className="text-xs font-semibold text-foreground truncate">{business.name}</p>
                <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-secondary-text font-mono font-normal">
                  <div>
                    <span>Rating:</span>
                    <span className="text-foreground font-semibold block mt-0.5">⭐ {business.rating}</span>
                  </div>
                  <div>
                    <span>Reviews:</span>
                    <span className="text-foreground font-semibold block mt-0.5">{business.reviews_count}</span>
                  </div>
                  <div>
                    <span>Opp. Score:</span>
                    <span className={`font-semibold block mt-0.5 ${scored.opportunityScore >= 60 ? 'text-primary' : scored.opportunityScore >= 35 ? 'text-[#F5A623]' : 'text-[#FF5C5C]'}`}>{scored.opportunityScore}</span>
                  </div>
                </div>
              </div>

              {/* Competitors list */}
              {competitors.map((comp) => (
                <div key={comp.id} className="bg-background border border-border p-3 rounded-xl">
                  <p className="text-xs font-semibold text-foreground truncate">{comp.name}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-secondary-text font-mono font-normal">
                    <div>
                      <span>Rating:</span>
                      <span className="text-foreground font-semibold block mt-0.5">⭐ {comp.rating}</span>
                    </div>
                    <div>
                      <span>Reviews:</span>
                      <span className="text-foreground font-semibold block mt-0.5">{comp.reviews_count}</span>
                    </div>
                    <div>
                      <span>SEO Score:</span>
                      <span className="text-foreground font-semibold block mt-0.5">{comp.seo_score}/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Services Panel */}
          <div className="bg-secondary-bg border border-border p-6 space-y-4 rounded-2xl shadow-xl">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-secondary-text" />
              Recommended Pitches
            </h3>
            
            <div className="space-y-2.5">
              {audit.recommended_services.map((service, idx) => (
                <div key={idx} className="bg-background border border-border p-3.5 rounded-xl flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-border border border-border flex items-center justify-center font-normal text-[9px] text-foreground mt-0.5 shrink-0 font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-xs text-foreground font-semibold leading-relaxed">{service.split(' (')[0]}</p>
                    <p className="text-[10px] text-primary font-semibold mt-1 font-mono">
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
      <div className="absolute inset-0 border-4 border-border rounded-full"></div>
      <div className="absolute inset-0 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
