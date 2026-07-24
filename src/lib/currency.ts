export type SupportedCountry =
  | 'United States'
  | 'India'
  | 'Canada'
  | 'United Kingdom'
  | 'Australia';

type CurrencyConfig = {
  code: string;
  locale: string;
  symbol: string;
};

const COUNTRY_CURRENCY: Record<string, CurrencyConfig> = {
  'United States': { code: 'USD', locale: 'en-US', symbol: '$' },
  India: { code: 'INR', locale: 'en-IN', symbol: '₹' },
  Canada: { code: 'CAD', locale: 'en-CA', symbol: 'CA$' },
  'United Kingdom': { code: 'GBP', locale: 'en-GB', symbol: '£' },
  Australia: { code: 'AUD', locale: 'en-AU', symbol: 'A$' },
};

const DEFAULT_CURRENCY = COUNTRY_CURRENCY['United States'];

// Case-insensitive lookup keyed by normalized country name.
const NORMALIZED_COUNTRY_CURRENCY: Record<string, CurrencyConfig> = Object.fromEntries(
  Object.entries(COUNTRY_CURRENCY).map(([name, config]) => [name.trim().toLowerCase(), config])
);

/**
 * Resolve the currency for a country by case-insensitive comparison against the
 * supported set (United States, India, Canada, United Kingdom, Australia).
 * Falls back to the United States currency for empty, null, or unsupported input.
 */
export function getCurrencyForCountry(country?: string | null): CurrencyConfig {
  if (!country) return DEFAULT_CURRENCY;
  return NORMALIZED_COUNTRY_CURRENCY[country.trim().toLowerCase()] ?? DEFAULT_CURRENCY;
}

/** Full currency string, e.g. $12,500 or ₹1,25,000 */
export function formatCurrency(amount: number, country?: string | null): string {
  const { code, locale, symbol } = getCurrencyForCountry(country);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${symbol}${amount.toLocaleString(locale)}`;
  }
}

/**
 * Compact display for dashboard metrics.
 * India → ₹12.5L / ₹1.2Cr; others → $12.5K / $1.2M
 */
export function formatCompactCurrency(amount: number, country?: string | null): string {
  const { code, symbol, locale } = getCurrencyForCountry(country);
  const abs = Math.abs(amount);

  if (code === 'INR') {
    if (abs >= 10_000_000) return `${symbol}${(amount / 10_000_000).toFixed(1)}Cr`;
    if (abs >= 100_000) return `${symbol}${(amount / 100_000).toFixed(1)}L`;
    return `${symbol}${amount.toLocaleString('en-IN')}`;
  }

  if (abs >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toLocaleString(locale)}`;
}

/** Range string used by deal value engine */
export function formatCurrencyRange(
  min: number,
  max: number,
  country?: string | null
): string {
  return `${formatCurrency(min, country)} – ${formatCurrency(max, country)}`;
}
