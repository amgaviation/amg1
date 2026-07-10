# Technical SEO Audit — www.amgaviationgroup.com

**Date:** 2026-07-05
**Auditor:** Claude Code (`/seo-technical`)
**Scope:** Public marketing site (14 indexable routes + utility pages). Portal (`/portal/*`) and API excluded — auth-gated and correctly disallowed.
**Methodology:** Source review of the Next.js app (`app/robots.ts`, `app/sitemap.ts`, layouts, `next.config.ts`, per-page metadata) cross-checked against the live production deployment (rendered HTML, HTTP headers, redirect tracing, full internal-link status crawl of the homepage). Core Web Vitals field data not measured — PageSpeed Insights anonymous API quota was exhausted; lab-level asset weights measured instead.

---

## Executive summary

1. **Canonical host mismatch (critical).** The live site canonicalizes to `www.amgaviationgroup.com` (apex 308-redirects to www), but the sitemap, robots.txt sitemap reference, and LocalBusiness schema all emit `https://amgaviationgroup.com` (apex). Every URL in the sitemap is therefore a redirect — a textbook mixed-signal setup that wastes crawl budget and dilutes indexing signals.
2. **No canonical tags anywhere (critical).** No page emits `<link rel="canonical">` and the root layout has no `metadataBase`. Combined with the site being fully served at `amg1.vercel.app` (returns 200, no `X-Robots-Tag: noindex`), the entire site is duplicated on a second indexable host with nothing telling Google which copy wins.
3. **Nine utility/auth pages are indexable.** `/login`, `/signup`, `/motion-assets`, `/verify-email`, `/access-denied`, `/pending-approval`, `/portal-setup`, `/mission-acceptance`, `/credential-submission` all return 200 with no robots meta. None belong in the index (`/motion-assets` is an internal design-asset page).
4. **Open Graph metadata is stale and incomplete.** OG title/description still carry the old "Aircraft Support Capabilities" positioning (the page `<title>` was rebranded to "Contract Pilots & Aircraft Movement"), and there is no `og:image` or `og:url` — shared links render without a preview card image.
5. **The fundamentals are otherwise strong.** Fully server-rendered HTML, unique titles/descriptions on every page, real 404s, single-hop legacy 301s, HTTPS + HSTS, light asset weights, clean robots.txt, LocalBusiness JSON-LD present.

---

## 6-layer score

| Layer | Score | Verdict |
|---|---|---|
| 1. Crawlability | 7/10 | Clean robots + sitemap, but sitemap lists redirecting (apex) URLs |
| 2. Indexability | 4/10 | No canonicals, host duplication (apex + vercel.app), utility pages indexable |
| 3. Rendering | 9/10 | Prerendered/SSR, full content in HTML, no JS dependency for content |
| 4. Site architecture | 8/10 | Flat, everything ≤2 clicks; one 2-hop chain, one internal link to a redirect |
| 5. Structured data | 6/10 | LocalBusiness present; wrong `url`, no logo/sameAs, no llms.txt |
| 6. Page experience | 8/10 | HTTPS+HSTS, light pages, font preloads; CWV field data unverified |

---

## Critical issues

### C1. Sitemap, robots, and schema point at the non-canonical host
- Live behavior: `https://amgaviationgroup.com/` → **308** → `https://www.amgaviationgroup.com/`. www is the canonical host.
- But `https://www.amgaviationgroup.com/sitemap.xml` lists all 14 URLs as `https://amgaviationgroup.com/...`, robots.txt says `Sitemap: https://amgaviationgroup.com/sitemap.xml`, and the homepage LocalBusiness schema has `"url": "https://amgaviationgroup.com"`.
- Root cause (3 places in source):
  - `app/robots.ts:4` — fallback `"https://amgaviationgroup.com"`
  - `app/sitemap.ts:22` — same fallback
  - `lib/site-config.ts:20` — `SITE.url: "https://amgaviationgroup.com"` (hardcoded, feeds the schema)
  - `NEXT_PUBLIC_APP_URL` on Vercel production is either unset or set to the apex.
- **Fix:** Pick www as canonical (it already is, per the redirect). Set `NEXT_PUBLIC_APP_URL=https://www.amgaviationgroup.com` in Vercel production env, and change all three source fallbacks to the www URL so the env var can never silently regress this.

### C2. No canonical tags / no `metadataBase`, while the site is duplicated on `amg1.vercel.app`
- `app/layout.tsx` metadata has no `metadataBase` and no `alternates.canonical`. Zero pages emit a canonical link.
- `https://amg1.vercel.app/` serves the full site with **200** and **no** `X-Robots-Tag: noindex` (Vercel only noindexes preview deployments, not production aliases).
- **Fix:** In `app/layout.tsx` add:
  ```ts
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.amgaviationgroup.com"),
  alternates: { canonical: "./" },
  ```
  `canonical: "./"` self-references per-path, so every page (including future mission case studies) gets a correct canonical pointing at the www host — this resolves the vercel.app duplication in one move. Optionally also 308 the vercel.app host to www in `middleware.ts` for belt-and-suspenders.

### C3. Utility and auth pages are indexable
- All return 200 with no robots meta: `/login`, `/signup`, `/verify-email`, `/access-denied`, `/pending-approval`, `/portal-setup`, `/mission-acceptance`, `/credential-submission`, `/motion-assets` (also `/forgot-password`, `/reset-password`, `/privacy-choices` by the same pattern).
- They're already excluded from the sitemap, but exclusion isn't noindex — Google can index them from internal links (`/login` is linked from the homepage nav).
- **Fix:** Add `robots: { index: false, follow: true }` to the metadata export of each utility page. `/motion-assets` is the priority — it's an internal design reference. Judgment call on `/login`: a branded portal-login result can be useful for existing clients; if you keep it indexable, keep the current title. Everything else should be noindexed.

