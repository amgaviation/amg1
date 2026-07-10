---
name: build-premium-web
description: Design, redesign, implement, and verify distinctive production web experiences, including landing pages, marketing sites, front ends, SaaS applications, dashboards, portals, responsive interfaces, Tailwind CSS systems, scroll animation, motion, and microinteractions. Use when Codex must create, overhaul, or polish web UI/UX; translate screenshots, screen recordings, mockups, or reference websites into working web code; improve conversion and visual hierarchy; or perform responsive, accessibility, interaction, and browser QA. Do not use for backend-only work or minor copy edits that require no design judgment.
---

# Build Premium Web

Create web experiences that are visually intentional, commercially clear, technically sound, and verified in a real browser. Treat design, content, interaction, implementation, and quality assurance as one job.

## Core rules

- Lead with the user outcome and implement the requested artifact when authorized. Do not stop at a mood board, critique, or plan when the user asked for working code.
- Inspect the authoritative repository, its instructions, current branch, package manager, routes, components, tokens, dependencies, and tests before changing code. Preserve unrelated work.
- Use the existing stack unless a change has a concrete benefit that outweighs migration cost and risk.
- Treat supplied references as evidence of intent, not permission to copy. Extract principles, then create original composition, code, motion, and visual identity.
- For redesigns, preserve only the content, brand assets, workflows, and behavior the user says must remain. Make the new information architecture, macro-layout, section composition, component silhouettes, rhythm, and interaction concept materially different from the old design.
- Do not invent product capabilities, customer proof, metrics, partnerships, pricing, testimonials, or legal claims. Mark placeholder content and sample data clearly.
- Preserve functional and security boundaries. UI visibility is never authorization. Do not weaken server-side checks, authentication, data access controls, validation, or auditability for visual convenience.
- Never claim a visual match, responsive quality, accessibility, performance, or test pass without inspecting or running the relevant evidence.

## Route the task

1. **New marketing experience:** define the audience, five-second message, primary conversion, proof, objections, and narrative before styling. Read [design-and-marketing.md](references/design-and-marketing.md).
2. **Redesign:** inventory what must remain, identify what is failing, and establish a new design thesis before implementation. Use the originality gate below.
3. **Screenshot or recording input:** reconstruct observed structure and behavior before deciding what to preserve or reinterpret. Read [visual-inputs.md](references/visual-inputs.md).
4. **SaaS, dashboard, or portal:** map roles, core tasks, information density, states, and data mutations. Read [frontend-and-saas-quality.md](references/frontend-and-saas-quality.md).
5. **Motion-heavy or interactive page:** define the motion system, triggers, timing, performance budget, touch behavior, and reduced-motion fallback. Read [motion-and-interaction.md](references/motion-and-interaction.md).
6. **Polish or QA:** inspect the running product at representative viewports and exercise real flows. Read [verification.md](references/verification.md).

Use multiple routes when the task spans them.

## Workflow

### 1. Ground the brief

Resolve the following from the prompt and authoritative sources:

- product, audience, primary job, and business objective;
- required pages, routes, user flows, content, fields, and integrations;
- brand assets and non-negotiable constraints;
- reference material and what the user likes about it;
- target devices, browsers, accessibility needs, performance constraints, and delivery boundary;
- facts that are verified, assumptions that are safe, and open decisions that would materially change the result.

Ask only when a missing answer would materially change the architecture or creative direction. Otherwise state a conservative assumption and continue.

### 2. Inspect before designing

- Read repository instructions and inspect the current implementation rather than relying on screenshots alone.
- Run the current application when feasible and record baseline behavior at desktop and mobile sizes.
- Trace the real content and data states: default, loading, empty, partial, success, validation error, permission denied, offline/network failure, and destructive confirmation.
- Identify reusable assets and components, but do not preserve weak visual structure merely because it already exists.
- For a live reference URL, inspect its current public experience. Infer techniques only when the evidence supports the inference.

### 3. Establish an original design thesis

