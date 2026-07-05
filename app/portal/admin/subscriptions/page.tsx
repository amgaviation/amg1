import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { createSubscriptionPlan } from "@/app/portal/actions/subscriptions";
import { DataTable } from "@/components/portal/ui/data-table";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { EmptyState, Notice, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getSubscriptionOverageTotal, listAllSubscriptions, listStripeSubscriptionEvents, listSubscriptionPlans } from "@/lib/portal/queries";
import { SUBSCRIPTION_PLAN_STATUS, SUBSCRIPTION_PLAN_STATUS_LABEL, SUBSCRIPTION_PLAN_STATUS_TONE, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE, SUBSCRIPTION_SYNC_STATUS_LABEL, SUBSCRIPTION_SYNC_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Subscriptions - Admin Portal" };

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [subscriptions, plans, overageTotal, stripeEvents] = await Promise.all([
    listAllSubscriptions(),
    listSubscriptionPlans(),
    getSubscriptionOverageTotal(),
    listStripeSubscriptionEvents(),
  ]);
  const activeCount = subscriptions.filter((subscription) => subscription.status === "active").length;
  const trialingCount = subscriptions.filter((subscription) => subscription.status === "trialing").length;
  const pendingCheckoutCount = subscriptions.filter((subscription) => subscription.stripe_sync_status === "pending_checkout").length;
  const needsReviewCount = subscriptions.filter((subscription) => subscription.stripe_sync_status === "needs_review" || subscription.status === "needs_review").length;
  const syncErrorCount = subscriptions.filter((subscription) => ["sync_error", "price_mismatch", "disconnected"].includes(subscription.stripe_sync_status ?? "")).length;

  return (
    <>
      {params.success === "plan" ? <Notice tone="success">Subscription plan created.</Notice> : null}
      {params.error ? <Notice tone="danger">Subscription action could not be completed.</Notice> : null}
      <PageHeader
        eyebrow="AMG Billing"
        title="Subscriptions"
        description="Manage client support subscriptions, allowances, usage, renewal status, and credits."
        actions={<Link href="/portal/admin/subscriptions/new" className="text-xs text-accent hover:underline">Create Client Subscription</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active subscriptions" value={activeCount} href="/portal/admin/subscriptions" tone={activeCount ? "accent" : "default"} />
        <StatCard label="Trialing" value={trialingCount} href="/portal/admin/subscriptions" />
        <StatCard label="Pending checkout" value={pendingCheckoutCount} href="/portal/admin/subscriptions" tone={pendingCheckoutCount ? "warn" : "default"} />
        <StatCard label="Needs review" value={needsReviewCount} href="/portal/admin/subscriptions" tone={needsReviewCount ? "danger" : "default"} />
        <StatCard label="Sync issues" value={syncErrorCount} href="/portal/admin/subscriptions" tone={syncErrorCount ? "danger" : "default"} />
        <StatCard label="Tracked overages" value={formatMoney(overageTotal)} href="/portal/admin/subscriptions" />
      </div>

      {needsReviewCount || syncErrorCount || pendingCheckoutCount ? (
        <Notice tone={syncErrorCount || needsReviewCount ? "danger" : "warn"}>
          {needsReviewCount ? "Stripe subscription exists but is not linked to a portal client. " : ""}
          {syncErrorCount ? "Webhook failed, price mismatch, or disconnected record needs review. " : ""}
          {pendingCheckoutCount ? "Checkout session created but not completed." : ""}
        </Notice>
      ) : null}

      <SectionCard title="Client Subscriptions" icon="clipboard">
        {subscriptions.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No client subscriptions"
            description="Create a subscription to track included support, usage, overages, and client credits."
            action={<Link href="/portal/admin/subscriptions/new" className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground">Create Subscription</Link>}
          />
        ) : (
          <DataTable
            rows={subscriptions}
            getKey={(row) => row.id}
            emptyLabel="No client subscriptions."
            columns={[
              { header: "Client", cell: (row) => row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? "-" },
              { header: "Plan", cell: (row) => <Link href={`/portal/admin/subscriptions/${row.id}`} className="text-accent hover:underline">{row.plan?.name ?? "Custom subscription"}</Link> },
              { header: "Tier", cell: (row) => row.tier?.name ?? "-" },
              { header: "Aircraft", cell: (row) => row.aircraft?.tail_number ?? "-" },
              { header: "Stripe", cell: (row) => <StatusBadge label={SUBSCRIPTION_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(SUBSCRIPTION_STATUS_TONE, row.status)} /> },
              { header: "Sync", cell: (row) => <StatusBadge label={SUBSCRIPTION_SYNC_STATUS_LABEL[row.stripe_sync_status ?? "manual"] ?? row.stripe_sync_status ?? "manual"} tone={toneFor(SUBSCRIPTION_SYNC_STATUS_TONE, row.stripe_sync_status ?? "manual")} /> },
              { header: "Source", cell: (row) => row.source ?? "manual" },
              { header: "Last Sync", cell: (row) => formatDateTime(row.stripe_last_synced_at ?? row.updated_at) },
              { header: "Renewal", cell: (row) => formatDate(row.renewal_date) },
              { header: "Warning", cell: (row) => row.stripe_sync_warning ?? "-" },
            ]}
          />
        )}
      </SectionCard>

      <SectionCard title="Stripe Event History" icon="history">
        <DataTable
          rows={stripeEvents}
          getKey={(row) => row.id}
          emptyLabel="No Stripe subscription events recorded."
          columns={[
            { header: "Event", cell: (row) => row.event_type ?? row.type },
            { header: "Stripe Event ID", cell: (row) => <span className="font-mono text-xs">{row.stripe_event_id}</span> },
            { header: "Received", cell: (row) => formatDateTime(row.received_at ?? row.created_at) },
            { header: "Processed", cell: (row) => formatDateTime(row.processed_at) },
            { header: "Status", cell: (row) => <StatusBadge label={row.status} tone={row.status === "failed" || row.status === "retry_needed" ? "danger" : row.status === "processed" ? "success" : "neutral"} /> },
            { header: "Subscription", cell: (row) => row.portal_subscription_id ? <Link href={`/portal/admin/subscriptions/${row.portal_subscription_id}`} className="text-accent hover:underline">Open</Link> : row.stripe_subscription_id ?? "-" },
            { header: "Invoice", cell: (row) => row.stripe_invoice_id ?? "-" },
            { header: "Error", cell: (row) => row.error ?? "-" },
          ]}
        />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <SectionCard title="Plans & Tiers" icon="clipboard">
          {plans.length === 0 ? (
            <EmptyState icon="clipboard" title="No subscription plans" description="Create the first AMG plan using the form on this page." />
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-lg border border-border bg-[var(--deck-panel-2)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{plan.aircraft_category ?? "All aircraft"} · {plan.description ?? "No description"}</p>
                    </div>
                    <StatusBadge label={SUBSCRIPTION_PLAN_STATUS_LABEL[plan.status] ?? plan.status} tone={toneFor(SUBSCRIPTION_PLAN_STATUS_TONE, plan.status)} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {plan.tiers.map((tier) => (
                      <div key={tier.id} className="rounded-md border border-border/70 p-3 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">{tier.name}</p>
                        <p>{tier.included_flights} flights · {tier.included_mx_repositions} MX repositions · {tier.included_admin_hours} admin hrs</p>
                        <p>{formatMoney(tier.monthly_price)} monthly · {formatMoney(tier.annual_price)} annual</p>
                        <p>Test monthly: {tier.stripe_test_monthly_price_id ?? tier.stripe_monthly_price_id ?? "not mapped"}</p>
                        <p>Test annual: {tier.stripe_test_annual_price_id ?? tier.stripe_annual_price_id ?? "not mapped"}</p>
                        <p>Live monthly: {tier.stripe_live_monthly_price_id ?? "not mapped"}</p>
                        <p>Live annual: {tier.stripe_live_annual_price_id ?? "not mapped"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Create Plan" icon="settings">
          <form action={createSubscriptionPlan} className="space-y-4">
            <TextField label="Plan Name" name="name" required placeholder="Managed Owner Support" />
            <TextField label="Plan Code" name="plan_code" placeholder="managed-owner-support" />
            <TextField label="Legacy/Test Stripe Product ID" name="stripe_product_id" placeholder="prod_..." />
            <TextField label="Test Stripe Product ID" name="stripe_test_product_id" placeholder="prod_..." />
            <TextField label="Live Stripe Product ID" name="stripe_live_product_id" placeholder="prod_..." />
            <TextField label="Aircraft Category" name="aircraft_category" placeholder="Light Jet, Mid, Heavy..." />
            <SelectField label="Plan Status" name="status" defaultValue="active" options={SUBSCRIPTION_PLAN_STATUS.map((status) => ({ value: status.value, label: status.label }))} />
            <TextAreaField label="Description" name="description" />
            <TextField label="Default Tier Name" name="tier_name" defaultValue="Standard" />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Included Flights" name="included_flights" type="number" min="0" step="0.01" />
              <TextField label="MX Repositions" name="included_mx_repositions" type="number" min="0" step="0.01" />
              <TextField label="Admin Hours" name="included_admin_hours" type="number" min="0" step="0.01" />
              <TextField label="Crew Day Rate" name="crew_day_rate" type="number" min="0" step="0.01" />
              <TextField label="Monthly Price" name="monthly_price" type="number" min="0" step="0.01" />
              <TextField label="Annual Price" name="annual_price" type="number" min="0" step="0.01" />
              <TextField label="Legacy/Test Monthly Price ID" name="stripe_monthly_price_id" placeholder="price_..." />
              <TextField label="Legacy/Test Annual Price ID" name="stripe_annual_price_id" placeholder="price_..." />
              <TextField label="Test Monthly Price ID" name="stripe_test_monthly_price_id" placeholder="price_..." />
              <TextField label="Test Annual Price ID" name="stripe_test_annual_price_id" placeholder="price_..." />
              <TextField label="Live Monthly Price ID" name="stripe_live_monthly_price_id" placeholder="price_..." />
              <TextField label="Live Annual Price ID" name="stripe_live_annual_price_id" placeholder="price_..." />
            </div>
            <TextAreaField label="Travel Policy" name="travel_policy" />
            <TextAreaField label="Lodging Policy" name="lodging_policy" />
            <TextAreaField label="Default Terms" name="default_terms" />
            <SubmitButton pendingText="Creating...">Create Plan</SubmitButton>
          </form>
        </SectionCard>
      </div>
    </>
  );
}
