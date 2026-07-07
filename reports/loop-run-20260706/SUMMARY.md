# Loop Run Summary — 2026-07-06

2-hour multi-agent review & fix loop per LOOP_PLAN.md. Branch `claude/new-session-mt12tj`, PR #97 (draft).
START 17:50:49 UTC · primary task + single review pass + 1 full audit cycle + verification pass completed inside budget.

## Role permissions system (primary task, §1b)

**Status: all four phases complete, single §4b review pass complete ✓ — `permissions: reviewed ✓`**

> The referenced `USER_ROLE_PERMISSIONS_PLAN.md` was absent from the repo/uploads/git history.
> It was reconstructed from LOOP_PLAN §1b/§4b decided points + `docs/role-access-matrix.md` and
> committed to the repo root as the spec of record. Review before relying on it.

- **Phase 1 — Foundation:** `role_permissions` table (additive, RLS, admin-only read) + 92-row seed generated from `DEFAULT_PERMISSIONS`; **applied to prod project `vsynqnqlouvphiniqaiy`**. `lib/portal/permissions-catalog.ts` (23 modules × view/add/edit/delete, defaults mirror pre-existing behavior), `lib/portal/permissions.ts` (`can()`, cached matrix, DB row → code default → deny, super_admin always allowed, fail-safe to defaults).
- **Phase 2 — Admin UI:** `/portal/admin/settings/permissions` role-tabbed matrix; super_admin-only save with server-side dependency normalization; full old→new audit trail; restore-defaults; read-only for admins.
- **Phase 3 — Enforcement:** `actor(roles?, perm?)` wired at **117 action call sites**; `requireRolePermission()` guards on **75 pages**; `/portal/no-access` notice page.
- **Phase 4 — Polish:** nav filtered by view flags (server-resolved, fails open); admin dashboard, Cmd+K search, and buttons mirror the matrix.
- **§4b review pass (ran once):** 30 findings from 5 agents — 1 P0 (matrix tab unmount wiped non-visible roles on save — fixed via forceMount), 2 P1 (dashboard dead-ends — fixed; updateTag claim — refuted against Next 16.2.9 source), 10 P2 + 12 P3 triaged; 24 fixed, 4 logged open, 5 to backlog.
- **Side effect:** syncing `database.types.ts` with prod fixed **33 pre-existing typecheck errors** — `npm run lint` was red on `main` before this run.
- **Deployment note:** matrix changes apply immediately (tag invalidation verified). On a future self-hosted multi-instance deploy a shared cacheHandler would be needed; on Vercel no action.

## Fixes applied (by severity, finding IDs)

**Permissions review pass (§4b):** P0 ×1 (D-P-01) · P1 ×1 (C-P-01) · P2 ×9 (A-P-01, A-P-02, C-P-02, E-P-02, E-P-03, E-P-04, E-P-05, E-P-06, D-P-02, D-P-03, D-P-04 partial) · P3 ×10 (A-P-03, B-P-02/03/04, C-P-04/05, D-P-05/06/07/08, C-P-06 copy)

**Audit cycle 1:** P1 ×3 (B-1-01 quote-response guard; D-1-01 mobile table columns; A-1-01 missions 1000-row cap) · P2 ×6 (B-1-04, E-1-05, D-1-03, D-1-04, B-1-10 partial, B-1-09 partial, C-1-04) · P3 ×5 (A-1-07, A-1-08, C-1-05, D-1-06 + honeypot logging)

**Verification pass (cycle 2):** one adversarial agent re-checked all 12 applied-fix clusters against the live code. 9 verified correct as shipped. 3 real problems found and fixed: V-2-01 (the mark-paid audit addition sat in a deliberately unreachable branch — dead block removed; payments only flow through recordInvoicePayment/Stripe, both fully audited), V-2-02 (dashboard "Business" quick links had been missed by the permission gating — now gated), V-2-03 (mission chunk fetch could duplicate a boundary row under concurrent inserts — id dedup added).

All work committed per phase/cycle; typecheck 0 errors and `next build` green at every commit.

## Open bugs not fixed (priority order)

