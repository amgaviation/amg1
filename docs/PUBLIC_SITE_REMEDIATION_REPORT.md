# Public Site Remediation Report

## Initial Findings

- Public pages still contain motion wrappers that can render content hidden before client-side animation initializes.
- The public site depends on Lenis smooth scrolling, which is unnecessary for core content visibility and can complicate reduced-motion behavior.
- Aircraft imagery includes known mismatches and repeated category photography.
- Subscription plan naming and pricing language need replacement with proposal-based subscription programs.
- The support form needs category-specific fields, validation, and confirmation behavior.
- Public navigation and footer need simplification around a single `Member Login` entry.
- Portal routes and Supabase-backed portal behavior must remain unchanged.

## Root Cause Summary

Recent preview and portal-completion work changed shared public components, motion behavior, media usage, and deployment assumptions over multiple branches. This remediation keeps portal behavior fixed while replacing the public system in one branch.

## Work Log

- Created branch `fix/public-site-production-remediation` from latest `main`.
- Added `/api/build-info` for Git SHA verification.
- Added deployment runbook and initial remediation status.
- Added portal-protection inventory.
- Removed public Framer/Lenis content reveal dependency so public content is visible without client-side animation.
- Stabilized public header height and sticky aircraft category navigation.
- Simplified public navigation and footer around a single `Member Login` route.
- Rebuilt aircraft category data with accurate aircraft classes and custom-review treatment for helicopter and super-midsize subscription pricing.
- Replaced aircraft category photos with non-photo category treatments where verified licensed category-specific photos were not available.
- Rebuilt AMG Subscription Programs with aircraft-class and Monthly/Annual selectors, proposal-based pricing, allowance definitions, credit policy, annual billing rules, and exclusions.
- Rebuilt Request Support as a category-specific dynamic intake form with visible labels, required fields, query-parameter preselection, client-side category switching, server-side validation, and existing backend submission preservation.
- Added media manifest, attribution notes, subscription rules, and public test report.
- Added duplicate public image-reference audit.
- Added compressed hero poster and disabled eager fixed-nav route prefetching to reduce home-page payload.

## Files Changed

Primary public files changed:

- `app/(public)/layout.tsx`
- `app/(public)/about/page.tsx`
- `app/(public)/aircraft/page.tsx`
- `app/(public)/contact/actions.ts`
- `app/(public)/contact/page.tsx`
- `app/(public)/pilot-network/page.tsx`
- `app/(public)/plans/page.tsx`
- `app/(public)/team/page.tsx`
- `app/api/build-info/route.ts`
- `app/globals.css`
- `components/site/*`
- `lib/content.ts`
- `scripts/audit-media-uniqueness.ts`
- `docs/*`

Portal files were not modified.

## Public Routes Changed

- `/`
- `/about`
- `/services`
- `/aircraft`
- `/plans`
- `/pilot-network`
- `/team`
- `/contact`
- public legal and policy pages through shell/footer/navigation behavior

## Portal Protection Verification

Protected portal inventory was created in `docs/PORTAL_PROTECTED_FILES.md`.

Verification command:

```bash
git diff --name-only f9afe26848e62e39d431b51ca61793a643bd7a48...HEAD -- 'app/portal/**' 'components/portal/**' 'lib/portal/**' 'lib/supabase/**' 'app/api/portal/**' 'app/auth/**' 'proxy.ts' 'app/(public)/login/**' 'app/(public)/forgot-password/**' 'app/(public)/reset-password/**' 'app/(public)/signup/**' 'app/(public)/pending-approval/**' 'app/(public)/access-denied/**' 'components/site/portal-login.tsx'
```

Result: no protected portal file changes.

## Image Replacements

- Removed repeated CTA background photography.
- Removed mismatched aircraft category photos from aircraft-class cards.
- Used non-photo aircraft-category treatments where verified category-specific photo rights were not available.
- Added `docs/MEDIA_MANIFEST.csv` and `docs/MEDIA_ATTRIBUTION.md`.
- Added `npm run media:audit` duplicate-reference enforcement.

## Subscription Decisions

- Removed public plan names `Baseline Support`, `Active Support`, and `Fleet Support`.
- Replaced public pricing with `Request Tailored Proposal`.
- Kept internal labor/pricing formulas out of public UI.
- Added monthly/annual allowance logic by aircraft class.
- Marked Super-Midsize Jet and Helicopter as custom proposal/review only.

## Form Behavior

- Request Support now changes visible fields and required category details by selected category.
- Shared contact, aircraft, timing, summary, and acknowledgment fields remain visible across categories.
- Category can be preselected by URL query parameter.
- Server action validates category, required shared fields, acknowledgment, and honeypot.
- Existing Supabase-backed mission insert and admin notification path is preserved.

## Test Results

See `docs/PUBLIC_SITE_TEST_REPORT.md`.

Summary:

- `npm run typecheck`: passed.
- `npm run media:audit`: passed.
- `npm run build`: passed.
- Playwright route/form verification: passed for 14 routes across 3 viewport sets.
- Lighthouse local production home: Performance 87, Accessibility 100, Best Practices 100, SEO 100.

## Deferred Items

Final public dollar pricing remains deferred because approved customer-facing prices were not provided. The public site uses proposal-based pricing.

## Final Results

Pending final merge to `main` and Vercel production verification.
