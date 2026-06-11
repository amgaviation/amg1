import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listClients } from "@/lib/portal/queries";
import { PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Clients - Admin Portal" };

export default async function AdminClientsPage() {
  const user = await requireRole("admin");
  const clients = await listClients();
  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Operations" title="Clients" description="Owner representatives and client companies with portal access." />
      <SectionCard title="Client Directory" icon="building">
        <DataTable
          rows={clients}
          getKey={(row) => row.id}
          emptyLabel="No clients on file."
          columns={[
            { header: "Name", cell: (row) => row.full_name ?? row.email },
            { header: "Company", cell: (row) => row.company_name ?? "-" },
            { header: "Email", cell: (row) => row.email },
            { header: "Phone", cell: (row) => row.phone ?? "-" },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
            { header: "Created", cell: (row) => formatDateTime(row.created_at) },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
