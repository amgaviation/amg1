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
- Stripe Price IDs mapped to AMG plan tiers
- Webhook endpoint `/api/webhooks/stripe`
- Stripe Customer Portal settings, if client billing management is enabled

## Double Billing Protection

`invoice_line_items_expense_unique` prevents the same expense from being billed twice when `expense_id` is present.
