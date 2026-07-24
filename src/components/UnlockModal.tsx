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
  const { updateSubscriptionTier, user } = useAuth();
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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch {
        // ignore
      }
      if (user?.is_mock) {
        headers['x-is-sandbox'] = 'true';
        headers['x-user-id'] = user.id;
        headers['x-org-id'] = 'mock-org-123';
        headers['x-user-tier'] = user.subscription_tier;
      }

      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers,
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
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden
          />

          {/* Modal — theme-aware surfaces (readable in light + dark) */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unlock-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-secondary-bg p-6 shadow-2xl"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#2DD4A7]/10 blur-3xl" />

            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-border bg-background p-2">
                  {type === 'developer_keys' ? (
                    <Code className="h-5 w-5 text-primary" aria-hidden />
                  ) : (
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                  )}
                </div>
                <h3 id="unlock-modal-title" className="text-lg font-bold tracking-tight text-foreground">
                  {config.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-md p-1 text-secondary-text transition-colors hover:bg-background hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-secondary-text">
                {config.description}
              </p>

              {/* Features — inset panel with guaranteed contrast */}
              <div className="space-y-2.5 rounded-xl border border-border bg-background p-4">
                {config.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5 text-xs text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="font-medium leading-snug text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-baseline justify-between px-0.5 py-1.5">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-secondary-text">
                    Subscription Cost
                  </span>
                  <span className="block text-lg font-bold text-foreground">{config.price}</span>
                </div>
                <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[10px] text-secondary-text">
                  Cancel Anytime
                </span>
              </div>

              <button
                type="button"
                disabled={isUpgrading}
                onClick={handleUpgrade}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2DD4A7] px-4 py-3 text-sm font-semibold text-[#042F2E] transition-all hover:bg-[#3ee2b6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Upgrading Plan...
                  </>
                ) : (
                  <>
                    {config.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full cursor-pointer pt-1 text-center text-xs text-secondary-text transition-colors hover:text-foreground"
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
