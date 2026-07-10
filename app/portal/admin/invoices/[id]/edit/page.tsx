import Link from "next/link";
import { LineItemsEditor } from "@/components/portal/admin/line-items-editor";
import { notFound, redirect } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { updateInvoiceDraft } from "@/app/portal/actions/invoices";
import { getInvoiceDetail } from "@/lib/portal/queries";
import { BILLING_COST_TYPES, INVOICE_STATUS, PDF_TEMPLATES, QUOTE_CATEGORIES } from "@/lib/portal/constants";

export const metadata = { title: "Edit Invoice Draft - Admin Portal" };

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRolePermission("admin", "invoices");
  const { id } = await params;
  const flash = await searchParams;
  const invoice = await getInvoiceDetail(id);
  if (!invoice) notFound();
  if (!["draft", "ready_to_send"].includes(invoice.status)) redirect(`/portal/admin/invoices/${invoice.id}?error=locked`);

  const editableStatuses = INVOICE_STATUS.filter((status) => ["draft", "ready_to_send"].includes(status.value));

  return (
    <>
      {flash.error === "save" ? <Notice tone="danger">Invoice draft could not be saved.</Notice> : null}
      <PageHeader
        eyebrow="Invoice Draft"
        title={`Edit ${invoice.invoice_number}`}
        description="Draft invoices can be adjusted before they are sent or paid."
        actions={<Link href={`/portal/admin/invoices/${invoice.id}`} className="text-xs text-muted-foreground hover:text-accent">Back to invoice</Link>}
      />

      <form action={updateInvoiceDraft} className="space-y-6">
        <input type="hidden" name="invoice_id" value={invoice.id} />

        <SectionCard title="Recipient & Timing" icon="building">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Recipient Email Override" name="recipient_email" type="email" defaultValue={(invoice as any).recipient_email ?? ""} />
            <TextField label="CC Emails" name="cc_emails" defaultValue={((invoice as any).cc_emails ?? []).join(", ")} />
            <TextField label="Due Date" name="due_date" type="date" defaultValue={String(invoice.due_date ?? "").slice(0, 10)} />
            <SelectField
              label="Draft Status"
              name="status"
              defaultValue={invoice.status}
              options={editableStatuses.map((status) => ({ value: status.value, label: status.label }))}
            />
          </div>
        </SectionCard>

        <SectionCard title="Line Items" icon="receipt">
          <LineItemsEditor
            categories={[...QUOTE_CATEGORIES]}
            costTypes={[...BILLING_COST_TYPES]}
            showCostType
            showNotes
            initialItems={invoice.items.map((item) => ({
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

        <SectionCard title="Totals & Terms" icon="wallet">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Discount" name="discount_total" type="number" min="0" step="0.01" defaultValue={String((invoice as any).discount_total ?? invoice.discount ?? 0)} />
            <TextField label="Manual Tax" name="tax_total" type="number" min="0" step="0.01" defaultValue={String((invoice as any).tax_total ?? invoice.tax ?? 0)} />
            <TextAreaField label="Terms" name="terms" defaultValue={invoice.terms ?? ""} />
            <TextAreaField label="Payment Instructions" name="payment_instructions" defaultValue={(invoice as any).payment_instructions ?? ""} />
            <TextAreaField label="Client Notes" name="client_notes" defaultValue={invoice.client_notes ?? ""} />
            <TextAreaField label="Internal Notes" name="internal_notes" defaultValue={invoice.internal_notes ?? ""} />
          </div>
        </SectionCard>

        <SectionCard title="PDF Presentation" icon="file">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Template" name="pdf_template" defaultValue={(invoice as any).pdf_template ?? "standard"} options={PDF_TEMPLATES.map((item) => ({ value: item.value, label: item.label }))} />
            <TextAreaField label="Opening Note" name="opening_note" defaultValue={(invoice as any).opening_note ?? ""} />
            <TextAreaField label="Closing Note" name="closing_note" defaultValue={(invoice as any).closing_note ?? ""} />
            <TextAreaField label="Footer Note" name="footer_note" defaultValue={(invoice as any).footer_note ?? ""} />
          </div>
        </SectionCard>

        <SubmitButton pendingText="Saving...">Save Invoice Draft</SubmitButton>
      </form>
    </>
  );
}
