import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, EmptyState, FilterTabs } from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { DeckSelect } from "@/components/portal/ui/fields";
import { listAllPayments } from "@/lib/portal/queries";
import { PAYMENT_METHODS } from "@/lib/portal/constants";
import { formatDateTime, formatMoney, titleCase } from "@/lib/portal/format";

export const metadata = { title: "Payments - Admin Portal" };

const PAGE_SIZE = 25;

type Params = {
  q?: string;
  status?: string;
  method?: string;
  client?: string;
  page?: string;
  record?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["q", "status", "method", "client", "page"];
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

function clientLabel(client: { company_name: string | null; full_name: string | null; email: string } | null | undefined) {
  return client?.company_name ?? client?.full_name ?? client?.email ?? "—";
}

function methodLabel(value: string | null) {
  if (!value) return "—";
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? titleCase(value);
}

function statusTone(status: string) {
  return status === "recorded" ? ("success" as const) : ("neutral" as const);
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "payments");
  const params = await searchParams;
  const payments = await listAllPayments();
  const basePath = "/portal/admin/payments";

  // Real statuses come from the ledger itself — payments only ever get
  // status "recorded" today, so the chip row is derived, not invented.
  const statusValues = Array.from(new Set(payments.map((row) => row.status).filter(Boolean)));
  if (!statusValues.length) statusValues.push("recorded");
  const clientOptions = Array.from(
    new Map(
      payments
        .filter((row) => row.invoice?.client_id)
        .map((row) => [row.invoice!.client_id as string, clientLabel(row.invoice?.client)])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const q = params.q?.trim().toLowerCase();
  const filtered = payments.filter((row) => {
    if (params.status && row.status !== params.status) return false;
    if (params.method && row.payment_method !== params.method) return false;
    if (params.client && row.invoice?.client_id !== params.client) return false;
    if (q) {
      const haystack = [
        (row as any).receipt_number,
        row.invoice?.invoice_number,
        row.invoice?.client?.company_name,
        row.invoice?.client?.full_name,
        row.invoice?.client?.email,
        (row as any).payment_reference,
        row.provider_payment_id,
        row.payment_method,
        row.notes,
        row.recorded_by_profile?.full_name,
        row.recorded_by_profile?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(params.q || params.status || params.method || params.client);

  // Detail record resolves against the full ledger so shared ?record=
  // links open even when the current filters exclude the payment.
  const record = params.record
    ? payments.find((row) => row.id === params.record) ?? null
    : null;
  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;
  const recordRef = record
    ? ((record as any).receipt_number as string | null) ?? record.id.slice(0, 8).toUpperCase()
    : null;

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Payments"
      description="Payment ledger for invoice settlement and receipt tracking."
      // Payments are recorded from an invoice (Record Payment on the invoice
      // detail page) — there is no standalone create flow, so no + New action.
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          preserve={{ q: params.q, method: params.method, client: params.client }}
          options={[
            { value: "", label: "All" },
            ...statusValues.map((value) => ({ value, label: titleCase(value) })),
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Receipt #, invoice, client, reference…"
            aria-label="Search payments"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="method"
            defaultValue={params.method ?? ""}
            aria-label="Method"
            className="w-auto min-w-[9rem]"
            options={[
              { value: "", label: "All Methods" },
              ...PAYMENT_METHODS.map((method) => ({ value: method.value, label: method.label })),
            ]}
          />
          <DeckSelect
            name="client"
            defaultValue={params.client ?? ""}
            aria-label="Client"
            className="w-auto min-w-[9.5rem]"
            options={[{ value: "", label: "All Clients" }, ...clientOptions]}
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
      count={`${filtered.length} / ${payments.length} ${payments.length === 1 ? "payment" : "payments"}`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="No payments"
            description={
              hasFilters
                ? "No payments match the current filters."
                : "Payments recorded against invoices will appear here."
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => recordHref(row.id)}
            emptyLabel="No payments recorded."
            columns={[
              {
                header: "Payment #",
                priority: "primary",
                cell: (row) => (
                  <span className="deck-mono text-[var(--deck-accent-ink)]">
                    {(row as any).receipt_number ?? row.id.slice(0, 8).toUpperCase()}
                  </span>
                ),
              },
              {
                header: "Invoice",
                cell: (row) =>
                  row.invoice ? (
                    <span className="deck-mono text-[var(--deck-text-2)]">
                      {row.invoice.invoice_number}
                    </span>
                  ) : (
                    "—"
                  ),
              },
              {
                header: "Client",
                cell: (row) => (
                  <span className="text-[var(--deck-text-2)]">
                    {clientLabel(row.invoice?.client)}
                  </span>
                ),
              },
              {
                header: "Amount",
                align: "right",
                cell: (row) => <span className="deck-num">{formatMoney(row.amount)}</span>,
              },
              {
                header: "Method",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="whitespace-nowrap text-[var(--deck-text-2)]">
                    {methodLabel(row.payment_method)}
                  </span>
                ),
              },
              {
                header: "Status",
                cell: (row) => (
                  <StatusBadge label={titleCase(row.status)} tone={statusTone(row.status)} />
                ),
              },
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
          method: params.method,
          client: params.client,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow="Payment"
          title={recordRef}
          meta={`Paid ${formatDateTime(record.paid_at)}${
            record.recorded_by_profile
              ? ` · recorded by ${record.recorded_by_profile.full_name ?? record.recorded_by_profile.email}`
              : ""
          }`}
          badge={<StatusBadge label={titleCase(record.status)} tone={statusTone(record.status)} />}
          actions={
            <>
              {record.invoice ? (
                <Button asChild size="sm">
                  <Link href={`/portal/admin/invoices/${record.invoice.id}`}>Open invoice</Link>
                </Button>
              ) : null}
              {record.receipt_document ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/portal/billing-documents/${record.receipt_document.id}/view`}>
                    View receipt PDF
                  </Link>
                </Button>
              ) : null}
            </>
          }
        >
          <dl>
            <DetailRow label="Amount">
              <span className="deck-num font-semibold">{formatMoney(record.amount)}</span>
              {record.currency && record.currency !== "USD" ? ` ${record.currency}` : ""}
            </DetailRow>
            <DetailRow label="Method">{methodLabel(record.payment_method)}</DetailRow>
            <DetailRow label="Reference">
              {(record as any).payment_reference ?? record.provider_payment_id ?? "—"}
            </DetailRow>
            {record.provider ? (
              <DetailRow label="Provider">
                {titleCase(record.provider)}
                {record.provider_payment_id ? (
                  <span className="deck-mono ml-2 text-xs text-[var(--deck-text-3)]">
                    {record.provider_payment_id}
                  </span>
                ) : null}
              </DetailRow>
            ) : null}
            <DetailRow label="Invoice">
              {record.invoice ? (
                <>
                  <Link
                    href={`/portal/admin/invoices/${record.invoice.id}`}
                    className="deck-mono text-[var(--deck-accent-ink)] hover:underline"
                  >
                    {record.invoice.invoice_number}
                  </Link>
                  <span className="ml-2 text-xs text-[var(--deck-text-3)]">
                    {formatMoney(record.invoice.total)} total ·{" "}
                    {formatMoney(record.invoice.amount_due)} due
                  </span>
                </>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Client">
              {record.invoice?.client_id ? (
                <Link
                  href={`/portal/admin/clients/${record.invoice.client_id}`}
                  className="text-[var(--deck-accent-ink)] hover:underline"
                >
                  {clientLabel(record.invoice?.client)}
                </Link>
              ) : (
                clientLabel(record.invoice?.client)
              )}
            </DetailRow>
            <DetailRow label="Receipt #">
              {(record as any).receipt_number ? (
                <span className="deck-mono">{(record as any).receipt_number}</span>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Receipt PDF">
              {record.receipt_document ? (
                <Link
                  href={`/portal/billing-documents/${record.receipt_document.id}/view`}
                  className="text-[var(--deck-accent-ink)] hover:underline"
                >
                  View receipt
                </Link>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Recorded By">
              {record.recorded_by_profile?.full_name ?? record.recorded_by_profile?.email ?? "—"}
            </DetailRow>
            <DetailRow label="Timeline">
              <span className="grid gap-0.5 text-sm">
                <span>Paid {formatDateTime(record.paid_at)}</span>
                <span>Recorded {formatDateTime(record.created_at)}</span>
              </span>
            </DetailRow>
            {record.notes ? <DetailRow label="Notes">{record.notes}</DetailRow> : null}
          </dl>
          <p className="mt-4 text-xs leading-5 text-[var(--deck-text-3)]">
            New payments are recorded from the invoice — open the invoice and use Record Payment.
          </p>
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
