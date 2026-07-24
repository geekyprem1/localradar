# LocalRadar production deployment

This guide matches the **current codebase** (DodoPayments + Supabase). Ignore older Stripe-only notes if you find them in git history.

---

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run SQL in order:
   - `supabase/schema.sql`
   - `supabase/migrations/20260618000000_billing_and_entitlements.sql`
   - `supabase/migrations/20260618000100_contact_discovery.sql`
   - `supabase/migrations/20260618000200_auth_user_trigger.sql`
   - `supabase/migrations/20260724000000_subscriptions_unique_org.sql` (if present)
3. Auth → Providers: enable Email; optionally Google.
4. Auth → URL configuration:
   - Site URL: `https://your-domain.com`
   - Redirect: `https://your-domain.com/auth/callback`

### Keys

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (server only, never expose) |

---

## 2. Billing (DodoPayments)

1. Create products for **Pro**, **Agency**, **Agency Plus** in DodoPayments.
2. Set env:
   - `DODO_PAYMENTS_API_KEY`
   - `DODO_PAYMENTS_PRO_PRODUCT_ID`
   - `DODO_PAYMENTS_AGENCY_PRODUCT_ID`
   - `DODO_PAYMENTS_AGENCY_PLUS_PRODUCT_ID`
   - `DODO_PAYMENTS_WEBHOOK_KEY` (signing secret)
   - `DODO_PAYMENTS_MODE=test` or `live`
3. Webhook endpoint (production):

```
https://your-domain.com/api/billing/webhook
```

Subscribe to subscription active/updated/cancelled/failed events as provided by Dodo.

**Security:** The webhook refuses to run without a real signing secret in production. Product IDs map to tiers server-side.

---

## 3. Required production secrets

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ENCRYPTION_SECRET=<32+ random characters>
DODO_PAYMENTS_API_KEY=...
DODO_PAYMENTS_WEBHOOK_KEY=...
DODO_PAYMENTS_PRO_PRODUCT_ID=...
DODO_PAYMENTS_AGENCY_PRODUCT_ID=...
DODO_PAYMENTS_AGENCY_PLUS_PRODUCT_ID=...
```

Recommended:

```env
GOOGLE_PLACES_API_KEY=...
OPENROUTER_API_KEY=...   # or OPENAI_API_KEY
CONTACT_WEBHOOK_URL=...  # form delivery
```

**Do not set in production:**

```env
ALLOW_SANDBOX_IN_PRODUCTION=true
NEXT_PUBLIC_ALLOW_SANDBOX=true
```

unless you are running an intentional internal demo.

---

## 4. Vercel (or similar)

1. Import the Git repository.
2. Framework: Next.js.
3. Paste env vars from the checklist above.
4. Deploy. Confirm:
   - `npm run build` succeeds
   - `/api/billing/webhook` returns 401/503 without valid signature (not 200 open)
   - Login with a real Supabase user works
   - Dashboard APIs return 401 without `Authorization`

---

## 5. Post-deploy verification

| Check | Expected |
|-------|----------|
| `GET /` | Marketing loads |
| `GET /robots.txt` | Allows marketing, disallows `/dashboard/` |
| `GET /sitemap.xml` | Lists public routes |
| `POST /api/search` no auth | **401** |
| `POST /api/search` with `x-is-sandbox: true` in prod | **401** |
| Checkout | Redirects to Dodo; return to `/dashboard/settings?status=success` |
| Webhook | Updates `organizations.subscription_tier` via service role |

---

## 6. Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase keys, **Sandbox Mode** is available for UI demos only. Sandbox is not a production auth system.

```bash
npm run typecheck
npm run lint
npm run build
```
