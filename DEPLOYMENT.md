# Production Deployment Guide: LocalRadar

Follow these steps to transition LocalRadar from Sandbox Mode to live production.

---

## 1. Supabase Database & Auth Setup

LocalRadar utilizes Supabase for authentication and database management.

1. **Create a Supabase Project**: Go to [Supabase Console](https://database.new) and start a new project.
2. **Execute Database Schema**:
   - Open the **SQL Editor** in your Supabase dashboard.
   - Click "New Query" and paste the DDL commands from the schema file:
     [`supabase/schema.sql`](file:///c:/Users/user/Documents/antigravity/LocalRdar/supabase/schema.sql)
   - Click **Run** to generate the tables, Row Level Security (RLS) policies, indexes, and profiles.
3. **Configure Authentication**:
   - Go to **Authentication > Providers** in Supabase.
   - Enable **Google** login if desired (requires credentials from Google Cloud Console).
   - Set up your redirect URLs to point to your production domains: `https://yourdomain.com/auth/callback`.

---

## 2. Stripe Subscriptions Configuration

Stripe handles checkout billing and subscription tier status.

1. **Create Products in Stripe**:
   - Open the **Stripe Dashboard** (developers mode enabled).
   - Go to **Product Catalog > Add Product**.
   - Create two products with recurring monthly prices:
     - **Pro Finder**: `$29.00 / month`
     - **Agency Growth**: `$79.00 / month`
2. **Retrieve API Credentials**:
   - Copy your **Publishable Key** and **Secret Key** from the Developers section.
3. **Stripe Webhook Configuration**:
   - Go to **Developers > Webhooks**.
   - Click "Add Endpoint" and point it to your Vercel API endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`.
   - Select the following events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the **Signing Secret** (`whsec_...`).

---

## 3. Vercel Deployment & Environment Settings

Deploy the Next.js frontend to Vercel.

1. **Initialize Vercel project**:
   - Install the Vercel CLI or import your git repository directly on the Vercel Dashboard.
2. **Add Environment Variables**: Set the following variables in Vercel project settings:

```env
# Next.js Public Keys (available client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Private Secret Keys (server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
OPENAI_API_KEY=sk-proj-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. **Deploy**:
   - Trigger build: `vercel deploy --prod`

---

## 4. Local Development

To run LocalRadar locally and verify builds:

1. Clone repo, install packages:
   ```bash
   npm install
   ```
2. Start the hot-reloading dev environment:
   ```bash
   npm run dev
   ```
3. Run TypeScript checks:
   ```bash
   npx tsc --noEmit
   ```
4. Perform production test compilation:
   ```bash
   npm run build
   ```
