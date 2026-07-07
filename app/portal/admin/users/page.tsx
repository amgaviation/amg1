import { requireRolePermission } from "@/lib/portal/permissions";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import {
  AdminRecordManager,
  type AdminRecordField,
  type AdminRecordFilter,
  type AdminRecordRow,
} from "@/components/portal/admin/admin-record-manager";
import { FilterTabs, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import {
  bulkDeletePortalAccounts,
  changePortalUserPassword,
  createPortalUser,
  deletePortalUser,
  sendPortalPasswordReset,
  updatePortalUser,
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
import { Combobox } from "@/components/portal/ui/combobox";

export const metadata = { title: "Users - Admin Portal" };
export const dynamic = "force-dynamic";

function isReleasedEmail(email: string) {
  return email.includes("+released-") || email.includes("__released__");
}

function noticeFor(success?: string, error?: string) {
  if (success === "invited") return <Notice tone="success">User created and AMG setup email sent.</Notice>;
  if (success === "resent") return <Notice tone="success">AMG setup email resent.</Notice>;
  if (success === "status") return <Notice tone="success">User profile updated.</Notice>;
  if (success === "reset") return <Notice tone="success">Password reset email sent.</Notice>;
  if (success === "password") return <Notice tone="success">Password changed.</Notice>;
  if (success === "deactivated") return <Notice tone="success">User access suspended.</Notice>;
  if (success === "deleted") return <Notice tone="success">User record soft deleted and email released for future access review.</Notice>;

  const errors: Record<string, string> = {
    missing: "Full name, email, role, and status are required.",
    duplicate: "A portal user with that email already exists.",
    phone: "Mobile phone must use E.164 format, such as +15551234567.",
    invite: "AMG could not provision portal access or send the setup email.",
    profile: "Profile metadata could not be saved.",
    self: "You cannot deactivate, delete, or demote your own admin account.",
    "last-admin": "You cannot remove the last active admin account.",
    user: "User could not be found.",
    deactivate: "User could not be deactivated.",
    delete: "User was archived instead of fully deleted because related operational records exist.",
    "auth-release": "The email could not be released from the authentication record.",
    "already-released": "This user's email has already been released.",
    released: "This user has a released email and cannot receive another setup email from this record.",
    reset: "Password reset email could not be sent.",
    weakpassword: "Password must be at least 12 characters.",
    mismatch: "Password confirmation does not match.",
    password: "Password could not be changed.",
    role: "You do not have permission to change that account.",
    status: "Invalid status selected.",
    save: "User profile could not be saved.",
    stale: "This user was updated, deleted, or removed by another admin. Refresh the directory and try again.",
  };

  return error && errors[error] ? <Notice tone="danger">{errors[error]}</Notice> : null;
}

const userFields: AdminRecordField[] = [
  { name: "full_name", label: "Full Name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Mobile Phone", type: "tel", placeholder: "+15551234567" },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: PORTAL_ROLES.map((role) => ({ value: role, label: role })),
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: PROFILE_STATUS.map((status) => ({ value: status.value, label: status.label })),
  },
  { name: "company_name", label: "Company" },
  { name: "home_base", label: "Home Airport", placeholder: "KTEB" },
  {
    name: "invitation_channel",
    label: "Invitation Method",
    type: "select",
    options: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS record only" },
      { value: "email_sms", label: "Email + SMS record" },
    ],
  },
];

const filters: AdminRecordFilter[] = [
  {
    key: "role",
    label: "Role",
    type: "select",
    options: PORTAL_ROLES.map((role) => ({ value: role, label: role })),
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: PROFILE_STATUS.map((status) => ({ value: status.value, label: status.label })),
  },
  { key: "company", label: "Company", type: "text" },
  {
    key: "invitation",
    label: "Invitation",
    type: "select",
    options: [
      { value: "access_request_received", label: "Access request" },
      { value: "portal_setup_sent", label: "Setup sent" },
      { value: "portal_setup_failed", label: "Setup failed" },
      { value: "profile_created", label: "Profile created" },
    ],
  },
];

