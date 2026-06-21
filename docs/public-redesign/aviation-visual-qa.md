# AMG Public Redesign Aviation Visual QA

Date: 2026-06-21

## QA Scope

This branch reuses repository-approved AMG cockpit, sky, aircraft, crew map, and sanitized portal assets. No new raw generated outputs were added.

## Visual Checks

| Area | Asset(s) | Result |
|---|---|---|
| Official logo | `/images/logo-white.png` | Existing official asset retained; no generated logo |
| Cockpit entrance | `public/images/home-intro/amg-cockpit-*` | Existing asset manifest and QA log indicate centered cockpit aperture, no logo/text in generated image, and responsive desktop/mobile variants |
| Sky transition | `public/images/home-intro/amg-sky-*`, `public/videos/home-intro/*` | Stable blue cloud deck reused; video disabled for reduced motion |
| Continuous aviation background | CSS atmospheric layer using `amg-sky-desktop.webp` plus coded grid/airflow | New layer is decorative, no operational data or fake radar metrics |
| Aircraft support cards | `public/images/amg-generated/aircraft-supported/*` | Existing generated aircraft category images reused; copy frames them as representative category visuals, not AMG-owned aircraft |
| Crew coverage map | `crew-network-map-bg.jpg` plus real static marker dataset | Copy states markers are public airport regions, not real-time crew availability |
| AMG Connect preview | Sanitized portal screenshots | Existing real/enhanced portal screenshots reused; no fake records added |

## Reduced Motion

- Cockpit entrance already detects `prefers-reduced-motion`.
- CSS global reduced-motion rule disables public continuous atmosphere animation.
- Dynamic globe sections expose `GlobeFallback` for reduced motion or lazy-load fallback.

## Known Visual Limitations

- No new Higgsfield outputs were produced in this branch because the required connector was unavailable.
- Final browser screenshot review is recorded in `artifacts/public-redesign/` after Playwright QA.
