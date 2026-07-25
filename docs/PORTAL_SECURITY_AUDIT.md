# AMG Connect Portal — Security & Integrity Audit

**Date:** 2026-07-25
**Scope:** the whole portal — 132 route files, 172 server actions across 36 modules, 28 API routes, 73 `lib/portal` files (~54,800 LOC), 71 migrations, and the live Supabase project `vsynqnqlouvphiniqaiy`.
**Method:** four independent agents (authorization, API surface, database/RLS, business logic), every finding re-verified by hand against the code, and the database claims settled by querying the live database rather than inferring from migrations.

---

## Verdict

**No critical or high-severity vulnerability was found.** Ten defects were confirmed and fixed; five reported as CRITICAL/HIGH were refuted by direct verification and are recorded below with the evidence, because a retracted finding is as useful as a confirmed one.

This contradicts the "stop-ship / 1-of-10 production ready" framing that has been attached to this portal. That assessment came from a document not present in this repository. The repo's own `portal-readiness-audit.md` is largely a UI and responsive pass and states it *"did not alter database schema or RLS"* — it never examined the security layer. On the evidence here, the portal's authorization model is sound and the database layer is in better shape than the migrations alone suggest.

What the portal *is* short on is not safety but state-machine discipline on the self-service surfaces, which is where most of the real findings landed.

---

## What was verified clean

| Area | Result |
|---|---|
| **Page guards** | 119 of 132 pages guarded. The 13 remaining are data-free redirect stubs. |
| **Server actions** | 159 of 172 guarded by `actor()`; 36 of 37 modules guard every export. Gaps: `auth.ts` (pre-auth by nature) and `notifications.ts` (own-row `is_read` only). |
| **IDOR** | All 8 file-content routes tie the URL id to the caller. A mechanical taint scan found 84 places a user-supplied id reaches `.eq()` on a service-role client — **every one** carries an ownership predicate or an admin gate. Zero horizontal-escalation bugs. |
| **Webhooks** | All 3 verify signatures against the raw body and fail closed in production. |
| **Money** | A client cannot alter a quoted amount: `respondToQuote` re-reads the quote server-side and derives the invoice from it; no amount is read from the form. Deposits clamp to the quoted total. The Stripe webhook re-verifies the charged amount against the invoice and flags `amount_mismatch` rather than marking paid. Invoices refuse a direct status jump to `paid`; void/write-off/refund need a second permission — real separation of duties. |
| **Cross-tenant reads** | No `listAll*` call exists anywhere under `portal/{client,crew,partner}`. Detail pages check ownership before rendering. The crew mission brief correctly degrades to a sanitized pool preview for unassigned crew. |
| **Storage** | All 5 buckets private, with `on conflict do update set public = false` so a manual dashboard flip is re-closed on every migration run. Object paths are `${user.id}/`-scoped, filenames sanitized. Every file read is forced through an audited route. |
| **Service-role key** | Never reachable from a client component. Zero `"use client"` files import the server Supabase module. Correct `NEXT_PUBLIC_` prefixing throughout. |
| **Mission lifecycle** | A real permitted-transition map with fail-closed `canTransition`, gate evaluation, and optimistic concurrency on the write. |
| **RPC layer** | All 12 `SECURITY DEFINER` functions authorize internally (`is_approved_admin()`, or `auth.uid()` as the subject) and set `search_path` to empty. |

---

## Refuted findings

These were reported at CRITICAL or HIGH by the database agent, which flagged them INFERRED because the base schema predates the tracked migrations. Querying the live database settled all five.

**"RLS is not enabled on 24 tables holding customer, crew, financial, and document data."**
Refuted. `select relname, relrowsecurity from pg_class` over `public` returns **88 tables, every one with RLS enabled**. That includes all 24 named — `missions`, `documents`, `expenses`, `quotes`, `messages`, `crm_leads`, `passenger_profiles`, `crew_profiles`. Supabase's own linter independently reports zero `rls_disabled_in_public` errors. The migrations don't enable RLS on these because it was already on before the tracked history began.

**"RLS is not load-bearing, so a regression would be silent."**
Half true, and the useful half survives. It is correct that the app reads everything through the service-role client, so RLS never executes on the hot path. But the conclusion — that the database would not hold if the app layer failed — is wrong: RLS is on everywhere, policies are scoped to `auth.uid()` or a real ownership join, and **`anon` and `authenticated` hold zero INSERT/UPDATE/DELETE grants on any table in `public`**. The process point stands and is recorded as an open item: the repo does not *assert* this, so a future regression would be silent.

**"`portal_password_setup_tokens` is unprotected."**
Refuted as a live issue — `to_regclass` returns null; the table does not exist in production. Real as a latent repo defect: the migration would create it unprotected on a fresh replay. Fixed.

**"The `profiles_update_own` escalation policy is still loaded, only unloaded."**
Refuted. `profiles` carries exactly one policy live, `profiles_select_self_or_admin`, and it is read-only. The write policy was removed, not merely revoked.

**"Broad `authenticated` grants make a dropped policy catastrophic."**
Refuted as stated. There are no write grants to `anon` or `authenticated` on any table, so a dropped policy exposes reads at worst, not read+write.

One earlier hypothesis of mine also failed and is recorded for the same reason: I suspected `deleted_email_released`, `portal_setup_failed`, and `existing_account_linked` bypassed the account-status guard. All three live on different columns (`invitation_status`, `public_support_requests.portal_account_status`) and never reach `profiles.status`. Not a finding.

