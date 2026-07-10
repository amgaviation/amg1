import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { logAuditEvent } from "@/lib/portal/audit";
import { getBillingSettings } from "@/lib/portal/billing-config";
import { getStripeBillingDiagnostics } from "@/lib/portal/stripe-mode";
import { DetailRow, Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { CheckboxField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import {
  billingSettingsConfirmed,
  confirmBillingSettingsAccess,
  updateBillingSettings,
} from "@/app/portal/actions/billing-settings";

export const metadata = { title: "Billing Settings - Admin Portal" };

export default async function AdminBillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("admin", "settings");
  const params = await searchParams;
  const confirmed = await billingSettingsConfirmed();
  const [settings, stripeDiagnostics] = await Promise.all([
    getBillingSettings(),
    getStripeBillingDiagnostics(),
  ]);
  await logAuditEvent({
    actor: user,
    action: "stripe_config_checked",
    detail: `Checked Stripe billing configuration: mode=${stripeDiagnostics.mode}, live_ready=${stripeDiagnostics.liveReady ? "yes" : "no"}`,
    entityType: "billing_settings",
    entityId: "global",
  });

  return (
    <>
      {params.success === "confirmed" ? <Notice tone="success">Billing settings unlocked for this session.</Notice> : null}
      {params.success === "saved" ? <Notice tone="success">Billing settings saved for future documents.</Notice> : null}
      {params.error === "confirm" ? <Notice tone="danger">Confirm your admin password before editing billing settings.</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before saving billing settings.</Notice> : null}

      <PageHeader
        eyebrow="Admin Settings"
        title="Billing Settings"
        description="Company identity, payment instructions, document terms, and quote-to-invoice behavior."
        actions={<Link href="/portal/admin/settings" className="text-xs text-[var(--deck-text-2)] hover:text-[var(--deck-accent-ink)]">Back to settings</Link>}
      />

      <SectionCard title="Stripe Live Readiness" icon="wallet">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="Detected Mode">
            <StatusBadge
              label={stripeDiagnostics.mode}
              tone={stripeDiagnostics.mode === "live" ? "success" : stripeDiagnostics.mode === "test" ? "warn" : "danger"}
            />
          </DetailRow>
          <DetailRow label="Live Ready">
            <StatusBadge label={stripeDiagnostics.liveReady ? "Yes" : "No"} tone={stripeDiagnostics.liveReady ? "success" : "danger"} />
          </DetailRow>
          <DetailRow label="Secret Key Present">{stripeDiagnostics.secretKeyPresent ? "Yes" : "No"}</DetailRow>
          <DetailRow label="Webhook Secret Present">{stripeDiagnostics.webhookSecretPresent ? "Yes" : "No"}</DetailRow>
          <DetailRow label="Publishable Key Present">{stripeDiagnostics.publishableKeyPresent ? "Yes" : "No"}</DetailRow>
          <DetailRow label="Site URL">{stripeDiagnostics.siteUrlPresent ? stripeDiagnostics.siteUrl : "Missing"}</DetailRow>
          <DetailRow label="Plans Missing Live Prices">{String(stripeDiagnostics.missingLivePriceCount)}</DetailRow>
          <DetailRow label="Plans Missing Test Prices">{String(stripeDiagnostics.missingTestPriceCount)}</DetailRow>
          <DetailRow label="Last Webhook">{stripeDiagnostics.lastWebhookReceivedAt ?? "None recorded"}</DetailRow>
          <DetailRow label="Last Webhook Status">{stripeDiagnostics.lastWebhookStatus ?? "-"}</DetailRow>
          <DetailRow label="Last Webhook Type">{stripeDiagnostics.lastWebhookType ?? "-"}</DetailRow>
          <DetailRow label="Webhook Endpoint">/api/webhooks/stripe</DetailRow>
        </div>
        <Notice tone={stripeDiagnostics.mode === "live" ? "success" : "warn"}>
          Production must use live Stripe keys, the live webhook secret, the production site URL, and live Price IDs for every active subscription tier.
        </Notice>
      </SectionCard>

      {!confirmed ? (
        <SectionCard title="Protected Access" icon="settings">
          <form action={confirmBillingSettingsAccess} className="max-w-md space-y-4">
            <TextField
              label="Admin Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              hint="Required before payment instructions or document terms can be changed."
            />
            <SubmitButton pendingText="Confirming...">Unlock Billing Settings</SubmitButton>
          </form>
        </SectionCard>
      ) : (
        <form action={updateBillingSettings} className="space-y-6">
          <SectionCard title="Company Identity" icon="settings">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Company Name" name="company_name" defaultValue={settings.company_name} required />
              <TextField label="Legal Name" name="company_legal_name" defaultValue={settings.company_legal_name ?? ""} />
              <TextField label="Billing Email" name="company_email" type="email" defaultValue={settings.company_email ?? ""} />
              <TextField label="Billing Phone" name="company_phone" defaultValue={settings.company_phone ?? ""} />
              <TextField label="Logo Path" name="logo_path" defaultValue={settings.logo_path} />
              <TextAreaField label="Company Address" name="company_address" defaultValue={settings.company_address ?? ""} />
            </div>
          </SectionCard>

          <SectionCard title="Payment Instructions" icon="wallet">
            <Notice tone="info">
              Do not enter full credit card numbers, CVV codes, bank account numbers, or routing numbers. AMG does not
              process payment card or bank account payments through this website or portal.
            </Notice>
            <div className="grid gap-4 md:grid-cols-2">
              <TextAreaField label="General Instructions" name="payment_instructions" defaultValue={settings.payment_instructions ?? ""} />
              <TextAreaField label="Wire Instructions" name="wire_instructions" defaultValue={settings.wire_instructions ?? ""} />
              <TextAreaField label="ACH Instructions" name="ach_instructions" defaultValue={settings.ach_instructions ?? ""} />
              <TextAreaField label="Check Instructions" name="check_instructions" defaultValue={settings.check_instructions ?? ""} />
              <TextField label="Default Tax Rate" name="tax_rate" type="number" min="0" step="0.0001" defaultValue={String(settings.tax_rate)} />
              <TextField label="Default Deposit Percent" name="default_deposit_percent" type="number" min="0" step="0.0001" defaultValue={String(settings.default_deposit_percent)} />
            </div>
          </SectionCard>

          <SectionCard title="Document Terms" icon="receipt">
            <div className="grid gap-4 md:grid-cols-2">
              <TextAreaField label="Quote Terms" name="quote_terms" defaultValue={settings.quote_terms ?? ""} />
              <TextAreaField label="Invoice Terms" name="invoice_terms" defaultValue={settings.invoice_terms ?? ""} />
              <TextAreaField label="Quote Disclaimer" name="quote_disclaimer" defaultValue={settings.quote_disclaimer ?? ""} />
              <TextAreaField label="Invoice Disclaimer" name="invoice_disclaimer" defaultValue={settings.invoice_disclaimer ?? ""} />
              <TextAreaField label="Receipt Disclaimer" name="receipt_disclaimer" defaultValue={settings.receipt_disclaimer ?? ""} />
              <CheckboxField
                label="Automatically send invoice after quote approval"
                name="auto_send_invoice_on_quote_approval"
                defaultChecked={settings.auto_send_invoice_on_quote_approval}
              />
              <CheckboxField
                label="Automatically send overdue payment reminders to clients (T+3 / T+7 / T+14 dunning)"
                name="dunning_enabled"
                defaultChecked={settings.dunning_enabled}
              />
            </div>
          </SectionCard>

          <SubmitButton pendingText="Saving...">Save Billing Settings</SubmitButton>
        </form>
      )}
    </>
  );
}
