# AMG Higgsfield Media Generation Plan

This plan prepares AMG public-site media for a later Higgsfield / Kling / Vibe Motion generation session. Do not copy Jesko Jets imagery, structure, or proprietary motion. All generated assets must preserve accurate aircraft geometry, avoid visible competitor branding, and stay within AMG's navy, blue, gray, white, and sparing sky-blue palette.

## Priority 1 - Home Hero

### AMG-HOME-HERO-VIDEO-001

- Type: video loop
- Page: Home
- Section: Hero
- Aspect ratio: 16:9
- Desktop target: 3840x2160
- Mobile target: 1440x1920
- Prompt: Cinematic private aviation operations scene at dusk, a modern business jet staged on a clean ramp with subtle AMG-blue operational reflections, premium editorial framing, realistic aircraft proportions, quiet Part 91 support tone, soft blue-hour light, refined navy and mineral-gray environment, ultra-clean professional aviation brand film, seamless 4-second loop.
- Negative prompt: No airline logos, no competitor branding, no gold, no red emergency styling, no distorted engines, no impossible aircraft geometry, no fake airline livery, no unsafe cockpit behavior, no copied Jesko imagery.
- Camera: Slow stabilized push-in from three-quarter front angle.
- Lens feel: Premium commercial aviation, 35-50mm equivalent, low distortion.
- Lighting: Dusk blue hour with soft hangar spill and controlled fuselage highlights.
- Fallback: `/images/hero-jet.png`
- Alt text: Private aircraft staged for operational support at dusk.

## Priority 2 - Home Capability Media

### AMG-HOME-CAPABILITY-FERRY-IMAGE-001

- Type: image
- Page: Home
- Section: Core Capabilities
- Aspect ratio: 4:3
- Desktop target: 1800x1350
- Mobile target: 1200x1500
- Prompt: Editorial private aviation maintenance repositioning support scene, jet near a clean maintenance hangar, flight planning tablet and ramp environment, realistic aircraft geometry, no visible private data, premium AMG Aviation Group operational support style.
- Negative prompt: No unsafe maintenance posture, no airline branding, no orange/gold/red palette, no copied competitor imagery, no warped aircraft.
- Fallback: `/images/operations.png`

### AMG-HOME-OPS-COORDINATION-VIDEO-001

- Type: video loop
- Page: Home
- Section: Operational Approach
- Aspect ratio: 21:9
- Desktop target: 2560x1080
- Mobile target: 1400x1800
- Prompt: High-end aviation operations coordination desk, route lines, aircraft documents, discreet message cues, glass display reflections, AMG navy and blue color system, professional Part 91 support context, seamless 3-second loop.
- Negative prompt: No fake emergency status, no red alerts, no illegible cockpit UI, no generic SaaS dashboard, no cyberpunk neon.
- Camera: Slow lateral macro move.
- Fallback: `/images/jet-sky.png`

## Priority 3 - Core Public Pages

### AMG-ABOUT-HERO-IMAGE-001

- Type: image
- Page: About
- Section: Hero
- Aspect ratio: 16:9
- Desktop target: 2400x1350
- Mobile target: 1200x1500
- Prompt: Quiet aviation operations team reviewing mission details near a premium hangar lounge, no visible personal information, AMG navy and blue accents, professional and understated.
- Negative prompt: No party scene, no exaggerated luxury, no copied competitor composition, no readable private documents.
- Fallback: `/images/jet-interior.png`

### AMG-AIRCRAFT-LIGHT-JET-IMAGE-001

- Type: image
- Page: Aircraft
- Section: Aircraft Support Range
- Aspect ratio: 4:3
- Desktop target: 1800x1350
- Mobile target: 1200x1500
- Prompt: Accurate light jet on clean ramp, crisp profile, neutral livery with no marks, aircraft support category image, inspection-ready clarity, realistic landing gear, windows, wings, and engines.
- Negative prompt: No incorrect tail numbers, no warped wings, no impossible engines, no logo plagiarism, no gold/red styling.
- Fallback: `/images/light-jet.png`

### AMG-PILOT-NETWORK-HERO-VIDEO-001

- Type: video loop
- Page: Pilot Network
- Section: Hero
- Aspect ratio: 16:9
- Desktop target: 2560x1440
- Mobile target: 1440x1920
- Prompt: Pilot readiness materials on a briefing table, headset, tablet, aircraft ramp visible through window, no faces, no unsafe cockpit behavior, professional credential review atmosphere, AMG navy and blue palette, seamless 3-second loop.
- Negative prompt: No hands flying, no distorted instruments, no airline branding, no fake emergency, no copied imagery.
- Fallback: `/images/operations.png`

### AMG-CONTACT-OPERATIONS-IMAGE-001

- Type: image
- Page: Contact
- Section: Operations Request
- Aspect ratio: 3:2
- Desktop target: 1800x1200
- Mobile target: 1200x1500
- Prompt: Minimal aircraft operations request desk with phone, route notes, and ramp view, precise Part 91 support tone, clean editorial composition, white/light-gray/navy palette with AMG blue accents.
- Negative prompt: No cluttered call center, no fake emergency, no red/gold accents, no visible private information.
- Fallback: `/images/jet-sky.png`

## Replacement Rules

- Update `sourcePath` in `lib/media/manifest.ts` after a generated asset is approved.
- Keep `fallbackAsset` populated for reduced-motion, slow-network, and failed-video states.
- Preserve the registered aspect ratio unless the component layout is intentionally redesigned.
- Store approved source files under `public/media/generated/` or another documented public media folder.
- Do not hardcode generated media directly inside page files.
