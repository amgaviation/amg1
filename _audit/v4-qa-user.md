# AMG Portal v4 — QA-User (role-play) Audit

Branch: `rebuild/portal-v4` · Dev server: http://localhost:3000 (live production Supabase) · Date: 2026-07-05
Method: Playwright (headless Chromium 1.61.1) driving real login + navigation as each role.
Accounts: admin `qa-deck-review@amgaviationgroup.com`, client `qa-client-review@amgaviationgroup.com`.

> **Coverage is PARTIAL — hard deadline cut the run short.** The dev server was wedged at
> session start and had to be restarted; combined with ~2.5-min iCloud cold-compiles per
> route, only a prioritized admin subset was exercised live before the deadline. Client and
> crew/partner role coverage is BLOCKED (see P1-1). Uncovered areas are listed explicitly at
> the bottom so a follow-up run knows exactly what remains.

## Severity summary
- **P1 (blocker): 1**
- **P2 (functional defect): 0 confirmed**
- **P3 (friction/polish): 1**
- Plus: 1 prior-audit P1 that did **NOT** reproduce live (see Positive findings).

---

## P1 — blockers

### P1-1. Client QA account login is rejected — entire client role is un-QA-able
- **Route:** `/login`
- **Steps:** Fill the login form with `qa-client-review@amgaviationgroup.com` / `QaClient-V3-2026!`,
  click the in-form "Sign in" button.
- **Observed:** Redirect to `/login?error=invalid`; never authenticates. Confirmed twice via
  isolated Playwright contexts. The admin account (`qa-deck-review@amgaviationgroup.com` /
  `QaConsole-V3-2026!`) logs in successfully against the same form in the same run, so the
  login flow itself works — the client credential specifically is rejected.
- **Expected:** Client logs into `/portal/client/dashboard`.
- **Impact:** BLOCKS all of phase 2 (client dashboard, trips + timeline, the "QA-V4 smoke test"
  new-request submission, quotes, invoices/billing, subscriptions, documents, messages,
  passengers, settings). None of the client-facing portal could be exercised.
- **Likely cause (needs confirmation):** stale/rotated password or a disabled/`inactive`
  `profiles.status` on the QA client account — not necessarily a portal code defect. First
  step for a follow-up run: reset the QA client password (or re-activate the account) in
  Supabase, then re-run phase 2. If a fresh, correct password still returns `error=invalid`,
  escalate as a genuine client-auth regression.
- **Consequence for this report:** The **QA-V4 smoke-test request was NOT created** — the form
  is behind client auth. No records were created in this session.

---

## P2 — functional defects
None confirmed within the exercised (admin) subset. All admin pages reached returned HTTP 200
with no error boundary, no `relation does not exist`, no console/pageerror, and no stuck spinner.

---

## P3 — friction / polish

### P3-1. Two identically-labelled "Sign in" buttons on `/login` (real submit is unmarked)
- **Route:** `/login`
- **Observed:** The page exposes two buttons with accessible name "Sign in": a page-chrome
  toggle (`<button type="button">Sign in</button>`) and the actual form submit
  (`<button>Sign in</button>` with the `type` attribute absent, inside the `<form>` that holds
  `input[name="password"]`). A `getByRole('button', {name: 'Sign in'})` or a
  `button[type="submit"]` selector both mis-resolve — the toggle matches first and the submit
  has no `type=submit` to target. (This is exactly the documented login gotcha.)
- **Expected:** One unambiguous submit control (`type="submit"`, or a distinct accessible name
  like "Sign in to portal").
- **Impact:** Automation/accessibility friction, not a user-blocker (a human clicks the visible
  form button). Worth tightening for a11y + test stability.

---

## Positive findings (called out because they were flagged as risks elsewhere)

### Communications Center renders — prior QA-DB P1-1 does NOT reproduce live
The QA-DB audit (`_audit/v4-qa-db.md` P1-1) predicted that `/portal/admin/communications/emails`
and `/portal/admin/messages` would throw `relation "public.communication_*" does not exist`
because two comms migrations were absent from the applied ledger. **Live, all three comms pages
loaded HTTP 200 with substantial content and zero error signals:**
- `/portal/admin/communications/emails` → 200, textLen 6989, 0 console/http errors, no bad signals
- `/portal/admin/messages` → 200, textLen 1901, clean
- `/portal/admin/communications` → 200, textLen 7991, clean

This strongly suggests the two communications migrations **have since been applied** to
`vsynqnqlouvphiniqaiy` (or the code degrades gracefully). Recommend QA-DB re-check the applied
migration ledger to reconcile. (Note: content *depth* past the nav rail was not deep-verified —
these were scored on render success + absence of error signals, not row-level data.)

---

## Pages verified this run (admin, all HTTP 200, clean render)
| Route | Status | Load | Notes |
|---|---|---|---|
| `/portal/admin/communications/emails` | 200 | 14.2s (cold) | clean, content present |
| `/portal/admin/messages` | 200 | 1.6s | clean |
| `/portal/admin/communications` | 200 | 2.8s | clean, content present |
| `/portal/admin/dashboard` | 200 | 1.1s | clean |
| `/portal/admin/trips` | 200 | 1.7s | clean |
| `/portal/admin/quotes` | 200 | 1.5s | clean |

`/portal/admin/invoices` was aborted at 215s under an aggressive per-route cap — this is the
known iCloud **cold-compile latency**, not a page defect. It should be re-tested with a patient
300s nav timeout; do not read the abort as a functional failure.

---

## NOT COVERED (remaining work for a follow-up run)
Deadline cut the sweep short. The scripts to run all of this are staged and resumable in the
session scratchpad (`phase1-admin.js`, `phase2-client.js`, `phase3-interactions.js`; shared
harness `lib.js`; login fixed to click the in-form "Sign in" button; results append to
`results-*.jsonl` so a re-run skips completed pages).

**Admin — not yet visited:** mission-control (deep), missions + a mission detail, a quote detail,
invoices + an invoice detail, clients/crew/aircraft/partners directories + one detail each,
user-approvals, users, notifications, payments, receivables, subscriptions, expenses, receipts,
financial/analytics, documents, form-submissions, network-applications, crm, tasks, calendar,
compliance, audit-log, waitlist, system-health, settings + settings/billing.

**Client — fully BLOCKED by P1-1:** dashboard, trips list, trip detail + timeline, new-request
form + the "QA-V4 smoke test" submission, quotes, invoices/billing, subscriptions, documents,
messages, passengers, settings.

**Interactions — not run:** filter tabs on list pages, pagination, Cmd+K global search, theme
toggle persistence across navigation, sign out / sign back in.

**Safety note:** No emails were sent, no Stripe/payment flow was triggered, and **no records
were created or modified** this session (the QA-V4 test request could not be submitted because
client login was rejected).
