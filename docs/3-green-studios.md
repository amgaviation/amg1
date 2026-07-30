# 3 Green Studios — one-page site

A bold, experimental one-page marketing site for **3 Green Studios**, a founder-led
studio that builds websites, booking systems, client portals, and Stripe billing for
aviation businesses. The site is the portfolio piece: the interactions are the pitch.

It lives inside this repo as a self-contained route so it can deploy today on the
existing Vercel project. Nothing about the AMG public site, portal, auth, or Supabase
behaviour changed.

## Where everything is

| Path | What |
| --- | --- |
| `lib/studio/brand.ts` | **The one config point.** Name, nav short form, the three candidate taglines + which one is live, email, location, domain, portfolio URL, nav anchors. |
| `app/studio/page.tsx` | The whole page — all ten sections, all copy. |
| `app/studio/layout.tsx` | Route metadata, fonts, `noindex` (see below). |
| `app/studio/studio.css` | Design tokens, primitives, and the reduced-motion contract. |
| `app/studio/studio-parts.css` | Section and component layout. |
| `app/studio/_components/` | Client behaviour: hero scene, gear panel, nav, reveals, counters, magnetic buttons, cursor, both demos, contact form. |
| `public/studio/favicon.svg` | Three green pips. |
| `scripts/verify-studio-page.mjs` | The browser check suite (`npm run studio:verify`). |

Renaming the studio is a one-line edit to `BRAND.name` in `lib/studio/brand.ts`.
Switching the tagline is a one-line edit to `TAGLINE_INDEX` in the same file.

## Design system

Deliberately nothing like AMG's navy "Flight Deck" or "Manifest" systems.

- **Field** `#05070A` near-black, with a hairline 72px grid and a very low-amplitude
  scanline, masked out toward the page bottom.
- **One accent**: radar green `#3BF08A`. It is the whole palette's only colour.
  Everything else is neutral ink.
- **Amber `#FFB020` and red appear in exactly one place** — inside the landing-gear
  indicator while it transits. Keeping them out of every other component is what
  makes the green lock read as a state change rather than as decoration.
- **Type**: Space Grotesk (display) + JetBrains Mono (labels, stats, tail numbers) +
  the platform UI stack for body text. Both webfonts are self-hosted, so nothing
  touches a font CDN and the app's enforced `font-src 'self' data:` CSP is intact.
- Everything is namespaced under `.studio-root`, so AMG's `globals.css` and this
  stylesheet cannot fight. The three `body:has(.studio-root)` / `html:has(...)` rules
  exist to repaint the document background and fix AMG's 108px anchor scroll offset.

## The signature interaction — gear down and locked

Three landing-gear position indicators (nose, left, right) arm in sequence on load:
dark → amber transit → solid green, 140/480/820/1160ms. When the third locks, the
hero's status strip flares once and the CTA row settles 6px.

Two rules govern it, and both matter if you touch `_components/gear.tsx`:

1. **The finished state is what renders on the server.** Three greens and an armed
   hero are the no-JS and reduced-motion truth; the sequence only rewinds that after
   mount, before paint. Nobody lands on a dead panel because a bundle failed.
2. **It never gates content.** The headline and both CTAs are painted and clickable
   from the first frame. The sequence adds a glow and a small transform, nothing else
   — which is also why it cannot delay LCP.

The motif is reused at three other sizes: the nav mark's three pips light in sequence
on load, the scroll-progress hairline greens up as you descend, and "cleared" is the
one status in the ops demo that gets the accent colour.

## The hero scene

Hand-written Canvas 2D (`_components/hero-scene.tsx`) — a live traffic picture: range
rings, bearing ticks, a rotating sweep, and tracks that illuminate as the sweep passes
over them and decay after. Zero dependencies; a WebGL library would have cost hundreds
of kilobytes for this.

- Lazy: a separate chunk (`next/dynamic`, `ssr: false`) that is not requested until
  `requestIdleCallback` fires, so it never queues ahead of the headline.
- Paused: `IntersectionObserver` stops rAF entirely when offscreen, and
  `visibilitychange` stops it when the tab is hidden.
- Scaled: DPR capped at 2 (1.5 on low-power), 16 tracks on desktop / 7 on mobile or
  ≤4 cores, and the scene is dimmed to 55% below 900px where it shares space with copy.
