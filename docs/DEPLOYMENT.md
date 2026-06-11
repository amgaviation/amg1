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
