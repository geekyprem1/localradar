# LocalRadar

AI-powered local growth intelligence for agencies and SMBs.

Scan local markets from public Google Business signals, score opportunity, and generate personalized outreach drafts.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript (strict)
- **Tailwind CSS v4**
- **Supabase** (auth + Postgres + RLS)
- **DodoPayments** (subscriptions)
- Optional: OpenRouter / OpenAI, Google Places

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill required keys (see DEPLOYMENT.md)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Product routes

| Path | Description |
|------|-------------|
| `/` | Marketing site |
| `/login`, `/signup` | Auth |
| `/dashboard` | Product app |
| `/privacy`, `/terms`, … | Legal |
| `/contact` | Contact + support form |

## Security notes

- Production APIs require a verified **Supabase JWT** (`Authorization: Bearer …`).
- Sandbox/mock auth is **disabled in production** unless `ALLOW_SANDBOX_IN_PRODUCTION=true` (not recommended).
- `ENCRYPTION_SECRET` is required in production for BYOK key encryption.
- Never commit `.env.local`. Use `.env.example` as the template.

## Plan limits (source of truth)

Defined in `src/lib/entitlements.ts` → `PLAN_LIMITS`:

| Plan | Monthly scans | Audits / Pitch / Export | BYOK |
|------|---------------|-------------------------|------|
| Free | 20 | No | No |
| Pro | 1,000 | Yes | No |
| Agency | 5,000 | Yes | No |
| Agency Plus | 10,000 | Yes | Yes |

## Deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Supabase schema, DodoPayments webhooks, and environment checklist.
