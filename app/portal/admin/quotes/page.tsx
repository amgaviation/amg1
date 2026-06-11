import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { listAllQuotes } from "@/lib/portal/queries";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Quotes - Admin Portal" };

export default async function AdminQuotesPage() {
  const user = await requireRole("admin");
  const quotes = await listAllQuotes();
  return (
    <PortalShell role="admin" user={user}>
      <PageHeader eyebrow="AMG Operations" title="Quotes" description="Client quotes issued from mission detail workspaces and their approval state." />
      <SectionCard title="Quote Register" icon="receipt">
        <DataTable
          rows={quotes}
          getKey={(row) => row.id}
          emptyLabel="No quotes created."
          columns={[
            { header: "Quote", cell: (row) => <span className="font-mono text-xs text-accent">{row.ref}</span> },
            { header: "Mission", cell: (row) => row.mission?.ref ? <Link href={`/portal/admin/trips/${row.mission_id}`} className="hover:text-accent">{row.mission.ref}</Link> : "-" },
            { header: "Client", cell: (row) => row.client?.company_name ?? row.client?.full_name ?? row.client?.email ?? "-" },
            { header: "Total", cell: (row) => formatMoney(row.total), align: "right" },
            { header: "Status", cell: (row) => <StatusBadge label={QUOTE_STATUS_LABEL[row.status] ?? row.status} tone={toneFor(QUOTE_STATUS_TONE, row.status)} /> },
            { header: "Created", cell: (row) => formatDateTime(row.created_at) },
          ]}
        />
      </SectionCard>
    </PortalShell>
  );
}