## Important issues

### I1. Open Graph / Twitter metadata is stale and has no image
- `app/layout.tssx:24-29` — OG title/description still read "Aircraft Support Capabilities … for Part 91 aviation environments", the pre-rebuild positioning. Rendered page title is now "Contract Pilots & Aircraft Movement for Part 91 Owners".
- No `og:image`, no `og:url`, `twitter:card` is `summary` (small card).
- **Fix:** Align OG copy with the current positioning, add a 1200×630 `og:image` (`opengraph-image.png` convention or explicit `openGraph.images`), and switch to `summary_large_image`. Once `metadataBase` exists (C2), `og:url` resolves automatically.

### I2. Redirect chain and internal link to a redirect
- `/amg-connect` → `/connect` → `/login` (2 hops; `next.config.ts:33-35`).
- The homepage links to `/connect` (307) instead of `/login` directly.
- **Fix:** Point `/amg-connect` straight at `/login`, keep `/connect` → `/login` as its own rule, and update the nav/footer link to `/login`.

### I3. Sitemap `lastModified` is always "now"
- `app/sitemap.ts:26` — `lastModified: new Date()` stamps every URL with the request time. Google discounts lastmod signals that are always fresh, so this forfeits the field's crawl-scheduling value.
- **Fix:** Use real content dates (e.g., a per-route constant updated on meaningful edits, or git-derived dates), or drop `lastModified` for the static routes entirely. The mission case-study entries already do it right (`flownOn`).

## Nice-to-have polish

1. **Enrich the LocalBusiness schema** (`app/(public)/layout.tsx:6-23`): add `logo`, `image`, `sameAs` (LinkedIn etc. when they exist), `priceRange`, and switch `telephone` to E.164 (`+19544081730`). Consider `@type: ["LocalBusiness", "Organization"]`.
2. **Add `llms.txt`** at the root for AI crawlers — a short markdown map of the 8 core pages with one-line descriptions (see `seo-aeo-geo` skill).
3. **BreadcrumbList + Article schema on `/missions/[slug]`** when the launch-gated case studies publish (`content/missions/index.ts:46` is intentionally empty until three real missions exist — sitemap wiring for them is already correct).
4. **Serve the logo through `next/image`**: `/images/logo-short.png` is 1110×242 / 47KB rendered at ~24px height; a properly sized asset would be a few KB. Hero webp (48KB) and total JS (~860KB uncompressed, 12 chunks) are reasonable.
5. **CWV field data:** lab signals look healthy (77KB HTML, preloaded self-hosted fonts with `display: swap`, preloaded hero image, no render-blocking video), but verify in Search Console → Core Web Vitals or PageSpeed Insights once quota resets. The `sr-only` H1 is fine for SEO (matches the visible hero message) — just keep them in sync.
6. **Local-only housekeeping (not deployed, no production impact):** iCloud conflict copies sit inside routable directories — `app/(public)/*/page 2.tsx` (pricing, missions, how-it-works, for-shops, request), `app/(public)/missions/[slug] 3/`, `content/missions/index 2.ts`. They're untracked so production is unaffected, but bracket-named conflict dirs inside `app/` can confuse local builds. Delete locally when convenient.

---

## Implementation roadmap

Everything in phase 1–2 is a small PR against `next.config.ts`, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `lib/site-config.ts`, plus one Vercel env var. No route or copy changes.

**Phase 1 — canonical host (do first, ~30 min):**
1. Set `NEXT_PUBLIC_APP_URL=https://www.amgaviationgroup.com` in Vercel production env.
2. Change fallbacks in `app/robots.ts`, `app/sitemap.ts`, and `lib/site-config.ts` `SITE.url` to the www URL.
3. Add `metadataBase` + `alternates: { canonical: "./" }` to `app/layout.tsx`.
4. Verify on the Vercel preview: sitemap URLs, robots sitemap line, schema `url`, and `<link rel="canonical">` all say `www.`.

**Phase 2 — indexability + sharing (~1 hr):**
5. `robots: { index: false }` on the utility/auth pages (C3 list).
6. Refresh OG title/description, add `og:image` (1200×630) + `summary_large_image`.
7. Collapse `/amg-connect` to point directly at `/login`; update homepage nav link from `/connect` to `/login`.
8. Fix sitemap `lastModified`.

**Phase 3 — after deploy:**
9. In Google Search Console: add/verify the `www` property (domain property covers both), resubmit the sitemap, and spot-check `URL Inspection` on `/` and `/pricing`.
10. Schema enrichment, `llms.txt`, logo via `next/image`, CWV verification.
11. When the three launch case studies publish: Article + BreadcrumbList schema on `/missions/[slug]`.

---

## What was verified vs. not

- **Verified live:** robots.txt, sitemap.xml contents, apex/www/http redirects, HSTS, homepage + 5 key pages' rendered titles/descriptions/robots meta, all homepage internal-link statuses (all 200 except the `/connect` 307), 404 behavior (real 404), 9 utility pages' indexability, vercel.app duplication, JSON-LD contents, asset/JS weights.
- **Not verified:** Core Web Vitals field data (PSI quota), Search Console index coverage (no access from this session), Vercel production env vars (inferred from live sitemap output).
