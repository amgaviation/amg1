import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { getBillingSettings } from "@/lib/portal/billing-config";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
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
  const user = await requireRole("admin");
  const params = await searchParams;
  const confirmed = await billingSettingsConfirmed();
  const settings = await getBillingSettings();

  return (
    <PortalShell role="admin" user={user}>
      {params.success === "confirmed" ? <Notice tone="success">Billing settings unlocked for this session.</Notice> : null}
      {params.success === "saved" ? <Notice tone="success">Billing settings saved for future documents.</Notice> : null}
      {params.error === "confirm" ? <Notice tone="danger">Confirm your admin password before editing billing settings.</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before saving billing settings.</Notice> : null}

      <PageHeader
        eyebrow="Admin Settings"
        title="Billing Settings"
        description="Company identity, payment instructions, document terms, and quote-to-invoice behavior."
        actions={<Link href="/portal/admin/settings" className="text-xs text-muted-foreground hover:text-accent">Back to settings</Link>}
      />

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
            <SubmitButton className="rounded-full" pendingText="Confirming...">Unlock Billing Settings</SubmitButton>
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
            </div>
          </SectionCard>

          <SubmitButton className="rounded-full" pendingText="Saving...">Save Billing Settings</SubmitButton>
        </form>
      )}
    </PortalShell>
  );
}
