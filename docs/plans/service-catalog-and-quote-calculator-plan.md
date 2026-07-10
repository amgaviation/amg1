# Service Catalog + Quote Calculator — Implementation Plan

Status: PLAN (not yet implemented) · Author: Claude · Date: 2026-07-06
Decisions confirmed by Tony: recurring quote lines auto-create subscriptions on approval;
services eagerly sync to Stripe Products/Prices on save; calculator sits alongside the
free-form line editor; catalog is portal-only (public `lib/plans.ts` untouched for now).

---

## 1. What exists today (baseline)

- `quotes` + `quote_line_items`: manual free-form line composition. Categories and cost
  types are static enums (`QUOTE_CATEGORIES`, `BILLING_COST_TYPES` in
  `lib/portal/constants.ts`). Full lifecycle: draft → internal_review → sent → viewed →
  approved/rejected/revision_requested → converted/void, with revisions, deposits, PDF
  generation (`lib/portal/billing-pdfs.tsx`), numbering (`billing-numbering.ts`), and
  convert-to-invoice (`billing-documents.ts`).
- `invoices` + `invoice_line_items` + `payments`, `billing_documents`, `billing_settings`.
- `subscription_plans` + `subscription_plan_tiers` + `client_subscriptions` (+ usage
  events, credits, custom/test subscription columns) with Stripe sync
  (`stripe-subscription-core.ts`, `stripe-custom-subscriptions.ts`, `stripe-mode.ts`).
- Server actions in `app/portal/actions/quotes.ts` (~478 lines): service-role Supabase
  client, audit logging, notifications, compliance evidence on approval.
- **No service catalog exists.** Every quote is hand-keyed. There is no pricing engine,
  no variable-driven pricing, and no path from a quote's recurring charges into a
  subscription without re-keying.

Reference-doc note (`docs/amg-aviation-group-reference.md`): the doc's launch pricing
table (On-Demand/Standard/Priority, Band A/B) has already been superseded in practice by
the richer structure in `lib/plans.ts` / `subscription_plan_tiers` (7 aircraft
categories, Basic/Core tiers, flight allowances). Per Tony's instruction the
"buy-don't-build portal" guidance is waived for this feature. **Action item:** update the
reference doc's Pricing section in the same workstream so the catalog becomes the durable
record. Two rules from the doc that we KEEP as hard constraints because they are the
business model, not process preferences:

1. **AMG margin lives only in flat coordination fees and retainers.** Pass-through costs
   (pilot day rate, travel, lodging, per diem) carry zero markup, itemized, receipts at
   closeout.
2. **Quotes mirror invoices line-for-line**, with the standing flat-fee/pass-through
   statement.

The catalog is designed to make these rules structurally enforceable instead of
convention-enforced.

---

## 2. Design principles

1. **Snapshot, never reference-at-render.** Quote/invoice line items copy price, name,
   and computed inputs at creation time. Editing a service never mutates an existing
   quote, invoice, or subscription.
2. **Server is the source of truth for math.** The calculator previews prices
   client-side, but the server recomputes every catalog-sourced line from the catalog +
   submitted inputs on save. Client-submitted prices are only trusted for free-form lines.
3. **One pricing engine, pure functions.** `lib/portal/pricing-engine.ts` has zero I/O —
   it takes (service definition, variant set, variables, context) and returns priced
   lines. Used by the client preview, the server action, and unit tests. This is the
   single most important file to get right.
4. **Additive-only migrations**, per repo convention. New tables + nullable columns on
   existing tables. Check live schema (`supabase migration list`) before applying.
5. **Cost-type integrity.** Every service is permanently typed `coordination` (AMG
   revenue), `pass_through` (zero-markup estimate), or `plan_fee` (retainer). The engine
   propagates this to line items so analytics, invoices, and the flat-fee statement stay
   truthful automatically.
6. **Archive, never delete.** Services referenced anywhere are archivable but not
   deletable. Price changes create new effective-dated rows, preserving history.

---

## 3. Data model (new migration: `services_catalog_and_quote_calculator.sql`)

### 3.1 `services` — the catalog

| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| code | text unique | stable handle, e.g. `COORD-MISSION`, `PLAN-CORE-PISTON`, `SETUP-ONBOARD` |
| name | text | admin + client-facing name |
| description | text | internal |
| client_description | text | line-item description shown on PDFs |
| category | text | reuses `QUOTE_CATEGORIES` values so existing grouping/PDF logic works |
| cost_type | text check | `coordination` \| `pass_through` \| `plan_fee` |
| status | text check | `draft` \| `active` \| `archived` (default `draft`) |
| pricing_model | text check | `flat` \| `per_unit` \| `variant_matrix` \| `passthrough_estimate` |
| unit | text | `mission`, `day`, `hour`, `leg`, `nm`, `flight`, `month`, `occurrence`… |
| default_unit_price | numeric(12,2) | used when no variant matches / flat model |
| frequency | text check | `one_time` \| `per_mission` \| `recurring` |
| recurring_interval | text | `month` \| `year` (null unless recurring) |
| recurring_interval_count | int default 1 | e.g. 3 = quarterly |
| min_quantity / max_quantity | numeric | validation bounds |
| taxable | boolean default false | seeds line-item default |
| client_visible | boolean default true | seeds line-item default |
| billable | boolean default true | pass-through estimates stay billable; informational services can be false |
| requires_deposit_percent | numeric | optional: suggests deposit when present on a quote |
| linked_plan_tier_id | uuid → subscription_plan_tiers | if set, quoting this service creates a **plan-based** subscription instead of a custom one |
| notes_internal | text | |
| sort_order | int | picker ordering |
| stripe_product_id_test / stripe_product_id_live | text | eager sync (see §8) |
| stripe_sync_status | text check | `pending` \| `synced` \| `error` \| `not_applicable` |
| stripe_sync_error | text | surfaced in UI |
| created_by / created_at / updated_at | | standard |

### 3.2 `service_price_variants` — the price matrix

Handles band/category × plan-tier × effective-date pricing (e.g. coordination fee is
$495/$295/$195 depending on member tier, and differs by aircraft band).

| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| service_id | uuid → services cascade | |
| label | text | e.g. "Band B · Priority member" |
| aircraft_category | text null | matches `AircraftCategoryId` values in `lib/plans.ts`; null = any |
| aircraft_band | text null check | `A` \| `B` — coarse band for fee-schedule services; null = any |
| plan_tier_match | text null | matches client's active plan tier id/name; null = any (non-members resolve here) |
| unit_price | numeric(12,2) | |
| annual_price | numeric(12,2) null | for recurring services with annual option |
| effective_from | date default current_date | |
| effective_to | date null | close out old prices instead of editing |
| stripe_price_id_test / stripe_price_id_live | text | one Stripe Price per variant per mode (recurring + fixed one-time only) |
| sort_order, created_at, updated_at | | |

Variant resolution (engine): filter variants where each non-null axis matches the quote
context and `effective_from <= today < coalesce(effective_to, ∞)`; pick the most
specific match (most non-null axes), tiebreak by `sort_order`. No match → fall back to
`default_unit_price` and flag the line "unpriced variant" in the UI.

### 3.3 `service_variables` — calculator inputs

| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| service_id | uuid → services cascade | |
| key | text | `days`, `legs`, `distance_nm`, `crew_count` (unique per service) |
| label | text | prompt shown in calculator |
| input_type | text check | `number` \| `select` \| `boolean` |
| options | jsonb null | for selects: `[{value, label, multiplier?}]` |
| default_value | text | |
| min_value / max_value | numeric | |
| role | text check | `quantity` \| `multiplier` \| `info` — v1 keeps math structured: quantity variables multiply unit price; multiplier variables scale the line (e.g. 2-crew ×2, rush ×1.25); info variables are captured but don't price |
| required | boolean default true | |
| sort_order | int | |

Deliberately **no free-form formula strings in v1.** `quantity × unit_price ×
multipliers` covers the AMG fee schedule, day-rate estimates, and plan fees. A
`formula` jsonb column can be added later (additive) if a real case demands it — a safe
expression evaluator is a phase-4 problem, not a launch problem.

### 3.4 `service_attachments` — fees attached to other services

The "attach a one-time fee to a recurring charge" requirement, generalized to bundles.

