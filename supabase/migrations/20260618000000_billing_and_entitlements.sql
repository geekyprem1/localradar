-- Migration to add SaaS billing, entitlements, usage tracking, and BYOK credentials

-- 1. Subscriptions Table
create table if not exists public.subscriptions (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    stripe_subscription_id text unique,
    plan_tier text not null default 'free', -- 'free', 'pro', 'agency'
    status text not null default 'active',
    current_period_start timestamp with time zone default now() not null,
    current_period_end timestamp with time zone default (now() + interval '1 month') not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- 2. Usage Tracking Table
create table if not exists public.usage_tracking (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    month text not null, -- Format: 'YYYY-MM'
    searches_count integer not null default 0,
    audits_count integer not null default 0,
    pitches_count integer not null default 0,
    exports_count integer not null default 0,
    tokens_used integer not null default 0,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint unique_org_month unique (organization_id, month)
);

-- 3. Feature Access Table (For granular custom feature overrides)
create table if not exists public.feature_access (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    feature_name text not null, -- e.g., 'developer_keys', 'api_access', 'live_search'
    is_enabled boolean not null default true,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    constraint unique_org_feature unique (organization_id, feature_name)
);

-- 4. Search Logs Table
create table if not exists public.search_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade not null,
    user_id uuid references public.users(id) on delete set null,
    niche text not null,
    city text not null,
    country text not null,
    results_count integer not null,
    created_at timestamp with time zone default now() not null
);

-- 5. BYOK Credentials Table
create table if not exists public.byok_credentials (
    organization_id uuid primary key references public.organizations(id) on delete cascade,
    byok_enabled boolean not null default false,
    encrypted_google_places_key text,
    encrypted_openrouter_key text,
    encrypted_supabase_url text,
    encrypted_supabase_anon text,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Enable Row Level Security (RLS)
alter table public.subscriptions enable row level security;
alter table public.usage_tracking enable row level security;
alter table public.feature_access enable row level security;
alter table public.search_logs enable row level security;
alter table public.byok_credentials enable row level security;

-- Create RLS Policies
create policy "Users can view subscriptions for their org"
    on public.subscriptions for select
    using (organization_id in (select organization_id from public.users where id = auth.uid()));

create policy "Users can view usage_tracking for their org"
    on public.usage_tracking for select
    using (organization_id in (select organization_id from public.users where id = auth.uid()));

create policy "Users can view feature_access for their org"
    on public.feature_access for select
    using (organization_id in (select organization_id from public.users where id = auth.uid()));

create policy "Users can view search_logs for their org"
    on public.search_logs for select
    using (organization_id in (select organization_id from public.users where id = auth.uid()));

create policy "Users can insert search_logs for their org"
    on public.search_logs for insert
    with check (organization_id in (select organization_id from public.users where id = auth.uid()));

create policy "Users can manage byok_credentials for their org"
    on public.byok_credentials for all
    using (organization_id in (select organization_id from public.users where id = auth.uid()));

-- Indexes for performance
create index if not exists idx_subscriptions_org on public.subscriptions(organization_id);
create index if not exists idx_usage_tracking_org on public.usage_tracking(organization_id);
create index if not exists idx_feature_access_org on public.feature_access(organization_id);
create index if not exists idx_search_logs_org on public.search_logs(organization_id);
