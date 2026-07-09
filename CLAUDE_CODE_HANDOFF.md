# Claude Code Handoff Plan — `amgaviation/amg1`

_Last updated: July 9, 2026_

## Repository source of truth

- GitHub repository: `amgaviation/amg1`.
- Current workspace path: `/workspace/amg1`.
- Current local branch at handoff creation: `work`.
- Current local `HEAD` at handoff creation: `44c104e` — `Merge pull request #116 from amgaviation/claude/new-session-mt12tj`.
- Earlier referenced base commit: `f67192b2932cb88deed28776a529a5680e6de885`.
- Treat `amgaviation/amg1` as authoritative. Do not rely on any previous transient Codex branch, Tony's local files, or uncommitted state from another environment.

## Purpose

This file is the revised implementation plan for Claude Code to continue work directly in the `amgaviation/amg1` repository. It replaces any earlier handoff that may have been created in a different workspace or branch.

The goal is to complete the security, data-integrity, authorization, accessibility, performance, and build-verification work identified during prior review cycles, while preserving existing website features, routes, Supabase behavior, authentication behavior, layouts, animations, and portal workflows unless a change is explicitly called out below.

## Ground rules for Claude Code

1. Work from the latest `main` or the Codex task branch that is backed by `amgaviation/amg1`.
2. Use npm because `package-lock.json` is present.
3. Do not commit secrets, `.env` files, `.vercel`, `node_modules`, `.next`, build output, cache folders, or temporary folders.
4. Keep fixes small, reviewable, and grouped by risk area.
5. Prefer application-level hardening first; defer broad database rewrites until the schema and production data implications are clear.
6. Run the practical validation checklist at the end, especially `npm install`, `npm run lint`, and `npm run build` when the environment supports it.
7. After fixes and builds are done, perform one final self-review. Do not start additional review-agent loops.

## Highest-priority implementation plan

### Phase 1 — Account setup and portal authorization

#### 1. Harden `/api/portal-setup/complete`

Problem: the setup completion endpoint must not be able to approve or reactivate users by itself.

Implementation target:

- Authenticate the Supabase user.
- Fetch the matching profile before any update.
- Require the profile to already be approved, active, and setup-eligible.
- Only update setup lifecycle metadata such as `invitation_status`, password/setup timestamps, and `updated_at`.
- Do not set `profiles.status = 'approved'` in this endpoint.
- Do not set `profiles.is_active = true` in this endpoint.
- Add guarded update predicates so zero updated rows return `403`.

Suggested validation:

- Approved and invited user can complete setup.
- Pending, waitlisted, denied, suspended, inactive, and deleted users cannot complete setup.
- Endpoint cannot be used as an approval path.

#### 2. Prevent admin-created non-approved users from becoming approved

Problem: creating a portal user with a non-approved status can be undermined if a provisioning helper later upserts the profile as approved and active.

Implementation target:

- In the admin create-user flow, call auth provisioning/setup email helpers only when the selected status is `approved`.
- For `pending_approval`, `waitlisted`, `denied`, `suspended`, or equivalent non-approved states, insert/update the profile only and preserve the selected status.
- Keep `is_active` false unless the selected lifecycle status should actually allow login.
- Add regression coverage for each non-approved status.

#### 3. Add a shared approved API-user guard

Problem: page guards and direct API route guards are not always equivalent.

Implementation target:

- Add a route-handler helper such as `requireApprovedPortalApiUser()`.
- It should return `401` when unauthenticated and `403` when the profile is not approved/active.
- Use this guard before service-role reads, storage downloads, or private JSON responses.
- Apply it first to sensitive direct routes:
  - portal document content/download routes
  - billing document content/download routes
  - vendor receipt content/download routes
  - avatar routes that expose private profile/media objects
  - communications attachment routes
  - admin export/search/analytics APIs where service-role data is used

#### 4. Normalize admin and super-admin checks

Problem: some APIs check only `role === 'admin'`, while pages treat `super_admin` as an admin role.

Implementation target:

- Use a shared `isAdminRole()` or equivalent helper in API routes and server actions where super-admin should have admin capability.
- Replace literal role checks in admin-facing APIs where the intended behavior includes super-admin access.
- Do not broaden access for non-admin roles.

### Phase 2 — Webhook, upload, and export hardening

#### 5. Fail closed for email webhook signing

Problem: email webhooks should not accept unsigned production requests when signing secrets are missing.

Implementation target:

- Create or reuse a shared Svix-style verifier for email inbound/status webhooks.
- In production, return an error if the required webhook signing secret is absent.
- Validate event id, timestamp, signature, and timestamp freshness.
- Add replay protection using provider event ids when feasible.
- Standardize environment variable naming or clearly document precedence if more than one name is supported.

#### 6. Validate inbound email attachments