- **Reduced motion: the chunk is never fetched at all.** `_components/hero-poster.tsx`
  renders the same picture as inline SVG and is the shipped artwork for those visitors
  — not a grey placeholder.

## The two live demos

Both are labelled **"Interactive demo — sample data"** in their own headers, are
entirely in-memory, and make no network call.

- **Booking** (`_components/booking-demo.tsx`) — resource → date → slot → optimistic
  confirmation with a code, then reset. Changing resource or date invalidates a pending
  slot rather than silently carrying it. Availability is a deterministic hash, so the
  server and client agree.
  The dates are a **fixed sample week**, not `today + 5`: a demo on the real clock
  would either mismatch on hydration or drift into showing an empty past.
- **Ops dashboard** (`_components/ops-demo.tsx`) — four count-up KPI tiles, a
  hand-rolled SVG bar chart with a text alternative, and a squawk table with status
  filters. All fictional tails and items.

Both are keyboard-native: resource, date and slot are real `<input type="radio">`
groups behind styled labels, so arrow keys, Home/End and screen-reader announcements
work with no JS. The chart and the table each carry their own `min-width` inside an
`overflow-x: auto` box, so they scroll in place and the page never scrolls sideways.

## Honesty rules this page is built under

Hard rules, not preferences. If you edit the copy, keep them:

- No invented metrics, no fake testimonials, no client logos, no "trusted by", no
  project counts, no years-in-business, no team size.
- No pricing anywhere — Tony has not set final numbers.
- **AMG Aviation Group is the one real client**, presented as a mini case study:
  problem → what was built → stack → outcome, with the outcome stated in non-numeric
  terms only. It carries the honesty line verbatim: built and operated by the studio's
  founder, *we run what we build*, and an explicit note that no usage or revenue
  figures are published.
- The outbound link is `https://www.amgaviationgroup.com` (verified 200 on 2026-07-30),
  `target="_blank" rel="noopener noreferrer"`.

## Contact path

There is no form backend, so the form does the only honest thing a keyless static page
can: it composes the message and hands it to the visitor's own mail client, and says so
above the button. Nothing is transmitted from the page and there is no fake success
state. To wire a real backend later, replace `handleSubmit` in
`_components/contact-form.tsx` with a POST and add genuine pending/success/error states
— the fields are already the ones a quote needs.

**The email address is a placeholder.** `BRAND.email` is `hello@3greenstudios.com`,
which is not a live inbox as of 2026-07-30. It is marked as a placeholder in
`lib/studio/brand.ts`.

## Why the route is `noindex`, and what to do about it

`/studio` is a **separate brand served from the AMG deployment** until it gets its own
domain. Two identities indexed under one hostname confuses both, and the brief forbids
associating the studio with the AMG domain at all. So:

- `app/studio/layout.tsx` sets `robots: { index: false, follow: false }`.
- `app/robots.ts` disallows `/studio`.

This is the only reason Lighthouse SEO scores 66 on this route — the single failing
audit is "Page is blocked from indexing". Everything else in that category passes.

**When the site moves to `3greenstudios.com`, remove both**, and set `canonical` /
`metadataBase` to the new host.

The cleanest end state is a separate Vercel project pointed at this route (or the route
extracted into its own repo), with `3greenstudios.com` primary and
`threegreenstudios.com` redirecting to it. That also removes the last performance drag
— see below.

## Verified on 2026-07-30

Run against a production build (`npm run build` → `npx next start`).

**Build** — `npm run build` compiles successfully; `/studio` prerenders as a static
route. `npx tsc --noEmit` reports one error, in `app/portal/actions/outreach.ts`, which
is pre-existing and untouched by this work (the repo also sets
`typescript.ignoreBuildErrors`). No new type errors.

**Lighthouse (mobile, simulated throttling), median of 5 runs:**

| Category | Median | Runs | Target |
| --- | --- | --- | --- |
| Performance | **90** | 97 / 88 / 93 / 90 / 90 | ≥ 90 ✅ (marginal) |
| Accessibility | **100** | 100 on all 5 | ≥ 95 ✅ |
| Best Practices | 100 | 100 on all 5 | — |
| SEO | 66 | 66 on all 5 | intentional `noindex`, see above |

Metrics (median of 5): FCP 1.37s · **LCP 3.34s** (range 2.39–3.38) · TBT 152ms
(127–218) · CLS 0.0003. Total transfer 326 kB over 18 requests — 195 kB script,
65 kB font, 46 kB CSS, 17 kB document.

