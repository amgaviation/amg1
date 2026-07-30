import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatMoney } from "@/lib/portal/format";
import {
  DEMO_AR_OUTSTANDING,
  DEMO_AR_OVERDUE,
  DEMO_INVOICES,
  demoDate,
  type DemoInvoice,
} from "@/lib/demo/data";

export const metadata = { title: "Invoices - Demo Portal" };

function agingLabel(invoice: DemoInvoice): string {
  if (invoice.amountDue <= 0) return "Paid";
  if (invoice.dueInDays >= 0) return "Current";
  const overdue = -invoice.dueInDays;
  if (overdue <= 30) return "1-30 days";
  if (overdue <= 60) return "31-60 days";
  if (overdue <= 90) return "61-90 days";
  return "90+ days";
}

export default async function DemoInvoicesPage() {
  await requireRole("demo");

  const collected = DEMO_INVOICES.filter((invoice) => invoice.paidDaysAgo !== null).reduce(
    (sum, invoice) => sum + (invoice.total - invoice.amountDue),
    0
  );
  const overdueCount = DEMO_INVOICES.filter((invoice) => invoice.status === "overdue").length;

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Invoices & Receivables"
        description="Simulated billing ledger — issued invoices, collections progress, and aging across the sample client base."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Outstanding" icon="wallet" value={formatMoney(DEMO_AR_OUTSTANDING)} detail="Open balances across all invoices." tone="warn" />
        <StatCard label="Overdue" icon="alert" value={formatMoney(DEMO_AR_OVERDUE)} detail={`${overdueCount} invoices past their due date.`} tone="danger" />
        <StatCard label="Collected (30d)" icon="check" value={formatMoney(collected)} detail="Payments applied over the last month." />
        <StatCard label="Avg Days To Pay" icon="history" value="8.6" detail="Issue date to payment across recent invoices." />
      </div>

      <SectionCard title="Invoice Register" icon="wallet">
        <DataTable<DemoInvoice>
          rows={DEMO_INVOICES}
          getKey={(row) => row.id}
          columns={[
            { header: "Invoice", cell: (row) => <span className="deck-mono text-[var(--deck-accent-ink)]">{row.number}</span>, priority: "primary" },
            { header: "Client", cell: (row) => row.client, priority: "secondary" },
            { header: "Total", cell: (row) => formatMoney(row.total), align: "right" },
            {
              header: "Balance Due",
              cell: (row) =>
                row.amountDue > 0 ? (
                  <span className="font-medium text-[var(--deck-warn)]">{formatMoney(row.amountDue)}</span>
                ) : (
                  <span className="text-[var(--deck-text-3)]">—</span>
                ),
              align: "right",
            },
            {
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={INVOICE_STATUS_LABEL[row.status] ?? row.status}
                  tone={toneFor(INVOICE_STATUS_TONE, row.status)}
                />
              ),
              priority: "secondary",
            },
            { header: "Issued", cell: (row) => <LocalTime value={demoDate(-row.issuedDaysAgo)} mode="date" />, hideOnMobile: true },
            {
              header: "Due",
              cell: (row) => (
                <span className={row.dueInDays < 0 && row.amountDue > 0 ? "font-medium text-[var(--deck-danger)]" : undefined}>
                  <LocalTime value={demoDate(row.dueInDays)} mode="date" />
                </span>
              ),
              hideOnMobile: true,
            },
            { header: "Aging", cell: (row) => agingLabel(row), hideOnMobile: true },
          ]}
        />
      </SectionCard>
    </>
  );
}
