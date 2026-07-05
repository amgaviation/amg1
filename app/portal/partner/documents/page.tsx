import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { EmptyState, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextField } from "@/components/portal/ui/fields";
import { uploadDocument } from "@/app/portal/actions/documents";
import { listDocumentsForUser } from "@/lib/portal/queries";
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_TYPES, toneFor } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";

export const metadata = { title: "Documents - Partner Portal" };

export default async function PartnerDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("partner");
  const params = await searchParams;
  const docs = await listDocumentsForUser({ userId: user.id, role: user.role });
  return (
    <>
      {params.success === "uploaded" ? <Notice tone="success">Document uploaded and submitted for review.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Please provide a document name and file.</Notice> : null}
      {params.error === "terms" ? <Notice tone="danger">Confirm the document upload terms before uploading.</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before uploading.</Notice> : null}
      {params.error === "upload" ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "vendor", area: "documents", action: "upload", category: "upload_failed" })}</Notice> : null}
      {params.error && !["missing", "terms", "payment-data", "upload"].includes(params.error) ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "vendor", area: "vendor_portal", action: "update" })}</Notice> : null}
      <PageHeader eyebrow="Service Partner" title="Documents" description="Upload vendor agreements, insurance, airport permits, W-9s, and service documentation." />
      <SectionCard title="Upload Document" icon="fileText">
        <Notice tone="info">
          Upload only partner documents you are authorized to provide. Review the{" "}
          <Link href="/legal/document-upload-terms" className="font-semibold text-accent hover:underline">Document Upload Terms</Link>.
        </Notice>
        <form action={uploadDocument} encType="multipart/form-data">
          <input type="hidden" name="back_to" value="/portal/partner/documents" />
          <input type="hidden" name="scope_type" value="partner" />
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField label="Document Name" name="name" required />
            <SelectField label="Document Type" name="doc_type" required defaultValue="" placeholder="Select type..." options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))} />
            <TextField label="Expiration Date" name="expiration_date" type="date" />
          </div>
          <div className="mt-4">
            <input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png" className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-secondary/40 file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:border-accent" />
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
            <input name="document_terms_acknowledged" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--deck-gold)]" />
            <span>Upload only documents you are authorized to provide and do not include full card numbers, CVV codes, bank account numbers, routing numbers, or unrelated personal information.</span>
          </label>
          <div className="mt-4"><SubmitButton className="rounded-full" pendingText="Uploading...">Upload Document</SubmitButton></div>
        </form>
      </SectionCard>
      <SectionCard title="Partner Documents" icon="fileText">
        {docs.length === 0 ? <EmptyState icon="fileText" title="No documents uploaded" description="Upload partner compliance and service documents above." /> : (
          <div className="space-y-3">{docs.map((doc) => (
            <div key={doc.id} className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 sm:grid-cols-[1fr_auto_auto]">
              <div><p className="text-sm font-semibold">{doc.name}</p><p className="mt-1 text-xs text-muted-foreground">{doc.doc_type} | Uploaded {formatDate(doc.created_at)}</p></div>
              <StatusBadge label={DOCUMENT_STATUS_LABEL[doc.status] ?? doc.status} tone={toneFor(DOCUMENT_STATUS_TONE, doc.status)} />
              <Link href={`/portal/documents/${doc.id}/view`} className="text-sm text-accent hover:underline">View</Link>
            </div>
          ))}</div>
        )}
      </SectionCard>
    </>
  );
}
