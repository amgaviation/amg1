import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatMoney } from "@/lib/portal/format";
import { DEMO_QUOTES, demoDate, type DemoQuote } from "@/lib/demo/data";

export const metadata = { title: "Quotes - Demo Portal" };

export default async function DemoQuotesPage() {
  await requireRole("demo");

  const open = DEMO_QUOTES.filter((quote) => ["sent", "viewed"].includes(quote.status));
  const won = DEMO_QUOTES.filter((quote) => ["approved", "converted"].includes(quote.status));
  const resolved = DEMO_QUOTES.filter((quote) =>
    ["approved", "converted", "rejected", "expired"].includes(quote.status)
  );
  const openValue = open.reduce((sum, quote) => sum + quote.total, 0);
  const wonValue = won.reduce((sum, quote) => sum + quote.total, 0);
  const winRate = resolved.length ? Math.round((won.length / resolved.length) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Quotes"
        description="Simulated quoting pipeline — recovery packages, trip support, ferry legs, and membership work sent to sample clients."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting Response" icon="receipt" value={open.length} detail={`${formatMoney(openValue)} out with clients now.`} tone="warn" />
        <StatCard label="Won This Month" icon="check" value={won.length} detail={`${formatMoney(wonValue)} approved or converted.`} />
        <StatCard label="Win Rate" icon="trendingUp" value={`${winRate}%`} detail={`${won.length} of ${resolved.length} resolved quotes won.`} />
        <StatCard label="Avg Turnaround" icon="history" value="13.4 h" detail="Sent-to-approved across recent winners." />
      </div>

      <SectionCard title="Quote Register" icon="receipt">
        <DataTable<DemoQuote>
          rows={DEMO_QUOTES}
          getKey={(row) => row.id}
          columns={[
            { header: "Ref", cell: (row) => <span className="deck-mono text-[var(--deck-accent-ink)]">{row.ref}</span>, priority: "primary" },
            { header: "Client", cell: (row) => row.client, priority: "secondary" },
            { header: "Mission", cell: (row) => row.missionRef ? <span className="deck-mono text-xs">{row.missionRef}</span> : <span className="text-xs text-[var(--deck-text-3)]">—</span>, hideOnMobile: true },
            { header: "Total", cell: (row) => formatMoney(row.total), align: "right" },
            {
              header: "Status",
              cell: (row) => (
                <StatusBadge
                  label={QUOTE_STATUS_LABEL[row.status] ?? row.status}
                  tone={toneFor(QUOTE_STATUS_TONE, row.status)}
                />
              ),
              priority: "secondary",
            },
            {
              header: "Sent",
              cell: (row) =>
                row.sentDaysAgo === null ? (
                  <span className="text-xs text-[var(--deck-text-3)]">Not sent</span>
                ) : (
                  <LocalTime value={demoDate(-row.sentDaysAgo)} mode="date" />
                ),
              hideOnMobile: true,
            },
            {
              header: "Expires",
              cell: (row) =>
                row.expiresInDays === null ? (
                  <span className="text-xs text-[var(--deck-text-3)]">—</span>
                ) : (
                  <span className={row.expiresInDays <= 5 ? "font-medium text-[var(--deck-warn)]" : undefined}>
                    <LocalTime value={demoDate(row.expiresInDays)} mode="date" />
                  </span>
                ),
              hideOnMobile: true,
            },
          ]}
        />
      </SectionCard>
    </>
  );
}
