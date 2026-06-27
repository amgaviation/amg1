# AMG Aviation Group

Production Next.js/Vercel website and integrated AMG portal system.

## Included

- Public AMG Aviation website
- Client, Crew, Admin, and Partner portals
- Supabase Auth/profile-based role routing
- Aircraft management and client aircraft visibility
- Mission requests, mission control, crew assignment, partner service requests
- Quotes, client quote review, invoices, payment-status tracking
- Crew expense submission, admin review, and invoice linkage
- Documents, messaging, notification center, audit log
- Admin user creation and invitation workflow
- Higgsfield-ready media placeholder registry

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run typecheck
npm run stripe:verify
npm run test
npm run build
```

## Stripe Invoice Payments

Invoice emails and portal invoice detail pages can create server-side Stripe Checkout Sessions for open invoices. Configure these variables locally and in Vercel:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only if a future client-side Stripe.js flow is added

Stripe dashboard setup:

1. Add the webhook endpoint `https://YOUR_DOMAIN/api/webhooks/stripe`.
2. Subscribe to `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, and `payment_intent.payment_failed`.
3. Enable the desired payment methods in Stripe Checkout.
4. Configure Stripe branding/logo/color to match AMG.
5. Test in Stripe test mode before production.

Local test flow:

1. Use Stripe test keys and run the app locally.
2. Forward webhooks with Stripe CLI to `/api/webhooks/stripe`.
3. Create and send a test invoice.
4. Click Pay Invoice and use a Stripe test card.
5. Confirm the webhook marks the invoice paid and sends one receipt email.

## Production Setup

1. Apply `docs/AMG_PRODUCTION_DATABASE_PATCHES.sql` in Supabase.
2. Configure environment variables from `.env.local.example` in Vercel.
3. Confirm private storage buckets exist for `documents` and `crew-credentials`.
4. Configure Supabase Auth email templates and redirect URL.
5. Add Resend/Twilio credentials when external delivery is ready.

Detailed setup lives in `docs/DEPLOYMENT.md`, `docs/NOTIFICATIONS.md`, and `docs/BILLING.md`.
