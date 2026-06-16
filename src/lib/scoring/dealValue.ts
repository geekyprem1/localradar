import { BusinessSignals, DealValueResult } from '@/types/scoring';

type BusinessSize = 'Solo Practice' | 'Small Clinic' | 'Growing Business' | 'Multi-location Business' | 'Enterprise Local Brand';

export function detectBusinessSize(
  reviewsCount: number,
  rating: number,
  name: string = ''
): BusinessSize {
  const nameLower = name.toLowerCase();
  
  // Enterprise Local Brand check
  if (reviewsCount >= 400 || nameLower.includes('enterprise') || nameLower.includes('national') || nameLower.includes('center')) {
    return 'Enterprise Local Brand';
  }
  
  // Multi-location Business check
  if (reviewsCount >= 150 || nameLower.includes('chain') || nameLower.includes('group') || nameLower.includes('associates') || nameLower.includes('partners') || nameLower.includes('clinic of') || nameLower.includes('hospital')) {
    return 'Multi-location Business';
  }

  // Growing Business check
  if (reviewsCount >= 50) {
    return 'Growing Business';
  }

  // Solo Practice check
  if (reviewsCount < 15 && (rating < 4.0 || nameLower.includes('dr.') || nameLower.includes('individual') || nameLower.includes('solo'))) {
    return 'Solo Practice';
  }

  // Default fallback is Small Clinic
  return 'Small Clinic';
}

function getNormalizedCategory(cat?: string): 'dentist' | 'plumber' | 'lawyer' | 'gym' | 'default' {
  if (!cat) return 'default';
  const c = cat.toLowerCase();
  if (c.includes('dent')) return 'dentist';
  if (c.includes('plumb')) return 'plumber';
  if (c.includes('law') || c.includes('legal') || c.includes('attorney')) return 'lawyer';
  if (c.includes('gym') || c.includes('fit') || c.includes('crossfit') || c.includes('yoga')) return 'gym';
  return 'default';
}

export function calculateDealValue(
  signals: BusinessSignals,
  opportunityScore: number,
  category?: string,
  address: string = '',
  businessName: string = ''
): DealValueResult {
  const size = detectBusinessSize(signals.reviewCount, signals.rating, businessName);
  const cat = getNormalizedCategory(category);

  // 1. Establish Pricing Ranges based on Category and Size
  let min = 10000;
  let max = 30000;

  if (cat === 'dentist') {
    if (size === 'Solo Practice') { min = 15000; max = 45000; }
    else if (size === 'Small Clinic') { min = 40000; max = 120000; }
    else if (size === 'Growing Business') { min = 80000; max = 300000; }
    else if (size === 'Multi-location Business') { min = 200000; max = 800000; }
    else { min = 500000; max = 1500000; }
  } else if (cat === 'plumber') {
    if (size === 'Solo Practice') { min = 10000; max = 30000; }
    else if (size === 'Small Clinic') { min = 25000; max = 75000; }
    else if (size === 'Growing Business') { min = 50000; max = 150000; }
    else if (size === 'Multi-location Business') { min = 120000; max = 350000; }
    else { min = 300000; max = 900000; }
  } else if (cat === 'lawyer') {
    if (size === 'Solo Practice') { min = 25000; max = 75000; }
    else if (size === 'Small Clinic') { min = 60000; max = 180000; }
    else if (size === 'Growing Business') { min = 120000; max = 350000; }
    else if (size === 'Multi-location Business') { min = 250000; max = 800000; }
    else { min = 500000; max = 1800000; }
  } else if (cat === 'gym') {
    if (size === 'Solo Practice') { min = 10000; max = 30000; }
    else if (size === 'Small Clinic') { min = 25000; max = 80000; }
    else if (size === 'Growing Business') { min = 60000; max = 180000; }
    else if (size === 'Multi-location Business') { min = 150000; max = 500000; }
    else { min = 300000; max = 1000000; }
  } else {
    // Default general local business pricing
    if (size === 'Solo Practice') { min = 10000; max = 30000; }
    else if (size === 'Small Clinic') { min = 25000; max = 85000; }
    else if (size === 'Growing Business') { min = 55000; max = 180000; }
    else if (size === 'Multi-location Business') { min = 150000; max = 450000; }
    else { min = 300000; max = 1000000; }
  }

  // 2. Location Multiplier (Tier-1 cities / metros support higher pricing)
  const addrLower = address.toLowerCase();
  const tier1Metros = ['delhi', 'austin', 'dallas', 'new york', 'london', 'mumbai', 'bengaluru', 'los angeles', 'chicago'];
  const isTier1 = tier1Metros.some(city => addrLower.includes(city));
  if (isTier1) {
    min = Math.round(min * 1.2);
    max = Math.round(max * 1.2);
  }

  // 3. Competition Multiplier
  const gap = signals.competitorAvgReviews - signals.reviewCount;
  if (gap > 100) {
    min = Math.round(min * 1.15);
    max = Math.round(max * 1.15);
  } else if (gap < 0) {
    min = Math.round(min * 0.9);
    max = Math.round(max * 0.9);
  }

  // 4. Generate applicable services based on signals
  const services: string[] = [];
  
  if (!signals.hasWebsite) {
    services.push('Website Design & Development');
  } else if (signals.isOldWebsite) {
    services.push('Website Redesign & Modernization');
  }

  if (gap > 20 || signals.fewReviews || signals.lowRating) {
    services.push('Review & Reputation Management');
  }

  if (!signals.hasWebsite || signals.isOldWebsite || signals.fewReviews) {
    services.push('Local SEO & Search Optimization');
  }

  if (signals.noBookingSystem) {
    services.push('Online Booking System Setup');
  }

  if (signals.isInstagramOnly || signals.isFacebookOnly) {
    services.push('Social Media Branding & Automation');
  }

  if (services.length === 0) {
    services.push('Digital Audit & Consultation');
  }

  // Formatted string representation
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
