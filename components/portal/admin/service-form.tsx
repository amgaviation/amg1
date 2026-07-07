"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/portal/ui/primitives";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";

/**
 * Service catalog create/edit form (service-catalog plan §5). One component
 * serves both modes; the differences are structural, not cosmetic:
 * - cost_type is chosen exactly once at creation and rendered DISABLED on
 *   edit (a hidden field re-posts the current value so the server can verify
 *   nothing tried to change it — "cost-type-locked" otherwise).
 * - Price variants are history: the matrix below edits the CURRENT (open)
 *   rows only, and the server closes-and-reopens a row whenever its price
 *   changes. The UI says so next to the matrix.
 * The three repeatable collections travel as JSON-encoded hidden fields
 * (variants_json / variables_json / attachments_json) per the actions
 * contract in app/portal/actions/services.ts.
 */

// ── prop shapes (plain TS mirrors of the DB rows; no supabase imports) ──

export type ServiceFormService = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  client_description: string | null;
  category: string | null;
  cost_type: string;
  status: string;
  pricing_model: string;
  unit: string | null;
  default_unit_price: number | null;
  frequency: string;
  recurring_interval: string | null;
  recurring_interval_count: number | null;
  min_quantity: number | null;
  max_quantity: number | null;
  taxable: boolean;
  client_visible: boolean;
  billable: boolean;
  requires_deposit_percent: number | null;
  linked_plan_tier_id: string | null;
  notes_internal: string | null;
  sort_order: number | null;
  stripe_product_id_test: string | null;
  stripe_product_id_live: string | null;
  stripe_sync_status: string;
  stripe_sync_error: string | null;
};

export type ServiceFormVariant = {
  id: string | null;
  label: string | null;
  aircraft_category: string | null;
  aircraft_band: string | null;
  plan_tier_match: string | null;
  unit_price: number | string;
  annual_price: number | string | null;
  effective_from?: string | null;
};

export type ServiceFormVariable = {
  id: string | null;
  key: string;
  label: string;
  input_type: string;
  options: unknown;
  default_value: string | null;
  min_value: number | null;
  max_value: number | null;
  role: string;
  required: boolean;
};

export type ServiceFormAttachment = {
  id: string | null;
  child_service_id: string;
  attachment_mode: string;
  quantity: number | string;
  price_override: number | string | null;
};

export type AttachableService = {
  id: string;
  code: string;
  name: string;
  priceSummary?: string;
};

type FormAction = (formData: FormData) => void | Promise<void>;

// ── vocab (mirrors the DB check constraints / actions contract) ────────

const COST_TYPE_CHOICES = [
  {
    value: "coordination",
    label: "Coordination fee / retainer",
    blurb: "AMG coordination work billed as a flat fee — the ONLY place AMG margin lives; the fee includes it.",
  },
  {
    value: "pass_through",
    label: "Pass-through",
    blurb: "Vendor cost re-billed at actual cost with ZERO markup. Prices entered here are the at-cost amount.",
  },
  {
    value: "plan_fee",
    label: "Plan / program fee",
    blurb: "Subscription or program retainer billed under a plan tier; margin lives in the plan fee itself.",
  },
] as const;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const PRICING_MODEL_OPTIONS = [
  { value: "flat", label: "Flat fee — one price" },
  { value: "per_unit", label: "Per unit — price × quantity (day, hour, leg)" },
  { value: "variant_matrix", label: "Different price by client tier / aircraft" },
  { value: "passthrough_estimate", label: "No fixed price — billed at vendor cost" },
];

const FREQUENCY_OPTIONS = [
  { value: "one_time", label: "One-time" },
  { value: "per_mission", label: "Per mission" },
  { value: "recurring", label: "Recurring" },
];

const INTERVAL_OPTIONS = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

// Radix selects cannot re-post an empty value once one is chosen, so "any"
// is an explicit sentinel that serializes to null.
const BAND_OPTIONS = [
  { value: "any", label: "Any band" },
  { value: "A", label: "Band A (smaller aircraft)" },
  { value: "B", label: "Band B (larger aircraft)" },
];

