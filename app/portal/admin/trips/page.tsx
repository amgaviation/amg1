import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllMissions } from "@/lib/portal/queries";
import { MISSION_STATUS_LABEL, MISSION_STATUS_TONE, MISSION_TYPE_LABEL, URGENCY_LABEL, URGENCY_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Trip Requests - Admin Portal" };

export default async function AdminTripsPage() {
  const user = await requireRole("admin");
  const missions = await listAllMissions();
  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Operations" title="Trip Requests" description="All owner, ferry, crew reposition, aircraft support, and maintenance reposition requests." />
      <SectionCard title="Mission Register" icon="plane">
        <DataTable
          rows={missions}
          getKey={(row) => row.id}
          emptyLabel="No missions submitted."
          columns={[
            { header: "Ref", cell: (row) => <Link href={`/portal/admin/trips/${row.id}`} className="font-mono text-xs text-accent hover:underline">{row.ref}</Link> },
            { header: "Route", cell: (row) => formatRoute(row.departure_airport, row.arrival_airport) },
            { header: "Type", cell: (row) => MISSION_TYPE_LABEL[row.mission_type] ?? row.mission_type },
            { header: "Client", cell: (row) => row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? "-" },
            { header: "Departure", cell: (row) => formatDateTime(row.requested_departure) },
            { header: "Urgency", cell: (row) => <StatusBadge label={URGENCY_LABEL[row.urgency] ?? row.urgency} tone={toneFor(URGENCY_TONE, row.urgency)} /> },
            { header: "Status", cell: (row) => <StatusBadge label={MISSION_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(MISSION_STATUS_TONE, row.status)} /> },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
