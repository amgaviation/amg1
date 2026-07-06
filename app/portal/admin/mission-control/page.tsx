import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { Notice, PageHeader } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { updateMissionStatus } from "@/app/portal/actions/missions";
import { listAllMissions } from "@/lib/portal/queries";
import {
  MISSION_FLOW_STAGES,
  MISSION_STATUS,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  URGENCY_LABEL,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";
import { DeckSelect } from "@/components/portal/ui/fields";

export const metadata = { title: "Mission Control - Admin Portal" };

export default async function AdminMissionControlPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRolePermission("admin", "missions");
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

  return (
    <>
      {params.error === "missing" ? <Notice tone="danger">Mission and status are required.</Notice> : null}
      <PageHeader
        eyebrow="AMG Operations"
        title="Mission Control"
        description="Every open request on one board, laid out the way work actually moves: intake, quote, crew, flight."
      />

      {/* Flow strip — same vocabulary as the Command Center. Horizontal scroll
          strip on phones (see admin dashboard flow band). */}
      <div className="deck-card deck-scroll-x flex items-stretch overflow-x-auto sm:flex-wrap sm:overflow-hidden">
        {lanes.map((lane, index) => (
          <div key={lane.key} className="flex w-[10rem] flex-none items-center sm:w-auto sm:min-w-[10rem] sm:flex-1">
            {index > 0 ? (
              <span className="deck-mono px-1 text-[var(--deck-text-3)]" aria-hidden>
                →
              </span>
            ) : null}
            <a href={`#lane-${lane.key}`} className="group flex-1 px-4 py-3.5">
              <p className="deck-micro text-[var(--deck-text-3)] transition-colors group-hover:text-[var(--deck-accent-ink)]">
                {lane.label}
              </p>
              <p className="deck-num mt-1 text-2xl font-bold text-[var(--deck-text)]">
                {lane.missions.length}
              </p>
            </a>
          </div>
        ))}
      </div>

      {/* Lanes — a swipeable snap board on phones, a grid from md up. */}
      <div className="deck-scroll-x -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4">
        {lanes.map((lane) => (
          <section key={lane.key} id={`lane-${lane.key}`} className="deck-card flex min-h-[20rem] w-[85vw] max-w-[22rem] flex-none snap-start flex-col overflow-hidden md:w-auto md:max-w-none">
            <header className="flex items-center justify-between gap-2 border-b border-[var(--deck-line)] bg-[var(--deck-panel-2)] px-4 py-3">
              <div className="min-w-0">
                <p className="deck-micro text-[var(--deck-text-2)]">{lane.label}</p>
                <p className="mt-0.5 truncate text-[0.68rem] leading-4 text-[var(--deck-text-3)]">{lane.hint}</p>
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
                      {lane.statuses.length > 1 ? (
                        <StatusBadge
                          label={MISSION_STATUS_LABEL[mission.status] ?? mission.status}
                          tone={toneFor(MISSION_STATUS_TONE, mission.status)}
                        />
                      ) : null}
                    </div>
                    <p className="deck-mono mt-1.5 !text-[0.78rem] font-semibold text-[var(--deck-text)]">
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
                    <form action={updateMissionStatus} className="mt-2.5 flex items-center gap-2">
                      <input type="hidden" name="mission_id" value={mission.id} />
                      <DeckSelect
                        name="status"
                        defaultValue={mission.status}
                        aria-label={`Move ${mission.ref} to status`}
                        className="!min-h-9 flex-1 !text-xs"
                        options={MISSION_STATUS.map((s) => ({ value: s.value, label: s.label }))}
                      />
                      <SubmitButton variant="outline" size="sm" pendingText="…">
                        Move
                      </SubmitButton>
                    </form>
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