1. **E-1-01 P1** — Subscription credit liability only accrues: credits are never applied to invoices, never expire, `credit_balance` race-prone. Needs drawdown RPC + expiry sweep. (schema/RPC work)
2. **E-1-02 / B-1-07 P1** — No automatic invoice `overdue` transition, no dunning, no quote `expired` transition; repo has **no cron infrastructure at all**. One nightly job would also serve credential expiry (E-1-06), stale-subscription reconciliation (B-1-05), and pending_checkout cleanup (E-1-11).
3. **E-1-03 P1** — `tax_total` typed by hand, never derived from taxable lines × `billing_settings.tax_rate`; markup columns unused → sales-tax audit exposure. Needs owner sign-off on computation rules.
4. **E-1-04 P1** — Mission state machine unenforced: no insurance-confirmed gate before movement, no closeout gate before `completed`, transitions unvalidated beyond vocabulary (vocabulary check added this run). Needs owner confirmation of gate rules.
5. **B-1-08 P2** — `/contact` 301s to the quote form; suspended/denied/no-access users literally cannot contact ops; contact-inquiry pipeline is dead code. (new page = feature; needs owner call)
6. **B-1-02/B-1-03 P2** — Crew decline after accept leaves mission `crew_assigned` with a declined pilot; `assignCrew` upsert can downgrade an accepted assignment to `offered`; no admin unassign action.
7. **B-1-06 P2** — Stripe `price_mismatch` self-heals by overwriting the local price with Stripe's — mismatches silently accepted.
8. **A-1-02/A-1-01-rest P2** — clients directory loads 7 full datasets for count badges; invoices/quotes lists still in-memory paginated (missions fixed this run).
9. **A-1-03 P2** — middleware pays a network `auth.getUser()` round-trip every portal request (use `getClaims()`).
10. **A-1-04 P2** — `xlsx` dependency has unfixed high-severity advisories (write-only usage mitigates; swap to CDN build or CSV writer).
11. **C-1-01 P2** — "No online payment" acknowledgment vs live Stripe pay button contradiction — compliance copy frozen by Rule 4; owner must pick the story.
12. **C-1-02 P2** — Pilot double-intake (network application vs access request) with no status visibility, duplicate-record risk.
13. **E-1-09/E-1-10 P3** — invoice-from-quote duplicate race + missing unique constraints on quote/receipt numbers (DB constraints; frozen).
14. **C-P-03 P2 (permissions)** — crew "documents" matrix cell is inert; crew doc surfaces map to the crew module.
15. **B-1-11/B-1-12 P3** — thread read-state never tracked; loading/error boundaries missing on high-traffic segments.

## Portal feature backlog (top 10 by business value)

1. Nightly ops cron (Vercel Cron or pg_cron): overdue/dunning + quote expiry + credential expiry alerts + subscription reconciliation + checkout cleanup (unlocks 5 open items) — ~1-2 days
2. Subscription credit drawdown + liability tile in analytics (E-1-01/E-1-07) — ~2-3 days
3. Mission gates: insurance-confirmed before movement; closeout completeness before `completed` (E-1-04) — ~2 days
4. Crew mission-pay tracking (`paid_at`, amount, payables aging) — verifies the 7-day pilot-payment commitment (E-1-08) — ~2-3 days
5. Financial analytics: quote turnaround vs SLA, win rate, margin per mission, pilot utilization (E-1-07) — ~3-5 days
6. Real `/contact` support form wired to the existing contact-inquiry pipeline (B-1-08) — ~0.5-1 day
7. Separate payments authority (invoices.pay/void) for separation of duties (E-P-01) — ~2-3 days
8. Per-user permission overrides + notify-admins on permission change (E-P-07) — ~2-3 days
9. CRM stale-lead queue (null next_action_at / no recent activity) + source attribution (E-1-12) — ~1 day
10. Client "provide requested info" affordance on awaiting_client_info missions (B-1-09) — ~1 day

## Public-site out-of-scope suggestions (untouched, per freeze)

- C-1-06: pilot-apply success copy (expectations, confirmation-email pointer)
- C-1-07: align "credentials only through secure portal" copy with the public upload form
- C-1-01 (public half): reconcile pricing FAQ payment language
- A-1-06: transcode hero/login videos (6-13 MB) to ~1-2 MB adaptive variants
- A-1-05: delete ~187 MB of unreferenced/duplicated `public/` assets (verify references first — includes byte-identical `amg-custom/` mirror)
- A-1-09: nonce-based CSP to drop `unsafe-inline`/`unsafe-eval`

