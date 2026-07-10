import Link from "next/link";
import { LineItemsEditor } from "@/components/portal/admin/line-items-editor";
import { notFound, redirect } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { updateQuoteDraft } from "@/app/portal/actions/quotes";
import { getQuoteDetail, listAllMissions, listClients } from "@/lib/portal/queries";
import { BILLING_COST_TYPES, PDF_TEMPLATES, QUOTE_CATEGORIES } from "@/lib/portal/constants";

export const metadata = { title: "Edit Quote Draft - Admin Portal" };

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRolePermission("admin", "quotes");
  const { id } = await params;
  const [quote, clients, missions] = await Promise.all([getQuoteDetail(id), listClients(), listAllMissions()]);
  if (!quote) notFound();
  if (!["draft", "internal_review"].includes(quote.status)) redirect(`/portal/admin/quotes/${quote.id}?error=locked`);


  return (
    <>
      <PageHeader
        eyebrow="Quote Draft"
        title={`Edit ${quote.ref}`}
        description="Draft quote fields are editable until the quote is sent."
        actions={<Link href={`/portal/admin/quotes/${quote.id}`} className="text-xs text-muted-foreground hover:text-accent">Back to quote</Link>}
      />

      <form action={updateQuoteDraft} className="space-y-6">
        <input type="hidden" name="quote_id" value={quote.id} />
        <SectionCard title="Client & Mission" icon="building">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Mission / Trip Request"
              name="mission_id"
              defaultValue={quote.mission_id ?? ""}
              options={[{ value: "", label: "Standalone or client-only quote" }, ...missions.map((mission) => ({ value: mission.id, label: mission.ref }))]}
            />
            <ClientPickerField label="Existing Client" clients={clients} defaultValue={quote.client_id ?? ""} placeholder="Search company, name, or email — or leave blank for manual recipient" />
            <TextField label="Manual Client Name" name="manual_client_name" defaultValue={(quote as any).manual_client_name ?? ""} />
            <TextField label="Manual Company" name="manual_client_company" defaultValue={(quote as any).manual_client_company ?? ""} />
            <TextField label="Recipient Email" name="recipient_email" type="email" defaultValue={(quote as any).recipient_email ?? ""} />
            <TextField label="CC Emails" name="cc_emails" defaultValue={((quote as any).cc_emails ?? []).join(", ")} />
          </div>
        </SectionCard>

        <SectionCard title="Aircraft / Route / Scope" icon="plane">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Aircraft Make / Model" name="aircraft_summary" defaultValue={(quote as any).aircraft_summary ?? ""} />
            <TextField label="Tail Number" name="tail_number" defaultValue={(quote as any).tail_number ?? ""} />
            <TextField label="Route" name="route_summary" defaultValue={(quote as any).route_summary ?? ""} />
            <TextField label="Requested Timing" name="requested_timing" defaultValue={(quote as any).requested_timing ?? ""} />
            <div className="md:col-span-2">
              <TextAreaField label="Service / Scope" name="service_scope" defaultValue={(quote as any).service_scope ?? ""} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Line Items" icon="receipt">
          <LineItemsEditor
            categories={[...QUOTE_CATEGORIES]}
            costTypes={[...BILLING_COST_TYPES]}
            showCostType
            showNotes
            initialItems={quote.items.map((item) => ({
              category: item.category,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              unit: (item as any).unit,
              cost_type: (item as any).cost_type,
              client_notes: (item as any).client_notes,
              internal_notes: (item as any).internal_notes,
            }))}
          />
        </SectionCard>

        <SectionCard title="Deposit, Terms & PDF" icon="wallet">
          <div className="grid gap-4 md:grid-cols-2">
            <CheckboxField label="Deposit required" name="deposit_required" defaultChecked={(quote as any).deposit_required} />
            <TextField label="Deposit Amount" name="deposit_amount" type="number" min="0" step="0.01" defaultValue={String((quote as any).deposit_amount ?? 0)} />
            <TextField label="Deposit Percent" name="deposit_percent" type="number" min="0" step="0.01" defaultValue={String((quote as any).deposit_percent ?? "")} />
            <TextField label="Expiration Date" name="expires_at" type="date" defaultValue={String((quote as any).expires_at ?? "").slice(0, 10)} />
            <TextField label="Discount" name="discount_total" type="number" min="0" step="0.01" defaultValue={String((quote as any).discount_total ?? 0)} />
            <TextField label="Manual Tax" name="tax_total" type="number" min="0" step="0.01" defaultValue={String((quote as any).tax_total ?? 0)} />
            <SelectField label="Template" name="pdf_template" defaultValue={(quote as any).pdf_template ?? "standard"} options={PDF_TEMPLATES.map((item) => ({ value: item.value, label: item.label }))} />
            <TextAreaField label="Payment Terms" name="payment_terms" defaultValue={(quote as any).payment_terms ?? ""} />
            <TextAreaField label="Client Notes" name="client_notes" defaultValue={quote.client_notes ?? ""} />
            <TextAreaField label="Internal Notes" name="internal_notes" defaultValue={quote.internal_notes ?? ""} />
          </div>
        </SectionCard>

        <SubmitButton pendingText="Saving...">Save Draft</SubmitButton>
      </form>
    </>
  );
}
