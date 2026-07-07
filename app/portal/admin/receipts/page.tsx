import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { resendReceiptPdf } from "@/app/portal/actions/receipts";
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
import { DeckSelect } from "@/components/portal/ui/fields";
import { Button } from "@/components/ui/button";
import { listAllReceipts } from "@/lib/portal/queries";
import { formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Receipts - Admin Portal" };

const PAGE_SIZE = 25;

type Params = {
  success?: string;
  error?: string;
  q?: string;
  sent?: string;
  method?: string;
  client?: string;
  page?: string;
  record?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["q", "sent", "method", "client", "page"];
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

type ReceiptRow = Awaited<ReturnType<typeof listAllReceipts>>[number];

function clientName(row: ReceiptRow) {
  const client = row.payment?.invoice?.client;
  return client?.company_name ?? client?.full_name ?? client?.email ?? null;
}

export default async function AdminReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "expenses");
  const params = await searchParams;
  const receipts = await listAllReceipts();
  const basePath = "/portal/admin/receipts";

  const methods = [
    ...new Set(
      receipts
        .map((row) => row.payment?.payment_method)
        .filter((method): method is string => Boolean(method))
    ),
  ].sort((a, b) => a.localeCompare(b));
  const clientOptions = new Map<string, string>();
  for (const row of receipts) {
    const id = row.payment?.invoice?.client_id;
    if (id && !clientOptions.has(id)) clientOptions.set(id, clientName(row) ?? "Client");
  }

  const q = params.q?.trim().toLowerCase();
  const filtered = receipts.filter((row) => {
    if (params.sent === "sent" && !row.emailed_at) return false;
    if (params.sent === "pending" && row.emailed_at) return false;
    if (params.method && row.payment?.payment_method !== params.method) return false;
    if (params.client && row.payment?.invoice?.client_id !== params.client) return false;
    if (q) {
      const haystack = [
        row.document_number,
        row.file_name,
        row.payment?.invoice?.invoice_number,
        clientName(row),
        row.payment?.payment_method,
        ...(row.emailed_to ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const record = params.record
    ? receipts.find((row) => row.id === params.record) ?? null
    : null;

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(params.q || params.sent || params.method || params.client);
  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;

  const deliveryBadge = (row: ReceiptRow) =>
    row.emailed_at ? (
      <StatusBadge label="Emailed" tone="success" />
    ) : (
      <StatusBadge label="Not emailed" tone="neutral" />
    );

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Receipts"
      description="Generated receipt PDFs for partial and final invoice payments."
      notices={
        <>
          {params.success === "resent" ? <Notice tone="success">Receipt resent.</Notice> : null}
          {params.error === "missing" ? (
            <Notice tone="danger">Receipt payment record was not found.</Notice>
          ) : null}
        </>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="sent"
          current={params.sent ?? ""}
          preserve={{ q: params.q, method: params.method, client: params.client }}
          options={[
            { value: "", label: "All" },
            { value: "sent", label: "Emailed" },
            { value: "pending", label: "Not Emailed" },
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.sent ? <input type="hidden" name="sent" value={params.sent} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Receipt #, invoice, client, recipient…"
            aria-label="Search receipts"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="method"
            defaultValue={params.method ?? ""}
            aria-label="Payment method"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Methods" },
              ...methods.map((method) => ({ value: method, label: method })),
            ]}
          />
          <DeckSelect
            name="client"
            defaultValue={params.client ?? ""}
            aria-label="Client"
            className="w-auto min-w-[9.5rem]"
            options={[
              { value: "", label: "All Clients" },
              ...[...clientOptions.entries()].map(([value, label]) => ({ value, label })),
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
      count={`${filtered.length} / ${receipts.length} records`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No receipts"
            description={
              hasFilters
                ? "No receipts match the current filters."
                : "Receipt PDFs generated from invoice payments will appear here."
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => recordHref(row.id)}
            emptyLabel="No receipts generated."
            columns={[
              {
                header: "Receipt #",
                priority: "primary",
                cell: (row) => (
                  <span className="deck-mono text-[var(--deck-accent-ink)]">
                    {row.document_number}
                  </span>
                ),
              },
              {
                header: "Invoice",
                cell: (row) => (
                  <span className="deck-mono text-[var(--deck-text-2)]">
                    {row.payment?.invoice?.invoice_number ?? "—"}
                  </span>
                ),
              },
              {
                header: "Client",
                priority: "secondary",
                cell: (row) => (
                  <span className="text-[var(--deck-text-2)]">{clientName(row) ?? "—"}</span>
                ),
              },
              {
                header: "Amount",
                align: "right",
                priority: "secondary",
                cell: (row) => (
                  <span className="deck-num">{formatMoney(row.payment?.amount ?? 0)}</span>
                ),
              },
              {
                header: "Method",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="text-[var(--deck-text-2)]">
                    {row.payment?.payment_method ?? "—"}
                  </span>
                ),
              },
              {
                header: "Generated",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="deck-mono whitespace-nowrap text-[var(--deck-text-2)]">
                    {formatDateTime(row.created_at)}
                  </span>
                ),
              },
              { header: "Delivery", cell: (row) => deliveryBadge(row) },
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
          sent: params.sent,
          method: params.method,
          client: params.client,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow="Payment receipt"
          title={record.document_number}
          meta={`Generated ${formatDateTime(record.created_at)}`}
          badge={deliveryBadge(record)}
          actions={
            <>
              <Button asChild size="sm">
                <Link href={`/portal/billing-documents/${record.id}/view`}>View PDF</Link>
              </Button>
              {record.payment?.invoice ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/portal/admin/invoices/${record.payment.invoice.id}`}>
                    Open invoice
                  </Link>
                </Button>
              ) : null}
              {record.payment_id ? (
                <form action={resendReceiptPdf}>
                  <input type="hidden" name="payment_id" value={record.payment_id} />
                  <SubmitButton variant="outline" size="sm" pendingText="Sending...">
                    Resend Receipt
                  </SubmitButton>
                </form>
              ) : null}
            </>
          }
        >
          <dl>
            <DetailRow label="Receipt #">
              <span className="deck-mono">{record.document_number}</span>
            </DetailRow>
            <DetailRow label="Invoice">
              {record.payment?.invoice ? (
                <Link
                  href={`/portal/admin/invoices/${record.payment.invoice.id}`}
                  className="deck-mono text-accent hover:underline"
                >
                  {record.payment.invoice.invoice_number}
                </Link>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Client">{clientName(record) ?? "—"}</DetailRow>
            <DetailRow label="Amount">
              <span className="deck-num">{formatMoney(record.payment?.amount ?? 0)}</span>
            </DetailRow>
            <DetailRow label="Method">{record.payment?.payment_method ?? "—"}</DetailRow>
            <DetailRow label="Generated">{formatDateTime(record.created_at)}</DetailRow>
            <DetailRow label="Sent">{formatDateTime(record.emailed_at)}</DetailRow>
            <DetailRow label="Recipients">{record.emailed_to?.join(", ") || "—"}</DetailRow>
            <DetailRow label="File">
              <span className="deck-mono break-all">{record.file_name}</span>
            </DetailRow>
          </dl>
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
