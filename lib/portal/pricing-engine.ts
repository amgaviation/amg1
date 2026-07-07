/**
 * Pure pricing engine for the service catalog (plan §4).
 *
 * HARD CONSTRAINTS — do not violate:
 * - Zero I/O. No supabase imports, no fetch, no Date.now()/randomness.
 *   Every function is deterministic: same inputs → same outputs. Safe to
 *   import from client components, server actions, and node scripts alike.
 * - Snapshot-never-reference: callers copy PricedLine values into
 *   quote/invoice line items; nothing here reads live catalog rows.
 * - Cost-type integrity: AMG margin lives ONLY inside the configured
 *   prices of `coordination` fees/retainers and `plan_fee` lines.
 *   `pass_through` carries ZERO markup — this engine has no markup code
 *   path at all (every PricedLine is emitted with markup_type "none" and
 *   markup_value 0), so pass-through cannot silently gain margin.
 * - cost_type is permanent per service; the engine only echoes it.
 *
 * Shapes below mirror the DB columns of services / service_price_variants /
 * service_variables / service_attachments but are defined locally (plain TS,
 * no database.types import) to keep the module pure and client-safe.
 */

// ── Enumerations (mirror DB check constraints) ──────────────────────

export const COST_TYPES = ["coordination", "pass_through", "plan_fee"] as const;
export type CostType = (typeof COST_TYPES)[number];

export const SERVICE_FREQUENCIES = ["one_time", "per_mission", "recurring"] as const;
export type ServiceFrequency = (typeof SERVICE_FREQUENCIES)[number];

export type BillingFrequency = ServiceFrequency;
export type RecurringInterval = "month" | "year";

export const VARIABLE_ROLES = ["quantity", "multiplier", "info"] as const;
export type VariableRole = (typeof VARIABLE_ROLES)[number];

export const VARIABLE_INPUT_TYPES = ["number", "select", "boolean"] as const;
export type VariableInputType = (typeof VARIABLE_INPUT_TYPES)[number];

export const ATTACHMENT_MODES = ["required", "default_on", "suggested"] as const;
export type AttachmentMode = (typeof ATTACHMENT_MODES)[number];

/**
 * Business policy, stated structurally so reviewers and callers can assert
 * against it: only coordination fees/retainers (and plan fees) may embed AMG
 * margin in their configured price; pass-through is billed at actual cost.
 */
export const COST_TYPE_POLICY: Record<
  CostType,
  { carriesAmgMargin: boolean; markupPercent: 0 }
> = {
  coordination: { carriesAmgMargin: true, markupPercent: 0 },
  plan_fee: { carriesAmgMargin: true, markupPercent: 0 },
  pass_through: { carriesAmgMargin: false, markupPercent: 0 },
};

/** Default quote-line category per cost type (see QUOTE_CATEGORIES). */
export const DEFAULT_CATEGORY_FOR_COST_TYPE: Record<CostType, string> = {
  coordination: "Owner / Client Coordination",
  pass_through: "Pass-Through Expenses",
  plan_fee: "Administrative / Subscription / Program Fees",
};

// ── Catalog shapes (plain mirrors of the DB rows) ───────────────────

export interface CatalogService {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  client_description?: string | null;
  category?: string | null;
  cost_type: string; // 'coordination' | 'pass_through' | 'plan_fee'
  status?: string; // 'draft' | 'active' | 'archived'
  pricing_model?: string; // 'flat' | 'per_unit' | 'variant_matrix' | 'passthrough_estimate'
  unit?: string | null;
  default_unit_price?: number | null;
  frequency: string; // 'one_time' | 'per_mission' | 'recurring'
  recurring_interval?: string | null; // 'month' | 'year'
  recurring_interval_count?: number | null;
  min_quantity?: number | null;
  max_quantity?: number | null;
  taxable?: boolean;
  client_visible?: boolean;
  billable?: boolean;
  requires_deposit_percent?: number | null;
  sort_order?: number | null;
}

export interface CatalogVariant {
  id: string;
  service_id: string;
  label?: string | null;
  aircraft_category?: string | null;
  aircraft_band?: string | null; // 'A' | 'B'
  plan_tier_match?: string | null; // tier name; null = non-member/standard rate
  unit_price: number;
  annual_price?: number | null;
  effective_from: string; // ISO date (YYYY-MM-DD)
  effective_to?: string | null; // exclusive; null = open-ended
  sort_order?: number | null;
}

