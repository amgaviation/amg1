# Coverage Matrix

Use this matrix to define what “comprehensive” means for the specific product. Record `tested`, `partial`, `blocked`, `not applicable`, or `not discovered` for each applicable intersection.

## Surface dimensions

| Dimension | Typical values |
| --- | --- |
| Route | Every discoverable public, auth, application, settings, legal, error, and dynamic-detail route |
| Role | Anonymous, pending, standard user, specialist/crew/vendor, administrator, owner/super-admin, denied/suspended |
| Data state | Loading, empty, one item, typical, many items, long content, missing optional values, stale, error, permission denied |
| Viewport | Compact mobile, standard mobile, tablet, laptop, wide desktop; use actual product breakpoints |
| Input | Mouse, touch-sized pointer, keyboard, screen-reader semantics where tooling permits |
| Theme | Light, dark, system, high contrast when supported |
| Network | Normal, slow, failed request, retry/reconnect where safe and supported |
| Browser | Project-supported engines; at minimum the available primary browser, with limitations stated |

Do not create the full Cartesian product blindly. Use risk-based pairings while ensuring every discovered route, role, workflow, and breakpoint boundary receives coverage.

## Per-route sweep

For every applicable route, check:

- route resolves directly and through navigation;
- correct page title, heading, active navigation, and orientation cues;
- loading, empty, populated, failure, and permission states;
- primary action, secondary actions, and safe error paths;
- keyboard order, focus visibility, labels, landmarks, and escape behavior;
- layout at one width below, at, and above relevant breakpoint boundaries;
- long text, long identifiers, dense tables, missing imagery, and zoom/reflow;
- console, network, asset, hydration, and runtime failures;
- back, forward, refresh, deep link, query parameters, and scroll restoration;
- shared header/sidebar/footer consistency.

## Workflow sweep

For each critical workflow, record:

1. entry point and discoverability;
2. prerequisites and permissions;
3. happy path;
4. validation and recovery paths;
5. loading and double-submit protection;
6. success feedback and destination;
7. refresh/back behavior and persisted state;
8. mobile and keyboard completion;
9. observable side effects;
10. cleanup or rollback needs.

Do not execute consequential production side effects unless explicitly authorized. Stop immediately before final submission and mark the last step blocked when necessary.

## Honest stopping rules

Call an audit complete only when:

- every discovered route is classified;
- every available role is classified;
- every critical workflow is completed or marked blocked with a reason;
- every applicable global component is exercised;
- every selected viewport and relevant breakpoint boundary is covered;
- findings contain sufficient evidence to reproduce;
- repeated symptoms are consolidated by root cause;
- diagnostics and limitations are recorded.

State “comprehensive within the tested scope,” never “all bugs found.”

Coverage may be complete for a clearly bounded surface such as a shared public shell even when page bodies or authenticated areas are excluded. Name that boundary in the conclusion and do not reuse the bounded result as evidence about excluded surfaces.
