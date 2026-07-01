import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextField } from "@/components/portal/ui/fields";
import { uploadDocument } from "@/app/portal/actions/documents";
import { listDocumentsForUser } from "@/lib/portal/queries";
import { DOCUMENT_STATUS_LABEL, DOCUMENT_STATUS_TONE, DOCUMENT_TYPES, toneFor } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";
import { getUserFacingErrorMessage } from "@/lib/errors/user-facing-errors";

export const metadata = { title: "Documents — Client Portal" };

export default async function ClientDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; upload?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const docs = await listDocumentsForUser({ userId: user.id, role: user.role });

  return (
    <PortalShell role="client" user={user}>
      {params.success === "uploaded" ? <Notice tone="success">Document uploaded and submitted for review.</Notice> : null}
      {params.error === "missing" ? <Notice tone="danger">Please provide a document name, type, and file.</Notice> : null}
      {params.error === "terms" ? <Notice tone="danger">Confirm the document upload terms before uploading.</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before uploading.</Notice> : null}
      {params.error === "upload" ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "client", area: "documents", action: "upload", category: "upload_failed" })}</Notice> : null}
      {params.error && !["missing", "terms", "payment-data", "upload"].includes(params.error) ? <Notice tone="danger">{getUserFacingErrorMessage({ audience: "client", area: "documents", action: "load" })}</Notice> : null}

      <PageHeader eyebrow="Owner Services" title="Aircraft Documents" description="Upload and manage aircraft, owner, and mission documents." />

      <SectionCard title="Upload Document" icon="fileText">
        <Notice tone="info">
          Upload only documents you are authorized to provide and avoid unnecessary sensitive data. Review the{" "}
          <Link href="/legal/document-upload-terms" className="font-semibold text-accent hover:underline">Document Upload Terms</Link>.
        </Notice>
        <form action={uploadDocument} encType="multipart/form-data">
          <input type="hidden" name="back_to" value="/portal/client/documents" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TextField label="Document Name" name="name" required placeholder="N721AG Insurance Certificate" />
            <SelectField
              label="Document Type"
              name="doc_type"
              required
              defaultValue=""
              placeholder="Select type…"
              options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <TextField label="Expiration Date (if applicable)" name="expiration_date" type="date" />
          </div>
          <div className="mt-4">
            <label className="grid gap-2">
              <span className="eyebrow text-[0.6rem] text-muted-foreground">File <span className="text-accent">*</span></span>
              <input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png" className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-secondary/40 file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:border-accent" />
            </label>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
            <input name="document_terms_acknowledged" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-accent" />
            <span>Upload only documents you are authorized to provide and do not include full card numbers, CVV codes, bank account numbers, routing numbers, or unrelated personal information.</span>
          </label>
          <div className="mt-4">
            <SubmitButton className="rounded-full" pendingText="Uploading…">Upload Document</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="My Documents" icon="fileText">
        {docs.length === 0 ? (
          <EmptyState icon="fileText" title="No documents uploaded" description="Upload aircraft, insurance, or owner documents above." />
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 sm:grid-cols-[1fr_auto_auto_auto]">
                <div>
                  <p className="text-sm font-semibold">{doc.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{doc.doc_type} · Uploaded {formatDate(doc.created_at)}</p>
                  {doc.expiration_date ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">Expires {formatDate(doc.expiration_date)}</p>
                  ) : null}
                </div>
                <StatusBadge label={DOCUMENT_STATUS_LABEL[doc.status] ?? doc.status} tone={toneFor(DOCUMENT_STATUS_TONE, doc.status)} />
                <Link href={`/portal/documents/${doc.id}/view`} className="text-sm text-accent hover:underline">View</Link>
                {doc.review_notes ? (
                  <p className="text-xs text-amber-300">{doc.review_notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
