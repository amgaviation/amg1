import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { formatMoney } from "@/lib/portal/format";
import { DEMO_CLIENTS, DEMO_SUBSCRIPTIONS, type DemoClient } from "@/lib/demo/data";

export const metadata = { title: "Clients - Demo Portal" };

export default async function DemoClientsPage() {
  await requireRole("demo");

  const activePlans = DEMO_SUBSCRIPTIONS.filter((sub) => sub.status === "active").length;
  const ytdRevenue = DEMO_CLIENTS.reduce((sum, client) => sum + client.ytdRevenue, 0);
  const arOutstanding = DEMO_CLIENTS.reduce((sum, client) => sum + client.arOutstanding, 0);

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Client Directory"
        description="Simulated owner and operator accounts under AMG management, with membership and receivables posture at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Managed Accounts" icon="building" value={DEMO_CLIENTS.length} detail="Seven members plus one prospect." />
        <StatCard label="Active Memberships" icon="creditCard" value={activePlans} detail="Flight Support Gold, Silver, and Core plans." />
        <StatCard label="YTD Revenue" icon="trendingUp" value={formatMoney(ytdRevenue)} detail="Collected across the client base this year." />
        <StatCard label="AR Outstanding" icon="wallet" value={formatMoney(arOutstanding)} detail="Open balances across all accounts." tone={arOutstanding ? "warn" : "default"} />
      </div>

      <SectionCard title="Accounts" icon="building">
        <DataTable<DemoClient>
          rows={DEMO_CLIENTS}
          getKey={(row) => row.id}
          columns={[
            { header: "Company", cell: (row) => <span className="font-semibold">{row.company}</span>, priority: "primary" },
            { header: "Primary Contact", cell: (row) => row.contact },
            { header: "Home Base", cell: (row) => <span className="deck-mono">{row.homeBase}</span> },
            { header: "Aircraft", cell: (row) => <span className="deck-mono text-xs">{row.aircraft.join(", ")}</span> },
            { header: "Plan", cell: (row) => row.plan ?? <span className="text-xs text-[var(--deck-text-3)]">No membership</span>, hideOnMobile: true },
            { header: "YTD Revenue", cell: (row) => formatMoney(row.ytdRevenue), align: "right" },
            {
              header: "Open AR",
              cell: (row) =>
                row.arOutstanding > 0 ? (
                  <span className="font-medium text-[var(--deck-warn)]">{formatMoney(row.arOutstanding)}</span>
                ) : (
                  <span className="text-[var(--deck-text-3)]">—</span>
                ),
              align: "right",
            },
            {
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={row.status === "active" ? "Active" : "Prospect"}
                  tone={row.status === "active" ? "success" : "info"}
                />
              ),
              priority: "secondary",
            },
          ]}
        />
      </SectionCard>
    </>
  );
}
