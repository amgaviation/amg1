# AMG Portal Readiness Audit

Date: 2026-06-26
Branch: `codex/portal-role-completion-audit`

## Roles Audited

- Public requester / unauthenticated user: `/login`, `/request-support`, `/pending-approval`, `/access-denied`
- Pending approval user: routed by `requireUser()` to `/pending-approval`
- Client / owner / requester: `/portal/client/**`
- Crew user: `/portal/crew/**`
- Admin: `/portal/admin/**`
- Super admin: `/portal/super-admin/website-editor/**`, with admin dashboard access through the admin shell
- Partner / vendor / FBO: `/portal/partner/**`

## Portal Routes Audited

- Root and routing: `/portal`
- Admin: `/portal/admin`, `/portal/admin/dashboard`, `/portal/admin/mission-control`, `/portal/admin/trips`, `/portal/admin/trips/[id]`, `/portal/admin/form-submissions`, `/portal/admin/clients`, `/portal/admin/crew`, `/portal/admin/aircraft`, `/portal/admin/partners`, `/portal/admin/messages`, `/portal/admin/messages/[id]`, `/portal/admin/quotes`, `/portal/admin/quotes/[id]`, `/portal/admin/quotes/[id]/edit`, `/portal/admin/quotes/new`, `/portal/admin/invoices`, `/portal/admin/invoices/[id]`, `/portal/admin/invoices/[id]/edit`, `/portal/admin/payments`, `/portal/admin/receipts`, `/portal/admin/subscriptions`, `/portal/admin/subscriptions/[id]`, `/portal/admin/subscriptions/new`, `/portal/admin/documents`, `/portal/admin/expenses`, `/portal/admin/compliance`, `/portal/admin/security-review`, `/portal/admin/user-approvals`, `/portal/admin/users`, `/portal/admin/audit-log`, `/portal/admin/system-health`, `/portal/admin/settings`, `/portal/admin/settings/billing`
- Client: `/portal/client`, `/portal/client/dashboard`, `/portal/client/trips`, `/portal/client/trips/[id]`, `/portal/client/trips/new`, `/portal/client/aircraft`, `/portal/client/documents`, `/portal/client/quotes`, `/portal/client/quotes/[id]`, `/portal/client/billing`, `/portal/client/billing/[id]`, `/portal/client/invoices`, `/portal/client/subscriptions`, `/portal/client/subscriptions/[id]`, `/portal/client/messages`, `/portal/client/messages/[id]`, `/portal/client/notifications`, `/portal/client/settings`
- Crew: `/portal/crew`, `/portal/crew/dashboard`, `/portal/crew/missions`, `/portal/crew/missions/[id]`, `/portal/crew/assignments`, `/portal/crew/availability`, `/portal/crew/credentials`, `/portal/crew/expenses`, `/portal/crew/documents`, `/portal/crew/messages`, `/portal/crew/messages/[id]`, `/portal/crew/notifications`, `/portal/crew/profile`, `/portal/crew/settings`
- Partner: `/portal/partner`, `/portal/partner/dashboard`, `/portal/partner/requests`, `/portal/partner/requests/[id]`, `/portal/partner/documents`, `/portal/partner/messages`, `/portal/partner/messages/[id]`, `/portal/partner/milestones`, `/portal/partner/notifications`, `/portal/partner/profile`, `/portal/partner/quotes`, `/portal/partner/settings`
- Super admin: `/portal/super-admin/website-editor`, `/portal/super-admin/website-editor/preview/[draftId]`

## Major Issues Found

- Shared data tables rendered as desktop tables on mobile and did not provide a consistent row/card click target.
- Generic admin record management used a light admin-template surface inside the dark AMG portal and relied on a fixed internal table scroll area.
- Admin dashboard, notifications, and form-submission review areas contained low-contrast slate/amber text intended for light backgrounds.
- Pending approval and access denied states were branded but too thin for operational account states.
- Portal routes had no shared loading or error fallback, making slow or failed Supabase-backed pages feel unfinished.

## Fixes Implemented

- Added responsive mobile card rendering to `DataTable`, with optional row destination support through `getHref`.
- Enabled full-row/card opening for support request registers, partner service requests, client billing, and admin invoices where no inline action form would be nested.
- Rethemed `AdminRecordManager` to a dark AMG operations surface, improved selected-record details, removed the fixed internal table height, and added a mobile record-card list.
- Corrected dark-theme contrast on admin dashboard attention items, new website submissions, client notifications, crew notifications, and form-submission review cards.
- Added portal-level loading and error states for polished operational fallbacks.
- Expanded pending approval and access denied pages with AMG-specific next steps, contact action, and sign-out path for pending users.

## Supabase And Backend Notes

- No RLS policies, Supabase migrations, service-role behavior, or auth/session logic were changed.
- Existing server guards remain in place: `requireUser()`, `requireRole()`, and `requireSuperAdmin()`.
- The UI continues to depend on existing query helpers in `lib/portal/queries.ts` and existing server actions under `app/portal/actions/**`.
- Manual credential-backed checks are still required for actual login/logout, role redirects, record mutation flows, uploads, messaging, quote/invoice workflows, and RLS enforcement.

## Responsive Notes

- Shared tables now collapse to stacked cards below the medium breakpoint.
- Admin record-management pages now expose mobile-friendly record cards and keep the detail panel below the list instead of forcing a desktop table interaction.
- Production build completed for all portal routes.
- Public access viewport verification passed at 1440, 1280, 1024, 768, 430, 390, and 360 px for `/login`, `/pending-approval`, and `/access-denied` with no page-level horizontal overflow.
- Authenticated role viewport verification at those widths still needs approved test users or seeded sessions.

## Remaining Manual Test Items

- Sign in as each approved role and verify dashboard landing: client, crew, partner, admin, super admin.
- Verify a pending user lands on `/pending-approval` and can sign out.
- Verify a role mismatch lands on `/access-denied` and does not expose unauthorized controls.
- Create, view, and edit support requests, aircraft, clients, crew profiles, partners, quotes, invoices, subscriptions, documents, expenses, and messages with seeded records.
- Verify file uploads and billing-document downloads against Supabase storage in a configured environment.
- Verify email/communications actions with configured provider credentials.

## Verification

- `npm install`: passed; npm reported 2 moderate audit vulnerabilities.
- `npm run lint`: passed after removing stale generated `.next/types` output.
- `npm run build`: passed.
- `npm test`: passed; script maps to `npm run typecheck`.
- Playwright public responsive smoke: passed for `/login`, `/pending-approval`, and `/access-denied` at 1440, 1280, 1024, 768, 430, 390, and 360 px.

## Production Risks

- This pass did not alter database schema or RLS, so any existing backend data gaps remain dependent on Supabase project state.
- Browser automation for authenticated role pages was not completed in this local pass because role-specific portal QA requires authenticated accounts and realistic seeded data.
