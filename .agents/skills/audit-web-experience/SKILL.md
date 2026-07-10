---
name: audit-web-experience
description: Conduct comprehensive, evidence-based reviews of websites, web applications, SaaS products, portals, dashboards, landing pages, and frontend implementations. Use when Codex is asked to audit, review, critique, QA, inspect, evaluate, or find problems in UI, UX, visual design, design systems, responsive layouts, accessibility, navigation, interactions, forms, states, content hierarchy, frontend functionality, or cross-page consistency from a live URL, local app, repository, screenshots, or screen recordings. Produce a prioritized, deduplicated remediation backlog by default; do not implement fixes unless the user asks.
---

# Audit Web Experience

Perform a systematic product-quality audit, not an impressionistic design critique. Inspect the rendered experience and its implementation whenever both are available. Find defects, explain their user impact, and support each finding with reproducible evidence.

## Establish the audit contract

1. Identify the available evidence:
   - live or preview URL;
   - runnable local application;
   - source repository and authoritative branch;
   - screenshots or recordings;
   - design files, brand guide, requirements, or acceptance criteria;
   - test accounts, roles, seeded data, and permitted workflows.
2. Read repository instructions and determine the framework, routes, layouts, styling system, component library, breakpoints, and test commands.
3. State the audit mode internally and in the final coverage statement:
   - **Full-stack experience audit:** rendered application plus source;
   - **Rendered audit:** live/local experience without source;
   - **Implementation audit:** source without a usable rendered application;
   - **Artifact audit:** screenshots or recordings only.
4. Treat provided requirements and brand standards as evidence. Do not infer approved behavior from unfinished code or a draft design.
5. Keep the task read-only unless the user explicitly asks for fixes. Safe local diagnostics are permitted; do not modify production data, send communications, submit consequential forms, purchase anything, or change external state.
6. If credentials or a user decision would materially expand coverage, request them only after completing all unblocked surfaces.

Never claim to have found literally every defect. Define completeness as every accessible item in the recorded route, role, state, viewport, and interaction inventory.

## Build a coverage inventory before judging quality

Inventory the product so attractive landing pages do not distract from unreviewed workflows.

- Enumerate public and authenticated routes from the router, sitemap, navigation, redirects, and source tree.
- Enumerate roles, permissions, themes, feature flags, locales, and meaningful data states.
- Enumerate global UI: headers, sidebars, mobile navigation, breadcrumbs, search, notifications, modals, drawers, toasts, cookie controls, footer, and account controls.
- Enumerate workflows: authentication, onboarding, forms, CRUD, upload/download, filtering, sorting, pagination, checkout/billing, and destructive confirmations as applicable.
- Enumerate states: loading, empty, populated, validation error, server error, permission denied, offline/slow, success, disabled, hover, focus, selected, and stale data.
- Select representative viewport widths from the product's actual breakpoints, including compact mobile, standard mobile, tablet, laptop, and wide desktop where relevant.

For broad audits, maintain a machine-readable ledger with `scripts/audit_ledger.py`. Read [coverage-matrix.md](references/coverage-matrix.md) for the required surface matrix and honest stopping rules.

## Execute the audit

### 1. Verify the baseline

- Confirm the repository, branch, revision, URL, build identity, environment, and date when these are observable.
- Run existing lint, type, unit, build, and end-to-end checks when safe and relevant. Report exact commands and actual outcomes; never imply an unrun test passed.
- Capture console errors, failed requests, hydration warnings, broken assets, missing routes, and runtime exceptions.
- Distinguish pre-existing failures from audit-tool limitations.

### 2. Inspect the rendered experience

Use browser automation and visual inspection when available. Review each inventoried surface at its representative viewports.

- Follow navigation as a user would; test every visible link, button, menu, tab, control, and form path that is safe to exercise.
- Verify back/forward behavior, deep links, refresh persistence, active navigation, scroll restoration, anchors, focus movement, overlays, escape behavior, and URL state.
- Exercise realistic valid and invalid inputs. Do not submit live consequential actions without authorization.
- Inspect content at realistic extremes: long names, empty results, many rows, validation text, large numbers, missing images, and constrained height.
- Compare screenshots across widths and states for overflow, clipping, reflow, overlap, layout shift, and hidden actions.
- Use keyboard-only navigation and inspect focus visibility, focus order, landmarks, labels, names, roles, contrast, zoom/reflow, reduced motion, and pointer target size.
- Check motion for purpose, continuity, interruptibility, performance, and reduced-motion behavior.

