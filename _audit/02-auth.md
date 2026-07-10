# Phase 2 — Authentication, Session & Authorization Audit

Auth is delegated to **Supabase Auth** (email/password, `@supabase/ssr` cookie sessions). Much of the session posture is therefore controlled in the Supabase dashboard, not in this codebase — several items below are `[MANUAL]` verifications the code cannot prove.

## Authentication

| Area | Finding | Severity |
|---|---|---|
| Login system | Single system for all roles (`signInWithPassword`), one profile table drives role. Portal clients and admins authenticate identically. | Info |
| **MFA** | **Not implemented / not enforced anywhere in code.** `security-review/page.tsx` explicitly states "MFA is not currently enforced by this portal UI" and admin profile rows show "MFA status unavailable." No TOTP/step-up for admin or super_admin. | **Critical** |
| **Login rate limiting / lockout** | **None in application code.** `signIn` calls `signInWithPassword` directly with no attempt counter, backoff, lockout, or CAPTCHA. Relies entirely on Supabase's built-in limits (must be verified in dashboard). Password-reset (`requestPasswordReset`) and email-verification resend (`resendPortalVerificationCode`) likewise have no app-level throttle. | **High** |
| Password hashing | Handled by Supabase (bcrypt) — not in codebase. Cost factor not app-controllable. | Info (verify in dashboard) |
| Password policy | Minimum length **8**, enforced only at `updatePassword`/`updatePortalPassword` (reset/change paths). No complexity, no breach-list check; **signup path sets a random UUID password** (access-request model), so strength depends on the reset flow. | Medium |
| Password reset flow | Recovery code exchanged server-side (`/auth/password-setup`), **signs out any existing session first** (prevents session-fixation via reset link — good), scopes the update to a short-lived (15 min) httpOnly `amg_password_setup_user` cookie tied to `user.id`. Solid. | Info |
| Email verification | Custom token flow present (`lib/auth/email-verification.ts`, `verifyPortalEmail`). | Info |
| Enumeration | `signIn` returns generic `?error=invalid` for both bad user and bad password (good). Public access-request messages do reveal whether an email already has an account ("An AMG portal account already exists…") — minor enumeration vector on the request path. | Low |

## Session management

| Area | Finding | Severity |
|---|---|---|
| Cookie flags | Supabase `sb-*` cookies are managed by `@supabase/ssr`; flags are the library defaults (HttpOnly, `SameSite=Lax`, `Secure` in prod). App-set cookies (`amg_password_setup_user`, portal-intro) correctly use `httpOnly`/`sameSite: lax`/`secure` in prod. **Recommend explicit verification** that Supabase cookies carry Secure+HttpOnly in production and consider `SameSite=Strict`/host-only for the portal. | Medium |
| Session scope segregation | **One session scope for public site, portal, and admin** (path `/`). No distinct admin cookie/scope — a session usable on the public site is the same one that authorizes `/portal/admin`. | High (ties to B-2) |
| Session rotation on login | Not explicitly rotated in app code; depends on Supabase. Login does update `last_login_at`. | Medium (verify) |
| Logout invalidation | `signOut()` calls `supabase.auth.signOut()` (revokes refresh token server-side). Reset/invite flows also force sign-out. Adequate. | Info |
| Remember-me | No custom long-lived remember-me; relies on Supabase refresh token lifetime (dashboard-configured). | Info |

## Authorization

| Area | Finding | Severity |
|---|---|---|
| Role model | `profiles.role` ∈ {client, crew, admin, partner, super_admin}. `isAdminRole` = admin|super_admin. | Info |
| Where checks happen | Decentralized: `requireRole()`/`requireUser()`/`requireSuperAdmin()` in pages (`lib/portal/session.ts`); `actor(roles)` in server actions (`_helpers.ts`); explicit `isAdminRole` checks in API routes. **No central policy layer.** Coverage verified complete today, but each new page/action must remember to add a guard (fragile — see B-3). | Medium |
| Admin-everywhere | `requireRole` and `actor` both grant admin/super_admin access to every surface. Expands blast radius. | Medium |
| **Service-role + manual ownership checks (IDOR surface)** | Many portal API routes and actions use the **service-role client (RLS bypass)** and then re-implement ownership in JS. These are correct where present: `billing-documents` checks `document.client_id === user.id`; `documents` checks `visibility/uploaded_by/scope_id`; `messages.postMessage` checks `thread_members`; `network-application-files` requires `isAdminRole`. **Risk:** because RLS is bypassed, the *only* thing preventing IDOR is these hand-written checks — a single omission = direct object access. This pattern is used broadly and must be enumerated line-by-line before trusting it. | **High** |
| Admin search / analytics | `/api/portal/search` and `/api/portal/admin/financial/analytics` correctly gate on `isAdminRole` before any query. | Info |
| Open redirect protection | `safeRedirectPath()` rejects `//` and off-origin targets — good, and used widely. | Info (positive) |
| Role-less actions | `documents.uploadDocument` and `messages.postMessage` use `actor()` (any approved user) but then scope by role/ownership internally — acceptable, but they run under service-role so correctness depends entirely on those internal checks. | Medium |

## Severity roll-up (to REPORT.md)

- **Critical:** A-1 No MFA for admin/super_admin (or any role).
- **High:** A-2 No application-level login/reset rate limiting or lockout. A-3 Single session scope across all three surfaces. A-4 Broad service-role + hand-rolled ownership checks are the sole IDOR barrier (RLS bypassed on those paths).
- **Medium:** A-5 Weak password policy (len ≥ 8 only, no complexity/breach check). A-6 Decentralized authorization (no central policy; fragile). A-7 Verify Supabase cookie flags / session rotation / refresh lifetime in dashboard. A-8 Admin-everywhere role design.
- **Low:** A-9 Account-existence disclosure on the access-request path.
