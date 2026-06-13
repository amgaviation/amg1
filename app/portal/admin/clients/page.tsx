import { requireRole } from "@/lib/portal/session";
import { updateBillingContact } from "@/app/portal/actions/profiles";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { TextField } from "@/components/portal/ui/fields";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listClients } from "@/lib/portal/queries";
import { PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Clients - Admin Portal" };

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const clients = await listClients();
  return (
    <PortalShell role="admin" user={user}>
      {params.success === "billing-contact" ? <Notice tone="success">Billing contact updated.</Notice> : null}
      {params.error === "billing-contact" ? <Notice tone="danger">Billing contact could not be saved.</Notice> : null}
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
            {
              header: "Billing Delivery",
              cell: (row) => (
                <form action={updateBillingContact} className="grid min-w-[22rem] gap-2">
                  <input type="hidden" name="profile_id" value={row.id} />
                  <input type="hidden" name="back_to" value="/portal/admin/clients" />
                  <TextField label="Contact Name" name="billing_contact_name" defaultValue={(row as any).billing_contact_name ?? ""} />
                  <TextField label="Billing Email" name="billing_contact_email" type="email" defaultValue={(row as any).billing_contact_email ?? ""} />
                  <TextField label="Billing Phone" name="billing_contact_phone" defaultValue={(row as any).billing_contact_phone ?? ""} />
                  <TextField label="CC Emails" name="billing_cc_emails" defaultValue={((row as any).billing_cc_emails ?? []).join(", ")} />
                  <SubmitButton className="rounded-full" pendingText="Saving...">Save Billing</SubmitButton>
                </form>
              ),
            },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
            { header: "Created", cell: (row) => formatDateTime(row.created_at) },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
