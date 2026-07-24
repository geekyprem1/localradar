'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RevenueLeakCardsProps {
  hasWebsite: boolean;
  noBookingSystem: boolean;
  noWhatsApp: boolean;
  noLeadForm: boolean;
  reviewsCount: number;
  rating: number;
}

export default function RevenueLeakCards({
  hasWebsite,
  noBookingSystem,
  noWhatsApp,
  noLeadForm,
  reviewsCount,
  rating
}: RevenueLeakCardsProps) {
  
  const leaks = [
    {
      id: 'website',
      active: !hasWebsite,
      label: 'No Custom Website',
      impact: 'Losing 100% of organic search traffic. Mobile users land on competitor web structures instead.',
      category: 'Visibility Gap'
    },
    {
      id: 'booking',
      active: noBookingSystem,
      label: 'No Booking Scheduler',
      impact: 'Digital-first clients bounce instantly due to friction in manual telephone appointments.',
      category: 'Conversion Friction'
    },
    {
      id: 'whatsapp',
      active: noWhatsApp,
      label: 'No Instant WhatsApp Chat',
      impact: 'Fails to capture hot lead micro-inquiries outside business hours, dropping 30%+ of website leads.',
      category: 'Communication Gap'
    },
    {
      id: 'leadform',
      active: noLeadForm,
      label: 'No Active Lead Funnel',
      impact: 'Visitors bounce without any contact capture, missing re-engagement and follow-up sequences.',
      category: 'Data Leakage'
    },
    {
      id: 'reviews',
      active: reviewsCount < 30 || rating < 4.0,
      label: 'Reputation Deficit',
      impact: 'Underperforming Google Maps profile rank lowers listing below competitors in Local 3-Pack.',
      category: 'Trust Barrier'
    }
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-2xs font-semibold text-secondary-text uppercase tracking-widest font-mono">
        Active Revenue Leakage Audits
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
        {leaks.map((leak, idx) => {
          return (
            <motion.div
              key={leak.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                leak.active 
                  ? 'bg-background border-[#FF5C5C]/25 hover:border-[#FF5C5C]/45' 
                  : 'bg-secondary-bg border-border opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className={`text-2xs font-normal font-mono px-1.5 py-0.5 rounded ${
                    leak.active ? 'bg-[#FF5C5C]/10 text-[#FF5C5C]' : 'bg-background text-muted-text border border-border'
                  }`}>
                    {leak.category}
                  </span>
                  
                  {leak.active ? (
                    <AlertTriangle className="w-4 h-4 text-[#FF5C5C]" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  )}
                </div>

                <h5 className={`text-xs font-semibold ${leak.active ? 'text-foreground' : 'text-muted-text'}`}>
                  {leak.label}
                </h5>
                <p className="text-2xs text-secondary-text mt-1 leading-relaxed font-normal">
                  {leak.impact}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-2xs font-mono">
                <span className="text-muted-text font-normal">Status</span>
                <span className={leak.active ? 'text-[#FF5C5C] font-semibold' : 'text-primary font-semibold'}>
                  {leak.active ? '✓ CRITICAL LEAK' : '✓ SECURED'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
