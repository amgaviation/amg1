# AMG Portal v4 — QA-DB Audit (schema ↔ query, RLS, integrations, architecture)

Branch: `rebuild/portal-v4` · Supabase project `vsynqnqlouvphiniqaiy` · Read-only audit, no code/DB changes made.
Date: 2026-07-05. Method: `list_tables`, SELECT-only `execute_sql` (schema, pg_policies, pg_constraint, pg_proc, migration ledger), `get_advisors` (security + performance), source read of `lib/portal/*` + `app/portal/admin/**`.

Scope pulled: 58 public tables, all RLS policies, all FK constraints, all SECURITY DEFINER functions, applied-migration ledger, Stripe webhook path, and the query/domain modules named in the work order.

## Severity summary
- **P1 (breaks operations): 3**
- **P2 (risk): 3**
- **P3 (hygiene): 7**

Contract checks that PASS (called out because they were in scope):
- Every Supabase embed in `queries.ts` / domain modules uses column-name form (`client:client_id(...)`, `owner:owner_id(...)`, `assignee:assigned_to(...)`) — no FK-name-form embeds. Manifest contract #6 upheld.
- Every embed resolves to a real FK (validated against `pg_constraint`): missions/quotes/invoices/payments/billing_documents/crm_leads/ops_tasks/mission_* all have backing FKs to the referenced tables. No PGRST200 risk in the read layer.
- `SUBSCRIPTION_STATUS` in `lib/portal/constants.ts:479` is an exact 1:1 match with the DB `client_subscriptions_status_check` constraint (15 values incl. both `canceled`/`cancelled`). No drift.
- Stripe webhook idempotency is anchored on a real unique index `stripe_webhook_events_stripe_event_id_key`; event switch enumerates subscription + invoice + payment_intent types with an `ignored` fallthrough (`stripe-invoices.ts:268`).

---

## P1 — breaks operations

### P1-1. Communications Center never migrated — admin Emails and Messages pages crash
Evidence:
- Migrations `20260620043000_portal_communications_center.sql` and `20260627150000_email_communications_log_metadata.sql` exist in `supabase/migrations/` but are **absent from the applied ledger**. SQL: `select count(*) ... table_name like 'communication%'` → `0`; `schema_migrations` has 38 rows, latest `20260704181317`, and neither comms version is present.
- `lib/portal/communications.ts` queries `communication_threads`, `communication_messages`, `communication_templates`, `communication_attachments`, `communication_audit_log` — none exist in `public`.
- `app/portal/admin/communications/emails/page.tsx:65` runs `Promise.all([listCommunicationTemplates(), listCommunicationRecordOptions(), listEmailCommunicationLogs(...)])`; `listEmailCommunicationLogs` selects from `communication_messages` (`communications.ts:~351`) and `listCommunicationTemplates` selects from `communication_templates`.
- `app/portal/admin/messages/page.tsx:428` runs `listCommunicationThreads(params)` + `listCommunicationTemplates()`.
- Also wired to absent tables: `app/api/communications/send/route.ts`, `app/api/webhooks/email/inbound/route.ts`, `app/api/webhooks/email/status/route.ts`, `app/api/communications/attachments/[id]/route.ts`.