Read the Performance number with its spread in mind. Runs varied 88–97 on the same
build, so this measurement is CPU-contention-noisy and 90 is the median rather than a
comfortable margin. **Re-measure on the Vercel preview before treating it as final.**

**LCP misses the brief's < 2.5s target under Lighthouse's simulated throttle, and this
was chased rather than excused.** What the experiments showed, each 3 runs on its own
build:

| Variant | Perf median | LCP median | Style & Layout |
| --- | --- | --- | --- |
| As shipped | 90 | 3.33s | 850ms |
| Without AMG's `globals.css` | **92** | 3.06s | 637ms |
| Without the page-wide texture layer | 92 | 2.88s | 805ms |
| Without the texture mask + `text-wrap: balance` | 90 | 3.35s | 821ms |

Two things follow. First, the one real, named lever is **36 kB of render-blocking
`app/globals.css`** — AMG's design system — sitting on the critical path of a page that
uses almost none of it, because the shared root layout imports it. It is worth about two
points. Removing it means moving that import out of `app/layout.tsx` and into every
other route group, and a single missed layout ships an unstyled page on the live AMG
site: too much risk for two points on one route. **It resolves itself the moment the
studio gets its own Vercel project.** Second, the cheap CSS suspects were tested and
exonerated — the mask and `text-wrap: balance` cost nothing measurable, so both stayed.

What was changed for performance, and what it bought:

- Font payload cut from 114 kB across three high-priority preloads to 65 kB across two,
  by dropping Inter for the platform UI stack (the LCP element was body text) and by
  fixing a double-download of JetBrains Mono. **Performance 88 → 93 on the runs at the
  time.**
- The two demos and the contact form are code-split out of the initial bundle
  (`next/dynamic`, SSR still on). **TBT ~170ms → ~140ms.**
- The hero canvas is a lazily-imported chunk that is never fetched under reduced motion.

**Browser suite — 34/34 passing** (`npm run studio:verify`):

- No horizontal overflow at 360, 390, 414, 640, 768, 1024, 1280, 1440, 1920px.
- No console or page errors.
- Gear sequence observed mid-flight (`transit,off,off` at 300ms) reaching
  `locked,locked,locked` + `data-armed="true"`.
- Hero canvas mounts lazily and sizes to its host.
- Reduced motion: canvas never mounts, static poster present, gear reads three green
  immediately, custom cursor absent, all `[data-reveal]` content at full opacity,
  counters show final values.
- Booking demo: select → book → confirmation code; resets cleanly; switching resource
  invalidates the pending slot and re-disables the button.
- Ops demo: status filter narrows 8 rows → 2 with only `deferred` badges; counters settle.
- Keyboard: 87 focus stops in 90 tabs, **every visible stop has a visible focus ring**,
  and both demos plus the contact form are in the tab order.
- AMG link: correct URL, `target="_blank"`, `rel="noopener noreferrer"`.
- Contact form: no `action`, no navigation, values persist, status reads "Handed off to
  your email app" — no fake success message.
- Nav condenses on scroll; mobile disclosure opens, reports `aria-expanded`, closes on
  Escape and returns focus; no custom cursor on touch.

**Checked by eye** at 1440×900 and 390×844 across all ten sections.

**Also checked:** the AMG home page still serves its cookie-consent banner after the
root-layout change, so route-gating the consent UI off `/studio` did not regress it.

**Not verified:** deployment to Vercel (no deploy was run from this session, so the
preview URL is unconfirmed and the Lighthouse numbers above are from a local production
build on a shared-CPU container), the `amgaviationgroup.com` link was taken as a
verified 200 from the brief rather than re-fetched here, and rendering on real
iOS/Android hardware.

## Open decisions for Tony

1. **Tagline** — pick one of the three in `BRAND.taglines`. Currently **"Down and
   locked."** (`TAGLINE_INDEX = 0`). Note the second option is quoted verbatim from the
   brief as "**Three** green. Cleared to build." which conflicts with the
   numerals-not-words convention; if you pick it, decide whether to respell it.
2. **Real email address**, and whether to wire a form backend at all.
3. **Domain** — `3greenstudios.com` is unconfirmed at the registrar and not
   trademark-screened. Does not block anything; `BRAND.domain` is one line.
4. **Any true AMG metrics** you will stand behind. Until then the case study stays
   non-numeric by design.
5. **A second case study** — only if a second real client exists.
