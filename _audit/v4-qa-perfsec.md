# Portal v4 — Speed / Security / Optimization Audit

Branch: `rebuild/portal-v4` · Static analysis only (no builds/tsc/servers run) · Date: 2026-07-05

Scope: `app/api/**/route.ts`, `app/portal/actions/*`, `lib/portal/*`, heaviest pages
(admin dashboard, mission-control, client dashboard, financial analytics).

## Severity counts

- **P1 (exploitable / operations-blocking): 0**
- **P2 (real risk / measurable slowdown): 5**
- **P3 (hygiene): 7**

No P1 found. Auth + role enforcement is present and consistent before every data
access; ownership scoping is real; the service-role client is server-only and never
reachable from client components; Stripe webhooks verify signatures; file routes scope
by the caller and use DB-controlled storage paths (no path traversal / IDOR); no key
material appears in `"use client"` files and no `NEXT_PUBLIC_*` secret misuse. The two
security items below are hardening gaps (forgeable/unauthenticated webhook + a missing
status re-check), not full bypasses.

---

## P1 — none

---

## P2 — real risk or measurable slowdown

### P2-1 · Financial analytics pulls entire financial tables, filters by date in memory, and re-runs on every range toggle
- Evidence:
  - `lib/portal/financial-analytics.ts:555-575` — `Promise.all` fetches `invoices`,
    `payments`, `quotes`, `expenses`, `client_subscriptions`,
    `subscription_billing_invoices` each with `select("*")` + embedded joins and **no
    `.limit()` and no `.gte/.lte` date filter** (only `stripe_webhook_events` is capped
    at `.limit(250)`).
  - `lib/portal/financial-analytics.ts:585-610,796-800` — the resolved `dateRange` is
    applied purely in JS via `isBetween(...)`, so the range selector never reduces what
    Postgres returns.
  - `app/portal/admin/financial/analytics/financial-analytics-dashboard.tsx:187` —
    client re-fetches `/api/portal/admin/financial/analytics` with `cache: "no-store"`
    on every range change, so each toggle re-downloads full financial history.
- Why it matters: cost scales with total business volume, not the selected window. In
  live Stripe mode this is the page most likely to slow to a crawl / hit serverless
  time or memory limits as invoices/payments accumulate. It is the top P2 and becomes
  P1 once the tables are large.
- Fix: push `dateRange.from/to` (widened to cover the previous-period and MTD/YTD
  comparators) into `.gte()/.lte()` on each query; select only the columns the
  aggregators use instead of `*`; add `.limit()`/`.range()` to the row tables that feed
  the detail grids.

### P2-2 · Systemic unbounded list queries — no pagination on any admin list page
- Evidence: in `lib/portal/queries.ts`, `listAllMissions` (280), `listAllQuotes` (381),
  `listAllInvoices` (422), `listAllPayments` (498), `listAllReceipts` (522),
  `listAllSubscriptions` (555), `listAllExpenses` (662), `listAllDocuments` (685),
  `listAllCrew` (745), `listAllCredentials` (750), `listAllPartnerAssignments` (795),
  `listAllPartners` (809), `listClients` (827), `listAllUsers` (860) all run
  `select(...)` with **no `.limit()`/`.range()`**. Only `listStripeSubscriptionEvents`
  (633, 50), `listNotifications` (951, 20) and `listAuditEvents` (978, 100) are bounded.
- Also: `app/portal/admin/mission-control/page.tsx:27` and
  `app/portal/admin/dashboard/page.tsx:33` both call `listAllMissions()` with **no
  filter**, fetching every mission row just to compute lane counts and render ≤6 cards.
- Why it matters: each list/dashboard render loads whole tables into the function.
  Grows unbounded with the business.
- Fix: add server-side pagination (`.range()`) to list pages; for the dashboard/mission
  flow-band counts use `count: "exact", head: true` aggregates (as `getAdminMetrics`
  already does at `queries.ts:983-1015`) instead of fetching rows.

### P2-3 · Per-user document page loads the org-wide documents table then filters in memory
- Evidence: `lib/portal/queries.ts:701-716` — `listDocumentsForUser` calls
  `listAllDocuments()` (entire `documents` table, all clients/crew/partners) and filters
  by `userId` in JS.
- Why it matters: every non-admin visit to a documents page transfers all other users'
  document metadata into the server process. Unbounded perf cost, and correct scoping
  depends entirely on the JS filter (a filter bug would leak cross-tenant rows).
- Fix: scope in the query — `.or("visibility.eq.public,uploaded_by.eq.<id>,scope_id.eq.<id>")`
  plus role/visibility conditions — so Postgres/RLS returns only the caller's documents.

### P2-4 · Notification fan-out sends email/SMS inline and sequentially on hot write paths
- Evidence: `lib/portal/notification-delivery.ts:63-67` — `queueNotificationDeliveries`
  explicitly "deliver[s] them immediately" (email/SMS provider round-trip during the
  server action). Callers loop and `await` one recipient at a time:
  `lib/portal/audit.ts:102-113` (`notifyAdmins` → one send per admin),
  `app/portal/actions/admin.ts:997-1006` (one send per crew offer),
  `app/portal/actions/messages.ts:106-117` and `189-198` (one send per thread member).
