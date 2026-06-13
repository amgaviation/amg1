import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { addSubscriptionCredit, addSubscriptionUsage, updateSubscriptionStatus } from "@/app/portal/actions/subscriptions";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { DetailRow, Notice, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getSubscriptionDetail, listAllMissions } from "@/lib/portal/queries";
import { SUBSCRIPTION_CREDIT_TYPES, SUBSCRIPTION_STATUS, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE, SUBSCRIPTION_USAGE_TYPE_LABEL, SUBSCRIPTION_USAGE_TYPES, toneFor } from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Subscription Detail - Admin Portal" };

export default async function AdminSubscriptionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const { id } = await params;
  const flash = await searchParams;
  const [subscription, missions] = await Promise.all([getSubscriptionDetail(id), listAllMissions()]);
  if (!subscription) notFound();
  const clientMissions = missions.filter((mission) => mission.client_id === subscription.client_id);
  const usageTotals = subscription.usage.reduce(
    (totals, event) => ({
      quantity: totals.quantity + Number(event.quantity ?? 0),
      overage: totals.overage + Number(event.overage_amount ?? 0),
    }),
    { quantity: 0, overage: 0 },
  );
  const creditTotal = subscription.credits.reduce((sum, credit) => sum + Number(credit.amount ?? 0), 0);

  return (
    <PortalShell role="admin" user={user}>
      {flash.success ? <Notice tone="success">Subscription updated.</Notice> : null}
      {flash.error ? <Notice tone="danger">Subscription action could not be completed.</Notice> : null}
      <PageHeader
        eyebrow="Client Subscription"
        title={subscription.plan?.name ?? "Custom Subscription"}
        description={subscription.client?.company_name ?? subscription.client?.full_name ?? subscription.client?.email ?? "Client"}
        actions={<Link href="/portal/admin/subscriptions" className="text-xs text-muted-foreground hover:text-accent">Back to subscriptions</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Status" value={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} />
        <StatCard label="Usage Units" value={usageTotals.quantity} />
        <StatCard label="Overages" value={formatMoney(usageTotals.overage)} tone={usageTotals.overage > 0 ? "warn" : "default"} />
        <StatCard label="Credits" value={formatMoney(subscription.credit_balance ?? creditTotal)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <SectionCard title="Subscription Summary" icon="clipboard">
            <dl>
              <DetailRow label="Status"><StatusBadge label={SUBSCRIPTION_STATUS_LABEL[subscription.status] ?? subscription.status} tone={toneFor(SUBSCRIPTION_STATUS_TONE, subscription.status)} /></DetailRow>
              <DetailRow label="Client">{subscription.client?.company_name ?? subscription.client?.full_name ?? subscription.client?.email ?? "-"}</DetailRow>
              <DetailRow label="Aircraft">{subscription.aircraft?.tail_number ?? "-"}</DetailRow>
              <DetailRow label="Plan">{subscription.plan?.name ?? "-"}</DetailRow>
              <DetailRow label="Tier">{subscription.tier?.name ?? "-"}</DetailRow>
              <DetailRow label="Cadence">{subscription.billing_cadence}</DetailRow>
              <DetailRow label="Start">{formatDate(subscription.start_date)}</DetailRow>
              <DetailRow label="Renewal">{formatDate(subscription.renewal_date)}</DetailRow>
              <DetailRow label="Monthly">{formatMoney(subscription.custom_price ?? subscription.monthly_price)}</DetailRow>
              <DetailRow label="Annual">{formatMoney(subscription.annual_price)}</DetailRow>
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
                { header: "Mission", cell: (row) => row.mission ? <Link href={`/portal/admin/trips/${row.mission.id}`} className="text-accent hover:underline">{row.mission.ref}</Link> : "-" },
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
        </div>

        <div className="space-y-6">
          <SectionCard title="Status" icon="settings">
            <form action={updateSubscriptionStatus} className="space-y-4">
              <input type="hidden" name="subscription_id" value={subscription.id} />
              <SelectField label="Status" name="status" defaultValue={subscription.status} options={SUBSCRIPTION_STATUS.map((status) => ({ value: status.value, label: status.label }))} />
              <TextField label="End Date" name="end_date" type="date" defaultValue={subscription.end_date ?? ""} />
              <TextField label="Renewal Date" name="renewal_date" type="date" defaultValue={subscription.renewal_date ?? ""} />
              <TextAreaField label="Notes" name="notes" defaultValue={subscription.notes ?? ""} />
              <SubmitButton className="rounded-full" pendingText="Saving...">Save Status</SubmitButton>
            </form>
          </SectionCard>

          <SectionCard title="Add Usage" icon="radar">
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
              <SubmitButton className="rounded-full" pendingText="Adding...">Add Usage</SubmitButton>
            </form>
          </SectionCard>

          <SectionCard title="Add Credit" icon="wallet">
            <form action={addSubscriptionCredit} className="space-y-4">
              <input type="hidden" name="subscription_id" value={subscription.id} />
              <input type="hidden" name="client_id" value={subscription.client_id} />
              <SelectField label="Source" name="source_type" defaultValue="manual" options={SUBSCRIPTION_CREDIT_TYPES.map((type) => ({ value: type.value, label: type.label }))} />
              <TextField label="Amount" name="amount" type="number" step="0.01" required />
              <TextField label="Expires" name="expires_at" type="date" />
              <TextAreaField label="Description" name="description" />
              <SubmitButton className="rounded-full" pendingText="Adding...">Add Credit</SubmitButton>
            </form>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
