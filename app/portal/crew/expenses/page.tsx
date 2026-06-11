import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
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

  return (
    <PortalShell role="crew" user={user}>
      {params.success ? <Notice tone="success">Expense submitted for review.</Notice> : null}
      {params.error === "invalid" ? <Notice tone="danger">Enter a valid category and amount.</Notice> : null}

      <PageHeader eyebrow="Flight Crew" title="Expenses" description="Submit mission expenses with receipts for AMG review and payment tracking." />

      <SectionCard title="Submit Expense" icon="receipt">
        <form action={submitExpense} encType="multipart/form-data" className="grid gap-4 lg:grid-cols-4">
          <SelectField label="Mission" name="mission_id" defaultValue="" options={[{ value: "", label: "General / unassigned" }, ...missions.map((m) => ({ value: m.id, label: `${m.ref} - ${m.departure_airport ?? ""}-${m.arrival_airport ?? ""}` }))]} />
          <SelectField label="Category" name="category" required defaultValue="" placeholder="Select category..." options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
          <TextField label="Amount" name="amount" type="number" min="0" step="0.01" required />
          <TextField label="Expense Date" name="expense_date" type="date" />
          <div className="lg:col-span-2">
            <FileField label="Receipt" name="receipt" accept=".pdf,.jpg,.jpeg,.png" />
          </div>
          <div className="lg:col-span-2">
            <TextAreaField label="Notes" name="notes" placeholder="Routing, hotel, ticket number, operational context..." />
          </div>
          <div>
            <SubmitButton className="rounded-full" pendingText="Submitting...">Submit Expense</SubmitButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Expense History" icon="receipt">
        {expenses.length === 0 ? (
          <EmptyState icon="receipt" title="No expenses submitted" description="Submit expenses above after mission travel or operational support." />
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="grid gap-3 rounded-lg border border-border bg-background/50 p-4 sm:grid-cols-[1fr_auto_auto]">
                <div>
                  <p className="text-sm font-semibold">{EXPENSE_CATEGORY_LABEL[expense.category] ?? expense.category} - {expense.mission?.ref ?? "General"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(expense.expense_date)} | {expense.notes ?? "No notes"}</p>
                </div>
                <p className="font-mono text-sm font-semibold">{formatMoney(expense.amount)}</p>
                <StatusBadge label={EXPENSE_STATUS_LABEL[expense.status] ?? expense.status} tone={toneFor(EXPENSE_STATUS_TONE, expense.status)} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
