# AMG Public Redesign Merge Readiness

Branch: `redesign/magma-inspired-aviation-production`
Base branch: `main` / `origin/main`
Base commit: `2dc4bb8`
Final commit: local commit created on this branch; verify with `git rev-parse --short HEAD`
Date: 2026-06-21

## Scope

This branch redesigns the public homepage narrative and public state surfaces while preserving protected portal behavior and public form contracts.

## Files Changed

Final changed areas:

- `app/(public)/layout.tsx`
- `app/(public)/page.tsx`
- `app/(public)/loading.tsx`
- `app/(public)/error.tsx`
- `app/(public)/not-found.tsx`
- `app/globals.css`
- `components/compliance/cookie-consent.tsx`
- `components/sections/*crew*globe.tsx`
- `components/site/contact-inquiry-form.tsx`
- `components/site/support-request-form.tsx`
- `components/site/home/*`
- `components/site/oc/shared.tsx`
- `components/site/portal-login.tsx`
- `docs/public-redesign/*`
- `artifacts/public-redesign/*`

## Backend / API / Portal Changes

| Area | Changed? | Notes |
|---|---:|---|
| API routes | No | No API files modified |
| Supabase auth | No | No auth callback, middleware, or role-routing files modified |
| Database migrations | No | No Supabase migrations modified |
| Billing / quotes / invoices | No | No portal business logic modified |
| Public form handlers | No | Server actions and normalization unchanged |
| Protected portal UI | No | No `app/portal` or `components/portal` files modified |
| Login behavior | No | Login wrapper changed from nested `main` to `div` only; auth actions unchanged |

## Dependency Changes

No dependency changes intended. `npm install` completed with the existing lockfile and reported two moderate audit advisories.

## Build And Test Results

Final local verification against `http://localhost:3101`:

- `npm install`: passed, two moderate npm advisories reported
- `npm run lint`: passed
- `npm run build`: passed
- Playwright route/form/responsive QA: passed
  - Desktop and mobile homepage screenshots
  - Reduced-motion homepage screenshot
  - Public route screenshots for about, capabilities, aircraft support, crew network, plans, AMG Connect, contact, request support, login, and portal setup
  - Header/hero CTA checks
  - Section-anchor checks
  - Audience control interaction
  - Mobile menu open and Escape close
  - Contact required validation
  - Request Support required validation and query preselection
  - No console issues
  - No failed requests
- DOM/link/accessibility audit: passed
  - 13 public routes audited
  - 30 internal links checked
  - No multiple-H1 failures
  - No unlabeled visible fields
  - No unnamed visible links/buttons
  - No images missing `alt`
- Lighthouse homepage audit: passed with notes
  - Performance: 85
  - Accessibility: 97
  - Best Practices: 100
  - SEO: 100
  - CLS: 0
  - TBT: 20 ms
  - Total transfer: 630 KB
- `git diff --check`: passed

## Known Limitations

- Higgsfield generation was not available from this environment. This branch reuses repository-approved generated assets and documents the blocker.
- Lighthouse mobile LCP remains 4.3 s on local throttled audit. Hero media and first-screen typography are stable and low-transfer, but a deeper LCP improvement should be treated as a follow-up media/font optimization rather than a merge blocker.

## QA Artifacts

- Screenshots and Playwright JSON: `artifacts/public-redesign/`
- Lighthouse JSON: `artifacts/public-redesign/lighthouse-home.json`

## Local Review Command

```bash
cd /Users/tonygonzalez/Developer/AMG/amg1-public-redesign
npm run dev -- --port 3100
```

## Merge Procedure After Review

```bash
cd /Users/tonygonzalez/Developer/AMG/amg1-public-redesign
git fetch origin --prune --tags
git rebase origin/main
npm run lint
npm run build
git checkout main
git pull --ff-only origin main
git merge --no-ff redesign/magma-inspired-aviation-production
```

## Rollback Procedure

If merged and a rollback is needed, revert the merge commit from `main`:

```bash
git checkout main
git pull --ff-only origin main
git revert -m 1 <merge_commit_sha>
npm run lint
npm run build
```
