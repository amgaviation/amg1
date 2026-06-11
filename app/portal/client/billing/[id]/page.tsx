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

  return (
    <PortalShell role="client" user={user}>
      <PageHeader eyebrow="Billing" title={invoice.invoice_number} actions={<Link href="/portal/client/billing" className="text-xs text-muted-foreground hover:text-accent">Back to billing</Link>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
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
        <SectionCard title="Invoice Status" icon="wallet">
          <dl>
            <DetailRow label="Status"><StatusBadge label={INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status} tone={toneFor(INVOICE_STATUS_TONE, invoice.status)} /></DetailRow>
            <DetailRow label="Mission">{invoice.mission?.ref ?? "-"}</DetailRow>
            <DetailRow label="Quote">{invoice.quote?.ref ?? "-"}</DetailRow>
            <DetailRow label="Due">{formatDate(invoice.due_date)}</DetailRow>
            <DetailRow label="Total">{formatMoney(invoice.total)}</DetailRow>
            <DetailRow label="Paid">{formatMoney(invoice.amount_paid)}</DetailRow>
            <DetailRow label="Amount Due">{formatMoney(invoice.amount_due)}</DetailRow>
            <DetailRow label="Terms">{invoice.terms ?? "-"}</DetailRow>
          </dl>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
