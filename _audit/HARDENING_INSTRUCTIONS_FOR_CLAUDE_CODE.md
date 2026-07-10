# AMG Portal — Security Hardening Execution Brief (for Claude Code)

> **How to use this file:** Open Claude Code in the root of this repo and say:
> *"Read `_audit/HARDENING_INSTRUCTIONS_FOR_CLAUDE_CODE.md` and begin. Work on branch `security-hardening`, one phase at a time, and stop for my confirmation after each phase."*
>
> This brief is the output of a completed read-only security audit (Pass 1). The full findings live in `_audit/00-orientation.md` … `_audit/05-resilience.md` and `_audit/REPORT.md`. This single file contains everything needed to execute the fixes (Pass 2). The human owner has **approved the plan**.

---

## 0. Ground rules (non-negotiable)

1. **Work on a branch:** `git checkout -b security-hardening`. Never commit to `portal-v3`/main directly.
2. **One atomic commit per logical change.** Each commit message must name the finding ID(s) it addresses (e.g. `sec(S1): add security headers (CSP report-only)`).
3. **Every change must be reversible.** After each phase, write the rollback steps into `_audit/CHANGELOG.md`.
4. **Never touch production data.** Do not run `UPDATE/DELETE/INSERT/DROP/TRUNCATE` against any database. SQL you produce for the database owner goes into migration files or into `_audit/` as text for them to run — you do not execute it against prod.
5. **Never print, log, or commit secrets.** If you find a credential, record only its location/type.
6. **Do not change the public site's user-facing behavior** without flagging it explicitly in your summary.
7. **Do not deploy.** The owner deploys.
8. **Stop-and-ask on anything auth-, DB-credential-, routing-, or session-related** even though the plan is approved — confirm the specific implementation choice before writing it.
9. **Respect the tags:** `[AUTO]` = implement now; `[CONFIRM]` = propose the diff and wait for the owner's yes; `[MANUAL]` = the owner does it outside the code — you only produce exact instructions/SQL/commands.
10. Proceed **phase by phase (A→E, F optional)**. After each phase: run `npm run typecheck`, summarize changes + rollback, and wait for "continue."

---

## 1. Context Claude Code needs (verified facts about this repo)

- **Stack:** Next.js ^16 (App Router, Server Components + Server Actions), TypeScript, Supabase (Postgres + Auth + Storage, `@supabase/ssr`), Stripe, Resend (email), Vercel hosting. Node 22.
- **One app, three surfaces, one DB:** public site `app/(public)/*`, portal `app/portal/{client,crew,partner}/*`, admin `app/portal/admin/*` + `app/portal/super-admin/*`.
- **Two Supabase clients** in `lib/supabase/server.ts`: `createClient()` (anon key, RLS-enforced) and `createServiceClient()` (**service-role key, RLS BYPASSED**, used in ~64 places).
- **Auth guards:** `lib/portal/session.ts` (`requireUser`/`requireRole`/`requireSuperAdmin`) for pages; `app/portal/actions/_helpers.ts` (`actor(roles)`) for server actions. Coverage is currently complete — preserve it.
- **Middleware:** `proxy.ts`, matcher `/portal/:path*`, currently auth-presence only (no role check).
- **Existing good controls (do not regress):** generic login errors, `safeRedirectPath` open-redirect guard, Stripe webhook signature verification, sanitized uploads to Supabase Storage, `createSafeErrorResponse`/`logServerError`, compliance access logging (`lib/compliance/evidence.ts`), audit log `lib/portal/audit.ts`.
- **Config caveats:** `next.config.ts` has `typescript.ignoreBuildErrors: true`; there is **no ESLint config**; no security headers; no real test runner (`npm test` = `tsc --noEmit`).

---

## 2. Findings being fixed (quick reference)

