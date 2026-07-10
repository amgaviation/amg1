# Visual Inputs

Use this guide when screenshots, screen recordings, mockups, or reference sites define part of the task.

## Evidence first

- Inspect every supplied file. Do not infer the full experience from a thumbnail or first frame.
- Preserve aspect ratio and inspect images at original resolution when small details matter.
- Separate observed facts from interpretation. Record uncertainty instead of filling gaps with invented behavior.
- If a required file is unavailable, ask for it. Do not claim to have viewed an inaccessible upload or URL.

## Screenshots

For each screen, extract:

| Dimension | Observe |
| --- | --- |
| Structure | viewport, header, navigation, sections, columns, overlays, fixed elements |
| Geometry | gutters, max width, alignment, spacing rhythm, aspect ratios, density |
| Typography | family clues, roles, scale, weight, tracking, leading, line length |
| Surfaces | colors, borders, radius, shadows, blur, texture, layering |
| Components | variants, states, affordances, repeated patterns |
| Media | subject, crop, focal point, masks, overlays, parallax clues |
| Behavior | visible scroll state, active state, hover/focus clues, sticky positioning |

When several screenshots show the same flow, map them as states rather than treating them as unrelated pages.

## Screen recordings

1. Inspect the entire duration once before extracting conclusions.
2. Capture metadata such as duration, dimensions, frame rate, and audio presence when tools allow it.
3. Sample the opening, closing, every scene change, every navigation event, and each interaction transition. Increase sampling density around fast motion.
4. Build a timeline with trigger, starting state, ending state, duration, easing clue, overlap, and scroll or pointer dependency.
5. Distinguish video content from DOM animation. Reproduce the effect with the simplest maintainable technique that preserves quality.
6. Confirm whether the recording demonstrates one viewport or responsive behavior. Never extrapolate exact mobile behavior from desktop-only evidence without marking it as a design decision.

## Reference sites

- Inspect the current public page when access is available; reference sites change.
- Extract design principles at the system level: rhythm, sequencing, density, contrast, motion vocabulary, and interaction feedback.
- Do not copy source code, text, brand assets, or a distinctive composition. Reimplement general techniques in the target project’s architecture.
- If the user wants an exact reconstruction of their own design, prioritize fidelity. If they want a redesign, use the originality gate in `SKILL.md`.

## Reconstruction loop

1. Implement structure and responsive geometry.
2. Compare at the same viewport and content state.
3. Correct large differences first: hierarchy, placement, sizing, flow, and crop.
4. Correct typography and spacing next.
5. Add surface details and motion last.
6. Repeat comparison after every material change.

Use overlays or image-difference tools when exact fidelity is authorized and useful. A low pixel difference does not excuse broken semantics, responsiveness, or interaction.
