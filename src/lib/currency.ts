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

export function getCurrencyForCountry(country?: string | null): CurrencyConfig {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country] ?? DEFAULT_CURRENCY;
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
  const { symbol, locale } = getCurrencyForCountry(country);
  const abs = Math.abs(amount);

  if (country === 'India') {
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