| ID | Sev | Finding | Fix phase |
|---|---|---|---|
| D-1 | Critical | Core tables (profiles, missions, quotes, documents, messages, aircraft…) appear to have **no RLS**; public anon key could hit them via PostgREST | C0 verify → C |
| A-1 | Critical | No MFA for admin/super_admin | B |
| A-2 | High | No login/reset rate limiting or lockout | B |
| A-3/B-2 | High | Single session scope across public/portal/admin | B |
| A-4/D-3 | High | Service-role + hand-rolled ownership checks are the only IDOR barrier | C |
| B-1 | High | Admin at guessable `/portal/admin`, no extra layer | D |
| D-2/R-1 | High | Single service-role god credential incl. public paths; Stripe+Resend+GitHub token in one env | C / manual |
| S-1 | High | No security headers | A |
| S-2 | High | Inbound email webhook signature skipped when `RESEND_WEBHOOK_SECRET` unset | A |
| R-5 | High | Backups/restore unverified | E (manual) |
| A-5 | Med | Weak password policy (len≥8 only) | B |
| A-6/B-3 | Med | Decentralized authz, no guard test | A |
| A-7 | Med | Verify Supabase cookie flags/rotation/lifetime | B (manual) |
| A-8/B-4 | Med | Admin-everywhere role design | D |
| D-4 | Low–Med | PostgREST `.or()` filter from unsanitized input (admin search) | A |
| D-5 | Med | Confirm password-setup tokens hashed/single-use/short-TTL | C |
| S-3 | Med | Email status webhook unsigned | A |
| S-4 | Med | `ignoreBuildErrors:true` + no ESLint | A (+ flip in later) |
| S-5 | Med | Public pilot upload no rate limiting | B |
| S-6 | Med | Upload MIME trusts client `file.type` | A |
| R-2 | Med | Audit log not provably append-only, same DB | E |
| R-3 | Med | Failed logins + IP/UA not logged | B |
| R-4 | Med | No security alerting | E |
| B-5 | Low | Public site writes prod DB via service-role | C |
| A-9 | Low | Account-existence disclosure on request path | A |
| S-7 | Low–Med | `npm audit` not run | A (manual) |
| S-8 | Low | GA/GTM inline scripts (CSP design) | A |
| S-9 | Low | Stale `* 2.*` duplicate files | A |

---

## 3. Execution phases

### PHASE A — Quick wins, zero behavior change  `[AUTO]`

Commit each item separately. None of these should change what a normal user sees.

**A.1 Security headers [S1, S8]** — Add a `headers()` block to `next.config.ts` returning, for all routes:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY` (and CSP `frame-ancestors 'none'`)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy-Report-Only` first (not enforcing). Build the policy to allow: self; the Supabase project URL (script/connect/img); `https://unpkg.com` (globe textures, see `components/ui/3d-globe.tsx`); `https://www.googletagmanager.com` + `https://www.google-analytics.com` (consent-gated GA/GTM, see `components/compliance/consent-script-loader.tsx`); Stripe if any client-side Stripe.js is added. Because GA/GTM use **inline** scripts, document whether a nonce or hash strategy is needed before switching to enforcing CSP. **Leave it report-only in this phase**; flipping to enforce is a later `[CONFIRM]`.

**A.2 Webhook hardening [S2, S3]**
- `app/api/webhooks/email/inbound/route.ts`: make signature verification **mandatory** — if `RESEND_WEBHOOK_SECRET` is missing in production, **fail closed (401)** instead of skipping. Do not weaken the dev path.
- `app/api/webhooks/email/status/route.ts`: add signature verification (same provider `validateWebhookSignature`); reject unsigned/invalid in production.
- Add `RESEND_WEBHOOK_SECRET` to `.env.example` and `.env.local.example` (name only, empty value).

**A.3 Admin search filter injection [D-4]** — In `app/api/portal/search/route.ts`, the user query `q` is interpolated into PostgREST `.or("col.ilike.%${q}%,...")` strings. Escape/strip PostgREST reserved characters (`, ( ) . : *`) from `q` before building the filter, or switch to `.ilike()` per-column calls combined safely. Keep the admin-only gate.

**A.4 Upload MIME sniffing [S6]** — In `app/portal/actions/documents.ts` and `lib/portal/network-applications.ts`, add magic-byte content sniffing (read first bytes; validate against the declared allowlist) and **reject empty `file.type`** rather than allowing it. Keep existing size/count/name-sanitization checks.