const VARIABLE_INPUT_OPTIONS = [
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "boolean", label: "Yes / No" },
];

const VARIABLE_ROLE_OPTIONS = [
  { value: "quantity", label: "Quantity — count × price (e.g. fuel stops)" },
  { value: "multiplier", label: "Multiplier — scales the price (e.g. 1.25× intl)" },
  { value: "info", label: "Info only — recorded, no price effect" },
];

const ATTACHMENT_MODE_OPTIONS = [
  { value: "required", label: "Required (always added)" },
  { value: "default_on", label: "Default on (removable)" },
  { value: "suggested", label: "Suggested" },
];

const STRIPE_SYNC_TONE: Record<string, "success" | "warn" | "danger" | "neutral"> = {
  synced: "success",
  pending: "warn",
  error: "danger",
  not_applicable: "neutral",
};

// ── row state ───────────────────────────────────────────────────────────

type VariantRowState = {
  uid: number;
  id: string | null;
  label: string;
  aircraft_category: string;
  aircraft_band: string;
  plan_tier_match: string;
  unit_price: string;
  annual_price: string;
  effective_from: string | null;
};

type VariableRowState = {
  uid: number;
  id: string | null;
  key: string;
  label: string;
  input_type: string;
  role: string;
  required: boolean;
  default_value: string;
  min_value: string;
  max_value: string;
  options: string;
};

type AttachmentRowState = {
  uid: number;
  id: string | null;
  child_service_id: string;
  attachment_mode: string;
  quantity: string;
  price_override: string;
};

let uidCounter = 1;
function nextUid(): number {
  uidCounter += 1;
  return uidCounter;
}

function numStr(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function toNumOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function optionsToText(raw: unknown): string {
  if (!Array.isArray(raw)) return "";
  return raw
    .map((entry) => {
      if (typeof entry === "string" || typeof entry === "number") return String(entry);
      if (entry && typeof entry === "object" && "value" in (entry as Record<string, unknown>)) {
        return String((entry as Record<string, unknown>).value);
      }
      return "";
    })
    .filter(Boolean)
    .join(", ");
}

// ── small building blocks ──────────────────────────────────────────────

function BoolToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--deck-accent-line)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[var(--deck-accent)]"
      />
      <span className="min-w-0">
        <span className="block text-[var(--deck-text)]">{label}</span>
        {hint ? <span className="block text-[0.7rem] leading-5 text-[var(--deck-text-3)]">{hint}</span> : null}
      </span>
    </label>
  );
}

function RemoveRowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="justify-self-start text-xs text-[var(--deck-danger)] hover:text-[var(--deck-danger)]"
    >
      {label}
    </Button>
  );
}

// ── the form ───────────────────────────────────────────────────────────

