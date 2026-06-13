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
- Quote approval now creates an invoice even for standalone/manual quotes.
- Quote-to-invoice conversion from admin now defaults to draft/admin review unless explicitly sent.
- Standalone invoice creation now accepts multiple line items.
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

## Vercel Status

- Branch preview is READY:
  - `https://amg1-4cr4gx2v3-amgaviations-projects.vercel.app`

## Incomplete / Still Risky

- Full quote revision workflow is not implemented yet.
  - Schema placeholders exist.
  - Current behavior locks non-draft edits and instructs revision, but does not clone a new revision automatically.
- Full invoice revision/credit/refund workflow is not implemented yet.
  - Schema placeholders exist.
  - Paid/void/written-off edits are guarded in payment/status flow, but full credit memo UI is pending.
- Invoice draft edit page is still pending.
- Quote PDF layout controls are stored but only partially reflected in the PDF renderer.
- Invoice PDF layout controls are stored/copied from quote but only partially reflected in the PDF renderer.
- Sample PDF preview buttons in Billing Settings are still pending.
- Quote templates data model exists, but template management/prefill UI is pending.
- Billing contacts are supported in delivery lookup, but profile/client UI for editing billing contact fields is pending.
- Receipt resend action from receipt ledger is still pending.
- Activity timeline is represented by document/payment ledgers and audit events, but no unified timeline component has been added to quote/invoice detail pages yet.

## Next Steps

1. Add invoice draft edit page and action with paid/partial/void lock rules.
2. Add create-revision action for sent quotes.
3. Add invoice revision/adjustment placeholder action and UI.
4. Add resend actions that reuse latest locked PDF by default.
5. Add Billing Settings sample quote/invoice/receipt PDF previews.
6. Add quote template management and prefill support.
7. Expand PDF renderer to honor all presentation flags.
8. Add billing contact fields to client/admin profile forms.
9. Add unified activity timeline on quote/invoice/payment detail pages.
