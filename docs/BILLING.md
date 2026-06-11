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

No live payment provider is configured in this repository. The system supports manual payment-status tracking now. A Stripe or other payment adapter can be added later without faking successful collection.

## Double Billing Protection

`invoice_line_items_expense_unique` prevents the same expense from being billed twice when `expense_id` is present.
