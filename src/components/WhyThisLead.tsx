'use client';

import React from 'react';
import { Sparkles, DollarSign, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface WhyThisLeadProps {
  businessName: string;
  hasWebsite: boolean;
  reviewGap: number;
  noBookingSystem: boolean;
  recommendedService: string;
  dealValueMin: number;
  dealValueMax: number;
}

export default function WhyThisLead({
  businessName,
  hasWebsite,
  reviewGap,
  noBookingSystem,
  recommendedService,
  dealValueMin,
  dealValueMax
}: WhyThisLeadProps) {
  
  // Format values
  const formatIndianCurrency = (num: number) => {
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#141517] border border-[#26282D] p-5 rounded-xl relative overflow-hidden group"
    >
      {/* Green neon top edge glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#10B981]/30 to-transparent" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#10B981] font-semibold mb-3.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#10B981] animate-pulse" />
          Why This Lead™
        </div>
        <span className="text-[8px] text-[#71717A] lowercase font-normal">Powered by Why This Lead™</span>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-[#FFFFFF] leading-relaxed font-sans font-normal">
          <span className="font-semibold text-white">{businessName}</span> is actively losing high-value local prospects. 
          {!hasWebsite && ' They have no detected web domain, directing all mobile traffic to competitors.'}
          {hasWebsite && ' Their website structure is outdated with conversion friction.'}
          {reviewGap > 30 && ` They suffer from a massive reputation deficit of ${reviewGap} reviews compared to competitors.`}
          {noBookingSystem && ' They offer zero instant booking features, creating massive drop-offs for digital-first clients.'}
        </p>

        {/* Highlight Stats Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-[#26282D] text-xs font-mono">
          <div>
            <span className="text-[#A1A1AA] block mb-1 uppercase tracking-widest text-[9px] font-normal">Est. Opportunity Value</span>
            <span className="text-white font-semibold text-sm flex items-center gap-0.5">
              <DollarSign className="w-3.5 h-3.5 text-[#22C55E]" />
              {formatIndianCurrency(dealValueMin)} - {formatIndianCurrency(dealValueMax)}
            </span>
          </div>
          <div>
            <span className="text-[#A1A1AA] block mb-1 uppercase tracking-widest text-[9px] font-normal">Recommended Entry Service</span>
            <span className="text-[#10B981] font-semibold text-sm flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#10B981]" />
              {recommendedService}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
