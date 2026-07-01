import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllPayments } from "@/lib/portal/queries";
import { formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Payments - Admin Portal" };

export default async function AdminPaymentsPage() {
  const user = await requireRole("admin");
  const payments = await listAllPayments();

  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Billing" title="Payments" description="Payment ledger for invoice settlement and receipt tracking." />
      <SectionCard title="Payment Ledger" icon="wallet">
        <DataTable
          rows={payments}
          getKey={(row) => row.id}
          emptyLabel="No payments recorded."
          columns={[
            { header: "Payment Date", cell: (row) => formatDateTime(row.paid_at) },
            { header: "Client", cell: (row) => row.invoice?.client?.company_name ?? row.invoice?.client?.full_name ?? row.invoice?.client?.email ?? "-" },
            { header: "Invoice", cell: (row) => row.invoice ? <Link href={`/portal/admin/invoices/${row.invoice.id}`} className="font-mono text-xs text-accent hover:underline">{row.invoice.invoice_number}</Link> : "-" },
            { header: "Receipt", cell: (row) => (row as any).receipt_number ?? "-" },
            { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
            { header: "Method", cell: (row) => row.payment_method ?? "-" },
            { header: "Reference", cell: (row) => (row as any).payment_reference ?? row.provider_payment_id ?? "-" },
            { header: "Recorded By", cell: (row) => row.recorded_by_profile?.full_name ?? row.recorded_by_profile?.email ?? "-" },
            { header: "Status", cell: (row) => <StatusBadge label={row.status} tone="success" /> },
            {
              header: "Receipt PDF",
              cell: (row) => row.receipt_document ? <Link href={`/portal/billing-documents/${row.receipt_document.id}/view`} className="text-accent hover:underline">View</Link> : "-",
            },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
