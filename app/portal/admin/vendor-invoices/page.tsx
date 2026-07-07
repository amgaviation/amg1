import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, EmptyState, FilterTabs, Notice } from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { RecordModal } from "@/components/portal/ui/record-modal";
import { DeckSelect, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import {
  markVendorInvoicePaid,
  reviewVendorInvoice,
} from "@/app/portal/actions/vendor-invoices";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";
import {
  getVendorInvoice,
  listAllVendorInvoices,
  VENDOR_INVOICE_STATUS_LABEL,
  VENDOR_INVOICE_STATUS_TONE,
} from "@/lib/portal/vendor-invoices";

export const metadata = { title: "Vendor Invoices - Admin Portal" };

const PAGE_SIZE = 25;

type Params = {
  status?: string;
  role?: string;
  q?: string;
  page?: string;
  record?: string;
  success?: string;
  error?: string;
};

export default async function AdminVendorInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "invoices");
  const params = await searchParams;
  const basePath = "/portal/admin/vendor-invoices";
  const invoices = await listAllVendorInvoices({
    status: params.status || undefined,
    role: params.role || undefined,
  });

  const filtered = invoices.filter((invoice) => {
    if (!params.q) return true;
    const q = params.q.toLowerCase();
    return `${invoice.ref} ${invoice.invoice_number ?? ""} ${invoice.bill_from_name} ${invoice.bill_from_company ?? ""} ${invoice.submitter?.full_name ?? ""} ${invoice.submitter?.email ?? ""} ${invoice.mission?.ref ?? ""}`
      .toLowerCase()
      .includes(q);
  });
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const listQs = (overrides: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    for (const key of ["status", "role", "q", "page"] as const) {
      if (params[key]) search.set(key, params[key]!);
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    const qs = search.toString();
    return qs ? `?${qs}` : "";
  };

  const detail = params.record ? await getVendorInvoice(params.record) : null;
  const backTo = `${basePath}${listQs({})}`;

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Vendor Invoices"
      description="Invoices submitted by crew and partners for their services — review, approve, and mark paid."
      notices={
        <>
          {params.success === "reviewed" ? <Notice tone="success">Review recorded and the contractor was notified.</Notice> : null}
          {params.success === "paid" ? <Notice tone="success">Invoice marked paid and the contractor was notified.</Notice> : null}
          {params.error === "notes-required" ? <Notice tone="danger">Add review notes — the contractor needs to know what to change.</Notice> : null}
          {params.error === "not-approved" ? <Notice tone="danger">Only approved invoices can be marked paid.</Notice> : null}
          {params.error === "save" || params.error === "decision" ? <Notice tone="danger">That review could not be saved. Try again.</Notice> : null}
        </>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          preserve={{ role: params.role, q: params.q }}
          options={[
            { value: "", label: "All" },
            { value: "submitted", label: "Submitted" },
            { value: "under_review", label: "Under Review" },
            { value: "needs_changes", label: "Needs Changes" },
            { value: "approved", label: "Approved" },
            { value: "paid", label: "Paid" },
            { value: "rejected", label: "Rejected" },
            { value: "void", label: "Void" },
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Ref, contractor, company, mission…"
            aria-label="Search vendor invoices"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="role"
            defaultValue={params.role ?? ""}
            aria-label="Submitter role"
            className="w-auto min-w-[9rem]"
            options={[
              { value: "", label: "Crew & Partners" },
              { value: "crew", label: "Crew" },
              { value: "partner", label: "Partners" },
            ]}
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          {params.q || params.role || params.status ? (
            <Link
              href={basePath}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Clear
            </Link>
          ) : null}
        </form>
      }
      count={`${filtered.length} / ${invoices.length} invoices`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No vendor invoices"
            description="When crew or partners submit an invoice from their portal, it lands here for review."
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
                  <span className="deck-mono text-[var(--deck-accent-ink)]">{row.ref}</span>
                ),
              },
              {
                header: "From",
                cell: (row) => (
                  <div className="min-w-0 max-w-[16rem]">
                    <p className="truncate font-semibold text-[var(--deck-text)]">
                      {row.bill_from_company ?? row.bill_from_name}
                    </p>
                    <p className="truncate text-xs text-[var(--deck-text-3)]">
                      {row.submitter?.full_name ?? row.submitter?.email ?? row.bill_from_name}
                      {" · "}
                      {row.submitter_role}
                    </p>
                  </div>
                ),
              },
              { header: "Mission", hideOnMobile: true, cell: (row) => row.mission?.ref ?? "—" },
              {
                header: "Total",
                align: "right",
                cell: (row) => <span className="deck-num font-semibold">{formatMoney(Number(row.total))}</span>,
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
      pagination={{
        basePath,
        page: safePage,
        pageCount,
        params: { status: params.status, role: params.role, q: params.q },
      }}
    >
      {detail ? (
        <RecordModal
          eyebrow={`Vendor invoice · ${detail.invoice.submitter_role}`}
          title={detail.invoice.ref}
          meta={`Submitted ${formatDateTime(detail.invoice.created_at)} by ${detail.invoice.submitter?.full_name ?? detail.invoice.submitter?.email ?? "contractor"}`}
          badge={
            <StatusBadge
              label={VENDOR_INVOICE_STATUS_LABEL[detail.invoice.status] ?? detail.invoice.status}
              tone={VENDOR_INVOICE_STATUS_TONE[detail.invoice.status]}
            />
          }
          actions={
            detail.invoice.mission ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/portal/admin/trips/${detail.invoice.mission.id}`}>Open mission</Link>
              </Button>
            ) : undefined
          }
          wide
        >
          <dl>
            <DetailRow label="Billed As">
              {detail.invoice.bill_from_company ?? detail.invoice.bill_from_name}
              {detail.invoice.bill_from_company ? (
                <span className="block text-xs text-[var(--deck-text-3)]">{detail.invoice.bill_from_name}</span>
              ) : null}
            </DetailRow>
            <DetailRow label="Contact">
              {[detail.invoice.bill_from_email, detail.invoice.bill_from_phone].filter(Boolean).join(" · ") || "—"}
            </DetailRow>
            {detail.invoice.bill_from_address ? (
              <DetailRow label="Remit To">{detail.invoice.bill_from_address}</DetailRow>
            ) : null}
            {detail.invoice.bill_from_tax_id ? (
              <DetailRow label="Tax ID">{detail.invoice.bill_from_tax_id}</DetailRow>
            ) : null}
            <DetailRow label="Their Invoice #">{detail.invoice.invoice_number ?? "—"}</DetailRow>
            <DetailRow label="Dates">
              Invoiced {formatDate(detail.invoice.invoice_date)}
              {detail.invoice.due_date ? ` · due ${formatDate(detail.invoice.due_date)}` : ""}
            </DetailRow>
            <DetailRow label="Mission">{detail.invoice.mission?.ref ?? "Not linked"}</DetailRow>
            {detail.invoice.payment_instructions ? (
              <DetailRow label="Payment">{detail.invoice.payment_instructions}</DetailRow>
            ) : null}
            {detail.invoice.notes ? <DetailRow label="Notes">{detail.invoice.notes}</DetailRow> : null}
            {detail.invoice.review_notes ? (
              <DetailRow label="Review Notes">{detail.invoice.review_notes}</DetailRow>
            ) : null}
            {detail.invoice.paid_at ? (
              <DetailRow label="Paid">
                {formatDateTime(detail.invoice.paid_at)}
                {detail.invoice.payment_reference ? ` — ref ${detail.invoice.payment_reference}` : ""}
              </DetailRow>
            ) : null}
          </dl>

          <div className="mt-5">
            <p className="deck-eyebrow mb-2">Line Items</p>
            <div className="overflow-hidden rounded-md border border-[var(--deck-line)]">
              {detail.lines.map((line) => (
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
                <span className="deck-num">{formatMoney(Number(detail.invoice.total))}</span>
              </div>
            </div>
          </div>

          {detail.receipts.length ? (
            <div className="mt-5">
              <p className="deck-eyebrow mb-2">Receipts</p>
              <div className="grid gap-2">
                {detail.receipts.map((receipt) => (
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

          {["submitted", "under_review", "needs_changes"].includes(detail.invoice.status) ? (
            <div className="mt-6 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel-2)] p-4">
              <p className="deck-eyebrow mb-3">Review</p>
              <form action={reviewVendorInvoice} className="grid gap-3">
                <input type="hidden" name="invoice_id" value={detail.invoice.id} />
                <input type="hidden" name="back_to" value={`${backTo}${backTo.includes("?") ? "&" : "?"}record=${detail.invoice.id}`} />
                <TextAreaField
                  label="Review Notes"
                  name="review_notes"
                  placeholder="Required when requesting changes or rejecting — the contractor sees this."
                />
                <div data-portal-action-bar className="flex flex-wrap gap-2">
                  <SubmitButton name="decision" value="approved" pendingText="Saving...">
                    Approve
                  </SubmitButton>
                  {detail.invoice.status !== "under_review" ? (
                    <SubmitButton name="decision" value="under_review" variant="outline" pendingText="Saving...">
                      Mark under review
                    </SubmitButton>
                  ) : null}
                  <SubmitButton name="decision" value="needs_changes" variant="outline" pendingText="Saving...">
                    Request changes
                  </SubmitButton>
                  <SubmitButton
                    name="decision"
                    value="rejected"
                    variant="outline"
                    className="text-[var(--deck-danger)]"
                    confirm="Reject this invoice? The contractor is notified with your review notes."
                    pendingText="Saving..."
                  >
                    Reject
                  </SubmitButton>
                </div>
              </form>
            </div>
          ) : null}

          {detail.invoice.status === "approved" ? (
            <div className="mt-6 rounded-md border border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] p-4">
              <p className="deck-eyebrow mb-3">Mark Paid</p>
              <form action={markVendorInvoicePaid} className="grid gap-3">
                <input type="hidden" name="invoice_id" value={detail.invoice.id} />
                <input type="hidden" name="back_to" value={`${backTo}${backTo.includes("?") ? "&" : "?"}record=${detail.invoice.id}`} />
                <TextField
                  label="Payment Reference"
                  name="payment_reference"
                  placeholder="ACH/check/Zelle reference (optional)"
                />
                <div>
                  <SubmitButton pendingText="Saving...">Mark paid & notify</SubmitButton>
                </div>
              </form>
            </div>
          ) : null}
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
