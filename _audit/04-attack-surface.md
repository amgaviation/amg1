# Phase 4 — Attack-Surface Audit

## 1. Dependencies

Notable versions (from `package.json`): `next ^16.0.7`, `@supabase/ssr ^0.12.0`, `@supabase/supabase-js ^2.108.1`, `stripe ^22.3.0`, `three ^0.184.0`, React 19, Tailwind 4.

`npm audit` could not run (registry blocked by the sandbox network allowlist). **`[MANUAL]`: run `npm audit` / `npm audit --production` in a networked environment** and review. No obviously abandoned packages spotted, but `material-dashboard` is a heavyweight UI dependency worth confirming is actually used. Many `caret` ranges mean production may float ahead of the lockfile — pin critical deps.

## 2. Build / config hygiene

| Finding | Severity |
|---|---|
| `next.config.ts` sets `typescript.ignoreBuildErrors: true` — type errors (including type-safety issues that mask security bugs) do not fail the build. `npm run lint`/`test` are just `tsc --noEmit`, which this flag also neuters at build time. | Medium |
| **No ESLint config present** (no `.eslintrc*`, no `eslint.config.*`, no eslint in scripts). No lint-based detection of dangerous patterns. | Medium |
| No real automated test suite (only `verify-*` scripts + one fixture). | Medium (resilience) |

## 3. Security headers & TLS

- **No security headers configured anywhere** — `next.config.ts` has no `headers()`; no CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy. The admin/portal is thus clickjackable and has no CSP to blunt XSS. TLS itself is handled by Vercel (HTTPS by default), but HSTS is not asserted by the app. | **High**
- `images.remotePatterns` allows `unpkg.com` (used by the 3D globe textures) — acceptable but widens image sourcing.

## 4. Webhooks (unauthenticated entry points)

| Endpoint | Verification | Severity |
|---|---|---|
| `/api/webhooks/stripe` | Verifies `stripe-signature` via `processStripeWebhook`; returns 401 on invalid signature. Good. | Info |
| `/api/webhooks/email/inbound` | Signature check is **conditional on `NODE_ENV==='production' && RESEND_WEBHOOK_SECRET`**. `RESEND_WEBHOOK_SECRET` is **not present in `.env.example` or `.env.local.example`**, so if it's unset in prod the check is **silently skipped** → anyone can POST forged inbound emails into the communications center (spoofed threads/messages, potential stored-content injection into admin views). | **High** |
| `/api/webhooks/email/status` | **No signature verification at all.** Anyone can POST to mark messages delivered/bounced/failed, corrupting delivery state. | Medium |

## 5. File uploads

Reviewed portal upload (`documents.uploadDocument`) and public pilot-application upload (`lib/portal/network-applications.ts`):

- Type allowlists (`application/pdf`, `image/jpeg`, `image/png`; resume/doc types), 50 MB cap, per-file count caps (≤10 certs), empty-file rejection.
- Filenames sanitized (`replace(/[^a-zA-Z0-9._-]/g, "_")` / `safeFilename`).
- Stored in **Supabase Storage buckets**, served back through authenticated app routes with `Content-Disposition` — **not** written to a web-servable/executable directory. Good posture overall.
- Gaps: validation trusts the client-supplied MIME type (`file.type`) rather than sniffing magic bytes; `file.type` may be empty (then it's allowed). Consider content-sniffing and forcing `Content-Type` on download (already forced inline via `fileResponse`). The **public** pilot upload is unauthenticated and has **no rate limiting** → storage-abuse/DoS vector. | Medium

## 6. Third-party / injected scripts

- `app/(public)/layout.tsx` injects a static `LOCAL_BUSINESS_SCHEMA` JSON-LD via `dangerouslySetInnerHTML` — static, not user data. Safe.
- `components/compliance/consent-script-loader.tsx` injects GA/GTM only after consent; the GA measurement ID is `encodeURIComponent`-wrapped in the URL, but the **inline** `gtag('config','${value}')` / GTM snippet interpolate the configured ID into inline script text. Values come from server env config (not user input), so injection risk is low, but these inline scripts are exactly what a CSP would need `'unsafe-inline'` exceptions for — factor into CSP design. | Low
- These consent scripts load on public pages only; confirm they do **not** load inside `/portal` or `/portal/admin` (they're mounted from the public shell) so admin pages aren't sending analytics/third-party beacons.

## 7. Exposed files

- `.env*`, `.portal-credentials.local.json`, `.vercel` are gitignored and not tracked (verified). On Vercel, `.git` and dotfiles are not served. No source maps or debug endpoints exposed by default.
- **Housekeeping risk:** many iCloud conflict duplicates on disk (`page 2.tsx`, `actions 2.ts`, `admin-security` variants, etc.). They're gitignored (`* 2.*`) so not deployed, but stale copies of security-sensitive code (auth actions, request handlers) invite drift and accidental edits to the wrong file. `.DS_Store` present in the working folder. | Low

## 8. Error handling / info disclosure

- Centralized `createSafeErrorResponse` / `logServerError` returns generic messages + correlation IDs to users while logging detail server-side. Good practice, consistently used.

## Phase 4 findings (to REPORT.md)

| # | Severity | Finding |
|---|---|---|
| S-1 | High | No security headers (CSP/HSTS/X-Frame-Options/etc.) anywhere. |
| S-2 | High | Inbound email webhook signature check silently skipped when `RESEND_WEBHOOK_SECRET` unset (and it's absent from env examples). |
| S-3 | Medium | Email status webhook has no signature verification. |
| S-4 | Medium | `ignoreBuildErrors: true` + no ESLint; type/security errors don't fail builds. |
| S-5 | Medium | Unauthenticated public pilot-application upload has no rate limiting (storage/DoS abuse). |
| S-6 | Medium | Upload MIME validation trusts client `file.type` (no magic-byte sniff; empty type passes). |
| S-7 | Low–Med | `npm audit` not run (blocked) — must be run in a networked env. |
| S-8 | Low | GA/GTM inline scripts interpolate env-config IDs (CSP design consideration). |
| S-9 | Low | Stale iCloud duplicate files of security-sensitive code on disk. |
