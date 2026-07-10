import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { addSubscriptionCredit, addSubscriptionUsage, cancelStripeSubscriptionAtPeriodEnd, ignoreNeedsReviewSubscription, linkNeedsReviewSubscription, refreshStripeSubscription, resendSubscriptionSetupLink, updateSubscriptionStatus } from "@/app/portal/actions/subscriptions";
import { resolvePriceMismatch } from "@/app/portal/actions/subscription-sync";
import { DataTable } from "@/components/portal/ui/data-table";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { DetailRow, Notice, PageHeader, SectionCard, StatCard, Timeline } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getEntityTimeline, getSubscriptionDetail, listAllMissions, listClients } from "@/lib/portal/queries";
import { SUBSCRIPTION_CREDIT_TYPES, SUBSCRIPTION_STATUS, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE, SUBSCRIPTION_SYNC_STATUS_LABEL, SUBSCRIPTION_SYNC_STATUS_TONE, SUBSCRIPTION_USAGE_TYPE_LABEL, SUBSCRIPTION_USAGE_TYPES, toneFor } from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";
import { stripeDashboardSubscriptionUrl } from "@/lib/portal/stripe-subscriptions";

export const metadata = { title: "Subscription Detail - Admin Portal" };

export default async function AdminSubscriptionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireRolePermission("admin", "subscriptions");
  const { id } = await params;
  const flash = await searchParams;
  const [subscription, missions, clients, timeline] = await Promise.all([getSubscriptionDetail(id), listAllMissions(), listClients(), getEntityTimeline("client_subscription", id)]);
  if (!subscription) notFound();
  const activityItems = timeline
    .map((event) => ({
      at: event.created_at,
      title: event.action.replace(/_/g, " "),
      body: event.detail ?? event.actor_email ?? undefined,
    }))
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())
    .slice(0, 12)
    .map((item) => ({
      title: item.title,
      meta: formatDateTime(item.at),
      body: item.body,
    }));
  const clientMissions = missions.filter((mission) => mission.client_id === subscription.client_id);
  const usageTotals = subscription.usage.reduce(
    (totals, event) => ({
      quantity: totals.quantity + Number(event.quantity ?? 0),
      overage: totals.overage + Number(event.overage_amount ?? 0),
    }),
    { quantity: 0, overage: 0 },
  );
  const creditTotal = subscription.credits.reduce((sum, credit) => sum + Number(credit.amount ?? 0), 0);
  const dashboardUrl = stripeDashboardSubscriptionUrl(subscription.stripe_subscription_id);
  const priceMismatchHold =
    subscription.stripe_sync_status === "price_mismatch" ||
    (subscription.stripe_sync_status === "needs_review" && Boolean(subscription.stripe_sync_warning));

  return (
    <>
      {flash.success === "price-adopted" ? (
        <Notice tone="success">Stripe price adopted — the portal record now matches what Stripe is billing.</Notice>
      ) : flash.success === "price-kept" ? (
        <Notice tone="success">Portal price kept. Correct the price in Stripe; the record stays flagged until a matching event arrives.</Notice>
      ) : flash.success ? (
        <Notice tone="success">Subscription updated.</Notice>
      ) : null}
      {flash.error === "stripe_mode" ? (
        <Notice tone="danger">
          This subscription was created in the other Stripe mode (test vs live) than the
          configured key — it cannot be resolved against the current environment.
        </Notice>
      ) : flash.error === "stripe_error" ? (
        <Notice tone="danger">Stripe could not be reached to adopt the price. Nothing was changed — try again.</Notice>
      ) : flash.error ? (
        <Notice tone="danger">Subscription action could not be completed.</Notice>
      ) : null}
      {priceMismatchHold ? (
        <Notice tone={subscription.stripe_sync_status === "price_mismatch" ? "danger" : "warn"}>
          <div className="space-y-3">
            <p>{subscription.stripe_sync_warning ?? "Stripe price does not match the mapped AMG plan."}</p>
            <div className="flex flex-wrap gap-2">
              <form action={resolvePriceMismatch}>
                <input type="hidden" name="subscription_id" value={subscription.id} />
                <input type="hidden" name="resolution" value="accept_stripe" />
                <SubmitButton confirm="Adopt Stripe's price into the portal record? This accepts the amount Stripe is actually billing as correct." pendingText="Adopting...">Adopt Stripe price</SubmitButton>
              </form>
              <form action={resolvePriceMismatch}>
                <input type="hidden" name="subscription_id" value={subscription.id} />
                <input type="hidden" name="resolution" value="keep_local" />
                <SubmitButton variant="outline" pendingText="Saving...">Keep portal price — needs Stripe fix</SubmitButton>
              </form>
            </div>
          </div>
        </Notice>
      ) : subscription.stripe_sync_warning ? (
        <Notice tone={subscription.stripe_sync_status === "pending_checkout" ? "warn" : "danger"}>{subscription.stripe_sync_warning}</Notice>
      ) : null}
      {(subscription as any).is_test ? (
        <Notice tone="warn">
          TEST subscription — Stripe test mode only. Excluded from revenue metrics and client views; remove it via “Delete All Test Subscriptions” on the Subscriptions page.
        </Notice>
      ) : null}
      <PageHeader
        eyebrow={(subscription as any).is_test ? "TEST Subscription" : (subscription as any).is_custom ? "Custom Subscription" : "Client Subscription"}
        title={(subscription as any).custom_name ?? subscription.plan?.name ?? "Custom Subscription"}
        description={subscription.client?.company_name ?? subscription.client?.full_name ?? subscription.client?.email ?? ((subscription as any).is_test ? "Stripe test-mode customer" : "Client")}
        actions={<Link href="/portal/admin/subscriptions" className="text-xs text-[var(--deck-text-2)] hover:text-[var(--deck-accent-ink)]">Back to subscriptions</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Stripe Status" value={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} />
        <StatCard label="Sync" value={SUBSCRIPTION_SYNC_STATUS_LABEL[subscription.stripe_sync_status ?? "manual"] ?? subscription.stripe_sync_status ?? "manual"} />
        <StatCard label="Usage Units" value={usageTotals.quantity} />
        <StatCard label="Credits" value={formatMoney(subscription.credit_balance ?? creditTotal)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <SectionCard title="Subscription Summary" icon="clipboard">
            <dl>
              <DetailRow label="Stripe Status"><StatusBadge label={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} tone={toneFor(SUBSCRIPTION_STATUS_TONE, subscription.status)} /></DetailRow>
              <DetailRow label="Sync Status"><StatusBadge label={SUBSCRIPTION_SYNC_STATUS_LABEL[subscription.stripe_sync_status ?? "manual"] ?? subscription.stripe_sync_status ?? "manual"} tone={toneFor(SUBSCRIPTION_SYNC_STATUS_TONE, subscription.stripe_sync_status ?? "manual")} /></DetailRow>
              <DetailRow label="Client">{subscription.client?.company_name ?? subscription.client?.full_name ?? subscription.client?.email ?? "-"}</DetailRow>
              <DetailRow label="Aircraft">{subscription.aircraft?.tail_number ?? "-"}</DetailRow>
              <DetailRow label="Plan">{subscription.plan?.name ?? "-"}</DetailRow>
              <DetailRow label="Tier">{subscription.tier?.name ?? "-"}</DetailRow>
              <DetailRow label="Cadence">{subscription.billing_cadence}</DetailRow>
              <DetailRow label="Start">{formatDate(subscription.start_date)}</DetailRow>
              <DetailRow label="Renewal">{formatDate(subscription.renewal_date)}</DetailRow>
              <DetailRow label="Current Period">{[formatDate(subscription.current_period_start), formatDate(subscription.current_period_end)].join(" - ")}</DetailRow>
              <DetailRow label="Cancel At Period End">{subscription.cancel_at_period_end ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Monthly">{formatMoney(subscription.custom_price ?? subscription.monthly_price)}</DetailRow>
              <DetailRow label="Annual">{formatMoney(subscription.annual_price)}</DetailRow>
              <DetailRow label="Stripe Customer">{subscription.stripe_customer_id ?? "-"}</DetailRow>
              <DetailRow label="Stripe Subscription">{subscription.stripe_subscription_id ?? "-"}</DetailRow>
              <DetailRow label="Stripe Price">{subscription.stripe_price_id ?? "-"}</DetailRow>
              <DetailRow label="Stripe Mode">{subscription.stripe_mode ?? "-"}</DetailRow>
              <DetailRow label="Latest Invoice">{subscription.stripe_latest_invoice_id ?? "-"}</DetailRow>
              <DetailRow label="Payment Status">{subscription.stripe_payment_status ?? "-"}</DetailRow>
              <DetailRow label="Source">{subscription.source ?? "manual"}</DetailRow>
              <DetailRow label="Last Event">{subscription.stripe_last_event_type ?? "-"}</DetailRow>
              <DetailRow label="Last Synced">{formatDateTime(subscription.stripe_last_synced_at)}</DetailRow>
              <DetailRow label="Allowances">{`${subscription.included_flights} flights / ${subscription.included_mx_repositions} MX repositions / ${subscription.included_admin_hours} admin hrs`}</DetailRow>
              <DetailRow label="Notes">{subscription.notes ?? "-"}</DetailRow>
            </dl>
          </SectionCard>

          <SectionCard title="Usage Ledger" icon="history">
            <DataTable
              rows={subscription.usage}
              getKey={(row) => row.id}
              emptyLabel="No subscription usage recorded."
              columns={[
                { header: "Date", cell: (row) => formatDateTime(row.created_at) },
                { header: "Type", cell: (row) => SUBSCRIPTION_USAGE_TYPE_LABEL[row.usage_type] ?? row.usage_type },
                { header: "Mission", cell: (row) => row.mission ? <Link href={`/portal/admin/trips/${row.mission.id}`} className="text-[var(--deck-accent-ink)] hover:underline">{row.mission.ref}</Link> : "-" },
                { header: "Qty", cell: (row) => `${row.quantity} ${row.unit ?? ""}`.trim(), align: "right" },
                { header: "Covered", cell: (row) => row.covered_quantity, align: "right" },
                { header: "Overage", cell: (row) => formatMoney(row.overage_amount), align: "right" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Credits Ledger" icon="wallet">
            <DataTable
              rows={subscription.credits}
              getKey={(row) => row.id}
              emptyLabel="No subscription credits recorded."
              columns={[
                { header: "Date", cell: (row) => formatDateTime(row.created_at) },
                { header: "Source", cell: (row) => row.source_type.replace(/_/g, " ") },
                { header: "Description", cell: (row) => row.description ?? "-" },
                { header: "Expires", cell: (row) => formatDate(row.expires_at) },
                { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Subscription Billing History" icon="wallet">
            <DataTable
              rows={subscription.billingInvoices}
              getKey={(row) => row.id}
              emptyLabel="No Stripe subscription invoices recorded."
              columns={[
                { header: "Invoice", cell: (row) => row.hosted_invoice_url ? <Link href={row.hosted_invoice_url} className="text-[var(--deck-accent-ink)] hover:underline">{row.stripe_invoice_number ?? row.stripe_invoice_id}</Link> : row.stripe_invoice_number ?? row.stripe_invoice_id },
                { header: "Status", cell: (row) => row.status ?? "-" },
                { header: "Payment", cell: (row) => row.payment_status ?? "-" },
                { header: "Period", cell: (row) => `${formatDate(row.period_start)} - ${formatDate(row.period_end)}` },
                { header: "Due", cell: (row) => formatMoney(row.amount_due), align: "right" },
                { header: "Paid", cell: (row) => formatMoney(row.amount_paid), align: "right" },
                { header: "PDF", cell: (row) => row.invoice_pdf_url ? <Link href={`/portal/subscription-invoices/${row.id}/view`} className="text-[var(--deck-accent-ink)] hover:underline">PDF</Link> : "-" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Stripe Event History" icon="history">
            <DataTable
              rows={subscription.stripeEvents}
              getKey={(row) => row.id}
              emptyLabel="No Stripe events linked to this subscription."
              columns={[
                { header: "Event", cell: (row) => row.event_type ?? row.type },
                { header: "Received", cell: (row) => formatDateTime(row.received_at ?? row.created_at) },
                { header: "Processed", cell: (row) => formatDateTime(row.processed_at) },
                { header: "Status", cell: (row) => row.status },
                { header: "Error", cell: (row) => row.error ?? "-" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Activity Timeline" icon="history">
            {activityItems.length ? (
              <Timeline items={activityItems} />
            ) : (
              <p className="text-sm text-[var(--deck-text-2)]">No subscription activity recorded yet.</p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Stripe Recovery" icon="settings">
            <div className="space-y-3">
              <form action={refreshStripeSubscription}>
                <input type="hidden" name="subscription_id" value={subscription.id} />
                <SubmitButton className="w-full" pendingText="Refreshing...">Refresh From Stripe</SubmitButton>
              </form>
              {subscription.stripe_checkout_url && subscription.stripe_sync_status === "pending_checkout" ? (
                <form action={resendSubscriptionSetupLink}>
                  <input type="hidden" name="subscription_id" value={subscription.id} />
                  <SubmitButton className="w-full" pendingText="Resending...">Resend Setup Link</SubmitButton>
                </form>
              ) : null}
              {subscription.stripe_subscription_id ? (
                <form action={cancelStripeSubscriptionAtPeriodEnd}>
                  <input type="hidden" name="subscription_id" value={subscription.id} />
                  <SubmitButton className="w-full" variant="outline" confirm="Cancel this Stripe subscription at the end of the current period?" pendingText="Canceling...">Cancel At Period End</SubmitButton>
                </form>
              ) : null}
              {dashboardUrl ? <Link href={dashboardUrl} className="block text-xs text-[var(--deck-accent-ink)] hover:underline">Open Stripe Dashboard</Link> : null}
            </div>
          </SectionCard>

          {(subscription.stripe_sync_status === "needs_review" && !priceMismatchHold) || !subscription.client_id ? (
            <SectionCard title="Needs Review" icon="building">
              <form action={linkNeedsReviewSubscription} className="space-y-4">
                <input type="hidden" name="subscription_id" value={subscription.id} />
                <ClientPickerField label="Link to Client" clients={clients} />
                <SubmitButton pendingText="Linking...">Link Subscription</SubmitButton>
              </form>
              <form action={ignoreNeedsReviewSubscription} className="mt-3">
                <input type="hidden" name="subscription_id" value={subscription.id} />
                <SubmitButton variant="outline" confirm="Mark this Stripe subscription ignored/not AMG-related?" pendingText="Ignoring...">Mark Ignored</SubmitButton>
              </form>
            </SectionCard>
          ) : null}

          <SectionCard title="Status" icon="settings">
            <form action={updateSubscriptionStatus} className="space-y-4">
              <input type="hidden" name="subscription_id" value={subscription.id} />
              <SelectField label="Status" name="status" defaultValue={subscription.status} options={SUBSCRIPTION_STATUS.map((status) => ({ value: status.value, label: status.label }))} />
              <TextField label="End Date" name="end_date" type="date" defaultValue={subscription.end_date ?? ""} />
              <TextField label="Renewal Date" name="renewal_date" type="date" defaultValue={subscription.renewal_date ?? ""} />
              <TextAreaField label="Notes" name="notes" defaultValue={subscription.notes ?? ""} />
              <SubmitButton pendingText="Saving...">Save Status</SubmitButton>
            </form>
          </SectionCard>

          <SectionCard title="Add Usage" icon="radar">
            {subscription.client_id ? (
            <form action={addSubscriptionUsage} className="space-y-4">
              <input type="hidden" name="subscription_id" value={subscription.id} />
              <input type="hidden" name="client_id" value={subscription.client_id} />
              <SelectField label="Usage Type" name="usage_type" defaultValue="flight_support" options={SUBSCRIPTION_USAGE_TYPES.map((type) => ({ value: type.value, label: type.label }))} />
              <SelectField label="Mission" name="mission_id" defaultValue="" options={[{ value: "", label: "No linked mission" }, ...clientMissions.map((mission) => ({ value: mission.id, label: mission.ref }))]} />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Quantity" name="quantity" type="number" min="0" step="0.01" required />
                <TextField label="Unit" name="unit" placeholder="flight, hour, day" />
                <TextField label="Covered Qty" name="covered_quantity" type="number" min="0" step="0.01" />
                <TextField label="Overage Qty" name="overage_quantity" type="number" min="0" step="0.01" />
                <TextField label="Overage Rate" name="unit_rate" type="number" min="0" step="0.01" />
              </div>
              <TextAreaField label="Notes" name="notes" />
              <SubmitButton pendingText="Adding...">Add Usage</SubmitButton>
            </form>
            ) : <Notice tone="warn">Link this Stripe subscription to a client before recording operational usage.</Notice>}
          </SectionCard>

          <SectionCard title="Add Credit" icon="wallet">
            {subscription.client_id ? (
            <form action={addSubscriptionCredit} className="space-y-4">
              <input type="hidden" name="subscription_id" value={subscription.id} />
              <input type="hidden" name="client_id" value={subscription.client_id} />
              <SelectField label="Source" name="source_type" defaultValue="manual" options={SUBSCRIPTION_CREDIT_TYPES.map((type) => ({ value: type.value, label: type.label }))} />
              <TextField label="Amount" name="amount" type="number" step="0.01" required />
              <TextField label="Expires" name="expires_at" type="date" />
              <TextAreaField label="Description" name="description" />
              <SubmitButton pendingText="Adding...">Add Credit</SubmitButton>
            </form>
            ) : <Notice tone="warn">Link this Stripe subscription to a client before adding credits.</Notice>}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
