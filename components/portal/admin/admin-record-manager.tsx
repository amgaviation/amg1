"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Edit3, Eye, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckSelect } from "@/components/portal/ui/fields";
import { Combobox } from "@/components/portal/ui/combobox";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { DialogShell, ModalHeader } from "@/components/portal/ui/record-modal";
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
  /**
   * Status labels (case-insensitive) hidden from the default view — deleted /
   * deactivated records stay reachable through the "Show inactive" toggle.
   */
  hiddenStatuses?: string[];
  bulkDelete?: {
    action: (formData: FormData) => void | Promise<void>;
    entity: string;
    entityLabel?: string;
    /** Override the confirm-dialog copy (defaults to account-release wording). */
    confirm?: string;
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
  hiddenStatuses,
  bulkDelete,
}: AdminRecordManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRefreshing, startRefresh] = useTransition();
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: columns[0]?.key ?? "title",
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const [showHidden, setShowHidden] = useState(false);
  const hiddenSet = useMemo(
    () => new Set((hiddenStatuses ?? []).map((label) => label.toLowerCase())),
    [hiddenStatuses]
  );
  // URL-synced detail window: `?record=<id>` is the source of truth, so
  // refresh, back button, and shared links reopen the same record.
  const recordParam = searchParams.get("record") ?? "";
  const [selectedId, setSelectedId] = useState(recordParam);
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; row?: AdminRecordRow } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  useEffect(() => {
    setSelectedId(recordParam);
  }, [recordParam]);

  const syncRecordParam = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (id) next.set("record", id);
      else next.delete("record");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const closeRecord = useCallback(() => {
    setSelectedId("");
    syncRecordParam("");
  }, [syncRecordParam]);

  const hiddenCount = useMemo(
    () => (hiddenSet.size ? rows.filter((row) => hiddenSet.has(row.status?.label.toLowerCase() ?? "")).length : 0),
    [rows, hiddenSet]
  );

  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (!showHidden && hiddenSet.size && hiddenSet.has(row.status?.label.toLowerCase() ?? "")) return false;
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
  }, [activeFilters, rows, search, sort, showHidden, hiddenSet]);

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
    syncRecordParam(row.id);
  }

  // The status-style filter (few known values) renders as the chip row; every
  // other configured filter stays visible as an inline dropdown/keyword input.
  const chipFilter =
    filters.find(
      (filter) =>
        filter.type !== "text" &&
        (filter.options?.length ?? 0) > 0 &&
        (filter.options?.length ?? 0) <= 9 &&
        (filter.key.toLowerCase().includes("status") || filter.key.toLowerCase().includes("stage"))
    ) ??
    filters.find(
      (filter) => filter.type !== "text" && (filter.options?.length ?? 0) > 0 && (filter.options?.length ?? 0) <= 6
    ) ??
    null;
  const inlineFilters = filters.filter((filter) => filter.key !== chipFilter?.key);

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

  const bulkConfirmText =
    bulkDelete?.confirm ??
    `Delete ${selectionCount} selected ${
      selectionCount === 1 ? bulkEntityLabel : `${bulkEntityLabel}s`
    }? Their accounts are soft-deleted and the email / login identifiers that would otherwise block re-registration are released. Linked history is preserved, and this action is recorded in the audit log.`;

  // Rows can change under a live selection (refresh, server action revalidate);
  // drop selected ids that no longer exist so stale ids are never submitted.
  useEffect(() => {
    setSelectedIds((current) => {
      if (!current.size) return current;
      const live = new Set(rows.map((row) => row.id));
      const next = new Set(Array.from(current).filter((id) => live.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [rows]);

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

        {chipFilter || hiddenCount > 0 ? (
          <div className="deck-scroll-x -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {(chipFilter ? [{ value: "", label: "All" }, ...(chipFilter.options ?? [])] : []).map((option) => {
              const active = (activeFilters[chipFilter!.key] ?? "") === option.value;
              return (
                <button
                  key={option.value || "all"}
                  type="button"
                  onClick={() => updateFilter(chipFilter!.key, option.value)}
                  className={cn(
                    "shrink-0 rounded-[0.25rem] border px-3 py-2 font-mono text-[0.68rem] font-semibold uppercase [letter-spacing:0.08em] transition-colors sm:py-1.5",
                    active
                      ? "border-[var(--deck-accent)] bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]"
                      : "border-[var(--deck-line-strong)] bg-[var(--deck-panel)] text-[var(--deck-text-2)] hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)]"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
            {hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowHidden((value) => !value)}
                aria-pressed={showHidden}
                className={cn(
                  "shrink-0 rounded-[0.25rem] border border-dashed px-3 py-2 font-mono text-[0.68rem] font-semibold uppercase [letter-spacing:0.08em] transition-colors sm:py-1.5",
                  showHidden
                    ? "border-[var(--deck-warn)] bg-[var(--deck-warn-tint)] text-[var(--deck-warn)]"
                    : "border-[var(--deck-line-strong)] bg-[var(--deck-panel)] text-[var(--deck-text-3)] hover:border-[var(--deck-warn-line)] hover:text-[var(--deck-text-2)]"
                )}
              >
                {showHidden ? "Hide" : "Show"} inactive ({hiddenCount})
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--deck-text-3)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
              className={cn(inputClassName, "pl-9")}
            />
          </label>
          {inlineFilters.map((filter) =>
            filter.type === "text" ? (
              <input
                key={filter.key}
                value={activeFilters[filter.key] ?? ""}
                onChange={(event) => updateFilter(filter.key, event.target.value)}
                placeholder={filter.label}
                aria-label={filter.label}
                className={cn(inputClassName, "w-auto min-w-[9rem] flex-none")}
              />
            ) : (
              <DeckSelect
                key={filter.key}
                aria-label={filter.label}
                className="w-auto min-w-[9rem]"
                value={activeFilters[filter.key] || "__all__"}
                onChange={(event) =>
                  updateFilter(filter.key, event.target.value === "__all__" ? "" : event.target.value)
                }
                options={[{ value: "__all__", label: `All ${filter.label}` }, ...(filter.options ?? [])]}
              />
            )
          )}
          {activeFilterBadges.length || search.trim() ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveFilters({});
                setSearch("");
              }}
            >
              Clear
            </Button>
          ) : null}
          <span className="deck-micro ml-auto shrink-0 text-[var(--deck-text-3)]">
            {visibleRows.length !== rows.length
              ? `${firstRow}-${lastRow} of ${visibleRows.length} · ${rows.length} total`
              : `${firstRow}-${lastRow} of ${rows.length} record${rows.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </header>

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
              <table className="min-w-[56rem] w-full table-fixed border-collapse bg-[var(--deck-panel)] text-sm">
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
                    <th data-portal-table-actions className="min-w-[6.5rem] bg-[var(--deck-panel-2)] px-4 py-3 text-right text-[0.66rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]">
                      <span className="sr-only">Open record</span>
                    </th>
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
                      {/* Row click opens the record window; archive and record
                          actions live inside it, keeping the table slim. */}
                      <td data-portal-table-actions className="min-w-[6.5rem] bg-inherit px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                        <div data-portal-action-bar className="flex flex-wrap justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => openRecord(row)}>
                            <Eye className="h-3.5 w-3.5" />
                            {detailHrefBase ? "Open" : "View"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {pagedRows.map((row) => {
                return (
                  // Not a <button>: the card holds nested interactive controls
                  // (checkbox, action forms), which are invalid inside a button.
                  <div
                    key={row.id}
                    className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4 transition-colors hover:border-[var(--deck-accent-line)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {selectionEnabled ? (
                        <label
                          className="-m-2 shrink-0 p-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer accent-[var(--deck-accent)]"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                            aria-label={`Select ${row.title}`}
                          />
                        </label>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openRecord(row)}
                        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
                      >
                        <p className="truncate font-semibold text-[var(--deck-text)]">{row.title}</p>
                        <p className="mt-1 truncate text-sm text-[var(--deck-text-3)]">
                          {row.subtitle ?? valueText(row.cells.email)}
                        </p>
                      </button>
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
                    <div data-portal-action-bar className="mt-3 flex flex-wrap gap-2 border-t border-[var(--deck-line)] pt-3">
                      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => openRecord(row)}>
                        <Eye className="h-3.5 w-3.5" />
                        {detailHrefBase ? "Open" : "View"}
                      </Button>
                    </div>
                  </div>
                );
              })}
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
        <DialogShell labelledBy="admin-record-title" onClose={closeRecord} wide>
          <ModalHeader
            id="admin-record-title"
            eyebrow={detailEyebrow}
            title={selected.title}
            meta={selected.subtitle ?? undefined}
            badge={
              <>
                {selected.status ? <StatusBadge label={selected.status.label} tone={selected.status.tone} /> : null}
                {selected.secondaryStatus ? <StatusBadge label={selected.secondaryStatus.label} tone={selected.secondaryStatus.tone} /> : null}
              </>
            }
            onClose={closeRecord}
          />
          {updateAction ? (
            <div data-portal-action-bar className="flex flex-wrap items-center gap-2 border-b border-[var(--deck-line)] px-5 py-3 sm:px-6">
              <Button type="button" size="sm" className="gap-2" onClick={() => setEditor({ mode: "edit", row: selected })}>
                <Edit3 className="h-4 w-4" />
                {editLabel}
              </Button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-4 p-5 sm:p-6">
              {recordActions.length || archiveAction ? (
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
                    {archiveAction &&
                    !(
                      ["archived", "suspended", "inactive", "deleted"].includes(selected.status?.label.toLowerCase() ?? "") &&
                      archiveDisabledReason
                    ) ? (
                      <form action={archiveAction}>
                        <input type="hidden" name={recordIdName} value={selected.id} />
                        <input type="hidden" name="back_to" value={backTo} />
                        <SubmitButton
                          variant="ghost"
                          className="text-[var(--deck-text-2)] hover:text-[var(--deck-danger)]"
                          confirm={selected.archiveConfirm ?? archiveConfirm}
                          pendingText="Saving..."
                        >
                          {archiveLabel}
                        </SubmitButton>
                      </form>
                    ) : null}
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
          </div>
        </DialogShell>
      ) : null}

      {editor ? (
        <DialogShell labelledBy="admin-record-editor-title" onClose={() => setEditor(null)} wide>
          <ModalHeader
            id="admin-record-editor-title"
            eyebrow={editor.mode === "create" ? "Create Record" : "Edit Record"}
            title={editor.mode === "create" ? createLabel : editor.row?.title ?? editLabel}
            onClose={() => setEditor(null)}
          />
          <form
            key={`${editor.mode}-${editor.row?.id ?? "new"}`}
            action={editor.mode === "create" ? createAction! : updateAction!}
            className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6"
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
        </DialogShell>
      ) : null}
    </section>
  );
}