Problem: inbound email attachments need the same class of controls as outbound/uploaded attachments.

Implementation target:

- Enforce MIME allowlist.
- Enforce maximum attachment count.
- Enforce per-file decoded byte limit.
- Enforce total decoded attachment byte limit.
- Validate base64 input before storing.
- Quarantine or reject unsupported attachments and audit the decision.

#### 7. Add public upload and form abuse controls

Problem: public submission endpoints can be spammed or overloaded.

Implementation target:

- Add content-length preflight checks to file-upload routes.
- Add aggregate upload count and total byte limits.
- Add route-level rate limits keyed by IP and normalized email where appropriate.
- Return `413` for oversized payloads and `429` for rate-limited requests.
- Prioritize public crew-network application uploads and other public forms that create database rows or send email.

#### 8. Sanitize spreadsheet exports

Problem: CSV/XLSX exports can contain formula-injection payloads.

Implementation target:

- Add a sanitizer for exported string cells.
- Prefix values that begin with formula-triggering characters such as `=`, `+`, `-`, `@`, tab, or carriage return.
- Apply the sanitizer to CRM CSV/XLSX exports and any other user-controlled spreadsheet export.

### Phase 3 — Billing and operational data integrity

#### 9. Make invoice payment recording atomic

Problem: concurrent or retried payments can corrupt `amount_paid`, `amount_due`, or invoice status.

Implementation target:

- Add payment idempotency keys where provider/manual identifiers exist.
- Add a unique index for non-null idempotency keys.
- Prefer a Postgres RPC such as `record_invoice_payment_atomic(...)` that locks the invoice row, inserts or returns the payment, recalculates totals from payment rows, and updates the invoice in one transaction.
- Route manual payments, Stripe webhook payments, and subscription-credit applications through the same logic.
- If the full RPC is too risky for this pass, add short-term expected-value predicates and document the remaining migration.

#### 10. Save quote and invoice headers with line items transactionally

Problem: header and line-item saves can partially succeed.

Implementation target:

- Prefer RPCs for creating/updating invoices and quotes with their line items in a single transaction.
- Validate all line payloads before deleting or replacing existing lines.
- Ensure draft-only edit rules are enforced inside the transaction.
- If the full RPC is too risky for this pass, at minimum check every insert/delete result and surface failures without falsely reporting success.

#### 11. Do not mark quote/invoice as sent before delivery succeeds

Problem: send actions can show records as sent even if the email failed.

Implementation target:

- Mark delivery as pending when queueing/sending starts.
- Update `sent_at` and status only after the email provider accepts the message.
- If no durable outbox is added in this pass, make the existing send action surface errors and avoid marking records as sent on failure.

#### 12. Make mission status transitions atomic

Problem: two admins can validate one mission status and then overwrite each other.

Implementation target:

- Prefer a `transition_mission_status(...)` RPC that locks the mission row and checks the expected current status.
- Enforce legal transitions inside the transaction.
- Add idempotency protection for automated completion/credit side effects.
- If the full RPC is too risky for this pass, use an expected-status predicate in the update and return a conflict when zero rows update.

### Phase 4 — Permission matrix gaps

#### 13. Enforce settings permissions on settings pages

Problem: some settings pages may be hidden in navigation but still directly accessible by URL.

Implementation target:

- Keep personal account/security settings available to authenticated users as intended.
- Require `settings.view` or a more specific permission for operational settings such as billing settings, email templates, permissions, compliance, and diagnostics.
- Decide and document whether permission-management pages are super-admin-only or admin read-only.

#### 14. Map contractor billing routes into the permission model

Problem: crew/partner invoices and receipts may not consistently follow the permission matrix.

Implementation target:

- Choose one model: map to `expenses`, map to `invoices`, or create a dedicated `contractor_billing` permission module.
- Update nav-prefix mappings, page guards, and server actions consistently.
- Ensure create/update/upload actions use permission-aware actor checks.

#### 15. Require `aircraft.add` for client aircraft creation

Problem: viewing aircraft and adding aircraft are different permissions.

Implementation target:

- Ensure the aircraft create action requires `aircraft.add`, not only the `client` role.
- Add or update tests for direct form/server-action submission.

### Phase 5 — UX and accessibility fixes

#### 16. Add mobile drawer focus management

Problem: the mobile drawer behaves like a modal but may allow focus to escape behind it.

Implementation target:

- Store the previously focused element.
- Move focus into the drawer when opened.
- Trap `Tab` and `Shift+Tab` while open.
- Close on Escape.
- Restore focus to the trigger when closed.
- Add `aria-labelledby` with visible or screen-reader-only title text.

#### 17. Fix command palette stale results

Problem: slow results from older searches can appear after the query changes.

Implementation target:

