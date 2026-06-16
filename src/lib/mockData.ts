import { Business, Opportunity, Audit, Competitor, Pitch } from '@/types';
import { scoreBusinessOpportunity, extractSignals } from '@/lib/scoring';

// Simple seedable random number generator
function seededRandom(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(Math.sin(hash)) % 1;
}

/**
 * @deprecated Use scoreBusinessOpportunity from @/lib/scoring instead.
 * Kept for backward compatibility only.
 */
export function calculateLocalRadarScore(
  website: number,
  reviews: number,
  seo: number,
  gbp: number,
  social: number
) {
  const total = website + reviews + seo + gbp + social;
  
  let opportunityLevel: 'High' | 'Medium' | 'Low' = 'Low';
  let closingProbability = 15;
  let estimatedDealValue = 1200;

  if (total <= 50) {
    opportunityLevel = 'High';
    closingProbability = 85;
    estimatedDealValue = 4800;
  } else if (total <= 75) {
    opportunityLevel = 'Medium';
    closingProbability = 50;
    estimatedDealValue = 2600;
  }

  return {
    website, reviews, seo, gbp, social, total,
    opportunityLevel, closingProbability, estimatedDealValue
  };
}

export function generateLeads(category: string, city: string, country: string): {
  businesses: Business[];
  opportunities: Record<string, Opportunity>;
} {
  const cat = category.toLowerCase().trim();
  const cit = city.toLowerCase().trim();
  
  const businessTemplates = [
    { prefix: 'Elite', suffix: 'Services' },
    { prefix: 'Apex', suffix: 'Group' },
    { prefix: 'Metro', suffix: 'Hub' },
    { prefix: 'Lone Star', suffix: 'Experts' },
    { prefix: 'Summit', suffix: 'Solutions' },
    { prefix: 'Classic', suffix: 'Center' },
    { prefix: 'NextGen', suffix: 'Co.' },
    { prefix: 'Reliable', suffix: 'Works' },
  ];

  const generatedBizs: Business[] = [];
  const generatedOpps: Record<string, Opportunity> = {};

  for (let i = 0; i < 8; i++) {
    const seed = `${cat}-${cit}-${i}`;
    const rand = seededRandom(seed);
    
    const template = businessTemplates[i % businessTemplates.length];
    const cleanCat = category.charAt(0).toUpperCase() + category.slice(1);
    const cleanCity = city.charAt(0).toUpperCase() + city.slice(1);
    const bizName = `${template.prefix} ${cleanCat} of ${cleanCity}`;
    
    const hasWebsite = rand > 0.25;
    const domain = bizName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    const website = hasWebsite ? `https://www.${domain}` : '';
    
    const rating = Math.round((2.5 + rand * 2.4) * 10) / 10;
    const reviewsCount = Math.floor(rand * 145);

    const areaCode = 214 + (i * 7) % 200;
    const phone = `(${areaCode}) 555-${1000 + i * 111}`;
    
    const bizId = `biz-${i}-${Math.floor(rand * 100000)}`;

    const business: Business = {
      id: bizId,
      created_at: new Date().toISOString(),
      name: bizName,
      website,
      rating,
      reviews_count: reviewsCount,
      phone,
      address: `${100 + i * 15} Main Street, ${cleanCity}, ${country.toUpperCase()}`,
      organization_id: 'mock-org-123'
    };

    // Use the Intelligence Engine™ for scoring
    const competitors = generateMockCompetitors(business);
    const scored = scoreBusinessOpportunity(business, competitors);

    const opportunity: Opportunity = {
      id: `opp-${bizId}`,
      created_at: new Date().toISOString(),
      business_id: bizId,
      website_score: scored.websiteScore,
      reviews_score: scored.reviewsScore,
      seo_score: scored.seoScore,
      gbp_score: scored.gbpScore,
      social_score: scored.socialScore,
      total_score: scored.opportunityScore,
      opportunity_level: scored.opportunityLevel,
      estimated_deal_value: scored.dealValue.max,
      closing_probability: scored.closingProbability
    };

    generatedBizs.push(business);
    generatedOpps[bizId] = opportunity;
  }

  return {
    businesses: generatedBizs.sort((a, b) => {
      const scoreA = generatedOpps[a.id]?.total_score || 0;
      const scoreB = generatedOpps[b.id]?.total_score || 0;
      return scoreB - scoreA; // Higher opportunity score first
    }),
    opportunities: generatedOpps
  };
}

