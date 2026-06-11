# AMG Aviation Higgsfield Motion Asset Prompts

These prompts are prepared for Higgsfield using Kling 3.0 and Vibe Motion. Export all assets as high-quality MP4 files with smooth looping where noted, muted-safe visual motion, and web delivery variants.

## Export Naming

| Website file | Asset | Runtime behavior |
| --- | --- | --- |
| `/public/videos/amg-hero-stealth-parallax.mp4` | Hero stealth jet background | Scroll-controlled video scrub with fallback parallax scale |
| `/public/videos/amg-turbine-wireframe-loop.mp4` | Propulsion feature card | Paused poster by default, plays on hover, resets on leave |
| `/public/videos/amg-cockpit-telemetry-boot.mp4` | Cockpit telemetry display | Click-activated fade/expand telemetry sequence |

Recommended export settings:

- Resolution: 3840x2160 master, plus 1920x1080 web export.
- Frame rate: 24fps.
- Codec: H.264 MP4 for broad browser support.
- Length: 2-4 seconds for micro-clips, 6-10 seconds for scroll-scrub hero.
- Looping: first and last frames must match for loopable assets.
- Color: deep navy, stealth gray, aviation orange, cockpit blue, runway green.
- Motion: stable, polished, corporate, no handheld shake.

## 1. Hero Background

Higgsfield / Kling 3.0 prompt:

```text
Cinematic wide shot of an advanced military stealth jet flying through volumetric dark clouds at dusk. Camera slowly pulls back to reveal the aircraft's aerodynamic contours. Minimalist, ultra-clean aesthetic, elite aerospace engineering, subtle analytical HUD reflections, stealth aerodynamics, next-generation propulsion atmosphere, photorealistic 8K resolution, 24fps, stable camera movement, premium cinematic corporate motion design, Apple-style precision, seamless loop, last frame smoothly matches first frame.
```

Negative prompt:

```text
No missiles, no explosions, no combat, no shaky camera, no pilot face, no logos, no text artifacts, no distorted wings, no low-resolution clouds, no busy UI overlays.
```

Web behavior:

- Source path: `/videos/amg-hero-stealth-parallax.mp4`
- Poster fallback: `/images/hero-jet.png`
- The page maps vertical scroll position to video playback time when metadata is available.
- If the browser does not allow precise scrubbing, the page falls back to a parallax scale/translation effect.

## 2. Feature Cards Hover Micro-Motion

Higgsfield / Vibe Motion prompt:

```text
A highly detailed, glowing 3D wireframe schematic of a jet turbine propulsion engine. The camera rotates smoothly 45 degrees around the asset. Neon aviation-orange and stealth-gray color palette, subtle blue technical reflections, data telemetry overlays animating softly in the background, clean layout, professional aerospace motion graphics style, premium high-tech corporate design, loopable 4-second micro-motion, stable camera, seamless first-to-last frame.
```

Negative prompt:

```text
No flames, no smoke, no messy wires, no readable brand names, no jitter, no cartoon style, no low-poly geometry, no cluttered labels.
```

Web behavior:

- Source path: `/videos/amg-turbine-wireframe-loop.mp4`
- Poster fallback: `/images/operations.png`
- Video is paused by default.
- On hover/focus, JavaScript calls `.play()`.
- On mouse leave/blur, JavaScript pauses and resets to the first frame.

## 3. Cockpit Multi-Function Display

Higgsfield / Vibe Motion prompt:

```text
An advanced glass cockpit radar display screen booting into active tracking mode. Moving vector lines, scanning sweeps, fluctuating airspeed and altitude numbers animating rapidly on an analytical UI grid. Deep cockpit blue, vibrant runway green, subtle aviation amber warnings, modern HUD aesthetic, precise aerospace telemetry, premium clean interface design, 2-4 second micro-clip, crisp high-resolution graphics, stable frontal camera, cinematic glow, no readable real-world brand labels.
```

Negative prompt:

```text
No error text, no fake brand logos, no cockpit hands, no pilot face, no red emergency state, no noisy interface clutter, no illegible smeared numerals.
```

Web behavior:

- Source path: `/videos/amg-cockpit-telemetry-boot.mp4`
- Poster fallback: `/images/jet-interior.png`
- Display starts in standby.
- Button click expands/fades in the active telemetry panel and plays the video from the beginning.
- Second click returns to standby and pauses the video.

## Implementation Notes

The front-end implementation lives in:

- `app/(public)/motion-assets/page.tsx`
- `components/site/higgsfield-motion-showcase.tsx`

The page uses native HTML5 `<video>` elements with `muted`, `playsInline`, and `loop` where appropriate. JavaScript behavior is implemented in a client component so no GSAP dependency is required.
