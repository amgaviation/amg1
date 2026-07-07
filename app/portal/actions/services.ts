"use server";

/**
 * Service-catalog server actions (service-catalog plan, Phase 1).
 *
 * Design laws from the plan (§2) that this file enforces structurally:
 * - Snapshot, never reference: quotes/invoices copy prices; the catalog is
 *   free to evolve. Price history therefore lives on service_price_variants
 *   rows with effective_from/effective_to — a price on an existing variant
 *   row is NEVER edited in place. A changed price closes the old row
 *   (effective_to = today) and inserts a new row effective today (§5.3).
 * - Server is source of truth: every payload field is re-validated here
 *   against the DB enums; nothing from the form is trusted.
 * - Cost-type integrity: cost_type is PERMANENT per service. AMG margin
 *   lives ONLY in coordination fees/retainers ('coordination', 'plan_fee');
 *   'pass_through' services carry the vendor's cost with ZERO markup — any
 *   price entered on a pass-through service is the at-cost amount.
 * - Archive, never delete: archiveService flips status to 'archived' and
 *   never cascades or deletes; historical quote/invoice/subscription rows
 *   keep their snapshots. Restore happens through updateService.
 *
 * Variables and attachments are definition, not history — removing one in
 * the form deletes its row. Variants are history — removing one closes it.
 *
 * Stripe: Phase 2 performs the real product/price sync. Phase 1 only marks
 * intent: 'pending' queues a service for sync; 'not_applicable' marks
 * services Stripe can never hold a fixed price for (pass-through estimates
 * and calculator-priced services with multiplier variables).
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/portal/audit";
import type { Json, Tables, TablesInsert } from "@/lib/supabase/database.types";
import { actor, bool, num, safeRedirectPath, str } from "./_helpers";

const BASE = "/portal/admin/financial/pricing";

// Upper bound for any money figure: the columns are numeric(12,2), so
// anything above this overflows at insert time. Validating here keeps a
// fat-fingered price from passing validation and then failing the write.
const MAX_PRICE = 9_999_999_999.99;

// DB check-constraint vocabularies (must match the services migration).
const COST_TYPES = ["coordination", "pass_through", "plan_fee"] as const;
const SERVICE_STATUSES = ["draft", "active", "archived"] as const;
const PRICING_MODELS = ["flat", "per_unit", "variant_matrix", "passthrough_estimate"] as const;
const FREQUENCIES = ["one_time", "per_mission", "recurring"] as const;
const RECURRING_INTERVALS = ["month", "year"] as const;
const AIRCRAFT_BANDS = ["A", "B"] as const;
const VARIABLE_INPUT_TYPES = ["number", "select", "boolean"] as const;
const VARIABLE_ROLES = ["quantity", "multiplier", "info"] as const;
const ATTACHMENT_MODES = ["required", "default_on", "suggested"] as const;

type ServiceRow = Tables<"services">;
type VariantRow = Tables<"service_price_variants">;

type VariantInput = {
  id: string | null;
  label: string | null;
  aircraft_category: string | null;
  aircraft_band: (typeof AIRCRAFT_BANDS)[number] | null;
  plan_tier_match: string | null;
  unit_price: number;
  annual_price: number | null;
  sort_order: number;
};

type VariableInput = {
  id: string | null;
  key: string;
  label: string;
  input_type: (typeof VARIABLE_INPUT_TYPES)[number];
  options: Json | null;
  default_value: string | null;
  min_value: number | null;
  max_value: number | null;
  role: (typeof VARIABLE_ROLES)[number];
  required: boolean;
  sort_order: number;
};

type AttachmentInput = {
  id: string | null;
  child_service_id: string;
  attachment_mode: (typeof ATTACHMENT_MODES)[number];
  quantity: number;
  price_override: number | null;
  sort_order: number;
};

// ── small coercion helpers for the JSON-encoded hidden fields ────────

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "on") return true;
  if (value === "false") return false;
  return fallback;
}

function parseJsonArray(raw: string): unknown[] | null {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withCode(path: string, kind: "success" | "error", code: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}${kind}=${code}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function money(value: number | null): string {
  return value === null ? "—" : `$${value.toFixed(2)}`;
}

// ── payload normalizers (server re-validates everything) ─────────────

type Parsed<T> = { rows: T[]; error: null } | { rows: null; error: string };

function normalizeVariants(raw: string): Parsed<VariantInput> {
  const arr = parseJsonArray(raw);
  if (!arr) return { rows: null, error: "variants-json" };
  const rows: VariantInput[] = [];
  const seenAxes = new Set<string>();
  for (const entry of arr) {
    if (!isRecord(entry)) return { rows: null, error: "variants-json" };
    const band = asString(entry.aircraft_band) || null;
    if (band && !AIRCRAFT_BANDS.includes(band as (typeof AIRCRAFT_BANDS)[number])) {
      return { rows: null, error: "variant-band" };
    }
    const unitPrice = asNumberOrNull(entry.unit_price);
    // Pass-through law: for cost_type 'pass_through' this figure is the
    // vendor's at-cost amount — zero AMG markup may be embedded in it.
    if (unitPrice === null || unitPrice < 0 || unitPrice > MAX_PRICE) return { rows: null, error: "variant-price" };
    const annualPrice = asNumberOrNull(entry.annual_price);
    if (annualPrice !== null && (annualPrice < 0 || annualPrice > MAX_PRICE)) return { rows: null, error: "variant-price" };
    const aircraftCategory = asString(entry.aircraft_category) || null;
    const planTierMatch = asString(entry.plan_tier_match) || null;
    // Two open variants with identical axes are ambiguous to the pricing
    // engine's resolver — reject them at the door.
    const axes = [aircraftCategory, band, planTierMatch]
      .map((part) => (part ?? "").trim().toLowerCase())
      .join("|");
    if (seenAxes.has(axes)) return { rows: null, error: "variant-duplicate-axes" };
    seenAxes.add(axes);
    rows.push({
      id: asString(entry.id) || null,
      label: asString(entry.label) || null,
      aircraft_category: aircraftCategory,
      aircraft_band: (band as VariantInput["aircraft_band"]) ?? null,
      plan_tier_match: planTierMatch,
      unit_price: unitPrice,
      annual_price: annualPrice,
      sort_order: asNumberOrNull(entry.sort_order) ?? rows.length,
    });
  }
  return { rows, error: null };
}

function normalizeVariables(raw: string): Parsed<VariableInput> {
  const arr = parseJsonArray(raw);
  if (!arr) return { rows: null, error: "variables-json" };
  const rows: VariableInput[] = [];
  const seenKeys = new Set<string>();
  for (const entry of arr) {
    if (!isRecord(entry)) return { rows: null, error: "variables-json" };
    const key = asString(entry.key);
    const label = asString(entry.label);
    if (!key || !/^[a-z][a-z0-9_]*$/i.test(key) || !label) return { rows: null, error: "variable-key" };
    if (seenKeys.has(key.toLowerCase())) return { rows: null, error: "variable-duplicate-key" };
    seenKeys.add(key.toLowerCase());
    const inputType = asString(entry.input_type) || "number";
    if (!VARIABLE_INPUT_TYPES.includes(inputType as (typeof VARIABLE_INPUT_TYPES)[number])) {
      return { rows: null, error: "variable-input-type" };
    }
    const role = asString(entry.role) || "quantity";
    if (!VARIABLE_ROLES.includes(role as (typeof VARIABLE_ROLES)[number])) {
      return { rows: null, error: "variable-role" };
    }
    const options = entry.options ?? null;
    if (inputType === "select" && (!Array.isArray(options) || options.length === 0)) {
      return { rows: null, error: "variable-options" };
    }
    rows.push({
      id: asString(entry.id) || null,
      key,
      label,
      input_type: inputType as VariableInput["input_type"],
      options: (Array.isArray(options) ? (options as Json) : null),
      default_value: asString(entry.default_value) || null,
      min_value: asNumberOrNull(entry.min_value),
      max_value: asNumberOrNull(entry.max_value),
      role: role as VariableInput["role"],
      required: asBool(entry.required, true),
      sort_order: asNumberOrNull(entry.sort_order) ?? rows.length,
    });
  }
  return { rows, error: null };
}

function normalizeAttachments(raw: string): Parsed<AttachmentInput> {
  const arr = parseJsonArray(raw);
  if (!arr) return { rows: null, error: "attachments-json" };
  const rows: AttachmentInput[] = [];
  for (const entry of arr) {
    if (!isRecord(entry)) return { rows: null, error: "attachments-json" };
    const childId = asString(entry.child_service_id);
    if (!childId) return { rows: null, error: "attachment-child" };
    const mode = asString(entry.attachment_mode) || "suggested";
    if (!ATTACHMENT_MODES.includes(mode as (typeof ATTACHMENT_MODES)[number])) {
      return { rows: null, error: "attachment-mode" };
    }
    const quantity = asNumberOrNull(entry.quantity) ?? 1;
    if (quantity <= 0) return { rows: null, error: "attachment-quantity" };
    const priceOverride = asNumberOrNull(entry.price_override);
    if (priceOverride !== null && (priceOverride < 0 || priceOverride > MAX_PRICE)) {
      return { rows: null, error: "attachment-price" };
    }
    rows.push({
      id: asString(entry.id) || null,
      child_service_id: childId,
      attachment_mode: mode as AttachmentInput["attachment_mode"],
      quantity,
      price_override: priceOverride,
      sort_order: asNumberOrNull(entry.sort_order) ?? rows.length,
    });
  }
  return { rows, error: null };
}

/**
 * Validate attachment rows against the catalog. v1 expands attachments
 * depth-1 only (migration §3.4 note), so we block both directions of a
 * deeper chain: a child that has children of its own, and giving children
 * to a service that is itself somebody's child.
 */
