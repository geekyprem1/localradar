import { BusinessSignals, DealValueResult } from '@/types/scoring';

/**
 * Deal Value Engine™ — Deterministic (₹ ranges)
 *
 * Accumulates min/max from applicable services.
 * Each condition adds its own service value range.
 */
export function calculateDealValue(
  signals: BusinessSignals,
  opportunityScore: number
): DealValueResult {
  let min = 0;
  let max = 0;
  const services: string[] = [];

  // No Website → Website Design & Development
  if (!signals.hasWebsite) {
    min += 30000;
    max += 120000;
    services.push('Website Design & Development');
  }

  // Old Website → Website Redesign
  if (signals.hasWebsite && signals.isOldWebsite) {
    min += 15000;
    max += 80000;
    services.push('Website Redesign & Modernization');
  }

  // SEO Problems (low reviews + no website or old website)
  if (!signals.hasWebsite || signals.isOldWebsite || signals.fewReviews) {
    min += 10000;
    max += 50000;
    services.push('Local SEO & Search Optimization');
  }

  // Review Management (low reviews or bad rating)
  if (signals.fewReviews || signals.lowRating) {
    min += 5000;
    max += 25000;
    services.push('Review & Reputation Management');
  }

  // Booking System Missing
  if (signals.noBookingSystem) {
    min += 10000;
    max += 40000;
    services.push('Online Booking System Setup');
  }

  // Social Media Setup
  if (signals.isInstagramOnly || signals.isFacebookOnly || !signals.hasWebsite) {
    min += 5000;
    max += 20000;
    services.push('Social Media Branding & Automation');
  }

  // Minimum baseline if nothing triggered
  if (min === 0) {
    min = 5000;
    max = 15000;
    services.push('Digital Audit & Consultation');
  }

  // Format with Indian number system
  const formatted = `₹${formatIndian(min)} – ₹${formatIndian(max)}`;

  return { min, max, formatted, services };
}

function formatIndian(num: number): string {
  const str = num.toString();
  if (str.length <= 3) return str;
  
  let lastThree = str.substring(str.length - 3);
  const remaining = str.substring(0, str.length - 3);
  if (remaining !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return formatted;
}
