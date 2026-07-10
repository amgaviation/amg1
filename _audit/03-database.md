# Phase 3 — Database Access Audit

## 1. Database connections & credentials

One Supabase Postgres project. Two application clients, both in `lib/supabase/server.ts`:

| Client | Key | RLS | Where used |
|---|---|---|---|
| `createClient()` (+ browser `lib/supabase/client.ts`, `proxy.ts`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (**public**, shipped to browser) | **Enforced** | ~9 server call sites + middleware + all client-side reads |
| `createServiceClient()` | `SUPABASE_SERVICE_ROLE_KEY` (**secret**) | **BYPASSED** | **64 server call sites** — nearly every portal action + several API routes + `admin/system-health` + 2 scripts |

There is **no per-surface DB credential separation**: public-site code paths, portal, and admin all use the same two keys with the same (full) privileges. The service-role key is a single god-credential for the entire schema.

## 2. Key question — does public code share admin DB privileges?

**Yes.** Every surface draws on the same two credentials. The service-role key (full read/write/delete on all tables, RLS bypass) is imported by public-reachable code paths too — e.g. `app/api/compliance/consent` and the pilot-application pipeline use `createServiceClient()`. There is no least-privilege boundary between "public can touch these 3 tables read-only" and "admin can touch everything."

## 3. RLS posture — the central database finding

RLS is applied **only to newer feature tables** (18 migrations, 73 policies): billing_documents, communication_*, contact_form_submissions, subscription_*, compliance_*, consent_events, network_application*, partner_profiles, payments, invoices, quote_templates, website_content_drafts, etc.

The **core operational tables defined in `docs/AMG_PORTAL_DATA_MODEL.sql` have ZERO RLS** (`grep` for "enable row level security" in that file = 0). These include:

> `accounts, organizations, memberships, aircraft, aircraft_access, documents, messages, message_threads, support_requests, assignments, approvals, crew_profiles, crew_qualifications, passenger_profiles, permission_overrides, audit_events, finance_packets` — and by extension `profiles`, `missions`, `quotes`, `expenses`, `crm_leads`, `notifications` referenced throughout the app.

### Why this is Critical (pending live verification)

The anon key is **public** (it ships in the browser bundle as `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Supabase exposes a REST/`postgrest` endpoint at `https://<project>.supabase.co/rest/v1/<table>` that accepts that anon key directly. **If RLS is not enabled on these tables in the live database, anyone who extracts the anon key from the site can read/write the entire client, crew, document-metadata, and messaging dataset directly — bypassing the Next.js app, its `requireRole` guards, and every hand-written ownership check.** That is a full PII/data breach path (names, emails, phones, home bases, mission history, quotes, message bodies).

**Important caveat:** I audited the repo, not the running database. RLS could conceivably have been enabled directly in the Supabase dashboard and not captured in a migration. This **must be verified against the live project** before drawing a final conclusion — it is the #1 `[MANUAL]` item. The app's heavy reliance on the service-role client (which works regardless of RLS) is consistent with RLS being off on core tables, which raises the likelihood.

## 4. Table access by surface (static analysis)

- **Public site → DB:** `contact_form_submissions`, `public_support_requests`, `consent_events`, `marketing_consents`, `network_applications(+files)`, and inserts into `profiles` (access requests). Writes go through server actions / API routes using the **service-role** client (consent, pilot apps).
- **Portal (client/crew/partner) → DB:** their own `profiles`, `missions`, `quotes`, `invoices`/`billing_documents`, `documents`, `messages`/`thread_members`, `passengers`, `expenses`, `subscriptions` — all via **service-role** with in-app ownership filters.
- **Admin → DB:** effectively every table via service-role.

## 5. Sensitive tables/columns

- **PII:** `profiles` (email, phone, full_name, company, home_base), `crew_profiles`/`passenger_profiles`, `network_applications` (applicant PII + uploaded resumes/certs), `crm_leads`.
- **Financial:** `invoices`, `payments`, `billing_documents`, `subscription_billing_invoices`, Stripe IDs.
- **Auth-adjacent:** `portal_password_setup_tokens` (password-setup tokens — confirm hashed & single-use), `portal_user_status_events`.
- No evidence of app-stored plaintext passwords (Supabase Auth owns credentials). Stripe secrets/keys are env-based, not in DB. Confirm password-setup tokens are not stored in a reversible/guessable form.

## 6. SQL injection posture

- Queries use the Supabase query builder / PostgREST filters — **parameterized by default**; no raw string-concatenated SQL found in app code.
- **One caveat:** `/api/portal/search` builds PostgREST `.or("col.ilike.%${q}%,...")` filter **strings** from user input `q`. This is *filter injection* territory (a crafted `q` with commas/parentheses could alter the filter set), not classic SQLi. Admin-only, so impact is bounded, but `q` should be sanitized/escaped for PostgREST reserved characters. Low–Medium.

## 7. Proposed least-privilege DB user matrix (for Pass 2, Phase C)

This is a **codebase-side** connection-context design; creating the roles/GRANTs on the server is `[MANUAL]`.

| Context | DB role | Privileges (target) |
|---|---|---|
| Public site | `web_public` | INSERT-only on `contact_form_submissions`, `public_support_requests`, `consent_events`, `marketing_consents`, `network_applications(+files)`; SELECT on published website content. No access to `profiles`/financial/messaging. |
| Portal (client/crew/partner) | `web_portal` | SELECT/INSERT/UPDATE constrained by RLS on the user's own rows across operational tables; no DELETE; no admin-only tables. |
| Admin | `web_admin` | Full DML on operational tables (still under audit logging). |
| Break-glass / migrations | `service_role` | Retained but removed from public/portal code paths; used only by trusted admin server actions after role verification. |

**Prerequisite for the matrix to mean anything: enable RLS on every core table first.** Without RLS, splitting connection roles in the app is cosmetic because the public anon key still reaches PostgREST directly.

## Phase 3 findings (to REPORT.md)

| # | Severity | Finding |
|---|---|---|
| D-1 | **Critical** (verify live) | Core operational tables (profiles, missions, quotes, documents, messages, etc.) appear to have **no RLS**; public anon key could read/write them directly via PostgREST, bypassing the app entirely. |
| D-2 | High | Single shared service-role "god" credential used by 64 sites incl. public-reachable paths; no least-privilege separation between surfaces. |
| D-3 | High | Data isolation for RLS-less tables depends solely on app-layer ownership checks under service-role — no defense in depth. |
| D-4 | Low–Med | PostgREST `.or()` filter built from unsanitized user input in admin search (filter-injection). |
| D-5 | Med | Confirm `portal_password_setup_tokens` are hashed, single-use, and short-TTL. |
