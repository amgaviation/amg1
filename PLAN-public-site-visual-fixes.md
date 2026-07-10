# Plan: Public site visual fixes

Scope: public marketing site only (`app/(public)`, `components/flightdeck`, `components/site`). Do NOT touch portal styling (`.amg-portal` blocks, `--deck-*` tokens, `components/portal/ui/*`) or `DECK_NAV`. Findings come from a live visual review of www.amgaviationgroup.com on 2026-07-06 at 1440px.

Rules for every phase:
- Branch per phase, PR into `main`. Verify on Vercel preview (local `npm run build` is unreliable).
- Run `npm run typecheck` once per phase (never two tsc instances).
- Preserve public copy verbatim unless the phase says otherwise. Check `docs/amg-aviation-group-reference.md` before any copy change.
- Don't commit iCloud `* 2.ext` conflict copies; audit `git status` before staging.

---

## Phase 1 — Remove the grid background (site-wide)

The owner explicitly wants the grid gone everywhere on the public site.

- `app/globals.css` lines ~713–724 and ~1535–1545: delete/neutralize the linear-gradient grid backgrounds. There are two blocks; find any other `linear-gradient` grid patterns applied to public-site sections (search for repeating-line gradients and `background-size` pairs in the 20–80px range).
- Replace with a flat/subtle treatment: keep the existing dark navy base; at most a very soft radial vignette per section. No lines, no corner-bracket tick marks if they're part of the same treatment (the dotted markers/brackets in the hero are in `components/flightdeck/hero.tsx` — remove the decorative ticks there too).
- Confirm the grid is gone from: home hero, all home sections, Global/footer section, and subpage heroes. The portal must be visually unchanged — grep to confirm the deleted rules aren't consumed inside `.amg-portal`.

## Phase 2 — Rework the home hero

File: `components/flightdeck/hero.tsx` (GSAP scrub timeline + blur reveal via `onReveal()`; boot sequence in `components/flightdeck/preloader.tsx`, `reveal.ts`).

1. Kill the slow blur-in: hero text currently renders blurred for ~3s on every visit. Either remove the blur step entirely or cap the reveal at ≤600ms and run it only on first visit per session (sessionStorage flag). It must never look broken on repeat navigation.
2. Unify the headline: "Quoted in" (far left) and "24 hours" (far right) read as two orphaned fragments around the porthole. Bring the full phrase together as one readable lockup (e.g., left-aligned block: "Quoted in 24 hours." above the supporting line), keeping the exact words.
3. Seat or replace the porthole: it currently floats with no frame, empty sky inside, and blurred nothing around it. Pick one:
   - a) Give it context: visible cabin-wall surface/shadow so it reads as part of a fuselage, with the sky video/image clearly visible inside; or
   - b) Replace it with a full-bleed hero image/video (clouds/horizon already in assets) with the headline overlaid.
   Option (b) is simpler and likely stronger; decide in the PR.