### 3. Inspect the implementation

Trace visible defects to likely implementation causes without overstating certainty.

- Review route/layout composition, responsive utilities, global CSS, tokens, component variants, z-index layers, overflow rules, and duplicated patterns.
- Inspect interactive semantics, event handlers, link destinations, disabled/loading guards, validation, error handling, optimistic state, and stale state.
- Check image sizing, font loading, asset quality, layout stability, animation cost, bundle-heavy client boundaries, and avoidable rendering work.
- Compare navigation definitions, route permissions, labels, and information architecture for drift.
- Flag client-side visibility that appears to be mistaken for authorization, but do not present a UI audit as a security audit.
- Cite exact file paths and symbols or line references when source evidence is available.

### 4. Evaluate quality systematically

Use [audit-checklist.md](references/audit-checklist.md). Cover at minimum:

- visual hierarchy, layout, spacing, typography, color, imagery, density, alignment, and polish;
- design-system consistency and component behavior;
- information architecture, labels, discoverability, orientation, and route coherence;
- responsive behavior, touch ergonomics, viewport use, and content reflow;
- accessibility and inclusive interaction;
- forms, tables, search, filters, records, feedback, and error recovery;
- performance perception and frontend reliability;
- content clarity, trust, conversion, and brand fidelity;
- cross-role and cross-page consistency;
- edge cases, failure states, and incomplete or misleading UI.

Avoid subjective findings such as “looks dated” unless translated into an observable rule violation and user impact.

## Record findings with proof

Create one finding per independently actionable root cause. Consolidate repeated symptoms caused by the same shared component or token.

Every finding must include:

- stable ID and concise defect title;
- severity and confidence;
- affected route, role, state, viewport, browser, and component;
- observed behavior and expected behavior;
- user/business impact;
- exact reproduction steps;
- evidence: screenshot/frame, console/network detail, DOM/accessibility observation, test output, or source location;
- likely root cause, labeled as confirmed or inferred;
- concrete remediation and verification criteria.
- affected-instance count when one shared root cause appears across multiple routes or components.

Use [report-contract.md](references/report-contract.md) for severity, confidence, deduplication, and reporting rules. Do not inflate issue counts with repeated instances.

## Prioritize remediation

Rank work by user harm, workflow blockage, accessibility impact, reach, recurrence, trust/conversion damage, implementation dependency, and regression risk.

Recommend an ordered plan:

1. Blockers, broken workflows, data-loss risks, authorization confusion, and critical accessibility failures.
2. Shared root causes affecting many routes: layout primitives, navigation, tokens, tables, forms, overlays, or state handling.
3. High-frequency usability, responsive, and comprehension defects.
4. Visual consistency and polish.
5. Enhancements that are not defects, clearly labeled as recommendations.

Do not recommend a redesign when targeted fixes solve the verified problems. Do not recommend new features unless they support a stated workflow or objective.

## Output

Lead with the audit outcome and strongest risks. Then provide:

1. **Scope and confidence** — audit mode, tested build, evidence available, roles, routes, viewports, browsers, and material exclusions.
2. **Top findings** — the small set that should be corrected first.
3. **Complete findings register** — severity-sorted and deduplicated.
4. **Coverage ledger** — what was tested, partially tested, blocked, or not applicable.
5. **Remediation sequence** — ordered by dependency and impact.
6. **Verification record** — commands and workflows actually run, with pass/fail/blocker status, followed by relevant commands not run and why.
7. **Open decisions and unknowns** — only items that could change the recommended correction.

Separate verified defects, inferred causes, recommendations, and open questions. If no defect is found on a surface, record that it was checked; do not invent filler.

## Mode-specific limits

- **Screenshot/recording only:** inspect every provided frame and visible state; do not claim interaction, responsiveness, accessibility tree, or runtime behavior was tested.
- **Source only:** identify implementation risks and static defects; do not claim the UI was visually verified. For every conditional runtime risk, state the exact rendered or interaction check needed to confirm it.
- **Live only:** report observed behavior; label root causes as inferred unless supported by diagnostics.
- **Authenticated application:** never use a higher-privilege role than provided or expose private records in the report.
- **Fix request:** preserve unrelated changes, fix by root cause, rerun targeted and regression checks, and report what remains unverified.