**A.5 Auth logging [R3, A9]** — In `app/portal/actions/auth.ts`:
- Log **failed** logins (currently `signIn` redirects before any audit write) with a distinct action, capturing IP + user-agent from request headers.
- Add IP/UA to the successful `user_login` audit event too.
- Make the access-request path messaging generic to reduce account-existence disclosure (don't reveal "an account already exists").

**A.6 Guard-coverage regression test [B3, A6]** — Add a script/test (e.g. `scripts/verify-portal-guards.mjs`, wired into `npm test`) that scans `app/portal/**/page.tsx` and `app/portal/actions/*.ts` and **fails** if a non-alias page or an exported server action lacks a `requireRole`/`requireUser`/`requireSuperAdmin`/`actor(...)` call. This locks in current coverage so future code can't silently drop a guard. (Alias/redirect stub pages are exempt — detect the single-`redirect()` pattern.)

**A.7 ESLint [S4]** — Add an ESLint config (`eslint.config.mjs`) with `next/core-web-vitals` + TypeScript + a security-oriented ruleset. Wire `npm run lint` to actually run ESLint (in addition to `tsc`). **Do not** flip `ignoreBuildErrors` yet — just surface the debt; report how many errors exist.

**A.8 Housekeeping [S9]** — List every stale iCloud duplicate (`* 2.tsx`, `* 2.ts`, etc.) and `.DS_Store`, present the list, and after confirmation delete them (they're gitignored and unused). Do not delete the live originals.

**A.9 [MANUAL] for owner [S7]** — Produce a note: run `npm audit` / `npm audit --production` in a networked environment and triage; set `RESEND_WEBHOOK_SECRET` in Vercel.

*End of Phase A: run `npm run typecheck` + the new guard test, write rollback steps to CHANGELOG, stop for confirmation.*

---

### PHASE B — Auth hardening  `[CONFIRM]`  (confirm each design choice before writing)

**B.1 Login/reset rate limiting + lockout [A2, S5]** — Add rate limiting + progressive lockout to `signIn`, `requestPasswordReset`, `resendPortalVerificationCode`, and the public pilot-application POST. Propose the mechanism first (options: Supabase-side settings, a Postgres attempt-counter table, or an edge/Vercel rate-limit). Prefer a DB-backed counter keyed on email+IP with exponential backoff; fail closed and log lockouts.

**B.2 MFA (TOTP) [A1]** — Implement Supabase Auth MFA: mandatory enrollment + enforcement for `admin` and `super_admin`, optional for `client`/`crew`/`partner`. Add enrollment UI + a step-up check in the admin path. This is the highest-value fix — confirm the UX (enrollment on next admin login vs. grace period) before building.

**B.3 Session hardening [A3, B2, A7]** — Verify/tighten Supabase cookie flags (Secure+HttpOnly; consider `SameSite=Strict`/host-only for portal), ensure session rotation on login, sane lifetimes, and full invalidation on logout. **Separate the admin session scope** from public/portal so a public-site session is not interchangeable with an admin one. Some of this is dashboard config → emit `[MANUAL]` steps.

**B.4 Password policy [A5]** — Strengthen beyond length ≥ 8 (complexity and/or breached-password check) at `updatePassword`/`updatePortalPassword`.

*End of Phase B: typecheck, CHANGELOG rollback, stop.*

---

### PHASE C — Database least-privilege + RLS  `[CONFIRM + MANUAL]`

**C.0 [MANUAL — DO FIRST] Verify live RLS [D-1]** — Before writing any policy, the owner must confirm in the Supabase SQL editor whether RLS is actually enabled on the core tables. Generate this exact read-only query for them to run and paste back:

```sql
select n.nspname as schema, c.relname as table, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by rls_enabled, c.relname;
```

Also list existing policies:
```sql
select schemaname, tablename, policyname, cmd, roles
from pg_policies where schemaname = 'public' order by tablename, policyname;
```

Interpret the result:
- If core tables (`profiles, missions, quotes, documents, message_threads, messages, aircraft, expenses, crm_leads, passengers/passenger_profiles, crew_profiles, notifications`, etc.) show `rls_enabled = false` → **confirmed Critical**; proceed with C.1.
- If they're already enabled with sensible policies → downgrade D-1 and focus on C.2/C.3.

**C.1 Enable RLS + policies on core tables [D-1, D-3, A-4]** — Author **migration files** (do not run against prod) under `supabase/migrations/` that `enable row level security` on each core table and add owner/role policies mirroring the app's current ownership logic (e.g. clients see rows where `scope_id`/`client_id`/`uploaded_by = auth.uid()`; admins via a role claim). Keep the service-role paths working (service-role bypasses RLS) so nothing breaks, but the goal is that the **anon key alone can no longer read these tables**. Sequence: write policies → owner applies to a **staging/branch DB** → verify app still works → then production. Provide a verification checklist.

**C.2 Least-privilege DB roles [D-2, B-5, R-1]** — Implement per-surface connection contexts in code and the role matrix:
- `web_public` — INSERT-only on `contact_form_submissions, public_support_requests, consent_events, marketing_consents, network_applications(+files)`; no access to PII/financial/messaging.
- `web_portal` — RLS-scoped SELECT/INSERT/UPDATE on the acting user's rows; no DELETE; no admin-only tables.
- `web_admin` — full DML on operational tables (still audit-logged).
- Retain `service_role` only for trusted admin server actions after role verification; **remove it from public-reachable code paths** (e.g. `app/api/compliance/consent`, pilot-application pipeline should use `web_public`).
- Code side = `[CONFIRM]`. Creating the roles + `GRANT`s on the server = `[MANUAL]`: generate the exact `CREATE ROLE` / `GRANT` SQL as a text artifact in `_audit/` for the owner.
- **Safe sequence (critical):** create new roles → deploy code using them behind a config flag → verify → **only then** revoke the old shared credential. **Never revoke first.**

**C.3 Password-setup token check [D-5]** — Inspect `portal_password_setup_tokens`; confirm tokens are hashed, single-use, and short-TTL. If not, propose a migration.

*End of Phase C: typecheck, CHANGELOG rollback (incl. how to disable RLS/revert roles safely), stop.*

---

### PHASE D — Admin isolation  `[CONFIRM]`

**D.1 [B-1]** Move admin behind a dedicated subdomain (same app is fine) or, at minimum, a non-guessable base path. Update routing + `proxy.ts` accordingly.

**D.2 [B-1]** Add config-driven **IP allowlist** middleware for admin routes + enforce **MFA step-up** (depends on Phase B). Make the allowlist an env-configured list so it's changeable without a deploy-time code edit.

**D.3 [A-8, B-4]** Reconsider the "admin/super_admin can enter every surface" design in `requireRole`/`actor`; scope down where a business reason doesn't require it, to shrink blast radius.

**D.4** Confirm admin URLs never appear in `sitemap.ts`, `robots.ts`, or public HTML (currently `robots` disallows `/portal/`; keep that true after any path change).

*End of Phase D: typecheck, CHANGELOG rollback, stop.*

---

### PHASE E — Visibility & resilience  `[AUTO/CONFIRM]`

**E.1 Append-only audit log [R2]** — Make `audit_events` (and compliance tables) append-only via DB grants (revoke UPDATE/DELETE from app roles) — migration/SQL as `[MANUAL]`. Optionally mirror audit events to an external sink so a DB compromise can't erase them.

**E.2 Security alerting [R4]** — Add hooks (email/webhook) firing on: repeated failed logins, new-location/new-device admin login, role/permission changes, and bulk reads/exports (e.g. admin financial export, large search). Reuse `notifyAdmins`/notification-delivery plumbing.

**E.3 [MANUAL] Backups [R5]** — Produce owner instructions: confirm Supabase backup tier + PITR + retention, and perform one **documented test restore** into a scratch project.

*End of Phase E: typecheck, CHANGELOG rollback, stop.*

---

### PHASE F — Optional decoupling groundwork  `[CONFIRM, opt-in only]`

Only if the owner opts in. Scaffold an internal API/service layer between the app and the database so a future physical split of the portal is a config change, not a rewrite. **Scaffold only — do not migrate features.**

---

## 4. Owner's `[MANUAL]` checklist (things Claude Code cannot do for you)

1. **FIRST:** Run the C.0 read-only RLS queries in the Supabase SQL editor and paste results back — this decides whether D-1 is an active breach path.
2. Create DB roles + `GRANT`s on the Supabase server using the SQL Claude Code generates (Phase C.2).
3. Apply RLS migrations to a staging/branch DB, verify, then production (Phase C.1). Never revoke the shared service-role credential until the new roles are verified live.
4. Verify Supabase Auth settings: MFA availability, bcrypt cost, cookie Secure/HttpOnly, session rotation, refresh-token lifetime (Phases A/B).
5. Rotate + scope per-environment: the **GitHub token** (used by the super-admin website editor), Stripe keys, Resend key, and the **service-role key**.
6. Set `RESEND_WEBHOOK_SECRET` in Vercel; confirm Stripe webhook secret.
7. Confirm Supabase backups/PITR and perform one **test restore** (Phase E.3).
8. Run `npm audit` in a networked environment and triage (S-7).
9. Consider a WAF / edge rate-limit at Vercel as a backstop (A-2).

---

## 5. Final deliverable Claude Code must produce

`_audit/CHANGELOG.md` — for every change: what changed, which finding ID, why, and **exact rollback steps**, grouped by phase; plus a running list of remaining `[MANUAL]` items for the owner.

---

## 6. Suggested first message to Claude Code

> "Read `_audit/HARDENING_INSTRUCTIONS_FOR_CLAUDE_CODE.md`. Create branch `security-hardening`. Start with **Phase A** (`[AUTO]`), one commit per item, and stop after Phase A with a summary and rollback notes before touching Phase B. Do not run any SQL against the database — put DB SQL in migration files or `_audit/` for me to run. Do not deploy."
