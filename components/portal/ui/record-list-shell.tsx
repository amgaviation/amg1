import { PageHeader, Pagination } from "@/components/portal/ui/primitives";

/**
 * Console Record Pattern list layout: page header → optional KPI strip →
 * status-chip row → search/filter row with a right-aligned record count →
 * slim full-width table → pagination. Slots, not config — pages keep their
 * own FilterTabs, GET forms, and DataTable; this shell standardizes order
 * and spacing so every console page reads the same top to bottom.
 *
 * The table slot must NOT introduce its own vertical scroll area: the table
 * grows with the page and long lists paginate (the `pagination` slot).
 */
export function RecordListShell({
  eyebrow,
  title,
  description,
  actions,
  notices,
  kpis,
  chips,
  filterRow,
  count,
  table,
  pagination,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Header actions — the `+ New <Record>` link/button lives here. */
  actions?: React.ReactNode;
  /** Flash notices (?success= / ?error=) rendered above the header. */
  notices?: React.ReactNode;
  /** Optional KPI/StatCard strip between header and toolbar. */
  kpis?: React.ReactNode;
  /** Status chip row (FilterTabs). */
  chips?: React.ReactNode;
  /** Search input + scoped dropdowns + Apply (a GET form). */
  filterRow?: React.ReactNode;
  /** `X / Y records` count, right-aligned on the filter row. */
  count?: React.ReactNode;
  table: React.ReactNode;
  /** Pagination props (link-driven) or a custom node via `children`. */
  pagination?: {
    basePath: string;
    page: number;
    pageCount: number;
    params?: Record<string, string | number | null | undefined>;
  };
  /** Modals (record/detail/create) — rendered last so they overlay the list. */
  children?: React.ReactNode;
}) {
  return (
    <>
      {notices}
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      {kpis}
      {(chips || filterRow || count) ? (
        <div className="flex flex-col gap-3">
          {chips ? <div className="min-w-0">{chips}</div> : null}
          {(filterRow || count) ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">{filterRow}</div>
              {count ? (
                <span className="deck-micro ml-auto shrink-0 text-[var(--deck-text-3)]">{count}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {table}
      {pagination ? (
        <Pagination
          basePath={pagination.basePath}
          page={pagination.page}
          pageCount={pagination.pageCount}
          params={pagination.params}
        />
      ) : null}
      {children}
    </>
  );
}
