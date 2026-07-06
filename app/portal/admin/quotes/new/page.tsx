import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { createQuote } from "@/app/portal/actions/quotes";
import { listAllMissions, listClients } from "@/lib/portal/queries";
import { BILLING_COST_TYPES, PDF_TEMPLATES, QUOTE_CATEGORIES } from "@/lib/portal/constants";

export const metadata = { title: "New Quote - Admin Portal" };

function LineItemRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1.2fr_1.5fr_.7fr_.7fr_.8fr]">
          <SelectField
            label="Category"
            name="category[]"
            defaultValue={index === 0 ? "Crew Services" : ""}
            options={[{ value: "", label: "No line" }, ...QUOTE_CATEGORIES.map((item) => ({ value: item, label: item }))]}
          />
          <TextField label="Description" name="description[]" placeholder="Pilot day rate, airline positioning, FBO handling..." />
          <TextField label="Qty" name="quantity[]" type="number" min="0" step="0.01" defaultValue={index === 0 ? "1" : ""} />
          <TextField label="Unit Price" name="unit_price[]" type="number" min="0" step="0.01" />
          <SelectField
            label="Cost Type"
            name="cost_type[]"
            defaultValue="Fixed Fee"
            options={BILLING_COST_TYPES.map((item) => ({ value: item, label: item }))}
          />
          <TextField label="Unit" name="unit[]" placeholder="day, trip, each" />
          <TextAreaField label="Client Note" name="client_notes[]" />
          <TextAreaField label="Internal Note" name="internal_notes[]" />
        </div>
      ))}
    </div>
  );
}

export default async function NewQuotePage() {
  const user = await requireRolePermission("admin", "quotes", "add");
  const [clients, missions] = await Promise.all([listClients(), listAllMissions()]);

  return (
    <>
      <PageHeader
        eyebrow="AMG Billing"
        title="New Quote"
        description="Create a mission-linked, client-linked, or standalone aviation support quote."
        actions={<Link href="/portal/admin/quotes" className="text-xs text-muted-foreground hover:text-accent">Back to quotes</Link>}
      />

      <form action={createQuote} className="space-y-6">
        <SectionCard title="Client & Mission" icon="building">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Existing Mission / Trip Request"
              name="mission_id"
              defaultValue=""
              options={[{ value: "", label: "Standalone or client-only quote" }, ...missions.map((mission) => ({ value: mission.id, label: `${mission.ref} - ${mission.departure_airport} to ${mission.arrival_airport}` }))]}
            />
            <ClientPickerField label="Existing Client" clients={clients} placeholder="Search company, name, or email — or leave blank for manual recipient" />
            <TextField label="Manual Client Name" name="manual_client_name" />
            <TextField label="Manual Company" name="manual_client_company" />
            <TextField label="Recipient Email" name="recipient_email" type="email" />
            <TextField label="CC Emails" name="cc_emails" placeholder="ops@example.com, accounting@example.com" />
            <TextField label="Phone" name="manual_client_phone" />
            <TextField label="Billing Contact" name="billing_contact_name" />
          </div>
        </SectionCard>

        <SectionCard title="Aircraft / Route / Scope" icon="plane">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Aircraft Make / Model" name="aircraft_summary" />
            <TextField label="Tail Number" name="tail_number" />
            <TextField label="Route" name="route_summary" placeholder="KPBI - KTEB - KPBI" />
            <TextField label="Requested Timing" name="requested_timing" />
            <div className="md:col-span-2">
              <TextAreaField label="Service / Scope" name="service_scope" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Line Items" icon="receipt">
          <LineItemRows />
        </SectionCard>

        <SectionCard title="Deposit & Terms" icon="wallet">
          <div className="grid gap-4 md:grid-cols-2">
            <CheckboxField label="Deposit required" name="deposit_required" />
            <TextField label="Deposit Amount" name="deposit_amount" type="number" min="0" step="0.01" />
            <TextField label="Deposit Percent" name="deposit_percent" type="number" min="0" step="0.01" />
            <TextField label="Deposit Due Date" name="deposit_due_date" type="date" />
            <TextField label="Expiration Date" name="expires_at" type="date" />
            <TextField label="Balance Due Timing" name="balance_due_timing" />
            <TextAreaField label="Deposit Terms" name="deposit_terms" />
            <TextAreaField label="Payment Terms" name="payment_terms" />
          </div>
        </SectionCard>

        <SectionCard title="PDF Presentation" icon="fileText">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Template" name="pdf_template" defaultValue="standard" options={PDF_TEMPLATES.map((item) => ({ value: item.value, label: item.label }))} />
            <TextField label="Discount" name="discount_total" type="number" min="0" step="0.01" />
            <TextField label="Manual Tax" name="tax_total" type="number" min="0" step="0.01" defaultValue="0" />
            <TextAreaField label="Client Notes" name="client_notes" />
            <TextAreaField label="Internal Notes" name="internal_notes" />
            <TextAreaField label="Opening Note" name="opening_note" />
            <TextAreaField label="Closing Note" name="closing_note" />
            <TextAreaField label="Footer Note" name="footer_note" />
            <CheckboxField label="Show tax line" name="show_tax_line" />
            <CheckboxField label="Group line items by category" name="group_line_items_by_category" />
          </div>
        </SectionCard>

        <div className="flex gap-3">
          <SubmitButton name="intent" value="draft" pendingText="Saving...">Save Draft</SubmitButton>
          <SubmitButton name="intent" value="send" pendingText="Sending...">Send Quote PDF</SubmitButton>
        </div>
      </form>
    </>
  );
}
