import { Business, Opportunity, Audit, Competitor, Pitch } from '@/types';

// Simple seedable random number generator
function seededRandom(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(Math.sin(hash)) % 1;
}

// Scoring logic: Calculates opportunity details based on component scores
export function calculateLocalRadarScore(
  website: number,
  reviews: number,
  seo: number,
  gbp: number,
  social: number
) {
  const total = website + reviews + seo + gbp + social;
  
  // High opportunity means low score (they have many issues and need services)
  let opportunityLevel: 'High' | 'Medium' | 'Low' = 'Low';
  let closingProbability = 15; // percent
  let estimatedDealValue = 1200; // USD

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
    website,
    reviews,
    seo,
    gbp,
    social,
    total,
    opportunityLevel,
    closingProbability,
    estimatedDealValue
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

  // Generate 8 mock leads based on input
  for (let i = 0; i < 8; i++) {
    const seed = `${cat}-${cit}-${i}`;
    const rand = seededRandom(seed);
    
    // Construct name
    const template = businessTemplates[i % businessTemplates.length];
    const cleanCat = category.charAt(0).toUpperCase() + category.slice(1);
    const cleanCity = city.charAt(0).toUpperCase() + city.slice(1);
    const bizName = `${template.prefix} ${cleanCat} of ${cleanCity}`;
    
    // Website state: some don't have websites (huge opportunity!)
    const hasWebsite = rand > 0.25;
    const domain = bizName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    const website = hasWebsite ? `https://www.${domain}` : '';
    
    // Rating & reviews
    const rating = Math.round((2.5 + rand * 2.4) * 10) / 10; // 2.5 to 4.9
    const reviewsCount = Math.floor(rand * 145);

    // Phone format
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

    // Calculate score components based on template conditions
    // Website score max 25
    const websiteScore = hasWebsite ? Math.floor(10 + rand * 15) : 0;
    // Reviews score max 25 (high reviews, high rating = high score; few reviews, bad rating = low score)
    const reviewsScore = Math.floor((rating / 5) * 15 + (reviewsCount > 30 ? 10 : reviewsCount / 3));
    // SEO score max 20
    const seoScore = hasWebsite ? Math.floor(5 + rand * 15) : 0;
    // GBP score max 15
    const gbpScore = rating > 4.0 ? Math.floor(8 + rand * 7) : Math.floor(rand * 10);
    // Social score max 15
    const socialScore = rand > 0.4 ? Math.floor(5 + rand * 10) : 0;

    const scoring = calculateLocalRadarScore(websiteScore, reviewsScore, seoScore, gbpScore, socialScore);

    const opportunity: Opportunity = {
      id: `opp-${bizId}`,
      created_at: new Date().toISOString(),
      business_id: bizId,
      website_score: scoring.website,
      reviews_score: scoring.reviews,
      seo_score: scoring.seo,
      gbp_score: scoring.gbp,
      social_score: scoring.social,
      total_score: scoring.total,
      opportunity_level: scoring.opportunityLevel,
      estimated_deal_value: scoring.estimatedDealValue,
      closing_probability: scoring.closingProbability
    };

    generatedBizs.push(business);
    generatedOpps[bizId] = opportunity;
  }

  return {
    businesses: generatedBizs.sort((a, b) => {
      // Sort by highest opportunity (lowest score first)
      const scoreA = generatedOpps[a.id]?.total_score || 100;
      const scoreB = generatedOpps[b.id]?.total_score || 100;
      return scoreA - scoreB;
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
  if (opp.website_score === 0) {
    websiteIssues.push("No website detected. Business is losing 100% of online visitors.");
    recommendedServices.push("Custom high-converting website design & deployment ($3,000 setup)");
  } else {
    if (opp.website_score < 15) {
      websiteIssues.push("Poor mobile optimization. Layout is broken on iOS & Android devices.");
      websiteIssues.push("Slow page load speed (above 4.2 seconds). High bounce rate.");
      recommendedServices.push("Mobile performance optimization & page speed acceleration ($750)");
    }
    if (opp.website_score < 20) {
      websiteIssues.push("Missing clear call-to-action (CTA) buttons on the header.");
      websiteIssues.push("No SSL secure lock detected or configuration is faulty.");
    }
  }

  // SEO Analysis
  if (opp.seo_score < 10) {
    seoIssues.push("No organic keywords ranking on Google page 1.");
    seoIssues.push("Missing meta tags, title descriptions, and H1 tags on page.");
    recommendedServices.push("Local SEO setup, keyword research & organic tag optimization ($1,200/mo)");
  } else if (opp.seo_score < 16) {
    seoIssues.push("Missing XML Sitemap. Google bots are struggling to crawl pages.");
    seoIssues.push("Broken internal links and missing schema markup.");
  }

  // Reviews Analysis
  if (opp.reviews_score < 10) {
    reviewIssues.push("Critically low review count compared to local industry average.");
    reviewIssues.push("Negative review rating (below 3.8 stars) driving customers to competitors.");
    recommendedServices.push("Review booster & reputation management campaign ($499/mo)");
  } else if (opp.reviews_score < 18) {
    reviewIssues.push("Unanswered reviews. Google prioritizes accounts that reply to reviews.");
    reviewIssues.push("No recent feedback. Last review was submitted over 4 months ago.");
  }

  // GBP Analysis
  if (opp.gbp_score < 8) {
    gbpIssues.push("Unclaimed or unverified Google Business Profile.");
    gbpIssues.push("Missing exact operating hours or correct categories.");
    recommendedServices.push("Google Business Profile setup, claim & optimization ($500)");
  } else if (opp.gbp_score < 12) {
    gbpIssues.push("No photos posted to GBP. Businesses with photos get 35% more clicks.");
    gbpIssues.push("Missing product catalog or Q&A section setup.");
  }

  // Social Analysis
  if (opp.social_score < 8) {
    socialIssues.push("No active social profiles found (Facebook, Instagram, LinkedIn).");
    recommendedServices.push("Social media branding kit & content calendar setup ($800/mo)");
  } else if (opp.social_score < 12) {
    socialIssues.push("Social media profiles are inactive. Last post was 6 months ago.");
    socialIssues.push("Social links on website redirect to broken pages.");
  }

  // Default recommendations if none triggered
  if (recommendedServices.length === 0) {
    recommendedServices.push("AI Chatbot lead capture integration ($500/mo)");
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
  const missingServicesText = audit.recommended_services.map(s => `- ${s}`).join('\n');
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
Opportunity Score: ${opp.website_score}/25 (Website Component)

## Core Issues Identified:
${audit.website_issues.map(i => `- ${i}`).join('\n')}

## Proposed Action Plan:
1. Re-design website layout with high-converting glassmorphic design and clear CTAs.
2. Enable full mobile responsiveness across all viewport sizes.
3. Accelerate load speed under 1.5 seconds.
4. Setup SSL security protocols.

## Investment:
$2,500 One-time Setup Fee`;

  const seoProposal = `# Local SEO & Rankings Expansion Proposal

Prepared for: ${business.name}
Opportunity Score: ${opp.seo_score}/20 (SEO Component)

## Core Issues Identified:
${audit.seo_issues.map(i => `- ${i}`).join('\n')}

## Proposed Action Plan:
1. Conduct keyword optimization on the homepage and core landing pages.
2. Inject Schema markup and local structured metadata.
3. Setup Google Search Console and clean XML sitemaps.
4. Implement review generation campaign to boost local map-pack positioning.

## Investment:
$950 / month Retainer (3-month minimum commitment)`;

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
