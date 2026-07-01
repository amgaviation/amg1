import { notFound } from "next/navigation";
import { requireUser } from "@/lib/portal/session";
import { isAdminRole } from "@/lib/portal/constants";
import { createServiceClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PortalDocumentViewer } from "@/components/portal/document-viewer";

export default async function SubscriptionInvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = (await createServiceClient()) as any;
  const { data: invoice } = await db
    .from("subscription_billing_invoices")
    .select("id, client_id, stripe_invoice_number, invoice_pdf_url, hosted_invoice_url")
    .eq("id", id)
    .maybeSingle();
  if (!invoice?.invoice_pdf_url) notFound();
  if (!isAdminRole(user.role) && invoice.client_id !== user.id) notFound();

  return (
    <PortalShell role={isAdminRole(user.role) ? "admin" : user.role} user={user}>
      <PortalDocumentViewer
        title={invoice.stripe_invoice_number ?? "Subscription invoice"}
        description="Subscription billing PDF"
        contentHref={invoice.invoice_pdf_url}
        downloadHref={invoice.invoice_pdf_url}
        backHref={isAdminRole(user.role) ? "/portal/admin/subscriptions" : "/portal/client/subscriptions"}
        contentType="application/pdf"
      />
    </PortalShell>
  );
}
