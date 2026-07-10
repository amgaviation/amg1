# Verification

Use this as the completion gate for implemented web work.

## Establish the commands

Read the project manifest, repository instructions, and CI configuration. Use the project’s real package manager and scripts. Typical checks include lint, typecheck, unit tests, integration tests, and a production build, but never invent command names.

Record the exact command and outcome. If a check cannot run, report why and what remains unverified.

## Browser matrix

Exercise representative widths based on the product’s target devices. When no matrix is specified, cover at least:

- a narrow phone around 360–390 px;
- a tablet around 768 px;
- a compact desktop around 1024–1280 px;
- a wide desktop around 1440–1920 px.

Inspect both initial load and after interaction. Resize across breakpoints to expose state and layout assumptions.

## Visual checks

- hierarchy, alignment, spacing rhythm, and content order;
- text wrapping, truncation, overflow, and zoom behavior;
- image/video crop, loading fallback, and layout stability;
- fixed and sticky elements at page boundaries;
- overlays, menus, dialogs, drawers, and stacking contexts;
- hover, focus, press, disabled, busy, success, and error states;
- light/dark or theme variants when supported;
- reduced-motion behavior and interrupted transitions.

For screenshot-defined work, compare at the same viewport and state. For redesigns, compare against the new brief and originality gate rather than pixel similarity to the old design.

## Functional checks

- navigation, deep links, anchors, browser back/forward, and refresh;
- forms, validation, duplicate submission prevention, and recovery;
- authentication entry, expiry, sign-out, and permission boundaries when in scope;
- sorting, filtering, pagination, search, selection, and record navigation;
- create, edit, status change, and delete workflows when in scope;
- loading, empty, partial, network error, server error, and permission denied states;
- analytics and metadata behavior when changed.

Use safe fixtures or a non-production environment unless the user explicitly authorizes production mutation.

## Accessibility checks

- complete the primary flow with keyboard only;
- inspect focus order, focus visibility, and focus restoration;
- confirm names and labels for interactive controls;
- check landmarks, heading order, dialog semantics, and live status announcements;
- check contrast and non-color state cues;
- verify touch target size and browser zoom behavior;
- run available automated accessibility checks, then perform manual checks because automation is incomplete.

## Performance checks

- watch for layout shifts, long blank states, animation jank, and input delay;
- inspect unnecessary client JavaScript and duplicate dependencies;
- verify responsive media sizing and lazy loading;
- confirm loops pause offscreen and scroll work stays bounded;
- run the project’s performance tooling when performance is part of acceptance.

## Completion decision

Ship only when the implemented scope works, relevant automated checks pass, and browser inspection finds no known critical defect. Otherwise fix the issue or report a concrete blocker. Distinguish passed, failed, and not run; never collapse them into “verified.”
