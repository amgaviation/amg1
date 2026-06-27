# AMG Billing

## Invoice Workflow

Admin can:

- Create an invoice from an accepted quote.
- Create a standalone invoice.
- Send or hold draft invoices.
- Record manual payments.
- Mark invoice statuses.
- Add approved billable crew expenses to an invoice once.

Client can:

- View open and paid invoices.
- Open invoice detail.
- Review mission/quote linkage, totals, amount paid, and amount due.

## Data Model

Tables introduced in `docs/AMG_PRODUCTION_DATABASE_PATCHES.sql`:

- `invoices`
- `invoice_line_items`
- `payments`

Expense linkage:

- `expenses.billable_to_client`
- `expenses.approved_amount`
- `expenses.invoice_line_item_id`
- unique invoice-line `expense_id` enforcement

## Payment Provider

Stripe Checkout is used for card payment links on AMG invoices and Stripe Billing is used for recurring subscriptions. Stripe is the billing source of truth for recurring subscription lifecycle, renewal, payment failure, cancellation, and invoice status.

Manual AMG operational invoices remain in the `invoices` table. Stripe subscription billing invoices are stored separately in `subscription_billing_invoices` and shown under Subscription Billing History so recurring Stripe Billing history is not mixed with AMG operational invoice packets.

Invoice Checkout uses dynamic server-side line items from the stored invoice amount due and currency. No static Stripe Price ID is required for one-off invoice payments.

## Stripe Test/Live Configuration

Stripe mode is inferred from `STRIPE_SECRET_KEY`.

- `sk_test_...` = test mode for local development and Vercel Preview.
- `sk_live_...` = live mode for Vercel Production.
- Missing or unrecognized keys block Stripe billing actions.

Required server-side variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Required app URL variable:

- `NEXT_PUBLIC_SITE_URL`

Optional public variable:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, only if client-side Stripe.js is used.

Do not commit real Stripe keys. Do not put live keys in Preview unless AMG intentionally wants live billing there.

## Stripe Subscription Sync

Admin-created subscriptions create a local `pending_checkout` mirror record and a Stripe Checkout Session in subscription mode. The customer completes payment method setup in Stripe. Webhooks then update the portal mirror.

Direct Stripe-created subscriptions sync through the same webhook endpoint. If AMG cannot match the Stripe customer to a portal client by `stripe_customer_id` or a unique email match, the portal creates a `needs_review` subscription record for admin resolution.

Required admin recovery tools:

- Refresh from Stripe
- Link `needs_review` subscriptions to an existing client
- Mark unrelated Stripe subscriptions ignored
- Resend setup link for pending Checkout
- Cancel at period end
- Open Stripe Dashboard

Required Stripe Dashboard setup:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe Products/Prices for AMG subscription plans
- Stripe test Price IDs and live Price IDs mapped to AMG plan tiers
- Webhook endpoint `/api/webhooks/stripe`
- Stripe Customer Portal settings, if client billing management is enabled

Live mode requires live Price IDs for every active subscription tier and billing interval before subscription setup links can be created. Test mode uses the explicit test Price ID fields or the legacy single Price ID fields for backwards-compatible local testing. Live mode does not fall back to legacy/test fields.

## Admin Diagnostics

Admins can review Stripe readiness at `/portal/admin/settings/billing`.

The diagnostics show:

- detected Stripe mode
- whether the secret key is present
- whether the webhook secret is present
- whether the publishable key is present
- configured site URL
- plans missing live Price IDs
- plans missing test Price IDs
- last webhook event timestamp/type/status
- webhook endpoint path

Secret values are never displayed.

## Live Stripe Dashboard and Vercel Steps

1. In Stripe live mode, create or confirm Products and Prices for AMG subscription plans.
2. Copy live Price IDs into the AMG portal for each active plan tier and billing interval.
3. Add live `STRIPE_SECRET_KEY` to Vercel Production.
4. Add live `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to Vercel Production only if Stripe.js is used.
5. Configure the production webhook endpoint in Stripe Dashboard: `https://www.amgaviationgroup.com/api/webhooks/stripe`.
6. Subscribe the endpoint to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `customer.created`
   - `customer.updated`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.created`
   - `invoice.finalized`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_method.attached`
7. Add the live `STRIPE_WEBHOOK_SECRET` from that endpoint to Vercel Production.
8. Set `NEXT_PUBLIC_SITE_URL` to `https://www.amgaviationgroup.com` or AMG's active production domain.
9. Run a live low-dollar test invoice or approved Stripe live test procedure.
10. Verify webhook processing marks the invoice paid or subscription active.
11. Confirm receipt/subscription emails send once.

## Double Billing Protection

`invoice_line_items_expense_unique` prevents the same expense from being billed twice when `expense_id` is present.
