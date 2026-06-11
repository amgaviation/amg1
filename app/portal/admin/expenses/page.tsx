import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { SelectField, TextAreaField } from "@/components/portal/ui/fields";
import { reviewExpense } from "@/app/portal/actions/admin";
import { listAllExpenses } from "@/lib/portal/queries";
import { EXPENSE_CATEGORY_LABEL, EXPENSE_STATUS, EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Expenses - Admin Portal" };

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("admin");
  const params = await searchParams;
  const expenses = await listAllExpenses();
  return (
    <PortalShell role="admin" user={user}>
      {params.success ? <Notice tone="success">Expense review saved.</Notice> : null}
      <PageHeader eyebrow="AMG Operations" title="Expenses" description="Review, approve, reject, and mark crew expenses as paid." />
      <SectionCard title="Expense Review" icon="wallet">
        <DataTable
          rows={expenses}
          getKey={(row) => row.id}
          emptyLabel="No expenses submitted."
          columns={[
            { header: "Crew", cell: (row) => row.crew?.full_name ?? row.crew?.email ?? "-" },
            { header: "Mission", cell: (row) => row.mission?.ref ?? "General" },
            { header: "Category", cell: (row) => EXPENSE_CATEGORY_LABEL[row.category] ?? row.category },
            { header: "Date", cell: (row) => formatDate(row.expense_date) },
            { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={EXPENSE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(EXPENSE_STATUS_TONE, row.status)} /> },
            { header: "Review", cell: (row) => (
              <form action={reviewExpense} className="grid min-w-56 gap-2">
                <input type="hidden" name="expense_id" value={row.id} />
                <SelectField label="Status" name="status" defaultValue={row.status} options={EXPENSE_STATUS.map((s) => ({ value: s.value, label: s.label }))} />
                <TextAreaField label="Notes" name="review_notes" defaultValue={row.review_notes ?? ""} />
                <SubmitButton variant="outline" className="rounded-full" pendingText="Saving...">Save Review</SubmitButton>
              </form>
            ) },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
