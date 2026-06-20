import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, Notice, PageHeader, SectionCard, Timeline } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { createInvoiceRevision, previewInvoicePdf, recordInvoicePayment, sendInvoicePdf, updateInvoiceStatus } from "@/app/portal/actions/invoices";
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
  const editableInvoice = ["draft", "ready_to_send"].includes(invoice.status);
  const lockedInvoice = ["paid", "void", "written_off"].includes(invoice.status);
  const canRevise = !editableInvoice && !lockedInvoice;
  const activityItems = [
    ...invoice.documents.map((document) => ({
      at: document.created_at,
      title: `${document.document_number} generated`,
      body: document.emailed_at
        ? `Sent to ${document.emailed_to?.join(", ") || "recipient"}`
        : "Invoice PDF generated and stored.",
    })),
    ...invoice.receiptDocuments.map((document) => ({
      at: document.created_at,
      title: `${document.document_number} receipt generated`,
      body: document.emailed_at
        ? `Receipt sent to ${document.emailed_to?.join(", ") || "recipient"}`
        : "Receipt PDF generated and stored.",
    })),
    ...invoice.payments.map((payment) => ({
      at: payment.paid_at ?? payment.created_at,
      title: `Payment recorded: ${formatMoney(payment.amount)}`,
      body: [payment.payment_method, (payment as any).payment_reference].filter(Boolean).join(" / ") || undefined,
    })),
    ...invoice.auditEvents.map((event) => ({
      at: event.created_at,
      title: event.action.replace(/_/g, " "),
      body: event.detail ?? event.actor_email ?? undefined,
    })),
  ]
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())
    .slice(0, 14)
    .map((item) => ({
      title: item.title,
      meta: formatDateTime(item.at),
      body: item.body,
    }));

  return (
    <PortalShell role="admin" user={user}>
      {flash.success ? <Notice tone="success">Invoice updated.</Notice> : null}
      {flash.error === "duplicate" ? <Notice tone="danger">This quote already has an active invoice.</Notice> : null}
      {flash.error === "payment-required" ? <Notice tone="danger">Record a payment to mark this invoice paid.</Notice> : null}
      {flash.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before recording payment details.</Notice> : null}
      {flash.error === "locked" ? <Notice tone="danger">This invoice is locked because it is paid, void, or written off.</Notice> : null}
      {flash.error === "revision" ? <Notice tone="danger">An invoice revision could not be created.</Notice> : null}
      <PageHeader
        eyebrow="Invoice"
        title={invoice.invoice_number}
        actions={
          <div className="flex items-center gap-3">
            {editableInvoice ? (
              <Link href={`/portal/admin/invoices/${invoice.id}/edit`} className="text-xs text-accent hover:underline">
                Edit Draft
              </Link>
            ) : null}
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

          <SectionCard title="Activity Timeline" icon="history">
            {activityItems.length ? (
              <Timeline items={activityItems} />
            ) : (
              <p className="text-sm text-muted-foreground">No invoice activity recorded yet.</p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Invoice PDF" icon="fileText">
            <div className="space-y-3">
              <form action={previewInvoicePdf}>
                <input type="hidden" name="invoice_id" value={invoice.id} />
                <SubmitButton className="w-full rounded-full" pendingText="Generating...">Preview PDF</SubmitButton>
              </form>
              {!lockedInvoice ? (
                <form action={sendInvoicePdf}>
                  <input type="hidden" name="invoice_id" value={invoice.id} />
                  <SubmitButton className="w-full rounded-full" pendingText="Sending...">Send / Resend PDF</SubmitButton>
                </form>
              ) : null}
              {canRevise ? (
                <form action={createInvoiceRevision} className="space-y-3 rounded-md border border-border p-3">
                  <input type="hidden" name="invoice_id" value={invoice.id} />
                  <TextAreaField label="Revision Reason" name="revision_reason" placeholder="Updated services, corrected vendor cost, changed tax, or adjusted billing details..." />
                  <SubmitButton className="w-full rounded-full" pendingText="Creating...">Create Revision Draft</SubmitButton>
                </form>
              ) : null}
            </div>
          </SectionCard>

          {!lockedInvoice ? (
            <SectionCard title="Update Status" icon="settings">
              <form action={updateInvoiceStatus} className="space-y-4">
                <input type="hidden" name="invoice_id" value={invoice.id} />
                <SelectField label="Status" name="status" defaultValue={invoice.status} options={INVOICE_STATUS.filter((status) => status.value !== "paid").map((status) => ({ value: status.value, label: status.label }))} />
                <TextAreaField label="Internal Notes" name="internal_notes" defaultValue={invoice.internal_notes ?? ""} />
                <SubmitButton className="rounded-full" pendingText="Saving...">Save Status</SubmitButton>
              </form>
            </SectionCard>
          ) : null}

          {!lockedInvoice ? (
            <SectionCard title="Record Payment" icon="wallet">
              <Notice tone="info">
                Record payment status only. Do not enter full card numbers, CVV codes, bank account numbers, or routing
                numbers. AMG does not process payment card or bank account payments through this portal.
              </Notice>
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
          ) : null}
        </div>
      </div>
    </PortalShell>
  );
}