async function attachmentDepthError(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  parentServiceId: string | null,
  rows: AttachmentInput[],
): Promise<string | null> {
  if (!rows.length) return null;
  if (parentServiceId && rows.some((row) => row.child_service_id === parentServiceId)) {
    return "attachment-self";
  }
  const childIds = [...new Set(rows.map((row) => row.child_service_id))];
  const { data: children } = await db.from("services").select("id, status").in("id", childIds);
  if ((children ?? []).length !== childIds.length) return "attachment-child";
  // Only publishable services may join new quotes — the form picker offers
  // active services only, so a draft/archived child here is a forged post.
  if ((children ?? []).some((child) => child.status !== "active")) return "attachment-child-inactive";
  const { count: grandchildren } = await db
    .from("service_attachments")
    .select("id", { count: "exact", head: true })
    .in("parent_service_id", childIds);
  if ((grandchildren ?? 0) > 0) return "attachment-depth";
  if (parentServiceId) {
    const { count: parentIsChild } = await db
      .from("service_attachments")
      .select("id", { count: "exact", head: true })
      .eq("child_service_id", parentServiceId);
    if ((parentIsChild ?? 0) > 0) return "attachment-depth";
  }
  return null;
}

// ── services core payload ─────────────────────────────────────────────

type CorePayload = Omit<
  TablesInsert<"services">,
  "id" | "cost_type" | "created_at" | "updated_at" | "created_by" | "stripe_sync_status" | "stripe_sync_error" | "stripe_product_id_test" | "stripe_product_id_live"