- Why it matters: `notifyAdmins` runs on many write paths (signup/access request, mission
  cancel, document upload, thread start). With N admins/recipients the request blocks on
  N sequential provider round-trips — added seconds of latency, and a slow/timed-out
  Resend call can fail the whole server action.
- Fix: `Promise.all` the recipient fan-out at minimum; better, insert the delivery rows
  (already status `processing`) and hand off to a background worker / queue so the
  request returns without waiting on the provider.

### P2-5 · Email status webhook accepts unauthenticated, forgeable delivery/bounce updates
- Evidence: `app/api/webhooks/email/status/route.ts:9-23` — parses JSON and calls
  `updateCommunicationDeliveryStatus(...)` with **no signature verification** (contrast
  `app/api/webhooks/email/inbound/route.ts:11-23`, which validates the Resend/svix
  signature, and the Stripe webhook which uses `constructEvent`).
- Why it matters: anyone who can POST to the endpoint can mark communications as
  `delivered`/`bounced`/`failed`, corrupting delivery state and bounce handling.
- Fix: verify the provider signature (reuse `provider.validateWebhookSignature`) before
  mutating any delivery record; reject on failure.

---

## P3 — hygiene

### P3-1 · Inbound email webhook fails open when the secret is unset in production
- `app/api/webhooks/email/inbound/route.ts:11` — signature is only checked when
  `NODE_ENV === "production" && RESEND_WEBHOOK_SECRET`. If the secret is missing in
  production the route silently accepts unauthenticated inbound mail. Fix: fail closed
  (reject) in production when the secret is absent.

### P3-2 · Document content/download routes don't re-check approval status
- `app/api/portal/documents/[id]/content/route.ts:22-25` and
  `app/api/portal/documents/[id]/download/route.ts:33-38` check `isPortalRole(role)` but
  not `status === "approved"`. The billing-documents routes (`.../billing-documents/[id]/
  content/route.ts:12-15`) and network-application-files route do check status. A
  suspended/pending user holding a live session could still hit these two routes. Fix:
  add the approved-status check for consistency.

### P3-3 · Financial analytics endpoints check role but not approval status
- `app/api/portal/admin/financial/analytics/route.ts:7-9` and the page at
  `app/portal/admin/financial/analytics/page.tsx:13` gate on `isAdminRole` only. Minor;
  align with the approved-status checks used elsewhere.

### P3-4 · New service-role client constructed on every notification
- `lib/portal/audit.ts:51` and `lib/portal/notification-delivery.ts:73` each call
  `createServiceClient()` per `notifyUser`, so a fan-out loop builds many clients. Pass a
  shared client through the loop.

### P3-5 · Dead client instantiation in `listDocumentsForUser`
- `lib/portal/queries.ts:705` creates `const db = await createServiceClient();` that is
  never used (the work is done by `listAllDocuments()`). Remove.

### P3-6 · iCloud conflict-copy files present in the tree
- e.g. `lib/site-analytics 2.ts`, `lib/site-config 2.ts`,
  `components/flightdeck/* 2.tsx`, `app/(public)/**/* 2.tsx`,
  `app/fonts/**/* 2.woff2`. The manifest (`docs/PORTAL_V4_MANIFEST.md:75`) warns to purge
  `* 2.*` conflict copies before staging; risk of shipping stale duplicates. Remove.

### P3-7 · Public consent endpoint is an unauthenticated service-role write with no rate limit
- `app/api/compliance/consent/route.ts:9-45` inserts into `consent_events` via the
  service client on every anonymous POST (by design, for website cookie consent), but has
  no rate limiting, so it can be spammed. Category values are validated, so no injection.
  Consider basic rate limiting / abuse protection.

---

## Notable strengths (context)

- Every mutating server action calls `actor([roles])` (`app/portal/actions/_helpers.ts:44`)
  which enforces auth, approval, and role; shared client+admin actions re-check ownership
  (`missions.ts:80-99,345`, `passengers.ts:66-91`, `stripe-invoices.ts:100-102`).
- File routes scope by caller and use DB-stored `storage_path` (UUID lookup, not user
  input) — no path traversal or IDOR observed.
- Stripe webhook uses `stripe.webhooks.constructEvent` with idempotency via
  `stripe_webhook_events` unique constraint (`lib/portal/stripe-invoices.ts:225,242`).
- Dashboards parallelize their fetches with `Promise.all`
  (`admin/dashboard/page.tsx:30`, `client/dashboard/page.tsx:41`); `getAdminMetrics`
  uses count-only queries.
- No `three`/`@react-three`/`gsap`/`react-pdf`/`framer-motion` imported into portal
  routes; only 7 `"use client"` files under `app/portal`, all legitimate.
