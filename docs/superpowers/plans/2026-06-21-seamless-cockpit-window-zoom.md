# Seamless Cockpit Window Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current fade-based cockpit intro with a cohesive scroll-driven windshield zoom where the cockpit shell and sky behave as one scene.

**Architecture:** Keep the homepage entry as a client component, but replace crossfade motion with a single shared scene transform. Use a transparent windshield cockpit shell over a matching sky plate, transform both together around a calibrated focal point, and keep logo/CTA/skip controls independent and clickable.

**Tech Stack:** Next.js App Router, React client component, CSS Modules, Sharp asset processing, Higgsfield-generated imagery, Playwright browser verification.

---

### Task 1: Confirm Current Entrance Surface

**Files:**
- Read: `app/(public)/page.tsx`
- Read: `components/site/home/cockpit-entrance.tsx`
- Read: `components/site/home/cockpit-entrance.module.css`
- Read: `lib/site-media.ts`
- Read: `public/images/home-intro/*`

- [x] **Step 1: Inspect current homepage import**

Run:
```bash
sed -n '1,140p' app/\(public\)/page.tsx
```

Expected: homepage renders `CockpitEntrance` and wraps the next section with `#home-after-intro`.

- [x] **Step 2: Inspect current scroll variables**

Run:
```bash
sed -n '1,260p' components/site/home/cockpit-entrance.tsx
sed -n '1,620p' components/site/home/cockpit-entrance.module.css
```

Expected: current code uses separate `--cockpit-opacity`, `--sky-scale`, and `--sky-y`, which creates the two-layer fade problem.

### Task 2: Lock Art And Motion Direction

**Files:**
- Modify: `docs/creative/amg-cockpit-entrance-brief.md`
- Modify: `docs/creative/higgsfield-asset-manifest.json`

- [x] **Step 1: Add storyboard comparison**

Append a section comparing:
```markdown
## Seamless Motion Storyboard

Concept A, "Windshield Push": one cockpit shell, one sky plate, one shared transform origin at the windshield center. The camera pushes forward until the windshield aperture fills the viewport.

Concept B, "Depth Parallax": cockpit shell, sky, avionics, and copy move at slightly different rates. This adds depth, but risks recreating the visible layer drift the task rejects.

Selected: Concept A. It is closer to the Jesko Jets macro behavior without copying assets or code, and it best satisfies the cohesive-scene requirement.
```

Expected: documentation records why a single shared transform wins.

### Task 3: Generate Or Confirm Matching Assets

**Files:**
- Create: `public/images/home-intro/amg-cockpit-shell-desktop.webp`
- Create: `public/images/home-intro/amg-cockpit-shell-mobile.webp`
- Reuse: `public/images/home-intro/amg-sky-desktop.avif`
- Reuse: `public/images/home-intro/amg-sky-desktop.webp`
- Reuse: `public/images/home-intro/amg-sky-mobile.avif`
- Reuse: `public/images/home-intro/amg-sky-mobile.webp`
- Modify: `lib/site-media.ts`
- Modify: `docs/creative/higgsfield-asset-manifest.json`

- [x] **Step 1: Retry Higgsfield availability**

Run:
```bash
higgsfield account status --json
higgsfield model get gpt_image_2 --json
```

Result: Higgsfield CLI was installed, but API endpoints were unreachable on 2026-06-21. Existing selected Higgsfield stills were reused.

- [x] **Step 2: Confirm matching desktop and mobile sky plates**

Use the existing Higgsfield sky plates aligned to the cockpit horizon, no aircraft, no logo, no text, desktop `16:9`, mobile `9:16`.

Result: existing optimized sky plates remained compact and aligned with the transparent cockpit shell.

- [x] **Step 3: Create transparent cockpit shell assets**

Use Sharp to apply an alpha mask to the existing cockpit stills. The windshield aperture is transparent; cockpit panels, seats, and window frame remain opaque.

Expected:
```bash
file public/images/home-intro/amg-cockpit-shell-desktop.webp
file public/images/home-intro/amg-cockpit-shell-mobile.webp
```
shows WebP image data with alpha.

- [x] **Step 4: Optimize sky assets**

Confirmed existing AVIF/WebP sky assets at the existing hero dimensions:
```text
desktop: 2200x1244
mobile: 1200x2133
```

Expected: public still assets remain compact enough for hero loading.

### Task 4: Implement Shared Scene Transform

**Files:**
- Modify: `components/site/home/cockpit-entrance.tsx`
- Modify: `components/site/home/cockpit-entrance.module.css`

- [x] **Step 1: Replace layer-specific progress variables**

Change `setFrameProgress` to output:
```ts
--scene-scale
--scene-x
--scene-y
--logo-opacity
--logo-scale
--initial-copy-opacity
--cue-opacity
```

Expected: no `--cockpit-opacity`, no independent sky transform variables.

- [x] **Step 2: Render shared scene**

Change JSX to:
```tsx
<div className={styles.scene}>
  <div className={styles.skyPlate}>...</div>
  <div className={styles.cockpitShell}>...</div>
</div>
```

Expected: sky and cockpit shell share the same transform and transform origin.

- [x] **Step 3: Keep UI independent and clickable**

Keep logo, CTA, skip, scroll cue, and text outside `.scene`, with stable z-indexes. CTA remains an actual `Link`.

Expected: CTA is clickable during top, mid, and end scroll states.

- [x] **Step 4: Respect reduced motion**

For `prefers-reduced-motion`, disable video and scene transform, use a static hero state, and keep CTA/skip available.

Expected: reduced-motion users see a simplified static cockpit/sky hero.

### Task 5: Stop-Slop Cleanup And Verification

**Files:**
- Modify: `docs/qa/amg-cockpit-entrance-qa.md`

- [x] **Step 1: Remove unused intro video loading from the component**

Remove sky video references from the new entrance if the cohesive still-based transform makes them unnecessary.

Expected:
```bash
rg "homeIntroSky.*Video|skyVideo" components/site/home lib/site-media.ts
```
returns no active component usage.

- [x] **Step 2: Run local verification**

Run:
```bash
npm install
npm run lint
npm run build
```

Expected: all exit 0. Note npm audit findings separately if present.

- [x] **Step 3: Run Playwright verification**

Use Playwright against the local dev server across:
```text
1440x900
1024x768
390x844
360x740
390x844 reduced motion
```

Expected: no console errors; progress advances; CTA clickable at all scroll states; skip lands on `#home-after-intro`; reduced motion hides animation.

- [x] **Step 4: Update QA documentation**

Append final command results, screenshot paths, and any remaining limitations to `docs/qa/amg-cockpit-entrance-qa.md`.

Expected: final report has enough detail for a future developer to understand the mask and transform architecture.
