# Frontend and SaaS Quality

Use this guide for applications, SaaS products, portals, dashboards, authenticated interfaces, and dense operational UI.

## Architecture

- Follow the current framework and project conventions unless evidence supports a change.
- Keep rendering boundaries intentional. Fetch sensitive data and enforce authorization on the server or trusted backend.
- Treat client guards as user experience only, never as security.
- Preserve type safety across API, database, form, and component boundaries.
- Centralize cross-cutting concerns such as session handling, error reporting, analytics, feature flags, and permissions.
- Avoid new global state when URL state, server state, or local component state is sufficient.

## Product flow

Map each role to its primary tasks and design around task frequency and consequence. Make the default view useful rather than decorative.

For every data surface, handle:

- initial loading and background refresh;
- true empty state and filter-created empty state;
- partial or stale data;
- permissions and unavailable actions;
- network and server errors with recovery;
- optimistic update rollback;
- pagination, filtering, sorting, selection, and URL persistence where needed;
- audit or status history when actions are consequential.

## Operational interfaces

- Prefer list-to-detail navigation for complex records unless quick comparison clearly benefits from a panel.
- Keep table headers, column priorities, truncation, overflow, and mobile alternatives intentional.
- Place primary record identity and status consistently.
- Separate irreversible actions from routine edits.
- Preserve linked-data integrity and explain the impact of destructive operations.
- Do not hide failures behind empty states or generic “not found” messages.

## Tailwind and component systems

- Use semantic tokens or CSS variables for brand and state colors, spacing, surfaces, typography, radius, and motion.
- Prefer named component variants over repeated conditional class strings.
- Keep arbitrary values for truly one-off geometry, not as a substitute for a system.
- Preserve readable class composition and use the project’s merge helper when variants can conflict.
- Do not introduce a new component library solely for visual novelty. Extend existing primitives when they are structurally sound and accessible.

## Responsive behavior

- Define content priority at narrow widths.
- Recompose complex layouts rather than scaling them down.
- Avoid page-level horizontal scrolling. Give genuinely wide data a deliberate contained strategy.
- Keep touch targets usable and controls reachable.
- Test long names, localization expansion, large numbers, validation messages, browser zoom, and dynamic text.
- Ensure fixed headers, sidebars, bottom bars, and safe areas do not cover content.

## Accessibility

- Use semantic elements and labels before adding ARIA.
- Support keyboard operation and logical focus movement.
- Maintain visible focus and sufficient text, icon, border, and state contrast.
- Associate errors and help text with inputs.
- Announce important asynchronous results.
- Use headings and landmarks that reflect information hierarchy.
- Make charts and non-text visuals understandable without color alone.

## Performance and resilience

- Keep route bundles focused and lazy-load expensive secondary experiences.
- Optimize images, fonts, video, and third-party scripts.
- Avoid hydration-dependent layout shifts.
- Cancel stale requests and prevent race-condition overwrites.
- Make mutation endpoints idempotent when retries are plausible.
- Preserve useful behavior under slow networks and partial failure.

## SaaS acceptance gate

- Every visible action works against the intended data path or is explicitly identified as a prototype.
- Role and authorization behavior is enforced beyond the UI.
- Loading, empty, error, permission, success, and destructive states are complete.
- Dense information remains scannable on desktop and usable on mobile.
- The interface uses one coherent token and component system.
- Critical mutations are safe, recoverable where possible, and auditable where required.
