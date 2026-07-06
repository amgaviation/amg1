import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import { Notice, SectionCard, Timeline } from "@/components/portal/ui/primitives";
import { DescriptionList } from "@/components/portal/ui/description-list";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { TextAreaField } from "@/components/portal/ui/fields";
import { convertApprovedQuoteToInvoice, createQuoteRevision, previewQuotePdf, sendQuote } from "@/app/portal/actions/quotes";
import { getQuoteDetail } from "@/lib/portal/queries";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Quote Detail - Admin Portal" };

export default async function AdminQuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("admin", "quotes");
  const { id } = await params;
  const flash = await searchParams;
  const quote = await getQuoteDetail(id);
  if (!quote) notFound();

  const latestDocument = quote.documents[0];
  const canEdit = ["draft", "internal_review"].includes(quote.status);
  const canSend = !["approved", "converted", "void"].includes(quote.status);
  const canConvert = quote.status === "approved" && !(quote as any).converted_invoice_id;
  const canRevise = !canEdit && quote.status !== "void";
  const activityItems = [
    ...quote.documents.map((document) => ({
      at: document.created_at,
      title: `${document.document_number} generated`,
      body: document.emailed_at
        ? `Sent to ${document.emailed_to?.join(", ") || "recipient"}`
        : "PDF generated and stored.",
    })),
    ...quote.auditEvents.map((event) => ({
      at: event.created_at,
      title: event.action.replace(/_/g, " "),
      body: event.detail ?? event.actor_email ?? undefined,
    })),
  ]
    .sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime())
    .slice(0, 12)
    .map((item) => ({
      title: item.title,
      meta: formatDateTime(item.at),
      body: item.body,
    }));

  return (
    <>
      {flash.success ? <Notice tone="success">Quote updated.</Notice> : null}
      {flash.error === "locked" ? <Notice tone="danger">This quote is locked. Create a revision before changing sent or approved terms.</Notice> : null}
      {flash.error === "not-approved" ? <Notice tone="danger">Only approved quotes can be converted to invoice.</Notice> : null}
      {flash.error === "revision" ? <Notice tone="danger">A quote revision could not be created.</Notice> : null}

      {/* Detail-archetype summary header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">Quote</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="deck-title text-[1.65rem] sm:text-[2rem]">{quote.ref}</h1>
            <StatusBadge label={QUOTE_STATUS_LABEL[quote.status] ?? quote.status} tone={toneFor(QUOTE_STATUS_TONE, quote.status)} />
          </div>
          <p className="deck-mono mt-2.5 !text-[0.8rem] text-[var(--deck-text-2)]">
            {formatMoney(quote.total)}
            {" · "}
            {(quote as any).manual_client_company ?? (quote as any).manual_client_name ?? "Unassigned client"}
            {quote.mission?.ref ? ` · ${quote.mission.ref}` : ""}
          </p>
        </div>
        <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Link
              href={`/portal/admin/quotes/${quote.id}/edit`}
              className="rounded-md border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] px-4 py-2 text-xs font-semibold text-[var(--deck-accent-ink)] transition-colors hover:border-[var(--deck-accent)]"
            >
              Edit Draft
            </Link>
          ) : null}
          {latestDocument ? (
            <Link
              href={`/portal/billing-documents/${latestDocument.id}/view`}
              className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              View PDF
            </Link>
          ) : null}
          {(quote as any).converted_invoice_id ? (
            <Link
              href={`/portal/admin/invoices/${(quote as any).converted_invoice_id}`}
              className="rounded-full border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] px-4 py-2 text-xs font-semibold text-[var(--deck-accent-ink)] transition-colors hover:border-[var(--deck-accent)]"
            >
              View Invoice
            </Link>
          ) : null}
          <Link
            href="/portal/admin/quotes"
            className="rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
          >
            All Quotes
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <SectionCard title="Line Items" icon="receipt">
            <DataTable
              rows={quote.items}
              getKey={(row) => row.id}
              emptyLabel="No line items."
              columns={[
                { header: "Category", cell: (row) => row.category },
                { header: "Description", cell: (row) => row.description ?? "-" },
                { header: "Cost Type", cell: (row) => (row as any).cost_type ?? "-" },
                { header: "Qty", cell: (row) => row.quantity, align: "right" },
                { header: "Unit", cell: (row) => formatMoney(row.unit_price), align: "right" },
                { header: "Amount", cell: (row) => formatMoney(row.amount), align: "right" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Document Activity" icon="fileText">
            <DataTable
              rows={quote.documents}
              getKey={(row) => row.id}
              emptyLabel="No PDFs generated."
              columns={[
                { header: "Document", cell: (row) => row.document_number },
                { header: "Generated", cell: (row) => formatDateTime(row.created_at) },
                { header: "Sent", cell: (row) => formatDateTime(row.emailed_at) },
                { header: "Recipients", cell: (row) => row.emailed_to?.join(", ") || "-" },
                {
                  header: "File",
                  cell: (row) => <Link href={`/portal/billing-documents/${row.id}/view`} className="text-accent hover:underline">PDF</Link>,
                },
              ]}
            />
          </SectionCard>

          <SectionCard title="Activity Timeline" icon="history">
            {activityItems.length ? (
              <Timeline items={activityItems} />
            ) : (
              <p className="text-sm text-muted-foreground">No quote activity recorded yet.</p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Quote Summary" icon="receipt">
            <DescriptionList
              columns={1}
              items={[
                { label: "Client", value: (quote as any).manual_client_company ?? (quote as any).manual_client_name ?? quote.client_id ?? "-" },
                { label: "Recipient", value: (quote as any).recipient_email ?? (quote as any).manual_client_email ?? "-" },
                { label: "Mission", value: quote.mission?.ref ?? "-", mono: true },
                { label: "Aircraft", value: (quote as any).aircraft_summary ?? "-" },
                { label: "Tail", value: (quote as any).tail_number ?? "-", mono: true },
                { label: "Route", value: (quote as any).route_summary ?? "-", mono: true },
                { label: "Subtotal", value: formatMoney(quote.subtotal), mono: true },
                { label: "Discount", value: formatMoney((quote as any).discount_total ?? 0), mono: true },
                { label: "Tax", value: formatMoney((quote as any).tax_total ?? 0), mono: true },
                { label: "Deposit", value: formatMoney((quote as any).deposit_amount ?? 0), mono: true },
                { label: "Total", value: formatMoney(quote.total), mono: true },
                { label: "Sent", value: formatDateTime((quote as any).sent_at) },
                { label: "Expires", value: formatDate((quote as any).expires_at) },
                { label: "Approved", value: formatDateTime((quote as any).approved_at) },
              ]}
            />
          </SectionCard>

          <SectionCard title="Actions" icon="settings">
            <div className="space-y-3">
              <form action={previewQuotePdf}>
                <input type="hidden" name="quote_id" value={quote.id} />
                <SubmitButton className="w-full" pendingText="Generating...">Preview PDF</SubmitButton>
              </form>
              {canSend ? (
                <form action={sendQuote}>
                  <input type="hidden" name="quote_id" value={quote.id} />
                  <SubmitButton className="w-full" pendingText="Sending...">Send / Resend PDF</SubmitButton>
                </form>
              ) : null}
              {canConvert ? (
                <form action={convertApprovedQuoteToInvoice}>
                  <input type="hidden" name="quote_id" value={quote.id} />
                  <SubmitButton className="w-full" pendingText="Creating...">Create Invoice Draft</SubmitButton>
                </form>
              ) : null}
              {canRevise ? (
                <form action={createQuoteRevision} className="space-y-3 rounded-md border border-border p-3">
                  <input type="hidden" name="quote_id" value={quote.id} />
                  <TextAreaField label="Revision Reason" name="revision_reason" placeholder="Client requested aircraft, scope, date, or pricing changes..." />
                  <SubmitButton className="w-full" pendingText="Creating...">Create Revision Draft</SubmitButton>
                </form>
              ) : null}
              {canRevise ? (
                <p className="text-xs text-muted-foreground">Sent, approved, and converted quotes are locked from direct total edits. Create a revision for changed terms.</p>
              ) : null}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
