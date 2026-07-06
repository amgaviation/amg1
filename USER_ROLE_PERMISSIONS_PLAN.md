# User Role Permissions Plan (AMG Connect Portal)

> **Provenance:** the original `USER_ROLE_PERMISSIONS_PLAN.md` referenced by `LOOP_PLAN.md` was not
> present in the repository, uploads, or git history at run time (2026-07-06). This document is a
> faithful reconstruction assembled from the decided points spelled out in `LOOP_PLAN.md` §1b/§4b,
> `docs/role-access-matrix.md`, and the existing `actor()` / `requireRole()` auth layer. It is the
> specification the implementation in this branch was built against.

## Goal

A database-backed, super-admin-editable permission matrix — **role × module × action** — layered on
top of the existing coarse role gates (`actor()`, `requireRole()`), so AMG can tune what each portal
role (client, crew, partner, admin) can see and do without code changes.

## Model

- **Roles:** `client`, `crew`, `partner`, `admin`. `super_admin` always has full access, is not
  editable in the matrix, and can never be locked out.
- **Modules:** business areas of the portal (missions, quotes, invoices, documents, …). Catalog
  lives in `lib/portal/permissions-catalog.ts`.
- **Actions:** `view`, `add`, `edit`, `delete`.
  - `view` covers list, search, and detail.
  - `copy`/duplicate maps to `add`.
- **Resolution order** for `can(role, module, action)`:
  1. `super_admin` → always allow.
  2. Row in `role_permissions` for (role, module) → use its flags.
  3. No row → fall back to `DEFAULT_PERMISSIONS` in code.
  4. Not in defaults either → **deny**.
- DB read failures (table missing, no service key) fail safe to code defaults — never a crash.

## Phases

### Phase 1 — Foundation (zero behavior change)
- Migration `role_permissions`: additive table + seed generated from `DEFAULT_PERMISSIONS`.
  No changes to existing tables. RLS enabled; reads restricted to admin roles; writes go through
  the service-role client only.
- `lib/portal/permissions-catalog.ts`: module catalog, action list, `DEFAULT_PERMISSIONS`
  (pure data — importable from client components and scripts).
- `lib/portal/permissions.ts`: `can()`, `requirePermission()`, cached matrix loader
  (`unstable_cache` + `revalidateTag("role-permissions")`).

### Phase 2 — Admin UI
- `/portal/admin/settings/permissions`: matrix page (rows = modules, columns = actions, one panel
  per role). Visible to admin + super_admin; **saving is super_admin only**.
- Toggle dependencies in the UI: turning View off clears Add/Edit/Delete; turning Add/Edit/Delete
  on forces View on.
- Save is a server action guarded by `super_admin`; writes an `audit_events` entry recording
  old → new per changed cell; calls `revalidateTag("role-permissions")`.

### Phase 3 — Enforcement
- `actor(roles?, perm?)`: optional `perm` argument (`"module.action"`). Checked after the existing
  role gate; failure redirects to the no-access page.
- Wire call sites module-by-module: quotes → invoices → missions → documents → rest.
- Page guards: `requirePermission("module", "view")` on module landing/detail pages.

### Phase 4 — UI polish
- Portal nav filtered by `view` permission (server-side, passed into the shell).
- `/portal/no-access` page: clear notice, not an error page, with a path back to the dashboard.
- Hide buttons/actions the role cannot perform where low-risk.

## Default matrix (summary)

- **admin:** full access to every module; `audit_log` and `financial_analytics` are view-only.
- **client:** own missions (view/add/edit), quotes (view/respond), invoices (view), subscriptions
  (view/add/edit own), aircraft (view/add/edit), passengers (full, own), documents (view/add),
  messages (view/add), notifications (view/mark-read). No CRM, no directory, no admin surfaces.
- **crew:** assignments (view/respond), own crew records — availability/credentials (view/add/edit/
  delete own), expenses (full, own), documents (view/add), messages, notifications. No invoices,
  no CRM, no directories.
- **partner:** partner workspace — own profile/requests/responses (view/add/edit), documents
  (view/add), messages, notifications. Nothing else.
- Missing (role, module) pair = deny.

Ownership scoping (own records only) remains enforced by the individual actions and RLS — the
matrix is a role-level gate layered on top, not a replacement for row-level checks.

## Verification

Per phase: `npm run lint && npm run typecheck && npm run test && npm run build`, then commit.
After implementation: one §4b five-agent review pass (see LOOP_PLAN.md), P0/P1 fixed immediately.