export interface CatalogVariable {
  id?: string;
  service_id: string;
  key: string;
  label: string;
  input_type: string; // 'number' | 'select' | 'boolean'
  options?: unknown; // jsonb — see normalizeVariableOptions
  default_value?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  role: string; // 'quantity' | 'multiplier' | 'info'
  required?: boolean;
  sort_order?: number | null;
}

export interface CatalogAttachment {
  id: string;
  parent_service_id: string;
  child_service_id: string;
  attachment_mode: string; // 'required' | 'default_on' | 'suggested'
  quantity: number;
  price_override?: number | null;
  sort_order?: number | null;
}

/** One normalized choice for a select variable. */
export interface VariableOption {
  value: string;
  label: string;
  /** Optional price multiplier this option applies (role='multiplier'). */
  multiplier: number | null;
}

// ── Inputs & context ────────────────────────────────────────────────

export type CalculatorInputValue = string | number | boolean | null;
export type CalculatorInputs = Record<string, CalculatorInputValue | undefined>;

export interface PricingContext {
  aircraftBand?: string | null;
  aircraftCategory?: string | null;
  planTier?: string | null;
  /** ISO date (YYYY-MM-DD) the price must be effective on. */
  asOfDate: string;
}

// ── Outputs ─────────────────────────────────────────────────────────

export interface ResolvedVariant {
  variant: CatalogVariant | null;
  /** true → no variant matched; service.default_unit_price is used. */
  fallbackUsed: boolean;
}

/** JSON-serializable echo stored in quote/invoice calculator_inputs. */
export interface CalculatorInputsSnapshot {
  inputs: Record<string, CalculatorInputValue>;
  context: {
    aircraft_band: string | null;
    aircraft_category: string | null;
    plan_tier: string | null;
    as_of_date: string;
  };
  variant_id: string | null;
  variant_label: string | null;
  effective_from: string | null;
  effective_to: string | null;
  fallback_used: boolean;
  quantity_components: Record<string, number>;
  multiplier_components: Record<string, number>;
  price_override: number | null;
  variant_annual_price: number | null;
}

export interface PricedLine {
  service_id: string;
  service_variant_id: string | null;
  category: string;
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  amount: number;
  cost_type: CostType;
  billing_frequency: BillingFrequency;
  recurring_interval: RecurringInterval | null;
  recurring_interval_count: number | null;
  taxable: boolean;
  client_visible: boolean;
  billable: boolean;
  requires_deposit_percent: number | null;
  /**
   * Always "none"/0: the engine never applies markup. Coordination margin
   * lives in the configured price; pass-through is at cost by construction.
   */
  markup_type: "none";
  markup_value: 0;
  calculator_inputs: CalculatorInputsSnapshot;
  price_explanation: string;
  item_code: string;
  sort_order: number;
}

/** A PricedLine produced by expanding a parent's attachments (depth-1). */
export interface AttachedPricedLine extends PricedLine {
  attachment: {
    id: string;
    parent_service_id: string;
    mode: AttachmentMode;
    /** required → the UI must not allow removal. */
    locked: boolean;
    /** required/default_on → pre-checked; suggested → offered only. */
    preselected: boolean;
  };
}

export interface QuoteTotals {
  /** one_time + per_mission line amounts. */
  oneTimeSubtotal: number;
  /** Recurring 'month'-interval lines normalized to a per-month figure. */
  recurringMonthly: number;
  /**
   * Recurring 'year'-interval lines normalized to a per-year figure.
   * Independent of recurringMonthly by design — annual/12 is NOT folded
   * into monthly and monthly×12 is NOT folded into annual.
   */
  recurringAnnual: number;
  coordinationTotal: number;
  passThroughTotal: number;
  planFeeTotal: number;
  /** Sum of all billable line amounts (as quoted, un-normalized). */
  grandTotal: number;
  /** max(requires_deposit_percent over one-time lines) × oneTimeSubtotal. */
  suggestedDeposit: number;
}

// ── Small pure helpers ──────────────────────────────────────────────

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
  }
  return false;
}

function clamp(value: number, min: number | null | undefined, max: number | null | undefined): number {
  let out = value;
  if (typeof min === "number" && Number.isFinite(min) && out < min) out = min;
  if (typeof max === "number" && Number.isFinite(max) && out > max) out = max;
  return out;
}

function normText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Normalize a date-ish string to a lexicographically comparable YYYY-MM-DD key. */
function dateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

