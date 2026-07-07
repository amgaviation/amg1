import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Service-catalog read queries (service-catalog plan, Phase 1).
 *
 * Read-side counterpart of app/portal/actions/services.ts. The same §2 laws
 * shape what these helpers return:
 * - Snapshot, never reference: price history lives on service_price_variants
 *   rows (effective_from/effective_to). "Current price" is always derived
 *   from OPEN rows (effective_to is null); closed rows are history and are
 *   surfaced only on the detail timeline.
 * - Cost-type integrity: cost_type is permanent per service. AMG margin
 *   lives ONLY in coordination fees/retainers ('coordination', 'plan_fee');
 *   'pass_through' prices are the vendor's at-cost amount with zero markup.
 * - Archive, never delete: archived services still resolve everywhere here —
 *   they simply stop appearing in the active-services picker.
 */

export type ServiceRow = Tables<"services">;
export type ServiceVariantRow = Tables<"service_price_variants">;
export type ServiceVariableRow = Tables<"service_variables">;
export type ServiceAttachmentRow = Tables<"service_attachments">;
export type AuditEventRow = Tables<"audit_events">;

export type ServiceCatalogFilter = {
  status?: string;
  category?: string;
  cost_type?: string;
  frequency?: string;
};

export type ServiceListItem = ServiceRow & {
  variantCount: number;
  priceSummary: string;
};

export type ServicePickerItem = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  cost_type: string;
  frequency: string;
  priceSummary: string;
};

export type ServiceAttachmentWithChild = ServiceAttachmentRow & {
  child: Pick<ServiceRow, "id" | "code" | "name" | "cost_type" | "status" | "default_unit_price"> | null;
};

export type ServiceUsageCounts = {
  quoteLines: number;
  invoiceLines: number;
  /** Active subscriptions on the linked plan tier (0 when no tier linked). */
  activeSubscriptions: number;
  /**
   * Follow-up: subscriptions that carry this service inside
   * client_subscriptions.line_items_snapshot are NOT counted — there is no
   * cheap join into a JSON snapshot column. The tier-linked count above is
   * the reliable signal Phase 1 exposes.
   */
  subscriptionCountIsPartial: boolean;
};

export type ServiceDetail = {
  service: ServiceRow;
  linkedTier: { id: string; name: string; planName: string | null } | null;
  /** ALL variants, open and closed, newest effective_from first. */
  variants: ServiceVariantRow[];
  variables: ServiceVariableRow[];
  attachments: ServiceAttachmentWithChild[];
  usage: ServiceUsageCounts;
  auditEvents: AuditEventRow[];
};

// ── price summary ─────────────────────────────────────────────────────

