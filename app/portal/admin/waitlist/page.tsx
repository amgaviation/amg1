import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SelectField, TextAreaField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { approveWaitlistedUser, denyWaitlistedUser, sendWaitlistContactEmail } from "@/app/portal/actions/admin";
import { listWaitlistedUsers } from "@/lib/portal/queries";
import { ASSIGNABLE_PORTAL_ROLES, PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";
import { waitlistContactRequestTemplate } from "@/lib/email/templates/access-management";

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

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const waitlistedUsers = await listWaitlistedUsers();

  return (
    <PortalShell role="admin" user={user}>
      {noticeFor(params.success, params.error)}
      <PageHeader
        eyebrow="AMG Operations"
        title="Waitlist"
        description="Review waitlisted portal access requests, confirm role assignment, and contact users when AMG needs more information."
      />

      <SectionCard title="Waitlisted Access Requests" icon="userCheck">
        <DataTable
          rows={waitlistedUsers}
          getKey={(row) => row.id}
          emptyLabel="No waitlisted portal access requests."
          columns={[
            { header: "Full Name", priority: "primary", cell: (row) => <div><p className="text-sm font-semibold">{row.full_name ?? row.email}</p><p className="text-xs text-muted-foreground">{row.email}</p></div> },
            { header: "Business Purpose", cell: (row) => row.business_purpose ?? "other" },
            { header: "Requested Role", cell: (row) => row.requested_role ?? "-" },
            { header: "Assigned Role", cell: (row) => row.assigned_role ?? row.role ?? "-" },
            { header: "Date Requested", cell: (row) => formatDateTime(row.created_at) },
            { header: "Date Waitlisted", cell: (row) => formatDateTime(row.waitlisted_at ?? row.status_updated_at) },
            { header: "Notes", cell: (row) => row.admin_notes ?? "-" },
            { header: "Last Emailed", cell: (row) => formatDateTime(row.last_waitlist_email_sent_at) },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
          ]}
        />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {waitlistedUsers.map((row) => {
          const template = waitlistContactRequestTemplate({ fullName: row.full_name, email: row.email });

          return (
            <SectionCard key={row.id} title={row.full_name ?? row.email} icon="userCheck">
              <div className="grid gap-3 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-950">Email:</span> {row.email}</p>
                <p><span className="font-semibold text-slate-950">Business purpose:</span> {row.business_purpose ?? "other"}</p>
                <p><span className="font-semibold text-slate-950">Requested:</span> {formatDateTime(row.created_at)}</p>
                <p><span className="font-semibold text-slate-950">Waitlisted:</span> {formatDateTime(row.waitlisted_at ?? row.status_updated_at)}</p>
                <p><span className="font-semibold text-slate-950">Notes:</span> {row.admin_notes ?? "-"}</p>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email Preview</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{template.subject}</p>
                <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">{template.text}</pre>
              </div>

              <div className="mt-4 grid gap-3">
                <form action={approveWaitlistedUser} className="grid gap-2 rounded-lg border border-slate-200 p-3">
                  <input type="hidden" name="user_id" value={row.id} />
                  <input type="hidden" name="back_to" value="/portal/admin/waitlist" />
                  <SelectField label="Portal role" name="role" required placeholder="Select role" defaultValue="" options={ASSIGNABLE_PORTAL_ROLES.map((role) => ({ value: role.value, label: role.label }))} />
                  <TextAreaField label="Admin notes" name="admin_notes" defaultValue={row.admin_notes ?? ""} />
                  <SubmitButton className="rounded-full" pendingText="Approving...">Approve</SubmitButton>
                </form>

                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={sendWaitlistContactEmail}>
                    <input type="hidden" name="user_id" value={row.id} />
                    <input type="hidden" name="back_to" value="/portal/admin/waitlist" />
                    <SubmitButton variant="outline" className="w-full rounded-full" confirm="Send the waitlist contact request email?" pendingText="Sending...">Email</SubmitButton>
                  </form>
                  <form action={denyWaitlistedUser}>
                    <input type="hidden" name="user_id" value={row.id} />
                    <input type="hidden" name="back_to" value="/portal/admin/waitlist" />
                    <SubmitButton variant="outline" className="w-full rounded-full border-red-200 text-red-700 hover:border-red-300" confirm="Deny this waitlisted portal access request?" pendingText="Denying...">Deny</SubmitButton>
                  </form>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </PortalShell>
  );
}
