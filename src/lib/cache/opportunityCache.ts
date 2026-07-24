// Cache_Manager helpers — place-id keyed persistence and reads (Req 9)
//
// The cache associates each Opportunity_Record with its Business_Record using
// the business's stable unique key (`place_id`), never the business name. This
// prevents same-named businesses (e.g. chain locations) from cross-associating
// their opportunities.
//
// The core association and label round-trip logic lives in pure functions that
// operate on plain in-memory data structures, so they can be tested without a
// live database. Thin wrappers (`persistOpportunityCache`, `readOpportunityCache`)
// adapt those pure functions to a Supabase client.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Business, Opportunity } from '@/types';
import type {
  ContactProvenance,
  ConfidenceValue,
  DataSource,
  ProvenanceLabel,
} from '@/types/scoring';

// ─────────────────────────────────────────────────────────────────────────────
// Row shapes (mirror the businesses/opportunities columns after the migration)
// ─────────────────────────────────────────────────────────────────────────────

/** A business row ready to be written to / read from the cache, keyed by place id. */
export interface BusinessCacheRow {
  place_id: string;
  name: string;
  website: string;
  rating: number;
  reviews_count: number;
  phone: string;
  address: string;
  business_email: string;
  contact_email: string;
  contact_page: string;
  contact_provenance: ContactProvenance | null;
}

/** An opportunity row ready to be written to / read from the cache, keyed by place id. */
export interface OpportunityCacheRow {
  place_id: string;
  website_score: number;
  reviews_score: number;
  seo_score: number;
  gbp_score: number;
  social_score: number;
  total_score: number;
  opportunity_level: 'High' | 'Medium' | 'Low';
  estimated_deal_value: number | null;
  deal_value_min: number | null;
  deal_value_max: number | null;
  deal_value_provenance: ProvenanceLabel;
  closing_probability: number;
  confidence: ConfidenceValue;
  data_source: DataSource;
}

// ─────────────────────────────────────────────────────────────────────────────
// Association + indication result shapes
// ─────────────────────────────────────────────────────────────────────────────

/** A business paired with the opportunity that produced it, keyed by place id. */
export interface PlaceAssociation {
  placeId: string;
  business: Business;
  opportunity: Opportunity | null;
}

/** A business rejected from a cache write because it has no stable unique key (Req 9.4). */
export interface RejectedBusiness {
  name: string;
  reason: 'missing_stable_key';
}

/** Result of associating in-memory businesses with their opportunities by place id. */
export interface AssociationResult {
  associations: PlaceAssociation[];
  rejected: RejectedBusiness[];
}

/** Cache rows produced for a write, plus any businesses rejected for a missing key. */
export interface BuildCacheRowsResult {
  businessRows: BusinessCacheRow[];
  opportunityRows: OpportunityCacheRow[];
  rejected: RejectedBusiness[];
}

/** A cached opportunity skipped on read because its place id matched no business (Req 9.5). */
export interface OrphanedOpportunity {
  place_id: string;
  reason: 'orphaned_skipped';
}

/** A reconstructed business-to-opportunity association read back from the cache. */
export interface CachedAssociation {
  placeId: string;
  business: BusinessCacheRow;
  opportunity: OpportunityCacheRow | null;
}