function userRows(users: Awaited<ReturnType<typeof listAllUsers>>): AdminRecordRow[] {
  return users.map((row) => {
    const released = isReleasedEmail(row.email);
    const name = row.full_name ?? row.email;
    const statusLabel = PROFILE_STATUS_LABEL[row.status] ?? row.status;

    return {
      id: row.id,
      title: name,
      subtitle: released ? "Email released for future access request" : row.email,
      status: { label: statusLabel, tone: toneFor(PROFILE_STATUS_TONE, row.status) },
      secondaryStatus: row.invitation_status
        ? { label: row.invitation_status.replace(/_/g, " "), tone: row.invitation_status.includes("failed") ? "danger" : "info" }
        : undefined,
      cells: {
        name,
        email: row.email,
        role: row.role,
        company: row.company_name ?? "-",
        businessPurpose: row.business_purpose ?? "-",
        phone: row.phone ?? "-",
        status: statusLabel,
        requested: formatDateTime(row.created_at),
        updated: formatDateTime(row.status_updated_at ?? row.updated_at),
        invite: row.invitation_status ?? "-",
        lastLogin: formatDateTime(row.last_login_at),
      },
      searchText: [
        row.full_name,
        row.email,
        row.phone,
        row.role,
        row.status,
        row.company_name,
        row.business_purpose,
        row.home_base,
        row.invitation_status,
        row.created_at,
      ]
        .filter(Boolean)
        .join(" "),
      filters: {
        role: row.role,
        status: row.status,
        company: row.company_name,
        invitation: row.invitation_status,
      },
      formValues: {
        full_name: row.full_name ?? "",
        email: row.email,
        phone: row.phone ?? "",
        role: row.role,
        status: row.status,
        company_name: row.company_name ?? "",
        home_base: row.home_base ?? "",
        invitation_channel: row.invitation_channel ?? "email",
      },
      details: [
        { label: "Full Name", value: name },
        { label: "Email", value: released ? "Released for future access request" : row.email },
        { label: "Role", value: row.role },
        { label: "Status", value: statusLabel },
        { label: "Business Purpose", value: row.business_purpose },
        { label: "Phone", value: row.phone },
        { label: "Company", value: row.company_name },
        { label: "Home Airport", value: row.home_base },
      ],
      archiveConfirm:
        "Soft delete this portal account and release the email for future access review? Operational records, messages, approvals, documents, and audit history will be preserved.",
      detailSections: [
        {
          title: "Account",
          rows: [
            { label: "Role", value: row.role },
            { label: "Status", value: statusLabel },
            { label: "Business Purpose", value: row.business_purpose },
            { label: "Requested", value: formatDateTime(row.created_at) },
            { label: "Last Status Update", value: formatDateTime(row.status_updated_at ?? row.updated_at) },
            { label: "Active", value: row.is_active ? "Yes" : "No" },
            { label: "Created", value: formatDateTime(row.created_at) },
            { label: "Updated", value: formatDateTime(row.updated_at) },
            { label: "Last Login", value: formatDateTime(row.last_login_at) },
          ],
        },
        {
          title: "Onboarding",
          rows: [
            { label: "Invitation Status", value: row.invitation_status },
            { label: "Invitation Channel", value: row.invitation_channel },
            { label: "Invitation Sent", value: formatDateTime(row.invitation_sent_at) },
            { label: "Email History", value: `/portal/admin/communications/emails?user=${row.id}` },
          ],
        },
      ],
    };
  });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; status?: string }>;
}) {
  const user = await requireRolePermission("admin", "users");
  const params = await searchParams;
  const allowedStatuses = ["approved", "pending_approval", "denied", "suspended", "deleted"];
  const currentStatus = params.status ?? "approved";
  const statusFilter = allowedStatuses.includes(currentStatus) ? currentStatus : "approved";
  const users = await listAllUsers({ status: statusFilter });
  const rows = userRows(users);

  return (
    <>
      {noticeFor(params.success, params.error)}

      <PageHeader
        eyebrow="AMG Operations"
        title="All Users"
        description="Search, filter, create, edit, approve, deactivate, and manage secure portal account access."
      />

      <FilterTabs
        basePath="/portal/admin/users"
        current={statusFilter}
        options={[
          { label: "Approved", value: "approved" },
          { label: "Pending Approval", value: "pending_approval" },
          { label: "Denied", value: "denied" },
          { label: "Suspended", value: "suspended" },
          { label: "Deleted", value: "deleted" },
        ]}
      />

      <BulkResultNotice params={params} entityLabel="user" />
      <AdminRecordManager
        title="User Directory"
        description={`Showing ${PROFILE_STATUS_LABEL[statusFilter] ?? statusFilter} portal users. Data refreshes from Supabase each time this tab is opened.`}
        rows={rows}
        columns={[
          { key: "name", label: "Name", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "role", label: "Role", sortable: true },
          { key: "company", label: "Company", sortable: true },
          { key: "lastLogin", label: "Last Active", sortable: true },
          { key: "status", label: "Status", sortable: true },
        ]}
        filters={filters}
        fields={userFields}
        createAction={createPortalUser}
        updateAction={updatePortalUser}
        archiveAction={deletePortalUser}
        createLabel="Create User"
        editLabel="Edit User"
        archiveLabel="Delete"
        archiveConfirm="Soft delete this portal account and release the email for future access review?"
        archiveDisabledReason="This record is already inactive."
        recordIdName="profile_id"
        backTo="/portal/admin/users"
        bulkDelete={{ action: bulkDeletePortalAccounts, entity: "user", entityLabel: "user" }}
        emptyTitle={`No ${PROFILE_STATUS_LABEL[statusFilter] ?? statusFilter} Users`}
        emptyDescription="No portal users match this status filter."
        detailEyebrow="User Detail"
      />

      <SectionCard title="Security Center" icon="shield">
        <div className="grid gap-4 lg:grid-cols-2">
          <form action={sendPortalPasswordReset} className="deck-inset grid gap-3 p-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--deck-text)]">Send Password Reset Link</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--deck-text-3)]">
                Preferred account-help action. AMG sends a branded reset email and never exposes the setup link in the browser.
              </p>
            </div>
            <input type="hidden" name="back_to" value="/portal/admin/users" />
            <Combobox
              name="user_id"
              required
              placeholder="Search user by name or email…"
              options={users.filter((row) => !isReleasedEmail(row.email)).map((row) => ({ value: row.id, label: row.full_name ?? row.email ?? row.id, keywords: `${row.full_name ?? ""} ${row.email ?? ""}`, description: row.email ?? undefined }))}
            />
            <SubmitButton pendingText="Sending...">
              Send Password Reset Link
            </SubmitButton>
          </form>

          <form action={changePortalUserPassword} className="grid gap-3 rounded-md border border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)]/70 p-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--deck-text)]">Change Password</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--deck-warn)]">
                Admin override. Use direct password changes only when necessary; reset links are preferred.
              </p>
            </div>
            <input type="hidden" name="back_to" value="/portal/admin/users" />
            <Combobox
              name="user_id"
              required
              placeholder="Search user by name or email…"
              options={users.filter((row) => !isReleasedEmail(row.email)).map((row) => ({ value: row.id, label: row.full_name ?? row.email ?? row.id, keywords: `${row.full_name ?? ""} ${row.email ?? ""}`, description: row.email ?? undefined }))}
            />
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
              placeholder="New password"
              className="deck-input"
            />
            <input
              name="confirm_password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
              placeholder="Confirm new password"
              className="deck-input"
            />
            <SubmitButton
              variant="outline"
              confirm="Change this user's password? Password reset links are preferred."
              pendingText="Changing..."
            >
              Change Password
            </SubmitButton>
          </form>
        </div>

        <div className="deck-inset mt-4 p-4">
          <p className="deck-eyebrow !text-[var(--deck-text-3)]">Permissions Available on Create/Edit</p>
          <p className="mt-2 text-sm leading-6 text-[var(--deck-text-2)]">{PORTAL_PERMISSIONS.join(", ")}</p>
        </div>
      </SectionCard>
    </>
  );
}