- Use `AbortController` for in-flight searches.
- Abort previous requests when query changes or the palette closes.
- Invalidate request ids when clearing short queries.
- Check `response.ok`.
- Show a visible error state for failed search instead of showing only “No matches.”

#### 18. Improve table, tab, combobox, and pagination semantics

Problem: several UI patterns may confuse keyboard and screen-reader users.

Implementation target:

- Do not put `role="button"` or `tabIndex` on table rows that contain nested controls.
- Add `aria-sort` to sortable table headers.
- Render disabled pagination controls as disabled buttons/spans, not active `href="#"` links.
- Use link semantics for URL-navigation filters, or implement full tab keyboard behavior for real tabs.
- Portal combobox popovers to the document body when clipping is possible and enforce required selected values.

### Phase 6 — Performance and dependency cleanup

#### 19. Lazy-load heavy public homepage motion code

Problem: homepage animation code can be loaded before it is needed.

Implementation target:

- Keep content markup server-rendered where practical.
- Move GSAP/ScrollTrigger and Lenis setup into a lazy motion controller.
- Load motion code only after motion is allowed and the browser is idle or the section is near the viewport.

#### 20. Gate and optimize the 3D globe

Problem: the globe is CPU/GPU/network expensive.

Implementation target:

- Gate loading by viewport, data-saver preference, and breakpoint.
- Self-host optimized textures if remote textures are used today.
- Avoid per-frame React state updates; prefer refs/material updates or throttling.
- Lower DPR/geometry defaults on lower-end devices.

#### 21. Convert simple query-message pages back toward static rendering

Problem: login/request pages may be dynamic mainly to read query parameters.

Implementation target:

- Keep server pages static where possible.
- Move query-string success/error reading into small client wrappers with `useSearchParams()`.
- Preserve existing form server actions.

#### 22. Review spreadsheet and animation dependencies

Problem: spreadsheet parsing and overlapping animation packages increase risk and bundle size.

Implementation target:

- Prefer CSV-only imports where product requirements allow it.
- If XLSX remains required, parse server-side with strict limits.
- Evaluate the current SheetJS distribution path or safer alternatives.
- Standardize on one motion package where possible.
- Remove unused Radix or animation dependencies only after confirming imports.

### Phase 7 — Database/RLS and metadata hardening

#### 23. Normalize RLS helper functions and policy checks

Problem: older RLS policies may not consistently check approved status or super-admin behavior.

Implementation target:

- Add canonical SQL helpers such as:
  - `public.is_approved_portal_user()`
  - `public.is_approved_admin()`
  - `public.is_approved_super_admin()`
- Refactor duplicated policy snippets gradually.
- Add a verification script that flags policies missing status checks, missing super-admin handling, or overly broad access.
- Treat this as high-risk migration work; validate carefully against existing Supabase behavior.

#### 24. Restrict public build/deployment metadata

Problem: public build-info metadata can help fingerprint the app.

Implementation target:

- Restrict detailed metadata to approved admins, hide it in production, or return only minimal health information publicly.
- Avoid exposing git SHA, deployment provider details, or environment names to unauthenticated users unless there is a product requirement.

#### 25. Add private no-store response helpers

Problem: sensitive JSON APIs should explicitly prevent browser/proxy caching.

Implementation target:

- Add a shared helper for private JSON responses with `Cache-Control: private, no-store`.
- Apply it to authenticated search, analytics, document metadata, and admin APIs.

## Recommended implementation order

1. Phase 1 account setup and API authorization.
2. Phase 2 webhook/upload/export hardening.
3. Phase 3 billing and mission integrity, starting with low-risk guarded updates if RPC work is too broad.
4. Phase 4 permission matrix gaps.
5. Phase 5 accessibility fixes.
6. Phase 6 performance/dependency cleanup.
7. Phase 7 database/RLS and metadata hardening.

## Validation checklist

Run these commands from the repo root when practical:

```bash
npm install
npm run lint
npm run build
```

Also run targeted checks depending on the files changed:

```bash
git diff --check
npm run typecheck
npm test
```

If the environment has Node/npm dependency issues, document the exact Node version, npm command, and error output. Do not treat a dependency-install failure as proof the code is safe; rerun in a clean Node version compatible with the repo.

## Final self-review checklist

Before handing back:

- Confirm no secrets or generated folders are committed.
- Confirm protected APIs reject unauthenticated and non-approved users.
- Confirm approved users retain expected access.
- Confirm super-admin behavior matches admin page behavior where intended.
- Confirm billing send actions do not mark records as sent after failed email delivery.
- Confirm public upload routes reject oversized/rate-limited requests.
- Confirm accessibility changes work with keyboard-only navigation.
- Confirm `npm run lint` and `npm run build` results are documented.
- Confirm any deferred high-risk database/RPC/RLS work is explicitly documented with migration risks.