4. Keep the "SERVING SOUTHEAST US // FOUNDED BY ANTONIO GONZALEZ" strip but raise its contrast (it's near-illegible dark grey on near-black).

## Phase 3 — Fix stuck scroll-fade reveals (site-wide mechanism)

Mechanism: GSAP ScrollTrigger with `scrub: true` at ~70–74% viewport across `services`, `doors`, `proof`, `connect`, `ops` sections in `components/flightdeck/*`.

- Problem: scrubbed opacity means content parks at ~40% opacity when the user stops scrolling (seen on "Insurance-required second pilots" card, "Fly, tracked" accordion row, "JOIN THE NETWORK" link, and the closing sentence of the intro paragraph).
- Fix: convert reveal animations from `scrub: true` to trigger-once tweens (`toggleActions: "play none none none"`, duration ~0.5–0.7s). Text must always land at 100% opacity. Reserve scrub for genuinely positional effects (pin transforms), never for opacity of body copy.
- The intro paragraph's per-sentence grey fade ("You keep operational control. We keep the clock.") must end fully readable — if the word-by-word highlight stays, ensure final state is full contrast even without further scroll.

## Phase 4 — Rebalance the "Every Mission" pinned section

File: `components/flightdeck/mission-deck.tsx` (195vh scrub timeline, blueprint crossfade, specs table).

- At 1440px the section shows two giant edge-pinned words, a vast empty center, a tiny low-contrast mission-profile card bottom-right, and an unanchored stats list bottom-left. It reads as unpopulated.
- Restructure: bring headline words into one composition; make the blueprint drawing the visual anchor (it already exists in the timeline) with the specs table beside it; raise the mission-profile card's type size/contrast or fold its content into the specs column.
- Shorten the pin distance (195vh is a long dead scroll for the payoff). Target ≤120vh.

## Phase 5 — Make the AMG Connect preview look real

File: `components/flightdeck/connect.tsx` (static mockup, line ~118 caption "Illustrative preview — not live data").

- The panel is mostly an empty dark rectangle. Populate the mockup with a plausible ops view: 3–4 request rows with statuses (content already hinted: "REQ-2841 · Crew coverage · IN REVIEW"), a message-thread snippet, and a reminder chip. Keep the "Illustrative preview" caption but raise its contrast.
- Keep it static HTML/CSS — no live data.

## Phase 6 — Clean up the Global section + footer

File: `components/flightdeck/global-footer.tsx` (225vh pinned section).

- City ticker ("Support anywhere → Teterboro") collides with the outlined "Global" letterforms — move the ticker clear of the strokes or add a backing scrim.
- The rotated "100% reviewed" receipt card covers the globe and reads as pasted-on noise; shrink it, dock it to a corner, or cut it.
- Footer contact links overlap the globe graphic — add spacing/scrim so links sit on clear ground.
- Shorten the 225vh pin; same rationale as Phase 4.
- Raise contrast on all small caps microcopy in this section.

## Phase 7 — Team page founder card

Files: `app/(public)/team/...` + `lib/site-config.ts` line ~116 (`photo: null`).

- The card renders text in the left third with an empty right two-thirds (conditional image slot skipped). Either add Antonio's photo (preferred — drop asset in `public/`, set `photo` path) or change the card layout to full-width text with a supporting stat/credential column when `photo` is null. The empty state must not ship either way.

## Phase 8 — Pricing page polish

File: `app/(public)/pricing/page.tsx` (~lines 145–160 for the table header).

- Fix "On-Demand" header wrap (`whitespace-nowrap` or wider column).
- Compress the large dead vertical gaps between the table, "What each plan is actually for" cards, day-rate ranges, worked example, and FAQ (section padding, not content).
- The worked-example card duplicates the home page card nearly verbatim — acceptable, but vary the framing line so it doesn't read copy-pasted. (Copy change: check reference doc first.)

## Phase 9 — Floating CTA pill + 404

- `components/flightdeck/request-pill.tsx`: the persistent bottom-center pill duplicates the header CTA and overlaps content (FAQ text, globe, section copy). Either remove it, or show it only after the hero scrolls out AND hide it when the footer/any section CTA is in view; add a solid backdrop so it never sits transparent over text.
- Add `app/(public)/not-found.tsx` (or root `app/not-found.tsx` if none exists): branded 404 with nav, short line, links to Home / Pricing / Request a Quote. Currently falls back to the unstyled Next.js default.

## Phase 10 — Verification pass

- Re-run the visual sweep at 1440px and ~390px: home (full scroll, stopping mid-section to confirm no parked half-faded text), pricing, how-it-works, team, pilots, for-shops, request, and a bogus URL for the 404.
- Screenshot before/after per phase in the PR description.
- Run `npm run compliance:check` and the `*:verify` guard scripts; compare failures against a main baseline before chasing them (admin-access `auth.signUp` and `website-editor:verify` are known-failing on main).
- Confirm portal pages are visually untouched (spot-check /portal login shell).

## Suggested order & sizing

1. Phase 1 (grid) — small, high-impact, do first.
2. Phase 3 (fade fix) — small/medium, fixes sitewide readability.
3. Phase 2 (hero) — medium/large, biggest design decision.
4. Phases 7, 9 (team card, pill+404) — small.
5. Phases 5, 8 (connect mockup, pricing) — small/medium.
6. Phases 4, 6 (pinned sections) — medium, most animation surgery.
7. Phase 10 — always last per merge.
