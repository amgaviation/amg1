import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { createClientSubscription } from "@/app/portal/actions/subscriptions";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listAllAircraft, listClients, listSubscriptionPlans } from "@/lib/portal/queries";
import { CustomSubscriptionForm } from "./custom-subscription-form";

export const metadata = { title: "New Subscription - Admin Portal" };

export default async function NewSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRolePermission("admin", "subscriptions", "add");
  const params = await searchParams;
  const [clients, aircraft, plans] = await Promise.all([listClients(), listAllAircraft(), listSubscriptionPlans()]);
  const tierOptions = plans.flatMap((plan) =>
    plan.tiers.map((tier) => ({
      value: tier.id,
      label: `${plan.name} / ${tier.name}`,
    })),
  );

  return (
    <>
      {params.error === "missing-price" ? (
        <Notice tone="danger">This plan is not connected to a Stripe price yet.</Notice>
      ) : params.error === "missing-live-price" ? (
        <Notice tone="danger">Stripe is running in live mode, but this plan is missing a live Stripe Price ID.</Notice>
      ) : params.error === "missing-test-price" ? (
        <Notice tone="danger">Stripe is running in test mode, but this plan is configured only with a live Price ID.</Notice>
      ) : params.error === "test-price-live-mode" ? (
        <Notice tone="danger">Stripe is running in live mode, but a test Stripe Price ID was selected.</Notice>
      ) : params.error === "live-price-test-mode" ? (
        <Notice tone="danger">Stripe is running in test mode, but a live Stripe Price ID was selected.</Notice>
      ) : params.error === "stripe-mode" ? (
        <Notice tone="danger">Stripe secret key prefix is not recognized. Use a valid test or live Stripe secret key.</Notice>
      ) : params.error === "configuration" ? (
        <Notice tone="danger">Stripe is not configured. Add STRIPE_SECRET_KEY before creating billing subscriptions.</Notice>
      ) : params.error === "custom-missing" ? (
        <Notice tone="danger">Custom subscriptions need a client, a name, and an amount.</Notice>
      ) : params.error === "custom-interval" ? (
        <Notice tone="danger">Choose a valid billing interval for the custom subscription.</Notice>
      ) : params.error ? (
        <Notice tone="danger">{decodeURIComponent(params.error)}</Notice>
      ) : null}
      <PageHeader
        eyebrow="AMG Billing"
        title="Create Stripe Subscription Setup"
        description="Create a pending portal mirror and send a Stripe-hosted subscription setup link to the client."
        actions={<Link href="/portal/admin/subscriptions" className="text-xs text-muted-foreground hover:text-accent">Back to subscriptions</Link>}
      />

      <form action={createClientSubscription} className="space-y-6">
        <SectionCard title="Client & Plan" icon="building">
          <div className="grid gap-4 md:grid-cols-2">
            <ClientPickerField clients={clients} required />
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

        <SubmitButton pendingText="Creating...">Create Setup Link</SubmitButton>
      </form>

      <SectionCard
        title="Custom Subscription"
        icon="pencil"
        description="One-off terms outside the standard plans: your own name, amount, interval, optional trial, and end date or cycle count. Bills through Stripe with an ad-hoc price — no new Products in the dashboard."
      >
        <CustomSubscriptionForm clients={clients} />
      </SectionCard>
    </>
  );
}
