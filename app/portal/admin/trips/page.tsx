import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { EmptyState, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllMissions } from "@/lib/portal/queries";
import {
  MISSION_STATUS,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  MISSION_TYPE_LABEL,
  URGENCY_LABEL,
  URGENCY_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Support Requests - AMG Operations" };

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const missions = await listAllMissions(
    params.status ? { status: params.status } : undefined
  );

  const filtered = params.q
    ? missions.filter((m) => {
        const q = params.q!.toLowerCase();
        return (
          m.ref.toLowerCase().includes(q) ||
          m.departure_airport.toLowerCase().includes(q) ||
          m.arrival_airport.toLowerCase().includes(q) ||
          (m.tail_number ?? "").toLowerCase().includes(q) ||
          (m.client?.company_name ?? "").toLowerCase().includes(q) ||
          (m.client?.full_name ?? "").toLowerCase().includes(q)
        );
      })
    : missions;

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader
        eyebrow="AMG Operations"
        title="Support Requests"
        description="All owner, ferry, crew reposition, aircraft support, and maintenance reposition requests."
      />

      {/* Filters */}
      <SectionCard title="Filters" icon="plane">
        <form className="grid gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Status
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">All Statuses</option>
              {MISSION_STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Search
            <input
              name="q"
              defaultValue={params.q ?? ""}
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm"
              placeholder="Ref, route, tail number, client…"
            />
          </label>
          <button
            type="submit"
            className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Apply
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Request Register" icon="plane">
        {filtered.length === 0 ? (
          <EmptyState icon="plane" title="No requests found" description="No support requests match the current filters." />
        ) : (
          <DataTable
            rows={filtered}
            getKey={(row) => row.id}
            emptyLabel="No support requests submitted."
            columns={[
              {
                header: "Ref",
                cell: (row) => (
                  <Link
                    href={`/portal/admin/trips/${row.id}`}
                    className="font-mono text-xs text-accent hover:underline"
                  >
                    {row.ref}
                  </Link>
                ),
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
    </PortalShell>
  );
}
