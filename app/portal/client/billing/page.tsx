import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listInvoicesForClient } from "@/lib/portal/queries";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Billing - Client Portal" };

export default async function ClientBillingPage() {
  const user = await requireRole("client");
  const invoices = await listInvoicesForClient(user.id);
  const open = invoices.filter((invoice) => ["sent", "viewed", "partially_paid", "overdue"].includes(invoice.status));
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const amountDue = open.reduce((sum, invoice) => sum + Number(invoice.amount_due ?? 0), 0);

  return (
    <PortalShell role="client" user={user}>
      <PageHeader eyebrow="Owner Services" title="Billing" description="Review issued invoices, payment status, linked quotes, and mission billing context." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open invoices" value={open.length} tone={open.length ? "warn" : "default"} />
        <StatCard label="Paid invoices" value={paid.length} />
        <StatCard label="Amount due" value={formatMoney(amountDue)} tone={amountDue > 0 ? "accent" : "default"} />
      </div>

      <SectionCard title="Invoices" icon="wallet">
        {invoices.length === 0 ? (
          <EmptyState icon="wallet" title="No invoices" description="Issued invoices will appear here after AMG Operations releases them." />
        ) : (
          <DataTable
            rows={invoices}
            getKey={(row) => row.id}
            getHref={(row) => `/portal/client/billing/${row.id}`}
            columns={[
              { header: "Invoice", cell: (row) => <span className="font-mono text-xs text-accent">{row.invoice_number}</span> },
              { header: "Mission", cell: (row) => row.mission?.ref ?? "-" },
              { header: "Quote", cell: (row) => row.quote?.ref ?? "-" },
              { header: "Due Date", cell: (row) => formatDate(row.due_date) },
              { header: "Total", cell: (row) => formatMoney(row.total), align: "right" },
              { header: "Amount Due", cell: (row) => formatMoney(row.amount_due), align: "right" },
              { header: "Status", cell: (row) => <StatusBadge label={INVOICE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(INVOICE_STATUS_TONE, row.status)} /> },
            ]}
          />
        )}
      </SectionCard>
    </PortalShell>
  );
}
