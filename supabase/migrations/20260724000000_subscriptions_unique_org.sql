-- Ensure one subscription row per organization for webhook upserts
create unique index if not exists subscriptions_organization_id_uidx
  on public.subscriptions (organization_id);
