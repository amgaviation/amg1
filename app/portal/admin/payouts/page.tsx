import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable, type Column } from "@/components/portal/ui/data-table";
import {
  EmptyState,
  Notice,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { setTaskStatus } from "@/app/portal/actions/tasks";
import {
  getPayoutSummary,
  isUnpaidVendorInvoiceStatus,
  PAYOUT_SLA_DAYS,
  PAYOUT_WARNING_DAYS,
  type PayoutBucket,
  type PayoutRow,
} from "@/lib/portal/payouts";
import {
  VENDOR_INVOICE_STATUS_LABEL,
  VENDOR_INVOICE_STATUS_TONE,
} from "@/lib/portal/vendor-invoices";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Payouts - AMG Operations" };
export const dynamic = "force-dynamic";

const BASE_PATH = "/portal/admin/payouts";

const BUCKET_SECTIONS: {
  key: PayoutBucket;
  title: string;
  icon: string;
  description: string;
  empty: string;
}[] = [
  {
    key: "overdue",
    title: "Overdue",
    icon: "alert",
    description: `Past the ${PAYOUT_SLA_DAYS}-day pilot-payment SLA — pay immediately.`,
    empty: "No payouts past their SLA.",
  },
  {
    key: "warning",
    title: `Due within ${PAYOUT_WARNING_DAYS} days`,
    icon: "clock",
    description: "At the +5-day mark — settle before the SLA lapses.",
    empty: "Nothing hitting the +5-day mark yet.",
  },
  {
    key: "due",
    title: "Upcoming",
    icon: "wallet",
    description: "Closed-out missions with the payment clock still running.",
    empty: "No upcoming payouts in flight.",
  },
];

function daysBadge(row: PayoutRow) {
  if (row.daysLeft === null) return <StatusBadge label="No due date" tone="neutral" />;
  if (row.bucket === "overdue")
    return <StatusBadge label={`${Math.abs(row.daysLeft)}d overdue`} tone="danger" />;
  if (row.bucket === "warning")
    return <StatusBadge label={`${row.daysLeft}d left`} tone="warn" />;
  return <StatusBadge label={`${row.daysLeft}d left`} tone="success" />;
}

const payoutColumns: Column<PayoutRow>[] = [
  {
    header: "Mission",
    priority: "primary",
    cell: (row) =>
      row.missionId ? (
        <Link
          href={`/portal/admin/trips/${row.missionId}`}
          className="deck-mono font-semibold text-[var(--deck-accent-ink)] hover:underline"
        >
          {row.missionRef ?? row.missionId}
        </Link>
      ) : (
        <span className="deck-mono">{row.missionRef ?? "—"}</span>
      ),
  },
  { header: "Crew", cell: (row) => row.crewName ?? "—" },
  { header: "Due", cell: (row) => formatDate(row.dueAt) },
  { header: "SLA", cell: (row) => daysBadge(row) },
  {
    header: "Vendor Invoice",
    cell: (row) =>
      row.vendorInvoice ? (
        <div className="flex flex-col gap-1">
          <span className="deck-num font-semibold">{formatMoney(row.vendorInvoice.total)}</span>
          <StatusBadge
            label={VENDOR_INVOICE_STATUS_LABEL[row.vendorInvoice.status] ?? row.vendorInvoice.status}
            tone={VENDOR_INVOICE_STATUS_TONE[row.vendorInvoice.status] ?? "neutral"}
          />
        </div>
      ) : (
        <span className="text-xs text-[var(--deck-text-3)]">Awaiting crew invoice</span>
      ),
  },
  {
    header: "Actions",
    align: "right",
    cell: (row) => (
      <div data-portal-action-bar className="flex flex-wrap items-center justify-end gap-2">
        {row.vendorInvoice ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/portal/admin/vendor-invoices?record=${row.vendorInvoice.id}`}>
              {isUnpaidVendorInvoiceStatus(row.vendorInvoice.status) ? "Mark paid" : "View invoice"}
            </Link>
          </Button>
        ) : null}
        <form action={setTaskStatus}>
          <input type="hidden" name="task_id" value={row.taskId} />
          <input type="hidden" name="status" value="done" />
          <input type="hidden" name="back_to" value={BASE_PATH} />
          <SubmitButton
            size="sm"
            variant="ghost"
            pendingText="…"
            confirm="Mark this payout task done? Do this once the pilot has been paid."
          >
            Mark done
          </SubmitButton>
        </form>
      </div>
    ),
  },
];

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireRolePermission("admin", "contractor_billing");
  const params = await searchParams;
  const summary = await getPayoutSummary();

  return (
    <>
      {params.success === "updated" ? (
        <Notice tone="success">Payout task updated.</Notice>
      ) : null}
      {params.error === "save" ? (
        <Notice tone="danger">That payout task could not be updated. Try again.</Notice>
      ) : null}

      <PageHeader
        eyebrow="Finance"
        title="Pilot Payouts"
        description={`Every closed-out mission opens a ${PAYOUT_SLA_DAYS}-day pilot-payment clock. Track the queue by SLA runway and settle from the crew's linked vendor invoice.`}
        actions={
          <Link
            href="/portal/admin/vendor-invoices"
            className="rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
          >
            Vendor invoices
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Open payouts"
          value={summary.openCount}
          icon="wallet"
          tone={summary.openCount > 0 ? "accent" : "default"}
          detail={`${summary.unmatchedCount} awaiting a crew invoice`}
        />
        <StatCard
          label="Due next 7 days"
          value={formatMoney(summary.dueNext7Total)}
          icon="dollar"
          tone={summary.dueNext7Total > 0 ? "accent" : "default"}
          detail={`across ${summary.dueNext7Missions} mission${summary.dueNext7Missions === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Overdue"
          value={summary.overdueCount}
          icon="alert"
          tone={summary.overdueCount > 0 ? "danger" : "default"}
        />
        <StatCard
          label={`Due within ${PAYOUT_WARNING_DAYS} days`}
          value={summary.warningCount}
          icon="clock"
          tone={summary.warningCount > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Matched outstanding"
          value={formatMoney(summary.matchedTotal)}
          icon="receipt"
          detail="Unpaid crew invoices on open payouts"
        />
      </div>

      {summary.openCount === 0 ? (
        <SectionCard title="Payout Queue" icon="wallet">
          <EmptyState
            icon="check"
            title="No open payouts"
            description="When a mission is marked completed, its pilot-payment tasks appear here bucketed by SLA runway."
          />
        </SectionCard>
      ) : (
        BUCKET_SECTIONS.map((section) => {
          const rows = summary.buckets[section.key];
          return (
            <SectionCard
              key={section.key}
              title={`${section.title} (${rows.length})`}
              icon={section.icon}
              description={section.description}
            >
              {rows.length === 0 ? (
                <EmptyState icon={section.icon} title={section.empty} />
              ) : (
                <DataTable rows={rows} getKey={(row) => row.taskId} columns={payoutColumns} />
              )}
            </SectionCard>
          );
        })
      )}
    </>
  );
}