## Recommended next run focus

1. Build the nightly cron route — it clears the largest cluster of open P1/P2s in one stroke.
2. Owner decisions needed before code: payment story (C-1-01), tax computation rules (E-1-03), insurance/closeout gate rules (E-1-04).
3. DB-side pagination for invoices/quotes/clients lists + the two unique constraints (needs migration approval).
4. Verify the role-permission matrix in production with a non-admin test account; then tune defaults in the new admin UI.

## Process notes

- Plan's `loop/<date>` branch replaced by the session-designated `claude/new-session-mt12tj` (push restriction); intent (never push main) preserved.
- The `role_permissions` migration (pre-approved) was applied to prod; one data-only seed correction (crew.crew delete → false) applied to the same table before any customization existed.
- The initial repo-map Explore agent never returned; REPO_MAP.md was not produced — review agents received inline context instead (no impact on coverage).
- Cycle 2 was scoped to a single fix-verification agent rather than a full five-agent sweep: the remaining window couldn't absorb five new reports before mandatory wind-down.

---

## Addendum — user-directed feature cycle (post-wind-down)

User instruction: "continue loop, focus on new features more than before." Four zero-schema portal
features built (workflow-parallelized), adversarially reviewed by four skeptic agents (11 findings,
all fixed), verified green:

1. **Nightly ops cron** `/api/cron/nightly` + `vercel.json` (06:00 UTC): overdue invoices, quote
   expiry, credential currency (30-day warning + expiry with crew/admin notifications, 100/run cap),
   billing-cycle-based stale-subscription flagging. Guarded single-statement updates; every mutation
   audited as `system-cron`. **Requires CRON_SECRET env in Vercel — returns 503 until set.**
   No client dunning emails (policy decision still pending).
2. **CRM stale-lead queue**: open leads with no/lapsed next action, quiet 14+ days — StatCard +
   `?stage=stale` filter on the pipeline; metrics and list are truncation-safe past 1000 leads.
3. **Financial KPIs** on the analytics dashboard (tracking its range picker): quote turnaround,
   win rate (converted quotes counted as wins; expiry counted data-driven), subscription credit
   liability (live subscriptions only). Gross margin intentionally blank — billing line items have
   no cost column (schema follow-up).
4. **awaiting_client_info affordance**: client trip detail gains a "provide requested information"
   form — payment-data guarded, race-safe status-gated write, appends to client_notes, audits,
   notifies admins, returns the mission to under_review.

Open note carried forward: reviewDocument approving an already-expired credential (cron flips it
back nightly) — needs an expiration check in the admin review action.

---

## Addendum 2 — features + speed cycle (session 2, user-directed)

User instruction: portal features + public-site speed. Five parallel agents, orchestrator verification
between each landing:

**Portal features**
1. Crew assignment lifecycle repair (closes B-1-02/B-1-03): decline-after-assignment reverts the
   mission and reopens auto-closed pools; no more silent downgrade of accepted crew; admin
   unassign action with UI; credential review no longer approves lapsed credentials.
2. Payments authority module (closes E-P-01): payment recording and void/write-off/refund are now
   independently grantable from invoice editing — catalog-only, zero migration, admin defaults FULL
   so nothing changes until the matrix is edited.
3. Per-thread message unread badges + read-on-open (closes B-1-11) — **orchestrator caught the
   original finding's premise was false** (thread_members.last_read_at does not exist in prod;
   the first implementation would have broken message lists). Reworked onto the notifications
   table, which also makes reading a thread clear its notifications.

**Public-site speed**
4. public/ cut from 187 MB to 50 MB (66 provably-unreferenced/duplicate files, per-file manifest in
   asset-cleanup.md; deletions spot-checked; one earlier audit claim corrected — tbm.jpg is referenced).
5. Media loading: hero video viewport-gated (deep links no longer pull 6 MB off-screen), interaction-
   deferred showcase videos, LCP priority hints, lazy below-fold images. Portal login intro's
   preload flag investigated and deliberately kept (video only mounts when playing).

**Deferred to owner:** xlsx swap to SheetJS's patched CDN build — sandbox correctly refused an
agent-initiated external tarball install; it's a one-line package.json change (details in FINDINGS.md).