>;

function corePayloadError(payload: CorePayload | null): string | null {
  if (!payload) return "invalid";
  if (!payload.code) return "code-required";
  if (!payload.name) return "name-required";
  return null;
}

function readCorePayload(formData: FormData): { payload: CorePayload | null; error: string | null } {
  const pricingModel = str(formData, "pricing_model") || "flat";
  if (!PRICING_MODELS.includes(pricingModel as (typeof PRICING_MODELS)[number])) {
    return { payload: null, error: "pricing-model" };
  }
  const frequency = str(formData, "frequency") || "one_time";
  if (!FREQUENCIES.includes(frequency as (typeof FREQUENCIES)[number])) {
    return { payload: null, error: "frequency" };
  }
  const recurringInterval = str(formData, "recurring_interval") || null;
  if (frequency === "recurring") {
    if (!recurringInterval || !RECURRING_INTERVALS.includes(recurringInterval as (typeof RECURRING_INTERVALS)[number])) {
      return { payload: null, error: "recurring-interval" };
    }
  }
  const status = str(formData, "status") || "draft";
  if (!SERVICE_STATUSES.includes(status as (typeof SERVICE_STATUSES)[number])) {
    return { payload: null, error: "status" };
  }
  const defaultUnitPrice = num(formData, "default_unit_price");
  if (defaultUnitPrice !== null && (defaultUnitPrice < 0 || defaultUnitPrice > MAX_PRICE)) {
    return { payload: null, error: "price-invalid" };
  }
  const intervalCount = num(formData, "recurring_interval_count");
  if (
    frequency === "recurring" &&
    intervalCount !== null &&
    (!Number.isInteger(intervalCount) || intervalCount < 1 || intervalCount > 60)
  ) {
    return { payload: null, error: "recurring-interval-count" };
  }
  const minQuantity = num(formData, "min_quantity");
  const maxQuantity = num(formData, "max_quantity");
  if (minQuantity !== null && maxQuantity !== null && minQuantity > maxQuantity) {
    return { payload: null, error: "quantity-range" };
  }
  const depositPercent = num(formData, "requires_deposit_percent");
  if (depositPercent !== null && (depositPercent < 0 || depositPercent > 100)) {
    return { payload: null, error: "deposit-percent" };
  }

  const payload: CorePayload = {
    code: str(formData, "code"),
    name: str(formData, "name"),
    description: str(formData, "description") || null,
    client_description: str(formData, "client_description") || null,
    category: str(formData, "category") || null,
    status,
    pricing_model: pricingModel,
    unit: str(formData, "unit") || null,
    default_unit_price: defaultUnitPrice,
    frequency,
    recurring_interval: frequency === "recurring" ? recurringInterval : null,
    recurring_interval_count: frequency === "recurring" ? (intervalCount ?? 1) : null,
    min_quantity: minQuantity,
    max_quantity: maxQuantity,
    taxable: bool(formData, "taxable"),
    // Default-true flags: pages submit explicit "true"/"false" hidden values;
    // an absent field keeps the safer default (visible + billable).
    client_visible: formData.get("client_visible") !== "false",
    billable: formData.get("billable") !== "false",
    requires_deposit_percent: depositPercent,
    linked_plan_tier_id: str(formData, "linked_plan_tier_id") || null,
    notes_internal: str(formData, "notes_internal") || null,
    sort_order: num(formData, "sort_order") ?? 0,
  };
  return { payload, error: corePayloadError(payload) };
}

