import { requireRole } from "@/lib/portal/session";
import { DataTable } from "@/components/portal/ui/data-table";
import { FilterTabs, PageHeader, SectionCard, StatCard } from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import {
  MISSION_FLOW_STAGES,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  MISSION_TYPE_LABEL,
  URGENCY_LABEL,
  URGENCY_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatRoute } from "@/lib/portal/format";
import { DEMO_MISSIONS, demoDate, type DemoMission } from "@/lib/demo/data";

export const metadata = { title: "Missions - Demo Portal" };

const STAGE_FILTERS = [
  { label: "All", value: "" },
  ...MISSION_FLOW_STAGES.map((stage) => ({ label: stage.label, value: stage.key })),
  { label: "Completed", value: "done" },
];

function stageStatuses(stageKey: string): string[] | null {
  if (!stageKey) return null;
  if (stageKey === "done") return ["completed", "cancelled"];
  return MISSION_FLOW_STAGES.find((stage) => stage.key === stageKey)?.statuses ?? null;
}

export default async function DemoMissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  await requireRole("demo");
  const { stage } = await searchParams;
  const statuses = stageStatuses(stage ?? "");
  const missions = statuses
    ? DEMO_MISSIONS.filter((mission) => statuses.includes(mission.status))
    : DEMO_MISSIONS;

  const aog = DEMO_MISSIONS.filter((m) => m.urgency === "aog" && !["completed", "cancelled"].includes(m.status)).length;
  const intake = DEMO_MISSIONS.filter((m) => ["submitted", "under_review", "awaiting_client_info"].includes(m.status)).length;
  const flying = DEMO_MISSIONS.filter((m) => m.status === "in_progress").length;
  const next48 = DEMO_MISSIONS.filter((m) => m.departsInDays >= 0 && m.departsInDays <= 2 && !["completed", "cancelled"].includes(m.status)).length;

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Missions & Support Requests"
        description="A simulated operations queue: AOG recovery, owner trips, ferry legs, and MX repositioning across the sample fleet."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="In Intake" icon="inbox" value={intake} detail="New, under review, or awaiting client info." />
        <StatCard label="AOG / Urgent" icon="alert" value={aog} detail="Aircraft-on-ground support in motion." tone={aog ? "danger" : "default"} />
        <StatCard label="Departing ≤48h" icon="planeTakeoff" value={next48} detail="Missions inside the two-day window." tone="warn" />
        <StatCard label="In Flight" icon="radar" value={flying} detail="Crews currently airborne." />
      </div>

      <SectionCard
        title="Request Queue"
        icon="plane"
        description="Filtered by pipeline stage — the same flow the Command Center band shows."
      >
        <div className="space-y-4">
          <FilterTabs basePath="/portal/demo/missions" param="stage" current={stage} options={STAGE_FILTERS} />
          <DataTable<DemoMission>
            rows={missions}
            getKey={(row) => row.id}
            emptyLabel="No missions in this stage of the simulated pipeline."
            columns={[
              { header: "Ref", cell: (row) => <span className="deck-mono text-[var(--deck-accent-ink)]">{row.ref}</span>, priority: "primary" },
              { header: "Route", cell: (row) => <span className="deck-mono">{formatRoute(row.departure, row.arrival)}</span>, priority: "secondary" },
              { header: "Client", cell: (row) => row.client },
              { header: "Aircraft", cell: (row) => <span className="deck-mono text-xs">{row.aircraft}</span> },
              { header: "Type", cell: (row) => MISSION_TYPE_LABEL[row.type] ?? row.type, hideOnMobile: true },
              {
                header: "Urgency",
                cell: (row) =>
                  row.urgency === "standard" ? (
                    <span className="text-xs text-[var(--deck-text-3)]">Standard</span>
                  ) : (
                    <StatusBadge label={URGENCY_LABEL[row.urgency] ?? row.urgency} tone={toneFor(URGENCY_TONE, row.urgency)} />
                  ),
              },
              {
                header: "Departure",
                cell: (row) =>
                  ["completed", "cancelled"].includes(row.status) ? (
                    <span className="text-xs text-[var(--deck-text-3)]">—</span>
                  ) : (
                    <LocalTime value={demoDate(row.departsInDays + 0.6)} />
                  ),
                hideOnMobile: true,
              },
              { header: "Crew", cell: (row) => row.crew ?? <span className="text-xs text-[var(--deck-text-3)]">Unassigned</span>, hideOnMobile: true },
              {
                header: "Status",
                cell: (row) => (
                  <StatusBadge
                    label={MISSION_STATUS_LABEL[row.status] ?? row.status}
                    tone={toneFor(MISSION_STATUS_TONE, row.status)}
                  />
                ),
                priority: "secondary",
              },
            ]}
          />
        </div>
      </SectionCard>
    </>
  );
}
