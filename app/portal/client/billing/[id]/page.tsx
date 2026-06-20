import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { getInvoiceDetail } from "@/lib/portal/queries";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Invoice - Client Portal" };

export default async function ClientInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("client");
  const { id } = await params;
  const invoice = await getInvoiceDetail(id);
  if (!invoice || invoice.client_id !== user.id) notFound();
  const latestInvoiceDocument = invoice.documents[0];
  const receiptByPayment = new Map(
    invoice.receiptDocuments.map((document) => [document.payment_id, document]),
  );

  return (
    <PortalShell role="client" user={user}>
      <PageHeader
        eyebrow="Billing"
        title={invoice.invoice_number}
        actions={
          <div className="flex items-center gap-3">
            {latestInvoiceDocument ? (
              <Link
                href={`/api/portal/billing-documents/${latestInvoiceDocument.id}/download`}
                className="text-xs text-accent hover:underline"
              >
                Download PDF
              </Link>
            ) : null}
            <Link href="/portal/client/billing" className="text-xs text-muted-foreground hover:text-accent">Back to billing</Link>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <SectionCard title="Line Items" icon="receipt">
            <DataTable
              rows={invoice.items}
              getKey={(row) => row.id}
              emptyLabel="No line items."
              columns={[
                { header: "Category", cell: (row) => row.category },
                { header: "Description", cell: (row) => row.description ?? "-" },
                { header: "Qty", cell: (row) => row.quantity, align: "right" },
                { header: "Unit", cell: (row) => formatMoney(row.unit_price), align: "right" },
                { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Receipts" icon="wallet">
            <DataTable
              rows={invoice.payments}
              getKey={(row) => row.id}
              emptyLabel="No receipts available yet."
              columns={[
                { header: "Date", cell: (row) => formatDate(row.paid_at) },
                { header: "Method", cell: (row) => row.payment_method ?? "-" },
                { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
                {
                  header: "Receipt",
                  cell: (row) => {
                    const document = receiptByPayment.get(row.id);
                    return document ? (
                      <Link href={`/api/portal/billing-documents/${document.id}/download`} className="text-accent hover:underline">
                        Download
                      </Link>
                    ) : "-";
                  },
                },
              ]}
            />
          </SectionCard>
        </div>
        <SectionCard title="Invoice Status" icon="wallet">
          <dl>
            <DetailRow label="Status"><StatusBadge label={INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status} tone={toneFor(INVOICE_STATUS_TONE, invoice.status)} /></DetailRow>
            <DetailRow label="Mission">{invoice.mission?.ref ?? "-"}</DetailRow>
            <DetailRow label="Quote">{invoice.quote?.ref ?? "-"}</DetailRow>
            <DetailRow label="Due">{formatDate(invoice.due_date)}</DetailRow>
            <DetailRow label="Total">{formatMoney(invoice.total)}</DetailRow>
            <DetailRow label="Deposit">{formatMoney((invoice as any).deposit_amount ?? 0)}</DetailRow>
            <DetailRow label="Paid">{formatMoney(invoice.amount_paid)}</DetailRow>
            <DetailRow label="Amount Due">{formatMoney(invoice.amount_due)}</DetailRow>
            <DetailRow label="Terms">{invoice.terms ?? "-"}</DetailRow>
            <DetailRow label="Payment Instructions">{(invoice as any).payment_instructions ?? "-"}</DetailRow>
          </dl>
          <p className="mt-4 rounded-md border border-border bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
            AMG does not process payment card or bank account payments through this website or portal. Use only the
            payment instructions provided by AMG or contact AMG for additional payment coordination.
          </p>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
