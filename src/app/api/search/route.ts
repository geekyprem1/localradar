import { NextResponse } from 'next/server';
import { Business, Opportunity } from '@/types';
import { scoreBusinessOpportunity } from '@/lib/scoring';
import { generateLeads } from '@/lib/mockData';
import { NoGuessContactEnricher, type ContactEnricher, type EnrichedContact } from '@/lib/enrichment/contactEnricher';
import { competitorBenchmarkService, type PlaceLite } from '@/lib/scoring/competitorBenchmark';
import { persistOpportunityCache } from '@/lib/cache/opportunityCache';
import { getServerUser, validateUsageAndEntitlement, incrementUsage } from '@/lib/entitlements';
import { decrypt } from '@/lib/encryption';
import { supabase } from '@/lib/supabase';
import { checkRateLimit, checkSearchThrottle, checkHourlySearchLimit } from '@/lib/rateLimit';
import { isUsableKey } from '@/lib/apiKey';

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

      // Query past searches for THIS organization only (prevent cross-tenant cache leak)
      const { data: cachedSearches, error: searchErr } = await supabase
        .from('searches')
        .select('id, created_at')
        .eq('organization_id', user.organization_id)
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

            // Map back to TypeScript interface formats. Cached rows carry the
            // stable place id + honesty labels persisted at write time; surface
            // them unchanged so cached results retain their provenance (Req 9.7).
            const formattedBizs: Business[] = cachedBizs.map(cb => ({
              id: cb.id,
              created_at: cb.created_at,
              search_id: cb.search_id,
              organization_id: cb.organization_id,
              place_id: cb.place_id || '',
              name: cb.name,
              website: cb.website || '',
              rating: Number(cb.rating || 0),
              reviews_count: cb.reviews_count || 0,
              phone: cb.phone || '',
              address: cb.address || '',
              business_email: cb.business_email || '',
              contact_email: cb.contact_email || '',
              contact_page: cb.contact_page || '',
              contact_provenance: cb.contact_provenance || undefined,
            }));

            const formattedOpps: Record<string, Opportunity> = {};
            cachedOpps.forEach(co => {
              formattedOpps[co.business_id] = {
                id: co.id,
                created_at: co.created_at,
                business_id: co.business_id,
                place_id: co.place_id || '',
                website_score: co.website_score,
                reviews_score: co.reviews_score,
                seo_score: co.seo_score,
                gbp_score: co.gbp_score,
                social_score: co.social_score,
                total_score: co.total_score,
                opportunity_level: co.opportunity_level as any,
                // Preserve a genuinely-null midpoint; never coerce null → 0 (Req 7.5).
                estimated_deal_value:
                  co.estimated_deal_value === null || co.estimated_deal_value === undefined
                    ? null
                    : Number(co.estimated_deal_value),
                deal_value_min:
                  co.deal_value_min === null || co.deal_value_min === undefined
                    ? null
                    : Number(co.deal_value_min),
                deal_value_max:
                  co.deal_value_max === null || co.deal_value_max === undefined
                    ? null
                    : Number(co.deal_value_max),
                deal_value_provenance: co.deal_value_provenance || 'unavailable',
                closing_probability: Number(co.closing_probability || 0),
                confidence: Number(co.confidence || 0),
                // A returned cached result set is always labeled `cache` (Req 9.8).
                data_source: 'cache',
              };
            });

            console.log(`[Cache Hit] Returning cached results for ${cleanNiche} in ${cleanCity} (Search ID: ${searchId})`);
            const truncated = truncateResultsForFreePlan(formattedBizs, formattedOpps, user.subscription_tier);
            return NextResponse.json({
              success: true,
              data_source: 'cache',
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

    // 8. Path selection: sandbox vs live. No silent demo fallback on the live path.
    // Sandbox is the ONLY place mock generation is allowed (fully wired in task 15.3).
    if (user.is_mock) {
      // Forward the searched country into sandbox lead generation (Req 4.6). The same
      // raw `country` value is threaded through here and remains in scope for the live
      // path's scoring call (wired in task 15.4).
      const mockResult = generateLeads(niche, city, country);

      // Flag EVERY returned record as non-real so the client can visibly warn the user,
      // and set a result-set level non-real-data indicator. (Requirements 10.5, 10.7)
      const flaggedBusinesses = mockResult.businesses.map(b => ({ ...b, is_real: false }));
      const flaggedOpportunities: Record<string, Opportunity & { is_real: false }> = {};
      Object.keys(mockResult.opportunities).forEach(bizId => {
        flaggedOpportunities[bizId] = { ...mockResult.opportunities[bizId], is_real: false };
      });

      return NextResponse.json({
        success: true,
        data_source: 'sandbox',
        is_real_data: false,
        businesses: flaggedBusinesses,
        opportunities: flaggedOpportunities,
      });
    }

    // Non-sandbox live path requires a usable real API key. A missing, sentinel,
    // or placeholder key is a configuration error and must never fall back to
    // fabricated demo data. (Requirements 10.1, 10.3, 10.6)
    if (!isUsableKey(apiKey)) {
      return NextResponse.json({
        success: false,
        error_code: 'real_search_not_configured',
        message: 'Real search is not configured.',
      }, { status: 503 });
    }

    // Live search execution using Google Places Text Search API.
    // The provider call is bounded by a 10-second timeout via AbortController.
    // Any provider error, timeout (AbortError), or network failure resolves to a
    // single honest error response that names the provider only as the source and
    // never leaks the raw provider payload, secrets, keys, or stack traces.
    // (Requirements 10.2, 10.4, 12.1, 12.2, 12.5)
    const query = `${niche} in ${city}, ${country}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    let data: any;
    try {
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
        signal: controller.signal,
      });

      if (!response.ok) {
        // Provider responded with a non-2xx status. Return an honest error without
        // exposing the provider's raw payload. (Requirements 10.4, 12.1, 12.2, 12.5)
        console.warn(`Google Places provider error status: ${response.status}.`);
        return NextResponse.json({
          success: false,
          error_code: 'live_provider_unavailable',
          message: 'Live search results could not be retrieved from the data provider (Google Places).',
        }, { status: 502 });
      }

      data = await response.json();
    } catch (providerError: any) {
      // Timeout (AbortError) or network-level failure. Do NOT surface the underlying
      // error details, stack traces, keys, or any provider payload. Return the same
      // structured, generic error with the provider named only as the source and no
      // lead records. (Requirements 10.2, 10.4, 12.1, 12.2, 12.5)
      const timedOut = providerError?.name === 'AbortError';
      console.warn(`Google Places provider ${timedOut ? 'request timed out after 10s' : 'request failed'}.`);
      return NextResponse.json({
        success: false,
        error_code: 'live_provider_unavailable',
        message: 'Live search results could not be retrieved from the data provider (Google Places).',
      }, { status: 502 });
    } finally {
      clearTimeout(timeoutId);
    }

    const places = data.places || [];

    // Zero results from a healthy provider response is a legitimate SUCCESS with an
    // empty result set, explicitly distinct from an error response. Flagged with
    // no_matches:true and data_source:'live' so the client can render an honest
    // empty state rather than a failure. (Requirements 10.2, 12.5)
    if (places.length === 0) {
      return NextResponse.json({
        success: true,
        data_source: 'live',
        no_matches: true,
        businesses: [],
        opportunities: {},
        totalResults: 0,
        visibleResults: 0,
        hiddenResults: 0,
      });
    }

    // Build the competitor benchmark input ONCE from the fetched result set.
    // Each business is scored against this real set and self-excludes itself by
    // its own place id inside competitorBenchmarkService.build (no extra provider
    // calls). Only real Places fields feed the benchmark (Req 2.7).
    const resultSet: PlaceLite[] = places.map((place: any) => ({
      placeId: place.id || '',
      rating: place.rating || 0,
      reviewsCount: place.userRatingCount || 0,
      website: place.websiteUri || '',
    }));

    // Honest contact enrichment: the default enricher NEVER guesses an email from
    // the domain or business name. Every contact field is labeled with its
    // provenance; unavailable fields stay empty (Req 1.1, 1.2, 1.8, 1.9).
    const contactEnricher: ContactEnricher = new NoGuessContactEnricher();

    // Normalize each Places result to a Business using REAL fields only (place_id
    // from place.id), enrich contacts, and score against the real benchmark.
    // Promise.all preserves input order so free-plan truncation stays stable.
    const scoredResults = await Promise.all(
      places.map(async (place: any, index: number) => {
        const placeId = place.id || '';
        // In-memory key: prefer the stable place id; fall back only so same-batch
        // records never collide. A business with no place id is later rejected by
        // the cache write as missing a stable key (Req 9.4).
        const bizId = placeId || `biz-${index}-${Math.floor(Math.random() * 100000)}`;
        const website = place.websiteUri || '';

        const business: Business = {
          id: bizId,
          created_at: new Date().toISOString(),
          organization_id: user.organization_id,
          place_id: placeId,
          name: place.displayName?.text || 'Local Business',
          website,
          rating: place.rating || 0,
          reviews_count: place.userRatingCount || 0,
          phone: place.nationalPhoneNumber || '',
          address: place.formattedAddress || '',
        };

        // Per-business enrichment. A failure must NOT fail the whole search: the
        // business stays in the result set with all contact fields `unavailable`
        // (Req 12.3). No guessed addresses ever reach the client (Req 1.9).
        let enriched: EnrichedContact;
        try {
          enriched = await contactEnricher.enrich({
            website,
            name: business.name,
          });
        } catch {
          enriched = {
            fields: { business_email: '', contact_email: '', contact_page: '' },
            provenance: {
              business_email: 'unavailable',
              contact_email: 'unavailable',
              contact_page: 'unavailable',
            },
          };
        }
        business.business_email = enriched.fields.business_email;
        business.contact_email = enriched.fields.contact_email;
        business.contact_page = enriched.fields.contact_page;
        business.contact_provenance = enriched.provenance;

        // Real competitor benchmark for this business, self-excluding by place id
        // (Req 2.4). Score with the current signature, forwarding the searched
        // country so deal values format in the right currency (Req 4.1).
        const benchmark = competitorBenchmarkService.build({
          scoredPlaceId: business.place_id,
          resultSet,
        });
        const scored = scoreBusinessOpportunity(business, benchmark, niche, country);

        const dealValueUnavailable = scored.dealValue.provenance === 'unavailable';
        const opportunity: Opportunity = {
          id: `opp-${bizId}`,
          created_at: new Date().toISOString(),
          business_id: bizId,
          place_id: placeId,
          website_score: scored.websiteScore,
          reviews_score: scored.reviewsScore,
          seo_score: scored.seoScore,
          gbp_score: scored.gbpScore,
          social_score: scored.socialScore,
          total_score: scored.opportunityScore,
          opportunity_level: scored.opportunityLevel,
          // Store the midpoint (representative), never the top of the range; it is
          // null when no valid range could be produced (Req 7.2, 7.5).
          estimated_deal_value: dealValueUnavailable ? null : scored.dealValue.representative,
          deal_value_min: scored.dealValue.min,
          deal_value_max: scored.dealValue.max,
          deal_value_provenance: scored.dealValue.provenance,
          closing_probability: scored.closingProbability,
          confidence: scored.confidenceScore,
          data_source: 'live',
        };

        return { business, opportunity };
      })
    );

    const businesses: Business[] = [];
    const opportunities: Record<string, Opportunity> = {};
    scoredResults.forEach(({ business, opportunity }) => {
      businesses.push(business);
      opportunities[business.id] = opportunity;
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
        // c+d. Persist businesses + opportunities keyed by place_id (never name),
        // carrying each result's provenance / data_source / confidence. Businesses
        // lacking a stable place id are rejected from the write and reported,
        // leaving the rest of the cache unchanged (Req 9.1, 9.4, 9.6).
        const persistResult = await persistOpportunityCache(supabase, {
          searchId,
          organizationId: user.organization_id,
          businesses,
          opportunities,
        });

        if (persistResult.rejected.length > 0) {
          console.warn(
            `[Cache] Skipped ${persistResult.rejected.length} business record(s) missing a stable place_id.`
          );
        }
      }
    }

    const truncated = truncateResultsForFreePlan(businesses, opportunities, user.subscription_tier);
    return NextResponse.json({
      success: true,
      data_source: 'live',
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
