# CLAUDE.md — amg1 (AMG Aviation Group)

Next.js 16 + React 19 + Tailwind 4 + Supabase + Stripe. Public site and client
portal at www.amgaviationgroup.com, deployed on Vercel. GitHub `amgaviation/amg1`
is the source of truth.

## Commands
- `npm run dev` — only ONE `next dev` may run at a time (Next 16 lock file); a
  second instance deadlocks. Cold routes can take ~2 min to compile on iCloud.
- `npm run lint` / `npm run typecheck` — both are `tsc --noEmit` (there is no
  ESLint step). Takes 2–4 min and hangs if two instances run concurrently — kill
  stray tsc processes first.
- `npm run build` — unreliable locally (iCloud dataless `node_modules`); treat
  Vercel preview builds as the authoritative check.
- Feature guard scripts: `npm run compliance:check`, `sms:verify`, and the other
  `*:verify` scripts in package.json. Known pre-existing failures on main:
  the admin-access `auth.signUp` check and `website-editor:verify` — compare
  against a main baseline before chasing them.

## Before business, copy, pricing, or strategy changes
Read `docs/amg-aviation-group-reference.md` first. If a request conflicts with it,
raise the specific conflict before implementing. `docs/PORTAL_PROTECTED_FILES.md`
lists files that must not be casually changed.

## Portal architecture contract
- All portal styling flows through `--deck-*` tokens and kit classes defined in the
  `.amg-portal` blocks of `app/globals.css`, plus primitives in
  `components/portal/ui/*`. Restyle via tokens/kit, never per page. Keep exported
  kit names stable — roughly 100 pages import them.
- Nav IA lives in `DECK_NAV` in `lib/portal/constants.ts`. The guard scripts
  `scripts/verify-portal-overflow-layout.mjs` and
  `scripts/verify-admin-access-communications.mjs` assert implementation details
  (nav group labels, token surfaces) — update them in the same change as any
  intentional redesign.
- `profiles.role` is DB-constrained to client/crew/admin/partner/super_admin —
  do not add roles. Brokers/vendors are `partner` with a `partner_type`.
- Portal theme: cookie `amg-portal-theme` → `data-portal-theme` attribute rendered
  SSR in `app/portal/layout.tsx` (no flash). Light "Day Board" is the default.

## Gotchas
- A global CSS rule zeroes `tracking-*` utilities portal-wide; use
  `[letter-spacing:x]` arbitrary properties or deck classes instead.
- Custom component classes must live inside `@layer components` or they override
  Tailwind utilities.
- Heavy Fast-Refresh churn can silently kill hydration app-wide with no console
  errors — restart the dev server before concluding client code is broken.
- iCloud drops `* 2.ext` conflict copies into the tree (`docs/amg-aviation-group-reference 2.md`
  is one right now) — never commit them; audit `git status` before `git add -A`.
- `.claude/skills/` and `_audit/` are intentionally untracked — leave uncommitted.
- Supabase migrations may already be applied to the live project ahead of a branch
  merge (additive-only) — check `supabase migration list` / live schema before
  re-applying anything.

## Git
- Never commit: secrets, `.env*`, `.vercel`, `node_modules`, `.next`, build output.
- Branch per task; PR into `main`. Preserve existing site/portal behavior, routes,
  public copy, and animations unless explicitly instructed otherwise.
- `AGENTS.md` is the Codex Cloud instruction file — its ephemeral-workspace
  assumptions ("don't rely on local files") do not apply to Claude Code here.
