-- Migration: real_data_intelligence_engine
-- Adds provenance/confidence/data-source columns, place-id association keys, and a
-- deal-value range to the businesses and opportunities tables. Idempotent: safe to
-- re-run. See .kiro/specs/real-data-intelligence-engine/design.md ("Supabase migration
-- plan"). Requirements: 7.3, 9.1, 9.6, 11.2.

-- ---------------------------------------------------------------------------
-- Businesses: add stable place id + contact provenance
-- ---------------------------------------------------------------------------
alter table public.businesses add column if not exists place_id text;
alter table public.businesses add column if not exists contact_provenance jsonb;

-- Backfill note: legacy rows without place_id remain readable but are treated as
-- orphaned on read (Req 9.5) and cannot be re-associated; a one-time cleanup is
-- recommended.
create index if not exists idx_businesses_place_id on public.businesses (place_id);
create unique index if not exists uq_businesses_search_place
  on public.businesses (search_id, place_id) where place_id is not null;

-- ---------------------------------------------------------------------------
-- Opportunities: add association key, deal range, provenance, confidence, data source
-- ---------------------------------------------------------------------------
alter table public.opportunities add column if not exists place_id text;
alter table public.opportunities add column if not exists deal_value_min numeric(12,2);
alter table public.opportunities add column if not exists deal_value_max numeric(12,2);
alter table public.opportunities add column if not exists deal_value_provenance text
  default 'estimated';
alter table public.opportunities add column if not exists confidence smallint;
alter table public.opportunities add column if not exists data_source text;

-- estimated_deal_value stays but now stores the midpoint (nullable for unavailable, Req 7.5)
alter table public.opportunities alter column estimated_deal_value drop not null;

create index if not exists idx_opportunities_place_id on public.opportunities (place_id);

-- ---------------------------------------------------------------------------
-- CHECK constraints documenting invariants (enforced in app + DB).
-- Postgres has no ADD CONSTRAINT IF NOT EXISTS, so guard each add for idempotency.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_conf_range'
  ) then
    alter table public.opportunities add constraint chk_conf_range
      check (confidence is null or (confidence between 0 and 100));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_deal_range'
  ) then
    alter table public.opportunities add constraint chk_deal_range
      check (deal_value_min is null or deal_value_max is null or deal_value_min <= deal_value_max);
  end if;
end $$;
