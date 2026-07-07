import Link from "next/link";
import { LineItemsEditor } from "@/components/portal/admin/line-items-editor";
import { cn } from "@/lib/utils";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import { TableSelectionScope } from "@/components/portal/ui/data-table-selection";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import { bulkDeleteInvoices } from "@/app/portal/actions/bulk-records";
import { DetailRow, EmptyState, FilterTabs, Notice } from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { FormModal, RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { DeckSelect, SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { ClientPickerField } from "@/components/portal/ui/combobox";
import { createInvoiceFromQuote, createStandaloneInvoice } from "@/app/portal/actions/invoices";
import {
  listAllAircraft,
  listAllInvoices,
  listAllMissions,
  listAllQuotes,
  listClients,
} from "@/lib/portal/queries";
import {
  INVOICE_STATUS,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  QUOTE_CATEGORIES,
  toneFor,
} from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Invoices - Admin Portal" };

const PAGE_SIZE = 25;

type Params = {
  success?: string;
  error?: string;
  bulk?: string;
  deleted?: string;
  released?: string;
  skipped?: string;
  q?: string;
  status?: string;
  client?: string;
  mission?: string;
  page?: string;
  record?: string;
  new?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["q", "status", "client", "mission", "page"];
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

function clientLabel(client: { company_name: string | null; full_name: string | null; email: string } | null) {
  return client?.company_name ?? client?.full_name ?? client?.email ?? "—";
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "invoices");
  const params = await searchParams;
  const [invoices, quotes, clients, missions, aircraft] = await Promise.all([
    listAllInvoices(),
    listAllQuotes(),
    listClients(),
    listAllMissions(),
    listAllAircraft(),
  ]);
  const acceptedQuotes = quotes.filter((quote) => ["approved", "accepted"].includes(quote.status));
  const basePath = "/portal/admin/invoices";

  // Scoped filter options derived from the invoices on file.
  const clientOptions = Array.from(
    new Map(
      invoices
        .filter((row) => row.client_id)
        .map((row) => [row.client_id as string, clientLabel(row.client)])
    ).entries()
  ).map(([value, label]) => ({ value, label }));
  const missionOptions = Array.from(
    new Map(
      invoices
        .filter((row) => row.mission_id && row.mission?.ref)
        .map((row) => [row.mission_id as string, row.mission!.ref])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const q = params.q?.trim().toLowerCase();
  const filtered = invoices.filter((row) => {
    if (params.status && row.status !== params.status) return false;
    if (params.client && row.client_id !== params.client) return false;
    if (params.mission && row.mission_id !== params.mission) return false;
    if (q) {
      const haystack = [
        row.invoice_number,
        row.client?.company_name,
        row.client?.full_name,
        row.client?.email,
        row.mission?.ref,
        row.quote?.ref,
        row.recipient_email,
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
  const hasFilters = Boolean(params.q || params.status || params.client || params.mission);

  // Detail record resolves against the full register so shared ?record=
  // links open even when the current filters exclude the invoice.
  const record = params.record
    ? invoices.find((row) => row.id === params.record) ?? null
    : null;
  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;
  const canEditRecord = record ? ["draft", "ready_to_send"].includes(record.status) : false;

  // Create window: ?new=quote (from accepted quote, default) or ?new=standalone.
  const createOpen = Boolean(params.new);
  const createTab = params.new === "standalone" ? "standalone" : "quote";
  const createHref = (tab: string) =>
    `${basePath}${listQuery(params, { new: tab, page: undefined })}`;
  const createTabClass = (active: boolean) =>
    cn(
      "shrink-0 rounded-[0.25rem] border px-3 py-1.5 font-mono text-[0.68rem] font-semibold uppercase [letter-spacing:0.08em] transition-colors",
      active
        ? "border-[var(--deck-accent)] bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]"
        : "border-[var(--deck-line-strong)] bg-[var(--deck-panel)] text-[var(--deck-text-2)] hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)]"
    );

  const errorNotice =
    params.error === "missing" ? (
      <Notice tone="danger">Required invoice fields are missing.</Notice>
    ) : params.error === "quote" ? (
      <Notice tone="danger">Quote could not be found.</Notice>
    ) : params.error === "save" ? (
      <Notice tone="danger">
        Invoice could not be saved. Check billing database patch and required fields.
      </Notice>
    ) : params.error === "payment" ? (
      <Notice tone="danger">Payment could not be recorded.</Notice>
    ) : null;

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Invoices"
      description="Create, send, track, and reconcile client invoices."
      actions={
        <Button asChild size="sm">
          <Link href={createHref("quote")}>+ New Invoice</Link>
        </Button>
      }
      notices={
        <>
          {params.success ? <Notice tone="success">Invoice updated.</Notice> : null}
          {!createOpen ? errorNotice : null}
          <BulkResultNotice params={params} entityLabel="invoice" />
        </>
      }
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          preserve={{ q: params.q, client: params.client, mission: params.mission }}
          options={[
            { value: "", label: "All" },
            ...INVOICE_STATUS.map((status) => ({ value: status.value, label: status.label })),
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Invoice #, client, mission, quote…"
            aria-label="Search invoices"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="client"
            defaultValue={params.client ?? ""}
            aria-label="Client"
            className="w-auto min-w-[9.5rem]"
            options={[{ value: "", label: "All Clients" }, ...clientOptions]}
          />
          <DeckSelect
            name="mission"
            defaultValue={params.mission ?? ""}
            aria-label="Mission"
            className="w-auto min-w-[9.5rem]"
            options={[{ value: "", label: "All Missions" }, ...missionOptions]}
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
      count={`${filtered.length} / ${invoices.length} ${invoices.length === 1 ? "invoice" : "invoices"}`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="No invoices"
            description={
              hasFilters
                ? "No invoices match the current filters."
                : "Invoices you create will appear here."
            }
            action={
              hasFilters ? null : (
                <Button asChild size="sm">
                  <Link href={createHref("quote")}>+ New Invoice</Link>
                </Button>
              )
            }
          />
        ) : (
          <TableSelectionScope
            action={bulkDeleteInvoices}
            entity="invoice"
            backTo={`${basePath}${listQuery(params)}`}
            entityLabel="invoice"
            confirm="Delete the selected invoices? Only unsent drafts with no payments and no Stripe activity are deleted — every other invoice is skipped automatically (void or write off those instead)."
          >
            <DataTable
              selectable
              rows={paged}
              getKey={(row) => row.id}
              getHref={(row) => recordHref(row.id)}
              emptyLabel="No invoices created."
              columns={[
                {
                  header: "Invoice #",
                  priority: "primary",
                  cell: (row) => (
                    <span className="deck-mono text-[var(--deck-accent-ink)]">
                      {row.invoice_number}
                    </span>
                  ),
                },
                {
                  header: "Client",
                  cell: (row) => (
                    <span className="text-[var(--deck-text-2)]">{clientLabel(row.client)}</span>
                  ),
                },
                {
                  header: "Mission",
                  cell: (row) =>
                    row.mission?.ref ? (
                      <span className="deck-mono text-[var(--deck-text-2)]">{row.mission.ref}</span>
                    ) : (
                      "—"
                    ),
                },
                {
                  header: "Total",
                  align: "right",
                  cell: (row) => <span className="deck-num">{formatMoney(row.total)}</span>,
                },
                {
                  header: "Due",
                  hideOnMobile: true,
                  cell: (row) => (
                    <span className="whitespace-nowrap text-[var(--deck-text-2)]">
                      {formatDate(row.due_date)}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  cell: (row) => (
                    <StatusBadge
                      label={INVOICE_STATUS_LABEL[row.status] ?? row.status}
                      tone={toneFor(INVOICE_STATUS_TONE, row.status)}
                    />
                  ),
                },
              ]}
            />
          </TableSelectionScope>
        )
      }
      pagination={{
        basePath,
        page: safePage,
        pageCount,
        params: {
          q: params.q,
          status: params.status,
          client: params.client,
          mission: params.mission,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow="Invoice"
          title={record.invoice_number}
          meta={`Created ${formatDateTime(record.created_at)}${
            record.due_date ? ` · due ${formatDate(record.due_date)}` : ""
          }`}
          badge={
            <StatusBadge
              label={INVOICE_STATUS_LABEL[record.status] ?? record.status}
              tone={toneFor(INVOICE_STATUS_TONE, record.status)}
            />
          }
          actions={
            <>
              <Button asChild size="sm">
                <Link href={`/portal/admin/invoices/${record.id}`}>Open full record</Link>
              </Button>
              {canEditRecord ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/portal/admin/invoices/${record.id}/edit`}>Edit invoice</Link>
                </Button>
              ) : null}
            </>
          }
        >
          <dl>
            <DetailRow label="Client">
              {record.client_id ? (
                <Link
                  href={`/portal/admin/clients/${record.client_id}`}
                  className="text-[var(--deck-accent-ink)] hover:underline"
                >
                  {clientLabel(record.client)}
                </Link>
              ) : (
                clientLabel(record.client)
              )}
              {record.recipient_email ? (
                <span className="ml-2 text-xs text-[var(--deck-text-3)]">
                  {record.recipient_email}
                </span>
              ) : null}
            </DetailRow>
            <DetailRow label="Mission">
              {record.mission_id && record.mission?.ref ? (
                <Link
                  href={`/portal/admin/trips/${record.mission_id}`}
                  className="deck-mono text-[var(--deck-accent-ink)] hover:underline"
                >
                  {record.mission.ref}
                </Link>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Quote">
              {record.quote_id && record.quote?.ref ? (
                <Link
                  href={`/portal/admin/quotes/${record.quote_id}`}
                  className="deck-mono text-[var(--deck-accent-ink)] hover:underline"
                >
                  {record.quote.ref}
                </Link>
              ) : (
                "Standalone invoice"
              )}
            </DetailRow>
            <DetailRow label="Due Date">{formatDate(record.due_date)}</DetailRow>
            <DetailRow label="Totals">
              <span className="grid gap-0.5 text-sm">
                <span>
                  Subtotal <span className="deck-num">{formatMoney(record.subtotal)}</span>
                </span>
                {record.discount_total ? (
                  <span>
                    Discount <span className="deck-num">-{formatMoney(record.discount_total)}</span>
                  </span>
                ) : null}
                {record.tax_total ? (
                  <span>
                    Tax <span className="deck-num">{formatMoney(record.tax_total)}</span>
                  </span>
                ) : null}
                <span className="font-semibold">
                  Total <span className="deck-num">{formatMoney(record.total)}</span>
                </span>
              </span>
            </DetailRow>
            <DetailRow label="Paid">
              <span className="deck-num">{formatMoney(record.amount_paid)}</span>
            </DetailRow>
            <DetailRow label="Balance">
              <span className="deck-num font-semibold">{formatMoney(record.amount_due)}</span>
            </DetailRow>
            {record.deposit_required ? (
              <DetailRow label="Deposit">
                <span className="deck-num">{formatMoney(record.deposit_amount)}</span>
                {" required · "}
                <span className="deck-num">{formatMoney(record.deposit_paid)}</span>
                {" paid"}
              </DetailRow>
            ) : null}
            <DetailRow label="Timeline">
              <span className="grid gap-0.5 text-sm">
                <span>Created {formatDateTime(record.created_at)}</span>
                {record.issued_at ? <span>Issued {formatDateTime(record.issued_at)}</span> : null}
                {record.sent_at ? <span>Sent {formatDateTime(record.sent_at)}</span> : null}
                {record.paid_at ? <span>Paid {formatDateTime(record.paid_at)}</span> : null}
              </span>
            </DetailRow>
            {record.terms ? <DetailRow label="Terms">{record.terms}</DetailRow> : null}
          </dl>
          <p className="mt-4 text-xs leading-5 text-[var(--deck-text-3)]">
            Line items, PDFs, payment recording, and status workflows live on the full record.
          </p>
        </RecordModal>
      ) : null}

      {createOpen ? (
        <FormModal
          eyebrow="AMG Billing"
          title="New invoice"
          meta="Convert an accepted quote or build a standalone invoice."
          paramKeys={["new"]}
          wide
        >
          {errorNotice ? <div className="mb-4">{errorNotice}</div> : null}
          <div className="mb-5 flex flex-wrap gap-2">
            <Link href={createHref("quote")} className={createTabClass(createTab === "quote")}>
              From accepted quote
            </Link>
            <Link
              href={createHref("standalone")}
              className={createTabClass(createTab === "standalone")}
            >
              Standalone
            </Link>
          </div>

          {createTab === "quote" ? (
            <form action={createInvoiceFromQuote} className="grid gap-4">
              <SelectField
                label="Accepted Quote"
                name="quote_id"
                required
                defaultValue=""
                options={[
                  { value: "", label: "Select accepted quote..." },
                  ...acceptedQuotes.map((quote) => ({
                    value: quote.id,
                    label: `${quote.ref} - ${quote.client?.company_name ?? quote.client?.full_name ?? quote.client?.email ?? "Client"} - ${formatMoney(quote.total)}`,
                  })),
                ]}
              />
              <TextField label="Due Date" name="due_date" type="date" />
              <TextAreaField
                label="Terms"
                name="terms"
                defaultValue="Due on receipt unless otherwise agreed in writing."
              />
              <div className="flex gap-3">
                <SubmitButton name="intent" value="draft" pendingText="Creating...">
                  Create Draft
                </SubmitButton>
                <SubmitButton name="intent" value="send" pendingText="Sending...">
                  Create & Send
                </SubmitButton>
              </div>
            </form>
          ) : (
            <form action={createStandaloneInvoice} className="grid gap-4 sm:grid-cols-2">
              <ClientPickerField clients={clients} required />
              <SelectField
                label="Status"
                name="status"
                defaultValue="draft"
                options={INVOICE_STATUS.map((status) => ({
                  value: status.value,
                  label: status.label,
                }))}
              />
              <SelectField
                label="Mission"
                name="mission_id"
                defaultValue=""
                options={[
                  { value: "", label: "No mission" },
                  ...missions.map((mission) => ({ value: mission.id, label: mission.ref })),
                ]}
              />
              <SelectField
                label="Aircraft"
                name="aircraft_id"
                defaultValue=""
                options={[
                  { value: "", label: "No aircraft" },
                  ...aircraft.map((item) => ({ value: item.id, label: item.tail_number })),
                ]}
              />
              <TextField label="Due Date" name="due_date" type="date" />
              <TextField label="Discount" name="discount_total" type="number" min="0" step="0.01" />
              <TextField
                label="Manual Tax"
                name="tax_total"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
              />
              <div className="sm:col-span-2">
                <LineItemsEditor
                  categories={[...QUOTE_CATEGORIES]}
                  defaultCategory={QUOTE_CATEGORIES[0]}
                  requireFirst
                />
              </div>
              <div className="sm:col-span-2">
                <TextAreaField label="Client Notes" name="client_notes" />
              </div>
              <div className="sm:col-span-2">
                <SubmitButton pendingText="Creating...">Create Invoice</SubmitButton>
              </div>
            </form>
          )}
        </FormModal>
      ) : null}
    </RecordListShell>
  );
}
