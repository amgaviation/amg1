# AMG Aviation Group — Public Site Design Baseline, Inventory & Phased Roadmap

*Planner output — Step 0 of the plan-execute-review loop. Read-only research; no code was touched. Scope: everything under `app/` except `app/portal/**` and `app/api/portal/**`, per the loop's charter. The public login page's presentation layer is included and called out as its own phase, per instruction.*

**Loop status key:** each phase below starts `PENDING`. As the loop runs: `IN PROGRESS` (builder working) → `IN REVIEW` (reviewer testing) → `PASS` (committed, done) or, after 5 build-review cycles without a PASS, `BLOCKED` (with the last reviewer findings attached).

---

## 1. Design Baseline Brief

**Source:** homepage (`app/(public)/page.tsx` → `components/flightdeck/*`), confirmed against the live homepage at `https://www.amgaviationgroup.com` (structure, section order, and tone match the repo — this is a deployed, not stale, homepage).

This is the vocabulary other pages should speak, with their own accent — not a spec to clone verbatim.

### Palette
"AMG Flight Deck" system (`app/globals.css:18-29`, `:1656-1662`):
- `--canvas: #070B14` — near-black navy background, the site's true base (not pure black).
- `--instrument: #0b5ed4` / `--instrument-ink: #5b9dff` — the one brand accent; the `-ink` variant is a brighter, AA-safe value reserved for small text/links on dark.
- `--amber: #FFB02E` — sparse, deliberate: numbering badges, live/pulse dots, thin dividers. Never a primary CTA color.
- `--t1 #F4F7FA` / `--t2 #A9B4C6` / `--t3 #74839E` — primary/secondary/tertiary text, a cool three-step gray ramp.
- Legacy `--oc-*` and `--amg-*` token families still exist and are largely **remapped onto the flight-deck values** inside `.public-site` (globals.css:1667-1790), so secondary pages using `oc-blue`/`oc-paper`/etc. resolve to the same rendered colors as the home page even though the class names differ.

### Typography
- Display: Space Grotesk (`--font-space-grotesk`), fluid clamps — `.display-xl` (`clamp(3rem, 8.5vw, 9rem)`), `.display-lg` (`clamp(2.25rem, 5.5vw, 5.5rem)`).
- Data/labels: JetBrains Mono (`--font-jetbrains-mono`) — `.microlabel`/`.microlabel-green`/`.microlabel-amber` (10px, uppercase, 0.22em tracking) and all CTA button text.
- A global rule zeroes Tailwind `tracking-*` utilities *outside* `.fd-site` (globals.css:708-716) — tracking must live in named classes, not ad-hoc utilities, anywhere but the home page.

### Spacing / radius / elevation
- `--radius: 0.625rem` sitewide; portal uses a separate, tighter `0.375rem`.
- Section rhythm: `--public-section-spacing: clamp(4rem, 8vw, 7rem)`; secondary pages use `.oc-section` (`padding-block: clamp(4rem,8vw,8rem)`).
- Elevation is soft and glow-based, never hard drop shadow: `box-shadow: 0 24px 70px rgb(...)`, `0_0_40px_rgba(11,94,212,0.28)` glows on primary CTAs, `.glass-panel`/`.oc-card-dark` for elevated surfaces with subtle inset highlight.

### Motion / interaction language
- **Home** runs GSAP + ScrollTrigger. Almost all entrances are **trigger-once** fade+rise (`toggleActions: play none none none, once:true`) — content always lands fully visible without further scrolling. A small, deliberate set of effects *are* scrubbed: hero sky zoom-settle parallax, the Statement section's word-by-word opacity reveal, the Mission Deck's pinned photo→blueprint crossfade, and the Global Footer's pinned globe/ticker sequence.
- **Secondary pages** use two lightweight, non-GSAP primitives built specifically to echo the home without the bundle cost: `components/site/headline-reveal.tsx` (masked-line rise) and `components/site/reveal.tsx` (`ScrollReveal`, IntersectionObserver-driven `[data-scroll-animate]`/`[data-stagger-item]` fade+translateY(24px), with a 2.6s safety-net timeout so content never gets stuck hidden). This is a genuinely well-built system — not a gap.
- Card hover language is consistent everywhere: a hairline top border, a thin instrument-blue rule that grows `w-8 → w-16` on hover (`.pub-rule` / inline `group-hover:w-16`), amber 2-digit mono index numbers, `.hud-frame` corner-tick framing for feature panels, `.fd-navlink` underline-draw-in on hover.
- A persistent "Get a Quote" pill (magnetic-hover GSAP version on home, a CSS-only port everywhere else) is scroll-aware: it hides near the hero and near any section that already has its own `/request` CTA, so it never duplicates. This is faithfully and correctly mirrored across all secondary pages.
- Everything respects `prefers-reduced-motion` at multiple layers (component logic + global CSS overrides). This is mature, already-solid engineering — do not rebuild it.
- Tone: restrained, aviation-precise, numbers-first — never playful/gimmicky.

