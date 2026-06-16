-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. Organizations
create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    name text not null,
    stripe_customer_id text unique,
    subscription_tier text default 'free' not null, -- 'free', 'pro', 'agency'
    subscription_status text default 'active' not null
);

-- 2. User Profiles (Extends Supabase Auth)
create table if not exists public.users (
    id uuid primary key references auth.users on delete cascade,
    created_at timestamp with time zone default now() not null,
    email text unique not null,
    full_name text,
    organization_id uuid references public.organizations(id) on delete set null
);

-- 3. Lead Searches
create table if not exists public.searches (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    business_type text not null,
    city text not null,
    country text not null
);

-- 4. Businesses (Leads discovered)
create table if not exists public.businesses (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    search_id uuid references public.searches(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade not null,
    name text not null,
    website text,
    rating numeric(3,2),
    reviews_count integer default 0,
    phone text,
    address text
);

-- 5. Opportunities (Scoring Engine results)
create table if not exists public.opportunities (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    business_id uuid references public.businesses(id) on delete cascade unique not null,
    website_score integer not null,
    reviews_score integer not null,
    seo_score integer not null,
    gbp_score integer not null,
    social_score integer not null,
    total_score integer not null,
    opportunity_level text not null, -- 'High', 'Medium', 'Low'
    estimated_deal_value numeric not null,
    closing_probability numeric not null
);

-- 6. Audits (AI generated detailed issues)
create table if not exists public.audits (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    business_id uuid references public.businesses(id) on delete cascade unique not null,
    website_issues text[] not null,
    seo_issues text[] not null,
    review_issues text[] not null,
    gbp_issues text[] not null,
    social_issues text[] not null,
    recommended_services text[] not null
);

-- 7. Competitors (For comparison cards)
create table if not exists public.competitors (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    business_id uuid references public.businesses(id) on delete cascade not null,
    name text not null,
    website text,
    rating numeric(3,2),
    reviews_count integer default 0,
    seo_score integer
);

-- 8. Pitches (AI copy generation)
create table if not exists public.pitches (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default now() not null,
    business_id uuid references public.businesses(id) on delete cascade not null,
    cold_email text not null,
    cold_dm text not null,
    website_proposal text not null,
    seo_proposal text not null
);

-- Enable Row Level Security (RLS)
alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.searches enable row level security;
alter table public.businesses enable row level security;
alter table public.opportunities enable row level security;
alter table public.audits enable row level security;
alter table public.competitors enable row level security;
alter table public.pitches enable row level security;

-- Create basic RLS policies
create policy "Users can view their own organization" 
    on public.organizations for select 
    using (id in (select organization_id from public.users where id = auth.uid()));

create policy "Users can view their own profile" 
    on public.users for select 
    using (id = auth.uid());

create policy "Users can read/write searches for their org" 
    on public.searches for all 
    using (organization_id in (select organization_id from public.users where id = auth.uid()));

create policy "Users can read/write businesses for their org" 
    on public.businesses for all 
    using (organization_id in (select organization_id from public.users where id = auth.uid()));

create policy "Users can read/write opportunities for their businesses" 
    on public.opportunities for all 
    using (business_id in (select id from public.businesses where organization_id in (select organization_id from public.users where id = auth.uid())));

create policy "Users can read/write audits for their businesses" 
    on public.audits for all 
    using (business_id in (select id from public.businesses where organization_id in (select organization_id from public.users where id = auth.uid())));

create policy "Users can read/write competitors for their businesses" 
    on public.competitors for all 
    using (business_id in (select id from public.businesses where organization_id in (select organization_id from public.users where id = auth.uid())));

create policy "Users can read/write pitches for their businesses" 
    on public.pitches for all 
    using (business_id in (select id from public.businesses where organization_id in (select organization_id from public.users where id = auth.uid())));

-- Indexes for performance
create index if not exists idx_users_org on public.users(organization_id);
create index if not exists idx_searches_org on public.searches(organization_id);
create index if not exists idx_businesses_org on public.businesses(organization_id);
create index if not exists idx_opportunities_biz on public.opportunities(business_id);
create index if not exists idx_audits_biz on public.audits(business_id);
create index if not exists idx_competitors_biz on public.competitors(business_id);
create index if not exists idx_pitches_biz on public.pitches(business_id);