| column | type | notes |
| --- | --- | --- |
| id | uuid pk | |
| parent_service_id | uuid → services cascade | |
| child_service_id | uuid → services | e.g. one-time onboarding fee |
| attachment_mode | text check | `required` (auto-added, not removable) \| `default_on` (auto-added, removable) \| `suggested` (offered) |
| quantity | numeric default 1 | |
| price_override | numeric null | bundle pricing, e.g. waived setup = 0 |
| sort_order | int | |

Cycle guard: constraint/trigger or application check preventing self/circular chains
(depth-1 expansion only in v1 — attachments of attachments are not expanded).

### 3.5 Additive columns on existing tables

`quote_line_items`:
- `service_id` uuid null → services (set null on delete — snapshots survive)
- `service_variant_id` uuid null
- `billing_frequency` text default `'one_time'` check (`one_time` | `per_mission` | `recurring`)
- `recurring_interval` text null, `recurring_interval_count` int null
- `calculator_inputs` jsonb null — snapshot of variable values + resolved context
  (band, tier, effective price date) for audit/reprice
- `price_locked` boolean default true — reserved for a future "reprice from catalog" action

`invoice_line_items`: same five service columns (invoices mirror quotes line-for-line).

`quotes`:
- `recurring_total_monthly` numeric(12,2) default 0 and `recurring_total_annual`
  numeric(12,2) default 0 (denormalized display totals; `total` continues to mean the
  one-time/first-invoice total so existing invoice conversion math is untouched)
- `converted_subscription_id` uuid null → client_subscriptions

`client_subscriptions`:
- `source_quote_id` uuid null → quotes
- `line_items_snapshot` jsonb null — the recurring quote lines that formed it

### 3.6 RLS

Follow the `subscription_plans` pattern exactly: admin `for all`; `active`-status read
for authenticated (clients see service names/descriptions rendered in their quote views;
raw catalog admin pages are role-gated in the route layer as today). Variants, variables,
attachments: admin all + read-if-parent-active. `super_admin` inherits via existing
role checks — do not add roles (`profiles.role` is DB-constrained).

---

## 4. Pricing engine (`lib/portal/pricing-engine.ts`)

Pure module, no I/O, fully unit-testable:

```
type PricingContext = {
  aircraftBand?: "A" | "B";
  aircraftCategory?: AircraftCategoryId;
  planTier?: string | null;        // client's active subscription tier (or null)
  asOfDate: string;                // effective-date pricing
};

resolveVariant(service, variants, ctx) -> { variant | null, fallbackUsed: boolean }
priceService(service, variants, variables, inputs, ctx) -> PricedLine
expandAttachments(service, attachments, allServices, ctx) -> PricedLine[]
computeQuoteTotals(lines) -> {
  oneTimeSubtotal, recurringMonthly, recurringAnnual,
  coordinationTotal, passThroughTotal, planFeeTotal,   // cost-type split
  suggestedDeposit
}
```

