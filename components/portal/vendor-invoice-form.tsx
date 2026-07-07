"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckSelect, Field, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SectionCard } from "@/components/portal/ui/primitives";

/**
 * Contractor invoice form (crew & partner). The bill-from block is fully
 * editable per invoice so contractors can bill as themselves or as their
 * company entity; line items are dynamic; receipts attach as files. Posts to
 * submitVendorInvoice / updateVendorInvoice — field names are the action's
 * contract.
 */

export type VendorInvoiceFormDefaults = {
  bill_from_name?: string;
  bill_from_company?: string;
  bill_from_email?: string;
  bill_from_phone?: string;
  bill_from_address?: string;
  bill_from_tax_id?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  mission_id?: string;
  notes?: string;
  payment_instructions?: string;
  lines?: { description: string; quantity: number; unit_amount: number }[];
};

type LineDraft = { key: number; description: string; quantity: string; unit_amount: string };

const money = (value: string) => {
  const n = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function VendorInvoiceForm({
  action,
  backTo,
  invoiceId,
  missionOptions,
  defaults = {},
  submitLabel = "Submit invoice to AMG",
}: {
  action: (formData: FormData) => void | Promise<void>;
  backTo: string;
  invoiceId?: string;
  missionOptions: { id: string; ref: string }[];
  defaults?: VendorInvoiceFormDefaults;
  submitLabel?: string;
}) {
  const [lines, setLines] = useState<LineDraft[]>(() =>
    (defaults.lines?.length
      ? defaults.lines.map((line, index) => ({
          key: index,
          description: line.description,
          quantity: String(line.quantity),
          unit_amount: line.unit_amount ? String(line.unit_amount) : "",
        }))
      : [{ key: 0, description: "", quantity: "1", unit_amount: "" }])
  );
  const nextKey = useMemo(() => Math.max(...lines.map((l) => l.key)) + 1, [lines]);

  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const quantity = Number(line.quantity) || 0;
        return sum + quantity * money(line.unit_amount);
      }, 0),
    [lines]
  );

  function patchLine(key: number, patch: Partial<LineDraft>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="back_to" value={backTo} />
      {invoiceId ? <input type="hidden" name="invoice_id" value={invoiceId} /> : null}

      <SectionCard
        title="Bill From"
        icon="building"
        description="How this invoice should read — bill as yourself or as your company entity. Saved per invoice."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Name" name="bill_from_name" required defaultValue={defaults.bill_from_name ?? ""} placeholder="Your name as it should appear" />
          <TextField label="Company / Entity" name="bill_from_company" defaultValue={defaults.bill_from_company ?? ""} placeholder="e.g. Skyline Aviation Services LLC" />
          <TextField label="Billing Email" name="bill_from_email" type="email" defaultValue={defaults.bill_from_email ?? ""} placeholder="billing@yourcompany.com" />
          <TextField label="Phone" name="bill_from_phone" type="tel" defaultValue={defaults.bill_from_phone ?? ""} />
          <TextAreaField label="Remit-To Address" name="bill_from_address" className="md:col-span-2" defaultValue={defaults.bill_from_address ?? ""} placeholder="Street, city, state, ZIP" />
          <TextField label="Tax ID / EIN (optional)" name="bill_from_tax_id" defaultValue={defaults.bill_from_tax_id ?? ""} />
        </div>
      </SectionCard>

      <SectionCard title="Invoice" icon="receipt">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="Your Invoice #" name="invoice_number" defaultValue={defaults.invoice_number ?? ""} placeholder="Your own numbering (optional)" />
          <TextField label="Invoice Date" name="invoice_date" type="date" defaultValue={defaults.invoice_date ?? new Date().toISOString().slice(0, 10)} />
          <TextField label="Due Date" name="due_date" type="date" defaultValue={defaults.due_date ?? ""} />
          <Field label="Related Mission" className="md:col-span-3">
            <DeckSelect
              name="mission_id"
              defaultValue={defaults.mission_id ?? ""}
              aria-label="Related mission"
              options={[
                { value: "", label: "Not linked to a mission" },
                ...missionOptions.map((mission) => ({ value: mission.id, label: mission.ref })),
              ]}
            />
          </Field>
        </div>

        <div className="mt-5">
          <p className="deck-eyebrow mb-2">Line Items</p>
          <div className="grid gap-3">
            {lines.map((line) => (
              <div
                key={line.key}
                className="grid gap-2 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] p-3 sm:grid-cols-[1fr_6rem_8rem_7rem_2.5rem] sm:items-end"
              >
                <label className="grid gap-1.5 text-[0.6rem] font-bold uppercase [letter-spacing:0.14em] text-[var(--deck-text-3)]">
                  Description
                  <input
                    name="line_description"
                    value={line.description}
                    onChange={(event) => patchLine(line.key, { description: event.target.value })}
                    placeholder="e.g. Contract PIC — KFXE to KTEB"
                    className="deck-input font-normal normal-case"
                  />
                </label>
                <label className="grid gap-1.5 text-[0.6rem] font-bold uppercase [letter-spacing:0.14em] text-[var(--deck-text-3)]">
                  Qty
                  <input
                    name="line_quantity"
                    inputMode="decimal"
                    value={line.quantity}
                    onChange={(event) => patchLine(line.key, { quantity: event.target.value })}
                    className="deck-input font-normal normal-case"
                  />
                </label>
                <label className="grid gap-1.5 text-[0.6rem] font-bold uppercase [letter-spacing:0.14em] text-[var(--deck-text-3)]">
                  Rate / Amount
                  <input
                    name="line_unit_amount"
                    inputMode="decimal"
                    value={line.unit_amount}
                    onChange={(event) => patchLine(line.key, { unit_amount: event.target.value })}
                    placeholder="0.00"
                    className="deck-input font-normal normal-case"
                  />
                </label>
                <div className="text-sm font-semibold text-[var(--deck-text)] sm:pb-2">
                  ${((Number(line.quantity) || 0) * money(line.unit_amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <button
                  type="button"
                  onClick={() => setLines((current) => (current.length > 1 ? current.filter((l) => l.key !== line.key) : current))}
                  aria-label="Remove line"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--deck-line)] text-[var(--deck-text-3)] transition-colors hover:border-[var(--deck-danger-line)] hover:text-[var(--deck-danger)] sm:mb-1"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                setLines((current) => [...current, { key: nextKey, description: "", quantity: "1", unit_amount: "" }])
              }
            >
              <Plus className="h-4 w-4" />
              Add line
            </Button>
            <p className="text-sm text-[var(--deck-text-2)]">
              Total{" "}
              <span className="deck-num text-base font-bold text-[var(--deck-text)]">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Receipts"
        icon="fileText"
        description="Attach receipt files that support this invoice (PDF, JPG, PNG, WEBP, HEIC — up to 25 MB each). They also appear in your Receipts tab."
      >
        <input
          type="file"
          name="receipts"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
          className="block w-full cursor-pointer rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] p-4 text-sm text-[var(--deck-text-2)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--deck-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
      </SectionCard>

      <SectionCard title="Notes & Payment" icon="messageSquare">
        <div className="grid gap-4">
          <TextAreaField label="Notes to AMG" name="notes" defaultValue={defaults.notes ?? ""} placeholder="Anything AMG should know about this invoice" />
          <TextAreaField
            label="Payment Instructions"
            name="payment_instructions"
            defaultValue={defaults.payment_instructions ?? ""}
            placeholder="How you'd like to be paid — e.g. ACH to account on file, Zelle, check to the remit-to address"
          />
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <SubmitButton pendingText="Submitting...">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
