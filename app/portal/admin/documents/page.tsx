import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { FileField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { reviewDocument } from "@/app/portal/actions/admin";
import { uploadDocument } from "@/app/portal/actions/documents";
import { listAllDocuments, listAllUsers } from "@/lib/portal/queries";
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_TYPES, DOCUMENT_VISIBILITY_LABEL, toneFor } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";

export const metadata = { title: "Documents - Admin Portal" };

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [docs, users] = await Promise.all([listAllDocuments(), listAllUsers()]);
  const targetUsers = users.filter((item) => ["client", "crew", "partner"].includes(item.role));
  return (
    <PortalShell role="admin" user={user}>
      {params.success === "uploaded" ? <Notice tone="success">Document uploaded and submitted for review.</Notice> : null}
      {params.success === "reviewed" ? <Notice tone="success">Document review saved.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Document name and file are required.</Notice> : null}
      {params.error === "upload" ? <Notice tone="danger">Upload failed. Use a PDF, JPG, or PNG under 50 MB.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Documents" description="Review uploaded client, crew, partner, and operations documents." />
      <SectionCard title="Upload Document" icon="fileText">
        <form action={uploadDocument} encType="multipart/form-data" className="grid gap-4 lg:grid-cols-4">
          <input type="hidden" name="back_to" value="/portal/admin/documents" />
          <TextField label="Document Name" name="name" required />
          <SelectField
            label="Target Profile"
            name="target_profile_id"
            defaultValue=""
            options={[{ value: "", label: "Admin-only document" }, ...targetUsers.map((profile) => ({ value: profile.id, label: `${profile.role}: ${profile.company_name ?? profile.full_name ?? profile.email}` }))]}
          />
          <SelectField label="Document Type" name="doc_type" defaultValue="Other" options={DOCUMENT_TYPES.map((type) => ({ value: type, label: type }))} />
          <TextField label="Expiration Date" name="expiration_date" type="date" />
          <div className="lg:col-span-3">
            <FileField label="File" name="file" accept=".pdf,.jpg,.jpeg,.png" required />
          </div>
          <div className="flex items-end">
            <SubmitButton className="rounded-full" pendingText="Uploading...">Upload Document</SubmitButton>
          </div>
        </form>
      </SectionCard>
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
            { header: "File", cell: (row) => <Link href={`/api/portal/documents/${row.id}/download`} className="text-accent hover:underline">Download</Link> },
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
