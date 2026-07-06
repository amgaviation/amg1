"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Edit3, Eye, Filter, Plus, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckSelect } from "@/components/portal/ui/fields";
import { Combobox } from "@/components/portal/ui/combobox";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import type { Tone } from "@/lib/portal/constants";
import { cn } from "@/lib/utils";

type RecordValue = string | number | boolean | null | undefined;

export type AdminRecordField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
  fullWidth?: boolean;
};

export type AdminRecordColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
};

export type AdminRecordFilter = {
  key: string;
  label: string;
  type?: "select" | "text";
  options?: { value: string; label: string }[];
};

export type AdminRecordRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  status?: { label: string; tone?: Tone };
  secondaryStatus?: { label: string; tone?: Tone };
  cells: Record<string, RecordValue>;
  searchText: string;
  filters: Record<string, string | null | undefined>;
  formValues: Record<string, RecordValue>;
  details: { label: string; value: RecordValue }[];
  archiveConfirm?: string;
  detailSections?: {
    title: string;
    rows: { label: string; value: RecordValue }[];
  }[];
  tabs?: {
    title: string;
    rows?: { label: string; value: RecordValue }[];
    empty?: string;
  }[];
};

type AdminRecordManagerProps = {
  title: string;
  description: string;
  rows: AdminRecordRow[];
  columns: AdminRecordColumn[];
  filters: AdminRecordFilter[];
  fields: AdminRecordField[];
  createAction?: (formData: FormData) => void | Promise<void>;
  updateAction?: (formData: FormData) => void | Promise<void>;
  archiveAction?: (formData: FormData) => void | Promise<void>;
  recordActions?: {
    label: string;
    action: (formData: FormData) => void | Promise<void>;
    confirm?: string;
    pendingText?: string;
    variant?: "outline" | "ghost" | "default";
    className?: string;
  }[];
  createLabel: string;
  editLabel: string;
  archiveLabel?: string;
  archiveConfirm?: string;
  archiveDisabledReason?: string;
  recordIdName: string;
  backTo: string;
  emptyTitle: string;
  emptyDescription: string;
  detailEyebrow?: string;
  pageSize?: number;
  detailHrefBase?: string;
  allowCreate?: boolean;
  bulkDelete?: {
    action: (formData: FormData) => void | Promise<void>;
    entity: string;
    entityLabel?: string;
  };
};

