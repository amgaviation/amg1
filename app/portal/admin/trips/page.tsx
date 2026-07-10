import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import {
  EmptyState,
  FilterTabs,
  PageHeader,
  Pagination,
} from "@/components/portal/ui/primitives";
import { PageToolbar } from "@/components/portal/ui/page-toolbar";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SlaChip } from "@/components/portal/ui/sla-chip";
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
import { DeckSelect } from "@/components/portal/ui/fields";

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
  await requireRolePermission("admin", "missions");
  const params = await searchParams;
  const statuses = parseStatuses(params.status);
  // Exact filters run in the database; free-text search and sort stay in
  // memory over the (much smaller) matching set.
  const missions = await listAllMissions({
    statusIn: statuses.length ? statuses : undefined,
    type: params.type || undefined,
    urgency: params.urgency || undefined,
  });
  const sortKey = params.sort ?? "created";
  const direction = params.dir === "asc" ? "asc" : "desc";
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);

  const filtered = missions
    .filter((m) => {
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
            <DeckSelect name="type" defaultValue={params.type ?? ""} aria-label="Type" className="w-auto min-w-[9rem]" options={[{ value: "", label: "All Types" }, ...MISSION_TYPE.map((o) => ({ value: o.value, label: o.label }))]} placeholder="All Types" />
            <DeckSelect name="urgency" defaultValue={params.urgency ?? ""} aria-label="Urgency" className="w-auto min-w-[9rem]" options={[{ value: "", label: "All Urgency" }, ...URGENCY.map((o) => ({ value: o.value, label: o.label }))]} placeholder="All Urgency" />
            <DeckSelect name="sort" defaultValue={sortKey} aria-label="Sort by" className="w-auto min-w-[10rem]" options={[{ value: "created", label: "Created" }, { value: "departure", label: "Requested Departure" }, { value: "ref", label: "Reference" }, { value: "route", label: "Route" }, { value: "client", label: "Owner / Operator" }, { value: "status", label: "Status" }]} />
            <DeckSelect name="dir" defaultValue={direction} aria-label="Sort direction" className="w-auto min-w-[8rem]" options={[{ value: "desc", label: "Descending" }, { value: "asc", label: "Ascending" }]} />
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
              {
                header: "SLA",
                cell: (row) => <SlaChip mission={row} />,
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
