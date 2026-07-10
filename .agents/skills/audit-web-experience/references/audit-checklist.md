# Comprehensive Web Experience Checklist

Use this as a discovery checklist, not as a substitute for product judgment.

## Visual system and composition

- Grid, container widths, alignment, rhythm, whitespace, density, grouping, and proximity
- Heading hierarchy, font loading, scale, weight, line height, line length, wrapping, truncation, and numeral alignment
- Semantic color roles, contrast, dark/light surfaces, borders, dividers, shadows, gradients, opacity, and disabled states
- Component variants, icon family, stroke weight, corner radius, control height, hit areas, labels, badges, and status colors
- Image relevance, crop, aspect ratio, focal point, resolution, compression, lazy loading, alt treatment, and empty fallbacks
- Layering, sticky/fixed behavior, z-index, overlay boundaries, scroll locking, and viewport-safe positioning
- Accidental horizontal scrolling, nested scroll containers, cut-off content, widows/orphans, and layout shift
- Consistency across routes, roles, themes, and shared components

## Information architecture and navigation

- Five-second comprehension of audience, purpose, value, and primary next step where relevant
- Logical grouping, naming, label clarity, hierarchy, progressive disclosure, and cognitive load
- Global/local navigation parity, active state, breadcrumbs, back paths, escape hatches, deep linking, and route predictability
- Mobile menu reachability, nested navigation, focus management, scroll state, and close behavior
- Duplicate destinations, dead ends, orphan routes, hidden primary actions, misleading labels, and inconsistent terminology
- Search discoverability, query persistence, zero results, spelling tolerance, filters, sorting, pagination, and reset behavior

## Interaction and feedback

- Hover, focus, pressed, selected, disabled, busy, success, warning, and failure states
- Immediate acknowledgement, progress indication, optimistic updates, retries, cancellations, timeouts, and recovery
- Double-submit guards, repeated clicks, race conditions, stale state, unsaved changes, and destructive confirmations
- Modals, popovers, drawers, menus, tooltips, tabs, accordions, carousels, drag/drop, and keyboard dismissal
- Motion purpose, duration, easing, interruption, scroll-jacking, reduced motion, flashing, and performance
- Pointer target size, touch conflicts, gesture discoverability, hover-only information, and mobile keyboard obstruction

## Forms and data entry

- Explicit labels, instructions, required/optional markers, autocomplete, input mode, defaults, formatting, and examples
- Inline validation timing, error specificity, summary placement, focus to error, preservation of valid data, and recovery
- Conditional fields, dependencies, date/time/time-zone handling, units, currency, phone/address formats, uploads, and limits
- Password manager compatibility, verification flows, reset flows, consent, privacy context, and bot protection
- Submission status, success confirmation, duplicate prevention, idempotency cues, and correct next destination

## Tables, dashboards, and record experiences

- Column priority, responsive transformation, sticky headers, row actions, selection, bulk actions, and density
- Sort state, filter state, pagination, totals, date/time zones, units, formatting, truncation, and export behavior
- Empty/loading/error/skeleton states, partial data, stale indicators, refresh behavior, and permission-aware actions
- Row click semantics, links, detail routes, edit/view distinction, return-to-list state, and record identity
- Charts: title, units, axes, legends, color independence, tooltips, no-data states, accessible alternatives, and truthful scales

## Responsive and adaptive behavior

- Breakpoint transitions and layout behavior just below/at/above each breakpoint
- 320px-class compact screens, standard phones, tablets, laptops, wide desktops, short-height windows, landscape, and zoom
- Reflow rather than shrink-to-fit, readable line lengths, preserved hierarchy, reachable actions, and no hidden required content
- Safe areas, browser chrome, virtual keyboards, fixed footers, sticky headers, and orientation changes
- Content extremes: long names, translated strings, large numbers, many navigation items, and user-generated content

## Accessibility

- Semantic landmarks, heading order, page title, language, skip navigation, lists, tables, and native controls
- Accessible name/role/value, explicit labels, descriptions, errors, live regions, announcements, and status messages
- Keyboard reachability, logical focus order, visible focus, focus trapping/restoration, no keyboard traps, and escape behavior
- Text and non-text contrast, color-independent meaning, zoom to 200%, reflow at 400%, spacing overrides, and target size
- Alternative text, decorative image handling, captions/transcripts, animation controls, reduced motion, and pause/stop/hide
- Screen-reader reading order, hidden content, portal/overlay placement, dynamic updates, and disabled semantics
- Authentication accessibility, cognitive clarity, consistent help, and error prevention for consequential actions

Use current applicable WCAG guidance when formal conformance is requested; verify the requested standard rather than assuming it.

## Content, trust, and conversion

- Clear claims, factual support, audience fit, terminology, scannability, CTA specificity, and content redundancy
- Trust signals, contact path, pricing/plan clarity, operational boundaries, privacy, terms, accessibility, and error transparency
- Grammar, capitalization, punctuation, tone, labels, placeholders, dates, and consistency between UI and email/document language
- No fabricated metrics, testimonials, partnerships, credentials, urgency, guarantees, or capabilities
- SEO basics when in scope: unique titles/descriptions, canonical behavior, headings, indexability, structured data, social previews, and sitemap integrity

## Frontend reliability and performance

- Broken links, 404s, redirects, asset failures, console errors, failed requests, hydration mismatch, and uncaught exceptions
- Loading waterfalls, oversized images, blocking fonts/scripts, layout shifts, long tasks, animation jank, and memory growth
- Server/client boundary choices, excessive bundles, duplicate dependencies, unnecessary re-renders, and cache/revalidation behavior
- Error boundaries, not-found behavior, offline/slow states, retries, aborts, stale data, and session expiry
- Browser support, feature detection, timezone/locale handling, and graceful degradation
- Analytics and consent behavior when in scope; avoid exposing private data in logs, URLs, or client-visible errors

## Source-structure review

- Shared layouts/components used consistently rather than copied variants
- Tokens and semantic variants instead of ad hoc colors, spacing, widths, or z-index values
- Navigation definitions aligned with actual routes and role permissions
- Stable keys, controlled/uncontrolled inputs, effect cleanup, event listener cleanup, and async cancellation
- Semantic HTML before ARIA; correct link/button choice; no click handlers on inert elements
- UI visibility not mistaken for authorization; flag for security review when access control appears client-only
- Tests focused on critical user workflows, responsive regressions, accessibility, and error paths

