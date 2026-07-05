import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listInvoicesForClient } from "@/lib/portal/queries";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Billing - Client Portal" };

function daysOverdue(due: string | null): number {
  if (!due) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(due).getTime()) / 86_400_000));
}

export default async function ClientBillingPage() {
  const user = await requireRole("client");
  const invoices = await listInvoicesForClient(user.id);
  const open = invoices.filter((invoice) => ["sent", "viewed", "partially_paid", "overdue"].includes(invoice.status));
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const amountDue = open.reduce((sum, invoice) => sum + Number(invoice.amount_due ?? 0), 0);
  const overdueAmount = open
    .filter((invoice) => daysOverdue(invoice.due_date) > 0)
    .reduce((sum, invoice) => sum + Number(invoice.amount_due ?? 0), 0);
  const nextDue = open
    .filter((invoice) => invoice.due_date && daysOverdue(invoice.due_date) === 0)
    .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0];
  const lifetime = paid.reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Owner Services" title="Billing" description="Your account statement at a glance — open balances, due dates, and every issued invoice with its payment status." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Balance due"
          value={formatMoney(amountDue)}
          icon="wallet"
          tone={overdueAmount > 0 ? "danger" : amountDue > 0 ? "warn" : "default"}
          detail={
            overdueAmount > 0
              ? `${formatMoney(overdueAmount)} past due`
              : amountDue > 0
                ? "All open invoices current"
                : "Nothing outstanding"
          }
        />
        <StatCard
          label="Next payment due"
          value={nextDue?.due_date ? formatDate(nextDue.due_date) : "—"}
          icon="calendar"
          detail={nextDue ? `${nextDue.invoice_number} · ${formatMoney(nextDue.amount_due)}` : "No upcoming due dates"}
        />
        <StatCard label="Open invoices" value={open.length} icon="receipt" tone={open.length ? "warn" : "default"} />
        <StatCard label="Paid invoices" value={paid.length} icon="check" />
        <StatCard label="Lifetime billed & paid" value={formatMoney(lifetime)} icon="dollar" tone={lifetime > 0 ? "accent" : "default"} />
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
              { header: "Invoice", priority: "primary", cell: (row) => <span className="font-mono text-xs text-accent">{row.invoice_number}</span> },
              { header: "Mission", cell: (row) => row.mission?.ref ?? "—" },
              { header: "Quote", cell: (row) => row.quote?.ref ?? "—" },
              {
                header: "Due Date",
                cell: (row) => {
                  const overdue =
                    ["sent", "viewed", "partially_paid", "overdue"].includes(row.status) &&
                    daysOverdue(row.due_date) > 0;
                  return overdue ? (
                    <span className="font-semibold text-[var(--deck-danger)]">
                      {formatDate(row.due_date)} · {daysOverdue(row.due_date)}d overdue
                    </span>
                  ) : (
                    formatDate(row.due_date)
                  );
                },
              },
              { header: "Total", cell: (row) => formatMoney(row.total), align: "right" },
              { header: "Amount Due", cell: (row) => formatMoney(row.amount_due), align: "right" },
              { header: "Status", cell: (row) => <StatusBadge label={INVOICE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(INVOICE_STATUS_TONE, row.status)} /> },
            ]}
          />
        )}
      </SectionCard>
    </>
  );
}
