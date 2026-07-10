import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listMissionsForCrew } from "@/lib/portal/queries";
import { listPoolMissionsForCrew, describePoolRequirements, type PoolMission } from "@/lib/portal/pool";
import { requestPoolMission } from "@/app/portal/actions/crew";
import {
  MISSION_STATUS_LABEL, MISSION_STATUS_TONE, MISSION_TYPE_LABEL,
  CREW_ASSIGNMENT_STATUS_LABEL, CREW_ASSIGNMENT_STATUS_TONE,
  URGENCY_LABEL, URGENCY_TONE, toneFor, labelFor
} from "@/lib/portal/constants";
import { formatRoute, formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Assignments — Crew Portal" };

const POOL_REQUEST_LABEL: Record<string, { label: string; tone: "info" | "success" | "danger" | "warn" }> = {
  pending: { label: "Requested — Awaiting AMG", tone: "info" },
  approved: { label: "Request Approved", tone: "success" },
  denied: { label: "Not Selected", tone: "warn" },
};

function PoolMissionCard({ mission }: { mission: PoolMission }) {
  const aircraftType = [mission.aircraft?.make, mission.aircraft?.model].filter(Boolean).join(" ") || "TBD";
  const requirements = describePoolRequirements(mission.pool_requirements);
  const request = mission.my_request_status ? POOL_REQUEST_LABEL[mission.my_request_status] : null;

  return (
    <div className="deck-inset p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[var(--deck-accent-ink)]">{mission.ref}</span>
            <span className="text-xs text-[var(--deck-text-2)]">{labelFor(MISSION_TYPE_LABEL, mission.mission_type)}</span>
            {mission.urgency !== "standard" ? (
              <StatusBadge label={labelFor(URGENCY_LABEL, mission.urgency)} tone={toneFor(URGENCY_TONE, mission.urgency)} />
            ) : null}
          </div>
          <p className="mt-1 font-semibold">{formatRoute(mission.departure_airport, mission.arrival_airport)}</p>
        </div>
        {request ? <StatusBadge label={request.label} tone={request.tone} /> : null}
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-3 sm:justify-start">
          <dt className="text-[var(--deck-text-2)]">Departure</dt>
          <dd className="font-mono text-xs sm:ml-auto">{formatDateTime(mission.requested_departure)}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:justify-start">
          <dt className="text-[var(--deck-text-2)]">Arrival</dt>
          <dd className="font-mono text-xs sm:ml-auto">{formatDateTime(mission.requested_arrival)}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:justify-start">
          <dt className="text-[var(--deck-text-2)]">Aircraft Type</dt>
          <dd className="font-mono text-xs sm:ml-auto">{aircraftType}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:justify-start">
          <dt className="text-[var(--deck-text-2)]">Passengers</dt>
          <dd className="font-mono text-xs sm:ml-auto">{mission.passenger_count ?? "—"}</dd>
        </div>
        {mission.alternate_airport ? (
          <div className="flex justify-between gap-3 sm:justify-start">
            <dt className="text-[var(--deck-text-2)]">Alternate</dt>
            <dd className="font-mono text-xs sm:ml-auto">{mission.alternate_airport}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 sm:justify-start">
          <dt className="text-[var(--deck-text-2)]">International</dt>
          <dd className="font-mono text-xs sm:ml-auto">{mission.is_international ? "Yes" : "No"}</dd>
        </div>
        {mission.flexible_time ? (
          <div className="flex justify-between gap-3 sm:justify-start">
            <dt className="text-[var(--deck-text-2)]">Timing</dt>
            <dd className="font-mono text-xs sm:ml-auto">Flexible</dd>
          </div>
        ) : null}
      </dl>

      {requirements.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {requirements.map((r) => (
            <span key={r} className="deck-chip border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] text-[var(--deck-text-2)]">
              {r}
            </span>
          ))}
        </div>
      ) : null}

      {!request || mission.my_request_status === "withdrawn" ? (
        <form action={requestPoolMission} className="mt-4 flex flex-wrap items-center gap-2">
          <input type="hidden" name="mission_id" value={mission.id} />
          <SubmitButton pendingText="Requesting…">Request This Mission</SubmitButton>
          <span className="text-xs text-[var(--deck-text-2)]">
            Sends your request to AMG Operations for approval.
          </span>
        </form>
      ) : null}
    </div>
  );
}

export default async function CrewMissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ pool?: string; success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("crew", "missions");
  const params = await searchParams;
  const poolView = params.pool === "open";
  const [myMissions, openPool] = await Promise.all([
    listMissionsForCrew(user.id),
    poolView ? listPoolMissionsForCrew(user.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Assignments"
        title={poolView ? "Open Pool" : "My Assignments"}
        description={poolView ? "Missions AMG Operations has published to the pool for qualified crew. Client details are shared after assignment." : undefined}
      />
      {params.success === "requested" ? (
        <Notice tone="success">Request sent. AMG Operations will review it and confirm the assignment.</Notice>
      ) : null}
      {params.error === "already-requested" ? (
        <Notice tone="warn">You have already requested this mission.</Notice>
      ) : null}
      {params.error === "not-eligible" ? (
        <Notice tone="warn">This mission is no longer available in the open pool.</Notice>
      ) : null}

      <SectionCard>
        {poolView ? (
          openPool.length === 0 ? (
            <EmptyState icon="radar" title="No open assignments" description="Nothing in the pool matches your profile right now. AMG Operations publishes missions here when they need crew — keep your certificates, ratings, hours, and date of birth current so you qualify." />
          ) : (
            <div className="space-y-3">
              {openPool.map((m) => (
                <PoolMissionCard key={m.id} mission={m} />
              ))}
            </div>
          )
        ) : myMissions.length === 0 ? (
          <EmptyState icon="plane" title="No assignments" description="Your accepted assignments will appear here. Check the Open Pool for available missions." />
        ) : (
          <div className="space-y-3">
            {myMissions.map((m) => (
              <Link key={m.id} href={`/portal/crew/missions/${m.id}`} className="deck-inset deck-card-hover grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[var(--deck-accent-ink)]">{m.ref}</span>
                    <span className="text-xs text-[var(--deck-text-2)]">{MISSION_TYPE_LABEL[m.mission_type] ?? m.mission_type}</span>
                  </div>
                  <p className="mt-1 font-semibold">{formatRoute(m.departure_airport, m.arrival_airport)}</p>
                  <p className="mt-0.5 text-xs text-[var(--deck-text-2)]">{m.tail_number ?? "—"} · {formatDateTime(m.requested_departure)}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <StatusBadge label={MISSION_STATUS_LABEL[m.status] ?? m.status} tone={toneFor(MISSION_STATUS_TONE, m.status)} />
                  {(m as typeof m & { assignment_status?: string | null }).assignment_status ? (
                    <StatusBadge
                      label={CREW_ASSIGNMENT_STATUS_LABEL[(m as typeof m & { assignment_status?: string | null }).assignment_status!] ?? ""}
                      tone={toneFor(CREW_ASSIGNMENT_STATUS_TONE, (m as typeof m & { assignment_status?: string | null }).assignment_status)}
                    />
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
