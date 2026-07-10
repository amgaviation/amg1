import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { createQuote } from "@/app/portal/actions/quotes";
import { listAllMissions, listClients } from "@/lib/portal/queries";
import { listQuoteTemplates, getQuoteTemplate } from "@/lib/portal/quote-templates";
import { BILLING_COST_TYPES, PDF_TEMPLATES, QUOTE_CATEGORIES } from "@/lib/portal/constants";
import { LineItemsEditor, type LineItemDefault } from "@/components/portal/admin/line-items-editor";

export const metadata = { title: "New Quote - Admin Portal" };

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  await requireRolePermission("admin", "quotes", "add");
  const { template: templateId } = await searchParams;
  const [clients, missions, templates] = await Promise.all([
    listClients(),
    listAllMissions(),
    listQuoteTemplates(),
  ]);

  // Applying a template seeds the line-item editor (and default notes) entirely
  // server-side via the ?template= param — no extra client wiring needed.
  const template = templateId ? await getQuoteTemplate(templateId) : null;
  const seededItems: LineItemDefault[] | undefined = template
    ? template.items.map((it) => ({
        category: it.category,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        unit: it.unit,
        cost_type: it.cost_type,
      }))
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="AMG Billing"
        title="New Quote"
        description="Create a mission-linked, client-linked, or standalone aviation support quote."
        actions={<Link href="/portal/admin/quotes" className="text-xs text-[var(--deck-text-2)] hover:text-[var(--deck-accent-ink)]">Back to quotes</Link>}
      />

      {/* GET form: choosing a template reloads this page with ?template=<id>, which
          seeds the line items below server-side. Kept separate from the POST
          quote form (forms cannot nest). */}
      <SectionCard
        title="Start from Template"
        icon="receipt"
        description="Optional — seed the line items from a saved template, then adjust as needed."
        actions={
          <Link href="/portal/admin/quotes/templates" className="text-xs text-[var(--deck-text-2)] hover:text-[var(--deck-accent-ink)]">
            Manage templates
          </Link>
        }
      >
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <SelectField
              label="Template"
              name="template"
              defaultValue={templateId ?? ""}
              options={[
                { value: "", label: "Start blank" },
                ...templates.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.lineItemCount} ${item.lineItemCount === 1 ? "line" : "lines"})`,
                })),
              ]}
            />
          </div>
          <SubmitButton variant="outline" pendingText="Loading...">Apply template</SubmitButton>
        </form>
        {template ? (
          <p className="mt-3 text-xs text-[var(--deck-accent-ink)]">
            Applied <span className="font-medium">{template.name}</span> — {template.items.length}{" "}
            {template.items.length === 1 ? "line item" : "line items"} loaded below. You can still edit them before saving.
          </p>
        ) : null}
      </SectionCard>

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
          <LineItemsEditor
            key={templateId ?? "blank"}
            categories={[...QUOTE_CATEGORIES]}
            costTypes={[...BILLING_COST_TYPES]}
            showCostType
            showNotes
            defaultCategory="Crew Services"
            initialItems={seededItems}
          />
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
            <TextAreaField label="Client Notes" name="client_notes" defaultValue={template?.client_notes ?? ""} />
            <TextAreaField label="Internal Notes" name="internal_notes" defaultValue={template?.internal_notes ?? ""} />
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
