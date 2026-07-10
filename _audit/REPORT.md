# AMG Portal & Admin — Security Audit Findings & Hardening Plan

**Prepared:** 2026-07-05 · **Branch:** `portal-v3` · **Scope:** Pass 1 read-only audit of the AMG Aviation Group Next.js/Supabase app (public site + client/crew/partner portal + admin/super-admin backend, one codebase, one database). No files or data were modified. Secrets were located but never recorded.

---

## 1. Executive summary (for a non-security reader)

The AMG website, the client/crew portal, and the staff admin system are all **one program running on one database**. That keeps things simple to build, but it means the walls between "anyone on the internet," "a logged-in client," and "an AMG administrator" are thin — they're enforced by application code rather than by real separation. Today those application checks are, as far as I can see, **in place and consistent**. The concern is what happens when any one thing goes wrong, because there is very little behind that first wall.

Three issues stand out.

**First and most urgent:** the newest parts of the database (billing, subscriptions, compliance) are properly locked down with Supabase's row-level security, but the **core tables — clients, crew, missions, quotes, documents, messages — appear to have that protection turned off**. The "public" database key that ships inside every visitor's web browser could, if that's true in the live database, be used to read the entire client and crew database directly, without ever logging in. I could not confirm this against the live database from here (I only had the code), so **verifying this is the single most important next step.** If confirmed, it's a serious data-exposure hole and the fix is high priority.

**Second:** administrators log in the same way clients do — **no second factor (no authenticator app / MFA)**, no lockout after repeated wrong passwords, and the admin panel sits at an easy-to-guess web address with nothing extra guarding it. One phished or reused admin password would hand over the whole operations system.

**Third:** everything shares a single master database key and a single set of credentials. If the site were ever breached, that one key unlocks all data, the payment system, the email system, and even the website's source code (via a stored GitHub token) — and the activity log lives in the same place, so it could be erased. There is no verified backup/restore either.

None of this requires a rebuild. The plan below fixes the highest-risk items first with low-risk, reversible changes (turn on row-level security, add MFA and login rate-limiting, lock down the admin area, add security headers and webhook verification), then works toward proper least-privilege database separation. Quick wins can land in days; the database separation is the larger effort.

**Overall posture:** the app-layer discipline is better than typical, but the architecture has no depth — it's one wall with a lot behind it. The goal of this plan is to add the missing layers.

---

## 2. Findings table

Severity: **Critical / High / Medium / Low**. IDs map to the per-phase reports in this folder.

