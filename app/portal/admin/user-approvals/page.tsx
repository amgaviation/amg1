import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField } from "@/components/portal/ui/fields";
import { approveUser, denyUser, waitlistUser } from "@/app/portal/actions/admin";
import { listPendingUsers } from "@/lib/portal/queries";
import { ASSIGNABLE_PORTAL_ROLES, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "User Approvals - Admin Portal" };

export default async function AdminUserApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const pendingUsers = await listPendingUsers();

  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">User access updated.</Notice> : null}
      {params.error === "role" ? <Notice tone="danger">Invalid role selected.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="User Approvals" description="Approve access requests, suspend accounts, and manage portal roles." />
      <SectionCard title="Pending Access" icon="userCheck">
        <DataTable
          rows={pendingUsers}
          getKey={(row) => row.id}
          emptyLabel="No pending access requests."
          columns={[
            { header: "User", cell: (row) => <div><p className="text-sm font-semibold">{row.full_name ?? row.email}</p><p className="text-xs text-muted-foreground">{row.email}</p></div> },
            { header: "Business Purpose", cell: (row) => row.business_purpose ?? "other" },
            { header: "Requested", cell: (row) => formatDateTime(row.created_at) },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
            { header: "Role Assignment", cell: (row) => (
              <form action={approveUser} className="grid min-w-64 gap-2">
                <input type="hidden" name="user_id" value={row.id} />
                <input type="hidden" name="back_to" value="/portal/admin/user-approvals" />
                <SelectField label="Portal role" name="role" required placeholder="Select role" defaultValue="" options={ASSIGNABLE_PORTAL_ROLES.map((role) => ({ value: role.value, label: role.label }))} />
                <TextAreaField label="Admin notes" name="admin_notes" defaultValue={row.admin_notes ?? ""} />
                <SubmitButton className="rounded-full" pendingText="Approving...">Approve</SubmitButton>
              </form>
            ) },
            { header: "Review", cell: (row) => (
              <div className="grid min-w-44 gap-2">
                <form action={waitlistUser}>
                  <input type="hidden" name="user_id" value={row.id} />
                  <input type="hidden" name="back_to" value="/portal/admin/user-approvals" />
                  <SubmitButton variant="outline" className="w-full rounded-full" confirm="Move this portal access request to the waitlist?" pendingText="Waitlisting...">Waitlist</SubmitButton>
                </form>
                <form action={denyUser}>
                  <input type="hidden" name="user_id" value={row.id} />
                  <input type="hidden" name="back_to" value="/portal/admin/user-approvals" />
                  <SubmitButton variant="outline" className="w-full rounded-full border-red-200 text-red-700 hover:border-red-300" confirm="Deny this portal access request?" pendingText="Denying...">Deny</SubmitButton>
                </form>
              </div>
            ) },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
