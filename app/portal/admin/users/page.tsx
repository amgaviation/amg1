import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextField } from "@/components/portal/ui/fields";
import {
  createPortalUser,
  deactivatePortalUser,
  deletePortalUser,
  resendPortalInvitation,
  setUserStatus,
} from "@/app/portal/actions/admin";
import { listAllUsers } from "@/lib/portal/queries";
import {
  PORTAL_PERMISSIONS,
  PORTAL_ROLES,
  PROFILE_STATUS,
  PROFILE_STATUS_LABEL,
  PROFILE_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Users - Admin Portal" };

function isReleasedEmail(email: string) {
  return email.includes("+released-") || email.includes("__released__");
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const users = await listAllUsers();

  return (
    <PortalShell role="admin" user={user}>
      {params.success === "invited" ? (
        <Notice tone="success">User created and invitation sent.</Notice>
      ) : null}

      {params.success === "resent" ? (
        <Notice tone="success">Invitation resent.</Notice>
      ) : null}

      {params.success === "status" ? (
        <Notice tone="success">User status updated.</Notice>
      ) : null}

      {params.success === "deactivated" ? (
        <Notice tone="success">
          User deactivated. The email has been released for a new access request.
        </Notice>
      ) : null}

      {params.success === "deleted" ? (
        <Notice tone="success">
          User deleted. The email has been released for a new access request.
        </Notice>
      ) : null}

      {params.error === "missing" ? (
        <Notice tone="danger">Full name, email, and role are required.</Notice>
      ) : null}

      {params.error === "duplicate" ? (
        <Notice tone="danger">A portal user with that email already exists.</Notice>
      ) : null}

      {params.error === "phone" ? (
        <Notice tone="danger">
          Mobile phone must use E.164 format, such as +15551234567.
        </Notice>
      ) : null}

      {params.error === "invite" ? (
        <Notice tone="danger">
          AMG could not send the invitation. Check auth email settings and AMG app URL configuration.
        </Notice>
      ) : null}

      {params.error === "profile" ? (
        <Notice tone="danger">
          Invitation was created but profile metadata could not be saved. Apply the production database patch and retry.
        </Notice>
      ) : null}

      {params.error === "self" ? (
        <Notice tone="danger">
          You cannot deactivate or delete your own admin account.
        </Notice>
      ) : null}

      {params.error === "last-admin" ? (
        <Notice tone="danger">
          You cannot deactivate or delete the last active admin account.
        </Notice>
      ) : null}

      {params.error === "user" ? (
        <Notice tone="danger">User could not be found.</Notice>
      ) : null}

      {params.error === "deactivate" ? (
        <Notice tone="danger">User could not be deactivated.</Notice>
      ) : null}

      {params.error === "delete" ? (
        <Notice tone="success">
          User was archived instead of fully deleted because related operational records exist. The email has still been released for a new access request.
        </Notice>
      ) : null}

      {params.error === "auth-release" ? (
        <Notice tone="danger">
          The email could not be released from the authentication record. Do not retry until the portal account is checked.
        </Notice>
      ) : null}

      {params.error === "already-released" ? (
        <Notice tone="danger">This user's email has already been released.</Notice>
      ) : null}

      {params.error === "released" ? (
        <Notice tone="danger">
          This user has a released email and cannot receive another invite from this record.
        </Notice>
      ) : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Users"
        description="Create portal users, send invitations, manage role/status, deactivate accounts, archive records, and release emails for new access requests."
      />

      <SectionCard title="Create User & Send Invitation" icon="userCheck">
        <form action={createPortalUser} className="grid gap-4 lg:grid-cols-4">
          <TextField label="Full Name" name="full_name" required />
          <TextField label="Email" name="email" type="email" required />
          <TextField label="Mobile Phone" name="phone" placeholder="+15551234567" />

          <SelectField
            label="Role"
            name="role"
            defaultValue="client"
            options={PORTAL_ROLES.map((role) => ({
              value: role,
              label: role,
            }))}
          />

          <TextField label="Company" name="company_name" />
          <TextField label="Home Airport" name="home_base" placeholder="KTEB" />

          <SelectField
            label="Initial Status"
            name="status"
            defaultValue="pending"
            options={PROFILE_STATUS.map((status) => ({
              value: status.value,
              label: status.label,
            }))}
          />

          <SelectField
            label="Invitation Method"
            name="invitation_channel"
            defaultValue="email"
            options={[
              { value: "email", label: "Email" },
              { value: "sms", label: "SMS record only" },
              { value: "email_sms", label: "Email + SMS record" },
            ]}
          />

          <div className="lg:col-span-4">
            <p className="eyebrow mb-2 text-[0.6rem] text-muted-foreground">
              Permissions
            </p>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PORTAL_PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  className="flex min-h-11 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="permissions"
                    value={permission}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  <span>{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <SubmitButton className="rounded-full" pendingText="Creating...">
              Create User & Send Invite
            </SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="User Directory" icon="users">
        <DataTable
          rows={users}
          getKey={(row) => row.id}
          emptyLabel="No portal users found."
          columns={[
            {
              header: "User",
              cell: (row) => (
                <div>
                  <p className="text-sm font-semibold">
                    {row.full_name ?? row.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isReleasedEmail(row.email)
                      ? "Email released for future access request"
                      : row.email}
                  </p>
                </div>
              ),
            },
            {
              header: "Role",
              cell: (row) => row.role,
            },
            {
              header: "Company",
              cell: (row) => row.company_name ?? "-",
            },
            {
              header: "Phone",
              cell: (row) => row.phone ?? "-",
            },
            {
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={PROFILE_STATUS_LABEL[row.status] ?? row.status}
                  tone={toneFor(PROFILE_STATUS_TONE, row.status)}
                />
              ),
            },
            {
              header: "Invite",
              cell: (row) => (
                <div className="text-xs text-muted-foreground">
                  {row.invitation_status ?? "-"}
                  <br />
                  {formatDateTime(row.invitation_sent_at)}
                </div>
              ),
            },
            {
              header: "Last Login",
              cell: (row) => formatDateTime(row.last_login_at),
            },
            {
              header: "Actions",
              cell: (row) => {
                const released = isReleasedEmail(row.email);

                return (
                  <div className="grid min-w-56 gap-2">
                    {!released ? (
                      <form action={resendPortalInvitation}>
                        <input type="hidden" name="user_id" value={row.id} />
                        <SubmitButton
                          variant="outline"
                          className="rounded-full"
                          pendingText="Sending..."
                        >
                          Resend Invite
                        </SubmitButton>
                      </form>
                    ) : null}

                    <form action={setUserStatus} className="grid gap-2">
                      <input type="hidden" name="user_id" value={row.id} />
                      <input
                        type="hidden"
                        name="back_to"
                        value="/portal/admin/users"
                      />

                      <SelectField
                        label="Status"
                        name="status"
                        defaultValue={row.status}
                        options={PROFILE_STATUS.map((status) => ({
                          value: status.value,
                          label: status.label,
                        }))}
                      />

                      <SubmitButton
                        variant="outline"
                        className="rounded-full"
                        pendingText="Saving..."
                      >
                        Save Status
                      </SubmitButton>
                    </form>

                    {!released ? (
                      <form action={deactivatePortalUser}>
                        <input type="hidden" name="user_id" value={row.id} />
                        <SubmitButton
                          variant="outline"
                          className="rounded-full border-amber-400/60 text-amber-700 hover:border-amber-500"
                          pendingText="Deactivating..."
                        >
                          Deactivate & Release Email
                        </SubmitButton>
                      </form>
                    ) : null}

                    <form action={deletePortalUser}>
                      <input type="hidden" name="user_id" value={row.id} />
                      <SubmitButton
                        variant="outline"
                        className="rounded-full border-red-500/60 text-red-700 hover:border-red-600"
                        pendingText="Archiving..."
                      >
                        Archive/Delete & Release Email
                      </SubmitButton>
                    </form>
                  </div>
                );
              },
            },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
