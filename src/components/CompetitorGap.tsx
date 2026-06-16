'use client';

import React from 'react';
import { Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompetitorGapProps {
  businessName: string;
  rating: number;
  reviewsCount: number;
  hasWebsite: boolean;
  noBookingSystem: boolean;
  competitorAvgReviews: number;
  competitorAvgRating: number;
}

export default function CompetitorGap({
  businessName,
  rating,
  reviewsCount,
  hasWebsite,
  noBookingSystem,
  competitorAvgReviews,
  competitorAvgRating
}: CompetitorGapProps) {
  
  const parameters = [
    {
      label: 'Google Reviews',
      bizVal: reviewsCount,
      bizText: `${reviewsCount} reviews`,
      compVal: competitorAvgReviews,
      compText: `${competitorAvgReviews} reviews`,
      // Normalize reviews bar range. Cap at max of either or fallback to 100
      max: Math.max(reviewsCount, competitorAvgReviews, 50),
      type: 'numeric'
    },
    {
      label: 'Google Rating',
      bizVal: rating,
      bizText: `${rating} ⭐`,
      compVal: competitorAvgRating,
      compText: `${competitorAvgRating} ⭐`,
      max: 5,
      type: 'numeric'
    },
    {
      label: 'Website Domain',
      bizVal: hasWebsite ? 100 : 0,
      bizText: hasWebsite ? 'Active' : 'Missing',
      compVal: 85, // Competitors benchmark
      compText: '85% Active',
      max: 100,
      type: 'boolean'
    },
    {
      label: 'Booking System',
      bizVal: noBookingSystem ? 0 : 100,
      bizText: noBookingSystem ? 'Missing' : 'Active',
      compVal: 70, // Competitors benchmark
      compText: '70% Active',
      max: 100,
      type: 'boolean'
    },
    {
      label: 'Local SEO Index',
      bizVal: hasWebsite && rating >= 4.0 ? 80 : 35,
      bizText: hasWebsite && rating >= 4.0 ? 'Strong' : 'Weak',
      compVal: 75,
      compText: '75% Index',
      max: 100,
      type: 'boolean'
    }
  ];

  return (
    <div className="bg-[#141517] border border-[#26282D] p-5 rounded-xl space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-[#26282D] pb-3">
        <h3 className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5 uppercase tracking-wider font-mono">
          <Users className="w-4 h-4 text-[#10B981]" />
          Competitor Gap Analysis
        </h3>
        <div className="flex gap-4 text-[9px] font-mono">
          <span className="flex items-center gap-1 font-normal text-[#71717A]">
            <span className="w-2 h-2 rounded bg-white inline-block" /> Target
          </span>
          <span className="flex items-center gap-1 font-normal text-[#71717A]">
            <span className="w-2 h-2 rounded bg-[#71717A] inline-block" /> Comp Avg
          </span>
        </div>
      </div>

      {/* Comparative chart bars */}
      <div className="space-y-4 font-mono">
        {parameters.map((param, idx) => {
          const bizPercentage = Math.min(100, (param.bizVal / param.max) * 100);
          const compPercentage = Math.min(100, (param.compVal / param.max) * 100);
          
          return (
            <div key={param.label} className="space-y-1 text-xs">
              <div className="flex justify-between text-white text-[10px]">
                <span className="text-[#A1A1AA] font-sans font-normal">{param.label}</span>
                <div className="flex gap-2">
                  <span className="text-white font-semibold">{param.bizText}</span>
                  <span className="text-[#71717A] font-normal">vs</span>
                  <span className="text-[#A1A1AA] font-normal">{param.compText}</span>
                </div>
              </div>

              {/* Stacked comparison bar */}
              <div className="space-y-1 pt-0.5">
                {/* Business Bar */}
                <div className="h-1.5 bg-[#141517] rounded-full overflow-hidden border border-[#26282D] relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${bizPercentage}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.04 }}
                    className="h-full bg-white"
                  />
                </div>
                {/* Competitor Average Bar */}
                <div className="h-1.5 bg-[#141517] rounded-full overflow-hidden border border-[#26282D] relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${compPercentage}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.04 }}
                    className="h-full bg-[#71717A]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
