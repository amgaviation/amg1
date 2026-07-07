import { redirect } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { PageHeader, Notice } from "@/components/portal/ui/primitives";
import { VendorInvoiceForm } from "@/components/portal/vendor-invoice-form";
import { updateVendorInvoice } from "@/app/portal/actions/vendor-invoices";
import {
  getVendorInvoice,
  listMissionOptionsForContractor,
  vendorInvoiceEditable,
} from "@/lib/portal/vendor-invoices";

export const metadata = { title: "Edit Invoice - Partner Portal" };

const ERRORS: Record<string, string> = {
  "bill-from": "Enter the name this invoice bills from.",
  lines: "Add at least one line item with a valid amount.",
  mission: "That mission is not linked to your account.",
  "receipt-file": "Receipts must be PDF or image files up to 25 MB.",
  "receipt-upload": "A receipt file could not be uploaded. Try again.",
  save: "The invoice could not be saved. Try again.",
};

export default async function PartnerEditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole("partner");
  const { id } = await params;
  const query = await searchParams;
  const detail = await getVendorInvoice(id);
  if (!detail || detail.invoice.submitter_id !== user.id) {
    redirect("/portal/partner/invoices?error=not-found");
  }
  if (!vendorInvoiceEditable(detail!.invoice.status)) {
    redirect(`/portal/partner/invoices?error=locked&record=${id}`);
  }
  const missions = await listMissionOptionsForContractor(user.id, "partner");
  const invoice = detail!.invoice;
  return (
    <>
      {query.error && ERRORS[query.error] ? (
        <Notice tone="danger">{ERRORS[query.error]}</Notice>
      ) : null}
      {invoice.status === "needs_changes" && invoice.review_notes ? (
        <Notice tone="warn">AMG requested changes: {invoice.review_notes}</Notice>
      ) : null}
      <PageHeader
        eyebrow="Partner"
        title={`Edit ${invoice.ref}`}
        description="Update and resubmit — AMG is notified and the invoice returns to their review queue."
      />
      <VendorInvoiceForm
        action={updateVendorInvoice}
        backTo={`/portal/partner/invoices/${id}/edit`}
        invoiceId={id}
        missionOptions={missions}
        submitLabel="Resubmit invoice"
        defaults={{
          bill_from_name: invoice.bill_from_name,
          bill_from_company: invoice.bill_from_company ?? "",
          bill_from_email: invoice.bill_from_email ?? "",
          bill_from_phone: invoice.bill_from_phone ?? "",
          bill_from_address: invoice.bill_from_address ?? "",
          bill_from_tax_id: invoice.bill_from_tax_id ?? "",
          invoice_number: invoice.invoice_number ?? "",
          invoice_date: invoice.invoice_date ?? "",
          due_date: invoice.due_date ?? "",
          mission_id: invoice.mission_id ?? "",
          notes: invoice.notes ?? "",
          payment_instructions: invoice.payment_instructions ?? "",
          lines: detail!.lines.map((line) => ({
            description: line.description,
            quantity: Number(line.quantity),
            unit_amount: Number(line.unit_amount),
          })),
        }}
      />
    </>
  );
}
