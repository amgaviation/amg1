# Billing Refinement Progress

Branch: `feat/billing-workflow-refinement`

## Completed

- Added admin quote workspace routes:
  - `/portal/admin/quotes/new`
  - `/portal/admin/quotes/[id]`
  - `/portal/admin/quotes/[id]/edit`
- Updated admin quote register with open/edit actions and deposit display.
- Added standalone/manual-recipient quote creation.
- Added mission-linked and client-linked quote creation from the Quotes tab.
- Added quote draft editing for editable statuses.
- Added quote PDF preview action that generates/stores a PDF and downloads it.
- Added quote send/resend action.
- Added client quote “Request Changes” action.
- Added admin quote revision creation:
  - clones sent/approved/revision-requested quote terms into a new draft
  - copies quote line items
  - links the new draft with `revised_from_quote_id`
  - marks the prior quote as superseded/void for direct editing purposes
- Quote approval now creates an invoice even for standalone/manual quotes.
- Quote-to-invoice conversion from admin now defaults to draft/admin review unless explicitly sent.
- Standalone invoice creation now accepts multiple line items.
- Added invoice draft editing:
  - `/portal/admin/invoices/[id]/edit`
  - draft/ready-to-send lock rules
  - editable recipient override, CCs, due date, line items, terms, notes, and PDF presentation fields
  - server-side invoice total recalculation
- Added admin invoice PDF actions on invoice detail:
  - Preview PDF
  - Send / Resend PDF
  - locked paid/void/written-off invoices from resend actions
- Direct invoice status update to `paid` is blocked; payment recording is required.
- Payment recording supports:
  - amount
  - method
  - reference
  - notes
  - internal notes
  - send receipt now yes/no
- Added admin ledgers:
  - `/portal/admin/payments`
  - `/portal/admin/receipts`
- Added admin nav links for Payments and Receipts.
- Added client invoice portal payment placeholder copy.
- Extended email sending to support CC recipients.
- Extended billing email recipient selection to use recipient override, billing contact email, manual email, then client email.
- Extended PDF data builders to suppress client-hidden line items and use billing/manual recipient context.
- Added billing contact management:
  - client settings form for billing contact name/email/phone and CC emails
  - admin client directory inline billing delivery editor
  - shared billing contact update action with audit logging
- Added unified activity timelines to admin quote and invoice detail pages using:
  - audit events
  - generated/sent PDFs
  - payments
  - receipt PDFs

## Migrations Added

- `supabase/migrations/20260613133000_billing_workflow_refinement.sql`

This migration adds:

- billing contact fields on profiles
- manual quote recipient fields
- quote/invoice recipient override and CC fields
- aviation scope fields for standalone quotes
- deposit timing fields
- quote/invoice presentation/layout fields
- quote/invoice revision placeholder fields
- aviation line item accounting fields
- receipt suppression/internal payment note fields
- billing document versioning metadata
- quote template placeholder tables

## Supabase Status

- Applied to project `vsynqnqlouvphiniqaiy` (`AMG Aviation Portal`).
- Verified:
  - `quote_templates` exists
  - `quote_template_line_items` exists
  - `quotes.recipient_email` exists
  - `billing_documents.version_number` exists

## Build Status

- `npm run typecheck`: passed
- `npm run build`: passed
- Latest local build after invoice draft editing and quote revision work: passed

## Vercel Status

- Branch preview is READY:
  - `https://amg1-4cr4gx2v3-amgaviations-projects.vercel.app`

## Incomplete / Still Risky

- Quote revision workflow now creates a draft clone, but still needs richer version history UI and client-facing revision threading.
- Full invoice revision/credit/refund workflow is not implemented yet.
  - Schema placeholders exist.
  - Paid/void/written-off edits are guarded in payment/status flow, but full credit memo UI is pending.
- Invoice draft edit page exists for draft/ready-to-send invoices; sent/paid invoice adjustment and credit memo flows are still pending.
- Quote PDF layout controls are stored but only partially reflected in the PDF renderer.
- Invoice PDF layout controls are stored/copied from quote but only partially reflected in the PDF renderer.
- Sample PDF preview buttons in Billing Settings are still pending.
- Quote templates data model exists, but template management/prefill UI is pending.
- Billing contacts are supported in delivery lookup and can be edited from client settings or the admin client directory.
- Receipt resend action from receipt ledger is still pending.
- Activity timeline exists on quote and invoice detail pages; broader payment/receipt detail timelines are still pending.

## Next Steps

1. Add invoice revision/adjustment placeholder action and UI.
2. Add receipt resend action from the receipt ledger.
3. Add Billing Settings sample quote/invoice/receipt PDF previews.
4. Add quote template management and prefill support.
5. Expand PDF renderer to honor all presentation flags.
6. Add payment/receipt detail views if AMG needs deeper ledger drill-down.
