# AMG Communications Center

## Overview

The communications center adds an admin-only operational inbox for AMG email and message handling. Threads are organized around clients, aircraft, support requests, crew assignments, quotes, invoices, attachments, internal notes, delivery status, and audit events.

The module is intentionally not a generic email clone. It keeps the AMG operating principle visible: support requests are reviewed before acceptance, and no request is accepted until operational, aircraft, crew, approval, and condition items have been reviewed.

## Admin Route

- Admin inbox: `/portal/admin/messages`
- Send API: `POST /api/communications/send`
- Inbound webhook: `POST /api/webhooks/email/inbound`
- Status webhook: `POST /api/webhooks/email/status`
- Attachment signed URL: `GET /api/communications/attachments/:id`

## Database Migration

Migration file:

- `supabase/migrations/20260620043000_portal_communications_center.sql`

Tables added:

- `communication_threads`
- `communication_messages`
- `communication_participants`
- `communication_attachments`
- `communication_templates`
- `communication_audit_log`
- `communication_user_state`

Storage bucket added:

- `communication-attachments`

The bucket is private and intended for signed admin downloads only.

## RLS And Permissions

RLS is enabled on every communication table. V1 exposes the communications center only to approved admins in the UI. Policies allow:

- Approved admins to manage communication records.
- Clients to select only explicitly `client_visible` messages tied to their client profile.
- Crew to select only explicitly `crew_visible` messages tied to their crew assignment.

Internal notes use `admin_only` visibility and must not be sent as email or exposed to client/crew views.

## Email Provider

The current provider abstraction uses Resend because the repo already sends email through Resend-style REST calls.

Server-only environment variables:

- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `EMAIL_DEFAULT_FROM`
- `EMAIL_OPS_FROM`
- `EMAIL_CREW_FROM`
- `EMAIL_BILLING_FROM`
- `EMAIL_SUPPORT_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_INBOUND_DOMAIN`
- `COMMUNICATIONS_EMAIL_MOCK`

Public env vars are not used for secrets.

If the provider is not configured, the admin UI disables sending and the server path records failures instead of pretending success. For local provider-mock testing, set:

```bash
COMMUNICATIONS_EMAIL_MOCK=true
```

Do not enable that flag in production.

## Inbound Webhook Setup

Configure the email provider to call:

```text
https://<site-domain>/api/webhooks/email/inbound
```

Configure delivery/status events to call:

```text
https://<site-domain>/api/webhooks/email/status
```

Set `RESEND_WEBHOOK_SECRET` in production so webhook signatures can be checked.

Preferred inbound routing:

- Reply alias: `thread+{threadPublicId}@{EMAIL_INBOUND_DOMAIN}`
- Subject token: `[AMG-{threadPublicId}]`
- Header matching: `In-Reply-To`, `References`, provider message id
- Sender fallback: exact email match to a client profile

Unknown inbound emails are placed into the unassigned inbox for admin review.

## Local Webhook Simulation

Fixture:

- `tests/fixtures/email-inbound.json`

Example local call:

```bash
curl -X POST http://localhost:3000/api/webhooks/email/inbound \
  -H 'content-type: application/json' \
  --data @tests/fixtures/email-inbound.json
```

The fixture includes a local text attachment. Inbound storage requires the Supabase database migration and storage bucket to be applied.

## Templates

The migration seeds these templates:

- Support Request Received
- Additional Information Needed
- Support Request Status Update
- Crew Availability Request
- Crew Assignment Confirmation
- Quote Ready
- Invoice Sent
- Payment Received
- Document Request
- Maintenance Coordination

Templates support `{{variable}}` interpolation in the server layer. Missing variables render as empty strings and do not crash sending.

Operational email footer:

> AMG support is reviewed before acceptance. No request is considered accepted until applicable operational, aircraft, crew, approval, and condition items have been reviewed.

## Safe Error Message Standard

Safe error helpers live in:

- `lib/errors/user-facing-errors.ts`
- `components/ui/safe-error-message.tsx`

Public, client, crew, vendor, and admin-facing messages must not expose raw database, provider, auth, SQL, file path, stack trace, or runtime details. User-facing messages direct users to:

```text
information@amgaviationgroup.com
```

Detailed failures are logged server-side with a safe reference id where practical.

## Verification

Run:

```bash
npm run communications:verify
npm run typecheck
npm run lint
npm run build
```

The communications verification script checks required files, migration tables, RLS statements, default templates, the safe error standard, the admin UI affordances, and the inbound fixture.

## Known V1 Limits

- Client and crew communications UI remains conservative; the new operational email center is admin-only until broader visibility workflows are explicitly enabled.
- Full-text search is not implemented yet; V1 search filters recent thread summaries in the server read layer.
- The local webhook simulation needs a running app and an applied Supabase migration.
- Provider-specific attachment fetching is not implemented for webhook payloads that only send temporary attachment URLs; inline/base64 fixture attachments are stored immediately.

## Rollback Notes

The migration is additive. To roll back, remove the admin route changes, remove the new API routes, and drop the `communication_*` tables and `communication-attachments` bucket after exporting any operational records that must be retained.
