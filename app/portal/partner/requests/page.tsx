import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listPartnerAssignments } from "@/lib/portal/queries";
import { PARTNER_STATUS_LABEL, PARTNER_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Service Requests - Partner Portal" };

export default async function PartnerRequestsPage() {
  const user = await requireRole("partner");
  const assignments = await listPartnerAssignments(user.id);

  return (
    <PortalShell role="partner" user={user}>
      <PageHeader eyebrow="Service Partner" title="Service Requests" description="Respond to assigned AMG service tasks and submit quotes or milestone updates." />
      <SectionCard title="Assigned Work" icon="clipboard">
        <DataTable
          rows={assignments}
          getKey={(row) => row.id}
          getHref={(row) => `/portal/partner/requests/${row.id}`}
          emptyLabel="No service requests assigned."
          columns={[
            { header: "Request", priority: "primary", cell: (row) => <span className="font-mono text-xs text-accent">{row.ref}</span> },
            { header: "Mission", cell: (row) => row.mission?.ref ?? "-" },
            { header: "Service", cell: (row) => row.service_type },
            { header: "Location", cell: (row) => row.location ?? "-" },
            { header: "Quote", cell: (row) => formatMoney(row.quote_amount), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={PARTNER_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PARTNER_STATUS_TONE, row.status)} /> },
            { header: "Created", cell: (row) => formatDateTime(row.created_at) },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
