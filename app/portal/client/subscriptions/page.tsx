import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { manageSubscriptionBilling } from "@/app/portal/actions/subscriptions";
import { EmptyState, Notice, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listSubscriptionsForClient } from "@/lib/portal/queries";
import { SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Subscriptions - Client Portal" };

export default async function ClientSubscriptionsPage() {
  const user = await requireRolePermission("client", "subscriptions");
  const subscriptions = await listSubscriptionsForClient(user.id);
  const active = subscriptions.filter((subscription) => ["active", "trialing", "renewal_pending"].includes(subscription.status));
  const creditBalance = subscriptions.reduce((sum, subscription) => sum + Number(subscription.credit_balance ?? 0), 0);
  const paymentIssue = subscriptions.some((subscription) => ["past_due", "unpaid"].includes(subscription.status) || subscription.stripe_payment_status === "failed");

  return (
    <>
      <PageHeader
        eyebrow="Owner Services"
        title="Subscriptions"
        description="View active AMG support subscriptions, allowances, usage, renewal dates, and available credits."
      />

      {paymentIssue ? (
        <Notice tone="danger">Action required: update your subscription payment method through Stripe billing management.</Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active subscriptions" value={active.length} />
        <StatCard label="Available credits" value={formatMoney(creditBalance)} />
        <StatCard label="Aircraft linked" value={subscriptions.filter((subscription) => subscription.aircraft_id).length} href="/portal/client/aircraft" />
      </div>

      <SectionCard title="Subscription Summary" icon="clipboard">
        {subscriptions.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No active subscriptions"
            description="AMG Operations will activate subscription details here when a support program is assigned to your account."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {subscriptions.map((subscription) => (
              <Link key={subscription.id} href={`/portal/client/subscriptions/${subscription.id}`} className="rounded-md border border-border bg-background/50 p-4 transition-colors hover:border-accent/60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{subscription.plan?.name ?? "AMG Support Subscription"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{subscription.tier?.name ?? "Custom tier"} · {subscription.aircraft?.tail_number ?? "Account-level"}</p>
                  </div>
                  <StatusBadge label={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} tone={toneFor(SUBSCRIPTION_STATUS_TONE, subscription.status)} />
                </div>
                <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>{subscription.included_flights} flights</span>
                  <span>{subscription.included_mx_repositions} MX repos</span>
                  <span>{subscription.included_admin_hours} admin hrs</span>
                </div>
                <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Renews {formatDate(subscription.current_period_end ?? subscription.renewal_date)}</span>
                  <span className="font-semibold text-accent">
                    {formatMoney(Number(subscription.amount_cents ?? 0) > 0 ? Number(subscription.amount_cents) / 100 : Number(subscription.custom_price ?? subscription.monthly_price))} {subscription.billing_cadence}
                  </span>
                </div>
                {subscription.stripe_payment_status ? <p className="mt-2 text-xs text-muted-foreground">Payment status: {subscription.stripe_payment_status}</p> : null}
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      {subscriptions.some((subscription) => subscription.stripe_customer_id) ? (
        <form action={manageSubscriptionBilling}>
          <input type="hidden" name="return_to" value="/portal/client/subscriptions" />
          <SubmitButton pendingText="Opening Stripe...">Manage Billing</SubmitButton>
        </form>
      ) : null}
    </>
  );
}
