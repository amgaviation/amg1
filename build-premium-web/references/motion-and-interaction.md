# Motion and Interaction

Use this guide for scroll experiences, animated landing pages, microinteractions, transitions, and motion-heavy UI.

## Give every motion a job

Use motion to explain causality, preserve context, direct attention, provide feedback, reveal hierarchy, or establish atmosphere. Remove motion that exists only to prove animation is present.

Define a compact vocabulary for the project:

- entrance and exit;
- section transition;
- hover, focus, press, and selection;
- loading and progress;
- state change and validation;
- scroll-linked narrative;
- route or view transition.

Reuse the vocabulary so the experience feels authored rather than assembled.

## Timing and easing

Treat these as starting ranges, then tune by distance and context:

- 100–200 ms for immediate control feedback;
- 180–350 ms for component state transitions;
- 300–650 ms for panels, menus, and moderate spatial changes;
- 500–1000 ms for editorial reveals or large scene changes;
- longer durations only for deliberate narrative sequences that remain interruptible.

Use a small set of easing curves. Accelerate exits, decelerate entrances, and use symmetric easing sparingly for neutral movement. Avoid linear easing except continuous progress, looping, or physically uniform motion.

## Technique selection

- Use CSS transitions and keyframes for local states and simple reveals.
- Use Intersection Observer for one-time or threshold-based viewport events.
- Use requestAnimationFrame or a proven motion library for coordinated continuous animation.
- Use sticky positioning and transforms for scroll scenes before introducing scroll hijacking.
- Use canvas, WebGL, or Three.js only when the visual concept cannot be achieved efficiently with DOM and CSS.
- Use pre-rendered video when it produces a better result than expensive real-time rendering, while preserving responsive crops and loading fallbacks.

Do not add a library without checking the current stack, bundle impact, maintenance state, and whether existing dependencies already solve the problem.

## Performance

- Animate transform and opacity when possible.
- Avoid continuous layout reads and writes in the same frame.
- Throttle or synchronize scroll work through animation frames.
- Mark listeners passive when appropriate.
- Use `will-change` narrowly and temporarily; persistent overuse wastes memory.
- Pause offscreen loops and respect page visibility.
- Reserve media dimensions to prevent layout shift.
- Test on a constrained mobile viewport, not only a fast desktop.

## Input and accessibility

- Apply hover-only effects under hover-capable, fine-pointer conditions.
- Provide equivalent focus feedback and ensure touch does not depend on hover discovery.
- Keep focus order and focus visibility intact through animated transitions.
- Honor `prefers-reduced-motion`; remove nonessential movement and replace spatial travel with immediate or subtle state changes.
- Never trap scrolling or block navigation behind an animation.
- Allow users to interrupt long transitions and skip nonessential intros.
- Avoid flashes, rapid parallax, or large uncontrolled motion that can cause discomfort.

## Interaction completeness

Verify default, hover, focus-visible, active/pressed, selected, disabled, busy, success, warning, and error states where applicable. Make cursor, label, iconography, and behavior agree about what is interactive.

For forms and data mutations:

- show field-level validation near the field;
- prevent accidental duplicate submissions without hiding progress;
- keep entered data after recoverable errors;
- confirm destructive actions with impact-specific language;
- announce asynchronous status changes accessibly;
- reconcile optimistic UI with server failure.

## Motion acceptance gate

- Motion communicates a purpose and uses a consistent vocabulary.
- Touch, keyboard, and reduced-motion experiences remain complete.
- Scroll remains responsive and native unless a strong requirement says otherwise.
- No animation causes clipping, unreadable text, cumulative layout shift, or blocked interaction.
- Route and component state remain correct when animations are interrupted.
