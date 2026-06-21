# AMG Cockpit Entrance QA Log

Date: 2026-06-21

## Scope

Replaced the previous cockpit intro with a scroll-driven windshield push. The runtime scene now uses one shared transform plane:

- Sky plate behind the windshield.
- Transparent cockpit shell above the sky.
- One `.scene` transform for both visual layers.
- Stable AMG logo, CTA, support copy, skip control, and reduced-motion static fallback.

This avoids separate cockpit and sky transforms, opacity crossfades, and background video drift.

## Asset Notes

- Added `public/images/home-intro/amg-cockpit-shell-desktop.webp`.
- Added `public/images/home-intro/amg-cockpit-shell-mobile.webp`.
- Removed the unused sky motion MP4 files from `public/videos/home-intro`.
- Fresh Higgsfield generation was attempted on 2026-06-21, but the Higgsfield API endpoints were unreachable. Existing Higgsfield stills were reused, and transparent cockpit shell files were derived locally from those selected stills.

## Command Results

- `npm install`: passed; npm reported two pre-existing moderate audit findings.
- `npm run lint`: passed.
- `npm run build`: passed. Next.js prerender completed for the app route tree.

## Browser Verification

Tooling: Playwright from the installed `playwright-skill` runtime.

URL: `http://localhost:3000`

Viewports:

- `desktop-1440x900`
- `tablet-1024x768`
- `mobile-390x844`
- `mobile-360x740`
- `reduced-mobile-390x844`

Results:

- No console or page errors.
- One logical H1 found: `Private aircraft support, coordinated.`
- CTA found with `/request-support` href and verified clickable at top, mid, near-exit, and exit scroll states.
- `#top video` count stayed `0`.
- Mid-scroll `.scene` transformed while `.skyPlate` and `.cockpitShell` had no independent transforms.
- The centered AMG logo stayed horizontally centered during top, mid, and near-exit states.
- The centered AMG logo opacity reached `0` at the transition exit.
- Skip button focused `#home-after-intro` and landed at the global fixed-header scroll offset.
- Reduced-motion viewport used a one-viewport static scene, no videos, static scene transform, centered logo, and clickable CTA.
- Mobile 390px and 360px screenshots verified no clipped headline text and no scroll-cue overlap with the fixed lower-left control.

## Screenshot Artifacts

Saved in `/tmp/amg-seamless-cockpit-qa`:

- `desktop-1440x900-top.png`
- `desktop-1440x900-mid.png`
- `desktop-1440x900-end.png`
- `tablet-1024x768-top.png`
- `tablet-1024x768-mid.png`
- `tablet-1024x768-end.png`
- `mobile-390x844-top.png`
- `mobile-390x844-mid.png`
- `mobile-390x844-end.png`
- `mobile-360x740-top.png`
- `mobile-360x740-mid.png`
- `mobile-360x740-end.png`
- `reduced-mobile-390x844-top.png`
