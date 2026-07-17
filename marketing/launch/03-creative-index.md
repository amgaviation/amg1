# AMG Launch — Creative Index

17 finished, print-ready creatives in `images/`. Each is rendered at **2× (retina)** in the
AMG brand system (midnight navy `#050B14`/`#07111F`, champagne-gold `#D4AF37`, Space Grotesk
display + Inter body) with the logo and all copy composited in. Aviation photography behind
them is AI-generated and stored raw in `src-photos/`.

## Feed (Instagram 4:5 / LinkedIn — 1080×1350 → 2160×2700)

| File | Use | Type |
|------|-----|------|
| `10-launch-cover.png` | Launch carousel slide 1 | Photo hero |
| `11-launch-what.png` | Carousel slide 2 — the four capabilities | Info list |
| `12-pricing.png` | Carousel slide 3 **and** Jul 29 single | Ledger / data |
| `13-how.png` | Carousel slide 4 — how a request moves | 3-step |
| `14-launch-cta.png` | Carousel slide 5 — CTA | Photo + pill |
| `01-tease.png` | Jul 24 teaser | Photo tease |
| `20-crew.png` | Jul 31 crew network | Photo + bullets |
| `21-ferry.png` | Aug 2 ferry feature | Photo |
| `22-connect.png` | Aug 4 AMG Connect | Info list |
| `23-maintenance.png` | Aug 5 maintenance | Photo + bullets |
| `24-partners.png` | Aug 7 partners & shops | Photo + lead |
| `25-owner.png` | Aug 9 owner-controlled | Photo + lead |
| `26-closing.png` | Aug 11 closing recap | Info bullets |

## Vertical (Stories / Reels 9:16 — 1080×1920 → 2160×3840)

| File | Use |
|------|-----|
| `30-tease-story.png` | Jul 27 launch-eve countdown story |
| `31-reel-cover.png` | Launch-day Reel cover / end card |

## Landscape (1200×627 & 1200×600 → 2×)

| File | Use |
|------|-----|
| `40-li-hero.png` | LinkedIn flagship launch post image |
| `41-email-banner.png` | Launch-day email header banner |

## Regenerating / editing

All creatives are generated from data + HTML/CSS and rendered with headless Chromium —
no design tool required. To change copy, colors, or layout:

```bash
cd marketing/launch/generator
# edit gen.mjs (copy/data) or kit.css (design system)
node gen.mjs        # writes generator/html/*.html + sizes.txt
bash render.sh      # renders images/*.png at 2x
node hub.mjs        # rebuilds campaign-hub.html (the shareable board)
```

- `generator/gen.mjs` — every creative's copy and layout (the data model).
- `generator/kit.css` — the brand design system (tokens, type, components).
- `generator/fonts.css` — base64-embedded Space Grotesk + Inter (from `app/fonts/`).
- `generator/render.sh` — Chromium screenshot loop (uses `/opt/pw-browsers/chromium`).
- `generator/hub.mjs` — builds `campaign-hub.html` from thumbnails + content.
- `src-photos/` — the raw AI aviation photos used as backgrounds.

To swap a background photo, drop a replacement into `src-photos/` (same filename) or point
the card's `photo:` field in `gen.mjs` at a new file, then re-run the two commands above.