/**
 * Phase-1 Stripe intent. Real sync is Phase 2 — here we only mark whether a
 * service CAN hold a fixed Stripe price: pass-through estimates and services
 * whose price is computed from multiplier variables at quote time cannot
 * ('not_applicable'); everything else queues as 'pending'.
 */
function deriveStripeSyncStatus(pricingModel: string, variables: Pick<VariableInput, "role">[]): "pending" | "not_applicable" {
  if (pricingModel === "passthrough_estimate") return "not_applicable";
  if (variables.some((variable) => variable.role === "multiplier")) return "not_applicable";
  return "pending";
}

// ── actions ───────────────────────────────────────────────────────────

export async function createService(formData: FormData) {
  const admin = await actor(["admin"], "settings.add");
  const db = await createServiceClient();
  const backTo = safeRedirectPath(str(formData, "redirect_to"), `${BASE}/new`);

  const { payload, error: coreError } = readCorePayload(formData);
  if (coreError || !payload) redirect(withCode(backTo, "error", coreError ?? "invalid"));

  // cost_type is set exactly once, at creation, and is permanent thereafter.
  const costType = str(formData, "cost_type");
  if (!COST_TYPES.includes(costType as (typeof COST_TYPES)[number])) {
    redirect(withCode(backTo, "error", "cost-type"));
  }

  const variants = normalizeVariants(str(formData, "variants_json") || "[]");
  if (variants.error !== null) redirect(withCode(backTo, "error", variants.error));
  const variables = normalizeVariables(str(formData, "variables_json") || "[]");
  if (variables.error !== null) redirect(withCode(backTo, "error", variables.error));
  const attachments = normalizeAttachments(str(formData, "attachments_json") || "[]");
  if (attachments.error !== null) redirect(withCode(backTo, "error", attachments.error));

  const depthError = await attachmentDepthError(db, null, attachments.rows ?? []);
  if (depthError) redirect(withCode(backTo, "error", depthError));

  const { data: service, error: insertError } = await db
    .from("services")
    .insert({
      ...payload,
      cost_type: costType,
      stripe_sync_status: deriveStripeSyncStatus(payload.pricing_model ?? "flat", variables.rows ?? []),
      created_by: admin.id,
    })
    .select("id, code, name")
    .single();
  if (insertError || !service) {
    redirect(withCode(backTo, "error", insertError?.code === "23505" ? "code-taken" : "create-failed"));
  }

  // Child writes are checked: a failed variant/variable/attachment insert
  // removes the service row created in THIS call (cascade clears whatever
  // children did land) so a retry starts clean instead of a half-created
  // service silently reading as "created".
  const failCreate = async (): Promise<never> => {
    await db.from("services").delete().eq("id", service.id);
    redirect(withCode(backTo, "error", "children-save-failed"));
  };

  const effectiveFrom = today();
  if (variants.rows?.length) {
    const { error } = await db.from("service_price_variants").insert(
      variants.rows.map((row) => ({
        service_id: service.id,
        label: row.label,
        aircraft_category: row.aircraft_category,
        aircraft_band: row.aircraft_band,
        plan_tier_match: row.plan_tier_match,
        unit_price: row.unit_price,
        annual_price: row.annual_price,
        effective_from: effectiveFrom,
        sort_order: row.sort_order,
      })),
    );
    if (error) await failCreate();
  }
  if (variables.rows?.length) {
    const { error } = await db.from("service_variables").insert(
      variables.rows.map(({ id: _id, ...row }) => ({ ...row, service_id: service.id })),
    );
    if (error) await failCreate();
  }
  if (attachments.rows?.length) {
    const { error } = await db.from("service_attachments").insert(
      attachments.rows.map(({ id: _id, ...row }) => ({ ...row, parent_service_id: service.id })),
    );
    if (error) await failCreate();
  }

  await logAuditEvent({
    actor: admin,
    action: "service_created",
    detail: `Created service ${service.code} (${service.name}), cost_type=${costType}, ${variants.rows?.length ?? 0} price variant(s)`,
    entityType: "service",
    entityId: service.id,
  });

  revalidatePath(BASE);
  redirect(withCode(`${BASE}/${service.id}`, "success", "created"));
}

