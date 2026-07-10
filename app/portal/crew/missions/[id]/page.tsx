import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { SectionCard, DetailRow, Notice } from "@/components/portal/ui/primitives";
import { DescriptionList } from "@/components/portal/ui/description-list";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getMissionDetail } from "@/lib/portal/queries";
import { getPoolMissionForCrew, type PoolMission } from "@/lib/portal/pool";
import { requestPoolMission, respondToAssignment } from "@/app/portal/actions/crew";
import {
  MISSION_STATUS_LABEL, MISSION_STATUS_TONE, MISSION_TYPE_LABEL,
  URGENCY_LABEL, URGENCY_TONE, toneFor, labelFor
} from "@/lib/portal/constants";
import { formatRoute, formatDateTime } from "@/lib/portal/format";
import { COMPANY } from "@/lib/content";

export const metadata = { title: "Mission Brief — Crew Portal" };

export default async function CrewMissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRolePermission("crew", "missions");
  const { id } = await params;
  const sp = await searchParams;
  const mission = await getMissionDetail(id);
  if (!mission) notFound();

  const myAssignment = mission.crew.find((ca) => ca.crew_id === user.id);

  // Without an assignment, this brief is reachable only as a pool preview:
  // the mission must be admin-published AND this crew member must meet its
  // requirements. Pool previews stay sanitized — no client identity, notes,
  // passengers, or tail number.
  let poolPreview: PoolMission | null = null;
  if (!myAssignment) {
    poolPreview = await getPoolMissionForCrew(id, user.id);
    if (!poolPreview) notFound();
  }

  const canRespond = myAssignment && myAssignment.status === "offered";
  const showAssignedDetails = Boolean(myAssignment);
  const aircraftLabel = showAssignedDetails
    ? mission.tail_number ?? "—"
    : [poolPreview?.aircraft?.make, poolPreview?.aircraft?.model].filter(Boolean).join(" ") || "TBD";

  return (
    <>
      {sp.success === "responded" ? <Notice tone="success">Assignment response recorded.</Notice> : null}
      {poolPreview ? (
        <Notice tone="info">
          Open pool preview. AMG has not assigned you to this mission, so client information, passenger details, and assignment notes remain hidden.
        </Notice>
      ) : null}

      {poolPreview && (!poolPreview.my_request_status || poolPreview.my_request_status === "withdrawn") ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] p-4">
          <div className="flex-1">
            <p className="font-semibold">Available in the Open Pool</p>
            <p className="text-sm text-[var(--deck-text-2)]">Request this mission and AMG Operations will review your request.</p>
          </div>
          <form action={requestPoolMission}>
            <input type="hidden" name="mission_id" value={mission.id} />
            <SubmitButton pendingText="Requesting…">Request This Mission</SubmitButton>
          </form>
        </div>
      ) : null}
      {poolPreview?.my_request_status === "pending" ? (
        <Notice tone="info">Your request for this mission is with AMG Operations for review.</Notice>
      ) : null}

      {/* Detail-archetype summary header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">Crew Mission Brief</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="deck-title text-[1.65rem] sm:text-[2rem]">{mission.ref}</h1>
            <StatusBadge label={labelFor(MISSION_STATUS_LABEL, mission.status)} tone={toneFor(MISSION_STATUS_TONE, mission.status)} />
          </div>
          <p className="deck-mono mt-2.5 !text-[0.8rem] text-[var(--deck-text-2)]">
            {formatRoute(mission.departure_airport, mission.arrival_airport)}
            {" · DEP "}
            {formatDateTime(mission.requested_departure)}
            {" · "}
            {labelFor(MISSION_TYPE_LABEL, mission.mission_type)}
          </p>
        </div>
      </div>

      {canRespond ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] p-4">
          <div className="flex-1">
            <p className="font-semibold">Assignment Offer</p>
            <p className="text-sm text-[var(--deck-text-2)]">You have been offered this mission. Please accept or decline.</p>
          </div>
          <div className="flex gap-2">
            <form action={respondToAssignment}>
              <input type="hidden" name="assignment_id" value={myAssignment.id} />
              <input type="hidden" name="decision" value="accepted" />
              <SubmitButton pendingText="Accepting…">Accept</SubmitButton>
            </form>
            <form action={respondToAssignment}>
              <input type="hidden" name="assignment_id" value={myAssignment.id} />
              <input type="hidden" name="decision" value="declined" />
              <SubmitButton variant="outline" pendingText="Declining…">Decline</SubmitButton>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <SectionCard title="Mission Details" icon="plane">
            <DescriptionList
              items={[
                { label: "Type", value: labelFor(MISSION_TYPE_LABEL, mission.mission_type) },
                { label: "Route", value: formatRoute(mission.departure_airport, mission.arrival_airport), mono: true },
                ...(mission.alternate_airport
                  ? [{ label: "Alternate", value: mission.alternate_airport, mono: true }]
                  : []),
                { label: "Aircraft", value: aircraftLabel, mono: true },
                { label: "Departure", value: formatDateTime(mission.requested_departure) },
                { label: "Arrival", value: formatDateTime(mission.requested_arrival) },
                ...(mission.urgency !== "standard"
                  ? [{
                      label: "Urgency",
                      value: (
                        <StatusBadge
                          label={labelFor(URGENCY_LABEL, mission.urgency)}
                          tone={toneFor(URGENCY_TONE, mission.urgency)}
                        />
                      ),
                    }]
                  : []),
                ...(mission.fbo_preference ? [{ label: "FBO", value: mission.fbo_preference }] : []),
                { label: "Passengers", value: mission.passenger_count },
                { label: "Ground Transport", value: mission.ground_transport ? "Requested" : "No" },
                { label: "Catering", value: mission.catering ? "Requested" : "No" },
                { label: "International", value: mission.is_international ? "Yes" : "No" },
              ]}
            />
          </SectionCard>

          {showAssignedDetails && mission.client_notes ? (
            <SectionCard title="Operational Notes" icon="fileText">
              <p className="text-sm leading-6 text-[var(--deck-text-2)]">{mission.client_notes}</p>
            </SectionCard>
          ) : null}

          {showAssignedDetails && mission.passengers.length > 0 ? (
            <SectionCard title="Passenger Manifest" icon="users">
              <div className="space-y-2">
                {mission.passengers.map((p) => (
                  <div key={p.id} className="deck-inset flex justify-between px-4 py-2 text-sm">
                    <span className="font-medium">{p.full_name}</span>
                    <span className="text-xs text-[var(--deck-text-2)] capitalize">{p.passenger_type}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-6">
          {myAssignment ? (
            <SectionCard title="My Assignment" icon="badgeCheck">
              <dl>
                <DetailRow label="Role">{myAssignment.crew_role.toUpperCase()}</DetailRow>
                <DetailRow label="Status"><StatusBadge label={myAssignment.status} tone={myAssignment.status === "accepted" ? "success" : myAssignment.status === "declined" ? "danger" : "warn"} /></DetailRow>
                {myAssignment.duty_notes ? <DetailRow label="Duty Notes">{myAssignment.duty_notes}</DetailRow> : null}
              </dl>
            </SectionCard>
          ) : null}

          <SectionCard title="Operations Contact" icon="messageSquare">
            <p className="text-sm text-[var(--deck-text-2)]">Questions about this mission?</p>
            <a href={`mailto:${COMPANY.email}`} className="mt-2 block text-sm text-[var(--deck-accent-ink)] hover:underline">{COMPANY.email}</a>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
