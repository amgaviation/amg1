# AMG Portal v4 — "Manifest" Ground-Up Rebuild

Branch: `rebuild/portal-v4`. Database: existing Supabase project `vsynqnqlouvphiniqaiy`
(57 tables, RLS on) — **schema is frozen; the portal rebuilds around it.**

## What v4 is

One end-to-end operations portal for everything AMG: business ops (admin/super_admin),
clients, crew, and partners. Every v3 feature survives; the experience layer is rebuilt
from zero as a new design system called **AMG Manifest**.

## Stable contracts (do NOT break)

1. **Token names** `--deck-*` and component classes `deck-*` are the API ~106 pages
   compile against. v4 changes every VALUE and implementation, never the names.
2. **Kit exports** in `components/portal/ui/*` keep exported names + prop signatures.
3. **DECK_NAV** workspace labels (admin: Command Center, Operations, Network, Business,
   Communications, Administration; + Website for super_admin) —
   `scripts/verify-admin-access-communications.mjs` asserts them. Groups carry a
   landing `href`; the shell renders one rail link per workspace plus a
   contextual sub-nav strip of the group's non-`secondary` items
   (see docs/portal-operational-restructure.md).
4. `scripts/verify-portal-overflow-layout.mjs` asserts `deck-card`/overflow/token-surface
   patterns (`bg-[var(--deck-panel)]`, `bg-[var(--deck-panel-2)]`) — keep pages on tokens.
5. `lib/portal/*` data modules and `app/api/**` route paths keep their module paths and
   the Supabase schema contract. RLS roles are locked: client/crew/admin/partner/super_admin.
6. Column-name embeds (`owner:owner_id(...)`) in Supabase queries, never FK-name embeds.

## AMG Manifest design language

The portal reads like a precision flight manifest: plain white canvas, ink
typography, one AMG instrument-blue brand accent, hairline rules, flat stamped
surfaces. Explicitly NOT generic SaaS (no glow shadows, no bubbly radii) and NOT
the public site system (no instrument green, no GSAP motion).

- **Light "Day Board" is default**; dark "Night Ops" via `data-portal-theme="dark"`.
- Palette (light, per approved Colors.png): canvas `#FFFFFF` plain white, panel
  `#FFFFFF` (separated by hairlines + faint shadow), insets/table-heads `#F3F4F6`,
  ink text `#16191E`, hairlines `#E5E7EB` (Light Gray), muted text `#6B7280`
  (Jet Gray), accent AMG Blue `#1D4ED8`, sky `#38BDF8` for limited interactive
  emphasis, Aviation Gold `#D4AF37` reserved for rare premium/financial emphasis,
  Aviation Red family for genuine errors only.
- Palette (dark): canvas `#0D1219`, panel `#131924`, cool text `#EEF2F7`,
  accent ink `#7FB2FF`.
- Chrome rail: theme-invariant AMG Navy `#050B14` — the ops rail is always night.
- Geometry: radius 6px, flat surfaces (hairline shadow only), square stamped chips,
  2px solid accent rails on KPI tiles.
- Type: Space Grotesk display, JetBrains Mono for eyebrows/data/numerals (tabular).
- Primary buttons: ink in light mode, instrument blue in dark.
- Ergonomics: calm density, generous line-height, high contrast, no motion beyond
  140ms color/border transitions.

## Page archetypes (already applied in v3 — keep)

- **List** = FilterTabs + PageToolbar, table as its own card.
- **Detail** = mono-eyebrow summary header with status chip + mono facts,
  DescriptionList sheets.
- Dashboards = role-specific command surfaces (flow band + action queue for admin).

## Work orders

- **Foundation (orchestrator)**: tokens + component classes in `app/globals.css`,
  kit internals, shell chrome, theme default → light.
- **Sweep A (admin)**: `app/portal/admin/**` — verify every page renders pure v4
  (tokens only, no hardcoded hex/white/blue, radii ≤ rounded-md except pills that
  should become stamps), fix drift, keep features identical.
- **Sweep B (client+crew)**: `app/portal/client/**`, `app/portal/crew/**` — same.
- **Sweep C (partner/super-admin/shared/auth)**: `app/portal/partner/**`,
  `app/portal/super-admin/**`, shared viewers (`billing-documents`, `documents`,
  `subscription-invoices`), login/intro surfaces — same.
- **QA-User**: role-play each role on the dev server; find functional problems.
- **QA-Design**: brand/visual/flow audit, both themes, 390px mobile.
- **QA-DB**: schema↔query parity, RLS coverage, Stripe/email integration audit.
- **QA-Perf/Sec**: speed, security, optimization audit.

## Environment gotchas (iCloud repo)

- Local `next build` is unreliable (dataless node_modules); dev server + typecheck
  are the local checks; Vercel preview is authoritative.
- Only ONE `tsc --noEmit` at a time (2–4 min).
- Global CSS zeroes `tracking-*` utilities in the portal — use deck classes or
  `[letter-spacing:x]`.
- Watch for iCloud `* 2.*` conflict-copy files before staging.