Write a compact internal direction before coding:

- one-sentence experience concept;
- three visual qualities;
- grid and spacing logic;
- typography roles and scale;
- color and surface behavior;
- image, illustration, video, or 3D role;
- interaction and motion vocabulary;
- primary conversion or task-completion strategy.

Do not present several unranked concepts unless the user asks. Choose the strongest direction for the brief.

#### Originality gate for redesigns

Before implementation, ensure the proposal changes at least four of these six dimensions unless the user explicitly requests a close reconstruction:

1. information architecture or section order;
2. macro-layout and grid behavior;
3. component composition and silhouettes;
4. typography scale, alignment, and rhythm;
5. interaction or motion concept;
6. media treatment and visual storytelling.

Brand continuity alone does not require layout continuity. Avoid tracing the old page with new colors.

### 4. Design the system, not isolated screens

- Define tokens for color, typography, spacing, radius, border, shadow, layering, breakpoints, and motion.
- Use a deliberate density model: marketing pages need narrative rhythm; operational products need scanability, predictable placement, and clear state.
- Specify component variants and interaction states before duplicating markup.
- Make responsiveness compositional. Reflow, reorder, collapse, or replace patterns based on available space; do not merely shrink desktop.
- Use real content whenever available because line length and data density are design inputs.
- Select meaningful imagery or generate custom assets only when they materially improve comprehension, trust, or atmosphere.

### 5. Implement the experience

- Build semantic structure first, then styling and motion.
- Keep server/client boundaries intentional. Do not convert large trees to client components for one animation.
- Prefer CSS for layout, transitions, and simple scroll effects. Add a motion library, canvas, or WebGL only when the concept needs it.
- Centralize repeated Tailwind values in the project’s token/theme system instead of scattering arbitrary literals.
- Make components reusable at the level the product actually repeats; avoid both monoliths and needless one-line abstractions.
- Keep interactions complete: keyboard, pointer, touch, focus, disabled, busy, success, error, and reduced-motion behavior.
- Connect forms and product controls to real behavior when the scope includes it. Decorative controls that do nothing are defects.
- Preserve analytics, metadata, structured data, canonical links, and existing integration behavior unless the task changes them.

### 6. Verify and refine

Run the project’s actual lint, typecheck, tests, and production build where available. Then inspect the running experience in a browser across the target widths, states, and flows. Fix visible and functional defects, rerun relevant checks, and repeat until the acceptance criteria are met or a concrete blocker remains.

Use [verification.md](references/verification.md) as the completion gate. Do not substitute code inspection for browser verification on visual work.

## Reference-inspired technique rules

When the user cites experiences such as Jesko Jets, Magma, or similar editorial and motion-led sites:

- study narrative pacing, large-type hierarchy, section transitions, image choreography, layered depth, restrained controls, and custom easing;
- use purpose-driven scroll progress, masks, clips, transforms, typography reveals, sticky scenes, or media transitions only when they support the message;
- apply hover effects only where hover exists and provide focus/touch equivalents;
- make animation parameters reusable through tokens, CSS custom properties, or a small motion configuration;
- translate those principles into a new structure and brand-specific visual language;
- never transplant their copy, branding, assets, proprietary source, exact sequence, distinctive layout, or signature interaction wholesale.

The goal is comparable craft, not resemblance.

## Optional model-assisted critique

If a stronger multimodal or general-reasoning model is available, use it as a non-blocking critic after the first working pass: provide the brief plus current screenshots and ask for ranked visual, interaction, and conversion gaps. Keep implementation, repository safety, and test verification with the coding agent. Do not let an external critique override verified requirements or introduce unsupported business claims.

## Completion report

Return a concise handoff containing:

- the implemented outcome and main design direction;
- files or routes changed;
- interactions and responsive behavior added;
- commands and browser scenarios actually verified, with pass/fail status;
- remaining assumptions, blockers, or items not verified.

Do not include generic self-praise. Show quality through the artifact and evidence.