### Component patterns
- **Nav** (`components/site/site-nav.tsx`): fixed header, transparent-over-hero on home only, frosted `#070B14/92` blur elsewhere; full-screen mobile menu with real focus-trap.
- **Hero**: full-bleed video-with-still-poster (IntersectionObserver-gated video mount, `preload="none"`, `?fdstill` QA override), layered scrims for legibility, one left-aligned headline lockup, thin amber divider rule, bottom meta strip.
- **CTA buttons**: `.oc-btn-primary` (blue pill, glow), `.oc-btn-light` (white pill — the site's actual primary CTA color for "Get a Quote"), `.oc-btn-ghost`/`.oc-btn-ghost-dark` (outline).
- **Cards**: no boxed borders — `border-t border-grid-silver` hairline + growing instrument rule + amber index number + mono uppercase link-with-arrow.
- **Footer**: home runs a pinned cinematic globe/ticker sequence into a footer; secondary pages get a static three-column `SiteFooter`.

### Tone / copy governance
`docs/website-ground-truth.md` is the enforced copy contract: "AMG Aviation" for public copy, "AMG Aviation Group LLC" for legal; approved workflow verbs are Submit/Review/Evaluate/Determine/Communicate; banned words include "Guaranteed," "Instant Approval," "Reserve Aircraft," "Confirmed Instantly," "Aircraft Fleet" (unless owned/documented). **If page copy conflicts with this doc, the page copy is wrong, not the doc.**

---

## 2. Site Inventory (all public routes)

Two important calibration facts surfaced during this inventory:

> **`docs/PUBLIC_SITE_REMEDIATION_REPORT.md` / `_STATUS.md` / `PUBLIC_SITE_TEST_REPORT.md` are stale.** They document an *earlier* site iteration with routes (`/about`, `/services`, `/aircraft`, `/plans`, `/pilot-network`, `/contact`) that no longer exist — `next.config.ts:73-90` now 301-redirects all of them to the current flight-deck IA. Do not use those three docs as current-state evidence. `docs/WEBSITE_LAUNCH_CHECKLIST.md` is the up-to-date one and its "OPEN — needs Antonio" list is still accurate against today's code.

> **`content/missions/index.ts` is intentionally empty** (`MISSION_CASE_STUDIES: MissionCaseStudy[] = []`) pending 3 real case studies. This gates off, gracefully: the "Missions" nav link, the homepage Proof section (returns `null`), and renders an honest empty state on `/missions`. **This is working as designed, not a bug.**

### Home (`/`)
Baseline itself. Solid across all categories.

### Core conversion pages
| Route | Findings |
|---|---|
| `/pricing` | Strong. **Gap:** no `Offer`/`Product` JSON-LD. |
| `/how-it-works` | Strong, fully on-token. No issues found. |
| `/request` (+ `quote-request-form.tsx`, `actions.ts`) | Well-built (honeypot, payment-data detection, server-side normalization). **Gap:** no rate limiting. |
| `/missions`, `/missions/[slug]` | Code correct and honest about empty state. Content-blocked, not a code defect. |
| `/team` | Handles single-founder/no-photo state gracefully. **Open per launch checklist:** still needs a real photo + credentials line. |
| `/pilots` | Strong, on-token. Inherits the email-mismatch bug (see Phase 1). |
| `/pilots/apply` (+ `network-application-form.tsx`) | **Weakest page in the funnel.** Hardcoded hex colors instead of design tokens, generic card chrome instead of `.oc-card-dark`/`.hud-frame`. Its backing route (`app/api/crew-network/applications/route.ts`) is the one public POST endpoint confirmed to have no honeypot, accepting up to 100MB uploads with no rate limiting. |
| `/for-shops` | Strong, on-token, consistent. No issues found. |

### Auth / portal-entry pages (presentation layer only)
`login`, `signup`, `forgot-password`, `reset-password`, `verify-email`, `portal-setup` (+form), `pending-approval`, `access-denied`, plus `app/auth/confirmed`, `app/auth/error`, `app/auth/reset-password`. Share `components/site/portal-access-shell.tsx`, which uses a **third design vocabulary** (`display-heading`, `eyebrow`, `glass-panel`, `cinematic-band`) rather than `fd-*`/`oc-*`. May or may not read as a visible clash — needs a direct visual pass (Phase 3). `verify-email/page.tsx` uses a raw `<img>` rather than `next/image`.

### Legal / compliance pages
`legal`, `legal/[slug]`, `privacy-policy`, `cookie-policy`, `terms`, `accessibility`, `privacy-choices`. `/legal` is already flagged in the launch checklist as "a structural draft, not legal advice" pending counsel review — business/legal task, not engineering.

**Concrete bug found:** `app/(public)/operational-disclaimer/page.tsx` renders `<LegalDocumentPage slug="mission-acceptance" />` — metadata title/description say "Operational Disclaimer" but the document body shown is mission-acceptance.

**Duplicate-content structure:** `mission-acceptance`, `credential-submission`, and `privacy-choices` are each served at both `/legal/{slug}` *and* their own standalone route — no canonical tag anywhere in the repo to disambiguate.

### Utility / orphan pages
`motion-assets` — not linked from any nav, unclear if shipped page or dev/QA tool. `app/payments/stripe/success`, `app/payments/stripe/cancel` — functional, not yet visually cross-checked against baseline.

**Sitewide indexability gap:** every auth/utility/payment page above is fully indexable — none set `robots: { index: false }`.

### SEO / structured data / security infrastructure (sitewide)
- **Mature and correctly wired:** full CSP w/ reporting, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, 15 old→new 301 redirects. `robots.ts` correctly disallows `/portal/` and `/api/`. Stripe + email-status webhooks verify signatures correctly.
- **Gaps:** `sitemap.ts` missing `/privacy-choices`; only one `LocalBusiness` JSON-LD block sitewide — no `Offer`/`Service`/`FAQPage`/`Article` schema anywhere; no `<link rel="canonical">` anywhere; no rate-limiting library in the dependency tree at all.
- **Dependency note:** `@supabase/ssr` is still pre-1.0 (`^0.12.0`) — worth confirming latest 0.x patch.

### Images
Raw `<img>` usage is a deliberate, `eslint-disable`-annotated convention for logo/full-bleed hero media — not an oversight. One minor inconsistency: `site-nav.tsx`'s logo `<img>` omits `loading`/`decoding` attributes its siblings set.

---

## 3. Phased Roadmap

Ordered by user-facing impact: correctness/trust issues first, funnel-visual/security gaps next, presentation verification, then SEO/hardening infrastructure, cleanup, legal/content, then the two items blocked on real business input, then maintenance.

**Tool note:** Higgsfield must **not** be used to fabricate a founder photo, fake mission case-study "proof," or any customer-facing claim. Every phase below is **normal** complexity — nothing requires a from-scratch rebuild or new generated visual assets.

---

### Phase 1 — Trust & Content-Correctness Fixes (sitewide) — `STATUS: PASS` (commit `d47892b`, 1 build-review cycle)
**Scope:** `lib/site-config.ts` (`SITE.email`), `components/site/site-footer.tsx`, `components/flightdeck/global-footer.tsx`, `components/site/portal-login.tsx` (2 hardcoded mailtos), `app/(public)/pilots/page.tsx`, `app/(public)/operational-disclaimer/page.tsx`, `lib/compliance/legal-pages.ts`, `app/(public)/legal/[slug]/page.tsx`, `app/(public)/mission-acceptance/page.tsx`, `app/(public)/credential-submission/page.tsx`, `app/(public)/privacy-choices/page.tsx`, `app/sitemap.ts`.

**Objectives:**
- Resolve the contact-email split: `SITE.email` = `ops@amgaviationgroup.com`, but every other reference (`lib/email/config.ts`, `lib/compliance/legal-pages.ts`, `lib/errors/user-facing-errors.ts`, `lib/content.ts`, portal client-notification templates, docs) uses `information@amgaviationgroup.com`. Confirm with the business which mailbox is live/monitored, then make `SITE.email` and both hardcoded `portal-login.tsx` mailtos match it. Acceptance: one email address appears everywhere a contact address is shown or linked.
- Fix or remove `operational-disclaimer`: write real content, or redirect to the correct existing document instead of serving mismatched content under the wrong title.
- Add `<link rel="canonical">` to the duplicate legal routes.
- Add `/privacy-choices` to `app/sitemap.ts`.

**Design-adaptation instruction:** Copy/data/routing correctness only — preserve every existing component and token exactly.

**Suggested tools:** direct edits; interaction testing to click every mailto/legal-doc link and confirm destination + canonical tag; code-review skill given shared-config blast radius.

**Risk notes:** `SITE.email` is imported by multiple components — grep all usages first. Do not touch `app/portal/**`, `app/api/portal/**`, or Supabase auth/session logic.

**Priority:** Highest.
**Complexity:** Normal.

---

### Phase 2 — Pilot Application Funnel Visual & Security Parity — `STATUS: PASS` (commit `2eb7beb`, 1 build-review cycle)
**Scope:** `app/(public)/pilots/apply/page.tsx`, `app/(public)/pilots/apply/network-application-form.tsx`, `app/api/crew-network/applications/route.ts`, `lib/portal/network-applications.ts`.

**Objectives:**
- Replace hardcoded hex classes with the same token classes (`oc-*`, `support-field`, `.oc-card-dark`) used sitewide.
- Add `pub-card-hover`/`.hud-frame` card treatment matching `/pricing`/`/for-shops`.
- Add a honeypot field to the form/route and a basic per-IP rate limit given the 100MB unauthenticated multipart upload surface.
- Preserve all existing client-side validation, error states, and layout — retheme + hardening, not a rewrite.

**Design-adaptation instruction:** Adapt baseline card/hairline/hover-rule language and `oc-*` tokens to this form's density; no home-page GSAP timelines — a lighter `ScrollReveal` entrance is enough.

**Suggested tools:** frontend-design judgment for retheme; interaction testing to re-verify the multi-file-upload flow post-restyle; code-review skill on the honeypot/rate-limit addition.

**Risk notes:** Do not alter `lib/portal/network-applications.ts`'s validation bounds or the Supabase submission path. Test file-upload inputs specifically after class changes.

**Priority:** High.
**Complexity:** Normal.

---

### Phase 3 — Auth & Portal-Entry Presentation Verification — `STATUS: PASS` (commit `7483f4c`, 1 build-review cycle)
**Scope (presentation layer only — not auth/session logic):** `app/(public)/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`, `portal-setup/page.tsx` (+form), `verify-email/page.tsx`, `pending-approval/page.tsx`, `access-denied/page.tsx`, `components/site/portal-login.tsx`, `components/site/portal-access-shell.tsx`.

**Objectives:**
- Render every page side-by-side with `/pricing`/`/how-it-works` and confirm whether the older `display-heading`/`eyebrow`/`glass-panel`/`cinematic-band` class family reads visually consistent with the current baseline or as a leftover iteration. Migrate inconsistent markup to current `oc-*`/token classes without touching form logic, Supabase calls, or redirect behavior.
- Fix `verify-email/page.tsx`'s raw `<img>` to `next/image` (or document why it's deliberately kept).
- Confirm `robots: { index: false }` on each page (ties into Phase 4).

