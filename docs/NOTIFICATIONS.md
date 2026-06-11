# AMG Notifications

## Architecture

The portal creates in-app notification records through `notifyUser` and `notifyAdmins`. User-targeted notifications also create delivery rows in `notification_deliveries`.

Channels:

- `in_app`
- `email`
- `sms`

Statuses:

- `queued`
- `processing`
- `sent`
- `delivered`
- `failed`
- `cancelled`
- `suppressed`

## Providers

- Email provider: Resend
- SMS provider: Twilio

Provider code is isolated in `lib/portal/notification-delivery.ts`.

Missing credentials do not pretend delivery succeeded. Delivery records are saved as `suppressed` with a configuration message.

## Required Setup

Apply the notification section in `docs/AMG_PRODUCTION_DATABASE_PATCHES.sql`, then set the provider variables in Vercel when ready.

## Current Triggers

- Aircraft added/updated
- User approved/invited
- Mission submitted/status changed
- Crew assignment offered
- Partner assignment created
- Partner quote/status responses
- Quote sent and quote response
- Invoice issued/payment updated
- Expense review
- Credential submitted
- New message thread/message

## Webhooks

Delivery webhook routes are not enabled until production provider credentials and webhook signing secrets are available. Use `NOTIFICATION_WEBHOOK_SECRET` for future signature verification.
