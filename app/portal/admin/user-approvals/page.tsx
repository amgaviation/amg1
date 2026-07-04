import { approveUser, denyUser, waitlistUser } from "@/app/portal/actions/admin";
import { AdminRecordManager, type AdminRecordFilter, type AdminRecordRow } from "@/components/portal/admin/admin-record-manager";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import {
  ASSIGNABLE_PORTAL_ROLES,
  BUSINESS_PURPOSES,
  PROFILE_STATUS_LABEL,
  PROFILE_STATUS_TONE,
  ROLE_SHORT,
  type Tone,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";
import { listPendingUsers } from "@/lib/portal/queries";
import { requireRole } from "@/lib/portal/session";

export const metadata = { title: "User Approvals - Admin Portal" };

function profileTone(status: string): Tone {
  return toneFor(PROFILE_STATUS_TONE, status);
}

function businessPurposeLabel(value?: string | null) {
  if (!value) return "Other";
  return BUSINESS_PURPOSES.find((purpose) => purpose.value === value)?.label ?? value.replace(/_/g, " ");
}

function requestedRoleLabel(value?: string | null) {
  if (!value) return "Not assigned";
  return ASSIGNABLE_PORTAL_ROLES.find((role) => role.value === value)?.label ?? ROLE_SHORT[value as keyof typeof ROLE_SHORT] ?? value;
}

export default async function AdminUserApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const pendingUsers = await listPendingUsers();

  const rows: AdminRecordRow[] = pendingUsers.map((profile) => {
    const name = profile.full_name ?? profile.email;
    const businessPurpose = businessPurposeLabel(profile.business_purpose);
    const requestedRole = profile.assigned_role ?? profile.role ?? "client";
    const requestedRoleText = requestedRoleLabel(requestedRole);
    const createdAt = profile.created_at ? formatDateTime(profile.created_at) : null;

    return {
      id: profile.id,
      title: name,
      subtitle: [profile.company_name, businessPurpose].filter(Boolean).join(" - "),
      status: {
        label: PROFILE_STATUS_LABEL[profile.status] ?? profile.status,
        tone: profileTone(profile.status),
      },
      cells: {
        name,
        email: profile.email,
        company: profile.company_name,
        phone: profile.phone,
        businessPurpose,
        requestedRole: requestedRoleText,
        requested: createdAt,
        status: profile.status,
      },
      searchText: [
        name,
        profile.email,
        profile.company_name,
        profile.phone,
        profile.home_base,
        businessPurpose,
        requestedRoleText,
        profile.admin_notes,
      ].filter(Boolean).join(" "),
      filters: {
        businessPurpose: profile.business_purpose ?? "other",
        requestedRole,
      },
      formValues: {
        role: requestedRole,
        admin_notes: profile.admin_notes ?? "",
      },
      details: [
        { label: "Email", value: profile.email },
        { label: "Business Purpose", value: businessPurpose },
        { label: "Requested Role", value: requestedRoleText },
        { label: "Requested", value: createdAt },
      ],
      detailSections: [
        {
          title: "Request",
          rows: [
            { label: "Name", value: name },
            { label: "Email", value: profile.email },
            { label: "Company", value: profile.company_name },
            { label: "Phone", value: profile.phone },
            { label: "Home Base", value: profile.home_base },
            { label: "Business Purpose", value: businessPurpose },
            { label: "Requested Role", value: requestedRoleText },
            { label: "Requested", value: createdAt },
          ],
        },
        {
          title: "Review",
          rows: [
            { label: "Status", value: PROFILE_STATUS_LABEL[profile.status] ?? profile.status },
            { label: "Admin Notes", value: profile.admin_notes },
            { label: "Updated", value: profile.updated_at ? formatDateTime(profile.updated_at) : null },
          ],
        },
      ],
    };
  });

  const filters: AdminRecordFilter[] = [
    { key: "businessPurpose", label: "Business Purpose", options: BUSINESS_PURPOSES.map(({ value, label }) => ({ value, label })) },
    { key: "requestedRole", label: "Requested Role", options: ASSIGNABLE_PORTAL_ROLES.map(({ value, label }) => ({ value, label })) },
  ];

  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">User access updated.</Notice> : null}
      {params.error === "role" ? <Notice tone="danger">Invalid role selected.</Notice> : null}
      {params.error === "user" ? <Notice tone="danger">User request could not be found.</Notice> : null}
      {params.error === "save" ? <Notice tone="danger">User access could not be updated.</Notice> : null}
      {params.error === "invite" ? <Notice tone="danger">Portal setup email could not be sent.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="User Approvals"
        description="Review pending portal access requests using the same list, search, filter, and detail workflow as Crew Management."
      />

      <AdminRecordManager
        title="Pending Access"
        description="Pending portal access requests by requester, company, business purpose, requested role, and submitted date."
        rows={rows}
        columns={[
          { key: "name", label: "Name", sortable: true, className: "w-[15rem]" },
          { key: "email", label: "Email", sortable: true, className: "w-[18rem]" },
          { key: "company", label: "Company", sortable: true, className: "w-[13rem]" },
          { key: "businessPurpose", label: "Purpose", sortable: true, className: "w-[10rem]" },
          { key: "requestedRole", label: "Requested Role", sortable: true, className: "w-[12rem]" },
          { key: "requested", label: "Requested", sortable: true, className: "w-[12rem]" },
          { key: "status", label: "Status", sortable: true, className: "w-[10rem]" },
        ]}
        filters={filters}
        fields={[
          {
            name: "role",
            label: "Portal Role",
            type: "select",
            required: true,
            options: [{ value: "", label: "Select role" }, ...ASSIGNABLE_PORTAL_ROLES.map(({ value, label }) => ({ value, label }))],
            fullWidth: true,
          },
          { name: "admin_notes", label: "Admin Notes", type: "textarea", fullWidth: true },
        ]}
        updateAction={approveUser}
        recordActions={[
          {
            label: "Waitlist",
            action: waitlistUser,
            confirm: "Move this portal access request to the waitlist?",
            pendingText: "Waitlisting...",
            variant: "outline",
          },
          {
            label: "Deny",
            action: denyUser,
            confirm: "Deny this portal access request?",
            pendingText: "Denying...",
            variant: "outline",
            className: "border-[#EFC7C7] text-[#A82E2E] hover:border-[#EFC7C7]",
          },
        ]}
        allowCreate={false}
        createLabel="New Access Request"
        editLabel="Review Access"
        recordIdName="user_id"
        backTo="/portal/admin/user-approvals"
        emptyTitle="No pending access requests"
        emptyDescription="New portal access requests will appear here after submission."
        detailEyebrow="Access Request"
        pageSize={12}
      />
    </PortalShell>
  );
}