export async function updateService(formData: FormData) {
  const admin = await actor(["admin"], "settings.edit");
  const db = await createServiceClient();
  const serviceId = str(formData, "service_id");
  if (!serviceId) redirect(withCode(BASE, "error", "missing"));
  const backTo = safeRedirectPath(str(formData, "redirect_to"), `${BASE}/${serviceId}`);

  const { data: existing } = await db.from("services").select("*").eq("id", serviceId).maybeSingle();
  if (!existing) redirect(withCode(BASE, "error", "notfound"));
  const current: ServiceRow = existing;

  // Cost-type integrity (§2): cost_type is permanent. A pass-through can
  // never become a margin-carrying coordination fee (or vice versa) — that
  // would silently change what its historical prices mean.
  const submittedCostType = str(formData, "cost_type");
  if (submittedCostType && submittedCostType !== current.cost_type) {
    redirect(withCode(backTo, "error", "cost-type-locked"));
  }

  const { payload, error: coreError } = readCorePayload(formData);
  if (coreError || !payload) redirect(withCode(backTo, "error", coreError ?? "invalid"));

  // A form that does not carry one of these fields must not silently reset
  // it to the create-time default (e.g. flipping an active service to draft).
  if (formData.get("status") === null) payload.status = current.status;
  if (formData.get("pricing_model") === null) payload.pricing_model = current.pricing_model;
  if (formData.get("frequency") === null) {
    payload.frequency = current.frequency;
    payload.recurring_interval = current.recurring_interval;
    payload.recurring_interval_count = current.recurring_interval_count;
  }

  // The three child collections arrive as JSON hidden fields. An ABSENT
  // field means "form did not manage this collection — leave it alone";
  // a present field (even "[]") is the authoritative full set.
  const variantsRaw = formData.get("variants_json");
  const variablesRaw = formData.get("variables_json");
  const attachmentsRaw = formData.get("attachments_json");

  const variants = variantsRaw === null ? null : normalizeVariants(String(variantsRaw));
  if (variants && variants.error !== null) redirect(withCode(backTo, "error", variants.error));
  const variables = variablesRaw === null ? null : normalizeVariables(String(variablesRaw));
  if (variables && variables.error !== null) redirect(withCode(backTo, "error", variables.error));
  const attachments = attachmentsRaw === null ? null : normalizeAttachments(String(attachmentsRaw));
  if (attachments && attachments.error !== null) redirect(withCode(backTo, "error", attachments.error));

  if (attachments?.rows) {
    const depthError = await attachmentDepthError(db, serviceId, attachments.rows);
    if (depthError) redirect(withCode(backTo, "error", depthError));
  }

  // Derive Stripe intent from the post-save state of the calculator inputs.
  let effectiveVariables: Pick<VariableInput, "role">[] = variables?.rows ?? [];
  if (!variables) {
    const { data: existingVariables } = await db
      .from("service_variables")
      .select("role")
      .eq("service_id", serviceId);
    effectiveVariables = (existingVariables ?? []) as Pick<VariableInput, "role">[];
  }
  const nextSyncStatus = deriveStripeSyncStatus(payload.pricing_model ?? current.pricing_model, effectiveVariables);

  const changedFields = (
    [
      "code",
      "name",
      "category",
      "status",
      "pricing_model",
      "frequency",
      "unit",
      "default_unit_price",
      "taxable",
      "client_visible",
      "billable",
    ] as const
  ).filter((field) => (payload[field] ?? null) !== ((current as Record<string, unknown>)[field] ?? null));

  const { error: updateError } = await db
    .from("services")
    .update({
      ...payload,
      stripe_sync_status: nextSyncStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId);
  if (updateError) {
    redirect(withCode(backTo, "error", updateError.code === "23505" ? "code-taken" : "save-failed"));
  }

  const priceChanges: string[] = [];
  if ((payload.default_unit_price ?? null) !== (current.default_unit_price ?? null)) {
    priceChanges.push(
      `default unit price ${money(current.default_unit_price)} → ${money(payload.default_unit_price ?? null)}`,
    );
  }

  // ── variant reconciliation (§5.3: prices are history, never edited) ──
  if (variants?.rows) {
    const { data: openRows, error: openReadError } = await db
      .from("service_price_variants")
      .select("*")
      .eq("service_id", serviceId)
      .is("effective_to", null);
    if (openReadError) redirect(withCode(backTo, "error", "variant-save-failed"));
    const open: VariantRow[] = openRows ?? [];
    const effectiveDate = today();

    // Open rows are matched by id first, then by pricing axes. The axes
    // fallback absorbs stale form ids (double-submit, a second tab): a
    // superseded row's id no longer matches anything open, but its axes
    // find the row that replaced it — without this, a resubmit inserts a
    // duplicate open row with identical axes and variant resolution
    // becomes ambiguous.
    const axesKey = (v: Pick<VariantRow, "aircraft_category" | "aircraft_band" | "plan_tier_match">) =>
      [v.aircraft_category, v.aircraft_band, v.plan_tier_match]
        .map((part) => (part ?? "").trim().toLowerCase())
        .join("|");
    const claimed = new Set<string>();

    for (const row of variants.rows) {
      let match = row.id ? open.find((v) => v.id === row.id && !claimed.has(v.id)) : undefined;
      if (!match) match = open.find((v) => !claimed.has(v.id) && axesKey(v) === axesKey(row));
      if (!match) {
        // Genuinely new axes: open a fresh price row.
        const { error: insertError } = await db.from("service_price_variants").insert({
          service_id: serviceId,
          label: row.label,
          aircraft_category: row.aircraft_category,
          aircraft_band: row.aircraft_band,
          plan_tier_match: row.plan_tier_match,
          unit_price: row.unit_price,
          annual_price: row.annual_price,
          effective_from: effectiveDate,
          sort_order: row.sort_order,
        });
        if (insertError) redirect(withCode(backTo, "error", "variant-save-failed"));
        continue;
      }
      claimed.add(match.id);
      const priceChanged =
        Number(match.unit_price) !== row.unit_price ||
        (match.annual_price === null ? null : Number(match.annual_price)) !== row.annual_price;
      if (priceChanged) {
        // NEVER in-place-edit a price: close the old row and open a new one
        // so every historical quote line keeps pointing at the price that
        // was actually offered. New rows get no Stripe price ids — Phase 2
        // mints a fresh Stripe price per price row.
        const { error: closeError } = await db
          .from("service_price_variants")
          .update({ effective_to: effectiveDate })
          .eq("id", match.id);
        if (closeError) redirect(withCode(backTo, "error", "variant-save-failed"));
        const { error: reopenError } = await db.from("service_price_variants").insert({
          service_id: serviceId,
          label: row.label,
          aircraft_category: row.aircraft_category,
          aircraft_band: row.aircraft_band,
          plan_tier_match: row.plan_tier_match,
          unit_price: row.unit_price,
          annual_price: row.annual_price,
          effective_from: effectiveDate,
          sort_order: row.sort_order,
        });
        if (reopenError) {
          // Compensate: reopen the row we just closed so the service does
          // not silently lose its open price, then surface the failure.
          await db.from("service_price_variants").update({ effective_to: null }).eq("id", match.id);
          redirect(withCode(backTo, "error", "variant-save-failed"));
        }
        priceChanges.push(
          `${row.label ?? match.label ?? "variant"}: ${money(Number(match.unit_price))} → ${money(row.unit_price)}` +
            (row.annual_price !== null || match.annual_price !== null
              ? ` (annual ${money(match.annual_price === null ? null : Number(match.annual_price))} → ${money(row.annual_price)})`
              : ""),
        );
      } else {
        // Metadata-only edits (label/axes/sort) are allowed in place.
        const { error: metaError } = await db
          .from("service_price_variants")
          .update({
            label: row.label,
            aircraft_category: row.aircraft_category,
            aircraft_band: row.aircraft_band,
            plan_tier_match: row.plan_tier_match,
            sort_order: row.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", match.id);
        if (metaError) redirect(withCode(backTo, "error", "variant-save-failed"));
      }
    }

    // Variants removed in the form are CLOSED, never deleted — price rows
    // are history and may be referenced by quote/invoice snapshots.
    for (const variant of open) {
      if (!claimed.has(variant.id)) {
        const { error: closeError } = await db
          .from("service_price_variants")
          .update({ effective_to: effectiveDate })
          .eq("id", variant.id);
        if (closeError) redirect(withCode(backTo, "error", "variant-save-failed"));
        priceChanges.push(`${variant.label ?? "variant"}: ${money(Number(variant.unit_price))} → closed`);
      }
    }
  }

  // ── variable reconciliation (definition, not history: delete removed) ─
  if (variables?.rows) {
    const { data: existingVariables } = await db
      .from("service_variables")
      .select("id")
      .eq("service_id", serviceId);
    const submittedIds = new Set(variables.rows.map((row) => row.id).filter(Boolean));
    const removed = (existingVariables ?? []).filter((row) => !submittedIds.has(row.id)).map((row) => row.id);
    if (removed.length) {
      const { error } = await db.from("service_variables").delete().in("id", removed);
      if (error) redirect(withCode(backTo, "error", "children-save-failed"));
    }
    for (const row of variables.rows) {
      const { id, ...fields } = row;
      if (id && (existingVariables ?? []).some((v) => v.id === id)) {
        const { error } = await db
          .from("service_variables")
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) redirect(withCode(backTo, "error", "children-save-failed"));
      } else {
        const { error } = await db.from("service_variables").insert({ ...fields, service_id: serviceId });
        if (error) redirect(withCode(backTo, "error", "children-save-failed"));
      }
    }
  }

  // ── attachment reconciliation (definition, not history) ──────────────
  if (attachments?.rows) {
    const { data: existingAttachments } = await db
      .from("service_attachments")
      .select("id")
      .eq("parent_service_id", serviceId);
    const submittedIds = new Set(attachments.rows.map((row) => row.id).filter(Boolean));
    const removed = (existingAttachments ?? []).filter((row) => !submittedIds.has(row.id)).map((row) => row.id);
    if (removed.length) {
      const { error } = await db.from("service_attachments").delete().in("id", removed);
      if (error) redirect(withCode(backTo, "error", "children-save-failed"));
    }
    for (const row of attachments.rows) {
      const { id, ...fields } = row;
      if (id && (existingAttachments ?? []).some((a) => a.id === id)) {
        const { error } = await db.from("service_attachments").update(fields).eq("id", id);
        if (error) redirect(withCode(backTo, "error", "children-save-failed"));
      } else {
        const { error } = await db.from("service_attachments").insert({ ...fields, parent_service_id: serviceId });
        if (error) redirect(withCode(backTo, "error", "children-save-failed"));
      }
    }
  }

  await logAuditEvent({
    actor: admin,
    action: "service_updated",
    detail: `Updated service ${payload.code}${changedFields.length ? ` (changed: ${changedFields.join(", ")})` : ""}`,
    entityType: "service",
    entityId: serviceId,
  });
  if (priceChanges.length) {
    await logAuditEvent({
      actor: admin,
      action: "service_price_changed",
      detail: `Price change on ${payload.code}: ${priceChanges.join("; ")}`,
      entityType: "service",
      entityId: serviceId,
    });
  }

  revalidatePath(BASE);
  revalidatePath(`${BASE}/${serviceId}`);
  redirect(withCode(backTo, "success", "saved"));
}

export async function archiveService(formData: FormData) {
  const admin = await actor(["admin"], "settings.edit");
  const db = await createServiceClient();
  const serviceId = str(formData, "service_id");
  if (!serviceId) redirect(withCode(BASE, "error", "missing"));
  const backTo = safeRedirectPath(str(formData, "redirect_to"), `${BASE}/${serviceId}`);

  const { data: service } = await db
    .from("services")
    .select("id, code, name, status, linked_plan_tier_id")
    .eq("id", serviceId)
    .maybeSingle();
  if (!service) redirect(withCode(BASE, "error", "notfound"));

  // Archive never deletes and never cascades (§2). Variants, variables,
  // attachments, and every historical quote/invoice snapshot stay intact;
  // the service simply stops being offerable. We WARN (not block) when the
  // service is still referenced so the admin knows what keeps pointing here.
  const [{ count: quoteRefs }, { count: invoiceRefs }] = await Promise.all([
    db.from("quote_line_items").select("id", { count: "exact", head: true }).eq("service_id", serviceId),
    db.from("invoice_line_items").select("id", { count: "exact", head: true }).eq("service_id", serviceId),
  ]);
  let subscriptionRefs = 0;
  if (service.linked_plan_tier_id) {
    const { data: tier } = await db
      .from("subscription_plan_tiers")
      .select("plan_id")
      .eq("id", service.linked_plan_tier_id)
      .maybeSingle();
    if (tier?.plan_id) {
      const { count } = await db
        .from("client_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", tier.plan_id);
      subscriptionRefs = count ?? 0;
    }
  }

  const { error: archiveError } = await db
    .from("services")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", serviceId);
  if (archiveError) redirect(withCode(backTo, "error", "save-failed"));

  const refSummary = `${quoteRefs ?? 0} quote line(s), ${invoiceRefs ?? 0} invoice line(s), ${subscriptionRefs} linked subscription(s)`;
  await logAuditEvent({
    actor: admin,
    action: "service_archived",
    detail: `Archived service ${service.code} (${service.name}) — still referenced by ${refSummary}; nothing cascaded`,
    entityType: "service",
    entityId: serviceId,
  });

  revalidatePath(BASE);
  revalidatePath(`${BASE}/${serviceId}`);
  const referenced = (quoteRefs ?? 0) + (invoiceRefs ?? 0) + subscriptionRefs > 0;
  redirect(
    referenced
      ? `${withCode(backTo, "success", "archived")}&warn=in-use&quote_refs=${quoteRefs ?? 0}&invoice_refs=${invoiceRefs ?? 0}&subscription_refs=${subscriptionRefs}`
      : withCode(backTo, "success", "archived"),
  );
}

export async function duplicateService(formData: FormData) {
  const admin = await actor(["admin"], "settings.add");
  const db = await createServiceClient();
  const serviceId = str(formData, "service_id");
  if (!serviceId) redirect(withCode(BASE, "error", "missing"));
  const backTo = safeRedirectPath(str(formData, "redirect_to"), `${BASE}/${serviceId}`);

  const { data: source } = await db.from("services").select("*").eq("id", serviceId).maybeSingle();
  if (!source) redirect(withCode(BASE, "error", "notfound"));

  const [{ data: openVariants }, { data: sourceVariables }, { data: sourceAttachments }] = await Promise.all([
    db.from("service_price_variants").select("*").eq("service_id", serviceId).is("effective_to", null),
    db.from("service_variables").select("*").eq("service_id", serviceId),
    db.from("service_attachments").select("*").eq("parent_service_id", serviceId),
  ]);

  // Find a free code: CODE-copy, CODE-copy-2, ...
  const { data: taken } = await db.from("services").select("code").like("code", `${source.code}-copy%`);
  const takenCodes = new Set((taken ?? []).map((row) => row.code));
  let newCode = `${source.code}-copy`;
  for (let n = 2; takenCodes.has(newCode); n += 1) newCode = `${source.code}-copy-${n}`;

  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    created_by: _createdBy,
    stripe_product_id_test: _stripeTest,
    stripe_product_id_live: _stripeLive,
    stripe_sync_status: _stripeStatus,
    stripe_sync_error: _stripeError,
    code: _code,
    name: _name,
    status: _status,
    ...copyable
  } = source;

  const { data: copy, error: insertError } = await db
    .from("services")
    .insert({
      ...copyable,
      code: newCode,
      name: `${source.name} (Copy)`,
      // Copies start over as drafts with no Stripe identity of their own —
      // snapshot-never-reference applies to Stripe ids too.
      status: "draft",
      stripe_sync_status: deriveStripeSyncStatus(
        source.pricing_model,
        (sourceVariables ?? []).map((v) => ({ role: v.role as VariableInput["role"] })),
      ),
      created_by: admin.id,
    })
    .select("id, code")
    .single();
  if (insertError || !copy) redirect(withCode(backTo, "error", "duplicate-failed"));

  // Same compensation as createService: a failed child copy removes the
  // half-made duplicate so it never reads as a finished copy.
  const failDuplicate = async (): Promise<never> => {
    await db.from("services").delete().eq("id", copy.id);
    redirect(withCode(backTo, "error", "duplicate-failed"));
  };

  const effectiveFrom = today();
  if (openVariants?.length) {
    const { error } = await db.from("service_price_variants").insert(
      openVariants.map((variant) => ({
        service_id: copy.id,
        label: variant.label,
        aircraft_category: variant.aircraft_category,
        aircraft_band: variant.aircraft_band,
        plan_tier_match: variant.plan_tier_match,
        unit_price: variant.unit_price,
        annual_price: variant.annual_price,
        effective_from: effectiveFrom,
        sort_order: variant.sort_order,
      })),
    );
    if (error) await failDuplicate();
  }
  if (sourceVariables?.length) {
    const { error } = await db.from("service_variables").insert(
      sourceVariables.map(({ id: _vid, created_at: _vc, updated_at: _vu, ...variable }) => ({
        ...variable,
        service_id: copy.id,
      })),
    );
    if (error) await failDuplicate();
  }
  if (sourceAttachments?.length) {
    const { error } = await db.from("service_attachments").insert(
      sourceAttachments.map(({ id: _aid, created_at: _ac, ...attachment }) => ({
        ...attachment,
        parent_service_id: copy.id,
      })),
    );
    if (error) await failDuplicate();
  }

  await logAuditEvent({
    actor: admin,
    action: "service_created",
    detail: `Duplicated service ${source.code} → ${copy.code} (draft)`,
    entityType: "service",
    entityId: copy.id,
  });

  revalidatePath(BASE);
  redirect(withCode(`${BASE}/${copy.id}`, "success", "duplicated"));
}

export async function retryStripeSync(formData: FormData) {
  const admin = await actor(["admin"], "settings.edit");
  const db = await createServiceClient();
  const serviceId = str(formData, "service_id");
  if (!serviceId) redirect(withCode(BASE, "error", "missing"));
  const backTo = safeRedirectPath(str(formData, "redirect_to"), `${BASE}/${serviceId}`);

  const { data: service } = await db
    .from("services")
    .select("id, code, stripe_sync_status")
    .eq("id", serviceId)
    .maybeSingle();
  if (!service) redirect(withCode(BASE, "error", "notfound"));
  if (service.stripe_sync_status === "not_applicable") {
    redirect(withCode(backTo, "error", "sync-not-applicable"));
  }

  // Phase 1: no live Stripe call — just re-queue. Phase 2's sync worker
  // consumes 'pending' rows and flips them to 'synced'/'error'.
  const { error: requeueError } = await db
    .from("services")
    .update({ stripe_sync_status: "pending", stripe_sync_error: null, updated_at: new Date().toISOString() })
    .eq("id", serviceId);
  if (requeueError) redirect(withCode(backTo, "error", "save-failed"));

  await logAuditEvent({
    actor: admin,
    action: "service_updated",
    detail: `Re-queued Stripe sync for ${service.code} — sync deferred to Stripe phase`,
    entityType: "service",
    entityId: serviceId,
  });

  revalidatePath(`${BASE}/${serviceId}`);
  redirect(withCode(backTo, "success", "sync-queued"));
}
