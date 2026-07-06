import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { TableSelectionScope } from "@/components/portal/ui/data-table-selection";
import { BulkResultNotice } from "@/components/portal/ui/bulk-result-notice";
import { bulkDeleteQuotes } from "@/app/portal/actions/bulk-records";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllQuotes } from "@/lib/portal/queries";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Quotes - Admin Portal" };

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ bulk?: string; deleted?: string; skipped?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await requireRole("admin");
  const quotes = await listAllQuotes();
  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Quotes"
        description="Build, send, revise, and convert AMG aviation support quotes."
        actions={<Link href="/portal/admin/quotes/new" className="text-xs text-accent hover:underline">New Quote</Link>}
      />
      <BulkResultNotice params={params} entityLabel="quote" />
      <SectionCard title="Quote Register" icon="receipt">
        <TableSelectionScope
          action={bulkDeleteQuotes}
          entity="quote"
          backTo="/portal/admin/quotes"
          entityLabel="quote"
          confirm="Delete the selected quotes? Only Draft and Internal Review quotes are deleted — anything already sent to a client, approved, or converted is skipped automatically (void those instead)."
        >
        <DataTable
          selectable
          rows={quotes}
          getKey={(row) => row.id}
          emptyLabel="No quotes created."
          columns={[
            { header: "Quote", cell: (row) => <Link href={`/portal/admin/quotes/${row.id}`} className="font-mono text-xs text-accent hover:underline">{row.ref}</Link> },
            { header: "Mission", cell: (row) => row.mission?.ref ? <Link href={`/portal/admin/trips/${row.mission_id}`} className="hover:text-accent">{row.mission.ref}</Link> : "-" },
            { header: "Client", cell: (row) => row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? "-" },
            { header: "Total", cell: (row) => formatMoney(row.total), align: "right" },
            { header: "Deposit", cell: (row) => formatMoney((row as any).deposit_amount ?? 0), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={QUOTE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(QUOTE_STATUS_TONE, row.status)} /> },
            { header: "Created", cell: (row) => formatDateTime(row.created_at) },
            {
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-3 text-xs">
                  <Link href={`/portal/admin/quotes/${row.id}`} className="text-accent hover:underline">Open</Link>
                  {["draft", "internal_review"].includes(row.status) ? (
                    <Link href={`/portal/admin/quotes/${row.id}/edit`} className="text-accent hover:underline">Edit</Link>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
        </TableSelectionScope>
      </SectionCard>
    </>
  );
}
