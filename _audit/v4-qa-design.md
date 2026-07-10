# Portal v4 Design/Brand QA — AMG Manifest audit

Date: 2026-07-05 · Agent: QA-Design · Branch: rebuild/portal-v4 · Dev server :3000
Status: **TRUNCATED by coordinator hard deadline** — only the admin dashboard was
evidence-audited. All other audit points are explicitly marked NOT COVERED and need a
follow-up pass.

## Environment notes (read before re-running)

- **QA account had to be resurrected.** `qa-deck-review@amgaviationgroup.com` had been
  retired (auth user deleted, profile soft-deleted) after v3 QA. Recreated via Supabase
  admin REST with original id `b0bf2600-8fca-40d0-b4ef-065d037d44b1`, pw per task brief;
  profile reactivated as `role=super_admin, status=approved, is_active=true`.
  **Soft-delete again when v4 QA wraps** (established convention).
- The preview browser had a stale `amg-portal-theme=dark` cookie which makes the portal
  render Night Ops — this is cookie-driven, NOT a wrong default. After clearing the
  cookie, the portal renders light "Day Board" with no theme attribute/cookie present
  (default verified correct).
- Login form is a server-action POST; empty-field submits redirect `?error=missing`,
  bad creds `?error=invalid`. Redirect target cold-compiles (~1 min+) while the URL
  still shows `/login?error=...` — wait, don't re-submit.
- Preview panel viewport reports `innerWidth` 268px at "desktop" native size; screenshots
  are 2x DPR. Don't mistake the narrow panel for a responsive bug; use computed styles.

## Verified evidence (admin dashboard, /portal/admin/dashboard)

Light "Day Board" (default, no cookie) — computed styles:

| Element | Property | Computed | Spec | Verdict |
|---|---|---|---|---|
| `.deck-card` | background-color | rgb(252,251,247) = #FCFBF7 | panel #FCFBF7 | PASS |
| `.deck-card` | border-color | rgb(221,217,203) = #DDD9CB | hairline #DDD9CB | PASS |
| `.deck-card` | border-radius | 6px | 6px | PASS |
| `.deck-card` | box-shadow | 0 1px 0 rgba(25,28,31,.04) | hairline only, no glow | PASS |
| h1 title | font-family | Space Grotesk (via `display` var) | Space Grotesk | PASS |
| h1 title | color | rgb(25,28,31) = #191C1F | ink #191C1F | PASS |
| mono eyebrow/data (`MSN-26-21908`) | font-family | JetBrains Mono | JetBrains Mono | PASS |
| mono eyebrow/data | letter-spacing | 0.576px @ 11.52px (5%) | tracking intact (not zeroed) | PASS |
| mono eyebrow/data | color | rgb(125,100,52) = #7D6434 | champagne ink #7D6434 | PASS |
| primary btn "New Quote" (light) | background-color | rgb(34,38,43) ink | ink in light mode, never blue | PASS |
| primary btn "New Quote" (light) | color | rgb(243,241,234) warm paper | warm text on ink | PASS |

Dark "Night Ops" (via theme cookie, full-page screenshot): dark canvas + panels render;
"New Quote" primary flips to champagne fill; mono uppercase eyebrows (AMG OPERATIONS,
INTAKE / QUOTE / CREW & SCHEDULE / IN FLIGHT / BILLING) show visible tracking; Command
Center hierarchy = eyebrow → display title → mono summary line → actions → flow band →
action queue (matches the admin "flow band + action queue" archetype). No blue, no glow
shadows observed on this page in either theme.

## Findings

### P1 — broken/unreadable
(none found in covered area)

### P2 — brand violation/inconsistency
(none found in covered area)

### P3 — polish
1. **P3 — /portal/admin/dashboard — primary button radius 4px vs 6px geometry.**
   "New Quote" primary button computes `border-radius: 4px`; `.deck-card` and the
   manifest geometry spec say 6px. Within the "≤ rounded-md" sweep tolerance, but the
   4px/6px mix is visible on adjacent elements. Evidence: computed
   `border-radius: 4px` on the New Quote CTA vs `6px` on `.deck-card`.

## NOT COVERED (deadline cut — needs follow-up pass)

- Admin: mission-control, trips list + mission detail, invoices list + invoice detail,
  financial analytics, CRM, communications/emails, calendar.
- View switcher roles: client dashboard / trips / billing, crew dashboard, partner
  dashboard.
- Theme duality re-check across 4–5 key pages via the header toggle (aria-label
  "Switch to dark mode") — only cookie-forced dark on the dashboard was seen.
- Ergonomics/flow: table density/alignment (tabular + right-aligned numerals), status
  chip consistency across pages, breadcrumbs, spacing rhythm.
- Responsive 390px: admin dashboard, one list, one detail, sidebar drawer.
- Typography sweep beyond the dashboard samples above.
- Chrome rail ink #14171B theme-invariance (rail was mid-hydration when sampled;
  transparent bg + warm text observed — inconclusive, re-verify).

## Summary

P1: 0 · P2: 0 · P3: 1 — from ~8% of intended coverage (1 of ~14 surfaces).
Counts are floor values, not a clean bill of health.
