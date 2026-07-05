import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { FileField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { reviewDocument } from "@/app/portal/actions/admin";
import { uploadDocument } from "@/app/portal/actions/documents";
import { listAllDocuments, listAllUsers } from "@/lib/portal/queries";
import { DOCUMENT_STATUS, DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_TYPES, DOCUMENT_VISIBILITY, DOCUMENT_VISIBILITY_LABEL, toneFor } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";

export const metadata = { title: "Documents - Admin Portal" };

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
    status?: string;
    visibility?: string;
    role?: string;
    owner?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const filters = {
    status: params.status || undefined,
    visibility: params.visibility || undefined,
    role: params.role || undefined,
    ownerId: params.owner || undefined,
    dateFrom: params.date_from || undefined,
    dateTo: params.date_to || undefined,
    search: params.search || undefined,
  };
  const [docs, users] = await Promise.all([listAllDocuments(filters), listAllUsers()]);
  const targetUsers = users.filter((item) => ["client", "crew", "partner"].includes(item.role));
  const profileById = new Map(users.map((profile) => [profile.id, profile]));
  const ownerLabel = (id: string | null) => {
    if (!id) return "Admin";
    const profile = profileById.get(id);
    return profile?.company_name ?? profile?.full_name ?? profile?.email ?? id;
  };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  return (
    <>
      {params.success === "uploaded" ? <Notice tone="success">Document uploaded and submitted for review.</Notice> : null}
      {params.success === "reviewed" ? <Notice tone="success">Document review saved.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Document name and file are required.</Notice> : null}
      {params.error === "terms" ? <Notice tone="danger">Confirm the document upload terms before uploading.</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before uploading.</Notice> : null}
      {params.error === "upload" ? <Notice tone="danger">Upload failed. Use a PDF, JPG, or PNG under 50 MB.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Documents" description="Review uploaded client, crew, partner, and operations documents." />
      <SectionCard title="Upload Document" icon="fileText">
        <Notice tone="info">
          Upload only documents AMG is authorized to store and review. Avoid full card, CVV, raw bank, unrelated medical,
          or unnecessary sensitive data. Review the{" "}
          <Link href="/legal/document-upload-terms" className="font-semibold text-accent hover:underline">Document Upload Terms</Link>.
        </Notice>
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
          <label className="lg:col-span-4 flex items-start gap-3 rounded-lg border border-border bg-[var(--deck-panel-2)] p-3 text-sm text-muted-foreground">
            <input name="document_terms_acknowledged" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--deck-gold)]" />
            <span>Upload only documents AMG is authorized to store and do not include full card numbers, CVV codes, bank account numbers, routing numbers, or unrelated personal information.</span>
          </label>
          <div className="flex items-end">
            <SubmitButton className="rounded-full" pendingText="Uploading...">Upload Document</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Review Filters" icon="settings">
        <form className="grid gap-4 lg:grid-cols-6">
          <TextField label="Search" name="search" defaultValue={params.search ?? ""} placeholder="Document name" />
          <SelectField
            label="Status"
            name="status"
            defaultValue={params.status ?? ""}
            options={[{ value: "", label: "All statuses" }, ...DOCUMENT_STATUS.map((status) => ({ value: status.value, label: status.label }))]}
          />
          <SelectField
            label="Visibility"
            name="visibility"
            defaultValue={params.visibility ?? ""}
            options={[{ value: "", label: "All visibility" }, ...DOCUMENT_VISIBILITY.map((visibility) => ({ value: visibility.value, label: visibility.label }))]}
          />
          <SelectField
            label="Role / Scope"
            name="role"
            defaultValue={params.role ?? ""}
            options={[
              { value: "", label: "All roles" },
              { value: "client", label: "Client" },
              { value: "crew", label: "Crew" },
              { value: "partner", label: "Partner" },
              { value: "mission", label: "Mission" },
              { value: "aircraft", label: "Aircraft" },
              { value: "profile", label: "Profile" },
            ]}
          />
          <SelectField
            label="Owner"
            name="owner"
            defaultValue={params.owner ?? ""}
            options={[{ value: "", label: "All owners" }, ...targetUsers.map((profile) => ({ value: profile.id, label: `${profile.role}: ${profile.company_name ?? profile.full_name ?? profile.email}` }))]}
          />
          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            <TextField label="From" name="date_from" type="date" defaultValue={params.date_from ?? ""} />
            <TextField label="To" name="date_to" type="date" defaultValue={params.date_to ?? ""} />
          </div>
          <div className="flex flex-wrap items-end gap-3 lg:col-span-4">
            <button type="submit" className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground">
              Apply Filters
            </button>
            {activeFilterCount ? (
              <Link href="/portal/admin/documents" className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:border-accent">
                Clear Filters
              </Link>
            ) : null}
            <p className="text-xs text-muted-foreground">{docs.length} document{docs.length === 1 ? "" : "s"} shown</p>
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
            { header: "Owner", cell: (row) => <div><p className="text-sm">{ownerLabel(row.scope_id)}</p><p className="text-xs text-muted-foreground">{row.scope_type}</p></div> },
            { header: "Visibility", cell: (row) => DOCUMENT_VISIBILITY_LABEL[row.visibility] ?? row.visibility },
            { header: "Uploaded", cell: (row) => formatDate(row.created_at) },
            { header: "Expires", cell: (row) => formatDate(row.expiration_date) },
            { header: "Status", cell: (row) => <StatusBadge label={DOCUMENT_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(DOCUMENT_STATUS_TONE, row.status)} /> },
            { header: "File", cell: (row) => <Link href={`/portal/documents/${row.id}/view`} className="text-accent hover:underline">View</Link> },
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
    </>
  );
}
