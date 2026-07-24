import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localradar.io';
const SITE_NAME = 'LocalRadar';
const DEFAULT_TITLE = 'LocalRadar | AI Local Growth Intelligence for Agencies & SMBs';
const DEFAULT_DESCRIPTION =
  'Turn Google Maps into your smartest sales channel. AI opportunity scoring, Google Business analysis, lead qualification, and personalized outreach for agencies and SMBs. Start free — no credit card.';

export { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION };

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
} = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const url = `${SITE_URL}${path}`;

  return {
    title: title ? { absolute: fullTitle } : undefined,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: path || '/' },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ['/opengraph-image'],
    },
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: DEFAULT_DESCRIPTION,
    email: 'hello@localradar.io',
    sameAs: [] as string[],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'hello@localradar.io',
        availableLanguage: ['English'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: 'sales@localradar.io',
        availableLanguage: ['English'],
      },
    ],
  };
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free plan with 20 scan credits per month; paid plans unlock audits, outreach, and exports',
    },
    featureList: [
      'AI Opportunity Scoring',
      'Google Business Analysis',
      'Lead Qualification',
      'Personalized Outreach Generation',
      'Competitor Benchmarking',
      'Lead Export',
    ],
  };
}

export function faqSchema(
  items: { q: string; a: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/dashboard/lead-finder`,
      'query-input': 'required name=search_term_string',
    },
  };
}
