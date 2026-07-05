import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import {
  EmptyState,
  Notice,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { markInvoiceOverdue, sendInvoiceReminder } from "@/app/portal/actions/receivables";
import { AR_BUCKETS, getArSummary } from "@/lib/portal/receivables";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Receivables - AMG Operations" };
export const dynamic = "force-dynamic";

function bucketTone(bucket: string) {
  if (bucket === "current") return "success" as const;
  if (bucket === "1-30") return "warn" as const;
  return "danger" as const;
}

export default async function ReceivablesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const ar = await getArSummary();

  return (
    <PortalShell role="admin" user={user}>
      {params.success === "reminded" ? (
        <Notice tone="success">Reminder sent — the invoice email was re-issued and the client notified in-portal.</Notice>
      ) : null}
      {params.success === "overdue" ? <Notice tone="success">Invoice marked overdue.</Notice> : null}
      {params.error === "email" ? <Notice tone="danger">The reminder email could not be sent. Check email provider configuration.</Notice> : null}
      {params.error === "closed" ? <Notice tone="danger">That invoice is no longer open.</Notice> : null}
      {params.error === "recently-reminded" ? (
        <Notice tone="warn">A reminder already went out for that invoice in the last 24 hours — give the client time to respond.</Notice>
      ) : null}
      {params.error === "missing" ? <Notice tone="danger">Invoice could not be found.</Notice> : null}

      <PageHeader
        eyebrow="Finance"
        title="Receivables"
        description="Outstanding balances by age, collections queue, and one-click payment reminders."
        actions={
          <Link
            href="/portal/admin/invoices"
            className="rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-gold-line)] hover:bg-[var(--deck-gold-tint)]"
          >
            All invoices
          </Link>
        }
      />

      {/* Aging buckets */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Total outstanding"
          value={formatMoney(ar.totalOutstanding)}
          icon="wallet"
          tone={ar.totalOutstanding > 0 ? "accent" : "default"}
          detail={`${ar.invoices.length} open invoice${ar.invoices.length === 1 ? "" : "s"}`}
        />
        {AR_BUCKETS.map((bucket) => (
          <StatCard
            key={bucket.key}
            label={bucket.key === "current" ? "Not yet due" : `Overdue ${bucket.label}`}
            value={formatMoney(ar.bucketTotals[bucket.key])}
            tone={
              ar.bucketTotals[bucket.key] <= 0
                ? "default"
                : bucket.key === "current"
                  ? "info"
                  : bucket.key === "1-30"
                    ? "warn"
                    : "danger"
            }
          />
        ))}
      </div>

      {/* Collections queue */}
      <SectionCard
        title="Collections Queue"
        icon="alert"
        description="Open invoices ordered by due date. Remind re-sends the invoice email with PDF and notifies the client in-portal."
      >
        {ar.invoices.length === 0 ? (
          <EmptyState
            icon="check"
            title="Nothing outstanding"
            description="Every issued invoice is either paid or not yet sent."
          />
        ) : (
          <DataTable
            rows={ar.invoices}
            getKey={(row) => row.id}
            columns={[
              {
                header: "Invoice",
                priority: "primary",
                cell: (row) => (
                  <Link
                    href={`/portal/admin/invoices/${row.id}`}
                    className="deck-mono font-semibold text-[var(--deck-gold-deep)] hover:underline"
                  >
                    {row.invoice_number}
                  </Link>
                ),
              },
              {
                header: "Client",
                cell: (row) =>
                  row.client ? (
                    <Link
                      href={`/portal/admin/clients/${row.client.id}`}
                      className="hover:underline"
                    >
                      {row.client.company_name ?? row.client.full_name ?? row.client.email}
                    </Link>
                  ) : (
                    "—"
                  ),
              },
              { header: "Due", cell: (row) => formatDate(row.due_date) },
              {
                header: "Age",
                cell: (row) => (
                  <StatusBadge
                    label={row.bucket === "current" ? "Current" : `${row.daysOverdue}d overdue`}
                    tone={bucketTone(row.bucket)}
                  />
                ),
              },
              {
                header: "Status",
                cell: (row) => (
                  <StatusBadge
                    label={INVOICE_STATUS_LABEL[row.status] ?? row.status}
                    tone={toneFor(INVOICE_STATUS_TONE, row.status)}
                  />
                ),
              },
              {
                header: "Amount Due",
                align: "right",
                cell: (row) => (
                  <span className="deck-num font-bold">{formatMoney(row.amount_due)}</span>
                ),
              },
              {
                header: "Actions",
                align: "right",
                cell: (row) => (
                  <div data-portal-action-bar className="flex flex-wrap items-center justify-end gap-2">
                    {row.lastRemindedAt ? (
                      <span className="text-[0.66rem] text-[var(--deck-text-3)]">
                        Reminded {formatDate(row.lastRemindedAt)}
                      </span>
                    ) : null}
                    <form action={sendInvoiceReminder}>
                      <input type="hidden" name="invoice_id" value={row.id} />
                      <SubmitButton
                        size="sm"
                        variant="outline"
                        pendingText="Sending…"
                        confirm={`Re-send invoice ${row.invoice_number} to the client as a payment reminder?`}
                      >
                        Remind
                      </SubmitButton>
                    </form>
                    {row.status !== "overdue" && row.daysOverdue > 0 ? (
                      <form action={markInvoiceOverdue}>
                        <input type="hidden" name="invoice_id" value={row.id} />
                        <SubmitButton size="sm" variant="ghost" pendingText="…">
                          Mark overdue
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      {/* Per-client exposure */}
      <SectionCard title="Exposure by Client" icon="building" description="Who owes what, largest balance first.">
        {ar.byClient.length === 0 ? (
          <EmptyState icon="building" title="No client balances" />
        ) : (
          <DataTable
            rows={ar.byClient}
            getKey={(row) => row.clientId}
            getHref={(row) =>
              row.clientId !== "unassigned" ? `/portal/admin/clients/${row.clientId}` : undefined
            }
            columns={[
              { header: "Client", priority: "primary", cell: (row) => row.label },
              { header: "Open invoices", cell: (row) => row.count },
              {
                header: "Overdue",
                align: "right",
                cell: (row) =>
                  row.overdue > 0 ? (
                    <span className="deck-num font-semibold text-[var(--deck-danger)]">{formatMoney(row.overdue)}</span>
                  ) : (
                    "—"
                  ),
              },
              {
                header: "Outstanding",
                align: "right",
                cell: (row) => <span className="deck-num font-bold">{formatMoney(row.outstanding)}</span>,
              },
            ]}
          />
        )}
      </SectionCard>
    </PortalShell>
  );
}
