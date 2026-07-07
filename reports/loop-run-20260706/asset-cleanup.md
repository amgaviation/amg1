# Asset cleanup — public/ deletion pass

Date: 2026-07-06 | Branch: `claude/new-session-mt12tj` | Scope: deletion-only inside `public/`

## Method

- Inventoried all 149 files under `public/` (187 MB).
- For every file, searched its basename (fixed-string) across `app/`, `components/`, `lib/`, `cms/`, `content/`, `scripts/`, `supabase/`, `tests/`, `docs/` (incl. `MEDIA_MANIFEST.csv` and media registers), root `*.md`/`*.json`/`*.ts`/`*.mjs` config files, and text files inside `public/` itself — excluding `reports/`, `node_modules/`, `.next/`.
- Checked for template-string path construction: the only constructed public paths are `lib/site-media.ts` (`${FD}/<literal>.webp` → `/images/flightdeck/*`, `/videos/flightdeck/*`, literal filenames caught by basename grep) and `scripts/verify-website-editor.mjs` (`public/images/portal-screenshots/${asset}` → entire `portal-screenshots/` directory treated as referenced and fully kept).
- No `site.webmanifest` or `browserconfig.xml` exists; favicons kept unconditionally.
- Production DB website-editor content contains no `/images|/videos|/media` references (verified upstream by orchestrator), so repo grep is the complete reference universe.
- `public/images/amg-custom/*` byte-compared (`cmp`) against same-named siblings elsewhere in `public/`; deleted as duplicates only when byte-identical AND the `amg-custom/` path itself is unreferenced (the only greppable `amg-custom` hits are a Stripe idempotency key prefix `amg-custom-sub-` in `lib/portal/stripe-custom-subscriptions.ts` and a stale prose directory mention in `docs/amg-global-interface-v1.md`; `public/images/amg-generated/manifests/higgsfield-assets.json` references only `amg-generated` paths — its basename hits on `amg-custom` files were substring artifacts, e.g. `lj.jpg` inside `...-vlj.jpg`).
- `public/images/amg-generated/*` media are referenced only by `public/images/amg-generated/manifests/higgsfield-assets.json`, a provenance manifest that no code loads (zero references to `higgsfield-assets`, `manifests`, or `amg-generated` in any code path). The live site resolves all imagery through `lib/site-media.ts` (flightdeck set), `lib/media/manifest.ts`, `lib/website-editor/content.ts`, `lib/portal/intro.ts`, and `components/flightdeck/*`. Files with any per-file docs reference were kept.

## Deleted files (66)

