import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllCredentials, listAllCrew } from "@/lib/portal/queries";
import { AVAILABILITY_STATUS_LABEL, AVAILABILITY_STATUS_TONE, CREDENTIAL_STATUS_LABEL, CREDENTIAL_STATUS_TONE, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";

export const metadata = { title: "Crew - Admin Portal" };

export default async function AdminCrewPage() {
  const user = await requireRole("admin");
  const [crew, credentials] = await Promise.all([listAllCrew(), listAllCredentials()]);
  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Operations" title="Crew" description="Crew roster, availability, qualification status, and credential review visibility." />
      <SectionCard title="Crew Roster" icon="users">
        <DataTable
          rows={crew}
          getKey={(row) => row.id}
          emptyLabel="No crew profiles."
          columns={[
            { header: "Name", cell: (row) => row.full_name ?? row.email },
            { header: "Email", cell: (row) => row.email },
            { header: "Certificate", cell: (row) => row.crew_profile?.certificate_level ?? "-" },
            { header: "Availability", cell: (row) => <StatusBadge label={AVAILABILITY_STATUS_LABEL[row.crew_profile?.availability_status ?? "available"] ?? "Available"} tone={toneFor(AVAILABILITY_STATUS_TONE, row.crew_profile?.availability_status)} /> },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
          ]}
        />
      </SectionCard>
      <SectionCard title="Credential Watch" icon="badgeCheck">
        <DataTable
          rows={credentials}
          getKey={(row) => row.id}
          emptyLabel="No credentials submitted."
          columns={[
            { header: "Crew", cell: (row) => row.crew?.full_name ?? row.crew?.email ?? "-" },
            { header: "Credential", cell: (row) => row.credential_type },
            { header: "Identifier", cell: (row) => row.identifier ?? "-" },
            { header: "Expires", cell: (row) => formatDate(row.expiration_date) },
            { header: "Status", cell: (row) => <StatusBadge label={CREDENTIAL_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(CREDENTIAL_STATUS_TONE, row.status)} /> },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
