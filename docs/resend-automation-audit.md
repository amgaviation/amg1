# Resend automation audit

This repository now treats `lib/email/automation.ts` as the event-name source of truth for AMG transactional automation workflows. Application code must emit server-side events through that module or perform an explicitly manual admin-composed send through the communications center.

## Event catalog

The centralized event constants cover:

- `access.requested`
- `access.approved`
- `access.denied`
- `access.waitlisted`
- `support.requested`
- `support.status_changed`
- `pilot_application.received`
- `pilot_application.status_changed`
- `document.requested`
- `document.expiring_soon`
- `mission.status_changed`
- `crew.assigned`
- `quote.sent`
- `quote.approved`
- `invoice.sent`
- `invoice.overdue`
- `payment.received`
- `post_mission.closeout`

## Current outbound owners

- Transactional email: Resend through `lib/portal/notification-delivery.ts` or `lib/email/provider.ts`.
- Manual admin-composed email: Resend through the communications center provider path.
- Portal/in-app notifications and messages: portal tables; external delivery must be intentionally queued and logged.
- SMS notifications: Twilio remains a separate channel for portal notifications and is not an email path.

## Duplicate-send controls

`sendEmail` accepts an `idempotencyKey` and suppresses a repeat send when an already-sent Resend email with the same key is logged. Quote, invoice, and payment receipt sends use stable keys based on event name, record id, and recipient email.

## Resend dashboard automation status

No live Resend dashboard automations were created or enabled in this implementation because this workspace does not expose Resend dashboard credentials or a safe approved test recipient. To complete dashboard setup, provide controlled access to the Resend project and confirm verified AMG sender/domain status. Automations should be created disabled by default until production enablement is approved.
