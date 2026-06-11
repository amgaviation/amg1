# AMG Portal Workflow Audit

## Completed Backbone

- Supabase Auth role routing for Client, Crew, Admin, Partner
- Admin user invitations and status management
- Aircraft creation/update/archive with duplicate tail checks
- Client aircraft visibility and active aircraft trip selectors
- Mission request submission and admin mission control
- Crew assignment offer/accept/decline
- Partner service request accept/decline/quote/milestone updates
- Document upload and admin review
- Messaging threads and message posting
- Quotes and client approval/rejection
- Invoices and manual payment tracking
- Crew expense submission, admin review, and invoice linkage
- In-app notifications and external delivery queue records
- Audit logging for key actions

## Known Credential-Dependent Items

- Supabase production credentials and SQL patch application are required before live workflow testing.
- Resend/Twilio credentials are required before external delivery can send.
- Provider webhooks are prepared by env convention but not enabled with route handlers yet.
- Payment collection is manual-status only until a payment provider is selected.

## QA Checklist

- Admin creates client user and sends invitation.
- Admin creates aircraft linked to that client.
- Client sees aircraft and can create trip request with it.
- Admin updates mission status and assigns crew/partner.
- Crew accepts/declines assignment.
- Partner accepts request and submits quote.
- Admin creates quote and client accepts/rejects.
- Admin creates invoice from accepted quote.
- Client sees invoice in Billing.
- Crew submits expense with receipt metadata.
- Admin approves expense and marks client-billable.
- Admin adds approved expense to invoice and confirms totals update.
- Admin records payment and client sees updated payment status.
- Admin reviews documents and credential statuses update.
- Notifications appear in-app and delivery rows are queued/suppressed as configured.

## Rollback

Revert the Vercel deployment and keep database records intact. Do not drop billing, notification, or aircraft records from production without a migration-specific data retention review.
