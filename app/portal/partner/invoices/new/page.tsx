import { requireRole } from "@/lib/portal/session";
import { PageHeader, Notice } from "@/components/portal/ui/primitives";
import { VendorInvoiceForm } from "@/components/portal/vendor-invoice-form";
import { submitVendorInvoice } from "@/app/portal/actions/vendor-invoices";
import { listMissionOptionsForContractor } from "@/lib/portal/vendor-invoices";

export const metadata = { title: "New Invoice - Partner Portal" };

const ERRORS: Record<string, string> = {
  "bill-from": "Enter the name this invoice bills from.",
  lines: "Add at least one line item with a valid amount.",
  mission: "That mission is not linked to your account.",
  "receipt-file": "Receipts must be PDF or image files up to 25 MB.",
  "receipt-upload": "A receipt file could not be uploaded. Try again.",
  save: "The invoice could not be saved. Try again.",
};

export default async function PartnerNewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole("partner");
  const params = await searchParams;
  const missions = await listMissionOptionsForContractor(user.id, "partner");
  return (
    <>
      {params.error && ERRORS[params.error] ? (
        <Notice tone="danger">{ERRORS[params.error]}</Notice>
      ) : null}
      <PageHeader
        eyebrow="Partner"
        title="New Invoice to AMG"
        description="Bill for your services as yourself or your company entity. AMG is notified as soon as you submit."
      />
      <VendorInvoiceForm
        action={submitVendorInvoice}
        backTo="/portal/partner/invoices/new"
        missionOptions={missions}
        defaults={{
          bill_from_name: user.name,
          bill_from_company: user.companyName ?? "",
          bill_from_email: user.email,
          bill_from_phone: user.phone ?? "",
        }}
      />
    </>
  );
}
