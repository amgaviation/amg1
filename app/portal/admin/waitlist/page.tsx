import { approveWaitlistedUser, bulkDeletePortalAccounts, denyWaitlistedUser, sendWaitlistContactEmail } from "@/app/portal/actions/admin";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import { AdminRecordManager, type AdminRecordFilter, type AdminRecordRow } from "@/components/portal/admin/admin-record-manager";
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
import { waitlistContactRequestTemplate } from "@/lib/email/templates/access-management";
import { formatDateTime } from "@/lib/portal/format";
import { listWaitlistedUsers } from "@/lib/portal/queries";
import { requireRolePermission } from "@/lib/portal/permissions";

export const metadata = { title: "Waitlist - Admin Portal" };
export const dynamic = "force-dynamic";

function noticeFor(success?: string, error?: string) {
  if (success === "approved") return <Notice tone="success">Waitlisted portal access was approved.</Notice>;
  if (success === "status") return <Notice tone="success">Waitlist status updated.</Notice>;
  if (success === "email") return <Notice tone="success">Waitlist contact email sent.</Notice>;
  if (error === "email") return <Notice tone="danger">Waitlist email could not be sent. The last emailed date was not updated.</Notice>;
  if (error === "role") return <Notice tone="danger">Select a valid portal role before approval.</Notice>;
  if (error) return <Notice tone="danger">Waitlist action could not be completed.</Notice>;
  return null;
}

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

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("admin", "users");
  const params = await searchParams;
  const waitlistedUsers = await listWaitlistedUsers();

  const rows: AdminRecordRow[] = waitlistedUsers.map((profile) => {
    const name = profile.full_name ?? profile.email;
    const businessPurpose = businessPurposeLabel(profile.business_purpose);
    const requestedRole = profile.assigned_role ?? profile.role ?? "client";
    const requestedRoleText = requestedRoleLabel(requestedRole);
    const requestedAt = profile.created_at ? formatDateTime(profile.created_at) : null;
    const waitlistedAt = profile.waitlisted_at || profile.status_updated_at ? formatDateTime(profile.waitlisted_at ?? profile.status_updated_at) : null;
    const lastEmailedAt = profile.last_waitlist_email_sent_at ? formatDateTime(profile.last_waitlist_email_sent_at) : null;
    const template = waitlistContactRequestTemplate({ fullName: profile.full_name, email: profile.email });

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
        businessPurpose,
        assignedRole: requestedRoleText,
        requested: requestedAt,
        waitlisted: waitlistedAt,
        lastEmailed: lastEmailedAt,
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
        assignedRole: requestedRole,
        emailed: profile.last_waitlist_email_sent_at ? "true" : "false",
      },
      formValues: {
        role: requestedRole,
        admin_notes: profile.admin_notes ?? "",
      },
      details: [
        { label: "Email", value: profile.email },
        { label: "Business Purpose", value: businessPurpose },
        { label: "Assigned Role", value: requestedRoleText },
        { label: "Waitlisted", value: waitlistedAt },
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
            { label: "Assigned Role", value: requestedRoleText },
            { label: "Requested", value: requestedAt },
            { label: "Waitlisted", value: waitlistedAt },
            { label: "Last Emailed", value: lastEmailedAt },
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
        {
          title: "Email Preview",
          rows: [
            { label: "Subject", value: template.subject },
            { label: "Body", value: template.text },
          ],
        },
      ],
    };
  });

  const filters: AdminRecordFilter[] = [
    { key: "businessPurpose", label: "Business Purpose", options: BUSINESS_PURPOSES.map(({ value, label }) => ({ value, label })) },
    { key: "assignedRole", label: "Assigned Role", options: ASSIGNABLE_PORTAL_ROLES.map(({ value, label }) => ({ value, label })) },
    { key: "emailed", label: "Contact Email Sent", options: [{ value: "false", label: "No" }, { value: "true", label: "Yes" }] },
  ];

  return (
    <>
      {noticeFor(params.success, params.error)}
      <PageHeader
        eyebrow="AMG Operations"
        title="Waitlist"
        description="Review waitlisted portal access requests using the same list, search, filter, and detail workflow as Crew Management."
      />

      <BulkResultNotice params={params} entityLabel="waitlisted user" />
      <AdminRecordManager
        title="Waitlisted Access Requests"
        description="Waitlisted portal access requests by requester, company, business purpose, assigned role, waitlisted date, and contact status."
        rows={rows}
        columns={[
          { key: "name", label: "Name", sortable: true, className: "w-[15rem]" },
          { key: "email", label: "Email", sortable: true, className: "w-[18rem]" },
          { key: "company", label: "Company", sortable: true, className: "w-[13rem]" },
          { key: "businessPurpose", label: "Purpose", sortable: true, className: "w-[10rem]" },
          { key: "assignedRole", label: "Assigned Role", sortable: true, className: "w-[12rem]" },
          { key: "waitlisted", label: "Waitlisted", sortable: true, className: "w-[12rem]" },
          { key: "lastEmailed", label: "Last Emailed", sortable: true, className: "w-[12rem]" },
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
        updateAction={approveWaitlistedUser}
        recordActions={[
          {
            label: "Email",
            action: sendWaitlistContactEmail,
            confirm: "Send the waitlist contact request email?",
            pendingText: "Sending...",
            variant: "outline",
          },
          {
            label: "Deny",
            action: denyWaitlistedUser,
            confirm: "Deny this waitlisted portal access request?",
            pendingText: "Denying...",
            variant: "outline",
            className: "border-[var(--deck-danger-line)] text-[var(--deck-danger)] hover:border-[var(--deck-danger-line)]",
          },
        ]}
        allowCreate={false}
        createLabel="New Waitlist Request"
        editLabel="Review Access"
        recordIdName="user_id"
        backTo="/portal/admin/waitlist"
        bulkDelete={{ action: bulkDeletePortalAccounts, entity: "waitlist", entityLabel: "waitlisted user" }}
        emptyTitle="No waitlisted access requests"
        emptyDescription="Waitlisted portal access requests will appear here after review."
        detailEyebrow="Waitlist Request"
        pageSize={12}
      />
    </>
  );
}
