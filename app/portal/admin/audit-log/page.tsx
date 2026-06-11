import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { listAuditEvents } from "@/lib/portal/queries";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Audit Log - Admin Portal" };

export default async function AdminAuditLogPage() {
  const user = await requireRole("admin");
  const events = await listAuditEvents(200);
  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Operations" title="Audit Log" description="Operational event trail for mission changes, approvals, uploads, messages, and role activity." />
      <SectionCard title="Recent Events" icon="history">
        <DataTable
          rows={events}
          getKey={(row) => row.id}
          emptyLabel="No audit events yet."
          columns={[
            { header: "Time", cell: (row) => formatDateTime(row.created_at) },
            { header: "Actor", cell: (row) => row.actor_email ?? row.actor_id ?? "System" },
            { header: "Action", cell: (row) => row.action },
            { header: "Entity", cell: (row) => [row.entity_type, row.entity_id].filter(Boolean).join(" / ") || "-" },
            { header: "Detail", cell: (row) => row.detail ?? "-" },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
