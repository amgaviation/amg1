import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import {
  AdminRecordManager,
  type AdminRecordField,
  type AdminRecordFilter,
  type AdminRecordRow,
} from "@/components/portal/admin/admin-record-manager";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import {
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
  const user = await requireRole("admin");
  const params = await searchParams;
  const allowedStatuses = ["approved", "pending_approval", "denied", "suspended", "deleted"];
  const currentStatus = params.status ?? "approved";
  const statusFilter = allowedStatuses.includes(currentStatus) ? currentStatus : "approved";
  const users = await listAllUsers({ status: statusFilter });
  const rows = userRows(users);

  return (
    <PortalShell role="admin" user={user}>
      {noticeFor(params.success, params.error)}

      <PageHeader
        eyebrow="AMG Operations"
        title="All Users"
        description="Search, filter, create, edit, approve, deactivate, and manage secure portal account access."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["approved", "Approved"],
          ["pending_approval", "Pending Approval"],
          ["denied", "Denied"],
          ["suspended", "Suspended"],
          ["deleted", "Deleted"],
        ].map(([value, label]) => (
          <a
            key={value}
            href={`/portal/admin/users?status=${value}`}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              statusFilter === value
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <AdminRecordManager
        title="User Directory"
        description={`Showing ${PROFILE_STATUS_LABEL[statusFilter] ?? statusFilter} portal users. Data refreshes from Supabase each time this tab is opened.`}
        rows={rows}
        columns={[
          { key: "name", label: "User", sortable: true },
          { key: "role", label: "Role", sortable: true },
          { key: "status", label: "Status", sortable: true },
          { key: "businessPurpose", label: "Business Purpose", sortable: true },
          { key: "requested", label: "Created / Requested", sortable: true },
          { key: "updated", label: "Last Status Update", sortable: true },
          { key: "lastLogin", label: "Last Login", sortable: true },
          { key: "company", label: "Company", sortable: true },
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
        emptyTitle={`No ${PROFILE_STATUS_LABEL[statusFilter] ?? statusFilter} Users`}
        emptyDescription="No portal users match this status filter."
        detailEyebrow="User Detail"
      />

      <SectionCard title="Security Center" icon="shield">
        <div className="grid gap-4 lg:grid-cols-2">
          <form action={sendPortalPasswordReset} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Send Password Reset Link</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Preferred account-help action. AMG sends a branded reset email and never exposes the setup link in the browser.
              </p>
            </div>
            <input type="hidden" name="back_to" value="/portal/admin/users" />
            <select name="user_id" required className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950">
              <option value="">Select user</option>
              {users.filter((row) => !isReleasedEmail(row.email)).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.full_name ?? row.email} - {row.email}
                </option>
              ))}
            </select>
            <SubmitButton className="rounded-full" pendingText="Sending...">
              Send Password Reset Link
            </SubmitButton>
          </form>

          <form action={changePortalUserPassword} className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Change Password</h3>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Admin override. Use direct password changes only when necessary; reset links are preferred.
              </p>
            </div>
            <input type="hidden" name="back_to" value="/portal/admin/users" />
            <select name="user_id" required className="min-h-11 rounded-md border border-amber-200 bg-white px-3 text-sm text-slate-950">
              <option value="">Select user</option>
              {users.filter((row) => !isReleasedEmail(row.email)).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.full_name ?? row.email} - {row.email}
                </option>
              ))}
            </select>
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
              placeholder="New password"
              className="min-h-11 rounded-md border border-amber-200 bg-white px-3 text-sm text-slate-950"
            />
            <input
              name="confirm_password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
              placeholder="Confirm new password"
              className="min-h-11 rounded-md border border-amber-200 bg-white px-3 text-sm text-slate-950"
            />
            <SubmitButton
              variant="outline"
              className="rounded-full border-amber-400/70 text-amber-800 hover:border-amber-500"
              confirm="Change this user's password? Password reset links are preferred."
              pendingText="Changing..."
            >
              Change Password
            </SubmitButton>
          </form>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permissions Available on Create/Edit</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{PORTAL_PERMISSIONS.join(", ")}</p>
        </div>
      </SectionCard>
    </PortalShell>
  );
}
