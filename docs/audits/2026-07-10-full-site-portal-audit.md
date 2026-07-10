# AMG Aviation Group Website + AMG Connect Portal Audit — 2026-07-10

## Executive summary

This audit used the current repository at `/workspace/amg1`, the configured production URL name, and the environment variables present in this fresh Codex Cloud task. No production data was written, no emails were sent, no payments were charged, and no deployment was attempted.

Overall, the repository builds and typechecks successfully, and several important security controls are present: portal middleware redirects unauthenticated `/portal` traffic, API document/download routes perform approved-user checks, cron requires `CRON_SECRET`, Stripe and email webhooks verify signatures, and global security headers/CSP are configured. The main blockers are operational/configuration issues in the audit environment and stale verification scripts that no longer match the current codebase.

## Evidence baseline

| Area | Result | Evidence |
| --- | --- | --- |
| Repository identity | `AUTHORIZED_REPO=amgaviation/amg1`, `GITHUB_OWNER=amgaviation`, `GITHUB_REPO=amg1`; no local git remotes were configured in this task. | `git remote -v`, `git branch --show-current`, `git log -1 --oneline --decorate`, environment names only. |
| Branch/commit | Branch `work`, latest commit `eabadf9 Merge pull request #126 from amgaviation/claude/amg-marketing-design-pass-f0jcir`; working tree was clean before this report. | Git commands above. |
| Env var presence | Only names were inspected. Expected production service variables such as Supabase, Stripe, Resend, cron, and webhook secrets were not present in this shell environment. | `env | cut -d= -f1 | sort`; no values printed. |
| GitHub source access | GitHub CLI is not installed; no remote URL is configured. Source identity came from Codex-provided repo env names and local checkout. | `gh repo view` failed with `gh: command not found`; `git remote -v` empty. |
| Production site access | `PRODUCTION_URL=https://www.amgaviationgroup.com` is present, but outbound curl to the site was blocked by the environment proxy with HTTP 403. | `curl -I -L --max-time 20 "$PRODUCTION_URL"`. |
| Supabase read-only access | Not verified live: no Supabase URL/key variables were present in this shell. Code-level audit only. | Env names; code inspection. |
| Stripe read-only/test access | Not verified live: no Stripe key variables were present in this shell. Code-level audit only. | Env names; code inspection. |
| Resend access | Not verified live: no Resend API/webhook variables were present in this shell. Code-level audit only. | Env names; code inspection. |
| Install | Passed. | `npm install`. |
| Lint/typecheck | Passed. | `npm run lint`. |
| Build | Passed. | `npm run build`. |
| npm audit | Failed on two moderate Next/PostCSS advisories. | `npm audit --audit-level=moderate`. |

## Verified strengths