**Design-adaptation instruction:** Keep the flight-deck accent/type system but calmer, form-focused layout — no scroll-driven motion on single-viewport login forms.

**Suggested tools:** frontend-design judgment for visual comparison; interaction testing through the full signup → verify-email → pending-approval → login chain; screenshot comparison against `/pricing`.

**Risk notes:** **Highest-risk phase for accidental breakage** — sits directly in front of Supabase auth. Verify every form action, hidden field, and redirect stays untouched. Do not modify `app/auth/**` route handlers, middleware, or Supabase session code — restyle only.

**Priority:** Medium-high.
**Complexity:** Normal.

---

### Phase 4 — Structured Data & Public-Form Hardening (sitewide infrastructure) — `STATUS: PASS` (commit `62b2554`, 1 build-review cycle)
**Scope:** `app/(public)/pricing/page.tsx`, `app/(public)/missions/page.tsx` + `[slug]/page.tsx`, `app/(public)/layout.tsx`, `app/layout.tsx`, `app/(public)/request/actions.ts`, `app/(public)/privacy-choices/actions.ts`, `app/api/crew-network/applications/route.ts`, all Phase 3 auth/utility/payment pages + `motion-assets`/`mission-acceptance`/`credential-submission`.

**Objectives:**
- Add `Offer`/`Product` JSON-LD to `/pricing`; structure `Service`/`Article` schema for `/missions` so it activates once real case studies land.
- Add `robots: { index: false }` to every auth/utility/payment page identified in Phase 3.
- Add a shared `og:image` to root metadata (reuse an existing asset — no new generation needed).
- Add lightweight rate-limiting to `/request`, `/privacy-choices`, `/api/crew-network/applications`.

