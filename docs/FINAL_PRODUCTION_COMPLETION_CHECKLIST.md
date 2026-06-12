# Final Production Completion Checklist

Branch: `feat/final-production-completion`

## Completed in this pass

- Created the requested final production branch from the current working production-improvement branch.
- Converted the public Contact / Support Request form from static markup into a real server action.
- Public support requests now persist as submitted mission records without fabricating a portal user.
- Public support requests notify approved admins and create an audit event with `actor_role = public`.
- Added duplicate protection for matching recent public support requests.
- Added query-prefill from Services, Aircraft, Plans, Pilot Network, and global CTAs into `/contact`.
- Added `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/pending-approval`, and `/access-denied`.
- Added Supabase password reset request and password update actions.
- Connected pending/suspended/cross-role portal guards to explicit status pages.
- Added `.env.example`.
- Added `scripts/audit-media-uniqueness.ts` and `npm run media:audit`.
- Added Admin-only `/portal/admin/system-health` with database, provider, media, notification, aircraft, expense, and deployment checks.

## Validation status

- Passed: `npm run media:audit`
- Passed: `npm run typecheck`
- Passed: `npm run build`
- Pending: Vercel preview check

## Credential-dependent items

- Live Supabase email verification delivery requires production Supabase Auth email settings.
- Resend/Twilio delivery requires provider credentials in Vercel environment variables.
- QA bootstrap accounts require explicit `PORTAL_BOOTSTRAP_*_EMAIL` values and must not write credentials to Git.

## Remaining production hardening

- Expand media manifest to cover every visible major media placement.
- Add unique final OG images for each public route.
- Add Admin system health page.
- Add deeper browser and accessibility QA reports.
- Add full end-to-end auth and portal workflow tests when production credentials are available.
