import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { reviewExpense } from "@/app/portal/actions/admin";
import { addExpenseToInvoice } from "@/app/portal/actions/invoices";
import { listAllExpenses, listAllInvoices } from "@/lib/portal/queries";
import { EXPENSE_CATEGORY_LABEL, EXPENSE_STATUS, EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Expenses - Admin Portal" };

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const [expenses, invoices] = await Promise.all([listAllExpenses(), listAllInvoices()]);
  return (
    <>
      {params.success ? <Notice tone="success">Expense review saved.</Notice> : null}
      {params.error === "already_billed" ? <Notice tone="danger">That expense is already linked to an invoice.</Notice> : null}
      {params.error === "not_billable" ? <Notice tone="danger">Only approved client-billable expenses can be added to invoices.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Expenses" description="Review, approve, reject, and mark crew expenses as paid." />
      <SectionCard title="Expense Review" icon="wallet">
        <DataTable
          rows={expenses}
          getKey={(row) => row.id}
          emptyLabel="No expenses submitted."
          columns={[
            { header: "Crew", cell: (row) => row.crew?.full_name ?? row.crew?.email ?? "-" },
            { header: "Mission", cell: (row) => row.mission?.ref ?? "General" },
            { header: "Category", cell: (row) => <div>{EXPENSE_CATEGORY_LABEL[row.category] ?? row.category}<p className="text-xs text-muted-foreground">{row.merchant ?? "No merchant"}</p></div> },
            { header: "Date", cell: (row) => formatDate(row.expense_date) },
            { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={EXPENSE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(EXPENSE_STATUS_TONE, row.status)} /> },
            { header: "Review", cell: (row) => (
              <form action={reviewExpense} className="grid min-w-56 gap-2">
                <input type="hidden" name="expense_id" value={row.id} />
                <SelectField label="Status" name="status" defaultValue={row.status} options={EXPENSE_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
                <TextField label="Approved Amount" name="approved_amount" type="number" min="0" step="0.01" defaultValue={row.approved_amount ?? row.amount} />
                <SelectField label="Reimbursable" name="reimbursable" defaultValue={row.reimbursable ? "true" : "false"} options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} />
                <SelectField label="Client Billable" name="billable_to_client" defaultValue={row.billable_to_client ? "true" : "false"} options={[{ value: "false", label: "No" }, { value: "true", label: "Yes" }]} />
                <TextAreaField label="Notes" name="review_notes" defaultValue={row.review_notes ?? ""} />
                <SubmitButton variant="outline" className="rounded-full" pendingText="Saving...">Save Review</SubmitButton>
              </form>
            ) },
            { header: "Billing", cell: (row) => (
              <form action={addExpenseToInvoice} className="grid min-w-56 gap-2">
                <input type="hidden" name="expense_id" value={row.id} />
                <SelectField label="Invoice" name="invoice_id" defaultValue="" options={[{ value: "", label: "Select invoice..." }, ...invoices.map((invoice) => ({ value: invoice.id, label: `${invoice.invoice_number} - ${invoice.client?.company_name ?? invoice.client?.full_name ?? invoice.client?.email ?? "Client"}` }))]} />
                <SubmitButton variant="outline" className="rounded-full" pendingText="Adding...">Add to Invoice</SubmitButton>
              </form>
            ) },
          ]}
        />
      </SectionCard>
    </>
  );
}
