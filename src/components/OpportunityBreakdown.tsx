'use client';

import React from 'react';
import { Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreakdownComponent {
  score: number;
  maxScore: number;
}

interface OpportunityBreakdownProps {
  score: number;
  websiteOpportunity: BreakdownComponent;
  reviewGap: BreakdownComponent;
  gbpWeakness: BreakdownComponent;
  revenueLeakage: BreakdownComponent;
  growthIntent: BreakdownComponent;
}

export default function OpportunityBreakdown({
  score,
  websiteOpportunity,
  reviewGap,
  gbpWeakness,
  revenueLeakage,
  growthIntent
}: OpportunityBreakdownProps) {
  
  const components = [
    { label: 'Website Opportunity', score: websiteOpportunity.score, max: websiteOpportunity.maxScore },
    { label: 'Review Gap Deficit', score: reviewGap.score, max: reviewGap.maxScore },
    { label: 'Google Business Weakness', score: gbpWeakness.score, max: gbpWeakness.maxScore },
    { label: 'Revenue Leakage Points', score: revenueLeakage.score, max: revenueLeakage.maxScore },
    { label: 'Growth Intent Indicator', score: growthIntent.score, max: growthIntent.maxScore }
  ];

  return (
    <div className="bg-[#141517] border border-[#26282D] p-5 rounded-xl space-y-4">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-[#26282D] pb-3">
        <h3 className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5 uppercase tracking-wider font-mono">
          <Target className="w-4 h-4 text-[#A1A1AA]" />
          Opportunity Score™ Breakdown
        </h3>
        <span className={`text-sm font-mono font-semibold ${
          score >= 60 ? 'text-[#2DD4A7]' : score >= 35 ? 'text-[#F5A623]' : 'text-[#FF5C5C]'
        }`}>
          {score} / 100
        </span>
      </div>

      {/* Progress Bars Stack */}
      <div className="space-y-4 font-mono">
        {components.map((c, idx) => {
          const percentage = c.max > 0 ? (c.score / c.max) * 100 : 0;
          return (
            <div key={c.label} className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#FFFFFF]">
                <span className="text-[#A1A1AA] font-sans font-normal">{c.label}</span>
                <span className="font-semibold text-white">
                  +{c.score} <span className="text-[#71717A] font-normal">/ {c.max}</span>
                </span>
              </div>
              
              <div className="h-2 bg-[#141517] rounded-full overflow-hidden border border-[#26282D]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    percentage >= 70 
                      ? 'bg-[#FF5C5C]' 
                      : percentage >= 35 
                        ? 'bg-[#F5A623]' 
                        : 'bg-[#A1A1AA]'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
