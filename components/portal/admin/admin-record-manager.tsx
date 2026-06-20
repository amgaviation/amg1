"use client";

import { useMemo, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Filter,
  PanelRightOpen,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import type { Tone } from "@/lib/portal/constants";
import { cn } from "@/lib/utils";

type RecordValue = string | number | boolean | null | undefined;

export type AdminRecordField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "textarea" | "select";
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
  options: { value: string; label: string }[];
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
  createAction: (formData: FormData) => void | Promise<void>;
  updateAction: (formData: FormData) => void | Promise<void>;
  archiveAction?: (formData: FormData) => void | Promise<void>;
  createLabel: string;
  editLabel: string;
  archiveLabel?: string;
  archiveConfirm?: string;
  archiveDisabledReason?: string;
  recordIdName: string;
  backTo: string;
  emptyTitle: string;
  emptyDescription: string;
};

function valueText(value: RecordValue) {
  if (value === undefined || value === null || value === "") return "-";
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

function fieldInput(field: AdminRecordField, values: Record<string, RecordValue>) {
  const common = {
    id: field.name,
    name: field.name,
    required: field.required,
    defaultValue: inputValue(values[field.name]),
    placeholder: field.placeholder,
    className:
      "min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]",
  };

  if (field.type === "textarea") {
    return <textarea {...common} className={cn(common.className, "min-h-24 py-2")} />;
  }

  if (field.type === "select") {
    return (
      <select
        id={field.name}
        name={field.name}
        required={field.required}
        defaultValue={inputValue(values[field.name])}
        className={common.className}
      >
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
  createLabel,
  editLabel,
  archiveLabel = "Archive",
  archiveConfirm = "Archive this record?",
  archiveDisabledReason,
  recordIdName,
  backTo,
  emptyTitle,
  emptyDescription,
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
  const [selectedId, setSelectedId] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("overview");
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; row?: AdminRecordRow } | null>(null);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  const visibleRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (needle && !row.searchText.toLowerCase().includes(needle)) return false;
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        return (row.filters[key] ?? "") === value;
      });
    });

    return filtered.sort((a, b) => {
      const left = valueText(a.cells[sort.key] ?? a.title).toLowerCase();
      const right = valueText(b.cells[sort.key] ?? b.title).toLowerCase();
      const result = left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? result : -result;
    });
  }, [activeFilters, rows, search, sort]);

  const activeFilterBadges = Object.entries(activeFilters).filter(([, value]) => Boolean(value));
  const editorValues = editor?.row?.formValues ?? {};

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

  function openRecord(row: AdminRecordRow) {
    setSelectedId(row.id);
    setActiveDetailTab("overview");
    setDetailOpen(true);
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: AdminRecordRow) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openRecord(row);
  }

  function isArchiveDisabled(row: AdminRecordRow) {
    return ["archived", "suspended", "inactive"].includes(row.status?.label.toLowerCase() ?? "") && archiveDisabledReason;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_44px_rgba(8,20,36,0.07)]">
      <header className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold uppercase text-slate-950">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => startRefresh(() => router.refresh())}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button type="button" className="gap-2 rounded-full" onClick={() => setEditor({ mode: "create" })}>
              <Plus className="h-4 w-4" />
              {createLabel}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search records"
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-10 text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <Button type="button" variant="outline" className="gap-2 rounded-full" onClick={() => setFilterOpen((open) => !open)}>
            <Filter className="h-4 w-4" />
            Advanced Filters
          </Button>
        </div>

        {filterOpen ? (
          <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
            {filters.map((filter) => (
              <label key={filter.key} className="grid gap-2">
                <span className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-slate-500">{filter.label}</span>
                <select
                  value={activeFilters[filter.key] ?? ""}
                  onChange={(event) => updateFilter(filter.key, event.target.value)}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <div className="flex items-end">
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setActiveFilters({})}>
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
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {filter?.label ?? key}: {filter ? labelFor(filter.options, value) : value}
                  <X className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        ) : null}
      </header>

      <div>
        {visibleRows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-100/90 shadow-[0_1px_0_rgba(15,23,42,0.08)]">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-left text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-500",
                        column.className
                      )}
                    >
                      {column.sortable ? (
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(column.key)}>
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
                  <th className="px-4 py-3 text-right text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-500">Record</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "group cursor-pointer border-b border-slate-100 bg-white transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      selected?.id === row.id && detailOpen && "bg-sky-50/70"
                    )}
                    onClick={() => openRecord(row)}
                    onKeyDown={(event) => handleRowKeyDown(event, row)}
                    aria-label={`Open ${row.title}`}
                  >
                    {columns.map((column, index) => (
                      <td key={column.key} className={cn("px-4 py-3 align-middle text-slate-700", column.className)}>
                        {index === 0 ? (
                          <div>
                            <div className="font-semibold text-slate-950">{valueText(row.cells[column.key])}</div>
                            {row.subtitle ? <div className="mt-0.5 text-xs text-slate-500">{row.subtitle}</div> : null}
                          </div>
                        ) : column.key === "status" && row.status ? (
                          <StatusBadge label={row.status.label} tone={row.status.tone} />
                        ) : column.key === "secondaryStatus" && row.secondaryStatus ? (
                          <StatusBadge label={row.secondaryStatus.label} tone={row.secondaryStatus.tone} />
                        ) : (
                          valueText(row.cells[column.key])
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors group-hover:border-primary/40 group-hover:text-primary">
                        <PanelRightOpen className="h-3.5 w-3.5" />
                        Open
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-[28rem] flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full border border-dashed border-slate-300 p-4">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold uppercase text-slate-950">{emptyTitle}</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{emptyDescription}</p>
          </div>
        )}
      </div>

      {detailOpen && selected ? (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`${selected.title} details`}>
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setDetailOpen(false)}
            aria-label="Close record details"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl">
            <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">Record Details</p>
                  <h3 className="mt-1 text-2xl font-bold text-slate-950">{selected.title}</h3>
                  {selected.subtitle ? <p className="mt-1 text-sm text-slate-500">{selected.subtitle}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  {selected.status ? <StatusBadge label={selected.status.label} tone={selected.status.tone} /> : null}
                  <Button type="button" variant="ghost" size="icon" onClick={() => setDetailOpen(false)} aria-label="Close details">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab("overview")}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    activeDetailTab === "overview"
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary"
                  )}
                >
                  Overview
                </button>
                {selected.tabs?.map((tab) => (
                  <button
                    key={tab.title}
                    type="button"
                    onClick={() => setActiveDetailTab(tab.title)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      activeDetailTab === tab.title
                        ? "border-primary bg-primary text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary"
                    )}
                  >
                    {tab.title}
                  </button>
                ))}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {activeDetailTab === "overview" ? (
                <dl className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {selected.details.map((detail) => (
                    <div key={detail.label} className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-0 sm:grid-cols-[11rem_1fr]">
                      <dt className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-slate-500">{detail.label}</dt>
                      <dd className="text-sm leading-5 text-slate-800">{valueText(detail.value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                selected.tabs
                  ?.filter((tab) => tab.title === activeDetailTab)
                  .map((tab) => (
                    <div key={tab.title} className="rounded-lg border border-slate-200 bg-white">
                      {tab.rows?.length ? (
                        <dl>
                          {tab.rows.map((item) => (
                            <div key={`${tab.title}-${item.label}`} className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-0 sm:grid-cols-[11rem_1fr]">
                              <dt className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-slate-500">{item.label}</dt>
                              <dd className="text-sm leading-5 text-slate-800">{valueText(item.value)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="p-4 text-sm leading-6 text-slate-500">{tab.empty ?? "No related records yet."}</p>
                      )}
                    </div>
                  ))
              )}
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {archiveAction ? (
                  isArchiveDisabled(selected) ? (
                    <Button type="button" variant="ghost" className="rounded-full" disabled title={archiveDisabledReason}>
                      {selected.status?.label ?? "Inactive"}
                    </Button>
                  ) : (
                    <form action={archiveAction}>
                      <input type="hidden" name={recordIdName} value={selected.id} />
                      <input type="hidden" name="back_to" value={backTo} />
                      <SubmitButton
                        variant="ghost"
                        className="rounded-full text-slate-600"
                        confirm={archiveConfirm}
                        pendingText="Saving..."
                      >
                        {archiveLabel}
                      </SubmitButton>
                    </form>
                  )
                ) : null}
                <Button type="button" className="gap-2 rounded-full" onClick={() => setEditor({ mode: "edit", row: selected })}>
                  <Edit3 className="h-4 w-4" />
                  {editLabel}
                </Button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}

      {editor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">
                  {editor.mode === "create" ? "Create Record" : "Edit Record"}
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">
                  {editor.mode === "create" ? createLabel : editor.row?.title}
                </h3>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setEditor(null)} aria-label="Close editor">
                <X className="h-4 w-4" />
              </Button>
            </header>
            <form
              key={`${editor.mode}-${editor.row?.id ?? "new"}`}
              action={editor.mode === "create" ? createAction : updateAction}
              className="max-h-[calc(92vh-5rem)] overflow-y-auto p-5"
            >
              {editor.mode === "edit" && editor.row ? <input type="hidden" name={recordIdName} value={editor.row.id} /> : null}
              <input type="hidden" name="back_to" value={backTo} />
              <div className="grid gap-4 md:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.name} className={cn("grid gap-2", field.fullWidth && "md:col-span-2", field.className)}>
                    <label htmlFor={field.name} className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {field.label}
                      {field.required ? <span className="ml-1 text-primary">*</span> : null}
                    </label>
                    {fieldInput(field, editorValues)}
                  </div>
                ))}
              </div>
              <footer className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => setEditor(null)}>
                  Cancel
                </Button>
                <SubmitButton className="rounded-full" pendingText="Saving...">
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