function valueText(value: RecordValue) {
  if (value === undefined || value === null || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function inputValue(value: RecordValue) {
  if (value === undefined || value === null) return "";
  return String(value);
}

function labelFor(options: { value: string; label: string }[], value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}

const inputClassName = "deck-input";

function fieldInput(field: AdminRecordField, values: Record<string, RecordValue>) {
  const common = {
    id: field.name,
    name: field.name,
    required: field.required,
    defaultValue: inputValue(values[field.name]),
    placeholder: field.placeholder,
    className: inputClassName,
  };

  if (field.type === "textarea") {
    return <textarea {...common} className={cn(common.className, "min-h-24 py-2")} />;
  }

  if (field.type === "select") {
    // Long option lists (e.g. client pickers) get the searchable combobox;
    // short ones get the styled dropdown. Both post under field.name.
    if ((field.options?.length ?? 0) > 12) {
      return (
        <Combobox
          name={field.name}
          required={field.required}
          defaultValue={inputValue(values[field.name])}
          options={(field.options ?? []).filter((o) => o.value !== "")}
          placeholder={field.options?.find((o) => o.value === "")?.label ?? "Search…"}
        />
      );
    }
    return (
      <DeckSelect
        id={field.name}
        name={field.name}
        required={field.required}
        defaultValue={inputValue(values[field.name])}
        options={field.options ?? []}
      />
    );
  }

  return <input {...common} type={field.type ?? "text"} />;
}

export function AdminRecordManager({
  title,
  description,
  rows,
  columns,
  filters,
  fields,
  createAction,
  updateAction,
  archiveAction,
  recordActions = [],
  createLabel,
  editLabel,
  archiveLabel = "Archive",
  archiveConfirm = "Archive this record?",
  archiveDisabledReason,
  recordIdName,
  backTo,
  emptyTitle,
  emptyDescription,
  detailEyebrow = "Record Detail",
  pageSize = 12,
  detailHrefBase,
  allowCreate = true,
  bulkDelete,
}: AdminRecordManagerProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: columns[0]?.key ?? "title",
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; row?: AdminRecordRow } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (needle && !row.searchText.toLowerCase().includes(needle)) return false;
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        const filter = filters.find((item) => item.key === key);
        const rowValue = String(row.filters[key] ?? "").toLowerCase();
        return filter?.type === "text" ? rowValue.includes(value.toLowerCase()) : rowValue === value;
      });
    });

    return filtered.sort((a, b) => {
      const left = valueText(a.cells[sort.key] ?? a.title).toLowerCase();
      const right = valueText(b.cells[sort.key] ?? b.title).toLowerCase();
      const result = left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? result : -result;
    });
  }, [activeFilters, rows, search, sort]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const firstRow = visibleRows.length ? (safePage - 1) * pageSize + 1 : 0;
  const lastRow = Math.min(safePage * pageSize, visibleRows.length);
  const pagedRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeFilterBadges = Object.entries(activeFilters).filter(([, value]) => Boolean(value));
  const editorValues = editor?.row?.formValues ?? {};

  useEffect(() => {
    setPage(1);
  }, [activeFilters, search, sort]);

  function updateFilter(key: string, value: string) {
    setActiveFilters((current) => {
      const next = { ...current };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  function toggleSort(key: string) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function detailHref(row: AdminRecordRow) {
    return detailHrefBase ? `${detailHrefBase.replace(/\/$/, "")}/${row.id}` : null;
  }

  function openRecord(row: AdminRecordRow) {
    const href = detailHref(row);
    if (href) {
      router.push(href);
      return;
    }
    setSelectedId(row.id);
  }

  const selectionEnabled = Boolean(bulkDelete);
  const bulkEntityLabel = bulkDelete?.entityLabel ?? "record";
  const pageIds = pagedRows.map((row) => row.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someOnPageSelected = pageIds.some((id) => selectedIds.has(id));
  const selectionCount = selectedIds.size;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPageSelected && !allOnPageSelected;
    }
  }, [someOnPageSelected, allOnPageSelected]);

  function toggleRowSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  const bulkConfirmText = `Delete ${selectionCount} selected ${
    selectionCount === 1 ? bulkEntityLabel : `${bulkEntityLabel}s`
  }? Their accounts are soft-deleted and the email / login identifiers that would otherwise block re-registration are released. Linked history is preserved, and this action is recorded in the audit log.`;

  return (
    <section className="deck-card w-full max-w-full overflow-hidden">
      <header className="border-b border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--deck-text)]">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--deck-text-3)]">{description}</p>
          </div>
          <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            {allowCreate && createAction ? (
              <Button type="button" className="gap-2" onClick={() => setEditor({ mode: "create" })}>
                <Plus className="h-4 w-4" />
                {createLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--deck-text-3)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
              className={cn(inputClassName, "pl-9")}
            />
          </label>
          <Button type="button" variant="outline" className="gap-2" onClick={() => setFilterOpen((open) => !open)}>
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        {filterOpen ? (
          <div className="mt-4 grid gap-3 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4 md:grid-cols-2 xl:grid-cols-4">
            {filters.map((filter) => (
              <label key={filter.key} className="grid gap-2">
                <span className="text-[0.64rem] font-bold uppercase [letter-spacing:0.18em] text-[var(--deck-text-3)]">{filter.label}</span>
                {filter.type === "text" ? (
                  <input
                    value={activeFilters[filter.key] ?? ""}
                    onChange={(event) => updateFilter(filter.key, event.target.value)}
                    placeholder="Keyword"
                    className={inputClassName}
                  />
                ) : (
                  <DeckSelect
                    aria-label={filter.label}
                    value={activeFilters[filter.key] || "__all__"}
                    onChange={(event) =>
                      updateFilter(filter.key, event.target.value === "__all__" ? "" : event.target.value)
                    }
                    options={[{ value: "__all__", label: "All" }, ...(filter.options ?? [])]}
                  />
                )}
              </label>
            ))}
            <div className="flex items-end">
              <Button type="button" variant="ghost" onClick={() => setActiveFilters({})}>
                Clear filters
              </Button>
            </div>
          </div>
        ) : null}

        {activeFilterBadges.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilterBadges.map(([key, value]) => {
              const filter = filters.find((item) => item.key === key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateFilter(key, "")}
                  className="deck-chip border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] px-3 py-1 text-[var(--deck-accent-ink)] transition-colors hover:border-[var(--deck-accent)]"
                >
                  {filter?.label ?? key}: {filter?.options ? labelFor(filter.options, value) : value}
                  <X className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-2 border-b border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-5 py-3 text-xs text-[var(--deck-text-3)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {firstRow}-{lastRow} of {visibleRows.length} record{visibleRows.length === 1 ? "" : "s"}
        </p>
        <p>
          {rows.length} total{activeFilterBadges.length || search.trim() ? " after filters" : ""}
        </p>
      </div>

      {selectionEnabled && selectionCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--deck-line)] bg-[var(--deck-accent-tint)] px-5 py-3">
          <span className="text-sm font-semibold text-[var(--deck-text)]">
            {selectionCount} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
            <form action={bulkDelete!.action}>
              <input type="hidden" name="entity" value={bulkDelete!.entity} />
              <input type="hidden" name="back_to" value={backTo} />
              {Array.from(selectedIds).map((id) => (
                <input key={id} type="hidden" name="ids" value={id} />
              ))}
              <SubmitButton
                variant="default"
                size="sm"
                className="bg-[var(--deck-danger)] text-white hover:opacity-90"
                confirm={bulkConfirmText}
                pendingText="Deleting..."
              >
                Delete {selectionCount} {selectionCount === 1 ? bulkEntityLabel : `${bulkEntityLabel}s`}
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : null}

      <div className="min-h-[34rem] w-full max-w-full bg-[var(--deck-panel)]">
        <div className="w-full max-w-full overflow-hidden bg-[var(--deck-panel)]">
          {visibleRows.length ? (
            <>
            <div className="hidden bg-[var(--deck-panel)] md:block">
              <div data-admin-record-table-scroller className="w-full max-w-full overflow-x-auto bg-[var(--deck-panel)]">
              <table className="min-w-[88rem] w-full table-fixed border-collapse bg-[var(--deck-panel)] text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--deck-panel-2)] shadow-[0_1px_0_rgba(15,23,42,0.08)]">
                  <tr className="bg-[var(--deck-panel-2)]">
                    {selectionEnabled ? (
                      <th className="w-12 bg-[var(--deck-panel-2)] px-4 py-3 text-left">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer accent-[var(--deck-accent)]"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAllOnPage}
                          aria-label="Select all rows on this page"
                        />
                      </th>
                    ) : null}
                    {columns.map((column) => (
                      <th key={column.key} className={cn("whitespace-nowrap bg-[var(--deck-panel-2)] px-4 py-3 text-left text-[0.66rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]", column.className)}>
                        {column.sortable ? (
                          <button type="button" className="inline-flex items-center gap-1 rounded-sm outline-none transition-colors hover:text-[var(--deck-text)] focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]" onClick={() => toggleSort(column.key)}>
                            {column.label}
                            {sort.key === column.key ? (
                              sort.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : null}
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                    <th data-portal-table-actions className="min-w-[17rem] bg-[var(--deck-panel-2)] px-4 py-3 text-right text-[0.66rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--deck-panel)]">
                  {pagedRows.map((row) => (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${detailHrefBase ? "Open" : "View"} ${row.title}`}
                      className={cn(
                        "cursor-pointer border-b border-[var(--deck-line)] bg-[var(--deck-panel)] outline-none transition-colors hover:bg-[var(--deck-row-hover)] focus-visible:bg-[var(--deck-accent-tint)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--deck-accent)]",
                        selected?.id === row.id && "bg-[var(--deck-accent-tint)]"
                      )}
                      onClick={() => openRecord(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openRecord(row);
                        }
                      }}
                    >
                      {selectionEnabled ? (
                        <td
                          className="w-12 bg-inherit px-4 py-3 align-middle"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer accent-[var(--deck-accent)]"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                            aria-label={`Select ${row.title}`}
                          />
                        </td>
                      ) : null}
                      {columns.map((column, index) => (
                        <td key={column.key} className={cn("bg-inherit px-4 py-3 align-middle text-[var(--deck-text-2)]", column.className)}>
                          {index === 0 ? (
                            <div className="min-w-0">
                              {detailHref(row) ? (
                                // Real anchor so records are middle-clickable / crawlable;
                                // stopPropagation avoids the row's router.push double-firing.
                                <Link
                                  href={detailHref(row)!}
                                  className="block truncate font-semibold text-[var(--deck-text)] hover:underline"
                                  title={valueText(row.cells[column.key])}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {valueText(row.cells[column.key])}
                                </Link>
                              ) : (
                                <div className="truncate font-semibold text-[var(--deck-text)]" title={valueText(row.cells[column.key])}>{valueText(row.cells[column.key])}</div>
                              )}
                              {row.subtitle ? <div className="mt-0.5 truncate text-xs text-[var(--deck-text-3)]" title={row.subtitle}>{row.subtitle}</div> : null}
                            </div>
                          ) : column.key === "status" && row.status ? (
                            <StatusBadge label={row.status.label} tone={row.status.tone} />
                          ) : column.key === "secondaryStatus" && row.secondaryStatus ? (
                            <StatusBadge label={row.secondaryStatus.label} tone={row.secondaryStatus.tone} />
                          ) : typeof row.cells[column.key] === "boolean" ? (
                            <span className={cn(
                              "inline-flex rounded-[0.25rem] border px-2 py-0.5 text-xs font-semibold",
                              row.cells[column.key]
                                ? "border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] text-[var(--deck-success)]"
                                : "border-[var(--deck-line)] bg-[var(--deck-panel-2)] text-[var(--deck-text-2)]"
                            )}>
                              {valueText(row.cells[column.key])}
                            </span>
                          ) : (
                            <span className="block truncate text-[var(--deck-text-2)]" title={valueText(row.cells[column.key])}>{valueText(row.cells[column.key])}</span>
                          )}
                        </td>
                      ))}
                      <td data-portal-table-actions className="min-w-[17rem] bg-inherit px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                        <div data-portal-action-bar className="flex flex-wrap justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => openRecord(row)}>
                            <Eye className="h-3.5 w-3.5" />
                            {detailHrefBase ? "Open" : "View"}
                          </Button>
                          {archiveAction ? (
                            ["archived", "suspended", "inactive", "deleted"].includes(row.status?.label.toLowerCase() ?? "") && archiveDisabledReason ? (
                              <Button type="button" variant="ghost" size="sm" disabled title={archiveDisabledReason}>
                                {row.status?.label ?? "Inactive"}
                              </Button>
                            ) : (
                              <form action={archiveAction}>
                                <input type="hidden" name={recordIdName} value={row.id} />
                                <input type="hidden" name="back_to" value={backTo} />
                                <SubmitButton
                                  variant="ghost"
                                  size="sm"
                                  className="text-[var(--deck-text-2)] hover:text-[var(--deck-danger)]"
                                  confirm={row.archiveConfirm ?? archiveConfirm}
                                  pendingText="Saving..."
                                >
                                  {archiveLabel}
                                </SubmitButton>
                              </form>
                            )
                          ) : null}
                          {recordActions.map((action) => (
                            <form key={`${row.id}-${action.label}`} action={action.action}>
                              <input type="hidden" name={recordIdName} value={row.id} />
                              <input type="hidden" name="user_id" value={row.id} />
                              <input type="hidden" name="back_to" value={backTo} />
                              <SubmitButton
                                variant={action.variant ?? "outline"}
                                size="sm"
                                className={action.className}
                                confirm={action.confirm}
                                pendingText={action.pendingText ?? "Saving..."}
                              >
                                {action.label}
                              </SubmitButton>
                            </form>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {pagedRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openRecord(row)}
                  className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4 text-left outline-none transition-colors hover:border-[var(--deck-accent-line)] focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--deck-text)]">{row.title}</p>
                      <p className="mt-1 truncate text-sm text-[var(--deck-text-3)]">{valueText(row.cells.email)}</p>
                    </div>
                    {row.status ? <StatusBadge label={row.status.label} tone={row.status.tone} /> : null}
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm text-[var(--deck-text-2)]">
                    {columns.slice(2, 6).map((column) => (
                      <div key={column.key} className="grid grid-cols-[7rem_1fr] gap-2">
                        <dt className="text-xs font-semibold uppercase text-[var(--deck-text-3)]">{column.label}</dt>
                        <dd className="min-w-0 truncate">{valueText(row.cells[column.key])}</dd>
                      </div>
                    ))}
                  </dl>
                </button>
              ))}
            </div>
            </>
          ) : (
            <div className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
              <div className="rounded-md border border-dashed border-[var(--deck-line-strong)] p-4">
                <Search className="h-6 w-6 text-[var(--deck-text-3)]" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold uppercase text-[var(--deck-text)]">{emptyTitle}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--deck-text-3)]">{emptyDescription}</p>
            </div>
          )}
        </div>
      </div>

      {visibleRows.length > pageSize ? (
        <div className="flex flex-col gap-3 border-t border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-5 py-4 text-sm text-[var(--deck-text-3)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {safePage} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(10,19,34,0.55)] backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setSelectedId("")}>
          <aside
            className="h-full w-full overflow-y-auto border-l border-[var(--deck-line)] bg-[var(--deck-panel)] text-[var(--deck-text)] sm:max-w-[42rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 z-10 border-b border-[var(--deck-line)] bg-[var(--deck-panel)]/95 px-5 py-4 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.62rem] font-bold uppercase [letter-spacing:0.18em] text-[var(--deck-accent-ink)]">{detailEyebrow}</p>
                  <h3 className="mt-2 truncate text-2xl font-bold text-[var(--deck-text)]">{selected.title}</h3>
                  {selected.subtitle ? <p className="mt-1 truncate text-sm text-[var(--deck-text-3)]">{selected.subtitle}</p> : null}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedId("")} aria-label="Close details">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div data-portal-action-bar className="mt-4 flex flex-wrap items-center gap-2">
                {selected.status ? <StatusBadge label={selected.status.label} tone={selected.status.tone} /> : null}
                {selected.secondaryStatus ? <StatusBadge label={selected.secondaryStatus.label} tone={selected.secondaryStatus.tone} /> : null}
                {updateAction ? (
                  <Button type="button" className="ml-auto gap-2" onClick={() => setEditor({ mode: "edit", row: selected })}>
                    <Edit3 className="h-4 w-4" />
                    {editLabel}
                  </Button>
                ) : null}
              </div>
            </header>

            <div className="grid gap-4 p-5">
              {recordActions.length ? (
                <section className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4">
                  <h4 className="text-[0.66rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]">Review Actions</h4>
                  <div data-portal-action-bar className="mt-3 flex flex-wrap gap-2">
                    {recordActions.map((action) => (
                      <form key={`${selected.id}-detail-${action.label}`} action={action.action}>
                        <input type="hidden" name={recordIdName} value={selected.id} />
                        <input type="hidden" name="user_id" value={selected.id} />
                        <input type="hidden" name="back_to" value={backTo} />
                        <SubmitButton
                          variant={action.variant ?? "outline"}
                          className={action.className}
                          confirm={action.confirm}
                          pendingText={action.pendingText ?? "Saving..."}
                        >
                          {action.label}
                        </SubmitButton>
                      </form>
                    ))}
                  </div>
                </section>
              ) : null}
              {(selected.detailSections?.length ? selected.detailSections : [{ title: "Details", rows: selected.details }]).map((section) => (
                <section key={section.title} className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] p-4">
                  <h4 className="text-[0.66rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]">{section.title}</h4>
                  <dl className="mt-3">
                    {section.rows.map((detail) => (
                      <div key={`${section.title}-${detail.label}`} className="grid gap-1 border-b border-[var(--deck-line)] py-2.5 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                        <dt className="text-[0.64rem] font-bold uppercase [letter-spacing:0.12em] text-[var(--deck-text-3)]">{detail.label}</dt>
                        <dd className="min-w-0 break-words text-sm leading-5 text-[var(--deck-text)]">{valueText(detail.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}

              {selected.tabs?.map((tab) => (
                <section key={tab.title} className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] p-4">
                  <h4 className="text-[0.66rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]">{tab.title}</h4>
                  {tab.rows?.length ? (
                    <dl className="mt-3">
                      {tab.rows.map((item) => (
                        <div key={`${tab.title}-${item.label}`} className="grid gap-1 border-b border-[var(--deck-line)] py-2 last:border-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
                          <dt className="text-xs text-[var(--deck-text-3)]">{item.label}</dt>
                          <dd className="min-w-0 break-words text-sm text-[var(--deck-text)]">{valueText(item.value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[var(--deck-text-3)]">{tab.empty ?? "No related records yet."}</p>
                  )}
                </section>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {editor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,19,34,0.55)] p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] text-[var(--deck-text)]">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-5 py-4">
              <div>
                <p className="text-[0.62rem] font-bold uppercase [letter-spacing:0.18em] text-[var(--deck-accent-ink)]">
                  {editor.mode === "create" ? "Create Record" : "Edit Record"}
                </p>
                <h3 className="mt-1 text-xl font-bold text-[var(--deck-text)]">
                  {editor.mode === "create" ? createLabel : editor.row?.title}
                </h3>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setEditor(null)} aria-label="Close editor">
                <X className="h-4 w-4" />
              </Button>
            </header>
            <form
              key={`${editor.mode}-${editor.row?.id ?? "new"}`}
              action={editor.mode === "create" ? createAction! : updateAction!}
              className="max-h-[calc(92vh-5rem)] overflow-y-auto p-5"
            >
              {editor.mode === "edit" && editor.row ? <input type="hidden" name={recordIdName} value={editor.row.id} /> : null}
              <input type="hidden" name="back_to" value={backTo} />
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.name} className={cn("grid gap-2", field.fullWidth && "md:col-span-2", field.className)}>
                    <label htmlFor={field.name} className="text-[0.64rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]">
                      {field.label}
                      {field.required ? <span className="ml-1 text-[var(--deck-accent-ink)]">*</span> : null}
                    </label>
                    {fieldInput(field, editorValues)}
                  </div>
                ))}
              </div>
              <footer data-portal-action-bar className="mt-6 flex flex-col-reverse gap-2 border-t border-[var(--deck-line)] pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditor(null)}>
                  Cancel
                </Button>
                <SubmitButton pendingText="Saving...">
                  Save changes
                </SubmitButton>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
