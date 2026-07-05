import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard, EmptyState, Notice, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { FileField, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { submitExpense } from "@/app/portal/actions/crew";
import { listExpensesForCrew, listMissionsForCrew } from "@/lib/portal/queries";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL, EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Expenses - Crew Portal" };

export default async function CrewExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("crew");
  const params = await searchParams;
  const [expenses, missions] = await Promise.all([listExpensesForCrew(user.id), listMissionsForCrew(user.id)]);

  const sum = (rows: typeof expenses) =>
    rows.reduce((total, expense) => total + Number(expense.amount ?? 0), 0);
  const awaiting = expenses.filter((e) => ["submitted", "under_review"].includes(e.status));
  const approvedRows = expenses.filter((e) =>
    ["approved", "partially_approved", "added_to_quote", "added_to_invoice"].includes(e.status)
  );
  const paidRows = expenses.filter((e) => ["reimbursed", "paid"].includes(e.status));
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const thisMonth = expenses.filter(
    (e) => (e.expense_date ?? e.created_at) >= monthStart.toISOString().slice(0, 10)
  );

  return (
    <>
      {params.success ? <Notice tone="success">Expense submitted for review.</Notice> : null}
      {params.error === "invalid" ? <Notice tone="danger">Enter a valid category and amount.</Notice> : null}
      {params.error === "forbidden" ? <Notice tone="danger">Select one of your assigned missions for mission-related expenses.</Notice> : null}
      {params.error === "upload" ? <Notice tone="danger">Receipt upload failed. Use a PDF, JPG, or PNG under 50 MB.</Notice> : null}
      {params.error === "payment-data" ? <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before submitting.</Notice> : null}

      <PageHeader eyebrow="Flight Crew" title="Expenses" description="Submit mission expenses with receipts for AMG review and payment tracking." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting review"
          value={formatMoney(sum(awaiting))}
          icon="clock"
          tone={awaiting.length ? "warn" : "default"}
          detail={`${awaiting.length} expense${awaiting.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Approved"
          value={formatMoney(sum(approvedRows))}
          icon="check"
          tone={approvedRows.length ? "info" : "default"}
          detail="Approved or added to billing"
        />
        <StatCard
          label="Reimbursed / paid"
          value={formatMoney(sum(paidRows))}
          icon="dollar"
          tone={paidRows.length ? "accent" : "default"}
        />
        <StatCard
          label="This month"
          value={formatMoney(sum(thisMonth))}
          icon="calendar"
          detail={`${thisMonth.length} submitted`}
        />
      </div>

      <SectionCard title="Submit Expense" icon="receipt">
        <Notice tone="info">
          Upload only receipts you are authorized to submit for review. Do not upload full card numbers, CVV codes, or
          unrelated sensitive data. Review the{" "}
          <Link href="/legal/document-upload-terms" className="font-semibold text-accent hover:underline">Document Upload Terms</Link>.
        </Notice>
        <form action={submitExpense} encType="multipart/form-data" className="grid gap-4 lg:grid-cols-4">
          <SelectField label="Mission" name="mission_id" defaultValue="" options={[{ value: "", label: "General / unassigned" }, ...missions.map((m) => ({ value: m.id, label: `${m.ref} - ${m.departure_airport ?? ""}-${m.arrival_airport ?? ""}` }))]} />
          <SelectField label="Category" name="category" required defaultValue="" placeholder="Select category..." options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
          <TextField label="Amount" name="amount" type="number" min="0" step="0.01" required />
          <TextField label="Merchant / Vendor" name="merchant" />
          <TextField label="Currency" name="currency" defaultValue="USD" />
          <TextField label="Tax / Tip" name="tax_amount" type="number" min="0" step="0.01" />
          <TextField label="Expense Date" name="expense_date" type="date" />
          <SelectField label="Reimbursable" name="reimbursable" defaultValue="true" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} />
          <SelectField label="Client Billable" name="billable_to_client" defaultValue="false" options={[{ value: "false", label: "No" }, { value: "true", label: "Yes" }]} />
          <div className="lg:col-span-2">
            <FileField label="Receipt" name="receipt" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
          <div className="lg:col-span-2">
            <TextAreaField label="Notes" name="notes" placeholder="Routing, hotel, ticket number, operational context..." />
          </div>
          <div>
            <SubmitButton pendingText="Submitting...">Submit Expense</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Expense History" icon="receipt">
        {expenses.length === 0 ? (
          <EmptyState icon="receipt" title="No expenses submitted" description="Submit expenses above after mission travel or operational support." />
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="grid gap-3 rounded-md border border-border bg-background/50 p-4 sm:grid-cols-[1fr_auto_auto]">
                <div>
                  <p className="text-sm font-semibold">{EXPENSE_CATEGORY_LABEL[expense.category] ?? expense.category} - {expense.mission?.ref ?? "General"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(expense.expense_date)} | {expense.merchant ?? "No merchant"} | {expense.notes ?? "No notes"}</p>
                </div>
                <p className="font-mono text-sm font-semibold">{formatMoney(expense.amount)}</p>
                <StatusBadge label={EXPENSE_STATUS_LABEL[expense.status] ?? expense.status} tone={toneFor(EXPENSE_STATUS_TONE, expense.status)} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
