import { notFound } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, DetailRow, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { getMissionDetail } from "@/lib/portal/queries";
import { respondToAssignment } from "@/app/portal/actions/crew";
import {
  MISSION_STATUS_LABEL, MISSION_STATUS_TONE, MISSION_TYPE_LABEL,
  URGENCY_LABEL, URGENCY_TONE, toneFor, labelFor
} from "@/lib/portal/constants";
import { formatRoute, formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Mission Brief — Crew Portal" };

const OPEN_POOL_STATUSES = new Set(["submitted", "under_review", "approved", "quoted"]);

export default async function CrewMissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("crew");
  const { id } = await params;
  const sp = await searchParams;
  const mission = await getMissionDetail(id);
  if (!mission) notFound();

  const myAssignment = mission.crew.find((ca) => ca.crew_id === user.id);
  const openPoolEligible = !mission.assigned_crew_id && OPEN_POOL_STATUSES.has(mission.status);
  if (!myAssignment && !openPoolEligible) notFound();

  const canRespond = myAssignment && myAssignment.status === "offered";
  const showAssignedDetails = Boolean(myAssignment);

  return (
    <PortalShell role="crew" user={user}>
      {sp.success === "responded" ? <Notice tone="success">Assignment response recorded.</Notice> : null}
      {!myAssignment && openPoolEligible ? (
        <Notice tone="info">
          Open pool preview. AMG has not assigned you to this mission, so passenger details and assignment notes remain hidden.
        </Notice>
      ) : null}

      <PageHeader
        eyebrow={mission.ref}
        title={`Crew Brief — ${formatRoute(mission.departure_airport, mission.arrival_airport)}`}
        actions={
          <StatusBadge label={labelFor(MISSION_STATUS_LABEL, mission.status)} tone={toneFor(MISSION_STATUS_TONE, mission.status)} />
        }
      />

      {canRespond ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex-1">
            <p className="font-semibold">Assignment Offer</p>
            <p className="text-sm text-muted-foreground">You have been offered this mission. Please accept or decline.</p>
          </div>
          <div className="flex gap-2">
            <form action={respondToAssignment}>
              <input type="hidden" name="assignment_id" value={myAssignment.id} />
              <input type="hidden" name="decision" value="accepted" />
              <SubmitButton className="rounded-full" pendingText="Accepting…">Accept</SubmitButton>
            </form>
            <form action={respondToAssignment}>
              <input type="hidden" name="assignment_id" value={myAssignment.id} />
              <input type="hidden" name="decision" value="declined" />
              <SubmitButton variant="outline" className="rounded-full" pendingText="Declining…">Decline</SubmitButton>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <SectionCard title="Mission Details" icon="plane">
            <dl>
              <DetailRow label="Type">{labelFor(MISSION_TYPE_LABEL, mission.mission_type)}</DetailRow>
              <DetailRow label="Route">{formatRoute(mission.departure_airport, mission.arrival_airport)}</DetailRow>
              {mission.alternate_airport ? <DetailRow label="Alternate">{mission.alternate_airport}</DetailRow> : null}
              <DetailRow label="Aircraft">{mission.tail_number ?? "—"}</DetailRow>
              <DetailRow label="Departure">{formatDateTime(mission.requested_departure)}</DetailRow>
              <DetailRow label="Arrival">{formatDateTime(mission.requested_arrival)}</DetailRow>
              {mission.urgency !== "standard" ? (
                <DetailRow label="Urgency"><StatusBadge label={labelFor(URGENCY_LABEL, mission.urgency)} tone={toneFor(URGENCY_TONE, mission.urgency)} /></DetailRow>
              ) : null}
              {mission.fbo_preference ? <DetailRow label="FBO">{mission.fbo_preference}</DetailRow> : null}
              <DetailRow label="Passengers">{mission.passenger_count}</DetailRow>
              <DetailRow label="Ground Transport">{mission.ground_transport ? "Requested" : "No"}</DetailRow>
              <DetailRow label="Catering">{mission.catering ? "Requested" : "No"}</DetailRow>
              <DetailRow label="International">{mission.is_international ? "Yes" : "No"}</DetailRow>
            </dl>
          </SectionCard>

          {showAssignedDetails && mission.client_notes ? (
            <SectionCard title="Operational Notes" icon="fileText">
              <p className="text-sm leading-6 text-muted-foreground">{mission.client_notes}</p>
            </SectionCard>
          ) : null}

          {showAssignedDetails && mission.passengers.length > 0 ? (
            <SectionCard title="Passenger Manifest" icon="users">
              <div className="space-y-2">
                {mission.passengers.map((p) => (
                  <div key={p.id} className="flex justify-between rounded-md border border-border bg-background/50 px-4 py-2 text-sm">
                    <span className="font-medium">{p.full_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{p.passenger_type}</span>
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
            <p className="text-sm text-muted-foreground">Questions about this mission?</p>
            <a href="mailto:ops@amgaviation.com" className="mt-2 block text-sm text-accent hover:underline">ops@amgaviation.com</a>
          </SectionCard>
        </div>
      </div>
    </PortalShell>
  );
}