/** Result of reading cached rows back into associations, with skipped orphans recorded. */
export interface ReadCacheResult {
  associations: CachedAssociation[];
  orphanedSkipped: OrphanedOpportunity[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A business has a stable unique key when its `place_id` is a non-empty string.
 * The stable key is what associates opportunities to businesses across searches
 * and sessions (Req 9.1).
 */
export function hasStableKey(business: Pick<Business, 'place_id'>): boolean {
  return typeof business.place_id === 'string' && business.place_id.trim() !== '';
}

/**
 * Associate in-memory businesses with the opportunities that produced them by
 * matching on the business's stable unique key (`place_id`), never the name.
 *
 * Each opportunity is looked up by its owning business's `id`, so two businesses
 * that share a name but have distinct place ids never cross-associate their
 * opportunities (Req 9.1, 9.2). Businesses lacking a stable key are rejected and
 * reported rather than associated (Req 9.4).
 */
export function associateOpportunitiesByPlaceId(
  businesses: Business[],
  opportunities: Record<string, Opportunity>
): AssociationResult {
  const associations: PlaceAssociation[] = [];
  const rejected: RejectedBusiness[] = [];

  for (const business of businesses) {
    if (!hasStableKey(business)) {
      rejected.push({ name: business.name, reason: 'missing_stable_key' });
      continue;
    }

    const placeId = business.place_id.trim();
    const opportunity = opportunities[business.id] ?? null;
    associations.push({ placeId, business, opportunity });
  }

  return { associations, rejected };
}

/**
 * Build the business and opportunity rows for a cache write, keyed by place id,
 * carrying each value's provenance / data source / confidence (Req 9.6).
 *
 * Businesses without a stable unique key are rejected: neither the business nor
 * its opportunities are written, and the rejection is reported so the caller can
 * surface a `missing_stable_key` error while leaving prior cache unchanged
 * (Req 9.4).
 */
export function buildOpportunityCacheRows(input: {
  businesses: Business[];
  opportunities: Record<string, Opportunity>;
}): BuildCacheRowsResult {
  const { associations, rejected } = associateOpportunitiesByPlaceId(
    input.businesses,
    input.opportunities
  );

  const businessRows: BusinessCacheRow[] = [];
  const opportunityRows: OpportunityCacheRow[] = [];

  for (const { placeId, business, opportunity } of associations) {
    businessRows.push(toBusinessCacheRow(business, placeId));
    if (opportunity) {
      opportunityRows.push(toOpportunityCacheRow(opportunity, placeId));
    }
  }

  return { businessRows, opportunityRows, rejected };
}

/**
 * Reconstruct business-to-opportunity associations from cached rows by matching
 * the stored stable unique key, reproducing the associations present at persist
 * time (Req 9.3). Any cached opportunity whose place id matches no known
 * business is excluded and recorded as an orphaned skip (Req 9.5). Stored
 * provenance / data source / confidence values are returned unchanged (Req 9.7).
 */
export function reconstructAssociations(input: {
  businessRows: BusinessCacheRow[];
  opportunityRows: OpportunityCacheRow[];
}): ReadCacheResult {
  const { businessRows, opportunityRows } = input;

  // Index opportunities by their stored place id so each business can find the
  // opportunity that produced it. A business with a matching place id keeps its
  // own opportunity; same-named businesses never collide because place ids are
  // unique per location.
  const opportunityByPlaceId = new Map<string, OpportunityCacheRow>();
  for (const opp of opportunityRows) {
    const placeId = normalizePlaceId(opp.place_id);
    if (placeId !== '') {
      opportunityByPlaceId.set(placeId, opp);
    }
  }

  const knownPlaceIds = new Set(
    businessRows
      .map((biz) => normalizePlaceId(biz.place_id))
      .filter((placeId) => placeId !== '')
  );

  const associations: CachedAssociation[] = [];
  for (const biz of businessRows) {
    const placeId = normalizePlaceId(biz.place_id);
    // A business row with no place id cannot own an opportunity by key.
    const opportunity = placeId !== '' ? opportunityByPlaceId.get(placeId) ?? null : null;
    associations.push({ placeId, business: biz, opportunity });
  }

  // Any opportunity whose stored place id matches no known business is orphaned
  // and excluded from the returned associations (Req 9.5).
  const orphanedSkipped: OrphanedOpportunity[] = [];
  for (const opp of opportunityRows) {
    const placeId = normalizePlaceId(opp.place_id);
    if (placeId === '' || !knownPlaceIds.has(placeId)) {
      orphanedSkipped.push({ place_id: opp.place_id, reason: 'orphaned_skipped' });
    }
  }

  return { associations, orphanedSkipped };
}

/** Normalize a place id for comparison; missing/blank keys become ''. */
function normalizePlaceId(placeId: string | null | undefined): string {
  return typeof placeId === 'string' ? placeId.trim() : '';
}

/** Map an in-memory business onto its cache row shape (Req 9.6). */
function toBusinessCacheRow(business: Business, placeId: string): BusinessCacheRow {
  return {
    place_id: placeId,
    name: business.name,
    website: business.website ?? '',
    rating: business.rating ?? 0,
    reviews_count: business.reviews_count ?? 0,
    phone: business.phone ?? '',
    address: business.address ?? '',
    business_email: business.business_email ?? '',
    contact_email: business.contact_email ?? '',
    contact_page: business.contact_page ?? '',
    contact_provenance: business.contact_provenance ?? null,
  };
}

/** Map an in-memory opportunity onto its cache row shape, keyed by place id (Req 9.6). */
function toOpportunityCacheRow(opportunity: Opportunity, placeId: string): OpportunityCacheRow {
  return {
    place_id: placeId,
    website_score: opportunity.website_score,
    reviews_score: opportunity.reviews_score,
    seo_score: opportunity.seo_score,
    gbp_score: opportunity.gbp_score,
    social_score: opportunity.social_score,
    total_score: opportunity.total_score,
    opportunity_level: opportunity.opportunity_level,
    estimated_deal_value: opportunity.estimated_deal_value,
    deal_value_min: opportunity.deal_value_min,
    deal_value_max: opportunity.deal_value_max,
    deal_value_provenance: opportunity.deal_value_provenance,
    closing_probability: opportunity.closing_probability,
    confidence: opportunity.confidence,
    data_source: opportunity.data_source,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Thin Supabase wrappers (built on the pure helpers above)
// ─────────────────────────────────────────────────────────────────────────────

/** Outcome of a cache persist attempt, surfacing any rejected businesses (Req 9.4). */
export interface PersistCacheResult {
  persistedBusinesses: number;
  persistedOpportunities: number;
  rejected: RejectedBusiness[];
}

/**
 * Persist businesses and their opportunities to the cache, associating each
 * opportunity to its business by `place_id` (Req 9.1, 9.6). Businesses lacking a
 * stable key are rejected (their opportunities are not written) and reported so
 * the caller can surface a `missing_stable_key` indication; the rest of the
 * cache is left unchanged (Req 9.4).
 *
 * This is a thin wrapper: all association logic lives in
 * {@link buildOpportunityCacheRows}. It writes businesses first to obtain their
 * generated ids, then writes opportunities linked by both `business_id` and
 * `place_id`.
 */
export async function persistOpportunityCache(
  supabase: SupabaseClient,
  input: {
    searchId: string;
    organizationId: string;
    businesses: Business[];
    opportunities: Record<string, Opportunity>;
  }
): Promise<PersistCacheResult> {
  const { businessRows, opportunityRows, rejected } = buildOpportunityCacheRows({
    businesses: input.businesses,
    opportunities: input.opportunities,
  });

  if (businessRows.length === 0) {
    return { persistedBusinesses: 0, persistedOpportunities: 0, rejected };
  }

  const bizToInsert = businessRows.map((row) => ({
    search_id: input.searchId,
    organization_id: input.organizationId,
    place_id: row.place_id,
    name: row.name,
    website: row.website,
    rating: row.rating,
    reviews_count: row.reviews_count,
    phone: row.phone,
    address: row.address,
    business_email: row.business_email,
    contact_email: row.contact_email,
    contact_page: row.contact_page,
    contact_provenance: row.contact_provenance,
  }));

  const { data: insertedBizs } = await supabase
    .from('businesses')
    .insert(bizToInsert)
    .select('id, place_id');

  if (!insertedBizs || insertedBizs.length === 0) {
    return { persistedBusinesses: 0, persistedOpportunities: 0, rejected };
  }

  // Map each inserted business's generated id by its stable place id so
  // opportunities associate to the correct row (never by name).
  const businessIdByPlaceId = new Map<string, string>();
  for (const biz of insertedBizs as Array<{ id: string; place_id: string | null }>) {
    const placeId = normalizePlaceId(biz.place_id);
    if (placeId !== '') {
      businessIdByPlaceId.set(placeId, biz.id);
    }
  }

  const oppsToInsert = opportunityRows
    .map((row) => {
      const businessId = businessIdByPlaceId.get(normalizePlaceId(row.place_id));
      if (!businessId) return null;
      return {
        business_id: businessId,
        place_id: row.place_id,
        website_score: row.website_score,
        reviews_score: row.reviews_score,
        seo_score: row.seo_score,
        gbp_score: row.gbp_score,
        social_score: row.social_score,
        total_score: row.total_score,
        opportunity_level: row.opportunity_level,
        estimated_deal_value: row.estimated_deal_value,
        deal_value_min: row.deal_value_min,
        deal_value_max: row.deal_value_max,
        deal_value_provenance: row.deal_value_provenance,
        closing_probability: row.closing_probability,
        confidence: row.confidence,
        data_source: row.data_source,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (oppsToInsert.length > 0) {
    await supabase.from('opportunities').insert(oppsToInsert);
  }

  return {
    persistedBusinesses: insertedBizs.length,
    persistedOpportunities: oppsToInsert.length,
    rejected,
  };
}

/**
 * Read cached businesses and opportunities for a search and reconstruct their
 * associations by `place_id`, skipping orphaned opportunities (Req 9.3, 9.5) and
 * returning stored provenance / data source / confidence unchanged (Req 9.7).
 *
 * This is a thin wrapper: all reconstruction logic lives in
 * {@link reconstructAssociations}.
 */
export async function readOpportunityCache(
  supabase: SupabaseClient,
  input: { searchId: string }
): Promise<ReadCacheResult> {
  const { data: cachedBizs } = await supabase
    .from('businesses')
    .select('*')
    .eq('search_id', input.searchId);

  const businessRows: BusinessCacheRow[] = (cachedBizs ?? []).map(toBusinessCacheRowFromDb);

  if (businessRows.length === 0) {
    return { associations: [], orphanedSkipped: [] };
  }

  const businessIds = (cachedBizs ?? []).map((b: { id: string }) => b.id);
  const { data: cachedOpps } = await supabase
    .from('opportunities')
    .select('*')
    .in('business_id', businessIds);

  const opportunityRows: OpportunityCacheRow[] = (cachedOpps ?? []).map(toOpportunityCacheRowFromDb);

  return reconstructAssociations({ businessRows, opportunityRows });
}

/** Map a raw Supabase business row onto {@link BusinessCacheRow}. */
function toBusinessCacheRowFromDb(row: Record<string, unknown>): BusinessCacheRow {
  return {
    place_id: normalizePlaceId(row.place_id as string | null | undefined),
    name: (row.name as string) ?? '',
    website: (row.website as string) ?? '',
    rating: Number(row.rating ?? 0),
    reviews_count: Number(row.reviews_count ?? 0),
    phone: (row.phone as string) ?? '',
    address: (row.address as string) ?? '',
    business_email: (row.business_email as string) ?? '',
    contact_email: (row.contact_email as string) ?? '',
    contact_page: (row.contact_page as string) ?? '',
    contact_provenance: (row.contact_provenance as ContactProvenance | null) ?? null,
  };
}

/** Map a raw Supabase opportunity row onto {@link OpportunityCacheRow}. */
function toOpportunityCacheRowFromDb(row: Record<string, unknown>): OpportunityCacheRow {
  return {
    place_id: normalizePlaceId(row.place_id as string | null | undefined),
    website_score: Number(row.website_score ?? 0),
    reviews_score: Number(row.reviews_score ?? 0),
    seo_score: Number(row.seo_score ?? 0),
    gbp_score: Number(row.gbp_score ?? 0),
    social_score: Number(row.social_score ?? 0),
    total_score: Number(row.total_score ?? 0),
    opportunity_level: (row.opportunity_level as 'High' | 'Medium' | 'Low') ?? 'Low',
    estimated_deal_value:
      row.estimated_deal_value === null || row.estimated_deal_value === undefined
        ? null
        : Number(row.estimated_deal_value),
    deal_value_min:
      row.deal_value_min === null || row.deal_value_min === undefined
        ? null
        : Number(row.deal_value_min),
    deal_value_max:
      row.deal_value_max === null || row.deal_value_max === undefined
        ? null
        : Number(row.deal_value_max),
    deal_value_provenance: (row.deal_value_provenance as ProvenanceLabel) ?? 'unavailable',
    closing_probability: Number(row.closing_probability ?? 0),
    confidence: Number(row.confidence ?? 0),
    data_source: (row.data_source as DataSource) ?? 'cache',
  };
}
