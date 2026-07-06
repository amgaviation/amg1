"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/portal/ui/submit-button";

/**
 * Row-selection layer for the server-rendered DataTable.
 *
 * DataTable must stay a server component (its columns carry render functions,
 * which cannot cross a client boundary), so selection state lives in this
 * client context and DataTable only mounts the small client leaves below
 * (select-all box, per-row box). Server pages opt in by wrapping the table:
 *
 *   <TableSelectionScope action={bulkDeleteX} entity="quote" backTo="/portal/admin/quotes"
 *     entityLabel="quote" confirm="Delete the selected draft quotes?">
 *     <DataTable selectable ... />
 *   </TableSelectionScope>
 *
 * Only row keys (strings) cross the boundary — rows and cells stay server-side.
 */

type SelectionContextValue = {
  selected: ReadonlySet<string>;
  toggle: (key: string) => void;
  setMany: (keys: string[], on: boolean) => void;
  clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function useTableSelection() {
  return useContext(SelectionContext);
}

export function TableSelectionScope({
  action,
  entity,
  backTo,
  entityLabel = "record",
  confirm,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  entity: string;
  backTo: string;
  entityLabel?: string;
  confirm: string;
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const setMany = useCallback((keys: string[], on: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      keys.forEach((key) => (on ? next.add(key) : next.delete(key)));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const value = useMemo(
    () => ({ selected, toggle, setMany, clear }),
    [selected, toggle, setMany, clear]
  );

  const count = selected.size;
  const plural = count === 1 ? entityLabel : `${entityLabel}s`;

  return (
    <SelectionContext.Provider value={value}>
      {count > 0 ? (
        <div className="deck-card flex flex-wrap items-center justify-between gap-3 border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] px-4 py-3">
          <span className="text-sm font-semibold text-[var(--deck-text)]">{count} selected</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Clear
            </Button>
            <form action={action}>
              <input type="hidden" name="entity" value={entity} />
              <input type="hidden" name="back_to" value={backTo} />
              {Array.from(selected).map((id) => (
                <input key={id} type="hidden" name="ids" value={id} />
              ))}
              <SubmitButton
                variant="default"
                size="sm"
                className="bg-[var(--deck-danger)] text-white hover:opacity-90"
                confirm={confirm}
                pendingText="Deleting..."
              >
                Delete {count} {plural}
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : null}
      {children}
    </SelectionContext.Provider>
  );
}

/** Header select-all checkbox for the keys currently rendered on the page. */
export function SelectAllCheckbox({ keys }: { keys: string[] }) {
  const selection = useTableSelection();
  if (!selection) return null;
  const allSelected = keys.length > 0 && keys.every((key) => selection.selected.has(key));
  return (
    <input
      type="checkbox"
      className="h-4 w-4 cursor-pointer accent-[var(--deck-accent)]"
      checked={allSelected}
      onChange={() => selection.setMany(keys, !allSelected)}
      aria-label="Select all rows on this page"
    />
  );
}

/** Per-row checkbox. Wrapped in a padded label so the touch target is ≥44px. */
export function RowSelectCheckbox({ rowKey, label }: { rowKey: string; label?: string }) {
  const selection = useTableSelection();
  if (!selection) return null;
  return (
    <label
      className="-m-2.5 flex cursor-pointer items-center justify-center p-2.5"
      onClick={(event) => event.stopPropagation()}
    >
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer accent-[var(--deck-accent)]"
        checked={selection.selected.has(rowKey)}
        onChange={() => selection.toggle(rowKey)}
        aria-label={label ?? "Select row"}
      />
    </label>
  );
}
