import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { DEMO_AIRCRAFT, demoDate, type DemoAircraft } from "@/lib/demo/data";

export const metadata = { title: "Aircraft - Demo Portal" };

export default async function DemoAircraftPage() {
  await requireRole("demo");

  const airworthy = DEMO_AIRCRAFT.filter((aircraft) => aircraft.airworthiness === "airworthy").length;
  const inMx = DEMO_AIRCRAFT.length - airworthy;
  const mxSoon = DEMO_AIRCRAFT.filter(
    (aircraft) => aircraft.airworthiness === "airworthy" && aircraft.nextMxDueDays <= 21
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Managed Fleet"
        description="Simulated aircraft under AMG support — airworthiness state and upcoming maintenance windows across the sample fleet."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fleet Size" icon="planeTakeoff" value={DEMO_AIRCRAFT.length} detail="Light turboprops through ultra-long-range jets." />
        <StatCard label="Airworthy" icon="check" value={airworthy} detail="Available for owner and charter support." />
        <StatCard label="In Maintenance" icon="settings" value={inMx} detail="Down for scheduled or unscheduled work." tone={inMx ? "warn" : "default"} />
        <StatCard label="MX Due ≤21 Days" icon="calendar" value={mxSoon} detail="Inspections approaching their due date." tone={mxSoon ? "warn" : "default"} />
      </div>

      <SectionCard title="Aircraft" icon="planeTakeoff">
        <DataTable<DemoAircraft>
          rows={DEMO_AIRCRAFT}
          getKey={(row) => row.tail}
          columns={[
            { header: "Tail", cell: (row) => <span className="deck-mono text-[var(--deck-accent-ink)]">{row.tail}</span>, priority: "primary" },
            { header: "Type", cell: (row) => row.type, priority: "secondary" },
            { header: "Owner", cell: (row) => row.owner },
            { header: "Base", cell: (row) => <span className="deck-mono">{row.base}</span> },
            {
              header: "Airworthiness",
              cell: (row) => (
                <StatusBadge
                  label={row.airworthiness === "airworthy" ? "Airworthy" : "MX Hold"}
                  tone={row.airworthiness === "airworthy" ? "success" : "danger"}
                />
              ),
            },
            {
              header: "Next MX Due",
              cell: (row) =>
                row.nextMxDueDays < 0 ? (
                  <span className="font-medium text-[var(--deck-danger)]">In work</span>
                ) : (
                  <span className={row.nextMxDueDays <= 21 ? "font-medium text-[var(--deck-warn)]" : undefined}>
                    <LocalTime value={demoDate(row.nextMxDueDays)} mode="date" />
                  </span>
                ),
              hideOnMobile: true,
            },
            {
              header: "Total Time",
              cell: (row) => <span className="deck-mono text-xs">{row.totalTimeHours.toLocaleString("en-US")} hrs</span>,
              align: "right",
            },
          ]}
        />
      </SectionCard>
    </>
  );
}
