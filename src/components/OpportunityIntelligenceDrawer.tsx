'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Tag, 
  Flame, 
  Bookmark, 
  Send, 
  FileText, 
  PenTool, 
  Check, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Zap,
  ArrowUpRight,
  Lock
} from 'lucide-react';
import WhyThisLead from './WhyThisLead';
import OpportunityBreakdown from './OpportunityBreakdown';
import RevenueLeakCards from './RevenueLeakCards';
import CompetitorGap from './CompetitorGap';
import RecommendedServices from './RecommendedServices';
import SalesStrategy from './SalesStrategy';

import { Business } from '@/types';
import { ScoredOpportunity } from '@/types/scoring';
import { useAuth } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';
import { formatCurrency } from '@/lib/currency';

interface OpportunityIntelligenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  scored: ScoredOpportunity;
  isSaved: boolean;
  onToggleSave: (biz: Business) => void;
  onOpenPitch: (bizId: string) => void;
  onOpenAudit: (bizId: string) => void;
  categoryName?: string; // Optional niche category name e.g. Dentists
  country?: string;
  onLockedAction?: (type: 'audit' | 'pitch' | 'export' | 'developer_keys') => void;
}

export default function OpportunityIntelligenceDrawer({
  isOpen,
  onClose,
  business,
  scored,
  isSaved,
  onToggleSave,
  onOpenPitch,
  onOpenAudit,
  categoryName = 'Agency Lead',
  country,
  onLockedAction
}: OpportunityIntelligenceDrawerProps) {
  const { user } = useAuth();
  const isFree = user?.subscription_tier === 'free';
  
  // Local states for persistence of hot lead and notes
  const [isHotLead, setIsHotLead] = useState(false);
  const [notes, setNotes] = useState('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  useEffect(() => {
    if (business.id) {
      setIsHotLead(localStorage.getItem(`localradar_hot_${business.id}`) === 'true');
      setNotes(localStorage.getItem(`localradar_notes_${business.id}`) || '');
    }
  }, [business.id]);

  const toggleHotLead = () => {
    const nextVal = !isHotLead;
    setIsHotLead(nextVal);
    localStorage.setItem(`localradar_hot_${business.id}`, nextVal ? 'true' : 'false');
  };

  const handleSaveNotes = () => {
    localStorage.setItem(`localradar_notes_${business.id}`, notes);
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2000);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 60) return 'text-primary bg-primary/10 border-primary/20';
    if (score >= 35) return 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/20';
    return 'text-[#FF5C5C] bg-[#FF5C5C]/10 border-[#FF5C5C]/20';
  };

  const formatMoney = (val: number) => formatCurrency(val, country);

  // Extract variables for sub-components
  const signals = {
    hasWebsite: scored.breakdown.websiteOpportunity.score < 20,
    reviewGap: scored.breakdown.reviewGap.score * 10, // heuristic representation of gap
    noBookingSystem: scored.breakdown.revenueLeakage.reasons.some(r => r.includes('booking')),
    noWhatsApp: scored.breakdown.revenueLeakage.reasons.some(r => r.includes('WhatsApp') || r.includes('chat')),
    noLeadForm: scored.breakdown.revenueLeakage.reasons.some(r => r.includes('lead')),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Drawer Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#000000] backdrop-blur-sm z-40 cursor-pointer"
          />

          {/* Drawer Main Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full md:w-[650px] bg-background border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 overflow-y-auto p-6 font-sans text-foreground flex flex-col justify-between"
          >
            <div>
              {/* Header section */}
              <div className="flex items-start justify-between border-b border-border pb-5">
                <div className="space-y-1.5 max-w-[85%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xs font-normal text-foreground bg-border border border-border px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                      Opportunity Intelligence Dossier
                    </span>
                    <span className="text-2xs text-secondary-text bg-secondary-bg border border-border px-2 py-0.5 rounded font-mono uppercase font-normal">
                      {categoryName}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {business.name}
                  </h2>
                  
                  <div className="text-2xs text-secondary-text font-mono font-normal">
                    Generated by <span className="text-foreground font-semibold">LocalRadar Intelligence Engine™</span>
                  </div>
                  <div className="text-2xs text-muted-text font-mono mt-0.5">
                    Confidence: <span className="text-primary font-semibold">{scored.confidenceScore || 85}%</span> (Based on: Review Gap, Website, Activity, Competition)
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-muted-text font-mono truncate">
                    <MapPin className="w-3.5 h-3.5 text-muted-text shrink-0" />
                    <span>{business.address}</span>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-lg border border-border bg-secondary-bg text-secondary-text hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Header Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 my-5 font-mono">
                <div className="p-3 bg-background border border-border rounded-xl relative">
                  <span className="text-2xs font-normal text-muted-text uppercase tracking-widest block">Opportunity Engine™</span>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className={`text-xl font-semibold ${scored.opportunityScore >= 60 ? 'text-primary' : scored.opportunityScore >= 35 ? 'text-[#F5A623]' : 'text-[#FF5C5C]'}`}>{scored.opportunityScore}</span>
                    <span className="text-2xs text-muted-text font-normal">/100</span>
                  </div>
                  <span className={`text-2xs font-normal px-1.5 py-0.5 rounded absolute bottom-2.5 right-2.5 ${getScoreBadgeColor(scored.opportunityScore)}`}>
                    {scored.opportunityLevel}
                  </span>
                </div>

                <div className="p-3 bg-background border border-border rounded-xl">
                  <span className="text-2xs font-normal text-muted-text uppercase tracking-widest block">Closing Probability™</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-semibold text-primary">{scored.closingProbability}%</span>
                  </div>
                  <span className="text-2xs text-muted-text block mt-0.5 font-normal">Velocity Target</span>
                </div>

                <div className="p-3 bg-background border border-border rounded-xl">
                  <span className="text-2xs font-normal text-muted-text uppercase tracking-widest block">Revenue Potential™</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-sm font-semibold text-foreground truncate max-w-full">
                      {formatMoney(scored.dealValue.max)}
                    </span>
                  </div>
                  <span className="text-2xs text-primary block mt-0.5 font-normal">Est. Margin Cap</span>
                </div>
              </div>

              {/* Main Sections Stack */}
              <div className="space-y-6">
                
                {/* SECTION 1: Why This Lead? */}
                <WhyThisLead
                  businessName={business.name}
                  hasWebsite={signals.hasWebsite}
                  reviewGap={Math.max(0, (scored.competitorBenchmark?.competitorAvgReviews || 180) - business.reviews_count)}
                  noBookingSystem={signals.noBookingSystem}
                  recommendedService={scored.bestFit.agencyType}
                  dealValueMin={scored.dealValue.min}
                  dealValueMax={scored.dealValue.max}
                  country={country}
                />

                {/* SECTION 1.5: Discovered Contacts */}
                <div className="bg-background border border-border p-5 rounded-xl space-y-3 relative overflow-hidden">
                  {isFree && (
                    <div 
                      onClick={() => {
                        trackEvent('locked_contact_clicked', { business_id: business.id });
                        if (onLockedAction) onLockedAction('audit');
                      }}
                      className="absolute inset-0 bg-background/80 backdrop-blur-[4px] flex flex-col items-center justify-center text-center p-4 z-10 cursor-pointer hover:bg-background/75 transition-all"
                    >
                      <Lock className="w-5 h-5 text-[#F5A623] mb-1.5 animate-pulse" />
                      <span className="text-2xs font-bold text-foreground uppercase tracking-wider font-mono">Contact Discovery Locked</span>
                      <span className="text-2xs text-muted-text mt-0.5">Upgrade to Pro to reveal business emails & pages</span>
                    </div>
                  )}
                  <h4 className="text-xs font-semibold text-secondary-text uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-secondary-text" />
                    Discovered Contacts
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-border pb-2 font-normal text-secondary-text">
                      <span>Business Email</span>
                      <span className="text-foreground font-semibold">{business.business_email || 'Not Discovered'}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-2 font-normal text-secondary-text">
                      <span>Direct Contact Email</span>
                      <span className="text-primary font-semibold">{business.contact_email || 'Not Discovered'}</span>
                    </div>
                    <div className="flex items-center justify-between font-normal text-secondary-text">
                      <span>Contact Page URL</span>
                      {business.contact_page ? (
                        <a 
                          href={business.contact_page} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          Visit Page <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-foreground/40">Not Discovered</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Opportunity Breakdown */}
                <OpportunityBreakdown
                  score={scored.opportunityScore}
                  websiteOpportunity={scored.breakdown.websiteOpportunity}
                  reviewGap={scored.breakdown.reviewGap}
                  gbpWeakness={scored.breakdown.gbpWeakness}
                  revenueLeakage={scored.breakdown.revenueLeakage}
                  growthIntent={scored.breakdown.growthIntent}
                />

                {/* SECTION 3: Revenue Leaks Checklist */}
                <RevenueLeakCards
                  hasWebsite={!signals.hasWebsite}
                  noBookingSystem={signals.noBookingSystem}
                  noWhatsApp={signals.noWhatsApp}
                  noLeadForm={signals.noLeadForm}
                  reviewsCount={business.reviews_count}
                  rating={business.rating}
                />

                {/* SECTION 4: Competitor Gap Analysis */}
                <CompetitorGap
                  businessName={business.name}
                  rating={business.rating}
                  reviewsCount={business.reviews_count}
                  hasWebsite={signals.hasWebsite}
                  noBookingSystem={signals.noBookingSystem}
                  competitorAvgReviews={scored.competitorBenchmark?.competitorAvgReviews ?? 180}
                  competitorAvgRating={scored.competitorBenchmark?.competitorAvgRating ?? 4.5}
                  competitorWebsiteRatio={scored.competitorBenchmark?.competitorWebsiteRatio}
                  competitorBookingRatio={scored.competitorBenchmark?.competitorBookingRatio}
                />

                {/* SECTION 5: Recommended Services */}
                <RecommendedServices
                  hasWebsite={!signals.hasWebsite}
                  noBookingSystem={signals.noBookingSystem}
                  noWhatsApp={signals.noWhatsApp}
                  noLeadForm={signals.noLeadForm}
                  reviewsCount={business.reviews_count}
                  rating={business.rating}
                  country={country}
                />

                {/* SECTION 6: Closing Probability Detail */}
                <div className="bg-background border border-border p-5 rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold text-secondary-text uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-secondary-text" />
                    Closing Probability™
                  </h4>
                  <div className="flex items-center gap-6 font-mono">
                    <div className="text-3xl font-semibold text-primary">
                      {scored.closingProbability}%
                    </div>
                    <div className="text-2xs text-secondary-text space-y-1.5 flex-1 leading-normal">
                      <div className="flex justify-between border-b border-border pb-1 font-normal">
                        <span>Base (Opportunity Score factor)</span>
                        <span className="text-foreground font-semibold">+{Math.round(scored.opportunityScore * 0.4)}%</span>
                      </div>
                      {!signals.hasWebsite && (
                        <div className="flex justify-between border-b border-border pb-1 font-normal">
                          <span>Vulnerability Index (No Website)</span>
                          <span className="text-primary font-semibold">+25%</span>
                        </div>
                      )}
                      {business.reviews_count > 5 && (
                        <div className="flex justify-between border-b border-border pb-1 font-normal">
                          <span>Operational Signal (Recent Activity)</span>
                          <span className="text-primary font-semibold">+20%</span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex justify-between font-normal">
                          <span>Direct Outreach Factor (Contactability)</span>
                          <span className="text-primary font-semibold">+20%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 7: Estimated Deal Value Details */}
                <div className="bg-background border border-border p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-semibold text-secondary-text uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-secondary-text" />
                    Revenue Potential™
                  </h4>
                  <div className="grid grid-cols-3 gap-3 font-mono text-center">
                    <div className="p-2.5 bg-secondary-bg border border-border rounded-lg">
                      <span className="text-muted-text block text-2xs uppercase tracking-widest mb-1 font-normal">Minimum Contract</span>
                      <span className="text-foreground font-semibold text-xs">{formatMoney(scored.dealValue.min)}</span>
                    </div>

                    <div className="p-2.5 bg-secondary-bg border border-border rounded-lg">
                      <span className="text-muted-text block text-2xs uppercase tracking-widest mb-1 font-normal">Maximum Contract</span>
                      <span className="text-foreground font-semibold text-xs">{formatMoney(scored.dealValue.max)}</span>
                    </div>

                    <div className="p-2.5 bg-primary/5 border border-primary/30 rounded-lg">
                      <span className="text-primary block text-2xs uppercase tracking-widest mb-1 font-normal">Recommended Proposal</span>
                      <span className="text-primary font-semibold text-xs">
                        {formatMoney(Math.round((scored.dealValue.min + scored.dealValue.max) / 2))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 8: AI Sales Strategy */}
                <SalesStrategy
                  hasWebsite={!signals.hasWebsite}
                  noBookingSystem={signals.noBookingSystem}
                  reviewsCount={business.reviews_count}
                />

                {/* SECTION 9: Notes & Lead Status configuration */}
                <div className="bg-background border border-border p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-semibold text-secondary-text uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-secondary-text" />
                    Agency Notes & Intel Markers
                  </h4>
                  
                  <div className="space-y-3 font-sans text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleHotLead}
                        className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-mono text-2xs font-semibold cursor-pointer ${
                          isHotLead 
                            ? 'bg-[#F5A623]/10 border-[#F5A623] text-[#F5A623]' 
                            : 'bg-secondary-bg border-border text-secondary-text hover:text-foreground'
                        }`}
                      >
                        <Flame className={`w-3.5 h-3.5 ${isHotLead ? 'fill-[#F5A623] text-[#F5A623]' : 'text-muted-text'}`} />
                        {isHotLead ? 'HOT LEAD ACTIVE' : 'MARK AS HOT LEAD'}
                      </button>
                    </div>

                    <div className="space-y-1.5 font-normal">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add custom notes about phone calls, owner names, or meeting schedules..."
                        rows={3}
                        className="w-full bg-secondary-bg border border-border rounded-lg p-3 text-foreground placeholder-muted-text text-xs focus:outline-none focus:border-foreground transition-colors font-mono font-normal"
                      />
                      <button
                        onClick={handleSaveNotes}
                        className="bg-secondary-bg hover:bg-[#22242a] border border-border text-foreground text-2xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto font-mono cursor-pointer"
                      >
                        {noteSavedFeedback ? <Check className="w-3 h-3 text-primary" /> : null}
                        {noteSavedFeedback ? 'Notes Saved' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Actions Panel at bottom of Drawer */}
            <div className="mt-8 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-background">
              <button
                onClick={() => {
                  if (isFree) {
                    trackEvent('locked_save_lead_clicked', { business_id: business.id });
                    if (onLockedAction) onLockedAction('audit');
                  } else {
                    onToggleSave(business);
                  }
                }}
                className={`w-full py-3 rounded-xl border font-mono text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSaved 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'bg-secondary-bg border-border text-foreground hover:text-primary hover:border-primary/35'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-primary' : ''}`} />
                {isSaved ? 'Lead Saved' : 'Save Lead'}
              </button>

              <button
                onClick={() => {
                  if (isFree) {
                    trackEvent('locked_audit_clicked', { business_id: business.id });
                    if (onLockedAction) onLockedAction('audit');
                  } else {
                    onOpenAudit(business.id);
                  }
                }}
                className="w-full bg-secondary-bg hover:bg-[#22242a] border border-border text-foreground py-3 rounded-xl font-mono text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-muted-text" />
                Audit & Proposal
              </button>

              <button
                onClick={() => {
                  if (isFree) {
                    trackEvent('locked_pitch_clicked', { business_id: business.id });
                    if (onLockedAction) onLockedAction('pitch');
                  } else {
                    onOpenPitch(business.id);
                  }
                }}
                className="w-full bg-gradient-to-r from-primary to-[#14B88C] hover:opacity-95 text-on-primary py-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(45,212,167,0.15)]"
              >
                <Send className="w-4 h-4 text-on-primary" />
                Generate Pitch
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
