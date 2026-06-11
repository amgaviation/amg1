import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField } from "@/components/portal/ui/fields";
import { reviewDocument } from "@/app/portal/actions/admin";
import { listAllDocuments } from "@/lib/portal/queries";
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_VISIBILITY_LABEL, toneFor } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";

export const metadata = { title: "Documents - Admin Portal" };

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const docs = await listAllDocuments();
  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">Document review saved.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Documents" description="Review uploaded client, crew, partner, and operations documents." />
      <SectionCard title="Document Review Queue" icon="fileText">
        <DataTable
          rows={docs}
          getKey={(row) => row.id}
          emptyLabel="No documents uploaded."
          columns={[
            { header: "Name", cell: (row) => <div><p className="text-sm font-semibold">{row.name}</p><p className="text-xs text-muted-foreground">{row.doc_type}</p></div> },
            { header: "Visibility", cell: (row) => DOCUMENT_VISIBILITY_LABEL[row.visibility] ?? row.visibility },
            { header: "Expires", cell: (row) => formatDate(row.expiration_date) },
            { header: "Status", cell: (row) => <StatusBadge label={DOCUMENT_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(DOCUMENT_STATUS_TONE, row.status)} /> },
            { header: "Review", cell: (row) => (
              <form action={reviewDocument} className="grid min-w-56 gap-2">
                <input type="hidden" name="document_id" value={row.id} />
                <SelectField label="Decision" name="decision" defaultValue="approved" options={[{ value: "approved", label: "Approve" }, { value: "rejected", label: "Reject" }]} />
                <TextAreaField label="Notes" name="review_notes" defaultValue={row.review_notes ?? ""} />
                <SubmitButton variant="outline" className="rounded-full" pendingText="Saving...">Save Review</SubmitButton>
              </form>
            ) },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