`PricedLine` carries everything `quote_line_items` needs, including
`calculator_inputs`, `cost_type`, `billing_frequency`, and a human-readable
`price_explanation` string ("$295 × 1 mission — Band A, Standard member rate,
effective 2026-07-01") that shows in the admin UI and internal notes.

Server-side recompute rule: on quote create/update, any submitted line with a
`service_id` is re-priced by the engine from the DB catalog and the submitted
`calculator_inputs`; the submitted amount is discarded. Lines without `service_id`
(free-form) keep today's behavior byte-for-byte. This makes the calculator additive and
non-breaking.

---

## 5. Services admin UI — `/portal/admin/financial/pricing`

Routes (server components + server actions, matching existing admin CRUD patterns —
`PageHeader`, `SectionCard`, `DataTable`, `TextField`/`SelectField`/`CheckboxField`,
`--deck-*` tokens only, no per-page styling):

- `app/portal/admin/financial/pricing/page.tsx` — catalog list. Columns: code, name,
  category, cost type, frequency, price summary ("$295–$495 by tier" / "$149/mo"),
  variant count, Stripe sync badge, status. Filters: status, category, cost type,
  frequency. Row actions: edit, duplicate, archive/restore.
- `app/portal/admin/financial/pricing/new/page.tsx` and
  `app/portal/admin/financial/pricing/[id]/edit/page.tsx` — one form, sections:
  1. **Identity** — code, name, category, descriptions, status, sort order.
  2. **Financial classification** — cost_type (with inline explanation of the
     flat-fee/pass-through rule), taxable, billable, client_visible.
  3. **Pricing** — pricing_model, unit, default price; **variant matrix editor**:
     repeatable rows (band, aircraft category, plan tier, unit price, annual price,
     effective from/to). Editing an active variant's price closes it
     (`effective_to = today`) and inserts a new row — never in-place mutation once the
     service has ever been quoted.
  4. **Frequency & billing** — one_time / per_mission / recurring; interval +
     count; annual-option toggle; deposit suggestion percent; linked plan tier
     (dropdown of `subscription_plan_tiers`) for membership services.
  5. **Variables** — repeatable rows (key, label, type, role, default, bounds, options).
  6. **Attached services** — picker of other active services with mode
     (required/default_on/suggested), quantity, price override. Shows a computed
     "quoting this adds:" preview.
  7. **Stripe** — read-only sync panel: product/price IDs per mode, sync status, error,
     "retry sync" action.
- `app/portal/admin/financial/pricing/[id]/page.tsx` — detail view: definition, price
  history timeline, usage ("quoted N times, on M active subscriptions"), audit trail.

Server actions in `app/portal/actions/services.ts`: `createService`, `updateService`,
`archiveService`, `duplicateService`, `retryStripeSync`. Every mutation writes
`logAuditEvent` (`service_created`, `service_updated`, `service_price_changed` with
old→new in detail, `service_archived`). Archive of a service referenced by active
subscriptions or open quotes is allowed but warns and never cascades.

Nav: add `{ label: "Pricing & Services", href: "/portal/admin/financial/pricing" }` to
the **Finance** group in `DECK_NAV` (admin), and to the admin quick-access list if
appropriate. `scripts/verify-admin-access-communications.mjs` asserts nav structure —
update it in the same commit.

---

## 6. Quote calculator — `/portal/admin/quotes/new` and `[id]/edit`

A client component (`components/portal/quote-calculator.tsx`) rendered above the
existing free-form line grid. The existing grid, server action field names
(`category[]`, `quantity[]`, `unit_price[]`…), and free-form flow are preserved.

Workflow:

1. **Context bar** — client (existing picker), aircraft band/category (prefilled from
   the selected mission's aircraft when present), plan tier (auto-fetched: client's
   active `client_subscriptions` → tier; shows "Non-member — On-Demand rates" when
   none). Context is editable; changes reprice all calculator lines live.
2. **Add service** — searchable picker of active services (grouped by category, shows
   price summary + frequency chips: "One-time", "$/mission", "$149/mo"). Selecting a
   service with variables opens an inline row of inputs; price preview updates live via
   the shared engine.
3. **Attachments** — `required` children auto-append (locked), `default_on` append
   removable, `suggested` render as one-click chips.
4. **Add to quote** — appends rows to the line grid with computed values, plus hidden
   fields per row: `service_id[]`, `service_variant_id[]`, `billing_frequency[]`,
   `recurring_interval[]`, `recurring_interval_count[]`, `calculator_inputs[]`
   (JSON-encoded). Catalog rows render with amount read-only + "Recalculate" affordance;
   qty/notes editable; free-form rows unchanged.
5. **Totals panel** — one-time total, recurring totals ("$349/mo · $3,490/yr with
   annual option"), cost-type split (coordination / pass-through / plan fees), suggested
   deposit. Mirrors what the PDF will show.

Server changes (`app/portal/actions/quotes.ts`):
- `quoteItemsFromForm` reads the new fields.
- New `repriceCatalogItems(db, items, context)` step: loads referenced services +
  variants + variables in one query, runs the engine, overwrites price fields for
  catalog lines, validates variable bounds, and errors clearly if a service was
  archived or a variant expired between preview and save.
- `quoteTotals` extended to compute and persist `recurring_total_monthly/annual`
  (recurring lines are **excluded** from the one-time `subtotal`/`total`).
- Everything else (audit, notify, email, redirect) unchanged.

PDF (`billing-pdfs.tsx`): when a quote has recurring lines, render two blocks —
"One-time & mission charges" (existing table, feeds deposit/total) and "Recurring
services" (line, price, "/month" or "/year", start note "begins upon activation").
Standing flat-fee/pass-through statement stays. Client quote view
(`/portal/client/quotes/[id]`) gets the same split.

---

## 7. Approval lifecycle: quote → invoice + subscription

Extends `respondToQuote` / `convertApprovedQuoteToInvoice`:

1. Split approved quote's lines: `billing_frequency = 'recurring'` vs everything else.
2. **Non-recurring lines** → invoice draft exactly as today
   (`createInvoiceDraftFromQuote` filtered to non-recurring lines). If a quote is
   recurring-only, skip invoice creation entirely (no empty invoices).
3. **Recurring lines** → one draft `client_subscription`:
   - All recurring lines share the quote's context; v1 constraint: **one recurring
     interval per quote** (mixing monthly + annual services on one quote is rejected at
     save with a clear error — split into two quotes). Keeps subscription mapping 1:1.
   - If every recurring line's service has the same `linked_plan_tier_id` → create a
     plan-based subscription (plan_id/tier_id set, prices from the quote snapshot).
   - Otherwise → custom subscription (`is_custom = true`, `custom_name` = quote ref,
     price = recurring total, `line_items_snapshot` = the lines).
   - `source_quote_id` set; `quotes.converted_subscription_id` set; status `draft` —
     **admin explicitly activates** it from the existing Subscriptions tab (which owns
     Stripe subscription creation, start date, proration). No silent auto-billing.
4. Deposit logic applies to the one-time portion only (validated at save: deposit ≤
   one-time total).
5. Notifications/audit: existing events plus `subscription_draft_created_from_quote`.
6. Attached one-time fees (setup/onboarding) are ordinary one-time lines — they land on
   the invoice, not inside the Stripe subscription. One system of record per dollar.

---

## 8. Stripe sync (eager, per Tony's decision)

- On save of an `active` service: ensure a Stripe Product per mode (test/live via the
  existing `stripe-mode.ts` pattern); name/description kept in sync.
- Prices: only for **fixed-price** services/variants (recurring services always; fixed
  one-time services optionally). Variable-priced lines (per-day estimates,
  pass-throughs) are `not_applicable` — they bill via invoice line amounts, which is how
  the existing invoice sync already works.
- Stripe Prices are immutable: a price change creates a new Price, archives the old one
  (`active: false`), and updates the variant's stored id. Old subscriptions keep their
  old Price — correct behavior.
- Failures never block the save: write `stripe_sync_status = 'error'` +
  `stripe_sync_error`, surface a badge on the list page, provide "retry sync". Webhook
  sync-status machinery already exists for subscriptions/invoices; reuse conventions.
- New module `lib/portal/stripe-services.ts` (mirrors `stripe-subscription-core.ts`
  structure) so the sync is testable and isolated.
- Live-mode guard: reuse the existing live-readiness checks
  (`stripe_live_account_readiness` migration conventions) — syncing to live mode
  requires live mode to be active, same as current billing flows.

---

## 9. Seeding & backfill (part of the migration workstream, seed script not migration)

`scripts/seed-service-catalog.mjs` (idempotent, keyed on `code`):
1. **Coordination fees** — per-mission coordination service with variant matrix from the
   current published fee schedule (band × tier).
2. **Membership plans** — one recurring service per existing
   `subscription_plan_tiers` row, `linked_plan_tier_id` set, prices mirroring the tier.
3. **Pass-through estimate services** — contract pilot day (Band A/B day-rate ranges as
   default prices, `days` quantity variable), airline return, per diem, lodging, ground
   transport — all `cost_type = 'pass_through'`.
4. **One-time fees** — onboarding/setup, expedite, etc., as they exist operationally.

No backfill of historical quotes (they stay pure free-form snapshots — correct).
Existing `QUOTE_CATEGORIES`/`BILLING_COST_TYPES` enums are untouched; the catalog maps
onto them.

---

## 10. Guard scripts, tests, verification

- `scripts/verify-pricing-catalog.mjs` (new, added to package.json scripts):
  - Engine unit tests: variant resolution specificity, effective-date windows, tier
    fallback to non-member rates, multiplier variables, attachment expansion +
    price overrides, recurring/one-time total split, deposit bounds, cost-type totals
    reconciliation (`coordination + pass_through + plan_fee = grand totals`).
  - Static asserts: server action recompute path exists; `quote_line_items` insert
    includes snapshot columns; RLS policies present in migration.
- Update `scripts/verify-admin-access-communications.mjs` for the new Finance nav item
  in the same commit as the nav change.
- Run `npm run compliance:check` and the existing `*:verify` suite against a main
  baseline first (known pre-existing failures: admin-access `auth.signUp` check,
  `website-editor:verify`).
- Manual test matrix (Vercel preview, not local build): member vs non-member pricing;
  band A vs B; quote with mixed one-time + recurring; recurring-only quote; attachment
  required vs suggested; archived-service error on save; revision of a catalog-built
  quote; approval → invoice + draft subscription → activation → Stripe (test mode);
  PDF rendering of both blocks; client portal quote view.
- Supabase: `supabase migration list` + live-schema check before applying (migrations
  may already be live ahead of merge, additive-only).

---

## 11. Phased delivery (each phase = one branch/PR, shippable alone)

| Phase | Scope | Depends on |
| --- | --- | --- |
| **1. Catalog foundation** | Migration (all §3 tables/columns), RLS, `pricing-engine.ts` + unit tests, services CRUD pages, nav + guard-script updates, audit events, seed script | — |
| **2. Stripe sync** | `stripe-services.ts`, eager product/price sync, sync badges + retry, test-mode E2E | 1 |
| **3. Quote calculator** | Calculator component, context/tier fetch, server recompute, totals split, PDF + client-view updates | 1 |
| **4. Approval → subscription** | Line splitting, invoice filtering, draft subscription creation (plan-linked + custom), activation handoff, notifications | 2, 3 |
| **5. Polish & ops** | Financial analytics split by cost_type/service, price-history timeline, reference-doc pricing section update, quarterly price-review reminder hook | 4 |

Phases 2 and 3 can proceed in parallel after 1.

---

## 12. Risks & explicit non-goals

- **Risk: price matrix complexity creep.** v1 caps variant axes at (band, category,
  tier, date) and variables at quantity/multiplier roles. Anything needing formulas
  waits for a real case.
- **Risk: quote/subscription drift.** Mitigated by 1:1 quote→subscription mapping, the
  one-interval-per-quote constraint, and `line_items_snapshot`.
- **Risk: Stripe live/test divergence.** Per-mode ID columns + existing mode guards;
  never write live objects from test flows.
- **Non-goals (v1):** client self-serve plan changes (explicitly deferred by the
  reference doc), public pricing page driven by catalog, formula engine, usage-based
  metered billing (usage_events already exist for allowance tracking; metering to Stripe
  is future), multi-currency.

---

## 13. File-by-file change list

**New**
- `supabase/migrations/<ts>_services_catalog_and_quote_calculator.sql`
- `lib/portal/pricing-engine.ts`
- `lib/portal/stripe-services.ts`
- `lib/portal/services.ts` (queries: catalog fetch, active-tier lookup for a client)
- `app/portal/actions/services.ts`
- `app/portal/admin/financial/pricing/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`
- `components/portal/quote-calculator.tsx` (+ small subcomponents)
- `scripts/seed-service-catalog.mjs`, `scripts/verify-pricing-catalog.mjs`

**Modified**
- `app/portal/actions/quotes.ts` (item parsing, recompute, totals, approval split)
- `lib/portal/billing-documents.ts` (invoice conversion filters recurring lines)
- `lib/portal/billing-pdfs.tsx` (recurring block)
- `app/portal/admin/quotes/new/page.tsx`, `[id]/edit/page.tsx` (mount calculator)
- `app/portal/client/quotes/[id]/page.tsx` (recurring display)
- `lib/portal/constants.ts` (DECK_NAV Finance item)
- `scripts/verify-admin-access-communications.mjs`
- `package.json` (new verify script)
- `docs/amg-aviation-group-reference.md` (pricing section update — same workstream)

**Untouched by design**
- `lib/plans.ts`, all public pages, `docs/PORTAL_PROTECTED_FILES.md` entries,
  existing free-form quote behavior, existing subscriptions activation flow.