| Path | Size (bytes) | Reason |
|---|---:|---|
| `public/video/amg-connect-login-intro-source.mp4` | 13,005,694 | unreferenced |
| `public/images/hero-aircraft-operations.jpg` | 6,391,582 | unreferenced |
| `public/images/amg-custom/hero-aircraft-operations.jpg` | 6,391,582 | duplicate-of `public/images/hero-aircraft-operations.jpg` |
| `public/images/crew-credentials.jpg` | 6,069,612 | unreferenced |
| `public/images/amg-custom/crew-credentials.jpg` | 6,069,612 | duplicate-of `public/images/crew-credentials.jpg` |
| `public/images/pilot-network.jpg` | 5,284,446 | unreferenced |
| `public/images/amg-custom/pilot-network.jpg` | 5,284,446 | duplicate-of `public/images/pilot-network.jpg` |
| `public/videos/amg-generated/amg-hero-hangar-dusk-loop.mp4` | 4,967,180 | unreferenced |
| `public/images/aircraft-support-main.jpg` | 4,645,267 | unreferenced |
| `public/images/amg-custom/aircraft-support-main.jpg` | 4,645,267 | duplicate-of `public/images/aircraft-support-main.jpg` |
| `public/images/amg-custom/contact-support.jpg` | 4,645,267 | unreferenced |
| `public/images/cockpit-detail.jpg` | 3,610,588 | unreferenced |
| `public/images/amg-custom/cockpit-detail.jpg` | 3,610,588 | duplicate-of `public/images/cockpit-detail.jpg` |
| `public/images/amg-custom/aircraft-single-engine-piston.jpg` | 3,154,167 | unreferenced |
| `public/images/amg-custom/aircraft-turboprop.jpg` | 2,984,460 | unreferenced |
| `public/images/amg-custom/aircraft-multi-engine-piston.jpg` | 2,957,289 | unreferenced |
| `public/images/lj.jpg` | 2,781,709 | unreferenced |
| `public/images/amg-custom/lj.jpg` | 2,781,709 | duplicate-of `public/images/lj.jpg` |
| `public/images/amg-custom/aircraft-light-jet.jpg` | 2,781,709 | unreferenced |
| `public/images/home-hangar-dusk.jpg` | 2,594,484 | unreferenced |
| `public/images/amg-custom/home-hangar-dusk.jpg` | 2,594,484 | duplicate-of `public/images/home-hangar-dusk.jpg` |
| `public/images/amg-custom/service-contract-pilot-support.jpg` | 2,592,561 | unreferenced |
| `public/images/amg-custom/aircraft-super-midsize-jet.jpg` | 2,492,469 | unreferenced |
| `public/images/amg-custom/service-aircraft-management-support.jpg` | 2,260,779 | unreferenced |
| `public/images/aircraft-mid-heavy-jet.jpg` | 2,209,826 | unreferenced |
| `public/images/amg-custom/aircraft-mid-heavy-jet.jpg` | 2,209,826 | duplicate-of `public/images/aircraft-mid-heavy-jet.jpg` |
| `public/images/amg-custom/aircraft-midsize-jet.jpg` | 2,209,826 | unreferenced |
| `public/images/amg-custom/home-hero-amg-hangar-night-ramp.png` | 2,119,778 | unreferenced |
| `public/images/amg-custom/service-fleet-support-program.jpg` | 2,026,824 | unreferenced |
| `public/images/amg-custom/aircraft-large-cabin-heavy-jet.jpg` | 2,009,042 | unreferenced |
| `public/images/amg-custom/service-flight-operations-coordination.jpg` | 1,575,965 | unreferenced |
| `public/images/subscription-programs.jpg` | 1,533,882 | unreferenced |
| `public/images/amg-custom/subscription-programs.jpg` | 1,533,882 | duplicate-of `public/images/subscription-programs.jpg` |
| `public/images/amg-custom/pilot-preflight.jpg` | 1,429,483 | unreferenced |
| `public/images/runway.jpg` | 1,285,984 | unreferenced |
| `public/images/amg-custom/runway.jpg` | 1,285,984 | duplicate-of `public/images/runway.jpg` |
| `public/images/amg-custom/global-cta-runway.jpg` | 1,285,984 | unreferenced |
| `public/images/amg-custom/plans-aircraft-class-selector.jpg` | 1,029,248 | unreferenced |
| `public/images/amg-custom/plans-crew-logistics.jpg` | 1,019,896 | unreferenced |
| `public/images/map-network.jpg` | 882,780 | unreferenced |
| `public/images/amg-custom/map-network.jpg` | 882,780 | duplicate-of `public/images/map-network.jpg` |
| `public/images/amg-custom/about-amg-operations.jpg` | 790,593 | unreferenced |
| `public/images/amg-generated/aircraft-supported/heavy-gulfstream-g650.jpg` | 787,817 | unreferenced |
| `public/images/amg-generated/aircraft/aircraft-midsize-jet.jpg` | 746,416 | unreferenced |
| `public/images/amg-generated/aircraft-supported/turboprop-pilatus-pc12.jpg` | 729,042 | unreferenced |
| `public/images/amg-generated/aircraft-supported/piston-cirrus-sr22.jpg` | 725,759 | unreferenced |
| `public/images/amg-generated/aircraft/aircraft-super-midsize-heavy.jpg` | 684,071 | unreferenced |
| `public/images/amg-custom/service-maintenance-flight-support.jpg` | 658,914 | unreferenced |
| `public/images/amg-generated/aircraft-supported/super-midsize-challenger-650.jpg` | 651,132 | unreferenced |
| `public/images/amg-generated/aircraft/aircraft-light-jet.jpg` | 636,858 | unreferenced |
| `public/images/amg-generated/backgrounds/operational-clarity-dispatch.jpg` | 590,818 | unreferenced |
| `public/images/amg-generated/aircraft-supported/midsize-jet-citation-latitude.jpg` | 590,711 | unreferenced |
| `public/images/amg-generated/aircraft-supported/light-jet-phenom-100.jpg` | 589,201 | unreferenced |
| `public/images/amg-generated/posters/amg-hero-hangar-dusk-poster.jpg` | 585,484 | unreferenced |
| `public/images/amg-custom/services-hero.jpg` | 571,931 | unreferenced |
| `public/images/amg-generated/aircraft-supported/single-engine-jet-cirrus-sf50.jpg` | 567,139 | unreferenced |
| `public/images/amg-generated/backgrounds/hangar-door-closed-realistic.jpg` | 565,127 | unreferenced |
| `public/images/amg-generated/aircraft/aircraft-piston-turboprop.jpg` | 535,220 | unreferenced |
| `public/images/amg-generated/backgrounds/crew-network-map-bg.jpg` | 498,702 | unreferenced |
| `public/images/amg-generated/aircraft/aircraft-single-engine-jet-vlj.jpg` | 442,544 | unreferenced |
| `public/images/amg-custom/aircraft-helicopter.jpg` | 358,799 | unreferenced |
| `public/images/aircraft-light-jet-vlj.jpeg` | 83,727 | unreferenced |
| `public/images/amg-custom/aircraft-light-jet-vlj.jpeg` | 83,727 | duplicate-of `public/images/aircraft-light-jet-vlj.jpeg` |
| `public/images/amg-custom/aircraft-single-engine-jet-vlj.jpg` | 83,727 | unreferenced |
| `public/images/site/citation-x.webp` | 22,370 | unreferenced |
| `public/images/amg-crew-marker.svg` | 428 | unreferenced |

