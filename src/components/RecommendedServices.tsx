'use client';

import React from 'react';
import { Sparkles, ArrowUpRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecommendedServicesProps {
  hasWebsite: boolean;
  noBookingSystem: boolean;
  noWhatsApp: boolean;
  noLeadForm: boolean;
  reviewsCount: number;
  rating: number;
}

export default function RecommendedServices({
  hasWebsite,
  noBookingSystem,
  noWhatsApp,
  noLeadForm,
  reviewsCount,
  rating
}: RecommendedServicesProps) {
  
  // Build services lists based on active vulnerabilities
  const services = [];

  if (!hasWebsite) {
    services.push({
      name: 'Website Design & Conversion Funnel',
      reason: 'Build a custom optimized mobile landing page to capture map pack and local search searchers.',
      value: 120000
    });
  } else if (rating < 4.0 || reviewsCount < 30) {
    services.push({
      name: 'Local SEO & Reviews Accelerator',
      reason: 'Launch review campaigns and address GBP metadata listings to boost map ranking.',
      value: 45000
    });
  }

  if (noBookingSystem) {
    services.push({
      name: 'AI Appointment Scheduling Agent',
      reason: 'Implement automated voice/SMS and web calendars to secure instant clients 24/7.',
      value: 75000
    });
  }

  if (noWhatsApp || noLeadForm) {
    services.push({
      name: 'AI Lead Capture & WhatsApp Autopilot',
      reason: 'Integrate WhatsApp instant replies and intelligent lead capture funnels.',
      value: 50000
    });
  }

  // Fallback service
  if (services.length === 0) {
    services.push({
      name: 'Agency VIP Retainer Service',
      reason: 'Comprehensive optimization including high-tier local campaigns, SEO audit updates, and review marketing.',
      value: 150000
    });
  }

  const formatIndianCurrency = (num: number) => {
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest font-mono flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-[#A1A1AA]" />
        Service Fit Engine™
      </h4>

      <div className="space-y-3 font-sans">
        {services.map((service, idx) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-[#0B0B0C] border border-[#26282D] p-4 rounded-xl flex items-start justify-between gap-4 relative group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#26282D] border border-[#26282D] flex items-center justify-center font-mono text-[9px] text-white font-normal shrink-0">
                  {idx + 1}
                </span>
                <h5 className="text-xs font-semibold text-white leading-tight">
                  {service.name}
                </h5>
              </div>
              <p className="text-[10px] text-[#A1A1AA] leading-relaxed pl-6 mt-1 font-sans font-normal">
                {service.reason}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[8px] font-normal text-[#71717A] uppercase tracking-wider block font-mono">Value</span>
              <span className="text-[#2DD4A7] font-mono font-semibold text-sm block mt-0.5">
                {formatIndianCurrency(service.value)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
