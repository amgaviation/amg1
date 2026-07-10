# AMG Connect — Portal Operational Restructure (July 2026)

## Design thesis

AMG Connect is one operational system with role-scoped lenses on the same
records — not a stack of parallel dashboards. The primary sidebar names a
small set of **workspaces** (the jobs a person signs in to do), never the
full sitemap. Each workspace opens on the work itself — a queue, a board, a
ledger — with contextual secondary navigation for everything inside it. The
Command Center leads with what needs a human decision now, ranked by time
and risk; statistics live in the workspace that owns them. Status movement
is guided: a record offers only its legal next steps, explains its gates,
and asks for confirmation and a reason where the server requires one.

Vocabulary contract (UI): **"Support Request"** is the umbrella record for
owner-controlled missions AMG supports. **"Mission Control"** is the
operations board — a view of the same records. The internal route segment
`trips` remains for deep-link stability but is never surfaced as a term.
AMG coordinates and supports; the owner retains operational control and the
PIC retains go/no-go authority — no portal state transfers control to AMG.

## Information architecture by role

Primary sidebar per role (≤ 7 entries; secondary destinations live in each
workspace's contextual sub-navigation and landing page):

**Admin / Super admin**
1. Command Center — `/portal/admin/dashboard` (ranked action queue)
2. Operations — `/portal/admin/trips` · Mission Control · Calendar · Tasks · Crew Map
3. Network — `/portal/admin/network` (landing) · Clients · Aircraft · Crew · Partners · Applications
4. Business — `/portal/admin/business` (landing) · Pipeline · Submissions · Quotes · Invoices · Payments · Receivables · Subscriptions · Expenses · Vendor Invoices · Payouts · Analytics · Pricing & Services
5. Communications — `/portal/admin/communications` (landing) · Messages · Emails · Documents · Notifications
6. Administration — Approvals · Waitlist · All Users · Permissions · Compliance · Security Review · Audit Log · System Health · Settings
7. Website — super admin only; never the default landing

**Client**: Home · Support Requests (+ Crew Availability) · Aircraft &
Passengers · Billing (Invoices · Quotes · Subscriptions) · Messages &
Documents. "New Support Request" is a persistent primary action in the
shell, not a nav destination. Notifications stay on the header bell;
profile/settings live in the account menu.

**Crew**: Home · Assignments (My Assignments · Open Pool) · Availability
(+ Live Map) · Credentials · Expenses & Payouts (Expenses · Invoices ·
Receipts) · Messages & Documents.

**Partner**: Home · Service Requests · Billing (Invoices · Quotes ·
Receipts) · Documents · Messages · Company. Partners receive task-scoped
information only.

## Operational flow map (verified against current code)

- Support-request lifecycle (`lib/portal/mission-lifecycle.ts`, enforced in
  `updateMissionStatus`): draft → submitted → under_review ⇄
  awaiting_client_info → quoted → approved → crew_assigned → scheduled →
  in_progress → completed; cancel from any non-terminal status. Movement
  gate (insurance/credentials) before crew_assigned/scheduled/in_progress;
  closeout gate (non-void invoice) before completed; overrides require a
  ≥10-char reason and are audited + broadcast.
- Client: submit request → respond to info requests → approve quote → pay
  invoice → travel supported → receipts/documents.
- Crew: offer → accept/decline (compliance-gated) → mission brief → fly →
  expenses/invoice → payout (7-day clock on completion).
- Partner: assignment → accept/decline → quote → milestones → invoice.
- Admin: intake/review → quote → crew & schedule → execution → closeout →
  billing; approvals/waitlist, document/expense review, communications.

## What changed structurally

- `DECK_NAV` (lib/portal/constants.ts) regrouped into workspaces; groups
  now carry a landing `href` + `icon`; items may be `secondary` (reachable
  via landing pages and search, omitted from the sub-nav strip).
- Portal shell renders a short workspace rail + a contextual sub-nav strip;
  the admin "View" switcher is now an explicit **Preview** control with a
  persistent banner whenever an admin is inside another role's workspace
  (admins keep their own access; nothing is impersonated).
- Command Center leads with a ranked action queue (urgency + SLA + time),
  then departures, blocked/at-risk work, my tasks, and recent material
  activity; business statistics moved to the Business workspace landing.
- Mission Control cards replaced the free 11-status selector with guided
  transitions (legal next steps only, confirmation + reason where gated);
  the mobile board is a stage selector + vertical list (no swipe-only UI).
- New admin landing pages: `/portal/admin/network`, `/portal/admin/business`;
  `/portal/admin/communications` is a real communications hub instead of a
  redirect to the audit log.
- All UI copy says "Support Request(s)"; `trips` remains only as a route
  segment; existing deep routes and redirects (`/portal/admin/missions*`,
  `/portal/client/invoices`, `/portal/partner/milestones`) are preserved.

## Contracts deliberately preserved

- Route paths, server actions, queries, RLS, permission matrix, audit
  logging, Stripe/Resend behavior: unchanged.
- `--deck-*` token names and `deck-*` class names: unchanged (values only).
- Kit exports in `components/portal/ui/*`: names + prop signatures kept.
- Verification-script contracts kept, except the admin nav group-label
  assertion in `scripts/verify-admin-access-communications.mjs`, updated to
  the new workspace labels (deliberate IA change, documented here).
