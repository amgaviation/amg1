import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { getSubscriptionDetail } from "@/lib/portal/queries";
import { SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE, SUBSCRIPTION_USAGE_TYPE_LABEL, toneFor } from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Subscription Detail - Client Portal" };

export default async function ClientSubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("client");
  const { id } = await params;
  const subscription = await getSubscriptionDetail(id);
  if (!subscription) notFound();
  if (subscription.client_id !== user.id) redirect("/access-denied");

  const usageTotals = subscription.usage.reduce(
    (totals, event) => ({
      quantity: totals.quantity + Number(event.quantity ?? 0),
      overage: totals.overage + Number(event.overage_amount ?? 0),
    }),
    { quantity: 0, overage: 0 },
  );

  return (
    <PortalShell role="client" user={user}>
      <PageHeader
        eyebrow="Subscription"
        title={subscription.plan?.name ?? "AMG Support Subscription"}
        description={subscription.tier?.name ?? "Custom support program"}
        actions={<Link href="/portal/client/subscriptions" className="text-xs text-muted-foreground hover:text-accent">Back to subscriptions</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Status" value={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} />
        <StatCard label="Usage Units" value={usageTotals.quantity} />
        <StatCard label="Overages" value={formatMoney(usageTotals.overage)} tone={usageTotals.overage > 0 ? "warn" : "default"} />
        <StatCard label="Credits" value={formatMoney(subscription.credit_balance)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <SectionCard title="Program Details" icon="clipboard">
          <dl>
            <DetailRow label="Status"><StatusBadge label={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} tone={toneFor(SUBSCRIPTION_STATUS_TONE, subscription.status)} /></DetailRow>
            <DetailRow label="Aircraft">{subscription.aircraft?.tail_number ?? "Account-level"}</DetailRow>
            <DetailRow label="Cadence">{subscription.billing_cadence}</DetailRow>
            <DetailRow label="Start">{formatDate(subscription.start_date)}</DetailRow>
            <DetailRow label="Renewal">{formatDate(subscription.renewal_date)}</DetailRow>
            <DetailRow label="Included">{`${subscription.included_flights} flights / ${subscription.included_mx_repositions} MX repositions / ${subscription.included_admin_hours} admin hrs`}</DetailRow>
            <DetailRow label="Credit Balance">{formatMoney(subscription.credit_balance)}</DetailRow>
          </dl>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Usage" icon="history">
            <DataTable
              rows={subscription.usage}
              getKey={(row) => row.id}
              emptyLabel="No subscription usage has been recorded."
              columns={[
                { header: "Date", cell: (row) => formatDateTime(row.created_at) },
                { header: "Type", cell: (row) => SUBSCRIPTION_USAGE_TYPE_LABEL[row.usage_type] ?? row.usage_type },
                { header: "Mission", cell: (row) => row.mission?.ref ?? "-" },
                { header: "Qty", cell: (row) => `${row.quantity} ${row.unit ?? ""}`.trim(), align: "right" },
                { header: "Covered", cell: (row) => row.covered_quantity, align: "right" },
                { header: "Overage", cell: (row) => formatMoney(row.overage_amount), align: "right" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Credits" icon="wallet">
            <DataTable
              rows={subscription.credits}
              getKey={(row) => row.id}
              emptyLabel="No credits have been recorded."
              columns={[
                { header: "Date", cell: (row) => formatDateTime(row.created_at) },
                { header: "Source", cell: (row) => row.source_type.replace(/_/g, " ") },
                { header: "Description", cell: (row) => row.description ?? "-" },
                { header: "Expires", cell: (row) => formatDate(row.expires_at) },
                { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
              ]}
            />
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
