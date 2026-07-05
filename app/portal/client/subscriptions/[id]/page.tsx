import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { manageSubscriptionBilling } from "@/app/portal/actions/subscriptions";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, Notice, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getSubscriptionDetail } from "@/lib/portal/queries";
import { SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE, SUBSCRIPTION_USAGE_TYPE_LABEL, toneFor } from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Subscription Detail - Client Portal" };

export default async function ClientSubscriptionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("client");
  const { id } = await params;
  const flash = await searchParams;
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
    <>
      {flash.success === "checkout" ? <Notice tone="success">Subscription setup was completed. AMG is finalizing billing status from Stripe.</Notice> : null}
      {flash.error === "checkout_cancelled" ? <Notice tone="warn">Subscription setup was not completed. You can use the setup link from AMG or contact Operations.</Notice> : null}
      {["past_due", "unpaid"].includes(subscription.status) || subscription.stripe_payment_status === "failed" ? (
        <Notice tone="danger">Action required: update your payment method through Stripe billing management.</Notice>
      ) : null}
      <PageHeader
        eyebrow="Subscription"
        title={subscription.plan?.name ?? "AMG Support Subscription"}
        description={subscription.tier?.name ?? "Custom support program"}
        actions={<Link href="/portal/client/subscriptions" className="text-xs text-muted-foreground hover:text-accent">Back to subscriptions</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Status" value={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} />
        <StatCard label="Payment" value={subscription.stripe_payment_status ?? "pending"} />
        <StatCard label="Usage Units" value={usageTotals.quantity} />
        <StatCard label="Renews" value={formatDate(subscription.current_period_end ?? subscription.renewal_date)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <SectionCard title="Program Details" icon="clipboard">
          <dl>
            <DetailRow label="Status"><StatusBadge label={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} tone={toneFor(SUBSCRIPTION_STATUS_TONE, subscription.status)} /></DetailRow>
            <DetailRow label="Aircraft">{subscription.aircraft?.tail_number ?? "Account-level"}</DetailRow>
            <DetailRow label="Cadence">{subscription.billing_cadence}</DetailRow>
            <DetailRow label="Amount">{formatMoney(Number(subscription.amount_cents ?? 0) > 0 ? Number(subscription.amount_cents) / 100 : Number(subscription.custom_price ?? subscription.monthly_price))}</DetailRow>
            <DetailRow label="Start">{formatDate(subscription.start_date)}</DetailRow>
            <DetailRow label="Renewal">{formatDate(subscription.current_period_end ?? subscription.renewal_date)}</DetailRow>
            <DetailRow label="Payment Status">{subscription.stripe_payment_status ?? "-"}</DetailRow>
            <DetailRow label="Included">{`${subscription.included_flights} flights / ${subscription.included_mx_repositions} MX repositions / ${subscription.included_admin_hours} admin hrs`}</DetailRow>
            <DetailRow label="Credit Balance">{formatMoney(subscription.credit_balance)}</DetailRow>
          </dl>
          {subscription.stripe_customer_id ? (
            <form action={manageSubscriptionBilling} className="mt-5">
              <input type="hidden" name="return_to" value={`/portal/client/subscriptions/${subscription.id}`} />
              <SubmitButton className="w-full" pendingText="Opening Stripe...">Manage Billing</SubmitButton>
            </form>
          ) : null}
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

          <SectionCard title="Billing History" icon="wallet">
            <DataTable
              rows={subscription.billingInvoices}
              getKey={(row) => row.id}
              emptyLabel="No Stripe billing invoices are available yet."
              columns={[
                { header: "Invoice", cell: (row) => row.hosted_invoice_url ? <Link href={row.hosted_invoice_url} className="text-accent hover:underline">{row.stripe_invoice_number ?? row.stripe_invoice_id}</Link> : row.stripe_invoice_number ?? row.stripe_invoice_id },
                { header: "Status", cell: (row) => row.status ?? "-" },
                { header: "Period", cell: (row) => `${formatDate(row.period_start)} - ${formatDate(row.period_end)}` },
                { header: "Due", cell: (row) => formatMoney(row.amount_due), align: "right" },
                { header: "Paid", cell: (row) => formatMoney(row.amount_paid), align: "right" },
                { header: "PDF", cell: (row) => row.invoice_pdf_url ? <Link href={`/portal/subscription-invoices/${row.id}/view`} className="text-accent hover:underline">PDF</Link> : "-" },
              ]}
            />
          </SectionCard>
        </div>
      </div>
    </>
  );
}
