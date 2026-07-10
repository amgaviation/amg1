import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SlaChip } from "@/components/portal/ui/sla-chip";
import { MissionStatusAdvanceCompact } from "@/components/portal/ui/status-advance";
import { listAllMissions } from "@/lib/portal/queries";
import {
  MISSION_FLOW_STAGES,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  URGENCY_LABEL,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Mission Control - AMG Operations" };

/**
 * The operations board: every open support request, laid out the way work
 * moves — intake, quote, crew & schedule, execution. Desktop shows all four
 * stages side by side; phones get a stage selector and a vertical list (no
 * horizontal swiping required). Cards offer only the record's legal next
 * step; everything else lives on the record page.
 */
export default async function AdminMissionControlPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; ref?: string; stage?: string }>;
}) {
  await requireRolePermission("admin", "missions");
  const params = await searchParams;
  const missions = await listAllMissions();

  const lanes = MISSION_FLOW_STAGES.map((stage) => ({
    ...stage,
    missions: missions
      .filter((mission) => stage.statuses.includes(mission.status))
      .sort(
        (a, b) =>
          new Date(a.requested_departure ?? "2100-01-01").getTime() -
          new Date(b.requested_departure ?? "2100-01-01").getTime()
      ),
  }));
  const completed = missions.filter((m) => m.status === "completed").length;
  const cancelled = missions.filter((m) => m.status === "cancelled").length;

  // Mobile stage selector: URL-driven so back/forward and deep links work.
  const requestedStage = lanes.some((lane) => lane.key === params.stage) ? params.stage : undefined;
  const activeStageKey =
    requestedStage ?? (lanes.find((lane) => lane.missions.length > 0)?.key ?? lanes[0].key);

  return (
    <>
      {params.error === "missing" ? (
        <Notice tone="danger">Request and status are required.</Notice>
      ) : null}
      {params.success === "updated" ? (
        <Notice tone="success">
          {params.ref ? `${params.ref} moved.` : "Request status updated."}
        </Notice>
      ) : null}
      <PageHeader
        eyebrow="Operations"
        title="Mission Control"
        description="Every open support request on one board: intake, quote, crew & schedule, execution. Cards offer the next legal step — open a record for the full status panel."
        actions={
          <Link
            href="/portal/admin/trips"
            className="rounded-md border border-[var(--deck-line-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)]"
          >
            List view
          </Link>
        }
      />

      {/* Stage selector — pills on phones (choose a stage), summary strip on
          desktop (anchors into the grid). */}
      <div className="deck-card deck-scroll-x flex items-stretch overflow-x-auto md:flex-wrap md:overflow-hidden">
        {lanes.map((lane, index) => {
          const activeOnMobile = lane.key === activeStageKey;
          return (
            <div key={lane.key} className="flex flex-none items-center md:min-w-[10rem] md:flex-1">
              {index > 0 ? (
                <span className="deck-mono hidden px-1 text-[var(--deck-text-3)] md:inline" aria-hidden>
                  →
                </span>
              ) : null}
              <Link
                href={`/portal/admin/mission-control?stage=${lane.key}`}
                aria-current={activeOnMobile ? "page" : undefined}
                className={cn(
                  "group min-h-[44px] flex-1 px-4 py-3 md:py-3.5",
                  activeOnMobile && "border-b-2 border-[var(--deck-accent)] md:border-0"
                )}
              >
                <p
                  className={cn(
                    "deck-micro transition-colors group-hover:text-[var(--deck-accent-ink)]",
                    activeOnMobile ? "text-[var(--deck-accent-ink)]" : "text-[var(--deck-text-3)]"
                  )}
                >
                  {lane.label}
                </p>
                <p className="deck-num mt-1 text-2xl font-bold text-[var(--deck-text)]">
                  {lane.missions.length}
                </p>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Lanes: single selected stage on phones, four-up grid from md. */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {lanes.map((lane) => (
          <section
            key={lane.key}
            id={`lane-${lane.key}`}
            aria-label={`${lane.label} — ${lane.missions.length} request${lane.missions.length === 1 ? "" : "s"}`}
            className={cn(
              "deck-card min-h-[20rem] flex-col overflow-hidden",
              lane.key === activeStageKey ? "flex" : "hidden md:flex"
            )}
          >
            <header className="flex items-center justify-between gap-2 border-b border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-4 py-3">
              <div className="min-w-0">
                <p className="deck-micro text-[var(--deck-text-2)]">{lane.label}</p>
                <p className="mt-0.5 truncate text-[0.72rem] leading-4 text-[var(--deck-text-3)]">{lane.hint}</p>
              </div>
              <span className="deck-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--deck-accent-tint)] text-xs font-bold text-[var(--deck-accent-ink)]">
                {lane.missions.length}
              </span>
            </header>
            <div className="flex-1 space-y-2.5 p-3">
              {lane.missions.length === 0 ? (
                <p className="deck-micro px-1 py-6 text-center text-[var(--deck-text-3)]">Clear</p>
              ) : (
                lane.missions.map((mission) => (
                  <article key={mission.id} className="deck-inset deck-card-hover p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/portal/admin/trips/${mission.id}`}
                        className="deck-mono text-[var(--deck-accent-ink)] hover:underline"
                      >
                        {mission.ref}
                      </Link>
                      <StatusBadge
                        label={MISSION_STATUS_LABEL[mission.status] ?? mission.status}
                        tone={toneFor(MISSION_STATUS_TONE, mission.status)}
                      />
                    </div>
                    <p className="deck-mono mt-1.5 !text-[0.8rem] font-semibold text-[var(--deck-text)]">
                      {formatRoute(mission.departure_airport, mission.arrival_airport)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--deck-text-3)]">
                      {formatDateTime(mission.requested_departure)}
                      {mission.urgency !== "standard" ? (
                        <span
                          className={
                            mission.urgency === "aog"
                              ? "ml-2 font-semibold text-[var(--deck-danger)]"
                              : "ml-2 font-semibold text-[var(--deck-warn)]"
                          }
                        >
                          {URGENCY_LABEL[mission.urgency] ?? mission.urgency}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--deck-text-3)]">
                      {mission.client?.company_name ?? mission.client?.full_name ?? mission.client?.email ?? "Client TBD"}
                    </p>
                    <div className="mt-1.5 empty:hidden">
                      <SlaChip mission={mission} />
                    </div>
                    <MissionStatusAdvanceCompact
                      mission={mission}
                      backTo={`/portal/admin/mission-control${requestedStage ? `?stage=${requestedStage}` : ""}`}
                    />
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Closed strip */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="deck-micro text-[var(--deck-text-3)]">Closed</span>
        <Link
          href="/portal/admin/trips?status=completed"
          className="deck-chip border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] text-[var(--deck-success)] transition-colors hover:border-[var(--deck-success)]"
        >
          {completed} Completed
        </Link>
        <Link
          href="/portal/admin/trips?status=cancelled"
          className="deck-chip border-[var(--deck-neutral-line)] bg-[var(--deck-neutral-tint)] text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-line-strong)]"
        >
          {cancelled} Cancelled
        </Link>
      </div>
    </>
  );
}