Impact: DECK_NAV admin "Comms & Files → Emails" and "→ Messages" both throw `relation "public.communication_*" does not exist` at render; inbound/status email webhooks 500. A whole nav group is dead.
Fix: apply the two communications migrations to `vsynqnqlouvphiniqaiy` (they're already authored) and re-run `get_advisors` to attach RLS policies to the new tables; or, if the feature is deferred for v4, gate the two nav items + routes behind a feature flag so they don't render. Prefer applying the migrations since the code is complete.

### P1-2. `profiles` self-service UPDATE allows role/status privilege escalation
Evidence:
- Policy `profiles_update_own`: `cmd=UPDATE`, `USING (id = auth.uid())`, **`WITH CHECK` empty** (so Postgres reuses USING — the new row only has to keep `id = auth.uid()`, nothing constrains `role`/`status`).
- Column privileges: `authenticated` (and `anon`) hold `UPDATE` on `profiles.role`, `profiles.status`, `profiles.assigned_role`, `profiles.is_active`, etc. (from `information_schema.column_privileges`).
- `profiles_role_check` permits `admin`/`super_admin`; `get_my_role()` and `is_admin()` read `profiles.role`; those gate aircraft/missions/quotes/invoices/documents policies.
- Only trigger on the table is `set_updated_at` — no role-change guard.

Impact: any signed-in client/crew/partner can `PATCH /rest/v1/profiles?id=eq.<self>` with `{"role":"admin"}` (anon key is public in the browser) and become an admin, unlocking every `is_admin()`-gated table. Critical horizontal→vertical escalation.
Fix: add a restrictive `WITH CHECK` to `profiles_update_own` that pins immutable columns to their old values (e.g. enforce `role = get_my_role()` and `status` unchanged), or `REVOKE UPDATE (role, status, assigned_role, is_active, ...) ON profiles FROM authenticated, anon` and route those mutations exclusively through the service-client admin flow. Belt-and-suspenders: a BEFORE UPDATE trigger rejecting role/status changes not made by an admin.

### P1-3. `access_requests` exposes all applicant PII to anon via a leftover debug policy
Evidence:
- Policy `access_requests_public_select_debug`: `cmd=SELECT`, `roles={anon,authenticated}`, `USING (true)`.
- `access_requests` columns include `full_name, email, phone, company_name, business_purpose, operational_notes, admin_notes, decision_notes`.

Impact: anyone holding the public anon key can `GET /rest/v1/access_requests` and read every access request in full — names, emails, phones, internal admin/decision notes. PII + internal-notes leak.
Fix: `DROP POLICY access_requests_public_select_debug`. Public signup only needs INSERT (already covered by `access_req_insert_anon` / `access_requests_public_insert`); status lookups go through `access_request_status` by token. Admin reads stay under `access_req_admin`.

---

## P2 — risk

### P2-1. Stripe webhook: a failed first attempt is never reprocessed on retry (idempotency gap)
Evidence (`lib/portal/stripe-invoices.ts:232-264`): the handler INSERTs the event row (`status='processing'`) **before** processing; on unique-violation `23505` it returns `{duplicate:true}` (→ HTTP 200). If `handleStripeEvent` then fails, the row is updated to `status='failed'`/left `processing` and the route returns non-2xx, so Stripe retries — but the retry hits the pre-existing row, short-circuits at the `23505` duplicate check, and returns 200 **without reprocessing**.
Impact: a transient failure (Stripe API blip, DB timeout, downstream error) permanently drops that event — an `invoice.paid` or `customer.subscription.updated` can be silently lost, leaving portal billing state stale vs Stripe. On live billing this is a real money/state-drift risk.
Fix: only treat an event as a duplicate when its stored `status IN ('processed','ignored')`. On `23505`, re-select the row and if `status IN ('processing','failed')` re-run the handler (or return non-2xx to force another Stripe retry). Alternatively upsert with `status='processing'` and gate processing on a successful state transition.

### P2-2. Dual identity source of truth (`users`/`amg_operations` vs `profiles`/role) — dead + broken admin plumbing
Evidence:
- Locked role vocab is `client/crew/admin/partner/super_admin` (`profiles_role_check`), but a parallel `public.users` table keys off `role='amg_operations'` + `approval_status='approved'`.
- `is_amg_admin()` (SECURITY DEFINER) reads `public.users`/`amg_operations`; it gates the `users` table policies and the `access_requests` policy "Admins can read access requests".
- The RPCs `approve_access_request` / `reject_access_request` (SECURITY DEFINER) authorize via `is_amg_admin()`, INSERT into `public.users`, and INSERT into `public.audit_logs` — **`audit_logs` does not exist** (the real table is `audit_events`). So if these RPCs were ever invoked they'd throw.
- The v4 portal does **not** call these RPCs (`grep '.rpc(' app lib` → none), so the approval UI presumably uses the service client instead; the `users`-based policies and `amg_operations` gate are orphaned.
Impact: two competing role systems create confusion and latent breakage; any code path that still leans on `is_amg_admin()`/`users` will silently mis-authorize (no `amg_operations` rows in the locked schema) and the approve/reject RPCs are landmines.
Fix: standardize on `profiles.role`. Migrate/retire `public.users`, `is_amg_admin()`, and the `amg_operations` policies; rewrite or drop the four legacy RPCs (see P3-1). Repoint the `access_requests` admin-read + `users` policies at `get_my_role() IN ('admin','super_admin')`.

### P2-3. Unindexed foreign keys on billing/CRM/mission join paths (58 flagged)
Evidence (performance advisor `unindexed_foreign_keys`, 58 total). Hot-path examples used by the read layer's joins/filters: `invoices_created_by/_aircraft_id/_pdf_document_id`, `quotes_converted_invoice_id/_created_by/_approved_by`, `documents_mission_id/_uploaded_by/_reviewed_by` (filtered in `listAllDocuments`), `crm_leads_owner_id/_converted_profile_id` (embedded in `crm.ts` LEAD_SELECT), `payments_recorded_by/_receipt_document_id`, `subscription_credits_applied_to_invoice_id`, `mission_partner_assignments`/`ops_tasks_assigned_to`. (High-traffic filter columns `*_client_id`, `*_mission_id` are already indexed.)
Impact: sequential scans on detail pages that fan out many joins (`getInvoiceDetail`, `getSubscriptionDetail`) and on `documents`/CRM filters; degrades as tables grow.
Fix: add btree indexes on the flagged FK columns actually used in joins/filters; skip the purely-audit ones (e.g. `*_superseded_by_*`) if you want to limit index bloat. See remediation: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

---

## P3 — hygiene

### P3-1. Orphaned/broken SECURITY DEFINER RPCs referencing non-existent tables
`approve_access_request`, `reject_access_request`, `assign_crew_to_trip`, `update_trip_status`, `upsert_crew_availability` reference tables/columns that don't exist in this schema: `public.audit_logs` (→ `audit_events`), `public.trips` (→ `missions`), `public.crew_assignments` (→ `mission_crew_assignments`), and `crew_availability(crew_user_id, available_date)` (actual columns `crew_id, start_date, end_date`). Not called by the portal. All are EXECUTE-grantable by `anon` + `authenticated` (advisor lints 0028/0029) — attack surface for no benefit.
Fix: DROP the dead RPCs (or fix + `REVOKE EXECUTE FROM anon, authenticated` if still needed). Ref: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

### P3-2. RLS enabled but no policy on 4 tables
`billing_document_sequences`, `message_threads`, `notification_deliveries`, `organizations` (advisor `rls_enabled_no_policy`). All are currently accessed only via the service client (`queries.ts`, `notification-delivery.ts`), so no functional break today, but it's an inconsistent defense-in-depth gap — note `messages` and `thread_members` *do* have policies while their parent `message_threads` has none, and `profiles.organization_id` embeds would return zero rows under any future authenticated-client read.
Fix: add explicit policies (admin-all + owner/member-scoped SELECT for `message_threads`/`notification_deliveries`; admin-only for `organizations`; deny-all/service-only intent documented for `billing_document_sequences`). Ref: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

### P3-3. `function_search_path_mutable` on ~14 functions
Incl. `get_my_role`, `is_amg_admin`, `sync_access_request_status`, the access-request RPCs, and the `set_*_updated_at` triggers (advisor lint 0011). `is_admin`/`handle_new_user` already set `search_path='public'`; the rest don't.
Fix: `ALTER FUNCTION ... SET search_path = public` (or `pg_catalog, public`) on each. Ref: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

### P3-4. RLS performance lints at scale
`auth_rls_initplan` on 68 policies — many policies call `auth.uid()`/`is_admin()` directly instead of `(select auth.uid())`, so the function re-evaluates per row (heaviest: `expenses` ×4, `missions`/`billing_documents`/`users` ×3). Newer policies (`partner_profiles`, `network_applications`, `public_support_requests`) already use the `(select auth.uid())` form — the older ones don't.
`multiple_permissive_policies` on 58 combinations — overlapping permissive policies force Postgres to OR-evaluate all of them per query (heaviest: `profiles` ×10, `access_requests` ×7, and `aircraft`/`quotes`/`crew_credentials`/`quote_line_items`/`mission_passengers` ×5 each).
Fix: wrap `auth.uid()` as `(select auth.uid())` in policy expressions; consolidate duplicate/legacy permissive policies (e.g. `access_requests` has both `access_req_admin` and the `users`-based "Admins can read", plus the debug SELECT from P1-3). Refs: lint 0003 (initplan) and 0006 (multiple permissive).

### P3-5. 87 unused indexes
Advisor `unused_index` flags 87 indexes with zero scans. Some are new tables with no traffic yet (keep), but review for dropped/duplicate indexes to cut write overhead and storage. Ref: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

### P3-6. Auth: leaked-password protection disabled
`auth_leaked_password_protection` WARN — HaveIBeenPwned check is off. Enable in Auth settings for portal accounts. Ref: https://supabase.com/docs/guides/auth/password-security

### P3-7. Duplicated/mirror data structures
`access_request_status` mirrors `access_requests` (status/stage/message) kept in sync by trigger `trg_sync_access_request_status` → `sync_access_request_status()`; and `public.users` duplicates `profiles` identity (see P2-2). These are two-source-of-truth smells: the status mirror is defensible (token-scoped anon read surface) but should be documented as derived; the `users` table should be retired.

---

## Notes / method caveats
- `get_advisors(performance)` output (271 lints) exceeded the tool's inline limit and was read from the saved file and aggregated with a script (counts by lint type + per-table breakdown); security advisor read inline in full.
- Read layer (`queries.ts`) intentionally uses `createServiceClient()` (documented at top of file), so RLS is defense-in-depth for the server pages; the RLS findings above matter for (a) any direct authenticated-client/PostgREST access [P1-2, P1-3 are reachable that way] and (b) correctness of the policy model. All server reads validated for column/embed parity against live schema.
