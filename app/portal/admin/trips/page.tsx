import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { EmptyState, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllMissions } from "@/lib/portal/queries";
import {
  MISSION_TYPE,
  MISSION_STATUS,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  MISSION_TYPE_LABEL,
  URGENCY,
  URGENCY_LABEL,
  URGENCY_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Support Requests - AMG Operations" };

const ACTIVE_STATUSES = ["submitted", "under_review", "awaiting_client_info", "quoted", "approved", "crew_assigned", "scheduled", "in_progress"];
const PAGE_SIZE = 20;

function hrefWith(base: string, params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

function parseStatuses(value?: string) {
  if (!value) return [];
  if (value === "active") return ACTIVE_STATUSES;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function compareValues(left: string, right: string, direction: "asc" | "desc") {
  const result = left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; urgency?: string; q?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const missions = await listAllMissions();
  const statuses = parseStatuses(params.status);
  const sortKey = params.sort ?? "created";
  const direction = params.dir === "asc" ? "asc" : "desc";
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

  const filtered = missions.filter((m) => {
      if (statuses.length && !statuses.includes(m.status)) return false;
      if (params.type && m.mission_type !== params.type) return false;
      if (params.urgency && m.urgency !== params.urgency) return false;
      if (params.q) {
        const q = params.q.toLowerCase();
        return (
          m.ref.toLowerCase().includes(q) ||
          m.departure_airport.toLowerCase().includes(q) ||
          m.arrival_airport.toLowerCase().includes(q) ||
          (m.tail_number ?? "").toLowerCase().includes(q) ||
          (m.client?.company_name ?? "").toLowerCase().includes(q) ||
          (m.client?.full_name ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "ref") return compareValues(a.ref, b.ref, direction);
      if (sortKey === "route") return compareValues(formatRoute(a.departure_airport, a.arrival_airport), formatRoute(b.departure_airport, b.arrival_airport), direction);
      if (sortKey === "status") return compareValues(MISSION_STATUS_LABEL[a.status] ?? a.status, MISSION_STATUS_LABEL[b.status] ?? b.status, direction);
      if (sortKey === "client") {
        const left = a.client?.company_name ?? a.client?.full_name ?? a.client?.email ?? "";
        const right = b.client?.company_name ?? b.client?.full_name ?? b.client?.email ?? "";
        return compareValues(left, right, direction);
      }
      if (sortKey === "departure") return compareValues(a.requested_departure ?? "", b.requested_departure ?? "", direction);
      return compareValues(a.created_at ?? "", b.created_at ?? "", direction);
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const sharedParams = {
    status: params.status,
    type: params.type,
    urgency: params.urgency,
    q: params.q,
    sort: sortKey,
    dir: direction,
  };
  const hasFilters = Boolean(params.status || params.type || params.urgency || params.q);

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader
        eyebrow="AMG Operations"
        title="Support Requests"
        description="All owner, ferry, crew reposition, aircraft support, and maintenance reposition requests."
      />

      {/* Filters */}
      <SectionCard title="Filters" icon="plane">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_2fr_1fr_1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Status
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Requests</option>
              {MISSION_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Type
            <select
              name="type"
              defaultValue={params.type ?? ""}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
            >
              <option value="">All Types</option>
              {MISSION_TYPE.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Urgency
            <select
              name="urgency"
              defaultValue={params.urgency ?? ""}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
            >
              <option value="">All Urgency</option>
              {URGENCY.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Search
            <input
              name="q"
              defaultValue={params.q ?? ""}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
              placeholder="Ref, route, tail number, client…"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Sort
            <select name="sort" defaultValue={sortKey} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
              <option value="created">Created</option>
              <option value="departure">Requested Departure</option>
              <option value="ref">Reference</option>
              <option value="route">Route</option>
              <option value="client">Owner / Operator</option>
              <option value="status">Status</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Direction
            <select name="dir" defaultValue={direction} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
          <button
            type="submit"
            className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Apply
          </button>
          <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-7">
            {hasFilters ? (
              <Link href="/portal/admin/trips" className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-primary/50 hover:bg-blue-50">
                Clear filters
              </Link>
            ) : null}
            <p className="text-xs text-[var(--amg-text-muted)]">
              Showing {filtered.length} of {missions.length} support request{missions.length === 1 ? "" : "s"}.
            </p>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Request Register" icon="plane">
        {filtered.length === 0 ? (
          <EmptyState icon="plane" title="No requests found" description="No support requests match the current filters." />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => `/portal/admin/trips/${row.id}`}
            emptyLabel="No support requests submitted."
            columns={[
              {
                header: "Ref",
                priority: "primary",
                cell: (row) => <span className="font-mono text-xs text-accent">{row.ref}</span>,
              },
              { header: "Route", cell: (row) => formatRoute(row.departure_airport, row.arrival_airport) },
              { header: "Type", cell: (row) => MISSION_TYPE_LABEL[row.mission_type] ?? row.mission_type },
              {
                header: "Owner / Operator",
                cell: (row) =>
                  row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? "—",
              },
              { header: "Requested Departure", cell: (row) => formatDateTime(row.requested_departure) },
              {
                header: "Urgency",
                cell: (row) => (
                  <StatusBadge
                    label={URGENCY_LABEL[row.urgency] ?? row.urgency}
                    tone={toneFor(URGENCY_TONE, row.urgency)}
                  />
                ),
              },
              {
                header: "Status",
                cell: (row) => (
                  <StatusBadge
                    label={MISSION_STATUS_LABEL[row.status] ?? row.status}
                    tone={toneFor(MISSION_STATUS_TONE, row.status)}
                  />
                ),
              },
            ]}
          />
        )}
      </SectionCard>
      {filtered.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
          <span>Page {safePage} of {pageCount}</span>
          <div className="flex gap-2">
            <Link
              aria-disabled={safePage <= 1}
              href={safePage <= 1 ? "#" : hrefWith("/portal/admin/trips", { ...sharedParams, page: safePage - 1 })}
              className={`rounded-full border border-border px-4 py-2 text-xs font-semibold ${safePage <= 1 ? "pointer-events-none opacity-50" : "text-slate-700 hover:border-primary/50 hover:bg-blue-50"}`}
            >
              Previous
            </Link>
            <Link
              aria-disabled={safePage >= pageCount}
              href={safePage >= pageCount ? "#" : hrefWith("/portal/admin/trips", { ...sharedParams, page: safePage + 1 })}
              className={`rounded-full border border-border px-4 py-2 text-xs font-semibold ${safePage >= pageCount ? "pointer-events-none opacity-50" : "text-slate-700 hover:border-primary/50 hover:bg-blue-50"}`}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </PortalShell>
  );
}