export function ServiceForm({
  mode,
  action,
  retryAction,
  service,
  initialVariants = [],
  initialVariables = [],
  initialAttachments = [],
  tierOptions,
  attachableServices,
  redirectTo,
  cancelHref,
}: {
  mode: "create" | "edit";
  action: FormAction;
  /** retryStripeSync — rendered as its own form in the Stripe panel (edit only). */
  retryAction?: FormAction;
  service?: ServiceFormService | null;
  initialVariants?: ServiceFormVariant[];
  initialVariables?: ServiceFormVariable[];
  initialAttachments?: ServiceFormAttachment[];
  tierOptions: { value: string; label: string; tierName?: string }[];
  attachableServices: AttachableService[];
  redirectTo: string;
  cancelHref: string;
}) {
  const isEdit = mode === "edit" && Boolean(service);

  const [costType, setCostType] = useState(service?.cost_type ?? "");
  const [frequency, setFrequency] = useState(service?.frequency ?? "one_time");
  const [pricingModel, setPricingModel] = useState(service?.pricing_model ?? "flat");
  const [clientVisible, setClientVisible] = useState(service?.client_visible ?? true);
  const [billable, setBillable] = useState(service?.billable ?? true);
  // "none" sentinel: Radix selects cannot re-post an empty value, so the
  // real (possibly empty) tier id travels in a hidden field below.
  const [linkedTierId, setLinkedTierId] = useState(service?.linked_plan_tier_id ?? "none");
  const [taxable, setTaxable] = useState<boolean>(service?.taxable ?? false);
  // Variant tier pricing matches the tier NAME (engine compares names, not
  // ids) — offer the live tier names instead of free text.
  const tierNameOptions = Array.from(
    new Set(tierOptions.map((tier) => tier.tierName).filter((name): name is string => Boolean(name)))
  ).map((name) => ({ value: name, label: name }));

  const [variantRows, setVariantRows] = useState<VariantRowState[]>(() =>
    initialVariants.map((variant) => ({
      uid: nextUid(),
      id: variant.id,
      label: variant.label ?? "",
      aircraft_category: variant.aircraft_category ?? "",
      aircraft_band: variant.aircraft_band ?? "",
      plan_tier_match: variant.plan_tier_match ?? "",
      unit_price: numStr(variant.unit_price),
      annual_price: numStr(variant.annual_price),
      effective_from: variant.effective_from ?? null,
    })),
  );
  const [variableRows, setVariableRows] = useState<VariableRowState[]>(() =>
    initialVariables.map((variable) => ({
      uid: nextUid(),
      id: variable.id,
      key: variable.key,
      label: variable.label,
      input_type: variable.input_type,
      role: variable.role,
      required: variable.required,
      default_value: variable.default_value ?? "",
      min_value: numStr(variable.min_value),
      max_value: numStr(variable.max_value),
      options: optionsToText(variable.options),
    })),
  );
  const [attachmentRows, setAttachmentRows] = useState<AttachmentRowState[]>(() =>
    initialAttachments.map((attachment) => ({
      uid: nextUid(),
      id: attachment.id,
      child_service_id: attachment.child_service_id,
      attachment_mode: attachment.attachment_mode,
      quantity: numStr(attachment.quantity) || "1",
      price_override: numStr(attachment.price_override),
    })),
  );

  const attachmentChoices = useMemo(
    () =>
      attachableServices
        .filter((candidate) => candidate.id !== service?.id)
        .map((candidate) => ({
          value: candidate.id,
          label: `${candidate.code} — ${candidate.name}${candidate.priceSummary ? ` (${candidate.priceSummary})` : ""}`,
        })),
    [attachableServices, service?.id],
  );

  // JSON hidden-field payloads (the actions contract). Recomputed per render
  // so the hidden inputs always carry the current row state.
  const variantsJson = useMemo(
    () =>
      JSON.stringify(
        variantRows.map((row, index) => ({
          id: row.id,
          label: row.label.trim() || null,
          aircraft_category: row.aircraft_category.trim() || null,
          aircraft_band: row.aircraft_band || null,
          plan_tier_match: row.plan_tier_match.trim() || null,
          unit_price: toNumOrNull(row.unit_price),
          annual_price: toNumOrNull(row.annual_price),
          sort_order: index,
        })),
      ),
    [variantRows],
  );
  const variablesJson = useMemo(
    () =>
      JSON.stringify(
        variableRows.map((row, index) => ({
          id: row.id,
          key: row.key.trim(),
          label: row.label.trim(),
          input_type: row.input_type,
          role: row.role,
          required: row.required,
          default_value: row.default_value.trim() || null,
          min_value: toNumOrNull(row.min_value),
          max_value: toNumOrNull(row.max_value),
          options:
            row.input_type === "select"
              ? row.options.split(",").map((option) => option.trim()).filter(Boolean)
              : null,
          sort_order: index,
        })),
      ),
    [variableRows],
  );
  const attachmentsJson = useMemo(
    () =>
      JSON.stringify(
        attachmentRows.map((row, index) => ({
          id: row.id,
          child_service_id: row.child_service_id,
          attachment_mode: row.attachment_mode,
          quantity: toNumOrNull(row.quantity) ?? 1,
          price_override: toNumOrNull(row.price_override),
          sort_order: index,
        })),
      ),
    [attachmentRows],
  );

  const updateVariant = (uid: number, patch: Partial<VariantRowState>) =>
    setVariantRows((rows) => rows.map((row) => (row.uid === uid ? { ...row, ...patch } : row)));
  const updateVariable = (uid: number, patch: Partial<VariableRowState>) =>
    setVariableRows((rows) => rows.map((row) => (row.uid === uid ? { ...row, ...patch } : row)));
  const updateAttachment = (uid: number, patch: Partial<AttachmentRowState>) =>
    setAttachmentRows((rows) => rows.map((row) => (row.uid === uid ? { ...row, ...patch } : row)));

  const priceHint =
    costType === "pass_through"
      ? "Pass-through: every price below is the vendor's at-cost amount — AMG adds zero markup."
      : "Coordination and plan fees are the only places AMG margin lives; it is embedded in the flat price below.";

  return (
    <>
      <form action={action} className="space-y-6">
        {isEdit && service ? <input type="hidden" name="service_id" value={service.id} /> : null}
        {/* On edit the radios are disabled (disabled inputs never post), so a
            hidden field re-submits the current value for the server's
            cost-type-locked verification. */}
        {isEdit && service ? <input type="hidden" name="cost_type" value={service.cost_type} /> : null}
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input type="hidden" name="variants_json" value={variantsJson} />
        <input type="hidden" name="variables_json" value={variablesJson} />
        <input type="hidden" name="attachments_json" value={attachmentsJson} />
        <input type="hidden" name="client_visible" value={clientVisible ? "true" : "false"} />
        <input type="hidden" name="taxable" value={taxable ? "true" : "false"} />
        <input type="hidden" name="billable" value={billable ? "true" : "false"} />
        <input type="hidden" name="linked_plan_tier_id" value={linkedTierId === "none" ? "" : linkedTierId} />

        {/* 1 — Financial classification (permanent — so it comes first) */}
        <SectionCard
          title="Financial Classification"
          icon="wallet"
          description="Step 1 — this one is permanent. AMG margin lives only in coordination fees and plan retainers; pass-throughs re-bill at vendor cost. A code, a name, and this choice are all you need to save a draft."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {COST_TYPE_CHOICES.map((choice) => {
              const selected = costType === choice.value;
              return (
                <label
                  key={choice.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors ${
                    selected
                      ? "border-[var(--deck-accent)] bg-[var(--deck-accent-tint)]"
                      : "border-[var(--deck-line-strong)] bg-[var(--deck-panel)] hover:border-[var(--deck-accent-line)]"
                  } ${isEdit ? "cursor-not-allowed opacity-80" : ""}`}
                >
                  <input
                    type="radio"
                    name={isEdit ? undefined : "cost_type"}
                    value={choice.value}
                    checked={selected}
                    disabled={isEdit}
                    required={!isEdit}
                    onChange={() => setCostType(choice.value)}
                    className="mt-1 h-4 w-4 accent-[var(--deck-accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--deck-text)]">{choice.label}</span>
                    <span className="mt-1 block text-[0.7rem] leading-5 text-[var(--deck-text-3)]">{choice.blurb}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--deck-text-3)]">
            {isEdit
              ? "Cost type is permanent — changing it would silently change what every historical price on this service means. Duplicate the service to reclassify."
              : "Choose carefully: cost type is permanent once the service is created."}
          </p>
        </SectionCard>

        {/* 2 — Identity */}
        <SectionCard title="Identity" icon="fileText" description="How this service is named in the catalog, on quotes, and to clients.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Code"
              name="code"
              required
              defaultValue={service?.code ?? ""}
              placeholder="COORD-INTL"
              hint="Unique short code used on quote and invoice lines."
              className="deck-mono uppercase"
            />
            <TextField label="Name" name="name" required defaultValue={service?.name ?? ""} placeholder="International Trip Coordination" />
            <TextField
              label="Category"
              name="category"
              defaultValue={service?.category ?? ""}
              placeholder="Trip Coordination"
              hint="Free-text group used for catalog filtering and quote sections."
            />
            <SelectField label="Status" name="status" defaultValue={service?.status ?? "draft"} options={STATUS_OPTIONS} hint="Only active services are offerable. Archiving never deletes history." />
            <TextField label="Sort Order" name="sort_order" type="number" step="1" defaultValue={numStr(service?.sort_order ?? 0)} hint="Lower numbers list first in the catalog and on quotes." />
            <div className="md:col-span-2">
              <TextAreaField label="Internal Description" name="description" rows={2} defaultValue={service?.description ?? ""} hint="Ops-facing. Never shown to clients." />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Client Description" name="client_description" rows={2} defaultValue={service?.client_description ?? ""} hint="Shown on client-facing quotes and invoices." />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Internal Notes" name="notes_internal" rows={2} defaultValue={service?.notes_internal ?? ""} />
            </div>
          </div>
        </SectionCard>

        {/* 3 — Pricing */}
        <SectionCard title="Pricing" icon="receipt" description={priceHint}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SelectField
              label="Pricing Model"
              name="pricing_model"
              value={pricingModel}
              onChange={(event) => setPricingModel(event.target.value)}
              options={PRICING_MODEL_OPTIONS}
            />
            {pricingModel === "flat" ? (
              // Flat fee has no unit — post the stored value unchanged.
              <input type="hidden" name="unit" value={service?.unit ?? ""} />
            ) : (
              <TextField label="Unit" name="unit" defaultValue={service?.unit ?? ""} placeholder="trip, hour, day, each" hint="What one quantity means on the quote." />
            )}
            <TextField
              label={pricingModel === "flat" ? "Price ($)" : "Default Unit Price ($)"}
              name="default_unit_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={numStr(service?.default_unit_price)}
              hint={
                pricingModel === "passthrough_estimate"
                  ? "Optional estimate — the real amount is the vendor cost."
                  : pricingModel === "flat"
                    ? "The price clients are quoted."
                    : "Used when no variant matches."
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Min Qty" name="min_quantity" type="number" min="0" step="0.01" defaultValue={numStr(service?.min_quantity)} hint="Optional." />
              <TextField label="Max Qty" name="max_quantity" type="number" min="0" step="0.01" defaultValue={numStr(service?.max_quantity)} hint="Optional." />
            </div>
          </div>

          {/* Hidden for simple pricing models — but never hide EXISTING rows. */}
          <div className={pricingModel === "variant_matrix" || variantRows.length > 0 ? "mt-5 border-t border-[var(--deck-line)] pt-4" : "hidden"}>
            <div>
              <p className="text-sm font-semibold text-[var(--deck-text)]">Tier / Aircraft Prices</p>
              <p className="mt-1 max-w-2xl text-[0.7rem] leading-5 text-[var(--deck-text-3)]">
                Changing a price keeps the old one as history (closed today) and starts the new price today.
              </p>
            </div>
            <div className="mt-3 space-y-3">
              {variantRows.length === 0 ? (
                <p className="rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-4 py-4 text-center text-xs text-[var(--deck-text-3)]">
                  No variants — the default unit price applies to everyone.
                </p>
              ) : null}
              {variantRows.map((row) => (
                <div key={row.uid} className="deck-inset grid gap-3 p-3 md:grid-cols-3 lg:grid-cols-6">
                  <TextField
                    label="Label"
                    value={row.label}
                    onChange={(event) => updateVariant(row.uid, { label: event.target.value })}
                    placeholder="Tier 1 / Band A"
                  />
                  <TextField
                    label="Aircraft Category"
                    value={row.aircraft_category}
                    onChange={(event) => updateVariant(row.uid, { aircraft_category: event.target.value })}
                    placeholder="Light Jet"
                  />
                  <SelectField
                    label="Aircraft Band"
                    value={row.aircraft_band || "any"}
                    onChange={(event) =>
                      updateVariant(row.uid, { aircraft_band: event.target.value === "any" ? "" : event.target.value })
                    }
                    options={BAND_OPTIONS}
                  />
                  <SelectField
                    label="Member Tier"
                    value={row.plan_tier_match || "any"}
                    onChange={(event) =>
                      updateVariant(row.uid, { plan_tier_match: event.target.value === "any" ? "" : event.target.value })
                    }
                    options={[
                      { value: "any", label: "Everyone (non-member rate)" },
                      ...tierNameOptions,
                    ]}
                    hint="Members of this tier get this price."
                  />
                  <TextField
                    label="Unit Price ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={row.unit_price}
                    onChange={(event) => updateVariant(row.uid, { unit_price: event.target.value })}
                    hint="What this tier / aircraft pays."
                  />
                  <TextField
                    label="Annual Price ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.annual_price}
                    onChange={(event) => updateVariant(row.uid, { annual_price: event.target.value })}
                    hint="Optional — yearly amount if billed annually."
                  />
                  <div className="flex items-center justify-between gap-2 md:col-span-3 lg:col-span-6">
                    <span className="text-[0.68rem] text-[var(--deck-text-3)]">
                      {row.effective_from
                        ? `Current price effective since ${row.effective_from}. Removing this row closes it (history kept).`
                        : "New price row — effective today once saved."}
                    </span>
                    <RemoveRowButton
                      label={row.id ? "Close variant" : "Remove"}
                      onClick={() => setVariantRows((rows) => rows.filter((r) => r.uid !== row.uid))}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                setVariantRows((rows) => [
                  ...rows,
                  {
                    uid: nextUid(),
                    id: null,
                    label: "",
                    aircraft_category: "",
                    aircraft_band: "",
                    plan_tier_match: "",
                    unit_price: "",
                    annual_price: "",
                    effective_from: null,
                  },
                ])
              }
            >
              Add Price Variant
            </Button>
          </div>
        </SectionCard>

        {/* 4 — Frequency & billing */}
        <SectionCard title="Frequency & Billing" icon="calendar" description="How often the service bills and how it lands on invoices.">
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField
              label="Frequency"
              name="frequency"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              options={FREQUENCY_OPTIONS}
            />
            {/* Disabled (not hidden) when not recurring so the row never
                reflows; disabled inputs do not post. */}
            <SelectField
              label="Recurring Interval"
              name="recurring_interval"
              disabled={frequency !== "recurring"}
              defaultValue={service?.recurring_interval ?? "month"}
              options={INTERVAL_OPTIONS}
              hint={frequency === "recurring" ? undefined : "Recurring services only."}
            />
            <TextField
              label="Interval Count"
              name="recurring_interval_count"
              type="number"
              min="1"
              step="1"
              disabled={frequency !== "recurring"}
              defaultValue={numStr(service?.recurring_interval_count ?? 1)}
              hint={frequency === "recurring" ? "1 = every month/year, 3 = quarterly, etc." : "Recurring services only."}
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextField
              label="Deposit Required %"
              name="requires_deposit_percent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={numStr(service?.requires_deposit_percent)}
              hint="Optional — leave blank for no deposit."
            />
            <SelectField
              label="Linked Plan Tier"
              value={linkedTierId}
              onChange={(event) => setLinkedTierId(event.target.value)}
              options={[{ value: "none", label: "Not linked to a plan tier" }, ...tierOptions]}
              hint="Plan-fee services can point at the subscription tier they represent."
            />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <BoolToggle
              label="Taxable"
              hint="Adds this line to the taxable subtotal on quotes."
              checked={taxable}
              onChange={setTaxable}
            />
            <BoolToggle
              label="Billable"
              hint="Unbillable services appear on quotes as $0 informational lines."
              checked={billable}
              onChange={setBillable}
            />
            <BoolToggle
              label="Client visible"
              hint="Hidden services stay internal-only on client documents."
              checked={clientVisible}
              onChange={setClientVisible}
            />
          </div>
        </SectionCard>

        {/* 5 — Variables */}
        <SectionCard
          title="Calculator Variables"
          icon="settings"
          description="Inputs the quote calculator asks for (fuel stops, days, pax count). Quantity/multiplier variables scale the price; info variables are recorded only."
        >
          <div className="space-y-3">
            {variableRows.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-4 py-4 text-center text-xs text-[var(--deck-text-3)]">
                No variables — the calculator prices this service without extra inputs.
              </p>
            ) : null}
            {variableRows.map((row) => (
              <div key={row.uid} className="deck-inset grid gap-3 p-3 md:grid-cols-3 lg:grid-cols-4">
                <TextField
                  label="Label"
                  required
                  value={row.label}
                  onChange={(event) => {
                    const label = event.target.value;
                    const derived = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
                    // Keep the machine key in lockstep until someone edits it by hand.
                    const keyUntouched =
                      !row.key || row.key === (row.label || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
                    updateVariable(row.uid, keyUntouched ? { label, key: derived } : { label });
                  }}
                  placeholder="Fuel stops"
                  hint="What the calculator asks for."
                />
                <TextField
                  label="Key"
                  required
                  value={row.key}
                  onChange={(event) => updateVariable(row.uid, { key: event.target.value })}
                  placeholder="fuel_stops"
                  hint="Auto-filled from the label."
                  className="deck-mono"
                />
                <SelectField
                  label="Input Type"
                  value={row.input_type}
                  onChange={(event) => updateVariable(row.uid, { input_type: event.target.value })}
                  options={VARIABLE_INPUT_OPTIONS}
                />
                <SelectField
                  label="Role"
                  value={row.role}
                  onChange={(event) => updateVariable(row.uid, { role: event.target.value })}
                  options={VARIABLE_ROLE_OPTIONS}
                />
                <TextField
                  label="Default Value"
                  value={row.default_value}
                  onChange={(event) => updateVariable(row.uid, { default_value: event.target.value })}
                />
                {row.input_type === "number" ? (
                  <>
                    <TextField
                      label="Min"
                      type="number"
                      step="0.01"
                      value={row.min_value}
                      onChange={(event) => updateVariable(row.uid, { min_value: event.target.value })}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      step="0.01"
                      value={row.max_value}
                      onChange={(event) => updateVariable(row.uid, { max_value: event.target.value })}
                    />
                  </>
                ) : null}
                {row.input_type === "select" ? (
                  <TextField
                    label="Options"
                    required
                    value={row.options}
                    onChange={(event) => updateVariable(row.uid, { options: event.target.value })}
                    placeholder="1, 2, 3"
                    hint="Comma-separated choices."
                  />
                ) : null}
                <div className="flex items-center justify-between gap-2 md:col-span-3 lg:col-span-4">
                  <BoolToggle
                    label="Required at quote time"
                    checked={row.required}
                    onChange={(next) => updateVariable(row.uid, { required: next })}
                  />
                  <RemoveRowButton
                    label="Remove"
                    onClick={() => setVariableRows((rows) => rows.filter((r) => r.uid !== row.uid))}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              setVariableRows((rows) => [
                ...rows,
                {
                  uid: nextUid(),
                  id: null,
                  key: "",
                  label: "",
                  input_type: "number",
                  role: "quantity",
                  required: true,
                  default_value: "",
                  min_value: "",
                  max_value: "",
                  options: "",
                },
              ])
            }
          >
            Add Variable
          </Button>
        </SectionCard>

        {/* 6 — Attached services */}
        <SectionCard
          title="Attached Services"
          icon="layers"
          description="Other active services pulled onto the quote alongside this one. Price overrides follow the parent's cost-type rules."
        >
          <div className="space-y-3">
            {attachmentRows.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-4 py-4 text-center text-xs text-[var(--deck-text-3)]">
                No attached services.
              </p>
            ) : null}
            {attachmentRows.map((row) => (
              <div key={row.uid} className="deck-inset grid gap-3 p-3 md:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <SelectField
                    label="Service"
                    required
                    value={row.child_service_id}
                    onChange={(event) => updateAttachment(row.uid, { child_service_id: event.target.value })}
                    options={[{ value: "", label: "Choose an active service…" }, ...attachmentChoices]}
                    placeholder="Choose an active service…"
                  />
                </div>
                <SelectField
                  label="Mode"
                  value={row.attachment_mode}
                  onChange={(event) => updateAttachment(row.uid, { attachment_mode: event.target.value })}
                  options={ATTACHMENT_MODE_OPTIONS}
                />
                <TextField
                  label="Quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={row.quantity}
                  onChange={(event) => updateAttachment(row.uid, { quantity: event.target.value })}
                />
                <TextField
                  label="Price Override"
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.price_override}
                  onChange={(event) => updateAttachment(row.uid, { price_override: event.target.value })}
                  hint="Blank = child's own price."
                />
                <div className="flex justify-end md:col-span-2 lg:col-span-5">
                  <RemoveRowButton
                    label="Remove"
                    onClick={() => setAttachmentRows((rows) => rows.filter((r) => r.uid !== row.uid))}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() =>
              setAttachmentRows((rows) => [
                ...rows,
                {
                  uid: nextUid(),
                  id: null,
                  child_service_id: "",
                  attachment_mode: "suggested",
                  quantity: "1",
                  price_override: "",
                },
              ])
            }
          >
            Attach a Service
          </Button>
        </SectionCard>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingText={isEdit ? "Saving..." : "Creating..."}>
            {isEdit ? "Save Changes" : "Create Service"}
          </SubmitButton>
          <Button type="button" variant="outline" asChild>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        </div>
      </form>

      {/* 7 — Stripe (read-only; retry is its own form, outside the main one) */}
      {isEdit && service ? (
        <SectionCard
          title="Stripe"
          icon="creditCard"
          description="Read-only sync state. Product/price sync itself lands in the Stripe phase — retry re-queues this service."
        >
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-3)]">Sync Status</dt>
              <dd className="mt-1">
                <StatusBadge
                  label={service.stripe_sync_status.replace(/_/g, " ")}
                  tone={STRIPE_SYNC_TONE[service.stripe_sync_status] ?? "neutral"}
                />
              </dd>
            </div>
            <div>
              <dt className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-3)]">Sync Error</dt>
              <dd className="mt-1 break-words text-[var(--deck-text)]">{service.stripe_sync_error ?? "—"}</dd>
            </div>
            <div>
              <dt className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-3)]">Product ID (Test)</dt>
              <dd className="deck-mono mt-1 break-all">{service.stripe_product_id_test ?? "not created"}</dd>
            </div>
            <div>
              <dt className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-3)]">Product ID (Live)</dt>
              <dd className="deck-mono mt-1 break-all">{service.stripe_product_id_live ?? "not created"}</dd>
            </div>
          </dl>
          {retryAction ? (
            <form action={retryAction} className="mt-4">
              <input type="hidden" name="service_id" value={service.id} />
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <SubmitButton
                variant="outline"
                size="sm"
                pendingText="Queueing..."
                disabled={service.stripe_sync_status === "not_applicable"}
              >
                Retry Stripe Sync
              </SubmitButton>
            </form>
          ) : null}
          {service.stripe_sync_status === "not_applicable" ? (
            <p className="mt-2 text-[0.7rem] leading-5 text-[var(--deck-text-3)]">
              Not applicable: this service is priced at quote time (pass-through estimate or multiplier variables), so Stripe cannot hold a fixed price for it.
            </p>
          ) : null}
        </SectionCard>
      ) : null}
    </>
  );
}