export function generateMockAudit(business: Business, opp: Opportunity): Audit {
  const websiteIssues: string[] = [];
  const seoIssues: string[] = [];
  const reviewIssues: string[] = [];
  const gbpIssues: string[] = [];
  const socialIssues: string[] = [];
  const recommendedServices: string[] = [];

  // Website Analysis
  if (opp.website_score >= 20) {
    websiteIssues.push('No website detected. Business is losing 100% of online visitors.');
    recommendedServices.push('Custom high-converting website design & deployment (₹30,000 setup)');
  } else if (opp.website_score >= 15) {
    websiteIssues.push('Outdated website detected. Poor mobile optimization.');
    websiteIssues.push('Slow page load speed (above 4.2 seconds). High bounce rate.');
    recommendedServices.push('Website redesign & mobile optimization (₹15,000)');
  }

  // SEO / GBP Analysis
  if (opp.seo_score >= 10) {
    seoIssues.push('Incomplete Google Business Profile setup detected.');
    seoIssues.push('Missing structured data and local SEO signals.');
    recommendedServices.push('Local SEO & GBP optimization (₹10,000/mo)');
  }

  // Reviews Analysis
  if (opp.reviews_score >= 15) {
    reviewIssues.push('Critical review gap compared to local competitors.');
    reviewIssues.push('Low review velocity — losing local map pack position.');
    recommendedServices.push('Review generation & reputation campaign (₹5,000/mo)');
  } else if (opp.reviews_score >= 10) {
    reviewIssues.push('Moderate review gap detected. Needs improvement.');
  }

  // GBP/Revenue Analysis  
  if (opp.gbp_score >= 8) {
    gbpIssues.push('No booking system or lead capture form detected.');
    gbpIssues.push('Missing appointment scheduling — losing walk-in revenue.');
    recommendedServices.push('Online booking & lead capture setup (₹10,000)');
  }

  // Social Analysis
  if (opp.social_score >= 5) {
    socialIssues.push('Active business but no social media automation.');
    recommendedServices.push('Social media branding & automation (₹8,000/mo)');
  }

  if (recommendedServices.length === 0) {
    recommendedServices.push('AI Chatbot lead capture integration (₹5,000/mo)');
  }

  return {
    id: `audit-${business.id}`,
    created_at: new Date().toISOString(),
    business_id: business.id,
    website_issues: websiteIssues,
    seo_issues: seoIssues,
    review_issues: reviewIssues,
    gbp_issues: gbpIssues,
    social_issues: socialIssues,
    recommended_services: recommendedServices
  };
}

export function generateMockCompetitors(business: Business): Competitor[] {
  const nameParts = business.name.split(' ');
  const category = nameParts.length > 2 ? nameParts[1] : 'Business';
  const city = nameParts.length > 3 ? nameParts.slice(3).join(' ') : 'Local';

  return [
    {
      id: `comp-1-${business.id}`,
      created_at: new Date().toISOString(),
      business_id: business.id,
      name: `Apex ${category} Experts`,
      website: `https://www.apex${category.toLowerCase()}.com`,
      rating: 4.8,
      reviews_count: 312,
      seo_score: 92
    },
    {
      id: `comp-2-${business.id}`,
      created_at: new Date().toISOString(),
      business_id: business.id,
      name: `${city} ${category} Pros`,
      website: `https://www.local${category.toLowerCase()}pros.com`,
      rating: 4.6,
      reviews_count: 184,
      seo_score: 84
    }
  ];
}

export function generateMockPitch(business: Business, opp: Opportunity, audit: Audit): Pitch {
  const scoreVal = opp.total_score;

  const coldEmail = `Subject: Quick question about ${business.name}'s website

Hi Team,

I came across ${business.name} while searching for services in the area, and noticed something interesting. 

Your Google rating is quite solid (${business.rating}/5 stars), but your website is currently costing you potential customers. Our LocalRadar diagnostic scanned your online presence and scored it at ${scoreVal}/100. 

Here are the critical issues we discovered:
${audit.website_issues.slice(0, 2).map(i => `• ${i}`).join('\n')}

We specialize in helping local businesses fix these exact gaps to book more calls automatically.

Would you be open to a quick, 5-minute call this Thursday at 2 PM to walk through our free audit report?

Best regards,

[Your Name]
Local Agency Specialist`;

  const coldDM = `Hey Team at ${business.name}! 👋 

Love your local services. I was auditing local businesses in the area and noticed your Google Business Profile has a few critical issues (unreplied reviews and missing photos) that are lowering your search rank.

Our LocalRadar score for your profile is ${scoreVal}/100. We put together a short checklist showing how you can easily fix this and boost your inbound calls. 

Mind if I drop the link to the checklist here? Zero obligation!`;

  const websiteProposal = `# Web Design & Conversion Optimization Proposal

Prepared for: ${business.name}
Opportunity Score: ${scoreVal}/100

## Core Issues Identified:
${audit.website_issues.map(i => `- ${i}`).join('\n')}

## Proposed Action Plan:
1. Re-design website layout with high-converting glassmorphic design and clear CTAs.
2. Enable full mobile responsiveness across all viewport sizes.
3. Accelerate load speed under 1.5 seconds.
4. Setup SSL security protocols.

## Investment:
₹25,000 One-time Setup Fee`;

  const seoProposal = `# Local SEO & Rankings Expansion Proposal

Prepared for: ${business.name}
Opportunity Score: ${scoreVal}/100

## Core Issues Identified:
${audit.seo_issues.map(i => `- ${i}`).join('\n')}

## Proposed Action Plan:
1. Conduct keyword optimization on the homepage and core landing pages.
2. Inject Schema markup and local structured metadata.
3. Setup Google Search Console and clean XML sitemaps.
4. Implement review generation campaign to boost local map-pack positioning.

## Investment:
₹10,000 / month Retainer (3-month minimum commitment)`;

  return {
    id: `pitch-${business.id}`,
    created_at: new Date().toISOString(),
    business_id: business.id,
    cold_email: coldEmail,
    cold_dm: coldDM,
    website_proposal: websiteProposal,
    seo_proposal: seoProposal
  };
}
