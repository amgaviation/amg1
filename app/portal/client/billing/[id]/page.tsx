import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { payInvoiceWithStripe } from "@/app/portal/actions/invoice-payments";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getInvoiceDetail } from "@/lib/portal/queries";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Invoice - Client Portal" };

export default async function ClientInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("client");
  const { id } = await params;
  const flash = await searchParams;
  const invoice = await getInvoiceDetail(id);
  if (!invoice || invoice.client_id !== user.id) notFound();
  const latestInvoiceDocument = invoice.documents[0];
  const receiptByPayment = new Map(
    invoice.receiptDocuments.map((document) => [document.payment_id, document]),
  );
  const canPay = ["sent", "viewed", "overdue", "partially_paid"].includes(invoice.status) && Number(invoice.amount_due ?? 0) > 0;

  return (
    <>
      {flash.success === "payment" ? (
        <Notice tone="success">Payment received. AMG is finalizing the invoice status. Refresh this page for the latest details.</Notice>
      ) : null}
      {flash.error === "configuration" ? <Notice tone="danger">Online card payment is not available right now. Use the payment instructions below or contact AMG Operations.</Notice> : null}
      {flash.error === "status" || flash.error === "amount" ? <Notice tone="danger">This invoice is not currently eligible for online card payment.</Notice> : null}
      <PageHeader
        eyebrow="Billing"
        title={invoice.invoice_number}
        actions={
          <div className="flex items-center gap-3">
            {latestInvoiceDocument ? (
              <Link
                href={`/portal/billing-documents/${latestInvoiceDocument.id}/view`}
                className="text-xs text-accent hover:underline"
              >
                View PDF
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
                      <Link href={`/portal/billing-documents/${document.id}/view`} className="text-accent hover:underline">
                        View
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
          {canPay ? (
            <form action={payInvoiceWithStripe} className="mt-5">
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <input type="hidden" name="return_to" value={`/portal/client/billing/${invoice.id}`} />
              <SubmitButton className="w-full" pendingText="Opening Stripe...">
                Pay Invoice
              </SubmitButton>
            </form>
          ) : invoice.status === "paid" ? (
            <p className="mt-4 rounded-md border border-border bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
              This invoice is paid{invoice.paid_at ? ` as of ${formatDate(invoice.paid_at)}` : ""}.
            </p>
          ) : (
            <p className="mt-4 rounded-md border border-border bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
              Online card payment is available after AMG issues an open invoice.
            </p>
          )}
        </SectionCard>
      </div>
    </>
  );
}
