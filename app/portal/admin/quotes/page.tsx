import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import { TableSelectionScope } from "@/components/portal/ui/data-table-selection";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import { bulkDeleteQuotes } from "@/app/portal/actions/bulk-records";
import { DetailRow, EmptyState, FilterTabs } from "@/components/portal/ui/primitives";
import { RecordListShell } from "@/components/portal/ui/record-list-shell";
import { RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { DeckSelect } from "@/components/portal/ui/fields";
import { listAllQuotes } from "@/lib/portal/queries";
import {
  QUOTE_STATUS,
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Quotes - Admin Portal" };

const PAGE_SIZE = 25;

type Params = {
  bulk?: string;
  deleted?: string;
  released?: string;
  skipped?: string;
  error?: string;
  q?: string;
  status?: string;
  mission?: string;
  client?: string;
  page?: string;
  record?: string;
};

function listQuery(params: Params, overrides: Record<string, string | undefined> = {}) {
  const keep: (keyof Params)[] = ["q", "status", "mission", "client", "page"];
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

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireRolePermission("admin", "quotes");
  const params = await searchParams;
  const quotes = await listAllQuotes();
  const basePath = "/portal/admin/quotes";

  // Scoped filter options derived from the quotes on file.
  const missionOptions = Array.from(
    new Map(
      quotes
        .filter((row) => row.mission_id && row.mission?.ref)
        .map((row) => [row.mission_id as string, row.mission!.ref])
    ).entries()
  ).map(([value, label]) => ({ value, label }));
  const clientOptions = Array.from(
    new Map(
      quotes
        .filter((row) => row.client_id)
        .map((row) => [row.client_id as string, clientLabel(row.client)])
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  const q = params.q?.trim().toLowerCase();
  const filtered = quotes.filter((row) => {
    if (params.status && row.status !== params.status) return false;
    if (params.mission && row.mission_id !== params.mission) return false;
    if (params.client && row.client_id !== params.client) return false;
    if (q) {
      const haystack = [
        row.ref,
        row.quote_number,
        row.mission?.ref,
        row.client?.company_name,
        row.client?.full_name,
        row.client?.email,
        row.manual_client_name,
        row.manual_client_company,
        row.recipient_email,
        row.route_summary,
        row.tail_number,
        row.aircraft_summary,
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
  const hasFilters = Boolean(params.q || params.status || params.mission || params.client);

  // Detail record resolves against the full register so shared ?record=
  // links open even when the current filters exclude the quote.
  const record = params.record
    ? quotes.find((row) => row.id === params.record) ?? null
    : null;
  const recordHref = (id: string) => `${basePath}${listQuery(params, { record: id })}`;
  const canEditRecord = record ? ["draft", "internal_review"].includes(record.status) : false;

  return (
    <RecordListShell
      eyebrow="AMG Billing"
      title="Quotes"
      description="Build, send, revise, and convert AMG aviation support quotes."
      actions={
        <Button asChild size="sm">
          {/* The quote builder is a multi-section editor (line items, deposit
              terms, PDF presentation) — it stays a full page, not a modal. */}
          <Link href="/portal/admin/quotes/new">+ New Quote</Link>
        </Button>
      }
      notices={<BulkResultNotice params={params} entityLabel="quote" />}
      chips={
        <FilterTabs
          basePath={basePath}
          param="status"
          current={params.status ?? ""}
          preserve={{ q: params.q, mission: params.mission, client: params.client }}
          options={[
            { value: "", label: "All" },
            ...QUOTE_STATUS.map((status) => ({ value: status.value, label: status.label })),
          ]}
        />
      }
      filterRow={
        <form className="flex flex-wrap items-center gap-2">
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Quote #, client, mission, route…"
            aria-label="Search quotes"
            className="deck-input min-w-[12rem] flex-1 sm:max-w-xs"
          />
          <DeckSelect
            name="mission"
            defaultValue={params.mission ?? ""}
            aria-label="Mission"
            className="w-auto min-w-[9.5rem]"
            options={[{ value: "", label: "All Missions" }, ...missionOptions]}
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
      count={`${filtered.length} / ${quotes.length} ${quotes.length === 1 ? "quote" : "quotes"}`}
      table={
        filtered.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No quotes"
            description={
              hasFilters
                ? "No quotes match the current filters."
                : "Quotes you create will appear here."
            }
            action={
              hasFilters ? null : (
                <Button asChild size="sm">
                  <Link href="/portal/admin/quotes/new">+ New Quote</Link>
                </Button>
              )
            }
          />
        ) : (
          <TableSelectionScope
            action={bulkDeleteQuotes}
            entity="quote"
            backTo={`${basePath}${listQuery(params)}`}
            entityLabel="quote"
            confirm="Delete the selected quotes? Only Draft and Internal Review quotes are deleted — anything already sent to a client, approved, or converted is skipped automatically (void those instead)."
          >
            <DataTable
              selectable
              rows={paged}
              getKey={(row) => row.id}
              getHref={(row) => recordHref(row.id)}
              emptyLabel="No quotes created."
              columns={[
                {
                  header: "Quote #",
                  priority: "primary",
                  cell: (row) => (
                    <span className="deck-mono text-[var(--deck-accent-ink)]">{row.ref}</span>
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
                  header: "Client",
                  cell: (row) => (
                    <span className="text-[var(--deck-text-2)]">{clientLabel(row.client)}</span>
                  ),
                },
                {
                  header: "Total",
                  align: "right",
                  cell: (row) => <span className="deck-num">{formatMoney(row.total)}</span>,
                },
                {
                  header: "Created",
                  hideOnMobile: true,
                  cell: (row) => (
                    <span className="whitespace-nowrap text-[var(--deck-text-2)]">
                      {formatDateTime(row.created_at)}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  cell: (row) => (
                    <StatusBadge
                      label={QUOTE_STATUS_LABEL[row.status] ?? row.status}
                      tone={toneFor(QUOTE_STATUS_TONE, row.status)}
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
          mission: params.mission,
          client: params.client,
        },
      }}
    >
      {record ? (
        <RecordModal
          eyebrow="Quote"
          title={record.ref}
          meta={`Created ${formatDateTime(record.created_at)} · Version ${record.version_number}`}
          badge={
            <StatusBadge
              label={QUOTE_STATUS_LABEL[record.status] ?? record.status}
              tone={toneFor(QUOTE_STATUS_TONE, record.status)}
            />
          }
          actions={
            <>
              <Button asChild size="sm">
                <Link href={`/portal/admin/quotes/${record.id}`}>Open full record</Link>
              </Button>
              {canEditRecord ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/portal/admin/quotes/${record.id}/edit`}>Edit quote</Link>
                </Button>
              ) : null}
              {record.mission_id ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/portal/admin/trips/${record.mission_id}`}>Open mission</Link>
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
                [record.manual_client_name, record.manual_client_company]
                  .filter(Boolean)
                  .join(" · ") || "—"
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
                "Standalone quote"
              )}
            </DetailRow>
            {record.route_summary ? (
              <DetailRow label="Route">{record.route_summary}</DetailRow>
            ) : null}
            {record.aircraft_summary || record.tail_number ? (
              <DetailRow label="Aircraft">
                {[record.aircraft_summary, record.tail_number].filter(Boolean).join(" · ")}
              </DetailRow>
            ) : null}
            {record.requested_timing ? (
              <DetailRow label="Timing">{record.requested_timing}</DetailRow>
            ) : null}
            {record.service_scope ? (
              <DetailRow label="Scope">{record.service_scope}</DetailRow>
            ) : null}
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
            <DetailRow label="Deposit">
              {record.deposit_required || record.deposit_amount ? (
                <>
                  <span className="deck-num">{formatMoney(record.deposit_amount)}</span>
                  {record.deposit_percent ? ` (${record.deposit_percent}%)` : ""}
                  {record.deposit_due_date ? ` · due ${formatDate(record.deposit_due_date)}` : ""}
                </>
              ) : (
                "Not required"
              )}
            </DetailRow>
            {record.expires_at ? (
              <DetailRow label="Expires">{formatDate(record.expires_at)}</DetailRow>
            ) : null}
            <DetailRow label="Timeline">
              <span className="grid gap-0.5 text-sm">
                <span>Created {formatDateTime(record.created_at)}</span>
                {record.sent_at ? <span>Sent {formatDateTime(record.sent_at)}</span> : null}
                {record.approved_at ? (
                  <span>Approved {formatDateTime(record.approved_at)}</span>
                ) : null}
                {record.rejected_at ? (
                  <span>Rejected {formatDateTime(record.rejected_at)}</span>
                ) : null}
              </span>
            </DetailRow>
          </dl>
        </RecordModal>
      ) : null}
    </RecordListShell>
  );
}
