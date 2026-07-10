/**
 * Service-catalog vocabularies — the single source of truth for every
 * enum-like value set the catalog shares between:
 * - the DB check constraints
 *   (supabase/migrations/20260707120000_services_catalog_and_quote_calculator.sql),
 * - the server actions (app/portal/actions/services.ts),
 * - the pure pricing engine (lib/portal/pricing-engine.ts, which re-exports
 *   the subset it needs so its callers keep a stable import surface),
 * - the admin form (components/portal/admin/service-form.tsx, which derives
 *   its label+value option arrays from these values).
 *
 * HARD CONSTRAINTS — do not violate:
 * - Pure constants only: no imports, no I/O, no side effects. This module
 *   must stay safe to import from client components, server actions, the
 *   pure pricing engine, and node scripts alike.
 * - Every value MUST match the DB check constraint exactly. Adding or
 *   renaming a value here without the matching migration makes writes fail
 *   at the database; changing a value only in the migration reintroduces
 *   the drift this module exists to prevent.
 *
 * NOT vocabularies (deliberately absent): services.category and
 * services.unit are free text in the DB — the form offers live categories
 * and UNIT_PRESETS as datalist suggestions only.
 */

/** services.cost_type — permanent per service; margin lives only in coordination/plan_fee. */
export const COST_TYPES = ["coordination", "pass_through", "plan_fee"] as const;
export type CostType = (typeof COST_TYPES)[number];

/** services.status — only 'active' services are offerable. */
export const SERVICE_STATUSES = ["draft", "active", "archived"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

/** services.pricing_model. */
export const PRICING_MODELS = ["flat", "per_unit", "variant_matrix", "passthrough_estimate"] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

/** services.frequency (and quote/invoice line billing_frequency). */
export const SERVICE_FREQUENCIES = ["one_time", "per_mission", "recurring"] as const;
export type ServiceFrequency = (typeof SERVICE_FREQUENCIES)[number];

/** services.recurring_interval — recurring services only. */
export const RECURRING_INTERVALS = ["month", "year"] as const;
export type RecurringInterval = (typeof RECURRING_INTERVALS)[number];

/** service_price_variants.aircraft_band — null on a variant means "any band". */
export const AIRCRAFT_BANDS = ["A", "B"] as const;
export type AircraftBand = (typeof AIRCRAFT_BANDS)[number];

/** service_variables.input_type. */
export const VARIABLE_INPUT_TYPES = ["number", "select", "boolean"] as const;
export type VariableInputType = (typeof VARIABLE_INPUT_TYPES)[number];

/** service_variables.role — how the calculator uses the input. */
export const VARIABLE_ROLES = ["quantity", "multiplier", "info"] as const;
export type VariableRole = (typeof VARIABLE_ROLES)[number];

/** service_attachments.attachment_mode. */
export const ATTACHMENT_MODES = ["required", "default_on", "suggested"] as const;
export type AttachmentMode = (typeof ATTACHMENT_MODES)[number];

/** services.stripe_sync_status — Phase-1 intent only; Phase 2 does the sync. */
export const STRIPE_SYNC_STATUSES = ["pending", "synced", "error", "not_applicable"] as const;
export type StripeSyncStatus = (typeof STRIPE_SYNC_STATUSES)[number];
