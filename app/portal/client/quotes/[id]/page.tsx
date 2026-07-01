import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, DetailRow, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { getQuoteDetail } from "@/lib/portal/queries";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDate, formatMoney } from "@/lib/portal/format";
import { respondToQuote } from "@/app/portal/actions/quotes";

export const metadata = { title: "Quote Detail — Client Portal" };

export default async function ClientQuoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRole("client");
  const { id } = await params;
  const sp = await searchParams;
  const quote = await getQuoteDetail(id);
  if (!quote || (quote.client_id !== user.id && user.role !== "admin")) notFound();

  const canRespond = quote.status === "sent";
  const latestQuoteDocument = quote.documents[0];

  return (
    <PortalShell role="client" user={user}>
      {sp.success === "approved" ? <Notice tone="success">Quote approved. AMG Operations will continue the required operational review before any request is considered accepted.</Notice> : null}
      {sp.success === "rejected" ? <Notice tone="warn">Quote rejected. AMG Operations will follow up.</Notice> : null}
      {sp.error === "terms" ? <Notice tone="danger">Confirm the quote terms and operational review notice before approving.</Notice> : null}

      <PageHeader
        eyebrow={quote.ref}
        title="Quote Detail"
        actions={
          <div className="flex items-center gap-3">
            {latestQuoteDocument ? (
              <Link
                href={`/portal/billing-documents/${latestQuoteDocument.id}/view`}
                className="text-xs text-accent hover:underline"
              >
                View PDF
              </Link>
            ) : null}
            <StatusBadge label={QUOTE_STATUS_LABEL[quote.status] ?? quote.status} tone={toneFor(QUOTE_STATUS_TONE, quote.status)} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <SectionCard title="Line Items" icon="receipt">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-background/60">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Unit Price</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.category}</p>
                        {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatMoney(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {Number((quote as any).discount_total ?? 0) ? (
                    <tr className="border-t border-border bg-background/60">
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">Discount</td>
                      <td className="px-4 py-3 text-right font-medium">-{formatMoney((quote as any).discount_total ?? 0)}</td>
                    </tr>
                  ) : null}
                  {Number((quote as any).tax_total ?? 0) ? (
                    <tr className="border-t border-border bg-background/60">
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">Tax</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney((quote as any).tax_total ?? 0)}</td>
                    </tr>
                  ) : null}
                  <tr className="border-t border-border bg-background/60">
                    <td colSpan={3} className="px-4 py-3 text-right font-bold">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-accent">{formatMoney(quote.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>

          {quote.client_notes ? (
            <SectionCard title="Notes from AMG Operations" icon="fileText">
              <p className="text-sm leading-6 text-muted-foreground">{quote.client_notes}</p>
            </SectionCard>
          ) : null}

          {canRespond ? (
            <SectionCard title="Your Response" icon="receipt">
              <p className="mb-4 text-sm text-muted-foreground">
                Review the line items above. Approving the quote authorizes AMG to continue billing and support review;
                it does not create mission acceptance, aircraft availability, crew assignment, operational authorization,
                or online payment processing.
              </p>
              <div className="flex flex-col gap-3">
                <form action={respondToQuote} className="grid gap-3">
                  <input type="hidden" name="quote_id" value={quote.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <label className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
                    <input name="quote_terms_acknowledged" value="accepted" type="checkbox" required className="mt-1 h-4 w-4 accent-accent" />
                    <span>I acknowledge the quote terms, support review disclaimer, and no-online-payment notice.</span>
                  </label>
                  <SubmitButton className="rounded-full" pendingText="Approving…">Approve Quote</SubmitButton>
                </form>
                <div className="flex gap-3">
                  <form action={respondToQuote}>
                    <input type="hidden" name="quote_id" value={quote.id} />
                    <input type="hidden" name="decision" value="revision_requested" />
                    <SubmitButton variant="outline" className="rounded-full" pendingText="Sending…">Request Changes</SubmitButton>
                  </form>
                  <form action={respondToQuote}>
                    <input type="hidden" name="quote_id" value={quote.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <SubmitButton variant="outline" className="rounded-full" pendingText="Rejecting…">Reject</SubmitButton>
                  </form>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <SectionCard title="Quote Info" icon="receipt">
            <dl>
              <DetailRow label="Reference">{quote.ref}</DetailRow>
              <DetailRow label="Status"><StatusBadge label={QUOTE_STATUS_LABEL[quote.status] ?? quote.status} tone={toneFor(QUOTE_STATUS_TONE, quote.status)} /></DetailRow>
              <DetailRow label="Created">{formatDate(quote.created_at)}</DetailRow>
              {quote.mission ? <DetailRow label="Mission"><Link href={`/portal/client/trips/${quote.mission.id}`} className="font-mono text-accent hover:underline">{quote.mission.ref}</Link></DetailRow> : null}
              <DetailRow label="Total">{formatMoney(quote.total)}</DetailRow>
              <DetailRow label="Deposit Required">{(quote as any).deposit_required ? formatMoney((quote as any).deposit_amount ?? 0) : "-"}</DetailRow>
              <DetailRow label="Terms">{(quote as any).payment_terms ?? "-"}</DetailRow>
            </dl>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
