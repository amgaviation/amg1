import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import {
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
} from "@/components/portal/ui/primitives";
import { PageToolbar } from "@/components/portal/ui/page-toolbar";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { listAllMissions } from "@/lib/portal/queries";
import {
  MISSION_TYPE,
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

const ACTIVE_STATUSES = [
  "submitted",
  "under_review",
  "awaiting_client_info",
  "quoted",
  "approved",
  "crew_assigned",
  "scheduled",
  "in_progress",
];
const PAGE_SIZE = 20;

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
  searchParams: Promise<{
    status?: string;
    type?: string;
    urgency?: string;
    q?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const missions = await listAllMissions();
  const statuses = parseStatuses(params.status);
  const sortKey = params.sort ?? "created";
  const direction = params.dir === "asc" ? "asc" : "desc";
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

  const filtered = missions
    .filter((m) => {
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
      if (sortKey === "route")
        return compareValues(
          formatRoute(a.departure_airport, a.arrival_airport),
          formatRoute(b.departure_airport, b.arrival_airport),
          direction
        );
      if (sortKey === "status")
        return compareValues(
          MISSION_STATUS_LABEL[a.status] ?? a.status,
          MISSION_STATUS_LABEL[b.status] ?? b.status,
          direction
        );
      if (sortKey === "client") {
        const left = a.client?.company_name ?? a.client?.full_name ?? a.client?.email ?? "";
        const right = b.client?.company_name ?? b.client?.full_name ?? b.client?.email ?? "";
        return compareValues(left, right, direction);
      }
      if (sortKey === "departure")
        return compareValues(a.requested_departure ?? "", b.requested_departure ?? "", direction);
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
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Support Requests"
        description="All owner, ferry, crew reposition, aircraft support, and maintenance reposition requests."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/admin/mission-control">Board view</Link>
          </Button>
        }
      />

      <PageToolbar
        filters={
          <FilterTabs
            basePath="/portal/admin/trips"
            param="status"
            current={params.status ?? ""}
            preserve={{ type: params.type, urgency: params.urgency, q: params.q, sort: sortKey, dir: direction }}
            options={[
              { value: "", label: "All" },
              { value: "active", label: "Active" },
              { value: "submitted", label: "New" },
              { value: "under_review", label: "Under Review" },
              { value: "quoted", label: "Quoted" },
              { value: "approved", label: "Approved" },
              { value: "scheduled", label: "Scheduled" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        }
        search={
          <form className="flex flex-wrap items-center gap-2">
            {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Ref, route, tail number, client…"
              aria-label="Search support requests"
              className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
            />
            <select name="type" defaultValue={params.type ?? ""} aria-label="Type" className="deck-input w-auto">
              <option value="">All Types</option>
              {MISSION_TYPE.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select name="urgency" defaultValue={params.urgency ?? ""} aria-label="Urgency" className="deck-input w-auto">
              <option value="">All Urgency</option>
              {URGENCY.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select name="sort" defaultValue={sortKey} aria-label="Sort by" className="deck-input w-auto">
              <option value="created">Created</option>
              <option value="departure">Requested Departure</option>
              <option value="ref">Reference</option>
              <option value="route">Route</option>
              <option value="client">Owner / Operator</option>
              <option value="status">Status</option>
            </select>
            <select name="dir" defaultValue={direction} aria-label="Sort direction" className="deck-input w-auto">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <Button type="submit" size="sm">
              Apply
            </Button>
            {hasFilters ? (
              <Link
                href="/portal/admin/trips"
                className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
              >
                Clear
              </Link>
            ) : null}
            <span className="deck-micro ml-auto text-[var(--deck-text-3)]">
              {filtered.length} / {missions.length} requests
            </span>
          </form>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="plane"
          title="No requests found"
          description="No support requests match the current filters."
        />
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
                cell: (row) => (
                  <span className="deck-mono text-[var(--deck-accent-ink)]">{row.ref}</span>
                ),
              },
              {
                header: "Route",
                cell: (row) => formatRoute(row.departure_airport, row.arrival_airport),
              },
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

      <Pagination
        basePath="/portal/admin/trips"
        page={safePage}
        pageCount={pageCount}
        params={sharedParams}
      />
    </>
  );
}