function shortMoney(value: number): string {
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  })}`;
}

function frequencySuffix(service: Pick<ServiceRow, "frequency" | "recurring_interval" | "unit" | "pricing_model">): string {
  if (service.frequency === "recurring") {
    return service.recurring_interval === "year" ? "/yr" : "/mo";
  }
  if (service.pricing_model === "per_unit" && service.unit) return `/${service.unit}`;
  return "";
}

/**
 * One-line price summary for list rows and pickers, derived from CURRENT
 * (open) variants when present, else the default price:
 * "$295–$495 by tier", "$149/mo", "$150/hr", "At cost (pass-through)".
 */
export function summarizeServicePrice(
  service: Pick<
    ServiceRow,
    "pricing_model" | "frequency" | "recurring_interval" | "unit" | "default_unit_price" | "cost_type"
  >,
  currentVariants: Pick<ServiceVariantRow, "unit_price" | "plan_tier_match" | "aircraft_band" | "aircraft_category">[],
): string {
  const suffix = frequencySuffix(service);
  if (currentVariants.length > 0) {
    const prices = currentVariants.map((variant) => Number(variant.unit_price)).filter((n) => Number.isFinite(n));
    if (prices.length) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const byTier = currentVariants.some((variant) => variant.plan_tier_match);
      const byAircraft = currentVariants.some((variant) => variant.aircraft_band || variant.aircraft_category);
      const axis = byTier ? " by tier" : byAircraft ? " by aircraft" : currentVariants.length > 1 ? " by variant" : "";
      return min === max
        ? `${shortMoney(min)}${suffix}${axis}`
        : `${shortMoney(min)}–${shortMoney(max)}${suffix}${axis}`;
    }
  }
  if (service.default_unit_price !== null && service.default_unit_price !== undefined) {
    return `${shortMoney(Number(service.default_unit_price))}${suffix}`;
  }
  if (service.pricing_model === "passthrough_estimate" || service.cost_type === "pass_through") {
    // Pass-through law: billed at vendor cost, zero AMG markup — there may
    // be no fixed price to show at all.
    return "At cost (pass-through)";
  }
  return "—";
}

// ── list / picker queries ─────────────────────────────────────────────

async function openVariantsByService(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  serviceIds: string[],
): Promise<Map<string, ServiceVariantRow[]>> {
  const grouped = new Map<string, ServiceVariantRow[]>();
  if (!serviceIds.length) return grouped;
  // PostgREST silently caps unbounded selects at 1000 rows; an explicit
  // limit raises the ceiling far past any realistic open-variant count so
  // list/picker price summaries never quietly drop variants.
  const { data } = await db
    .from("service_price_variants")
    .select("*")
    .in("service_id", serviceIds)
    .is("effective_to", null)
    .order("sort_order", { ascending: true })
    .limit(5000);
  for (const variant of data ?? []) {
    const bucket = grouped.get(variant.service_id);
    if (bucket) bucket.push(variant);
    else grouped.set(variant.service_id, [variant]);
  }
  return grouped;
}

export async function listServices(filter: ServiceCatalogFilter = {}): Promise<ServiceListItem[]> {
  const db = await createServiceClient();
  let query = db
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.cost_type) query = query.eq("cost_type", filter.cost_type);
  if (filter.frequency) query = query.eq("frequency", filter.frequency);
  const { data: services, error } = await query;
  if (error) throw error;

  const variantMap = await openVariantsByService(db, (services ?? []).map((service) => service.id));
  return (services ?? []).map((service) => {
    const open = variantMap.get(service.id) ?? [];
    return {
      ...service,
      variantCount: open.length,
      priceSummary: summarizeServicePrice(service, open),
    };
  });
}

/** Distinct non-empty categories across the whole catalog (for filters). */
export async function listServiceCategories(): Promise<string[]> {
  const db = await createServiceClient();
  const { data } = await db.from("services").select("category").not("category", "is", null);
  const unique = new Set<string>();
  for (const row of data ?? []) {
    if (row.category) unique.add(row.category);
  }
  return [...unique].sort((a, b) => a.localeCompare(b));
}

/**
 * Active services only — the quote-builder / attachments picker. Archived
 * and draft services never appear here (archive-never-delete: they still
 * exist, they just stop being offerable).
 */
export async function listActiveServicesForPicker(): Promise<ServicePickerItem[]> {
  const db = await createServiceClient();
  const { data: services, error } = await db
    .from("services")
    .select("id, code, name, category, cost_type, frequency, pricing_model, recurring_interval, unit, default_unit_price, sort_order")
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });
  if (error) throw error;

  const variantMap = await openVariantsByService(db, (services ?? []).map((service) => service.id));
  return (services ?? []).map((service) => ({
    id: service.id,
    code: service.code,
    name: service.name,
    category: service.category,
    cost_type: service.cost_type,
    frequency: service.frequency,
    priceSummary: summarizeServicePrice(service, variantMap.get(service.id) ?? []),
  }));
}

// ── detail query ──────────────────────────────────────────────────────

export async function getServiceDetail(id: string): Promise<ServiceDetail | null> {
  const db = await createServiceClient();
  const { data: service } = await db.from("services").select("*").eq("id", id).maybeSingle();
  if (!service) return null;

  const [variantsRes, variablesRes, attachmentsRes, quoteCountRes, invoiceCountRes, auditRes] = await Promise.all([
    db
      .from("service_price_variants")
      .select("*")
      .eq("service_id", id)
      .order("effective_from", { ascending: false })
      .order("sort_order", { ascending: true }),
    db
      .from("service_variables")
      .select("*")
      .eq("service_id", id)
      .order("sort_order", { ascending: true }),
    db
      .from("service_attachments")
      .select("*, child:child_service_id(id, code, name, cost_type, status, default_unit_price)")
      .eq("parent_service_id", id)
      .order("sort_order", { ascending: true }),
    db.from("quote_line_items").select("id", { count: "exact", head: true }).eq("service_id", id),
    db.from("invoice_line_items").select("id", { count: "exact", head: true }).eq("service_id", id),
    db
      .from("audit_events")
      .select("*")
      .eq("entity_type", "service")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  let linkedTier: ServiceDetail["linkedTier"] = null;
  let activeSubscriptions = 0;
  if (service.linked_plan_tier_id) {
    const [{ data: tier }, { count }] = await Promise.all([
      db
        .from("subscription_plan_tiers")
        .select("id, name, plan:plan_id(name)")
        .eq("id", service.linked_plan_tier_id)
        .maybeSingle(),
      db
        .from("client_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("tier_id", service.linked_plan_tier_id)
        .eq("status", "active")
        .eq("is_test", false),
    ]);
    if (tier) {
      linkedTier = {
        id: tier.id,
        name: tier.name,
        planName: (tier.plan as { name: string } | null)?.name ?? null,
      };
    }
    activeSubscriptions = count ?? 0;
  }

  return {
    service,
    linkedTier,
    variants: variantsRes.data ?? [],
    variables: variablesRes.data ?? [],
    attachments: (attachmentsRes.data ?? []) as unknown as ServiceAttachmentWithChild[],
    usage: {
      quoteLines: quoteCountRes.count ?? 0,
      invoiceLines: invoiceCountRes.count ?? 0,
      activeSubscriptions,
      // See ServiceUsageCounts: line_items_snapshot references are a follow-up.
      subscriptionCountIsPartial: true,
    },
    auditEvents: auditRes.data ?? [],
  };
}

// ── plan tiers (linked-tier dropdown) ─────────────────────────────────

export type PlanTierOption = { value: string; label: string };

export async function listPlanTierOptions(): Promise<PlanTierOption[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("subscription_plan_tiers")
    .select("id, name, sort_order, plan:plan_id(name)")
    .order("sort_order", { ascending: true });
  return (data ?? []).map((tier) => ({
    value: tier.id,
    label: `${(tier.plan as { name: string } | null)?.name ?? "Plan"} — ${tier.name}`,
  }));
}

// ── client tier lookup (quote calculator context) ─────────────────────

export type ClientActiveTier = {
  subscriptionId: string;
  tierId: string | null;
  tierName: string | null;
  planName: string | null;
};

/**
 * The client's active subscription tier, used to resolve plan_tier_match
 * variants when quoting. Null when the client has no active subscription.
 */
export async function getClientActiveTier(clientId: string): Promise<ClientActiveTier | null> {
  if (!clientId) return null;
  const db = await createServiceClient();
  const { data } = await db
    .from("client_subscriptions")
    .select("id, plan_name, tier:tier_id(id, name), plan:plan_id(name)")
    .eq("client_id", clientId)
    .eq("status", "active")
    .eq("is_test", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const tier = data.tier as { id: string; name: string } | null;
  return {
    subscriptionId: data.id,
    tierId: tier?.id ?? null,
    tierName: tier?.name ?? null,
    planName: (data.plan as { name: string } | null)?.name ?? data.plan_name ?? null,
  };
}

// ── flash-message vocabulary (matches app/portal/actions/services.ts) ──

export type ServiceFlash = { tone: "success" | "danger" | "warn"; message: string };

const SUCCESS_MESSAGES: Record<string, string> = {
  created: "Service created. Prices recorded effective today.",
  saved: "Service updated. Any price changes closed the old price rows and opened new ones effective today.",
  updated: "Service updated.",
  archived:
    "Service archived. Nothing was deleted — historical quotes, invoices, and subscriptions keep their snapshots.",
  duplicated: "Service duplicated as a draft copy with its own code and no Stripe identity.",
  "sync-queued": "Stripe sync re-queued. The sync worker lands in the Stripe phase.",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "The form could not be read. Nothing was saved.",
  missing: "No service was specified.",
  notfound: "That service no longer exists.",
  "cost-type-locked":
    "Cost type is permanent per service — a pass-through can never become a margin-carrying coordination fee (or vice versa). Duplicate the service instead.",
  "cost-type": "Choose a cost type: coordination fee, pass-through, or plan fee.",
  "code-required": "A service code is required.",
  "name-required": "A service name is required.",
  "code-taken": "That service code is already in use.",
  "create-failed": "The service could not be created.",
  "save-failed": "The service could not be saved.",
  "duplicate-failed": "The service could not be duplicated.",
  "pricing-model": "Choose a valid pricing model.",
  frequency: "Choose a valid frequency.",
  "recurring-interval": "Recurring services need a monthly or yearly interval.",
  status: "Choose a valid status.",
  "price-invalid": "Prices must be between $0 and $9,999,999,999.99.",
  "recurring-interval-count": "Recurring interval count must be a whole number between 1 and 60.",
  "quantity-range": "Minimum quantity cannot exceed maximum quantity.",
  "deposit-percent": "Deposit percent must be between 0 and 100.",
  "variants-json": "The price variants could not be read. Nothing was saved.",
  "variant-band": "Aircraft band must be A or B.",
  "variant-price": "Every price variant needs a unit price between $0 and $9,999,999,999.99.",
  "variant-duplicate-axes":
    "Two price variants share the same aircraft category, band, and plan tier — the calculator could not tell them apart. Give each variant distinct axes.",
  "variant-save-failed":
    "A price variant could not be saved. Re-open the form to see exactly what was stored, then try again.",
  "children-save-failed":
    "The service's price variants, variables, or attachments could not be saved. Re-open the form and try again.",
  "attachment-child-inactive": "Only active services can be attached.",
  "variables-json": "The variables could not be read. Nothing was saved.",
  "variable-key": "Every variable needs a label and a key like fuel_stops (letters, numbers, underscores).",
  "variable-duplicate-key": "Variable keys must be unique per service.",
  "variable-input-type": "Choose a valid variable input type.",
  "variable-role": "Choose a valid variable role.",
  "variable-options": "Select-type variables need at least one option.",
  "attachments-json": "The attached services could not be read. Nothing was saved.",
  "attachment-child": "Every attachment must point at an existing service.",
  "attachment-mode": "Choose a valid attachment mode.",
  "attachment-quantity": "Attachment quantity must be greater than zero.",
  "attachment-price": "Attachment price overrides cannot be negative.",
  "attachment-self": "A service cannot attach to itself.",
  "attachment-depth": "Attachments expand one level deep — a child with its own attachments (or attaching a service that is already someone's child) is not allowed.",
  "sync-not-applicable":
    "Stripe sync is not applicable: this service's price is computed at quote time (pass-through estimate or multiplier variables), so Stripe cannot hold a fixed price for it.",
};

/** Map ?success= / ?error= codes from the services actions into a Notice. */
export function serviceFlashMessage(params: { success?: string; error?: string }): ServiceFlash | null {
  if (params.success) {
    return { tone: "success", message: SUCCESS_MESSAGES[params.success] ?? "Saved." };
  }
  if (params.error) {
    return {
      tone: "danger",
      message: ERROR_MESSAGES[params.error] ?? "Something went wrong. Nothing was saved.",
    };
  }
  return null;
}
