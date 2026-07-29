import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, EmptyState, FilterTabs, Notice } from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { DeckSelect } from "@/components/portal/ui/fields";
import { LocalTime } from "@/components/portal/ui/local-time";
import { formatDateTime, formatMoney, titleCase } from "@/lib/portal/format";
import {
  listOpenInvoicesForMatching,
  listStripeExternalPayments,
  type StripeExternalPayment,
} from "@/lib/portal/stripe-external-payments";
import {
  dismissStripeExternalPayment,
  matchStripeExternalPayment,
  reopenStripeExternalPayment,
  syncStripePayments,
} from "@/app/portal/actions/stripe-external";

export const metadata = { title: "Stripe Payments - Admin Portal" };

type Params = {
  status?: string;
  success?: string;
  error?: string;
  added?: string;
  record?: string;
};

const STATUS_TONES = {
  unmatched: "warn",
  matched: "success",
  dismissed: "neutral",
} as const;

const SOURCE_LABELS: Record<string, string> = {
  hurdlr: "Hurdlr",
  connected_app: "Connected App",
  stripe: "Stripe",
};

const ERROR_MESSAGES: Record<string, string> = {
  sync: "Stripe sync failed — check the Stripe configuration and try again.",
  missing: "That Stripe payment could not be found.",
  "invoice-required": "Pick an invoice to match this payment against.",
  "invoice-missing": "That invoice could not be found.",
  "invoice-locked": "That invoice is paid, void, or written off — it cannot take another payment.",
  currency: "The payment currency does not match the invoice currency.",
  resolved: "This payment was already resolved (possibly by another admin just now).",
  payment: "Could not record the payment. Try again.",
  conflict: "The invoice balance changed while recording — review and retry.",
};

function payerLabel(row: StripeExternalPayment) {
  return row.payer_name ?? row.payer_email ?? "—";
}

function statusTone(status: StripeExternalPayment["status"]) {
  return STATUS_TONES[status] ?? "neutral";
}

