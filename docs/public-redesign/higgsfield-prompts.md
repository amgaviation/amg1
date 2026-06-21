# AMG Public Redesign Visual Asset Notes

Date: 2026-06-21

## Generation Status For This Branch

No new Higgsfield generation was performed during this branch because this Codex environment does not expose a Higgsfield connector or install candidate. The repository already contains approved cockpit, sky, sky-motion, aircraft, crew-map, and portal-preview assets with manifests under:

- `docs/creative/higgsfield-asset-manifest.json`
- `public/images/home-intro/*`
- `public/videos/home-intro/*`
- `public/images/amg-generated/*`
- `public/images/amg-custom/*`

This branch reuses those approved repository assets instead of introducing unreviewed stock imagery or fake generated visuals.

## Existing Prompt Sources

The selected cockpit and sky assets are documented in `docs/creative/higgsfield-asset-manifest.json`. That manifest records model, job IDs, result URLs, prompt summaries, production files, dimensions, file sizes, selected outputs, rejected outputs, and rejection reasons.

## Reused Asset Roles

| Asset role | Files | Page placement | QA note |
|---|---|---|---|
| Desktop cockpit master | `public/images/home-intro/amg-cockpit-desktop.avif`, `.webp` | Homepage cockpit entrance | Existing QA log confirms centered aperture and no generated logo/text |
| Mobile cockpit master | `public/images/home-intro/amg-cockpit-mobile.avif`, `.webp` | Homepage cockpit entrance | Existing QA log confirms portrait composition |
| Desktop sky | `public/images/home-intro/amg-sky-desktop.avif`, `.webp` | Cockpit back layer, final CTA, continuous public atmosphere | Existing QA log confirms cool blue cloud deck and clean center |
| Mobile sky | `public/images/home-intro/amg-sky-mobile.avif`, `.webp` | Mobile cockpit back layer | Existing QA log confirms stable mobile sky crop |
| Sky motion | `public/videos/home-intro/amg-sky-motion-desktop.mp4`, `public/videos/home-intro/amg-sky-motion-mobile.mp4` | Optional cockpit sky motion | Disabled under reduced motion |
| Crew map | `public/images/amg-generated/backgrounds/crew-network-map-bg.jpg` | Crew network homepage and detail sections | Public region representation only |
| Portal screenshot | `public/images/portal-screenshots/*-enhanced.webp` | AMG Connect public preview | Existing sanitized portal screenshots, not fake generated dashboard records |
