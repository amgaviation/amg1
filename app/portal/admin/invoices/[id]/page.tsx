import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { recordInvoicePayment, updateInvoiceStatus } from "@/app/portal/actions/invoices";
import { getInvoiceDetail } from "@/lib/portal/queries";
import { INVOICE_STATUS, INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, PAYMENT_METHODS, toneFor } from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Invoice Detail - Admin Portal" };

export default async function AdminInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const { id } = await params;
  const flash = await searchParams;
  const invoice = await getInvoiceDetail(id);
  if (!invoice) notFound();
  const latestInvoiceDocument = invoice.documents[0];
  const receiptByPayment = new Map(
    invoice.receiptDocuments.map((document) => [document.payment_id, document]),
  );

  return (
    <PortalShell role="admin" user={user}>
      {flash.success ? <Notice tone="success">Invoice updated.</Notice> : null}
      {flash.error === "duplicate" ? <Notice tone="danger">This quote already has an active invoice.</Notice> : null}
      {flash.error === "payment-required" ? <Notice tone="danger">Record a payment to mark this invoice paid.</Notice> : null}
      {flash.error === "locked" ? <Notice tone="danger">This invoice is locked because it is paid, void, or written off.</Notice> : null}
      <PageHeader
        eyebrow="Invoice"
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
            <Link href="/portal/admin/invoices" className="text-xs text-muted-foreground hover:text-accent">Back to invoices</Link>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <SectionCard title="Invoice Summary" icon="wallet">
            <dl>
              <DetailRow label="Status"><StatusBadge label={INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status} tone={toneFor(INVOICE_STATUS_TONE, invoice.status)} /></DetailRow>
              <DetailRow label="Client">{invoice.client?.company_name ?? invoice.client?.full_name ?? invoice.client?.email ?? "-"}</DetailRow>
              <DetailRow label="Mission">{invoice.mission?.ref ?? "-"}</DetailRow>
              <DetailRow label="Quote">{invoice.quote?.ref ?? "-"}</DetailRow>
              <DetailRow label="Issued">{formatDateTime(invoice.issued_at)}</DetailRow>
              <DetailRow label="Due">{formatDate(invoice.due_date)}</DetailRow>
              <DetailRow label="Total">{formatMoney(invoice.total)}</DetailRow>
              <DetailRow label="Discount">{formatMoney((invoice as any).discount_total ?? invoice.discount)}</DetailRow>
              <DetailRow label="Tax">{formatMoney((invoice as any).tax_total ?? invoice.tax)}</DetailRow>
              <DetailRow label="Deposit">{formatMoney((invoice as any).deposit_amount ?? 0)}</DetailRow>
              <DetailRow label="Paid">{formatMoney(invoice.amount_paid)}</DetailRow>
              <DetailRow label="Amount Due">{formatMoney(invoice.amount_due)}</DetailRow>
              <DetailRow label="Terms">{invoice.terms ?? "-"}</DetailRow>
              <DetailRow label="Payment Instructions">{(invoice as any).payment_instructions ?? "-"}</DetailRow>
            </dl>
          </SectionCard>

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

          <SectionCard title="Payments" icon="wallet">
            <DataTable
              rows={invoice.payments}
              getKey={(row) => row.id}
              emptyLabel="No payments recorded."
              columns={[
                { header: "Date", cell: (row) => formatDateTime(row.paid_at) },
                { header: "Method", cell: (row) => row.payment_method ?? "-" },
                { header: "Reference", cell: (row) => (row as any).payment_reference ?? "-" },
                { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
                {
                  header: "Receipt",
                  cell: (row) => {
                    const document = receiptByPayment.get(row.id);
                    return document ? (
                      <Link href={`/api/portal/billing-documents/${document.id}/download`} className="text-accent hover:underline">
                        PDF
                      </Link>
                    ) : "-";
                  },
                },
              ]}
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Update Status" icon="settings">
            <form action={updateInvoiceStatus} className="space-y-4">
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <SelectField label="Status" name="status" defaultValue={invoice.status} options={INVOICE_STATUS.filter((status) => status.value !== "paid").map((status) => ({ value: status.value, label: status.label }))} />
              <TextAreaField label="Internal Notes" name="internal_notes" defaultValue={invoice.internal_notes ?? ""} />
              <SubmitButton className="rounded-full" pendingText="Saving...">Save Status</SubmitButton>
            </form>
          </SectionCard>

          <SectionCard title="Record Payment" icon="wallet">
            <form action={recordInvoicePayment} className="space-y-4">
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <TextField label="Amount" name="amount" type="number" min="0" step="0.01" defaultValue={String(invoice.amount_due)} required />
              <SelectField label="Payment Method" name="payment_method" defaultValue="wire" options={PAYMENT_METHODS} />
              <TextField label="Payment Reference" name="payment_reference" placeholder="Trace, check, wire, or note..." />
              <TextAreaField label="Notes" name="notes" />
              <TextAreaField label="Internal Notes" name="internal_notes" />
              <CheckboxField label="Email receipt now" name="send_receipt" defaultChecked />
              <SubmitButton className="rounded-full" pendingText="Recording...">Record Payment / Mark Paid</SubmitButton>
            </form>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
