import Link from "next/link";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, EmptyState, FilterTabs, Notice } from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";
import {
  getVendorInvoice,
  listVendorInvoicesForSubmitter,
  vendorInvoiceEditable,
  VENDOR_INVOICE_STATUS_LABEL,
  VENDOR_INVOICE_STATUS_TONE,
} from "@/lib/portal/vendor-invoices";
import type { SessionUser } from "@/lib/portal/session";

/**
 * Contractor-side Invoices tab (crew & partner share this list). Console
 * Record Pattern: chips → search row → slim table → ?record= detail window.
 */

export type VendorInvoiceListParams = {
  status?: string;
  q?: string;
  page?: string;
  record?: string;
  success?: string;
  error?: string;
};

const PAGE_SIZE = 25;

const ERRORS: Record<string, string> = {
  "bill-from": "Enter the name this invoice bills from.",
  lines: "Add at least one line item with a valid amount.",
  mission: "That mission is not linked to your account.",
  "receipt-file": "Receipts must be PDF or image files up to 25 MB.",
  "receipt-upload": "A receipt file could not be uploaded. Try again.",
  save: "The invoice could not be saved. Try again.",
  locked: "This invoice has already been reviewed and can no longer be edited.",
  "not-found": "That invoice could not be found.",
};

export async function VendorInvoicesList({
  user,
  params,
}: {
  user: SessionUser;
  params: VendorInvoiceListParams;
}) {
  const role = user.role as "crew" | "partner";
  const basePath = `/portal/${role}/invoices`;
  const invoices = await listVendorInvoicesForSubmitter(user.id);

  const filtered = invoices.filter((invoice) => {
    if (params.status && invoice.status !== params.status) return false;
    if (params.q) {
      const q = params.q.toLowerCase();
      const hay = `${invoice.ref} ${invoice.invoice_number ?? ""} ${invoice.bill_from_company ?? ""} ${invoice.mission?.ref ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const listQs = (overrides: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    if (params.status) search.set("status", params.status);
    if (params.q) search.set("q", params.q);
    if (params.page) search.set("page", params.page);
    for (const [key, value] of Object.entries(overrides)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    const qs = search.toString();
    return qs ? `?${qs}` : "";
  };

  const detail = params.record ? await getVendorInvoice(params.record) : null;
  const record = detail && detail.invoice.submitter_id === user.id ? detail : null;

  return (
    <RecordListShell
      eyebrow={role === "crew" ? "Crew" : "Partner"}
      title="Invoices"
      description="Bill AMG for your services — as yourself or your company entity. AMG reviews, approves, and pays from here."
      actions={
        <Button asChild size="sm">
          <Link href={`${basePath}/new`}>+ New Invoice</Link>
        </Button>
      }
      notices={
        <>
          {params.success === "submitted" ? (
            <Notice tone="success">Invoice submitted — AMG has been notified.</Notice>
          ) : null}
          {params.success === "updated" ? (
            <Notice tone="success">Invoice updated and resubmitted.</Notice>
          ) : null}
          {params.error && ERRORS[params.error] ? (
            <Notice tone="danger">{ERRORS[params.error]}</Notice>
          ) : null}
        </>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          preserve={{ q: params.q }}
          options={[
            { value: "", label: "All" },
            { value: "submitted", label: "Submitted" },
            { value: "under_review", label: "Under Review" },
            { value: "needs_changes", label: "Needs Changes" },
            { value: "approved", label: "Approved" },
            { value: "paid", label: "Paid" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Ref, your invoice #, company, mission…"
            aria-label="Search invoices"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>
      }
      count={`${filtered.length} / ${invoices.length} invoices`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No invoices yet"
            description="Submit your first invoice to AMG — it lands in their review queue immediately."
            action={
              <Button asChild size="sm">
                <Link href={`${basePath}/new`}>+ New Invoice</Link>
              </Button>
            }
          />
        ) : (
          <DataTable
            rows={paged}
            getKey={(row) => row.id}
            getHref={(row) => `${basePath}${listQs({ record: row.id })}`}
            columns={[
              {
                header: "Ref",
                priority: "primary",
                cell: (row) => (
                  <div>
                    <span className="deck-mono text-[var(--deck-accent-ink)]">{row.ref}</span>
                    {row.invoice_number ? (
                      <span className="mt-0.5 block text-xs text-[var(--deck-text-3)]">
                        #{row.invoice_number}
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                header: "Billed As",
                cell: (row) => row.bill_from_company ?? row.bill_from_name,
              },
              { header: "Mission", cell: (row) => row.mission?.ref ?? "—" },
              {
                header: "Total",
                align: "right",
                cell: (row) => (
                  <span className="deck-num font-semibold">{formatMoney(Number(row.total))}</span>
                ),
              },
              { header: "Submitted", hideOnMobile: true, cell: (row) => formatDate(row.created_at) },
              {
                header: "Status",
                cell: (row) => (
                  <StatusBadge
                    label={VENDOR_INVOICE_STATUS_LABEL[row.status] ?? row.status}
                    tone={VENDOR_INVOICE_STATUS_TONE[row.status]}
                  />
                ),
              },
            ]}
          />
        )
      }
      pagination={{ basePath, page: safePage, pageCount, params: { status: params.status, q: params.q } }}
    >
      {record ? (
        <RecordModal
          eyebrow="Invoice to AMG"
          title={record.invoice.ref}
          meta={`Submitted ${formatDateTime(record.invoice.created_at)}`}
          badge={
            <StatusBadge
              label={VENDOR_INVOICE_STATUS_LABEL[record.invoice.status] ?? record.invoice.status}
              tone={VENDOR_INVOICE_STATUS_TONE[record.invoice.status]}
            />
          }
          actions={
            vendorInvoiceEditable(record.invoice.status) ? (
              <Button asChild size="sm">
                <Link href={`${basePath}/${record.invoice.id}/edit`}>
                  {record.invoice.status === "needs_changes" ? "Edit & resubmit" : "Edit invoice"}
                </Link>
              </Button>
            ) : undefined
          }
          wide
        >
          {record.invoice.status === "needs_changes" && record.invoice.review_notes ? (
            <div className="mb-4">
              <Notice tone="warn">AMG requested changes: {record.invoice.review_notes}</Notice>
            </div>
          ) : null}
          {record.invoice.status === "rejected" && record.invoice.review_notes ? (
            <div className="mb-4">
              <Notice tone="danger">Rejected: {record.invoice.review_notes}</Notice>
            </div>
          ) : null}
          {record.invoice.status === "paid" ? (
            <div className="mb-4">
              <Notice tone="success">
                Paid {record.invoice.paid_at ? formatDate(record.invoice.paid_at) : ""}
                {record.invoice.payment_reference ? ` — reference ${record.invoice.payment_reference}` : ""}
              </Notice>
            </div>
          ) : null}

          <dl>
            <DetailRow label="Billed As">
              {record.invoice.bill_from_company ?? record.invoice.bill_from_name}
              {record.invoice.bill_from_company ? (
                <span className="block text-xs text-[var(--deck-text-3)]">
                  {record.invoice.bill_from_name}
                </span>
              ) : null}
            </DetailRow>
            {record.invoice.bill_from_address ? (
              <DetailRow label="Remit To">{record.invoice.bill_from_address}</DetailRow>
            ) : null}
            <DetailRow label="Invoice Date">{formatDate(record.invoice.invoice_date)}</DetailRow>
            {record.invoice.due_date ? (
              <DetailRow label="Due">{formatDate(record.invoice.due_date)}</DetailRow>
            ) : null}
            <DetailRow label="Mission">{record.invoice.mission?.ref ?? "Not linked"}</DetailRow>
            {record.invoice.payment_instructions ? (
              <DetailRow label="Payment">{record.invoice.payment_instructions}</DetailRow>
            ) : null}
            {record.invoice.notes ? <DetailRow label="Notes">{record.invoice.notes}</DetailRow> : null}
          </dl>

          <div className="mt-5">
            <p className="deck-eyebrow mb-2">Line Items</p>
            <div className="overflow-hidden rounded-md border border-[var(--deck-line)]">
              {record.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-baseline justify-between gap-3 border-b border-[var(--deck-line)] px-4 py-2.5 text-sm last:border-0"
                >
                  <span className="min-w-0 text-[var(--deck-text)]">
                    {line.description}
                    <span className="ml-2 text-xs text-[var(--deck-text-3)]">
                      {Number(line.quantity)} × {formatMoney(Number(line.unit_amount))}
                    </span>
                  </span>
                  <span className="deck-num shrink-0 font-semibold">{formatMoney(Number(line.amount))}</span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 bg-[var(--deck-panel-2)] px-4 py-2.5 text-sm font-bold">
                <span>Total</span>
                <span className="deck-num">{formatMoney(Number(record.invoice.total))}</span>
              </div>
            </div>
          </div>

          {record.receipts.length ? (
            <div className="mt-5">
              <p className="deck-eyebrow mb-2">Receipts</p>
              <div className="grid gap-2">
                {record.receipts.map((receipt) => (
                  <a
                    key={receipt.id}
                    href={`/api/portal/vendor-receipts/${receipt.id}/content`}
                    target="_blank"
                    rel="noopener"
                    className="deck-inset deck-card-hover flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="min-w-0 truncate text-[var(--deck-accent-ink)]">{receipt.file_name}</span>
                    <span className="shrink-0 text-xs text-[var(--deck-text-3)]">
                      {receipt.amount != null ? formatMoney(Number(receipt.amount)) : ""}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