1. **Portal entry middleware is fail-safe when Supabase public env is absent.** Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` redirects `/portal` traffic to `/login?error=missing-supabase-env`, rather than rendering private routes without auth context.
2. **Portal route access is centrally session-aware.** `/portal` root obtains the session user and redirects unauthenticated traffic to `/login`; role home resolution is centralized through `ROLE_HOME`.
3. **Service-role usage is explicitly marked high-risk.** `createServiceClient()` throws without server-side Supabase URL/service role key and comments that it bypasses RLS.
4. **API guards exist for private JSON and approved portal users.** `requireApprovedPortalApiUser()` returns 401/403 and `privateJson()` sets `Cache-Control: private, no-store`.
5. **Document/file download routes check approved profiles before service-role storage reads.** Reviewed examples include portal documents, billing documents, communication attachments, network application files, and vendor receipts.
6. **Cron is protected by bearer token.** `/api/cron/nightly` returns 503 when `CRON_SECRET` is absent and 401 when authorization does not match.
7. **Email and Stripe webhooks have signature enforcement paths.** Stripe webhook processing receives the raw body and signature; email status validates Svix HMAC when configured and fails closed in production without a signing secret.
8. **Global security headers and CSP are configured.** `next.config.ts` sets HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP, and CSP reporting.

## Findings

### F1 — Medium: `npm audit` reports vulnerable Next/PostCSS dependency chain

- **Severity:** Medium.
- **Evidence:** `npm audit --audit-level=moderate` reports `postcss <8.5.10` via `next` with advisory `GHSA-qx2v-qp2m-jg93`; npm suggests `npm audit fix --force`, but that would install a breaking Next version according to the audit output.
- **Affected area:** Dependency supply chain; `package.json` depends on `next ^16.0.7` and lockfile resolved to the version installed during this task.
- **Impact:** Potential CSS stringification XSS exposure if application code or dependencies stringify attacker-controlled CSS containing the vulnerable sequence. Practical exploitability depends on runtime CSS handling, but aviation/customer portal apps should not carry known moderate advisories into production.
- **Verification notes:** `npm install` completed and audited 377 packages; `npm audit --audit-level=moderate` exited 1.
- **Recommended fix:** Evaluate upgrading Next to a version whose transitive PostCSS is patched once available for the current major, or apply the vendor-recommended patch path in a dedicated dependency PR with full build/regression testing. Do not blindly use `--force` without reviewing the downgrade/breaking-change behavior shown by npm.

### F2 — Medium: Compliance verification script is stale and fails on removed/renamed public form files

- **Severity:** Medium.
- **Evidence:** `npm run compliance:check` fails immediately because `scripts/verify-compliance-foundation.mjs` reads `components/site/contact-inquiry-form.tsx`, which does not exist in the current repo. Current public request form files are under `app/(public)/request/`.
- **Affected area:** Compliance verification automation, launch checklist confidence.
- **Impact:** The team cannot rely on the documented compliance check as a pass/fail gate. This increases risk of shipping regressions in consent/legal/form handling because the automation is no longer aligned with the current route/component structure.
- **Verification notes:** Command failed with `ENOENT: no such file or directory, open '/workspace/amg1/components/site/contact-inquiry-form.tsx'`.
- **Recommended fix:** Update `scripts/verify-compliance-foundation.mjs` to inspect the current public request/signup/portal access form files and legal surfaces, then re-run `npm run compliance:check`.

### F3 — Medium: Website editor verification script fails against current super-admin shell/signup implementation

- **Severity:** Medium.
- **Evidence:** `npm run website-editor:verify` reports that the admin portal shell must expose Website Editor navigation and that public signup must reject super_admin role requests. Code inspection shows the shell uses a broader condition that includes `role === "admin" || role === "super_admin"`, while the script requires a specific string match. Public signup now redirects to login/request mode rather than rendering an inline role selector.
- **Affected area:** Website editor release safety checks.
- **Impact:** The verification script may be falsely negative, but that still blocks reliable CI/release validation. If not false positive, super-admin navigation or role escalation protection could be impaired. Because this audit did not authenticate to production, live super-admin navigation was not verified.
- **Verification notes:** `npm run website-editor:verify` exited 1 with the two messages above; code inspection found current shell and signup behavior.
- **Recommended fix:** Decide whether the script or implementation is authoritative. If implementation is correct, relax the brittle substring checks and validate behavior structurally. If implementation is wrong, restore explicit super-admin navigation and role rejection tests.

### F4 — Medium: Production and provider live checks were blocked by missing env vars / network proxy

- **Severity:** Medium operational risk.
- **Evidence:** The task environment did not contain Supabase, Stripe, Resend, cron, or webhook secret names, and curl to the configured production URL failed with `CONNECT tunnel failed, response 403`.
- **Affected area:** Evidence completeness for production website, AMG Connect portal, database, payments, and email delivery.
- **Impact:** This audit could verify code paths and local build health, but could not validate production runtime configuration, live RLS behavior, Stripe mode/account status, Resend identity/webhook status, or browser-level production UX.
- **Verification notes:** Env names only were printed; no secret values were displayed. Live reads were not attempted without credentials.
- **Recommended fix:** Run the same audit from an environment with read-only production credentials and outbound access, or provide scoped read-only test credentials. Keep service-role credentials server-only and avoid any write endpoints.

### F5 — Low/Medium: `next.config.ts` disables type validation during `next build`

- **Severity:** Low to Medium.
- **Evidence:** `next.config.ts` sets `typescript.ignoreBuildErrors: true`; `npm run lint` separately runs `tsc --noEmit` and passed in this task.
- **Affected area:** Build/release guardrails.
- **Impact:** If CI/deploy ever runs `next build` without a preceding successful `npm run lint`, TypeScript errors could be ignored during production builds. Current local validation mitigates this because lint/typecheck passed.
- **Verification notes:** `npm run build` output explicitly stated “Skipping validation of types.”
- **Recommended fix:** Prefer enforcing type validation in build, or guarantee CI/deploy gates on `npm run lint` before `npm run build`.

## Routes and workflows reviewed from source

- Public website routes under `app/(public)`: home, pricing, request, login/signup redirects, legal/privacy/cookie/terms, pilots, team, how-it-works, missions.
- Portal route families under `app/portal`: admin, client, crew, partner, super-admin website editor, document viewing, invoices, subscriptions, messages, notifications, settings.
- API routes under `app/api`: build-info, compliance consent, crew-network applications, cron, CSP reports, portal setup completion, document/download/content endpoints, search, communication send/download, Stripe webhook, email inbound/status webhooks.
- Shared modules: Supabase server/client helpers, portal session/guards, portal shell/navigation, Stripe mode/invoice/subscription helpers, email config/provider, compliance consent/legal helpers, security headers/CSP.

## Not verified

- Authenticated production portal pages and role-specific UI behavior, because no production credentials were used and the production URL was inaccessible from this task.
- Live Supabase RLS policies/data, because no read-only Supabase env vars were present.
- Live Stripe account/mode/webhook endpoint status, because no Stripe env vars were present.
- Live Resend domain, sender, or webhook status, because no Resend env vars were present.
- Email sending, payment charging, production data writes, and deployment, intentionally not attempted per safety constraints.

## Recommended next steps

1. Patch the stale compliance and website-editor verification scripts so they reflect the current app structure, then add them to routine CI.
2. Resolve the Next/PostCSS advisory through a controlled dependency update and regression run.
3. Re-run this audit from a read-only production-observability environment with outbound access to `https://www.amgaviationgroup.com` and scoped read-only provider credentials.
4. Consider removing `typescript.ignoreBuildErrors` or enforcing `npm run lint` as a non-optional pre-build gate in deployment.
