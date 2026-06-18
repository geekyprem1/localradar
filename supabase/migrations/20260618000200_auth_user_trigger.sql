-- Migration: Auto-create user profiles and organizations on signup
-- Plus retroactive fixes and search_logs compound index

-- 1. Create handle_new_user PL/pgSQL function
create or replace function public.handle_new_user()
returns trigger as $$
declare
    new_org_id uuid;
    full_name_val text;
begin
    -- Extract full name from metadata or default to email prefix
    full_name_val := coalesce(
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
    );

    -- Insert new organization
    insert into public.organizations (name, subscription_tier, subscription_status)
    values (full_name_val || ' Agency', 'free', 'active')
    returning id into new_org_id;

    -- Insert user profile
    insert into public.users (id, email, full_name, organization_id)
    values (
        new.id,
        new.email,
        full_name_val,
        new_org_id
    );

    return new;
end;
$$ language plpgsql security definer;

-- 2. Create trigger on auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 3. Retroactively fix any existing users in auth.users missing public.users/organizations
do $$
declare
    r record;
    new_org_id uuid;
    full_name_val text;
begin
    for r in 
        select id, email, raw_user_meta_data 
        from auth.users 
        where id not in (select id from public.users)
    loop
        full_name_val := coalesce(
            r.raw_user_meta_data->>'full_name',
            split_part(r.email, '@', 1),
            'Agency Partner'
        );

        insert into public.organizations (name, subscription_tier, subscription_status)
        values (full_name_val || ' Agency', 'free', 'active')
        returning id into new_org_id;

        insert into public.users (id, email, full_name, organization_id)
        values (
            r.id,
            r.email,
            full_name_val,
            new_org_id
        );
    end loop;
end;
$$;

-- 4. Compound index for optimized search log counting queries
create index if not exists idx_search_logs_org_created 
    on public.search_logs(organization_id, created_at desc);
