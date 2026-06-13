import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { listAllReceipts } from "@/lib/portal/queries";
import { formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Receipts - Admin Portal" };

export default async function AdminReceiptsPage() {
  const user = await requireRole("admin");
  const receipts = await listAllReceipts();

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Billing" title="Receipts" description="Generated receipt PDFs for partial and final invoice payments." />
      <SectionCard title="Receipt Ledger" icon="receipt">
        <DataTable
          rows={receipts}
          getKey={(row) => row.id}
          emptyLabel="No receipts generated."
          columns={[
            { header: "Receipt", cell: (row) => <span className="font-mono text-xs">{row.document_number}</span> },
            { header: "Invoice", cell: (row) => row.payment?.invoice ? <Link href={`/portal/admin/invoices/${row.payment.invoice.id}`} className="font-mono text-xs text-accent hover:underline">{row.payment.invoice.invoice_number}</Link> : "-" },
            { header: "Client", cell: (row) => row.payment?.invoice?.client?.company_name ?? row.payment?.invoice?.client?.full_name ?? row.payment?.invoice?.client?.email ?? "-" },
            { header: "Amount", cell: (row) => formatMoney(row.payment?.amount ?? 0), align: "right" },
            { header: "Method", cell: (row) => row.payment?.payment_method ?? "-" },
            { header: "Generated", cell: (row) => formatDateTime(row.created_at) },
            { header: "Sent", cell: (row) => formatDateTime(row.emailed_at) },
            { header: "Recipients", cell: (row) => row.emailed_to?.join(", ") || "-" },
            { header: "PDF", cell: (row) => <Link href={`/api/portal/billing-documents/${row.id}/download`} className="text-accent hover:underline">Download</Link> },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
