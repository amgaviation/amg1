import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard, DetailRow, Timeline, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { getMissionDetail } from "@/lib/portal/queries";
import {
  MISSION_STATUS,
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  MISSION_TYPE_LABEL,
  URGENCY_LABEL,
  URGENCY_TONE,
  toneFor,
  labelFor,
} from "@/lib/portal/constants";
import { formatRoute, formatDateTime, formatDate } from "@/lib/portal/format";
import { cancelMission } from "@/app/portal/actions/missions";

export const metadata = { title: "Trip Detail — Client Portal" };

export default async function ClientTripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("client");
  const { id } = await params;
  const sp = await searchParams;

  const mission = await getMissionDetail(id);
  if (!mission || (mission.client_id !== user.id && user.role !== "admin")) notFound();

  const statusIndex = MISSION_STATUS.findIndex((s) => s.value === mission.status);
  const timelineItems = MISSION_STATUS.filter((s) => s.value !== "draft" && s.value !== "cancelled").map((s, i) => ({
    title: s.label,
    meta: i === statusIndex ? "Current" : i < statusIndex ? "Done" : undefined,
    body: i === statusIndex && mission.client_notes ? mission.client_notes : undefined,
    tone: i < statusIndex ? "done" : i === statusIndex ? "active" : "future",
  }));

  const canCancel = ["submitted", "under_review", "awaiting_client_info"].includes(mission.status);

  return (
    <>
      {sp.success === "cancelled" ? <Notice tone="success">Mission cancelled.</Notice> : null}
      {sp.success === "passenger" ? <Notice tone="success">Passenger list updated.</Notice> : null}

      <PageHeader
        eyebrow={mission.ref}
        title={formatRoute(mission.departure_airport, mission.arrival_airport)}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge label={labelFor(MISSION_STATUS_LABEL, mission.status)} tone={toneFor(MISSION_STATUS_TONE, mission.status)} />
            {mission.urgency !== "standard" ? (
              <StatusBadge label={labelFor(URGENCY_LABEL, mission.urgency)} tone={toneFor(URGENCY_TONE, mission.urgency)} />
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <SectionCard title="Mission Summary" icon="plane">
            <dl>
              <DetailRow label="Type">{labelFor(MISSION_TYPE_LABEL, mission.mission_type)}</DetailRow>
              <DetailRow label="Route">{formatRoute(mission.departure_airport, mission.arrival_airport)}</DetailRow>
              {mission.alternate_airport ? <DetailRow label="Alternate">{mission.alternate_airport}</DetailRow> : null}
              <DetailRow label="Aircraft">{mission.tail_number ?? "—"}</DetailRow>
              <DetailRow label="Departure">{formatDateTime(mission.requested_departure)}</DetailRow>
              <DetailRow label="Arrival">{formatDateTime(mission.requested_arrival)}</DetailRow>
              <DetailRow label="Passengers">{mission.passenger_count}</DetailRow>
              {mission.fbo_preference ? <DetailRow label="FBO">{mission.fbo_preference}</DetailRow> : null}
              <DetailRow label="Ground Transport">{mission.ground_transport ? "Requested" : "Not requested"}</DetailRow>
              <DetailRow label="Catering">{mission.catering ? "Requested" : "Not requested"}</DetailRow>
              <DetailRow label="International">{mission.is_international ? "Yes" : "No"}</DetailRow>
            </dl>
          </SectionCard>

          {mission.passengers.length > 0 ? (
            <SectionCard title="Passenger Manifest" icon="users">
              <div className="space-y-2">
                {mission.passengers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-border bg-background/50 px-4 py-2 text-sm">
                    <span className="font-medium">{p.full_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{p.passenger_type}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {mission.client_notes ? (
            <SectionCard title="Client Notes" icon="fileText">
              <p className="text-sm leading-6 text-muted-foreground">{mission.client_notes}</p>
            </SectionCard>
          ) : null}

          {mission.quotes.length > 0 ? (
            <SectionCard title="Quotes" icon="receipt">
              <div className="space-y-2">
                {mission.quotes.map((q) => (
                  <Link key={q.id} href={`/portal/client/quotes/${q.id}`} className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3 hover:border-accent/60">
                    <div>
                      <p className="font-mono text-xs text-accent">{q.ref}</p>
                      <p className="mt-0.5 text-sm font-semibold">${q.total.toLocaleString()}</p>
                    </div>
                    <StatusBadge label={q.status} tone={q.status === "approved" ? "success" : q.status === "sent" ? "accent" : "neutral"} />
                  </Link>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {canCancel ? (
            <SectionCard title="Danger Zone" icon="shield">
              <form action={cancelMission}>
                <input type="hidden" name="mission_id" value={mission.id} />
                <SubmitButton variant="destructive" className="rounded-full" confirm="Cancel this trip request? This cannot be undone." pendingText="Cancelling…">
                  Cancel This Request
                </SubmitButton>
              </form>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <SectionCard title="Mission Status" icon="history">
            <Timeline items={timelineItems} />
          </SectionCard>

          {mission.crew.length > 0 ? (
            <SectionCard title="Assigned Crew" icon="users">
              <div className="space-y-2">
                {mission.crew.map((ca) => (
                  <div key={ca.id} className="rounded-md border border-border bg-background/50 px-4 py-3">
                    <p className="text-sm font-semibold">{ca.crew?.full_name ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground uppercase tracking-wide">{ca.crew_role} · {ca.status}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Messages" icon="messageSquare" actions={<Button asChild size="sm" variant="outline" className="rounded-full text-xs"><Link href="/portal/client/messages">Open</Link></Button>}>
            <p className="text-sm text-muted-foreground">Message AMG Operations about this mission.</p>
          </SectionCard>

          <SectionCard title="Documents" icon="fileText" actions={<Button asChild size="sm" variant="outline" className="rounded-full text-xs"><Link href="/portal/client/documents">View all</Link></Button>}>
            <p className="text-sm text-muted-foreground">Mission documents and flight packets.</p>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
