import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { DetailRow, Notice, PageHeader, SectionCard, Timeline } from "@/components/portal/ui/primitives";
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
  const user = await requireRole("admin");
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
    <PortalShell role="admin" user={user}>
      {flash.success ? <Notice tone="success">Quote updated.</Notice> : null}
      {flash.error === "locked" ? <Notice tone="danger">This quote is locked. Create a revision before changing sent or approved terms.</Notice> : null}
      {flash.error === "not-approved" ? <Notice tone="danger">Only approved quotes can be converted to invoice.</Notice> : null}
      {flash.error === "revision" ? <Notice tone="danger">A quote revision could not be created.</Notice> : null}

      <PageHeader
        eyebrow="Quote"
        title={quote.ref}
        actions={
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {canEdit ? <Link href={`/portal/admin/quotes/${quote.id}/edit`} className="text-accent hover:underline">Edit Draft</Link> : null}
            {latestDocument ? (
              <Link href={`/portal/billing-documents/${latestDocument.id}/view`} className="text-accent hover:underline">View PDF</Link>
            ) : null}
            <Link href="/portal/admin/quotes" className="text-muted-foreground hover:text-accent">Back to quotes</Link>
          </div>
        }
      />

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
            <dl>
              <DetailRow label="Status"><StatusBadge label={QUOTE_STATUS_LABEL[quote.status] ?? quote.status} tone={toneFor(QUOTE_STATUS_TONE, quote.status)} /></DetailRow>
              <DetailRow label="Client">{(quote as any).manual_client_company ?? (quote as any).manual_client_name ?? quote.client_id ?? "-"}</DetailRow>
              <DetailRow label="Recipient">{(quote as any).recipient_email ?? (quote as any).manual_client_email ?? "-"}</DetailRow>
              <DetailRow label="Mission">{quote.mission?.ref ?? "-"}</DetailRow>
              <DetailRow label="Aircraft">{(quote as any).aircraft_summary ?? "-"}</DetailRow>
              <DetailRow label="Tail">{(quote as any).tail_number ?? "-"}</DetailRow>
              <DetailRow label="Route">{(quote as any).route_summary ?? "-"}</DetailRow>
              <DetailRow label="Subtotal">{formatMoney(quote.subtotal)}</DetailRow>
              <DetailRow label="Discount">{formatMoney((quote as any).discount_total ?? 0)}</DetailRow>
              <DetailRow label="Tax">{formatMoney((quote as any).tax_total ?? 0)}</DetailRow>
              <DetailRow label="Deposit">{formatMoney((quote as any).deposit_amount ?? 0)}</DetailRow>
              <DetailRow label="Total">{formatMoney(quote.total)}</DetailRow>
              <DetailRow label="Sent">{formatDateTime((quote as any).sent_at)}</DetailRow>
              <DetailRow label="Expires">{formatDate((quote as any).expires_at)}</DetailRow>
              <DetailRow label="Approved">{formatDateTime((quote as any).approved_at)}</DetailRow>
            </dl>
          </SectionCard>

          <SectionCard title="Actions" icon="settings">
            <div className="space-y-3">
              <form action={previewQuotePdf}>
                <input type="hidden" name="quote_id" value={quote.id} />
                <SubmitButton className="w-full rounded-full" pendingText="Generating...">Preview PDF</SubmitButton>
              </form>
              {canSend ? (
                <form action={sendQuote}>
                  <input type="hidden" name="quote_id" value={quote.id} />
                  <SubmitButton className="w-full rounded-full" pendingText="Sending...">Send / Resend PDF</SubmitButton>
                </form>
              ) : null}
              {canConvert ? (
                <form action={convertApprovedQuoteToInvoice}>
                  <input type="hidden" name="quote_id" value={quote.id} />
                  <SubmitButton className="w-full rounded-full" pendingText="Creating...">Create Invoice Draft</SubmitButton>
                </form>
              ) : null}
              {canRevise ? (
                <form action={createQuoteRevision} className="space-y-3 rounded-md border border-border p-3">
                  <input type="hidden" name="quote_id" value={quote.id} />
                  <TextAreaField label="Revision Reason" name="revision_reason" placeholder="Client requested aircraft, scope, date, or pricing changes..." />
                  <SubmitButton className="w-full rounded-full" pendingText="Creating...">Create Revision Draft</SubmitButton>
                </form>
              ) : null}
              {canRevise ? (
                <p className="text-xs text-muted-foreground">Sent, approved, and converted quotes are locked from direct total edits. Create a revision for changed terms.</p>
              ) : null}
            </div>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
