import { NextResponse } from 'next/server';
import { Business, Opportunity } from '@/types';
import { scoreBusinessOpportunity } from '@/lib/scoring';
import { generateMockCompetitors, generateLeads } from '@/lib/mockData';
import { getServerUser, validateUsageAndEntitlement, incrementUsage } from '@/lib/entitlements';
import { decrypt } from '@/lib/encryption';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, checkSearchThrottle, checkHourlySearchLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized.' 
      }, { status: 401 });
    }

    const { niche, city, country } = await request.json();
    if (!niche || !city || !country) {
      return NextResponse.json({ 
        success: false, 
        message: 'Niche, city, and country are required.' 
      }, { status: 400 });
    }

    const cleanNiche = niche.trim().toLowerCase();
    const cleanCity = city.trim().toLowerCase();
    const cleanCountry = country.trim().toLowerCase();

    // 1. IP Rate Limiting (max 100 requests per 15 minutes)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, 100);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: 'Too many search attempts. Please try again in 15 minutes.' 
      }, { status: 429 });
    }

    // 2. Search Throttling Protection (min 3 seconds between requests)
    const throttleKey = user.is_mock ? ip : user.organization_id;
    const throttleCheck = await checkSearchThrottle(throttleKey, user.is_mock, 3000);
    if (!throttleCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: 'Please wait 3 seconds between searches.' 
      }, { status: 429 });
    }

    // 2.1 Dynamic Hourly Search Limit Check
    let hourlyLimit = 30;
    if (user.subscription_tier === 'free') hourlyLimit = 5;
    else if (user.subscription_tier === 'pro') hourlyLimit = 30;
    else if (user.subscription_tier === 'agency') hourlyLimit = 50;
    else if (user.subscription_tier === 'agency_plus') hourlyLimit = 100;

    const hourlyCheck = await checkHourlySearchLimit(throttleKey, user.is_mock, hourlyLimit);
    if (!hourlyCheck.allowed) {
      return NextResponse.json({
        success: false,
        message: `Hourly limit reached. You can perform up to ${hourlyLimit} searches per hour.`
      }, { status: 429 });
    }

    // 3. Search History Cache Check (within last 14 days)
    if (!user.is_mock) {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // Query past searches matching inputs
      const { data: cachedSearches, error: searchErr } = await supabase
        .from('searches')
        .select('id, created_at')
        .eq('business_type', cleanNiche)
        .eq('city', cleanCity)
        .eq('country', cleanCountry)
        .gt('created_at', fourteenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!searchErr && cachedSearches && cachedSearches.length > 0) {
        const searchId = cachedSearches[0].id;
        
        // Fetch cached businesses
        const { data: cachedBizs, error: bizErr } = await supabase
          .from('businesses')
          .select('*')
          .eq('search_id', searchId);

        if (!bizErr && cachedBizs && cachedBizs.length > 0) {
          const bizIds = cachedBizs.map(b => b.id);
          
          // Fetch cached opportunities
          const { data: cachedOpps, error: oppErr } = await supabase
            .from('opportunities')
            .select('*')
            .in('business_id', bizIds);

          if (!oppErr && cachedOpps) {
            // Enforce Subscription Limits & Usage Gates for Cache Hits
            const check = await validateUsageAndEntitlement(
              user.organization_id,
              user.subscription_tier,
              'search',
              user.is_mock
            );

            if (!check.allowed) {
              return NextResponse.json({ 
                success: false, 
                reason: check.reason,
                message: check.reason === 'limit_exceeded' 
                  ? 'You have reached your monthly search limit. Please upgrade your plan.' 
                  : 'Feature locked on your current subscription plan.'
              }, { status: 403 });
            }

            // Increment monthly search usage count
            await incrementUsage(
              user.organization_id,
              user.subscription_tier,
              'searches',
              1,
              user.is_mock
            );

            // Log search to DB search_logs for rate-limiting persistent count (even on cache hits)
            await supabase.from('search_logs').insert({
              organization_id: user.organization_id,
              user_id: user.id,
              niche: cleanNiche,
              city: cleanCity,
              country: cleanCountry,
              results_count: cachedBizs.length,
            });

            // Map back to TypeScript interface formats
            const formattedBizs: Business[] = cachedBizs.map(cb => ({
              id: cb.id,
              created_at: cb.created_at,
              search_id: cb.search_id,
              organization_id: cb.organization_id,
              name: cb.name,
              website: cb.website || '',
              rating: Number(cb.rating || 0),
              reviews_count: cb.reviews_count || 0,
              phone: cb.phone || '',
              address: cb.address || '',
              business_email: cb.business_email || '',
              contact_email: cb.contact_email || '',
              contact_page: cb.contact_page || '',
            }));

            const formattedOpps: Record<string, Opportunity> = {};
            cachedOpps.forEach(co => {
              formattedOpps[co.business_id] = {
                id: co.id,
                created_at: co.created_at,
                business_id: co.business_id,
                website_score: co.website_score,
                reviews_score: co.reviews_score,
                seo_score: co.seo_score,
                gbp_score: co.gbp_score,
                social_score: co.social_score,
                total_score: co.total_score,
                opportunity_level: co.opportunity_level as any,
                estimated_deal_value: Number(co.estimated_deal_value || 0),
                closing_probability: Number(co.closing_probability || 0),
              };
            });

            console.log(`[Cache Hit] Returning cached results for ${cleanNiche} in ${cleanCity} (Search ID: ${searchId})`);
            const truncated = truncateResultsForFreePlan(formattedBizs, formattedOpps, user.subscription_tier);
            return NextResponse.json({
              success: true,
              businesses: truncated.businesses,
              opportunities: truncated.opportunities,
              totalResults: truncated.totalResults,
              visibleResults: truncated.visibleResults,
              hiddenResults: truncated.hiddenResults,
              cached: true
            });
          }
        }
      }
    }

    // 4. Enforce Subscription Limits & Usage Gates (Cache Miss)
    const check = await validateUsageAndEntitlement(
      user.organization_id,
      user.subscription_tier,
      'search',
      user.is_mock
    );

    if (!check.allowed) {
      return NextResponse.json({ 
        success: false, 
        reason: check.reason,
        message: check.reason === 'limit_exceeded' 
          ? 'You have reached your monthly search limit. Please upgrade your plan.' 
          : 'Feature locked on your current subscription plan.'
      }, { status: 403 });
    }

    // 5. Increment monthly search usage count (Cache Miss)
    await incrementUsage(
      user.organization_id,
      user.subscription_tier,
      'searches',
      1,
      user.is_mock
    );

    // 6. Free Plan mock handler removed - Free plan now runs live Google Places searches

    // 7. Resolve API Key for Pro, Agency, and Agency Plus
    let apiKey = '';
    if (user.subscription_tier === 'agency_plus' && !user.is_mock) {
      const { data: creds } = await supabase
        .from('byok_credentials')
        .select('*')
        .eq('organization_id', user.organization_id)
        .single();

      if (creds?.byok_enabled && creds?.encrypted_google_places_key) {
        apiKey = decrypt(creds.encrypted_google_places_key);
      }

      if (!apiKey) {
        return NextResponse.json({ 
          success: false, 
          message: 'Google Places API Key is required for the Agency Plus plan. Please configure it in your Settings.' 
        }, { status: 400 });
      }
    }

    if (!apiKey) {
      apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    }

    // 8. Execute search (live vs sandbox fallback)
    if (!apiKey || apiKey === 'mock-key' || user.is_mock) {
      const mockResult = generateLeads(niche, city, country);
      
      if (!user.is_mock) {
        await supabase.from('search_logs').insert({
          organization_id: user.organization_id,
          user_id: user.id,
          niche: cleanNiche,
          city: cleanCity,
          country: cleanCountry,
          results_count: mockResult.businesses.length,
        });
      }

      return NextResponse.json({
        success: true,
        businesses: mockResult.businesses,
        opportunities: mockResult.opportunities
      });
    }

    // Live search execution using Google Places Text Search API
    const query = `${niche} in ${city}, ${country}`;
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
      console.warn(`Google API error status: ${response.status}. Falling back to mock generator.`);
      const mockResult = generateLeads(niche, city, country);
      return NextResponse.json({
        success: true,
        businesses: mockResult.businesses,
        opportunities: mockResult.opportunities
      });
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
      
      let domain = '';
      if (website) {
        try {
          domain = new URL(website).hostname.replace('www.', '');
        } catch (e) {}
      }
      const cleanNameId = (place.displayName?.text || 'localbusiness').toLowerCase().replace(/[^a-z0-9]/g, '');
      const business_email = domain ? `info@${domain}` : `${cleanNameId}@gmail.com`;
      const contact_email = domain ? `owner@${domain}` : `contact.${cleanNameId}@gmail.com`;
      const contact_page = domain ? `${website.endsWith('/') ? website : website + '/'}contact` : `https://facebook.com/${cleanNameId}`;

      const business: Business = {
        id: bizId,
        created_at: new Date().toISOString(),
        name: place.displayName?.text || 'Local Business',
        website: website,
        rating: rating,
        reviews_count: reviewsCount,
        phone: place.nationalPhoneNumber || '',
        address: place.formattedAddress || '',
        organization_id: user.organization_id,
        business_email,
        contact_email,
        contact_page
      };

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

    // 9. Persist newly discovered search, businesses, and opportunities in database for cache
    if (!user.is_mock) {
      // a. Insert searches log
      await supabase.from('search_logs').insert({
        organization_id: user.organization_id,
        user_id: user.id,
        niche: cleanNiche,
        city: cleanCity,
        country: cleanCountry,
        results_count: businesses.length,
      });

      // b. Insert search cache parent record
      const { data: searchRecord } = await supabase
        .from('searches')
        .insert({
          organization_id: user.organization_id,
          business_type: cleanNiche,
          city: cleanCity,
          country: cleanCountry
        })
        .select('id')
        .single();

      const searchId = searchRecord?.id;

      if (searchId && businesses.length > 0) {
        // c. Insert cache businesses child records
        const bizToInsert = businesses.map(b => ({
          search_id: searchId,
          organization_id: user.organization_id,
          name: b.name,
          website: b.website,
          rating: b.rating,
          reviews_count: b.reviews_count,
          phone: b.phone,
          address: b.address,
          business_email: b.business_email,
          contact_email: b.contact_email,
          contact_page: b.contact_page
        }));

        const { data: insertedBizs } = await supabase
          .from('businesses')
          .insert(bizToInsert)
          .select('id, name');

        if (insertedBizs && insertedBizs.length > 0) {
          // d. Insert cache opportunities child records
          const oppsToInsert = insertedBizs.map(ib => {
            const localBiz = businesses.find(b => b.name === ib.name);
            if (!localBiz) return null;
            const localOpp = opportunities[localBiz.id];
            if (!localOpp) return null;

            return {
              business_id: ib.id,
              website_score: localOpp.website_score,
              reviews_score: localOpp.reviews_score,
              seo_score: localOpp.seo_score,
              gbp_score: localOpp.gbp_score,
              social_score: localOpp.social_score,
              total_score: localOpp.total_score,
              opportunity_level: localOpp.opportunity_level,
              estimated_deal_value: localOpp.estimated_deal_value,
              closing_probability: localOpp.closing_probability
            };
          }).filter(o => o !== null);

          if (oppsToInsert.length > 0) {
            await supabase.from('opportunities').insert(oppsToInsert);
          }
        }
      }
    }

    const truncated = truncateResultsForFreePlan(businesses, opportunities, user.subscription_tier);
    return NextResponse.json({
      success: true,
      businesses: truncated.businesses,
      opportunities: truncated.opportunities,
      totalResults: truncated.totalResults,
      visibleResults: truncated.visibleResults,
      hiddenResults: truncated.hiddenResults
    });

  } catch (error: any) {
    console.error('Search Route Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error.' 
    }, { status: 500 });
  }
}

function truncateResultsForFreePlan(
  businesses: Business[],
  opportunities: Record<string, Opportunity>,
  tier: string
) {
  const totalResults = businesses.length;
  if (tier !== 'free') {
    return {
      businesses,
      opportunities,
      totalResults,
      visibleResults: totalResults,
      hiddenResults: 0,
    };
  }

  const visibleBizs = businesses.slice(0, 10);
  const visibleBizIds = new Set(visibleBizs.map(b => b.id));
  
  const visibleOpps: Record<string, Opportunity> = {};
  Object.keys(opportunities).forEach(bizId => {
    if (visibleBizIds.has(bizId)) {
      visibleOpps[bizId] = opportunities[bizId];
    }
  });

  return {
    businesses: visibleBizs,
    opportunities: visibleOpps,
    totalResults,
    visibleResults: visibleBizs.length,
    hiddenResults: Math.max(0, totalResults - visibleBizs.length),
  };
}
