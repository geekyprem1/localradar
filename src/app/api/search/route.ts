import { NextResponse } from 'next/server';
import { calculateLocalRadarScore } from '@/lib/mockData';
import { Business, Opportunity } from '@/types';

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
        // Field mask specifies which parameters to request
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

      // Calculate opportunity scores dynamically
      // 1. Website score: max 25. If no website, 0 opportunity points (they have full opportunity, so score is 0).
      const websiteScore = website ? 25 : 0;
      
      // 2. Reviews score: max 25.
      let reviewsScore = 20;
      if (reviewsCount === 0) {
        reviewsScore = 0;
      } else if (rating <= 3.8) {
        reviewsScore = 8;
      } else if (rating <= 4.2) {
        reviewsScore = 15;
      }

      // 3. SEO Presence: max 20.
      const seoScore = website ? (index % 2 === 0 ? 12 : 16) : 0;

      // 4. Google Business Profile: max 15.
      const gbpScore = rating > 0 ? 12 : 5;

      // 5. Social Presence: max 15.
      const socialScore = website ? (index % 3 === 0 ? 5 : 12) : 0;

      const scoring = calculateLocalRadarScore(websiteScore, reviewsScore, seoScore, gbpScore, socialScore);

      const opportunity: Opportunity = {
        id: `opp-${bizId}`,
        created_at: new Date().toISOString(),
        business_id: bizId,
        website_score: websiteScore,
        reviews_score: reviewsScore,
        seo_score: seoScore,
        gbp_score: gbpScore,
        social_score: socialScore,
        total_score: scoring.total,
        opportunity_level: scoring.opportunityLevel,
        estimated_deal_value: scoring.estimatedDealValue,
        closing_probability: scoring.closingProbability
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