export default async function AdminStripePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "payments");
  const params = await searchParams;
  const basePath = "/portal/admin/payments/stripe";

  const [payments, openInvoices] = await Promise.all([
    listStripeExternalPayments(),
    listOpenInvoicesForMatching(),
  ]);

  const unmatchedCount = payments.filter((row) => row.status === "unmatched").length;
  const filtered = params.status
    ? payments.filter((row) => row.status === params.status)
    : payments;
  // The queue leads with what needs action; resolved rows keep date order below.
  const ordered = [...filtered].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === "unmatched") return -1;
      if (b.status === "unmatched") return 1;
    }
    return a.paid_at < b.paid_at ? 1 : -1;
  });

  const record = params.record ? payments.find((row) => row.id === params.record) ?? null : null;
  const recordHref = (id: string) =>
    `${basePath}?${new URLSearchParams({
      ...(params.status ? { status: params.status } : {}),
      record: id,
    }).toString()}`;

  const invoiceOptions = openInvoices.map((invoice) => {
    const client =
      invoice.client?.company_name ?? invoice.client?.full_name ?? invoice.client?.email ?? "No client";
    return {
      value: invoice.id,
      label: `${invoice.invoice_number ?? invoice.id.slice(0, 8)} · ${client} · ${formatMoney(invoice.amount_due)} due`,
    };
  });

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Stripe Payments"
      description="Payments that arrived in Stripe without a portal invoice — collected through Hurdlr, the Stripe dashboard, or other connected apps. Match each one to an invoice or dismiss it."
      actions={
        <form action={syncStripePayments}>
          <Button type="submit" size="sm">
            Sync from Stripe
          </Button>
        </form>
      }
      notices={
        <>
          {params.success === "synced" ? (
            <Notice tone="success">
              Sync complete — {params.added === "1" ? "1 new payment" : `${params.added ?? 0} new payments`} captured.
            </Notice>
          ) : null}
          {params.success === "matched" ? <Notice tone="success">Payment matched and recorded against the invoice.</Notice> : null}
          {params.success === "dismissed" ? <Notice tone="success">Payment dismissed.</Notice> : null}
          {params.success === "reopened" ? <Notice tone="success">Payment reopened for matching.</Notice> : null}
          {params.error ? (
            <Notice tone="danger">{ERROR_MESSAGES[params.error] ?? "Something went wrong."}</Notice>
          ) : null}
        </>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          options={[
            { value: "", label: "All" },
            { value: "unmatched", label: `Unmatched (${unmatchedCount})` },
            { value: "matched", label: "Matched" },
            { value: "dismissed", label: "Dismissed" },
          ]}
        />
      }
      count={`${filtered.length} / ${payments.length} ${payments.length === 1 ? "payment" : "payments"}`}
      table={
        ordered.length === 0 ? (
          <EmptyState
            icon="creditCard"
            title="Nothing to reconcile"
            description={
              params.status
                ? "No Stripe payments match the current filter."
                : "External Stripe payments will appear here automatically as they come in — or use Sync from Stripe to pull recent history."
            }
          />
        ) : (
          <DataTable
            rows={ordered}
            getKey={(row) => row.id}
            getHref={(row) => recordHref(row.id)}
            emptyLabel="No external Stripe payments."
            columns={[
              {
                header: "Received",
                priority: "primary",
                cell: (row) => <LocalTime value={row.paid_at} />,
              },
              {
                header: "Amount",
                align: "right",
                cell: (row) => (
                  <span className="deck-num">{formatMoney(Number(row.amount_cents) / 100)}</span>
                ),
              },
              {
                header: "Payer",
                cell: (row) => <span className="text-[var(--deck-text-2)]">{payerLabel(row)}</span>,
              },
              {
                header: "Description",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="text-[var(--deck-text-2)]">{row.description ?? "—"}</span>
                ),
              },
              {
                header: "Source",
                hideOnMobile: true,
                cell: (row) => (
                  <span className="text-[var(--deck-text-2)]">
                    {SOURCE_LABELS[row.source] ?? titleCase(row.source)}
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
    >
      {record ? (
        <RecordModal
          eyebrow="Stripe Payment"
          title={formatMoney(Number(record.amount_cents) / 100)}
          meta={`Received ${formatDateTime(record.paid_at)} · ${SOURCE_LABELS[record.source] ?? titleCase(record.source)}`}
          badge={<StatusBadge label={titleCase(record.status)} tone={statusTone(record.status)} />}
          actions={
            record.status === "matched" && record.matched_invoice_id ? (
              <Button asChild size="sm">
                <Link href={`/portal/admin/invoices/${record.matched_invoice_id}`}>Open invoice</Link>
              </Button>
            ) : undefined
          }
        >
          <dl>
            <DetailRow label="Amount">
              <span className="deck-num font-semibold">
                {formatMoney(Number(record.amount_cents) / 100)}
              </span>
              {record.currency.toUpperCase() !== "USD" ? ` ${record.currency.toUpperCase()}` : ""}
            </DetailRow>
            <DetailRow label="Payer">
              {record.payer_name ?? "—"}
              {record.payer_email ? (
                <span className="ml-2 text-xs text-[var(--deck-text-3)]">{record.payer_email}</span>
              ) : null}
            </DetailRow>
            <DetailRow label="Description">{record.description ?? "—"}</DetailRow>
            <DetailRow label="Source">
              {SOURCE_LABELS[record.source] ?? titleCase(record.source)}
              {record.external_reference ? (
                <span className="deck-mono ml-2 text-xs text-[var(--deck-text-3)]">
                  ref {record.external_reference}
                </span>
              ) : null}
            </DetailRow>
            <DetailRow label="Stripe Reference">
              <span className="deck-mono text-xs">{record.stripe_payment_intent_id}</span>
              {record.stripe_receipt_url ? (
                <a
                  href={record.stripe_receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-xs text-[var(--deck-accent-ink)] hover:underline"
                >
                  Stripe receipt
                </a>
              ) : null}
            </DetailRow>
            {record.status !== "unmatched" ? (
              <>
                <DetailRow label="Resolved">
                  {record.resolved_at ? formatDateTime(record.resolved_at) : "—"}
                  {record.resolved_by_profile ? (
                    <span className="ml-2 text-xs text-[var(--deck-text-3)]">
                      by {record.resolved_by_profile.full_name ?? record.resolved_by_profile.email}
                    </span>
                  ) : null}
                </DetailRow>
                {record.status === "matched" ? (
                  <DetailRow label="Matched To">
                    {record.matched_invoice_id ? (
                      <Link
                        href={`/portal/admin/invoices/${record.matched_invoice_id}`}
                        className="deck-mono text-[var(--deck-accent-ink)] hover:underline"
                      >
                        {record.matched_invoice?.invoice_number ?? "Invoice"}
                      </Link>
                    ) : (
                      "—"
                    )}
                    {record.matched_payment?.receipt_number ? (
                      <span className="deck-mono ml-2 text-xs text-[var(--deck-text-3)]">
                        receipt {record.matched_payment.receipt_number}
                      </span>
                    ) : null}
                  </DetailRow>
                ) : null}
                {record.resolution_note ? (
                  <DetailRow label="Note">{record.resolution_note}</DetailRow>
                ) : null}
              </>
            ) : null}
          </dl>

          {record.status === "unmatched" ? (
            <div className="mt-5 grid gap-4">
              <form action={matchStripeExternalPayment} className="grid gap-2.5">
                <input type="hidden" name="external_id" value={record.id} />
                <p className="text-sm font-semibold text-[var(--deck-text)]">Match to an invoice</p>
                {invoiceOptions.length ? (
                  <>
                    <DeckSelect
                      name="invoice_id"
                      aria-label="Invoice"
                      options={[{ value: "", label: "Select invoice…" }, ...invoiceOptions]}
                    />
                    <label className="flex items-center gap-2 text-sm text-[var(--deck-text-2)]">
                      <input type="checkbox" name="send_receipt" value="on" className="h-4 w-4 accent-[var(--deck-accent)]" />
                      Email the client an AMG receipt
                    </label>
                    <div>
                      <Button type="submit" size="sm">
                        Record against invoice
                      </Button>
                    </div>
                    <p className="text-xs leading-5 text-[var(--deck-text-3)]">
                      Records the full {formatMoney(Number(record.amount_cents) / 100)} as a Stripe payment on the
                      selected invoice, with receipt number and audit trail.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--deck-text-3)]">
                    No open invoices to match against — create or send the invoice first.
                  </p>
                )}
              </form>
              <form action={dismissStripeExternalPayment} className="grid gap-2.5 border-t border-[var(--deck-line)] pt-4">
                <input type="hidden" name="external_id" value={record.id} />
                <p className="text-sm font-semibold text-[var(--deck-text)]">Or dismiss</p>
                <input
                  name="resolution_note"
                  placeholder="Why this payment needs no invoice (optional)"
                  aria-label="Dismissal note"
                  className="deck-input"
                />
                <div>
                  <Button type="submit" size="sm" variant="outline">
                    Dismiss
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          {record.status === "dismissed" ? (
            <form action={reopenStripeExternalPayment} className="mt-5">
              <input type="hidden" name="external_id" value={record.id} />
              <Button type="submit" size="sm" variant="outline">
                Reopen for matching
              </Button>
            </form>
          ) : null}
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
