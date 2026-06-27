# AMG Deployment Guide

## Vercel

- Framework: Next.js App Router
- Build command: `npm run build`
- Install command: `npm install`
- Output: managed by Next.js/Vercel

## Required Environment Variables

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SITE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Optional Notification Variables

```text
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=
EMAIL_REPLY_TO=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NOTIFICATION_WEBHOOK_SECRET=
```

If notification provider credentials are missing, the app records delivery rows as `suppressed` instead of faking successful delivery.

## Stripe Environments

Use Stripe test keys for local development and Vercel Preview. Use live keys only in Vercel Production unless AMG intentionally wants live billing in another environment.

Vercel Production:

```text
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=https://www.amgaviationgroup.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is only required if client-side Stripe.js is used. The app infers Stripe mode from `STRIPE_SECRET_KEY`; `STRIPE_MODE` is not required.

Configure the live Stripe webhook endpoint as `https://www.amgaviationgroup.com/api/webhooks/stripe` and subscribe to the invoice/payment and subscription events listed in `docs/BILLING.md`.

## Supabase Setup

1. Apply `docs/AMG_PRODUCTION_DATABASE_PATCHES.sql`.
2. Confirm private storage buckets:
   - `documents`
   - `crew-credentials`
3. Confirm Auth redirect URLs include:
   - local: `http://localhost:3000/login`
   - production: `https://<production-domain>/login`
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose it as `NEXT_PUBLIC_*`.

## Rollback

- Revert the Vercel deployment to the previous successful deployment.
- If database patches were applied, do not drop tables containing production records. Instead disable new UI access by reverting the app deployment and review data manually.
