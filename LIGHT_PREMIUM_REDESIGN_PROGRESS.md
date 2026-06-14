# Light Premium AMG Redesign Progress

## Branch

`light-premium-amg-redesign`

## Completed

- Rebalanced the global AMG design system from dark-first to light aviation surfaces with navy/blue brand accents.
- Rebuilt the public header, homepage hero, services cards, aircraft teaser, process timeline, portal ecosystem, request form, login/access UI, footer, and shared page hero treatment.
- Removed custom cursor behavior, magnetic link movement, GSAP ScrollTrigger imports, Lenis smooth scrolling, parallax hooks, and scroll-video playback manipulation.
- Updated portal shell, sidebar, topbar, primitive cards, data tables, fields, status badges, timelines, empty states, and notices toward a light operations dashboard style.
- Added a defensive Supabase middleware env guard so local portal routes redirect to login instead of throwing when Supabase URL/key are absent.

## Public Pages Touched

- Home
- About/shared page hero
- Services
- Aircraft support
- Pilot network/shared page hero
- Plans/subscriptions shared styling cleanup
- Contact/request support form
- Login/signup portal access
- Legal/access utility pages via shared styling and cursor hook cleanup

## Portal Areas Touched

- Portal shell/sidebar/topbar
- Portal shared primitives
- Portal fields/forms
- Portal data tables
- Portal status badges and notices

## Imagery / Assets

No new external imagery was added in this pass. Existing repo assets were reused:

- `/images/hero-jet-poster.jpg`
- `/images/heavy-jet.png`
- `/images/jet-interior.png`
- `/images/jet-sky.png`
- `/images/operations.png`
- `/images/site/map-operations.jpg`
- `/images/site/cirrus.webp`
- `/images/site/diamond-me.jpg`
- `/images/site/tbm.jpg`

Licensing/source note: this pass did not introduce new third-party or Shutterstock assets. Existing repository asset provenance should remain the source of truth.

## Interaction System

- Native cursor only.
- CSS transitions for hover/focus states.
- Lightweight IntersectionObserver reveal-once behavior.
- `prefers-reduced-motion` support in global CSS.

## Route Audit

Production server route audit returned 200 for core public routes:

- `/`
- `/about`
- `/services`
- `/aircraft`
- `/plans`
- `/pilot-network`
- `/contact`
- `/login`
- `/signup` -> `/login?mode=request`
- `/privacy-policy`
- `/terms`
- `/operational-disclaimer`

Portal entry routes returned 200 via login redirect without local Supabase env:

- `/portal`
- `/portal/admin`
- `/portal/client`
- `/portal/crew`
- `/portal/partner`

Public internal href extraction found no 404s for visible public links.

## Validation

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Browser QA checked desktop homepage, mobile homepage, mobile login/access, and key public route loading/no-overflow states.

## Known Risks / Follow-up

- Authenticated portal workflow QA still requires valid Supabase environment variables and test accounts.
- No new licensed stock imagery was added; a future pass can source replacement aviation photography if AMG wants stronger page-specific imagery.
- Some deeper public/portal pages still inherit legacy composition, but the shared surfaces, navigation, forms, and portal shell now establish the lighter AMG system.