| ID | Sev | Finding | Location | One-line fix |
|---|---|---|---|---|
| **D-1** | **Critical** | Core tables (profiles, missions, quotes, documents, messages, aircraft, etc.) appear to have **no RLS**; public anon key could read/write them directly via PostgREST | `docs/AMG_PORTAL_DATA_MODEL.sql` (0 RLS); confirm live DB | Enable RLS + owner/role policies on every core table (**verify live first**) |
| **A-1** | **Critical** | No MFA for admin/super_admin (or any role) | `app/portal/actions/auth.ts`, `security-review/page.tsx` | Enroll + enforce Supabase MFA (TOTP), mandatory for admins |
| A-2 | High | No app-level login/reset rate limiting or lockout | `auth.ts:signIn/requestPasswordReset` | Add rate limiting + progressive lockout on auth endpoints |
| A-3 | High | One session scope across public/portal/admin | `proxy.ts`, Supabase cookies | Separate/segregate admin session; verify cookie flags |
| A-4 | High | Broad service-role + hand-rolled ownership checks are the *only* IDOR barrier on RLS-less paths | `app/api/portal/**`, `app/portal/actions/**` | Enable RLS (defense in depth) + audit each ownership check |
| B-1 | High | Admin at guessable `/portal/admin`, no extra layer (host/IP/MFA) | `app/portal/admin/*` | Admin isolation: subdomain or non-guessable path + IP allowlist + MFA |
| B-2 | High | No session segregation between surfaces | `proxy.ts` | See A-3 |
| D-2 | High | Single shared service-role "god" credential used by 64 sites incl. public paths | `lib/supabase/server.ts` | Least-privilege DB roles per surface (Phase C) |
| D-3 | High | RLS-less table isolation depends solely on app-layer checks | portal actions/api | Enable RLS |
| S-1 | High | No security headers (CSP/HSTS/X-Frame-Options/etc.) | `next.config.ts` | Add headers (CSP report-only first) |
| S-2 | High | Inbound email webhook signature skipped when `RESEND_WEBHOOK_SECRET` unset (absent from env examples) | `app/api/webhooks/email/inbound/route.ts` | Require the secret; fail closed |
| R-1 | High | Full-system blast radius on any compromise (service-role + Stripe + Resend + GitHub token in one env) | env / architecture | Least-privilege split; scope/rotate tokens |
| R-5 | High | Backup/restore posture unverified; no tested restore | Supabase dashboard | Confirm backups/PITR + do a test restore `[MANUAL]` |
| A-5 | Med | Weak password policy (len ≥ 8 only) | `auth.ts` | Strengthen policy / breach-list check |
| A-6 | Med | Decentralized authorization, no central policy (fragile) | `session.ts`, `_helpers.ts` | Keep coverage; add a guard lint/test |
| A-7 | Med | Verify Supabase cookie flags / rotation / refresh lifetime | Supabase dashboard | Verify + tighten `[MANUAL]` |
| A-8 | Med | Admin/super_admin may enter every portal surface | `session.ts`, `_helpers.ts` | Reconsider admin-everywhere; scope where possible |
| B-3 | Med | Middleware is auth-presence only; role checks scattered | `proxy.ts` | Add role-aware middleware + guard test |
| B-4 | Med | Admin-everywhere enlarges blast radius | `session.ts` | See A-8 |
| D-4 | Low–Med | PostgREST `.or()` filter built from unsanitized input (admin search) | `app/api/portal/search/route.ts` | Sanitize/escape PostgREST reserved chars |
| D-5 | Med | Confirm password-setup tokens hashed/single-use/short-TTL | `portal_password_setup_tokens` | Verify token storage |
| S-3 | Med | Email status webhook has no signature verification | `app/api/webhooks/email/status/route.ts` | Verify signature |
| S-4 | Med | `ignoreBuildErrors: true` + no ESLint | `next.config.ts` | Add ESLint (incl. security rules); plan to re-enable type checks |
| S-5 | Med | Unauthenticated public pilot-upload has no rate limiting | `api/crew-network/applications` | Rate-limit + abuse controls |
| S-6 | Med | Upload MIME validation trusts client `file.type` | `documents.ts`, `network-applications.ts` | Magic-byte sniffing; reject empty type |
| R-2 | Med | Audit log not provably append-only, stored in same DB | `lib/portal/audit.ts` | Append-only grants / external log sink |
| R-3 | Med | Failed logins + IP/UA not logged | `auth.ts` | Log auth failures with IP/UA |
| R-4 | Med | No security alerting | — | Alerts on failed logins/priv changes/bulk reads |
| B-5 | Low | Public site writes to shared prod DB via service-role | consent / pilot apps | Least-privilege `web_public` role |
| A-9 | Low | Account-existence disclosure on access-request path | `auth.ts` | Generic messaging |
| S-7 | Low–Med | `npm audit` not run (blocked) | — | Run in networked env `[MANUAL]` |
| S-8 | Low | GA/GTM inline scripts interpolate env IDs (CSP consideration) | `consent-script-loader.tsx` | Account for in CSP |
| S-9 | Low | Stale iCloud duplicate files of sensitive code | working tree | Remove `* 2.*` duplicates (confirm first) |

**Positive controls observed:** generic login errors, `safeRedirectPath` open-redirect guard, Stripe webhook signature verification, sensitive-access compliance logging, sanitized upload filenames + storage (non-executable), centralized safe error responses, password-reset flow that forces sign-out and scopes to a short-lived token.

---

## 3. Solution plan (phased roadmap)

Effort: **S** ≤ a few hrs · **M** ~1–2 days · **L** ≥ several days. Execution happens in Pass 2 on branch `security-hardening`, one commit per change, checkpoint after each phase.

### Phase A — Quick wins, zero behavior change  (effort: S–M)
Security headers (CSP report-only → enforce, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) [S1]; verify/tighten cookie flags [A7]; disable `ignoreBuildErrors` risk by adding ESLint + a guard-coverage test [S4,B3]; require `RESEND_WEBHOOK_SECRET` and add status-webhook verification (fail closed) [S2,S3]; sanitize the admin search filter [D4]; add magic-byte upload sniffing [S6]; remove stale duplicate files after listing [S9]; run `npm audit` [S7-manual]. **Depends on:** nothing.

### Phase B — Auth hardening  (effort: M–L)  `[CONFIRM]`
Login/reset rate limiting + progressive lockout [A2,S5]; MFA (TOTP) mandatory for admin/super_admin, optional for clients [A1]; session rotation + sane lifetimes + segregated admin session scope [A3,B2]; strengthen password policy [A5]; log failed logins with IP/UA [R3]. **Depends on:** A (headers/cookies).

