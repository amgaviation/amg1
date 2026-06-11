import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllPartnerAssignments, listAllPartners } from "@/lib/portal/queries";
import { PARTNER_STATUS_LABEL, PARTNER_STATUS_TONE, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Partners - Admin Portal" };

export default async function AdminPartnersPage() {
  const user = await requireRole("admin");
  const [partners, assignments] = await Promise.all([listAllPartners(), listAllPartnerAssignments()]);
  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Operations" title="Partners" description="Vendor/service partner directory and service request history." />
      <SectionCard title="Partner Directory" icon="handshake">
        <DataTable
          rows={partners}
          getKey={(row) => row.id}
          emptyLabel="No partners on file."
          columns={[
            { header: "Company", cell: (row) => row.partner_profile?.company_name ?? row.company_name ?? row.full_name ?? row.email },
            { header: "Type", cell: (row) => row.partner_profile?.partner_type ?? "-" },
            { header: "Email", cell: (row) => row.partner_profile?.contact_email ?? row.email },
            { header: "Service Area", cell: (row) => row.partner_profile?.service_area ?? "-" },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
          ]}
        />
      </SectionCard>
      <SectionCard title="Service Request History" icon="clipboard">
        <DataTable
          rows={assignments}
          getKey={(row) => row.id}
          emptyLabel="No partner assignments."
          columns={[
            { header: "Ref", cell: (row) => <span className="font-mono text-xs text-accent">{row.ref}</span> },
            { header: "Mission", cell: (row) => row.mission?.ref ?? "-" },
            { header: "Partner", cell: (row) => row.partner?.company_name ?? row.partner?.full_name ?? row.partner?.email ?? "-" },
            { header: "Service", cell: (row) => row.service_type },
            { header: "Quote", cell: (row) => formatMoney(row.quote_amount), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={PARTNER_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PARTNER_STATUS_TONE, row.status)} /> },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
