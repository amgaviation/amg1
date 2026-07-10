# Phase 0 — Orientation

**Audit date:** 2026-07-05 · **Branch inspected:** `portal-v3` · **Mode:** READ-ONLY (Pass 1)

## 1. Stack identification

| Layer | Technology | Evidence |
|---|---|---|
| Framework | Next.js ^16.0.7 (App Router, Server Components + Server Actions) | `package.json`, `app/` directory |
| Language | TypeScript ^5.7.2 — **but `ignoreBuildErrors: true`** | `next.config.ts` line 5 |
| Runtime | Node 22 | `.nvmrc` |
| UI | React 19, Tailwind CSS 4, Radix UI, Three.js/R3F, GSAP | `package.json` |
| Auth + Database | **Supabase** (Postgres + Supabase Auth, `@supabase/ssr` cookie sessions, RLS-based) | `lib/supabase/*`, `supabase/migrations/` (38 migrations) |
| Payments | Stripe ^22.3.0 (Checkout Sessions, invoices, subscriptions, webhook) | `lib/portal/stripe-*`, `app/api/webhooks/stripe/` |
| Email | Resend (outbound) + inbound/status webhooks; Twilio env keys present (SMS) | `lib/email/*`, `app/api/webhooks/email/*` |
| Hosting | Vercel (project `amg1`) | `.vercel/project.json` |
| CMS-ish | JSON content files + a Super-Admin "website editor" that commits to GitHub via token | `content/site/*.json`, `lib/website-editor/github.ts`, `GITHUB_TOKEN` env |
| Middleware | `proxy.ts` (Next 16 middleware) — matcher **`/portal/:path*` only** | `proxy.ts` |
| Tests | No real test suite: `npm test` = `tsc --noEmit`; assorted `verify-*` scripts | `package.json`, `scripts/` |

## 2. Repository map (annotated by purpose)

```
app/
  (public)/            PUBLIC SITE — marketing pages, login/signup, password flows,
                       quote request form, pilot network application, legal pages
  auth/                AUTH FLOWS — callback, confirm, invite, password-setup routes
  api/                 API ROUTES (17):
    build-info/                     public
    compliance/consent/            public (cookie consent)
    crew-network/applications/     public form intake
    portal-setup/complete/         account setup
    communications/…               admin email center (send, attachments)
    portal/…                       portal file content/download, search, admin analytics
    webhooks/stripe/               Stripe webhook
    webhooks/email/inbound|status/ Resend inbound + delivery-status webhooks
  portal/              PORTAL (auth-gated by proxy.ts):
    actions/           ~24 server-action modules (admin, auth, billing, crm, crew,
                       invoices, messages, missions, quotes, subscriptions, …)
    admin/             ADMIN BACKEND — ~45 pages (clients, crew, invoices, payments,
                       audit-log, user-approvals, system-health, security-review, …)
    client/  crew/  partner/   role-specific workspaces
    super-admin/       website editor (GitHub-committing CMS)
  payments/stripe/     Stripe success/cancel pages
components/            site/ (public), portal/ (portal+admin), ui/ (shared shadcn)
lib/
  supabase/            client.ts (browser), server.ts (RLS client + SERVICE-ROLE client),
                       middleware.ts, generated database.types.ts
  portal/              domain logic incl. session.ts (role gating), audit.ts, stripe-*, billing
  auth/  email/  compliance/   supporting modules
supabase/migrations/   38 SQL migrations (tables + RLS policies)
content/  cms/  data/  static content
docs/                  ~60 internal docs incl. admin-security.md, DEPLOYMENT_RUNBOOK.md
scripts/               verify-* scripts, crew CSV import (some use service-role key)
tests/                 one fixture only (email-inbound.json) — no test runner
```

Noted housekeeping issue: many iCloud conflict duplicates (`page 2.tsx`, `actions 2.ts`, …) exist on disk; `.gitignore` excludes `* 2.*` so they are untracked, but stale duplicates of security-relevant code sit beside live files.

## 3. Entry points

- **Public pages:** ~30 marketing/legal/auth pages under `app/(public)/`
- **Public form intakes:** `/request` (quote request, server action), `/pilots/apply` (+ `POST /api/crew-network/applications`), signup/login/password flows
- **Auth routes:** `/auth/callback`, `/auth/confirm`, `/auth/invite`, `/auth/password-setup`
- **Portal pages:** ~100 pages across client / crew / partner / admin / super-admin roles
- **Server actions:** ~24 modules under `app/portal/actions/` + public form actions
- **API routes:** 17 (list above) — file download/content endpoints are notable IDOR-check targets
- **Webhooks (unauthenticated entry):** Stripe (`/api/webhooks/stripe`), Resend inbound email (`/api/webhooks/email/inbound`), email status (`/api/webhooks/email/status`)
- **Cron/scheduled jobs:** none found (no `vercel.json` crons)
- **Middleware:** `proxy.ts` gates `/portal/*` only — auth presence check, not role check (role checks live in `lib/portal/session.ts` called from layouts/pages/actions)

## 4. Secrets posture (locations only — values not recorded)

- `.env.local` exists in the working folder and contains live keys (Supabase service-role key, Resend, Twilio, notification-webhook secret). It is **gitignored and NOT tracked in git** (verified via `git ls-files`).
- Secrets referenced from env at runtime; no hardcoded credentials found so far (deeper grep in Phase 4).
- `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) is used by `lib/supabase/server.ts:createServiceClient()`, `app/portal/admin/system-health/page.tsx`, and two import scripts. Where and how it's invoked is a Phase 2/3 focus.

## 5. Architecture summary (three surfaces, one app, one DB)

Public site, client/crew/partner portal, and admin backend are a single Next.js app on one Supabase project. All surfaces share: one anon-key client (RLS-enforced), one service-role client (RLS bypass), the `profiles` role model, and one session cookie. Admin lives at the guessable path `/portal/admin`. Segregation relies on (a) Supabase RLS policies and (b) `requireRole()`/`requireSuperAdmin()` checks in app code.

## Phase 0 checkpoint — confirm to continue

Stack confirmed: **Next.js 16 + Supabase + Stripe on Vercel**, single codebase/single DB across public site, portal, and admin. Ready to proceed to Phase 1 (boundary mapping) on your confirmation.
