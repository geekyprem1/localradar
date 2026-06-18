'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Loader2, ArrowRight, X, Sparkles, HelpCircle, Code, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'audit' | 'pitch' | 'export' | 'developer_keys';
  onUpgradeSuccess?: (newTier: 'pro' | 'agency' | 'agency_plus') => void;
}

export default function UnlockModal({ isOpen, onClose, type, onUpgradeSuccess }: UnlockModalProps) {
  const { updateSubscriptionTier } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const getModalConfig = () => {
    switch (type) {
      case 'audit':
        return {
          title: 'Unlock Full Intelligence Report™',
          description: 'Unlock our proprietary deep audit drawer to expose local business technical weaknesses.',
          features: [
            'Revenue Potential™ Analysis',
            'Competitor Benchmark™ comparisons',
            'Closing Probability™ forecasting',
            'AI Recommendations™ & Service Fits'
          ],
          cta: 'Upgrade to Pro',
          price: '$29/month',
          targetTier: 'pro' as const,
        };
      case 'pitch':
        return {
          title: 'Unlock AI Pitch Generator™',
          description: 'Leverage hyper-personalized local outreach copy built specifically to close cold prospects.',
          features: [
            'Deterministic Cold Email sequences',
            'Social Media DM Scripts (Instagram/FB)',
            'Multi-channel Follow-up frameworks',
            'Automated Service Value pitches'
          ],
          cta: 'Upgrade to Pro',
          price: '$29/month',
          targetTier: 'pro' as const,
        };
      case 'export':
        return {
          title: 'Unlock PDF & CSV Exports™',
          description: 'Export structured data feeds and generated PDF reports to present directly to prospective clients.',
          features: [
            'Client-ready PDF Audit Exports',
            'Full Pipeline CSV Data feeds',
            'White Label Report options (Agency tier)',
            'Unlimited leads record saving'
          ],
          cta: 'Upgrade to Pro',
          price: '$29/month',
          targetTier: 'pro' as const,
        };
      case 'developer_keys':
        return {
          title: 'Advanced BYOK Locked',
          description: 'Connect your own custom API keys to scale searches up to 5,000/mo and bypass limits.',
          features: [
            'Bring Your Own Keys (BYOK) Toggle',
            'Custom Google Places API configurations',
            'Personal OpenRouter / OpenAI endpoints',
            'Custom Supabase database integration'
          ],
          cta: 'Upgrade to Agency Plus',
          price: '$149/month',
          targetTier: 'agency_plus' as const,
        };
    }
  };

  const config = getModalConfig();

  useEffect(() => {
    if (isOpen) {
      trackEvent('upgrade_modal_opened', { gate_type: type, target_tier: config.targetTier });
    }
  }, [isOpen, type, config.targetTier]);

  const handleUpgrade = async () => {
    trackEvent('upgrade_checkout_started', { target_tier: config.targetTier, gate_type: type });
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: config.targetTier })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        updateSubscriptionTier(config.targetTier);
        if (onUpgradeSuccess) {
          onUpgradeSuccess(config.targetTier);
        }
        onClose();
      } else {
        alert(data.message || 'Upgrade failed.');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      alert('An error occurred during upgrade.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#090A0C] backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="w-full max-w-md bg-[#101113] border border-[#232529] rounded-2xl p-6 shadow-2xl relative overflow-hidden z-10"
          >
            {/* Glowing Accent Ring */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#2DD4A7]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#1C1E22] border border-[#2A2D34] rounded-lg">
                  {type === 'developer_keys' ? (
                    <Code className="w-5 h-5 text-[#2DD4A7]" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-[#2DD4A7]" />
                  )}
                </div>
                <h3 className="text-lg font-bold font-sans text-white tracking-tight">
                  {config.title}
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="text-[#71717A] hover:text-white p-1 hover:bg-[#1C1E22] rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {config.description}
              </p>

              {/* Feature Checklist */}
              <div className="bg-[#141517] border border-[#212328] rounded-xl p-4 space-y-2.5">
                {config.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#E4E4E7]">
                    <Check className="w-4 h-4 text-[#2DD4A7] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Price Details */}
              <div className="flex items-baseline justify-between py-1.5 px-0.5">
                <div>
                  <span className="text-xs text-[#71717A] uppercase tracking-wider font-mono">Subscription Cost</span>
                  <span className="text-white block font-bold text-lg">{config.price}</span>
                </div>
                <span className="text-[10px] text-[#A1A1AA] bg-[#1C1E22] border border-[#2A2D34] py-1 px-2.5 rounded-full font-mono">
                  Cancel Anytime
                </span>
              </div>

              {/* Action Button */}
              <button
                disabled={isUpgrading}
                onClick={handleUpgrade}
                className="w-full flex items-center justify-center gap-2 bg-[#2DD4A7] hover:bg-[#20BE94] text-[#090A0C] font-semibold py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:shadow-[0_0_15px_rgba(45,212,167,0.3)]"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Upgrading Plan...
                  </>
                ) : (
                  <>
                    {config.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full text-center text-xs text-[#71717A] hover:text-white transition-colors pt-1"
              >
                Keep Free Plan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