**Design-adaptation instruction:** N/A — metadata/schema/backend only.

**Suggested tools:** code-review skill on the rate-limiting addition specifically.

**Risk notes:** Rate limiting must not throttle legitimate concurrent submissions from a shared/NAT'd network — generous threshold, log-only mode first if unsure. Don't let `noindex` bleed onto any of the 14 real marketing routes.

**Priority:** Medium.
**Complexity:** Normal.

---

### Phase 5 — Orphan & Utility Page Audit — `STATUS: PASS` (commit `bef6ebe`, 1 build-review cycle)
**Scope:** `app/(public)/motion-assets/page.tsx`, `app/payments/stripe/success/page.tsx`, `app/payments/stripe/cancel/page.tsx`.

**Objectives:**
- Determine what `motion-assets` is — gate behind an env check or remove if it's dev/QA tooling; give it real metadata + nav if intentional.
- Confirm Stripe success/cancel pages render on-brand and handle a direct/no-referrer visit gracefully.

**Design-adaptation instruction:** If `motion-assets` is kept, bring it to the `oc-*`/card baseline; if dev tooling, just remove/gate it.

**Suggested tools:** none beyond inspection + a business decision on `motion-assets`.

**Risk notes:** Confirm `motion-assets` isn't referenced by any build/QA script before removing.

