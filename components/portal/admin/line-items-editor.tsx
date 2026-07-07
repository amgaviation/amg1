"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";

/**
 * Dynamic quote/invoice line items: one row to start, "+ Add line item" for
 * more, per-row remove. Posts the exact array field names the existing
 * server actions parse (category[], description[], quantity[], unit_price[],
 * unit[], cost_type[], client_notes[], internal_notes[]) — rows the user
 * leaves without a category are skipped by the parser, same as before.
 */

export type LineItemDefault = {
  category?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  unit?: string | null;
  cost_type?: string | null;
  client_notes?: string | null;
  internal_notes?: string | null;
};

type RowState = LineItemDefault & { key: number };

export function LineItemsEditor({
  categories,
  costTypes,
  showCostType = false,
  showNotes = false,
  defaultCategory = "",
  requireFirst = false,
  initialItems,
}: {
  categories: string[];
  costTypes?: string[];
  showCostType?: boolean;
  showNotes?: boolean;
  /** Category pre-selected on the starting row. */
  defaultCategory?: string;
  /** Mark the first row's category required (invoice creator behavior). */
  requireFirst?: boolean;
  /** Existing lines (edit pages) — one empty row is used when absent. */
  initialItems?: LineItemDefault[];
}) {
  const [rows, setRows] = useState<RowState[]>(() =>
    initialItems?.length
      ? initialItems.map((item, index) => ({ ...item, key: index }))
      : [{ key: 0, category: defaultCategory, quantity: 1 }]
  );

  function addRow() {
    setRows((current) => [
      ...current,
      { key: Math.max(...current.map((row) => row.key)) + 1, category: "", quantity: 1 },
    ]);
  }

  function removeRow(key: number) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.key !== key) : current));
  }

  const gridCols = showCostType
    ? "md:grid-cols-[1.2fr_1.5fr_.7fr_.7fr_.8fr]"
    : "md:grid-cols-[1.2fr_1.6fr_.7fr_.7fr_.7fr]";

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.key} className="relative rounded-md border border-[var(--deck-line)] p-3">
          {rows.length > 1 ? (
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              aria-label={`Remove line item ${index + 1}`}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] text-[var(--deck-text-3)] transition-colors hover:border-[var(--deck-danger-line)] hover:text-[var(--deck-danger)]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
          <div className={`grid gap-3 ${gridCols}`}>
            <SelectField
              label="Category"
              name="category[]"
              required={requireFirst && index === 0}
              defaultValue={row.category ?? ""}
              options={[
                { value: "", label: "No line" },
                ...categories.map((item) => ({ value: item, label: item })),
              ]}
            />
            <TextField
              label="Description"
              name="description[]"
              defaultValue={row.description ?? ""}
              placeholder="Pilot day rate, airline positioning, FBO handling..."
            />
            <TextField
              label="Qty"
              name="quantity[]"
              type="number"
              min="0"
              step="0.01"
              defaultValue={row.quantity != null ? String(row.quantity) : ""}
            />
            <TextField
              label="Unit Price"
              name="unit_price[]"
              type="number"
              min="0"
              step="0.01"
              defaultValue={row.unit_price != null && row.unit_price !== 0 ? String(row.unit_price) : ""}
            />
            {showCostType ? (
              <SelectField
                label="Cost Type"
                name="cost_type[]"
                defaultValue={row.cost_type ?? "Fixed Fee"}
                options={(costTypes ?? []).map((item) => ({ value: item, label: item }))}
              />
            ) : null}
            <TextField label="Unit" name="unit[]" defaultValue={row.unit ?? ""} placeholder="day, trip, each" />
            {showNotes ? (
              <>
                <TextAreaField label="Client Note" name="client_notes[]" defaultValue={row.client_notes ?? ""} />
                <TextAreaField label="Internal Note" name="internal_notes[]" defaultValue={row.internal_notes ?? ""} />
              </>
            ) : null}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
        <Plus className="h-4 w-4" />
        Add line item
      </Button>
    </div>
  );
}
