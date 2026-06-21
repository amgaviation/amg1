# AMG Cockpit Entrance QA Log

Date: 2026-06-21

## Baseline Findings

- Repository confirmed as `amgaviation/amg1`.
- `npm install` was already up to date before implementation; npm reported two pre-existing moderate audit findings.
- Baseline `npm run lint` failed because `app/(public)/page.tsx` rendered `WhoWeServe` without importing it.
- Baseline `npm run build` compiled but failed during prerender for the same `WhoWeServe is not defined` homepage error.

## Implementation Checks

- Removed the old blocking `EntranceAnimation` from the public homepage render path.
- Added `CockpitEntrance` as a native sticky-scroll section with no body scroll lock, no wheel interception, no session storage gate, and a real skip control.
- Preserved existing downstream homepage sections and fixed the missing `WhoWeServe` import.
- Used the repository official logo asset at `/images/logo-white.png`; no generated logo was used.
- Added reduced-motion handling that disables the video layer and presents a static composition.
- Added `data-analytics` hooks for:
  - `home_intro_primary_cta_clicked`
  - `home_intro_scroll_cue_clicked`

## Command Results

- `npm run lint`: passed after implementation.
- `npm run build`: passed after implementation. Static prerender completed for `/` and the rest of the app route tree.

## Browser Verification

- Tooling: Playwright from the installed `playwright-skill` runtime.
- URL: `http://localhost:3000`
- Viewports:
  - `desktop-1440x900`
  - `desktop-1920x1080`
  - `mobile-390x844`
  - `mobile-360x740`
  - `reduced-mobile-390x844`
- Results:
  - No console errors.
  - One logical H1 found: `Private aircraft support, coordinated.`
  - Primary CTA found with `/request-support` href.
  - Scroll cue found.
  - Scroll progress advanced through cockpit-to-sky states.
  - Skip control landed near `#home-after-intro` and focused it.
  - Reduced-motion viewport hid the video layer.
  - Mobile header CTA remained hidden after the nav utility fix.

## Screenshot Artifacts

Saved in `/tmp/amg-cockpit-qa`:

- `desktop-1440x900-top.png`
- `desktop-1440x900-mid.png`
- `desktop-1440x900-end.png`
- `desktop-1920x1080-top.png`
- `desktop-1920x1080-mid.png`
- `desktop-1920x1080-end.png`
- `mobile-390x844-top.png`
- `mobile-390x844-mid.png`
- `mobile-390x844-end.png`
- `mobile-360x740-top.png`
- `mobile-360x740-mid.png`
- `mobile-360x740-end.png`
- `reduced-mobile-390x844-top.png`
