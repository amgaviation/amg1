# AMG Aviation Group

Production Next.js/Vercel website and integrated AMG portal system.

## Included

- Public AMG Aviation website
- Client, Crew, Admin, and Partner portals
- Supabase Auth/profile-based role routing
- Aircraft management and client aircraft visibility
- Mission requests, mission control, crew assignment, partner service requests
- Quotes, client quote review, invoices, payment-status tracking
- Crew expense submission, admin review, and invoice linkage
- Documents, messaging, notification center, audit log
- Admin user creation and invitation workflow
- Higgsfield-ready media placeholder registry

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
npm run test
npm run build
```

## Production Setup

1. Apply `docs/AMG_PRODUCTION_DATABASE_PATCHES.sql` in Supabase.
2. Configure environment variables from `.env.local.example` in Vercel.
3. Confirm private storage buckets exist for `documents` and `crew-credentials`.
4. Configure Supabase Auth email templates and redirect URL.
5. Add Resend/Twilio credentials when external delivery is ready.

Detailed setup lives in `docs/DEPLOYMENT.md`, `docs/NOTIFICATIONS.md`, and `docs/BILLING.md`.