**Priority:** Medium.
**Complexity:** Normal.

---

### Phase 6 — Legal & Compliance Copy Accuracy Pass — `STATUS: PASS` (no changes needed — audited compliant, independently re-verified by reviewer)
**Scope:** `app/(public)/legal/page.tsx`, `legal/[slug]/page.tsx`, `privacy-policy/page.tsx`, `cookie-policy/page.tsx`, `terms/page.tsx`, `accessibility/page.tsx`, cross-checked against `docs/website-ground-truth.md`.

**Objectives:**
- Verify approved-terms usage and absence of banned guarantee-implying language.
- Confirm the operational-control disclaimer appears exactly once sitewide.
- Flag (don't resolve) the already-known open item: Owner Services/Contract Pilot Agreement language is a structural draft pending counsel review.

**Design-adaptation instruction:** Copy-only — preserve `LegalDocumentPage` component/layout entirely.

**Suggested tools:** none beyond direct text review.

**Risk notes:** Do not "improve" legal language beyond clear ground-truth contradictions — legal-substance changes need business/counsel sign-off.

**Priority:** Lower.
**Complexity:** Normal.

---

### Phase 7 — Business-Content Completion Readiness (Team + Missions/Proof) — `STATUS: BLOCKED (business input required, not code)`
**Scope:** `lib/site-config.ts` (`TEAM_ROSTER`), `content/missions/index.ts`, `components/site/mission-card.tsx` (visual-readiness check only).

**Objectives:**
- Blocked on real business input: a founder photo + credentials line, and three real, flown mission case studies. The code path for both already gates gracefully in their absence.
- Only in-scope engineering action right now: confirm `mission-card.tsx` is visually ready against the current baseline before real content arrives.
- Do **not** generate a stand-in founder photo or synthetic "proof" mission via Higgsfield or any other tool.

**Design-adaptation instruction:** N/A until real content exists.

**Suggested tools:** none — business-content task.

**Risk notes:** None code-side; risk is entirely business-side.

**Priority:** Strategically highest-impact on the site, but not executable by this loop — flagged to the business now, in parallel with everything else.
**Complexity:** Normal.

---

### Phase 8 — Dependency & Security Posture Maintenance — `STATUS: PENDING`
**Scope:** `package.json`, `next.config.ts`'s CSP comment (`'unsafe-inline'`/`'unsafe-eval'` already flagged in-file as "the next hardening step").

**Objectives:**
- Confirm `@supabase/ssr` (`^0.12.0`, pre-1.0) is pinned to its latest 0.x patch.
- Scope out (separately, not urgently) a nonce-based CSP to remove `'unsafe-inline'`/`'unsafe-eval'`.
- No action needed on `xlsx` (known historical CVEs, confirmed unreachable from any public-site route) — portal/admin export tooling, out of scope.

**Design-adaptation instruction:** N/A — infrastructure only.

**Suggested tools:** none beyond dependency-version lookups.

**Risk notes:** A nonce-based CSP is a meaningfully larger change (every inline script/style, including third-party analytics) — treat as its own separate effort.

**Priority:** Lowest.
**Complexity:** Normal.
