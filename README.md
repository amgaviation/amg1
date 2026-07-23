# AMG Aviation Group

Production Next.js/Vercel website and integrated AMG portal system.

## Included

- Public AMG Aviation website
- AMG Connect **Operations Deck** portal (v2 rebuild): Client, Crew, Admin/Operations, and Partner (broker/vendor) workspaces
- Supabase Auth/profile-based role routing (client, crew, admin, partner, super_admin)
- Aircraft management and client aircraft visibility
- Mission requests, mission control board, crew assignment, partner service requests
- Quotes, client quote review, invoices, payment-status tracking
- Crew expense submission, admin review, and invoice linkage
- Documents, messaging, notification center, audit log
- Admin user creation, approvals, waitlist, and invitation workflow
- Higgsfield-ready media placeholder registry

## Portal Design System (Operations Deck)

The portal UI is a self-contained design system scoped under `.amg-portal`:

- Tokens: `--deck-*` variables in `app/globals.css` (navy chrome, light canvas, champagne-gold accent), with shadcn and legacy `--amg-*` tokens re-pointed to the same palette
- Component classes: `.deck-card`, `.deck-inset`, `.deck-eyebrow`, `.deck-chip`, `.deck-input`, `.deck-nav-link`, etc. (defined in `@layer components`)
- Kit: `components/portal/ui/*` (PageHeader, SectionCard, StatCard, RecordRow, QuickLink, FilterTabs, Pagination, DataTable, StatusBadge, fields, NotificationsList)
- Shell: `components/portal/shell/portal-shell.tsx` (dark sidebar with grouped nav per role, Zulu clock, notifications, admin view switcher)
- Navigation IA: `DECK_NAV` workspaces in `lib/portal/constants.ts` (short per-role rail + contextual sub-nav; see docs/portal-operational-restructure.md)

Note: a global rule zeroes `tracking-*` utilities; portal code uses `[letter-spacing:...]` arbitrary properties or the `.deck-eyebrow` classes instead.

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
npm run stripe:subscriptions:verify
npm run stripe:live-readiness:verify
npm run test
npm run build
```

## Stripe Invoice Payments

Invoice emails and portal invoice detail pages can create server-side Stripe Checkout Sessions for open invoices. Configure these variables locally and in Vercel:

- `STRIPE_SECRET_KEY` (`sk_test_...` locally/preview, `sk_live_...` in Vercel Production)
- `STRIPE_WEBHOOK_SECRET` (matching the current Stripe mode webhook endpoint)
- `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only if a future client-side Stripe.js flow is added

Stripe dashboard setup:

1. Add the webhook endpoint `https://YOUR_DOMAIN/api/webhooks/stripe`.
2. Subscribe to `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`, and `payment_intent.canceled`.
3. Enable the desired payment methods in Stripe Checkout.
4. Configure Stripe branding/logo/color to match AMG.
5. Test in Stripe test mode before production.

Local test flow:

1. Use Stripe test keys and run the app locally.
2. Forward webhooks with Stripe CLI to `/api/webhooks/stripe`.
3. Create and send a test invoice.
4. Click Pay Invoice and use a Stripe test card.
5. Confirm the webhook marks the invoice paid and sends one receipt email.

## Stripe Subscription Billing

Stripe Billing is the source of truth for recurring AMG subscriptions. The portal stores a local mirror for operational/admin visibility and updates it from Stripe webhooks.

Required setup:

1. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
2. Create Stripe Products/Prices for AMG subscription plans and tiers.
3. Add test Price IDs to AMG plan tiers for local/preview and live Price IDs for production.
4. Configure webhook endpoint `https://YOUR_DOMAIN/api/webhooks/stripe`.
5. Subscribe to `checkout.session.completed`, `checkout.session.expired`, `customer.created`, `customer.updated`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.created`, `invoice.finalized`, `invoice.paid`, `invoice.payment_failed`, and `payment_method.attached`.
6. Configure Stripe Customer Portal if clients should manage payment methods or view invoices.
7. Configure Stripe branding and test in Stripe test mode before production.

Manual test flow:

1. Create a Stripe test product/price.
2. Add the test price ID to an AMG subscription tier.
3. Create a portal subscription setup link as an admin.
4. Complete Stripe Checkout with a test card.
5. Confirm webhook updates portal status to `active` or `trialing`.
6. Create or change a subscription directly in Stripe and verify it syncs or appears as `needs_review`.
7. Test payment failure/cancellation and confirm admin warnings/event history update.

## Production Setup

1. Apply `docs/AMG_PRODUCTION_DATABASE_PATCHES.sql` in Supabase.
2. Configure environment variables from `.env.local.example` in Vercel.
3. Confirm private storage buckets exist for `documents` and `crew-credentials`.
4. Configure Supabase Auth email templates and redirect URL.
5. Add Resend/Twilio credentials when external delivery is ready.

Detailed setup lives in `docs/DEPLOYMENT.md`, `docs/NOTIFICATIONS.md`, and `docs/BILLING.md`.

## Stripe Live Account Readiness

Production Stripe mode is inferred from `STRIPE_SECRET_KEY`: `sk_test_...` is test mode and `sk_live_...` is live mode. The app does not require `STRIPE_MODE` and never sends Stripe secret values to the browser.

Vercel Production must use:

- `STRIPE_SECRET_KEY=sk_live_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...` from the live webhook endpoint
- `NEXT_PUBLIC_SITE_URL=https://www.amgaviationgroup.com`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` only if client-side Stripe.js is used

Vercel Preview/local should use Stripe test keys unless AMG intentionally wants live billing there.

Subscription tiers support separate test and live Stripe Price IDs. Live mode blocks subscription checkout unless the selected tier/cadence has a live Price ID. Test mode uses a test Price ID, or the legacy Price ID fields for backwards-compatible local testing, and rejects live-only configuration.

Admins can review Stripe mode, configured-key presence, webhook status, missing Price ID counts, and last webhook status at `/portal/admin/settings/billing`. The page only displays yes/no status and counts; it never displays secret values.
# ForeFlight Flight Intelligence (admin-only)

ForeFlight remains the source of truth. AMG Flight Intelligence is a private analytical mirror; it never determines FAA compliance, legal eligibility, or medical validity.

ForeFlight Business users should export their Logbook as CSV from ForeFlight and upload it at **Portal → AMG Operations → Flight Intelligence**. The MVP accepts a UTF-8 `.csv` no larger than 10 MB and requires the ForeFlight-compatible headers `Date`, `Aircraft ID`, and `Total Time`. It recognizes common optional labels for time categories, landings, approaches, holds, route, and remarks. Preview validates every row before import; invalid rows are not written. The original source CSV is stored privately with batch and source-row provenance.

Imports are idempotent by canonical flight-row SHA-256 fingerprint. Re-importing the same source file is rejected; overlapping files add only previously unseen entries. Findings and currency views are planning aids with source-field evidence and data-gap disclosures. Flight reviews and medical certificates are intentionally shown as insufficient data until verified source documents are added.

Gmail automation is not enabled in this MVP. The next safe step is a separately approved Gmail OAuth integration with a dedicated mailbox, attachment allowlist, consent/retention policy, and inbound-webhook verification; no Gmail secret or mailbox access is assumed here.