**Total freed: 143,708,198 bytes (137.1 MiB). `public/` went from ~187 MB to ~50 MB.**

Empty directories removed after file deletion: `public/images/amg-custom/`, `public/images/amg-generated/{aircraft,aircraft-supported,backgrounds,posters}/`, `public/videos/amg-generated/`.

Note on duplicate reasons: the 12 `amg-custom` duplicates were byte-identical to same-named siblings that were themselves unreferenced and also deleted in this pass; each was independently deletable under both rules.

## Kept despite suspicion

| Path | Size (bytes) | Why kept |
|---|---:|---|
| `public/images/site/tbm.jpg` | 8,222,670 | Earlier audit flagged it unreferenced — FALSE. Referenced as `fallbackAsset` in `lib/media/manifest.ts:160`, which is live code (imported by `components/site/media/media-placeholder.tsx`; also read by `app/portal/admin/system-health/page.tsx`). |
| `public/videos/flightdeck/porthole-sky.mp4` | 6,083,964 | Referenced by `components/flightdeck/hero.tsx`. |
| `public/videos/amg-jet-flying.mp4` | 3,259,402 | No code reference, but listed in `docs/MEDIA_MANIFEST.csv` and `docs/PUBLIC_SITE_TEST_REPORT.md`; docs are part of the mandated reference universe. |
| `public/animations/entrance/amg-hangar-entrance-source.mp4` | 3,626,093 | No code reference; referenced by name in `docs/amg-global-interface-v1.md` (with the .mp4/.webm/poster siblings, ~4.6 MB total kept). |
| `public/videos/home-intro/amg-sky-motion-desktop.mp4` | 1,369,481 | No code reference (lib/site-media.ts now maps home-intro keys to flightdeck assets); referenced in `docs/creative/higgsfield-asset-manifest.json`. Same for `amg-sky-motion-mobile.mp4` and the 8 `public/images/home-intro/*` webp/avif files. |
| `public/images/turboprop.png` | 1,227,723 | Docs-only reference (`docs/MEDIA_MANIFEST.csv`). Same for `public/images/mid-jet.png` (1,146,848). |
| `public/images/heavy-jet.png` | 1,096,071 | Referenced in root `LIGHT_PREMIUM_REDESIGN_PROGRESS.md` and `docs/MEDIA_MANIFEST.csv` only. Same class: `public/images/site/cirrus.webp`. |
| `public/images/portal-screenshots/*-real.png (11 files)` | 984,405 | Referenced in `docs/portal-screenshot-implementation-note.md`; directory also constructed as `portal-screenshots/${asset}` in `scripts/verify-website-editor.mjs` — whole directory treated as referenced. |
| `public/images/amg-generated/portal/amg-connect-dashboard-bg.jpg` | 501,041 | Only `amg-generated` media file with a per-file docs reference (`docs/portal-screenshot-implementation-note.md`: 'remains only as a subtle texture fallback'). |
| `public/images/amg-generated/manifests/higgsfield-assets.json` | 27,490 | Unreferenced by code, but it is the AI-media provenance register pointed to generically by `docs/ai-media-register.md` / `docs/MEDIA_ATTRIBUTION.md`; 27 KB, no deploy impact. Now partially describes deleted assets. |
| `public/videos/README.md` | 324 | Documents expected future motion exports for `/motion-assets`. |
| `public/favicon.ico + public/favicon.png` | 11,930 | No grep hits (served by URL convention) — favicons are never-delete per policy. |

## Judgment calls

- Stale prose mentions of the directories `public/images/amg-custom` / `public/images/amg-generated` in `docs/amg-global-interface-v1.md`, `docs/asset-register.md`, `docs/ai-media-register.md` were not treated as file references (they are architecture/register descriptions, not consumers, and the site-media claim in that doc is demonstrably stale — `lib/site-media.ts` uses only flightdeck assets). Per-file basename hits in docs WERE honored as keeps.
- `public/video/amg-connect-login-intro-source.mp4` (12.4 MiB) deleted: zero references anywhere. Its derived siblings `amg-connect-login-intro.mp4/.webm/-poster.jpg` are referenced by `lib/portal/intro.ts` and kept.

