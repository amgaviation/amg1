import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import {
  cleanupTestSubscriptionsAction,
  createSubscriptionPlan,
  createTestSubscriptionAction,
} from "@/app/portal/actions/subscriptions";
import { currentStripeMode } from "@/lib/portal/stripe-mode";
import { resolveTestStripeKey } from "@/lib/portal/stripe-custom-subscriptions";
import { DataTable } from "@/components/portal/ui/data-table";
import { DeckSelect, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import {
  DetailRow,
  EmptyState,
  FilterTabs,
  Notice,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { FormModal, RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import {
  getSubscriptionOverageTotal,
  listAllSubscriptions,
  listStripeSubscriptionEvents,
  listSubscriptionPlans,
} from "@/lib/portal/queries";
import {
  SUBSCRIPTION_PLAN_STATUS,
  SUBSCRIPTION_PLAN_STATUS_LABEL,
  SUBSCRIPTION_PLAN_STATUS_TONE,
  SUBSCRIPTION_STATUS_LABEL,
  SUBSCRIPTION_STATUS_TONE,
  SUBSCRIPTION_SYNC_STATUS,
  SUBSCRIPTION_SYNC_STATUS_LABEL,
  SUBSCRIPTION_SYNC_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Subscriptions - Admin Portal" };

const PAGE_SIZE = 25;

type Params = {
  success?: string;
  error?: string;
  q?: string;
  status?: string;
  sync?: string;
  plan?: string;
  page?: string;
  record?: string;
  new_plan?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["q", "status", "sync", "plan", "page"];
  const search = new URLSearchParams();
  for (const key of keep) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) search.set(key, value);
    else search.delete(key);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

type SubscriptionRow = Awaited<ReturnType<typeof listAllSubscriptions>>[number];

function clientLabel(row: SubscriptionRow) {
  return row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? null;
}

function planLabel(row: SubscriptionRow) {
  return (row as any).custom_name ?? row.plan?.name ?? "Custom subscription";
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "subscriptions");
  const params = await searchParams;
  const [subscriptions, plans, overageTotal, stripeEvents] = await Promise.all([
    listAllSubscriptions(),
    listSubscriptionPlans(),
    getSubscriptionOverageTotal(),
    listStripeSubscriptionEvents(),
  ]);
  const basePath = "/portal/admin/subscriptions";

  // Test subscriptions never count toward operations/revenue numbers.
  const realSubscriptions = subscriptions.filter((subscription) => !(subscription as any).is_test);
  const testCount = subscriptions.length - realSubscriptions.length;
  const activeCount = realSubscriptions.filter((subscription) => subscription.status === "active").length;
  const trialingCount = realSubscriptions.filter((subscription) => subscription.status === "trialing").length;
  const pendingCheckoutCount = realSubscriptions.filter((subscription) => subscription.stripe_sync_status === "pending_checkout").length;
  const needsReviewCount = realSubscriptions.filter((subscription) => subscription.stripe_sync_status === "needs_review" || subscription.status === "needs_review").length;
  const syncErrorCount = realSubscriptions.filter((subscription) => ["sync_error", "price_mismatch", "disconnected"].includes(subscription.stripe_sync_status ?? "")).length;
  const stripeMode = currentStripeMode();
  const hasTestKey = Boolean(resolveTestStripeKey());

  const q = params.q?.trim().toLowerCase();
  const filtered = subscriptions.filter((row) => {
    if (params.status && row.status !== params.status) return false;
    if (params.sync && (row.stripe_sync_status ?? "manual") !== params.sync) return false;
    if (params.plan && row.plan_id !== params.plan) return false;
    if (q) {
      const haystack = [
        clientLabel(row),
        planLabel(row),
        row.tier?.name,
        row.aircraft?.tail_number,
        row.source,
        row.stripe_subscription_id,
        row.stripe_customer_id,
        row.stripe_sync_warning,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const record = params.record
    ? subscriptions.find((row) => row.id === params.record) ?? null
    : null;

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(params.q || params.status || params.sync || params.plan);
  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;
  const newPlanHref = `${basePath}${listQuery(params, { new_plan: "1", page: undefined })}`;

  const statusBadge = (row: SubscriptionRow) => (
    <StatusBadge
      label={SUBSCRIPTION_STATUS_LABEL[row.status] ?? row.status}
      tone={toneFor(SUBSCRIPTION_STATUS_TONE, row.status)}
    />
  );
  const syncBadge = (row: SubscriptionRow) => (
    <StatusBadge
      label={SUBSCRIPTION_SYNC_STATUS_LABEL[row.stripe_sync_status ?? "manual"] ?? row.stripe_sync_status ?? "manual"}
      tone={toneFor(SUBSCRIPTION_SYNC_STATUS_TONE, row.stripe_sync_status ?? "manual")}
    />
  );

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Subscriptions"
      description="Manage client support subscriptions, allowances, usage, renewal status, and credits."
      actions={
        <>
          <Button asChild size="sm" variant="outline">
            <Link href={newPlanHref}>+ New Plan</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`${basePath}/new`}>+ New Subscription</Link>
          </Button>
        </>
      }
      notices={
        <>
          {params.success === "plan" ? <Notice tone="success">Subscription plan created.</Notice> : null}
          {params.success === "test-cleanup" ? <Notice tone="success">Test subscriptions cleaned up.</Notice> : null}
          {params.error ? <Notice tone="danger">{decodeURIComponent(params.error)}</Notice> : null}
          {needsReviewCount || syncErrorCount || pendingCheckoutCount ? (
            <Notice tone={syncErrorCount || needsReviewCount ? "danger" : "warn"}>
              {needsReviewCount ? "Stripe subscription exists but is not linked to a portal client. " : ""}
              {syncErrorCount ? "Webhook failed, price mismatch, or disconnected record needs review. " : ""}
              {pendingCheckoutCount ? "Checkout session created but not completed." : ""}
            </Notice>
          ) : null}
        </>
      }
      kpis={
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Active subscriptions" value={activeCount} href={`${basePath}?status=active`} tone={activeCount ? "accent" : "default"} />
          <StatCard label="Trialing" value={trialingCount} href={`${basePath}?status=trialing`} />
          <StatCard label="Pending checkout" value={pendingCheckoutCount} href={`${basePath}?sync=pending_checkout`} tone={pendingCheckoutCount ? "warn" : "default"} />
          <StatCard label="Needs review" value={needsReviewCount} href={`${basePath}?sync=needs_review`} tone={needsReviewCount ? "danger" : "default"} />
          <StatCard label="Sync issues" value={syncErrorCount} href={`${basePath}?sync=sync_error`} tone={syncErrorCount ? "danger" : "default"} />
          <StatCard label="Tracked overages" value={formatMoney(overageTotal)} href={basePath} />
        </div>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          preserve={{ q: params.q, sync: params.sync, plan: params.plan }}
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "trialing", label: "Trialing" },
            { value: "pending_checkout", label: "Pending Checkout" },
            { value: "paused", label: "Paused" },
            { value: "past_due", label: "Past Due" },
            { value: "canceled", label: "Canceled" },
            { value: "needs_review", label: "Needs Review" },
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Client, plan, tail number, Stripe ID…"
            aria-label="Search subscriptions"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="sync"
            defaultValue={params.sync ?? ""}
            aria-label="Sync status"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Sync States" },
              ...SUBSCRIPTION_SYNC_STATUS.map((status) => ({
                value: status.value,
                label: status.label,
              })),
            ]}
          />
          <DeckSelect
            name="plan"
            defaultValue={params.plan ?? ""}
            aria-label="Plan"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Plans" },
              ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
            ]}
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          {hasFilters ? (
            <Link
              href={basePath}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Clear
            </Link>
          ) : null}
        </form>
      }
      count={`${filtered.length} / ${subscriptions.length} records`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No client subscriptions"
            description={
              hasFilters
                ? "No subscriptions match the current filters."
                : "Create a subscription to track included support, usage, overages, and client credits."
            }
            action={
              <Button asChild size="sm">
                <Link href={`${basePath}/new`}>Create Subscription</Link>
              </Button>
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => recordHref(row.id)}
            emptyLabel="No client subscriptions."
            columns={[
              {
                header: "Client",
                priority: "primary",
                cell: (row) =>
                  (row as any).is_test ? (
                    <StatusBadge label="TEST" tone="warn" />
                  ) : (
                    <span className="font-semibold text-[var(--deck-text)]">
                      {clientLabel(row) ?? "—"}
                    </span>
                  ),
              },
              {
                header: "Plan",
                priority: "secondary",
                cell: (row) => (
                  <span className="inline-flex flex-wrap items-center gap-2 text-[var(--deck-text-2)]">
                    {planLabel(row)}
                    {(row as any).is_test ? (
                      <StatusBadge label="TEST" tone="warn" />
                    ) : (row as any).is_custom ? (
                      <StatusBadge label="CUSTOM" tone="accent" />
                    ) : null}
                  </span>
                ),
              },
              {
                header: "Tier",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="text-[var(--deck-text-2)]">{row.tier?.name ?? "—"}</span>
                ),
              },
              {
                header: "Monthly Fee",
                align: "right",
                priority: "secondary",
                cell: (row) => (
                  <span className="deck-num">
                    {formatMoney(row.custom_price ?? row.monthly_price)}
                  </span>
                ),
              },
              {
                header: "Renewal",
                cell: (row) => (
                  <span className="deck-mono whitespace-nowrap text-[var(--deck-text-2)]">
                    {formatDate(row.renewal_date)}
                  </span>
                ),
              },
              { header: "Status", cell: (row) => statusBadge(row) },
            ]}
          />
        )
      }
      pagination={{
        basePath,
        page: safePage,
        pageCount,
        params: {
          q: params.q,
          status: params.status,
          sync: params.sync,
          plan: params.plan,
        },
      }}
    >
      <SectionCard
        title="Subscription Testing"
        icon="shield"
        description="Admin-only lifecycle verification against Stripe TEST mode. Test subscriptions are flagged, excluded from every revenue number and client view, and can be removed here in one action."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="deck-inset p-4">
            <p className="text-sm font-semibold">Create test subscription <StatusBadge label="TEST" tone="warn" /></p>
            <p className="mt-1 text-xs leading-5 text-[var(--deck-text-3)]">
              Creates a $1/month subscription on a Stripe TEST customer paying with pm_card_visa so you can verify creation → invoice → renewal → cancellation without charging anyone.
              {hasTestKey ? null : " Unavailable: add STRIPE_TEST_SECRET_KEY (sk_test_…) to enable."}
            </p>
            <form action={createTestSubscriptionAction} className="mt-3 grid gap-3">
              {stripeMode === "live" ? (
                <TextField
                  label={`This environment is on a LIVE Stripe key — type CREATE TEST to confirm`}
                  name="confirm_text"
                  placeholder="CREATE TEST"
                  required
                />
              ) : null}
              <SubmitButton pendingText="Creating..." disabled={!hasTestKey}>Create Test Subscription</SubmitButton>
            </form>
          </div>
          <div className="deck-inset p-4">
            <p className="text-sm font-semibold">Clean up test subscriptions</p>
            <p className="mt-1 text-xs leading-5 text-[var(--deck-text-3)]">
              Cancels every test subscription in Stripe test mode (best effort) and deletes the {testCount} flagged test row{testCount === 1 ? "" : "s"} plus their usage, credits, and invoice mirrors.
            </p>
            <form action={cleanupTestSubscriptionsAction} className="mt-3">
              <SubmitButton
                variant="outline"
                pendingText="Cleaning..."
                disabled={testCount === 0}
                confirm={`Delete ${testCount} test subscription(s) and their Stripe test-mode counterparts?`}
              >
                Delete All Test Subscriptions
              </SubmitButton>
            </form>
          </div>
        </div>
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
            { header: "Subscription", cell: (row) => row.portal_subscription_id ? <Link href={`${basePath}/${row.portal_subscription_id}`} className="text-[var(--deck-accent-ink)] hover:underline">Open</Link> : row.stripe_subscription_id ?? "-" },
            { header: "Invoice", cell: (row) => row.stripe_invoice_id ?? "-" },
            { header: "Error", cell: (row) => row.error ?? "-" },
          ]}
        />
      </SectionCard>

      <SectionCard title="Plans & Tiers" icon="clipboard">
        {plans.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No subscription plans"
            description="Create the first AMG plan with the + New Plan window."
            action={
              <Button asChild size="sm">
                <Link href={newPlanHref}>+ New Plan</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <p className="mt-1 text-xs text-[var(--deck-text-2)]">{plan.aircraft_category ?? "All aircraft"} · {plan.description ?? "No description"}</p>
                  </div>
                  <StatusBadge label={SUBSCRIPTION_PLAN_STATUS_LABEL[plan.status] ?? plan.status} tone={toneFor(SUBSCRIPTION_PLAN_STATUS_TONE, plan.status)} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {plan.tiers.map((tier) => (
                    <div key={tier.id} className="rounded-md border border-[var(--deck-line)] p-3 text-xs text-[var(--deck-text-2)]">
                      <p className="font-semibold text-[var(--deck-text)]">{tier.name}</p>
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

      {record ? (
        <RecordModal
          eyebrow={(record as any).is_test ? "TEST subscription" : (record as any).is_custom ? "Custom subscription" : "Client subscription"}
          title={planLabel(record)}
          meta={clientLabel(record) ?? ((record as any).is_test ? "Stripe test-mode customer" : "Client")}
          badge={statusBadge(record)}
          actions={
            <>
              <Button asChild size="sm">
                <Link href={`${basePath}/${record.id}`}>Open full record</Link>
              </Button>
              {record.client_id ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/portal/admin/clients/${record.client_id}`}>Open client</Link>
                </Button>
              ) : null}
            </>
          }
        >
          {record.stripe_sync_warning ? (
            <div className="mb-4">
              <Notice tone="warn">{record.stripe_sync_warning}</Notice>
            </div>
          ) : null}
          <dl>
            <DetailRow label="Client">{clientLabel(record) ?? "—"}</DetailRow>
            <DetailRow label="Plan">
              <span className="inline-flex flex-wrap items-center gap-2">
                {planLabel(record)}
                {(record as any).is_test ? (
                  <StatusBadge label="TEST" tone="warn" />
                ) : (record as any).is_custom ? (
                  <StatusBadge label="CUSTOM" tone="accent" />
                ) : null}
              </span>
            </DetailRow>
            <DetailRow label="Tier">{record.tier?.name ?? "—"}</DetailRow>
            <DetailRow label="Aircraft">{record.aircraft?.tail_number ?? "—"}</DetailRow>
            <DetailRow label="Stripe Status">{statusBadge(record)}</DetailRow>
            <DetailRow label="Sync Status">{syncBadge(record)}</DetailRow>
            <DetailRow label="Cadence">{record.billing_cadence}</DetailRow>
            <DetailRow label="Monthly Fee">
              <span className="deck-num">{formatMoney(record.custom_price ?? record.monthly_price)}</span>
            </DetailRow>
            <DetailRow label="Annual Fee">
              <span className="deck-num">{formatMoney(record.annual_price)}</span>
            </DetailRow>
            <DetailRow label="Start">{formatDate(record.start_date)}</DetailRow>
            <DetailRow label="Renewal">{formatDate(record.renewal_date)}</DetailRow>
            <DetailRow label="Source">{record.source ?? "manual"}</DetailRow>
            <DetailRow label="Last Sync">
              {formatDateTime(record.stripe_last_synced_at ?? record.updated_at)}
            </DetailRow>
            <DetailRow label="Warning">{record.stripe_sync_warning ?? "—"}</DetailRow>
          </dl>
        </RecordModal>
      ) : null}

      {params.new_plan === "1" ? (
        <FormModal
          eyebrow="AMG Billing"
          title="Create plan"
          meta="Define an AMG subscription plan and its default tier, allowances, prices, and Stripe mappings."
          paramKeys={["new_plan"]}
          wide
        >
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
            <div className="flex justify-end">
              <SubmitButton pendingText="Creating...">Create Plan</SubmitButton>
            </div>
          </form>
        </FormModal>
      ) : null}
    </RecordListShell>
  );
}
