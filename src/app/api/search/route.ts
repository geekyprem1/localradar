import { NextResponse } from 'next/server';
import { Business, Opportunity } from '@/types';
import { scoreBusinessOpportunity } from '@/lib/scoring';
import { generateMockCompetitors } from '@/lib/mockData';

export async function POST(request: Request) {
  try {
    const { niche, city, country } = await request.json();
    
    // Get key from request headers or process.env
    let apiKey = request.headers.get('x-google-places-key') || '';
    if (!apiKey) {
      apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    }

    if (!apiKey || apiKey === 'mock-key') {
      return NextResponse.json({ 
        success: false, 
        message: 'Google Places API Key not configured.' 
      }, { status: 400 });
    }

    const query = `${niche} in ${city}, ${country}`;
    
    // Call the new Google Places API (Text Search)
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'en',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        success: false, 
        message: `Google API Error: ${errorText}` 
      }, { status: response.status });
    }

    const data = await response.json();
    const places = data.places || [];

    const businesses: Business[] = [];
    const opportunities: Record<string, Opportunity> = {};

    places.forEach((place: any, index: number) => {
      const bizId = place.id || `biz-${index}-${Math.floor(Math.random() * 100000)}`;
      
      const website = place.websiteUri || '';
      const rating = place.rating || 0;
      const reviewsCount = place.userRatingCount || 0;
      
      const business: Business = {
        id: bizId,
        created_at: new Date().toISOString(),
        name: place.displayName?.text || 'Local Business',
        website: website,
        rating: rating,
        reviews_count: reviewsCount,
        phone: place.nationalPhoneNumber || '',
        address: place.formattedAddress || '',
        organization_id: 'mock-org-123'
      };

      // Use the Intelligence Engine™ for deterministic scoring
      const competitors = generateMockCompetitors(business);
      const scored = scoreBusinessOpportunity(business, competitors, niche);

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

      businesses.push(business);
      opportunities[bizId] = opportunity;
    });

    return NextResponse.json({
      success: true,
      businesses,
      opportunities
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error.' 
    }, { status: 500 });
  }
}
