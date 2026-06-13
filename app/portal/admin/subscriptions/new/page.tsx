import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { createClientSubscription } from "@/app/portal/actions/subscriptions";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listAllAircraft, listClients, listSubscriptionPlans } from "@/lib/portal/queries";
import { SUBSCRIPTION_STATUS } from "@/lib/portal/constants";

export const metadata = { title: "New Subscription - Admin Portal" };

export default async function NewSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [clients, aircraft, plans] = await Promise.all([listClients(), listAllAircraft(), listSubscriptionPlans()]);
  const tierOptions = plans.flatMap((plan) =>
    plan.tiers.map((tier) => ({
      value: tier.id,
      label: `${plan.name} / ${tier.name}`,
    })),
  );

  return (
    <PortalShell role="admin" user={user}>
      {params.error ? <Notice tone="danger">Subscription could not be created. Check required fields.</Notice> : null}
      <PageHeader
        eyebrow="AMG Billing"
        title="Create Subscription"
        description="Assign an AMG support plan to a client, optionally tied to an aircraft."
        actions={<Link href="/portal/admin/subscriptions" className="text-xs text-muted-foreground hover:text-accent">Back to subscriptions</Link>}
      />

      <form action={createClientSubscription} className="space-y-6">
        <SectionCard title="Client & Plan" icon="building">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Client"
              name="client_id"
              required
              defaultValue=""
              options={[{ value: "", label: "Select client..." }, ...clients.map((client) => ({ value: client.id, label: client.company_name ?? client.full_name ?? client.email }))]}
            />
            <SelectField
              label="Aircraft"
              name="aircraft_id"
              defaultValue=""
              options={[{ value: "", label: "No specific aircraft" }, ...aircraft.map((item) => ({ value: item.id, label: `${item.tail_number} - ${item.client?.company_name ?? item.client?.full_name ?? "Client"}` }))]}
            />
            <SelectField
              label="Plan"
              name="plan_id"
              required
              defaultValue=""
              options={[{ value: "", label: "Select plan..." }, ...plans.map((plan) => ({ value: plan.id, label: plan.name }))]}
            />
            <SelectField
              label="Tier"
              name="tier_id"
              defaultValue=""
              options={[{ value: "", label: "Custom / no tier" }, ...tierOptions]}
            />
            <SelectField label="Status" name="status" defaultValue="active" options={SUBSCRIPTION_STATUS.map((status) => ({ value: status.value, label: status.label }))} />
            <SelectField label="Billing Cadence" name="billing_cadence" defaultValue="monthly" options={[{ value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual" }]} />
          </div>
        </SectionCard>

        <SectionCard title="Dates & Pricing" icon="wallet">
          <div className="grid gap-4 md:grid-cols-3">
            <TextField label="Start Date" name="start_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            <TextField label="End Date" name="end_date" type="date" />
            <TextField label="Renewal Date" name="renewal_date" type="date" />
            <TextField label="Monthly Price" name="monthly_price" type="number" min="0" step="0.01" />
            <TextField label="Annual Price" name="annual_price" type="number" min="0" step="0.01" />
            <TextField label="Custom Price" name="custom_price" type="number" min="0" step="0.01" />
          </div>
        </SectionCard>

        <SectionCard title="Allowances & Credits" icon="clipboard">
          <div className="grid gap-4 md:grid-cols-4">
            <TextField label="Included Flights" name="included_flights" type="number" min="0" step="0.01" />
            <TextField label="MX Repositions" name="included_mx_repositions" type="number" min="0" step="0.01" />
            <TextField label="Admin Hours" name="included_admin_hours" type="number" min="0" step="0.01" />
            <TextField label="Starting Credit Balance" name="credit_balance" type="number" step="0.01" />
          </div>
          <div className="mt-4">
            <TextAreaField label="Internal Notes" name="notes" />
          </div>
        </SectionCard>

        <SubmitButton className="rounded-full" pendingText="Creating...">Create Subscription</SubmitButton>
      </form>
    </PortalShell>
  );
}
