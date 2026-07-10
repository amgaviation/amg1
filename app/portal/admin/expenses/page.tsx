import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { reviewExpense } from "@/app/portal/actions/admin";
import { addExpenseToInvoice } from "@/app/portal/actions/invoices";
import { DataTable } from "@/components/portal/ui/data-table";
import {
  DetailRow,
  EmptyState,
  FilterTabs,
  Notice,
} from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { DeckSelect, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { Button } from "@/components/ui/button";
import { listAllExpenses, listAllInvoices } from "@/lib/portal/queries";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_STATUS,
  EXPENSE_STATUS_LABEL,
  EXPENSE_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Expenses - Admin Portal" };

const PAGE_SIZE = 25;

type Params = {
  success?: string;
  error?: string;
  q?: string;
  status?: string;
  category?: string;
  crew?: string;
  page?: string;
  record?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["q", "status", "category", "crew", "page"];
  const search = new URLSearchParams();
  for (const key of keep) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) search.set(key, value);
    else search.delete(key);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "expenses");
  const params = await searchParams;
  const [expenses, invoices] = await Promise.all([listAllExpenses(), listAllInvoices()]);
  const basePath = "/portal/admin/expenses";

  const crewOptions = new Map<string, string>();
  for (const row of expenses) {
    if (!crewOptions.has(row.crew_id)) {
      crewOptions.set(row.crew_id, row.crew?.full_name ?? row.crew?.email ?? "Crew");
    }
  }

  const q = params.q?.trim().toLowerCase();
  const filtered = expenses.filter((row) => {
    if (params.status && row.status !== params.status) return false;
    if (params.category && row.category !== params.category) return false;
    if (params.crew && row.crew_id !== params.crew) return false;
    if (q) {
      const haystack = [
        row.crew?.full_name,
        row.crew?.email,
        row.mission?.ref,
        EXPENSE_CATEGORY_LABEL[row.category] ?? row.category,
        row.merchant,
        row.notes,
        row.review_notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const record = params.record
    ? expenses.find((row) => row.id === params.record) ?? null
    : null;

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(params.q || params.status || params.category || params.crew);
  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;

  const statusBadge = (status: string) => (
    <StatusBadge
      label={EXPENSE_STATUS_LABEL[status] ?? status}
      tone={toneFor(EXPENSE_STATUS_TONE, status)}
    />
  );

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Expenses"
      description="Review, approve, reject, and mark crew expenses as paid."
      notices={
        <>
          {params.success ? <Notice tone="success">Expense review saved.</Notice> : null}
          {params.error === "already_billed" ? (
            <Notice tone="danger">That expense is already linked to an invoice.</Notice>
          ) : null}
          {params.error === "not_billable" ? (
            <Notice tone="danger">
              Only approved client-billable expenses can be added to invoices.
            </Notice>
          ) : null}
          {params.error && !["already_billed", "not_billable"].includes(params.error) ? (
            <Notice tone="danger">Expense action could not be completed.</Notice>
          ) : null}
        </>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          preserve={{ q: params.q, category: params.category, crew: params.crew }}
          options={[
            { value: "", label: "All" },
            ...EXPENSE_STATUS.map((status) => ({ value: status.value, label: status.label })),
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Crew, mission, merchant, notes…"
            aria-label="Search expenses"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="category"
            defaultValue={params.category ?? ""}
            aria-label="Category"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Categories" },
              ...EXPENSE_CATEGORIES.map((category) => ({
                value: category.value,
                label: category.label,
              })),
            ]}
          />
          <DeckSelect
            name="crew"
            defaultValue={params.crew ?? ""}
            aria-label="Crew member"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Crew" },
              ...[...crewOptions.entries()].map(([value, label]) => ({ value, label })),
            ]}
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          {hasFilters ? (
            <Link
              href={basePath}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Clear
            </Link>
          ) : null}
        </form>
      }
      count={`${filtered.length} / ${expenses.length} records`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="No expenses"
            description={
              hasFilters
                ? "No expenses match the current filters."
                : "Crew-submitted expenses will appear here for review."
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => recordHref(row.id)}
            emptyLabel="No expenses submitted."
            columns={[
              {
                header: "Expense #",
                priority: "primary",
                cell: (row) => (
                  <span className="deck-mono uppercase text-[var(--deck-accent-ink)]">
                    {row.id.slice(0, 8)}
                  </span>
                ),
              },
              {
                header: "Mission",
                cell: (row) => (
                  <span className="deck-mono text-[var(--deck-text-2)]">
                    {row.mission?.ref ?? "General"}
                  </span>
                ),
              },
              {
                header: "Crew",
                priority: "secondary",
                cell: (row) => (
                  <span className="text-[var(--deck-text-2)]">
                    {row.crew?.full_name ?? row.crew?.email ?? "—"}
                  </span>
                ),
              },
              {
                header: "Category",
                cell: (row) => (
                  <div className="min-w-0">
                    <p className="text-[var(--deck-text)]">
                      {EXPENSE_CATEGORY_LABEL[row.category] ?? row.category}
                    </p>
                    <p className="truncate text-xs text-[var(--deck-text-3)]">
                      {row.merchant ?? "No merchant"}
                    </p>
                  </div>
                ),
              },
              {
                header: "Amount",
                align: "right",
                priority: "secondary",
                cell: (row) => <span className="deck-num">{formatMoney(row.amount)}</span>,
              },
              {
                header: "Date",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="deck-mono whitespace-nowrap text-[var(--deck-text-2)]">
                    {formatDate(row.expense_date)}
                  </span>
                ),
              },
              { header: "Status", cell: (row) => statusBadge(row.status) },
            ]}
          />
        )
      }
      pagination={{
        basePath,
        page: safePage,
        pageCount,
        params: {
          q: params.q,
          status: params.status,
          category: params.category,
          crew: params.crew,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow="Crew expense"
          title={`${EXPENSE_CATEGORY_LABEL[record.category] ?? record.category} — ${formatMoney(record.amount)}`}
          meta={`${formatDate(record.expense_date)} · ${record.crew?.full_name ?? record.crew?.email ?? "Crew"}`}
          badge={statusBadge(record.status)}
          wide
          actions={
            record.mission_id ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/portal/admin/trips/${record.mission_id}`}>Open mission</Link>
              </Button>
            ) : null
          }
        >
          <dl>
            <DetailRow label="Expense #">
              <span className="deck-mono uppercase">{record.id.slice(0, 8)}</span>
            </DetailRow>
            <DetailRow label="Crew">
              {record.crew?.full_name ?? record.crew?.email ?? "—"}
            </DetailRow>
            <DetailRow label="Mission">
              {record.mission_id ? (
                <Link
                  href={`/portal/admin/trips/${record.mission_id}`}
                  className="deck-mono text-[var(--deck-accent-ink)] hover:underline"
                >
                  {record.mission?.ref ?? "Mission"}
                </Link>
              ) : (
                "General"
              )}
            </DetailRow>
            <DetailRow label="Category">
              {EXPENSE_CATEGORY_LABEL[record.category] ?? record.category}
            </DetailRow>
            <DetailRow label="Merchant">{record.merchant ?? "No merchant"}</DetailRow>
            <DetailRow label="Expense Date">{formatDate(record.expense_date)}</DetailRow>
            <DetailRow label="Amount">
              <span className="deck-num">{formatMoney(record.amount)}</span>
            </DetailRow>
            <DetailRow label="Approved Amount">
              {record.approved_amount !== null ? formatMoney(record.approved_amount) : "—"}
            </DetailRow>
            <DetailRow label="Reimbursable">{record.reimbursable ? "Yes" : "No"}</DetailRow>
            <DetailRow label="Client Billable">
              {record.billable_to_client ? "Yes" : "No"}
            </DetailRow>
            <DetailRow label="Crew Notes">{record.notes ?? "—"}</DetailRow>
            <DetailRow label="Review Notes">{record.review_notes ?? "—"}</DetailRow>
            <DetailRow label="Submitted">{formatDateTime(record.created_at)}</DetailRow>
          </dl>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="deck-inset p-4">
              <p className="deck-eyebrow mb-3">Review</p>
              <form action={reviewExpense} className="grid gap-3">
                <input type="hidden" name="expense_id" value={record.id} />
                <SelectField
                  label="Status"
                  name="status"
                  defaultValue={record.status}
                  options={EXPENSE_STATUS.map((s) => ({ value: s.value, label: s.label }))}
                />
                <TextField
                  label="Approved Amount"
                  name="approved_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={record.approved_amount ?? record.amount}
                />
                <SelectField
                  label="Reimbursable"
                  name="reimbursable"
                  defaultValue={record.reimbursable ? "true" : "false"}
                  options={[
                    { value: "true", label: "Yes" },
                    { value: "false", label: "No" },
                  ]}
                />
                <SelectField
                  label="Client Billable"
                  name="billable_to_client"
                  defaultValue={record.billable_to_client ? "true" : "false"}
                  options={[
                    { value: "false", label: "No" },
                    { value: "true", label: "Yes" },
                  ]}
                />
                <TextAreaField
                  label="Notes"
                  name="review_notes"
                  defaultValue={record.review_notes ?? ""}
                />
                <SubmitButton variant="outline" pendingText="Saving...">
                  Save Review
                </SubmitButton>
              </form>
            </div>
            <div className="deck-inset p-4">
              <p className="deck-eyebrow mb-3">Billing</p>
              <form action={addExpenseToInvoice} className="grid gap-3">
                <input type="hidden" name="expense_id" value={record.id} />
                <SelectField
                  label="Invoice"
                  name="invoice_id"
                  defaultValue=""
                  options={[
                    { value: "", label: "Select invoice..." },
                    ...invoices.map((invoice) => ({
                      value: invoice.id,
                      label: `${invoice.invoice_number} - ${invoice.client?.company_name ?? invoice.client?.full_name ?? invoice.client?.email ?? "Client"}`,
                    })),
                  ]}
                />
                <SubmitButton variant="outline" pendingText="Adding...">
                  Add to Invoice
                </SubmitButton>
              </form>
            </div>
          </div>
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
