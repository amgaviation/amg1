# Real Portal Screenshot Implementation Note

## Audit

- `components/site/home/connect-preview.tsx`: previously rendered a fake AMG Connect browser mockup with fake sidebar labels, request cards, and fake domain text. Replaced with `PortalScreenshotFrame` using `/public/images/portal-screenshots/portal-client-dashboard-enhanced.webp`.
- `app/(public)/amg-connect/page.tsx`: previously used an abstract generated dashboard image in the hero. Rewired to structured content and the real portal screenshot asset reference.
- `components/site/home/portal-ecosystem.tsx`: uses aviation photography and role cards, not a fake portal UI. No screenshot replacement required.
- `components/site/portal-dashboard.tsx`: legacy standalone portal preview shell, not currently used by the public AMG Connect page. Left untouched.
- `public/images/amg-generated/portal/amg-connect-dashboard-bg.jpg`: legacy abstract generated background remains only as a subtle texture fallback and is no longer used as the primary public portal UI preview.

## Screenshot Assets

Assets are stored under `/public/images/portal-screenshots/` with PNG source exports and optimized WebP public assets:

- `portal-client-dashboard-real.png` / `portal-client-dashboard-enhanced.webp`
- `portal-client-requests-real.png` / `portal-client-requests-enhanced.webp`
- `portal-client-aircraft-real.png` / `portal-client-aircraft-enhanced.webp`
- `portal-client-documents-real.png` / `portal-client-documents-enhanced.webp`
- `portal-client-quotes-invoices-real.png` / `portal-client-quotes-invoices-enhanced.webp`
- `portal-crew-dashboard-real.png` / `portal-crew-dashboard-enhanced.webp`
- `portal-admin-dashboard-real.png` / `portal-admin-dashboard-enhanced.webp`
- `portal-admin-requests-real.png` / `portal-admin-requests-enhanced.webp`
- `portal-admin-aircraft-real.png` / `portal-admin-aircraft-enhanced.webp`
- `portal-admin-crew-real.png` / `portal-admin-crew-enhanced.webp`
- `portal-mobile-client-real.png` / `portal-mobile-client-enhanced.webp`

## Capture And Sanitization

The committed screenshots are sanitized marketing-safe captures of the AMG portal visual system: dark AMG sidebar, portal topbar, cards, status badges, tables, and route-specific portal labels. They use demo records only.

No real client names, owner names, crew names, emails, phone numbers, tail numbers, document names, invoice totals, quote line items, payment data, credentials, or operational notes are present.

The actual portal source design, workflows, permissions, and data model were not changed for screenshot capture.

## Crew Region Metrics

The public “Crew coverage by airport region” metric cards now show:

- Crew Count — 70
- Total Crew Flight Hours — 837,028 Hours
- States With Crew Coverage — 48

The old public labels `Airport Markers`, `Crew Records Represented`, and `Locations Needing Review` were removed from the section.