---

## Confirmed and fixed

**1. Admin role checked without account status** — three sites (`crm/export`, `lib/flightwall/access.ts`, and `requireUser` itself). `getSessionUser` resolves any valid JWT carrying a portal role; status filtering lives in `requireUser`, a page guard that never runs for `app/api/**`. A suspended admin kept exporting the whole CRM pipeline and reading FlightWall's revenue, invoice, payment, and client-name feed until their token expired. Every sibling route already used `requireApprovedPortalApiUser`.

**2. `requireUser` was fail-open** — it redirected on a denylist of bad statuses and passed anything else. The list covers all six values the check constraint permits today, so nothing was reachable; a seventh status added later would have passed the page guard while RLS and the server actions rejected it. Inverted to an allowlist.

**3. PostgREST filter injection in portal search** — `.or()` takes a filter *string*, so the search term landed in a grammar where `,` separates clauses and `.` separates operands. A crafted term could append a clause against a column `select()` never exposed and read the answer from the match signal — a blind oracle over the row. The value is now double-quoted (escaping backslash before quote); the `.ilike()` calls in the same file bind their argument and were already safe.

**4. Client IP taken from a spoofable header** — `x-forwarded-for` is appended to by every hop, including the client. For FlightWall's trusted-IP allowlist this was an authentication bypass: `curl -H "X-Forwarded-For: <house IP>"` returned the ops feed with no session, and the office IP is recoverable from mail headers. For the rate limiter, a rotating header minted a fresh bucket per request and evaded the limit on both unauthenticated write endpoints. Split into `trustedClientIp()` (platform-set only, `null` off-platform, so an allowlist can never match a forgery) and `bestEffortClientIp()` (bucketing and logging, where a wrong answer costs a bucket rather than access).

**5. Partners could re-price work already underway** — `submitServiceQuote` carried no precondition beyond `partner_id`. A shop could accept a $2,000 job, complete the work, then re-post at $6,000; the write landed silently and reset the row to "quoted". `updateServiceMilestone` validated the status against the vocabulary but against no ordering, so `completed → quoted` and `declined → accepted` both passed. Added `PARTNER_LEGAL_TRANSITIONS` mirroring `mission-lifecycle.ts`, with a separate requotable set, and all three writes now validate the pair and write with optimistic concurrency. This was the most consequential finding: partner actions are self-service, so unlike the mission map nothing here was backstopped by an admin.

**6. A crew-writable field labelled "Internal Notes"** — `ops_notes` is the same column a pilot edits as "Operations Notes" on their own settings page. Admin surfaces called it "Qualifications / Internal Notes", and the crew list fell back to `notes ?? ops_notes` under a bare "Internal Notes" heading. An admin recording "reliability concern — do not re-offer" was writing where the subject can read it, and the pilot's next save silently overwrote it. `profiles.notes` is the genuinely staff-only field and already existed; relabelled throughout and split the fallback so the two are no longer confusable.

**7. `super_admin` failed two literal `role !== "admin"` checks** — refused edits on another user's billing contact and on a client's mission info. Fails closed, so a bug rather than a hole. Now uses `isAdminRole()` like every sibling.

**8. Migration would create an unprotected table on replay** — `portal_password_setup_tokens`, holding each invited user's email, internal id, mission, and live-invite state. Fixed at source plus a guarded forward migration. Deny-all, no policies.

---

## Open items

**Owner action, outside the code** — both from Supabase's security advisor:
- **Leaked-password protection is disabled.** Enable the HaveIBeenPwned check in Auth settings. One toggle.
- **Insufficient MFA options.** The portal holds client, financial, and crew PII; admin accounts should carry a second factor.

**Worth doing, not urgent:**
- **Assert RLS in CI.** The database is correct today and nothing would tell you if it stopped being. A test that fails the build when any `public` table reports `relrowsecurity = false` converts the largest standing assumption into a checked fact.
- **Subscription status has no transition map** (`subscriptions.ts:178`) — `cancelled → active` writes cleanly while Stripe still says cancelled. Admin-only and audited, so a divergence risk rather than a privilege one.
- **`notifications.ts` skips the status guard** — a suspended user can mark their own notifications read. Consistency only.
- **`CRON_SECRET` uses a non-constant-time compare**; **CSP report endpoint has no log-flood ceiling**; **cross-bucket fallback** in `documents/[id]/content` should be constrained to an allowlist.
- **Two `subscription_plans` policies are readable by any authenticated user**, exposing the plan and tier catalogue to crew and partners rather than clients only. The same pattern on the services catalogue was already found and correctly killed in `20260707160000`.

---

## Architectural note

Authorization is enforced at the application layer, not the database: all 28 action modules use the service-role client, which bypasses RLS. The guards held up under every probe — but the consequence is that a single missing `actor()` call is unmitigated, and the guard density is what makes that acceptable. Two things follow. Keep the density: any new action module needs `actor()` on every export. And keep RLS correct even though nothing exercises it, because it is the only thing standing behind a mistake in the layer that does.

The one structural weakness worth naming: `requireRole` grants any admin role access to every gate via `isAdminRole()`, so despite several named roles there are really two tiers of separation — staff and not-staff. That is a defensible choice for a company of this size and a poor one at ten people. It is worth revisiting before the first non-founder admin is onboarded, not after.
