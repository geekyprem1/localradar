'use client';

import React from 'react';
import { Lightbulb, Send, MessageSquareCode, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface SalesStrategyProps {
  hasWebsite: boolean;
  noBookingSystem: boolean;
  reviewsCount: number;
}

export default function SalesStrategy({
  hasWebsite,
  noBookingSystem,
  reviewsCount
}: SalesStrategyProps) {
  
  // Custom strategy based on signals
  const getStrategy = () => {
    if (!hasWebsite) {
      return {
        pitchFirst: 'Website Modernization Package',
        doNotLeadWith: 'SEO Retainers',
        angle: 'Loss of Organic Intent Traffic',
        rationale: 'Failing to list a dedicated web domain directs 100% of high-intent search traffic straight to local competitors. Propose a basic 3-page landing page setup first.'
      };
    }
    
    if (noBookingSystem) {
      return {
        pitchFirst: 'AI Appointment Scheduling Autopilot',
        doNotLeadWith: 'General Website Redesign',
        angle: 'Friction in Lead Conversion',
        rationale: 'The website is active but lacks direct digital booking systems. Propose implementing an automated SMS calendar assistant as an entry wedge.'
      };
    }
    
    return {
      pitchFirst: 'GBP Map Pack & Review Engine',
      doNotLeadWith: 'AI Bot Integrations',
      angle: 'Google Maps Rank Optimization',
      rationale: 'Focus on review generation, competitor review gap closures, and complete local directory syndication before presenting complex AI options.'
    };
  };

  const strategy = getStrategy();

  return (
    <div className="bg-[#141517] border border-[#26282D] p-5 rounded-xl space-y-4">
      {/* Title */}
      <div className="border-b border-[#26282D] pb-3">
        <h3 className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5 uppercase tracking-wider font-mono">
          <Lightbulb className="w-4 h-4 text-[#A1A1AA]" />
          Outreach & Sales Pitch Strategy
        </h3>
      </div>

      <div className="space-y-4 font-sans text-xs">
        {/* Pitch Angles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
          <div className="p-2.5 bg-[#0B0B0C] border border-[#26282D] rounded-lg">
            <span className="text-[#71717A] block text-[8px] uppercase tracking-widest mb-1 font-normal">Pitch First</span>
            <span className="text-white font-semibold flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#A1A1AA]" />
              {strategy.pitchFirst}
            </span>
          </div>

          <div className="p-2.5 bg-[#0B0B0C] border border-[#26282D] rounded-lg">
            <span className="text-[#71717A] block text-[8px] uppercase tracking-widest mb-1 font-normal">Do Not Lead With</span>
            <span className="text-[#A1A1AA] font-semibold flex items-center gap-1">
              <MessageSquareCode className="w-3.5 h-3.5 text-[#71717A]" />
              {strategy.doNotLeadWith}
            </span>
          </div>

          <div className="p-2.5 bg-[#0B0B0C] border border-[#26282D] rounded-lg">
            <span className="text-[#71717A] block text-[8px] uppercase tracking-widest mb-1 font-normal">Outreach Angle</span>
            <span className="text-white font-semibold flex items-center gap-1">
              <Send className="w-3.5 h-3.5 text-[#A1A1AA]" />
              {strategy.angle}
            </span>
          </div>
        </div>

        {/* Strategy Rationale */}
        <div className="p-3 bg-[#0B0B0C] border border-[#26282D] rounded-lg space-y-1">
          <span className="text-[9px] font-normal text-[#A1A1AA] uppercase tracking-widest font-mono block">AI Strategy Rationale</span>
          <p className="text-[#A1A1AA] leading-relaxed font-sans mt-0.5 font-normal">
            {strategy.rationale}
          </p>
        </div>
      </div>
    </div>
  );
}
