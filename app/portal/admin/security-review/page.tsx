import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { TextAreaField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllUsers } from "@/lib/portal/queries";
import { PROFILE_STATUS_LABEL, PROFILE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime } from "@/lib/portal/format";
import { completeAdminSecurityReview } from "@/app/portal/actions/compliance";

export const metadata = { title: "Security Review - Admin Portal" };

export default async function AdminSecurityReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const users = await listAllUsers();

  return (
    <PortalShell role="admin" user={user}>
      {params.success === "reviewed" ? <Notice tone="success">Admin access review recorded in compliance evidence.</Notice> : null}
      <Notice tone="warn">
        MFA is not currently enforced by this portal UI. Verify Supabase Auth MFA enrollment and enforcement before
        production use of sensitive portal workflows.
      </Notice>
      <PageHeader
        eyebrow="AMG Operations"
        title="Security Review"
        description="Monthly account, role, status, sensitive access, and MFA-readiness review for portal users."
      />

      <SectionCard title="Account Review" icon="shield">
        <DataTable
          rows={users}
          getKey={(row) => row.id}
          emptyLabel="No portal users found."
          columns={[
            { header: "User", cell: (row) => <div><p className="font-semibold">{row.full_name ?? row.email}</p><p className="text-xs text-muted-foreground">{row.email}</p></div> },
            { header: "Role", cell: (row) => row.role },
            { header: "Status", cell: (row) => <StatusBadge label={PROFILE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(PROFILE_STATUS_TONE, row.status)} /> },
            { header: "MFA", cell: () => "Not exposed in profile" },
            { header: "Sensitive Access", cell: (row) => row.role === "admin" ? "Broad admin review required" : row.role },
            { header: "Created", cell: (row) => formatDateTime(row.created_at) },
          ]}
        />
      </SectionCard>

      <SectionCard title="Complete Monthly Review" icon="clipboard">
        <form action={completeAdminSecurityReview} className="grid gap-4">
          <TextAreaField
            label="Review Notes"
            name="notes"
            placeholder="Accounts reviewed, stale accounts identified, role changes needed, MFA follow-up, suspended users checked..."
          />
          <SubmitButton className="rounded-full" pendingText="Recording...">Mark Review Completed</SubmitButton>
        </form>
      </SectionCard>
    </PortalShell>
  );
}
