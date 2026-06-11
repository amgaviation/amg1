import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField } from "@/components/portal/ui/fields";
import { approveUser, setUserRole, setUserStatus } from "@/app/portal/actions/admin";
import { listAllUsers, listPendingUsers } from "@/lib/portal/queries";
import { PORTAL_ROLES, PROFILE_STATUS, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "User Approvals - Admin Portal" };

export default async function AdminUserApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [pendingUsers, users] = await Promise.all([listPendingUsers(), listAllUsers()]);

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
            { header: "Company", cell: (row) => row.company_name ?? "-" },
            { header: "Role", cell: (row) => row.role },
            { header: "Requested", cell: (row) => formatDateTime(row.created_at) },
            { header: "Approve", cell: (row) => <form action={approveUser}><input type="hidden" name="user_id" value={row.id} /><SubmitButton className="rounded-full" pendingText="Approving...">Approve</SubmitButton></form> },
          ]}
        />
      </SectionCard>
      <SectionCard title="All Portal Users" icon="users">
        <DataTable
          rows={users}
          getKey={(row) => row.id}
          emptyLabel="No users found."
          columns={[
            { header: "User", cell: (row) => <div><p className="text-sm font-semibold">{row.full_name ?? row.email}</p><p className="text-xs text-muted-foreground">{row.email}</p></div> },
            { header: "Role", cell: (row) => (
              <form action={setUserRole} className="flex min-w-40 gap-2">
                <input type="hidden" name="user_id" value={row.id} />
                <SelectField label="Role" name="role" defaultValue={row.role} options={PORTAL_ROLES.map((role) => ({ value: role, label: role }))} />
                <SubmitButton variant="outline" className="rounded-full" pendingText="Saving...">Save</SubmitButton>
              </form>
            ) },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
            { header: "Change Status", cell: (row) => (
              <form action={setUserStatus} className="flex min-w-48 gap-2">
                <input type="hidden" name="user_id" value={row.id} />
                <SelectField label="Status" name="status" defaultValue={row.status} options={PROFILE_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
                <SubmitButton variant="outline" className="rounded-full" pendingText="Saving...">Save</SubmitButton>
              </form>
            ) },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
