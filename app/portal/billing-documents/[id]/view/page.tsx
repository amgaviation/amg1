import { notFound } from "next/navigation";
import { requireUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";
import { createServiceClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PortalDocumentViewer } from "@/components/portal/document-viewer";

export default async function BillingDocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = (await createServiceClient()) as any;
  const { data: document } = await db.from("billing_documents").select("*").eq("id", id).maybeSingle();
  if (!document) notFound();
  if (!isAdminRole(user.role) && document.client_id !== user.id) notFound();

  const backHref = isAdminRole(user.role)
    ? document.invoice_id
      ? `/portal/admin/invoices/${document.invoice_id}`
      : document.quote_id
        ? `/portal/admin/quotes/${document.quote_id}`
        : "/portal/admin/receipts"
    : document.invoice_id
      ? `/portal/client/billing/${document.invoice_id}`
      : document.quote_id
        ? `/portal/client/quotes/${document.quote_id}`
        : "/portal/client/billing";

  return (
    <PortalShell role={isAdminRole(user.role) ? "admin" : user.role} user={user}>
      <PortalDocumentViewer
        title={document.file_name ?? `${document.document_number}.pdf`}
        description={`${document.document_type} ${document.document_number}`}
        contentHref={`/api/portal/billing-documents/${id}/content`}
        downloadHref={`/api/portal/billing-documents/${id}/download`}
        backHref={backHref}
        contentType="application/pdf"
      />
    </PortalShell>
  );
}