### Phase C — Database least-privilege + RLS  (effort: L)  `[CONFIRM + MANUAL]`
**C0 (do first):** verify live RLS state on all core tables [D-1]. Then enable RLS + owner/role policies on every core table [D1,D3,A4]; implement per-surface connection contexts and the `web_public`/`web_portal`/`web_admin` role matrix [D2,B5,R1]; sequence safely (create roles → deploy behind flag → verify → revoke shared key, never revoke first); confirm password-setup token storage [D5]. **Depends on:** verification C0.

### Phase D — Admin isolation  (effort: M)  `[CONFIRM]`
Move admin behind a dedicated subdomain or non-guessable path; add config-driven IP allowlist middleware + enforce MFA step-up [B1,A8,B4]; keep admin URLs out of sitemap/robots/HTML (already partly done). **Depends on:** B (MFA).

### Phase E — Visibility & resilience  (effort: M)  `[AUTO/CONFIRM]`
Append-only audit log (DB grants) + optional external log sink [R2]; alerting on failed logins / privilege changes / bulk reads [R4]; verify Supabase backups/PITR and perform a documented test restore [R5-manual]. **Depends on:** R3 (from B).

### Phase F — Optional decoupling groundwork  (effort: L, opt-in)
Scaffold an internal API/service layer so a future physical portal split is config, not rewrite. Scaffold only. **Depends on:** C.

---

## 4. Proposed Pass-2 changes, tagged

### `[AUTO]` — safe, no approval needed (still one commit each, reversible)
- Add security headers in `next.config.ts` (CSP **report-only** first) [S1,S8]
- Add ESLint config (incl. security rules) without yet flipping `ignoreBuildErrors` [S4]
- Require `RESEND_WEBHOOK_SECRET` (fail closed) + verify email-status webhook signature [S2,S3]
- Sanitize/escape PostgREST reserved chars in admin search [D4]
- Magic-byte MIME sniffing on uploads; reject empty `file.type` [S6]
- Add IP/user-agent + failed-login audit logging [R3]
- Add generic messaging on access-request path [A9]
- List then remove stale `* 2.*` duplicates + `.DS_Store` (list for confirmation before deleting)
- Add a test that fails if any `app/portal/**` page/action lacks a guard [B3]

### `[CONFIRM]` — requires sign-off (auth, DB creds, routing, sessions)
- MFA enrollment/enforcement + login/reset rate limiting + lockout [A1,A2,S5]
- Session rotation, lifetimes, and **separate admin session scope** [A3,B2]
- Stronger password policy [A5]
- RLS policies on core tables (codebase migration files) [D1,D3,A4] — **after C0 verification**
- Per-context DB connection configs for the least-privilege role matrix [D2,B5]
- Admin isolation: subdomain/non-guessable path + IP allowlist middleware [B1,A8]
- Flipping `ignoreBuildErrors` to `false` once the type debt is clear [S4]
- Append-only audit-log enforcement + alerting [R2,R4]

### `[MANUAL]` — you must do these (outside the codebase); exact steps to be provided in Pass 2
- **Verify live RLS** on every core table in the Supabase dashboard/SQL editor (C0) [D-1] — *before* any conclusion or revoke
- Create DB roles + `GRANT`s on the Supabase server (exact SQL will be generated) [D2]
- Verify Supabase Auth: MFA availability, password bcrypt cost, cookie Secure/HttpOnly, session rotation, refresh-token lifetime [A1,A7]
- Rotate/scope the **GitHub token**, Stripe, Resend, and **service-role** keys; store per-environment [R1]
- Confirm Supabase backup tier/PITR + perform one **test restore** [R5]
- Configure a WAF / rate-limit at Vercel or edge as backstop [A2]
- Run `npm audit` in a networked environment and triage [S7]
- Set the `RESEND_WEBHOOK_SECRET` env var in Vercel [S2]

---

## ⛔ STOP — approval gate

This completes **Pass 1 (read-only)**. Nothing has been changed. Per the engagement rules I will not begin Pass 2 until you approve the plan.

**The single most important immediate action is the `[MANUAL]` C0 check: confirm whether RLS is actually enabled on the core tables in the live Supabase database (D-1).** That determines whether you have an active data-exposure hole right now or a defense-in-depth gap. Everything else can follow the phased order.

Please tell me: (1) approve the plan as-is, or adjust priorities/scope; (2) whether you want to start with Phase A `[AUTO]` quick wins, or run the D-1 live verification first; and (3) confirm Pass 2 should work on a new `security-hardening` branch.