/** "$1,250", "$99.50" — whole dollars drop cents, otherwise 2 decimals. */
export function formatMoney(value: number): string {
  const rounded = round2(value);
  const negative = rounded < 0;
  const abs = Math.abs(rounded);
  const isWhole = Math.abs(abs - Math.round(abs)) < 1e-9;
  const fixed = isWhole ? String(Math.round(abs)) : abs.toFixed(2);
  const [whole, cents] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}${cents ? `.${cents}` : ""}`;
}

function formatFactor(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
}

function pluralizeUnit(unit: string, quantity: number): string {
  const trimmed = unit.trim();
  if (!trimmed) return "";
  if (quantity === 1) return trimmed;
  if (/s$/i.test(trimmed)) return trimmed;
  return `${trimmed}s`;
}

/** Accepts string[], {value,label,multiplier}[], or single-object jsonb. */
export function normalizeVariableOptions(raw: unknown): VariableOption[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    const out: VariableOption[] = [];
    for (const entry of raw) {
      if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
        out.push({ value: String(entry), label: String(entry), multiplier: null });
        continue;
      }
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const value = record.value ?? record.key ?? record.id;
        if (value === undefined || value === null) continue;
        out.push({
          value: String(value),
          label: typeof record.label === "string" ? record.label : String(value),
          multiplier: toNumber(record.multiplier),
        });
      }
    }
    return out;
  }
  return [];
}

/** Multiplier a boolean variable applies when true (default 1 = no change). */
export function booleanMultiplier(variable: CatalogVariable): number {
  const options = variable.options;
  if (options && typeof options === "object" && !Array.isArray(options)) {
    const direct = toNumber((options as Record<string, unknown>).multiplier);
    if (direct !== null) return direct;
  }
  const match = normalizeVariableOptions(options).find((option) =>
    ["true", "1", "yes", "on"].includes(option.value.trim().toLowerCase()),
  );
  if (match && match.multiplier !== null) return match.multiplier;
  return 1;
}

function asCostType(value: string): CostType {
  return (COST_TYPES as readonly string[]).includes(value)
    ? (value as CostType)
    : "coordination";
}

function asAttachmentMode(value: string): AttachmentMode {
  return (ATTACHMENT_MODES as readonly string[]).includes(value)
    ? (value as AttachmentMode)
    : "suggested";
}

// ── resolveVariant ──────────────────────────────────────────────────

function variantMatches(variant: CatalogVariant, ctx: PricingContext): boolean {
  if (variant.aircraft_category != null && variant.aircraft_category !== "") {
    if (normText(variant.aircraft_category) !== normText(ctx.aircraftCategory)) return false;
  }
  if (variant.aircraft_band != null && variant.aircraft_band !== "") {
    if (normText(variant.aircraft_band) !== normText(ctx.aircraftBand)) return false;
  }
  if (variant.plan_tier_match != null && variant.plan_tier_match !== "") {
    if (normText(variant.plan_tier_match) !== normText(ctx.planTier)) return false;
  }
  const asOf = dateKey(ctx.asOfDate);
  if (!asOf) return false;
  const from = dateKey(variant.effective_from);
  if (from && asOf < from) return false;
  const to = dateKey(variant.effective_to);
  if (to && asOf >= to) return false; // effective_to is exclusive
  return true;
}

function variantSpecificity(variant: CatalogVariant): number {
  let score = 0;
  if (variant.aircraft_category != null && variant.aircraft_category !== "") score += 1;
  if (variant.aircraft_band != null && variant.aircraft_band !== "") score += 1;
  if (variant.plan_tier_match != null && variant.plan_tier_match !== "") score += 1;
  return score;
}

/**
 * Pick the price variant for a service in a context. Every non-null axis on
 * a variant must match the context; the most-specific match wins (most
 * non-null axes), tiebreak sort_order asc then newest effective_from.
 * Tier fallback to the non-member rate happens naturally: a variant whose
 * plan_tier_match is null matches any (or no) plan tier at lower specificity.
 */
export function resolveVariant(
  service: Pick<CatalogService, "id">,
  variants: CatalogVariant[],
  ctx: PricingContext,
): ResolvedVariant {
  const candidates = variants.filter(
    (variant) => variant.service_id === service.id && variantMatches(variant, ctx),
  );
  if (candidates.length === 0) return { variant: null, fallbackUsed: true };
  const sorted = [...candidates].sort((a, b) => {
    const specificity = variantSpecificity(b) - variantSpecificity(a);
    if (specificity !== 0) return specificity;
    const sortOrder = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (sortOrder !== 0) return sortOrder;
    const aFrom = dateKey(a.effective_from) ?? "";
    const bFrom = dateKey(b.effective_from) ?? "";
    if (aFrom !== bFrom) return aFrom > bFrom ? -1 : 1; // newest first
    return a.id.localeCompare(b.id);
  });
  return { variant: sorted[0], fallbackUsed: false };
}

// ── priceService ────────────────────────────────────────────────────

interface VariableResolution {
  quantity: number;
  multiplier: number;
  quantityComponents: Record<string, number>;
  multiplierComponents: Record<string, number>;
  echo: Record<string, CalculatorInputValue>;
}

function resolveVariables(
  service: CatalogService,
  variables: CatalogVariable[],
  inputs: CalculatorInputs,
): VariableResolution {
  const relevant = variables
    .filter((variable) => variable.service_id === service.id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  let quantity = 1;
  let multiplier = 1;
  const quantityComponents: Record<string, number> = {};
  const multiplierComponents: Record<string, number> = {};
  const echo: Record<string, CalculatorInputValue> = {};

  for (const variable of relevant) {
    const provided = inputs[variable.key];
    const raw: CalculatorInputValue =
      provided === undefined ? variable.default_value ?? null : provided;
    echo[variable.key] = raw;

    if (variable.role === "quantity") {
      let value = toNumber(raw);
      if (variable.input_type === "select" && value === null) {
        const option = normalizeVariableOptions(variable.options).find(
          (candidate) => candidate.value === String(raw ?? ""),
        );
        value = option ? toNumber(option.value) : null;
      }
      const clamped = clamp(value ?? 1, variable.min_value, variable.max_value);
      quantityComponents[variable.key] = clamped;
      quantity *= clamped;
      continue;
    }

    if (variable.role === "multiplier") {
      let factor = 1;
      if (variable.input_type === "boolean") {
        factor = toBoolean(raw) ? booleanMultiplier(variable) : 1;
      } else if (variable.input_type === "select") {
        const selected = String(raw ?? "");
        const option = normalizeVariableOptions(variable.options).find(
          (candidate) => candidate.value === selected,
        );
        if (option) {
          factor = option.multiplier ?? toNumber(option.value) ?? 1;
        }
      } else {
        const value = toNumber(raw);
        factor = value === null ? 1 : clamp(value, variable.min_value, variable.max_value);
      }
      multiplierComponents[variable.key] = factor;
      multiplier *= factor;
    }
    // role === 'info' → echoed only, never affects price.
  }

  quantity = clamp(quantity, service.min_quantity, service.max_quantity);
  return { quantity, multiplier, quantityComponents, multiplierComponents, echo };
}

function billingFrequencyOf(service: CatalogService): {
  billing_frequency: BillingFrequency;
  recurring_interval: RecurringInterval | null;
  recurring_interval_count: number | null;
} {
  if (service.frequency === "recurring") {
    const interval: RecurringInterval = service.recurring_interval === "year" ? "year" : "month";
    const count = toNumber(service.recurring_interval_count);
    return {
      billing_frequency: "recurring",
      recurring_interval: interval,
      recurring_interval_count: count && count >= 1 ? Math.round(count) : 1,
    };
  }
  if (service.frequency === "per_mission") {
    return { billing_frequency: "per_mission", recurring_interval: null, recurring_interval_count: null };
  }
  return { billing_frequency: "one_time", recurring_interval: null, recurring_interval_count: null };
}

function humanizeTier(tier: string): string {
  const cleaned = tier.replace(/[_-]+/g, " ").trim();
  const cased = cleaned
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
  return /member/i.test(cased) ? `${cased} rate` : `${cased} member rate`;
}

function buildExplanation(args: {
  unitPrice: number;
  quantity: number;
  multiplier: number;
  unit: string | null;
  variant: CatalogVariant | null;
  fallbackUsed: boolean;
  priceOverride: number | null;
  estimate: boolean;
}): string {
  const { unitPrice, quantity, multiplier, unit, variant, fallbackUsed, priceOverride, estimate } = args;
  let head = formatMoney(unitPrice);
  if (quantity !== 1) {
    const unitLabel = unit ? ` ${pluralizeUnit(unit, quantity)}` : "";
    head += ` × ${formatFactor(quantity)}${unitLabel}`;
  }
  if (multiplier !== 1) head += ` × ${formatFactor(multiplier)}`;

  const pieces: string[] = [];
  if (priceOverride !== null) pieces.push("custom bundle price");
  if (variant) {
    if (variant.label && variant.label.trim()) {
      pieces.push(variant.label.trim());
    } else {
      if (variant.aircraft_band) pieces.push(`Band ${variant.aircraft_band}`);
      if (variant.aircraft_category) pieces.push(variant.aircraft_category);
      if (variant.plan_tier_match) pieces.push(humanizeTier(variant.plan_tier_match));
    }
    const from = dateKey(variant.effective_from);
    if (from) pieces.push(`effective ${from}`);
  } else if (fallbackUsed) {
    pieces.push("standard rate");
  }
  if (estimate) pieces.push("pass-through estimate");

  return pieces.length > 0 ? `${head} — ${pieces.join(", ")}` : head;
}

export interface PriceServiceOptions {
  /** Per-unit price override (service_attachments.price_override). */
  priceOverride?: number | null;
  /** Extra quantity factor (service_attachments.quantity). */
  quantityFactor?: number;
  sortOrder?: number;
}

/**
 * Price one service in a context. Deterministic; the returned PricedLine is
 * a full snapshot ready to copy into quote_line_items / invoice_line_items.
 */
export function priceService(
  service: CatalogService,
  variants: CatalogVariant[],
  variables: CatalogVariable[],
  inputs: CalculatorInputs,
  ctx: PricingContext,
  options: PriceServiceOptions = {},
): PricedLine {
  const { variant, fallbackUsed } = resolveVariant(service, variants, ctx);
  const resolution = resolveVariables(service, variables, inputs);

  const quantityFactor =
    typeof options.quantityFactor === "number" && Number.isFinite(options.quantityFactor)
      ? options.quantityFactor
      : 1;
  const quantity = clamp(
    resolution.quantity * quantityFactor,
    service.min_quantity,
    service.max_quantity,
  );

  const priceOverride =
    typeof options.priceOverride === "number" && Number.isFinite(options.priceOverride)
      ? round2(options.priceOverride)
      : null;
  const baseUnitPrice = variant ? variant.unit_price : service.default_unit_price ?? 0;
  const unitPrice = round2(priceOverride ?? baseUnitPrice);

  const amount = round2(unitPrice * quantity * resolution.multiplier);
  const frequency = billingFrequencyOf(service);
  const costType = asCostType(service.cost_type);
  const estimate = service.pricing_model === "passthrough_estimate";

  const calculatorInputs: CalculatorInputsSnapshot = {
    inputs: resolution.echo,
    context: {
      aircraft_band: ctx.aircraftBand ?? null,
      aircraft_category: ctx.aircraftCategory ?? null,
      plan_tier: ctx.planTier ?? null,
      as_of_date: dateKey(ctx.asOfDate) ?? ctx.asOfDate,
    },
    variant_id: variant?.id ?? null,
    variant_label: variant?.label ?? null,
    effective_from: variant ? dateKey(variant.effective_from) : null,
    effective_to: variant ? dateKey(variant.effective_to) : null,
    fallback_used: fallbackUsed,
    quantity_components: resolution.quantityComponents,
    multiplier_components: resolution.multiplierComponents,
    price_override: priceOverride,
    variant_annual_price: variant?.annual_price ?? null,
  };

  return {
    service_id: service.id,
    service_variant_id: variant?.id ?? null,
    category:
      service.category && service.category.trim()
        ? service.category
        : DEFAULT_CATEGORY_FOR_COST_TYPE[costType],
    description: service.client_description?.trim() || service.name,
    quantity,
    unit: service.unit ?? null,
    unit_price: unitPrice,
    amount,
    cost_type: costType,
    billing_frequency: frequency.billing_frequency,
    recurring_interval: frequency.recurring_interval,
    recurring_interval_count: frequency.recurring_interval_count,
    taxable: service.taxable ?? false,
    client_visible: service.client_visible ?? true,
    billable: service.billable ?? true,
    requires_deposit_percent: service.requires_deposit_percent ?? null,
    markup_type: "none",
    markup_value: 0,
    calculator_inputs: calculatorInputs,
    price_explanation: buildExplanation({
      unitPrice,
      quantity,
      multiplier: resolution.multiplier,
      unit: service.unit ?? null,
      variant,
      fallbackUsed,
      priceOverride,
      estimate,
    }),
    item_code: service.code,
    sort_order: options.sortOrder ?? service.sort_order ?? 0,
  };
}

// ── expandAttachments ───────────────────────────────────────────────

export interface ExpandAttachmentsExtras {
  /** Variants for the whole catalog — children resolve their own prices. */
  variants?: CatalogVariant[];
  /** Variables for the whole catalog — children use their defaults. */
  variables?: CatalogVariable[];
}

/**
 * Expand a parent's attached services into priced child lines. Depth-1 ONLY
 * by design (the DB blocks self-attachment; deeper chains are ignored here).
 * Each line honors the attachment's quantity and per-unit price_override and
 * is annotated with its mode so the UI can lock (required) or offer
 * (default_on / suggested) it.
 */
export function expandAttachments(
  service: Pick<CatalogService, "id">,
  attachments: CatalogAttachment[],
  allServices: CatalogService[],
  ctx: PricingContext,
  extras: ExpandAttachmentsExtras = {},
): AttachedPricedLine[] {
  const variants = extras.variants ?? [];
  const variables = extras.variables ?? [];
  const relevant = attachments
    .filter((attachment) => attachment.parent_service_id === service.id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const lines: AttachedPricedLine[] = [];
  for (const attachment of relevant) {
    if (attachment.child_service_id === service.id) continue; // cycle guard
    const child = allServices.find((candidate) => candidate.id === attachment.child_service_id);
    if (!child) continue;
    if (child.status === "archived") continue; // archived services never join new quotes

    const mode = asAttachmentMode(attachment.attachment_mode);
    const quantityFactor = toNumber(attachment.quantity) ?? 1;
    const line = priceService(child, variants, variables, {}, ctx, {
      priceOverride: attachment.price_override ?? null,
      quantityFactor: quantityFactor > 0 ? quantityFactor : 1,
      sortOrder: attachment.sort_order ?? child.sort_order ?? 0,
    });
    lines.push({
      ...line,
      attachment: {
        id: attachment.id,
        parent_service_id: attachment.parent_service_id,
        mode,
        locked: mode === "required",
        preselected: mode === "required" || mode === "default_on",
      },
    });
  }
  return lines;
}

// ── computeQuoteTotals ──────────────────────────────────────────────

/** Minimal line shape computeQuoteTotals needs (PricedLine satisfies it). */
export interface TotalableLine {
  amount: number;
  cost_type: string;
  billing_frequency?: string | null;
  recurring_interval?: string | null;
  recurring_interval_count?: number | null;
  billable?: boolean;
  requires_deposit_percent?: number | null;
}

/**
 * Aggregate priced lines into quote totals. Non-billable lines are excluded
 * from every figure. Recurring monthly/annual stay independent by interval:
 * 'month' lines normalize into recurringMonthly (amount ÷ interval_count),
 * 'year' lines normalize into recurringAnnual — never cross-converted.
 * Invariant: coordinationTotal + passThroughTotal + planFeeTotal === grandTotal.
 */
export function computeQuoteTotals(lines: TotalableLine[]): QuoteTotals {
  let oneTime = 0;
  let monthly = 0;
  let annual = 0;
  let coordination = 0;
  let passThrough = 0;
  let planFee = 0;
  let grand = 0;
  let depositPercent = 0;

  for (const line of lines) {
    if (line.billable === false) continue;
    const amount = toNumber(line.amount) ?? 0;
    const frequency = line.billing_frequency ?? "one_time";

    grand += amount;
    const costType = asCostType(line.cost_type);
    if (costType === "coordination") coordination += amount;
    else if (costType === "pass_through") passThrough += amount;
    else planFee += amount;

    if (frequency === "recurring") {
      const rawCount = toNumber(line.recurring_interval_count);
      const count = rawCount && rawCount >= 1 ? rawCount : 1;
      if (line.recurring_interval === "year") annual += amount / count;
      else monthly += amount / count;
    } else {
      // one_time and per_mission both land in the one-time subtotal.
      oneTime += amount;
      const percent = toNumber(line.requires_deposit_percent);
      if (percent !== null) {
        depositPercent = Math.max(depositPercent, clamp(percent, 0, 100));
      }
    }
  }

  const oneTimeSubtotal = round2(oneTime);
  const suggestedDeposit =
    oneTimeSubtotal > 0 && depositPercent > 0
      ? round2((oneTimeSubtotal * depositPercent) / 100)
      : 0;

  return {
    oneTimeSubtotal,
    recurringMonthly: round2(monthly),
    recurringAnnual: round2(annual),
    coordinationTotal: round2(coordination),
    passThroughTotal: round2(passThrough),
    planFeeTotal: round2(planFee),
    grandTotal: round2(grand),
    suggestedDeposit,
  };
}
