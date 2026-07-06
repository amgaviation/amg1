import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { SectionCard, Timeline, Notice } from "@/components/portal/ui/primitives";
import { DescriptionList } from "@/components/portal/ui/description-list";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { TextAreaField } from "@/components/portal/ui/fields";
import { Button } from "@/components/ui/button";
import { getMissionDetail } from "@/lib/portal/queries";
import {
  MISSION_STATUS,
  CLIENT_MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  MISSION_TYPE_LABEL,
  URGENCY_LABEL,
  URGENCY_TONE,
  toneFor,
  labelFor,
} from "@/lib/portal/constants";
import { formatRoute, formatDateTime, formatDate } from "@/lib/portal/format";
import { cancelMission, provideRequestedInfo } from "@/app/portal/actions/missions";

export const metadata = { title: "Trip Detail — Client Portal" };

export default async function ClientTripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireRolePermission("client", "missions");
  const { id } = await params;
  const sp = await searchParams;

  const mission = await getMissionDetail(id);
  if (!mission || (mission.client_id !== user.id && user.role !== "admin")) notFound();

  // Index must be computed on the SAME filtered list the stepper renders,
  // or removing "draft" shifts every comparison by one (stage after the
  // current one showed as "Current").
  const timelineStatuses = MISSION_STATUS.filter(
    (s) => s.value !== "draft" && s.value !== "cancelled"
  );
  const statusIndex = timelineStatuses.findIndex((s) => s.value === mission.status);
  const timelineItems = timelineStatuses.map((s, i) => ({
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
      {sp.success === "info-sent" ? (
        <Notice tone="success">Information sent — your request is back under review with AMG Operations.</Notice>
      ) : null}
      {sp.error === "info-required" ? (
        <Notice tone="danger">Enter the requested information before sending.</Notice>
      ) : sp.error === "not-awaiting" ? (
        <Notice tone="danger">This request is no longer awaiting information from you.</Notice>
      ) : sp.error === "payment-data" ? (
        <Notice tone="danger">Remove full card numbers, CVV codes, bank account numbers, or routing numbers before sending.</Notice>
      ) : null}

      {/* Detail-archetype summary header */}
      <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="deck-eyebrow">Trip Detail</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="deck-title text-[1.65rem] sm:text-[2rem]">{mission.ref}</h1>
            <StatusBadge label={labelFor(CLIENT_MISSION_STATUS_LABEL, mission.status)} tone={toneFor(MISSION_STATUS_TONE, mission.status)} />
            {mission.urgency !== "standard" ? (
              <StatusBadge label={labelFor(URGENCY_LABEL, mission.urgency)} tone={toneFor(URGENCY_TONE, mission.urgency)} />
            ) : null}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {mission.status === "awaiting_client_info" ? (
            <SectionCard
              title="AMG needs more information"
              description="AMG Operations paused this request until you provide additional detail — see the note under Mission Status."
              icon="alert"
            >
              <form action={provideRequestedInfo} className="grid gap-4">
                <input type="hidden" name="mission_id" value={mission.id} />
                <TextAreaField
                  label="Requested Information"
                  name="info"
                  required
                  rows={5}
                  maxLength={4000}
                  placeholder="Type the details AMG Operations asked for…"
                  hint="Sending puts this request back under review. Do not include card or bank account numbers."
                />
                <div>
                  <SubmitButton pendingText="Sending…">Send to AMG Operations</SubmitButton>
                </div>
              </form>
            </SectionCard>
          ) : null}

          <SectionCard title="Mission Summary" icon="plane">
            <DescriptionList
              items={[
                { label: "Type", value: labelFor(MISSION_TYPE_LABEL, mission.mission_type) },
                { label: "Route", value: formatRoute(mission.departure_airport, mission.arrival_airport), mono: true },
                ...(mission.alternate_airport
                  ? [{ label: "Alternate", value: mission.alternate_airport, mono: true }]
                  : []),
                { label: "Aircraft", value: mission.tail_number ?? "—", mono: true },
                { label: "Departure", value: formatDateTime(mission.requested_departure) },
                { label: "Arrival", value: formatDateTime(mission.requested_arrival) },
                { label: "Passengers", value: mission.passenger_count },
                ...(mission.fbo_preference ? [{ label: "FBO", value: mission.fbo_preference }] : []),
                { label: "Ground Transport", value: mission.ground_transport ? "Requested" : "Not requested" },
                { label: "Catering", value: mission.catering ? "Requested" : "Not requested" },
                { label: "International", value: mission.is_international ? "Yes" : "No" },
              ]}
            />
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
                  <Link key={q.id} href={`/portal/client/quotes/${q.id}`} className="flex items-center justify-between rounded-md border border-border bg-background/50 px-4 py-3 hover:border-accent/60">
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
                <SubmitButton variant="destructive" confirm="Cancel this trip request? This cannot be undone." pendingText="Cancelling…">
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
                    <p className="mt-0.5 text-xs text-muted-foreground uppercase [letter-spacing:0.08em]">{ca.crew_role} · {ca.status}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Messages" icon="messageSquare" actions={<Button asChild size="sm" variant="outline" className="text-xs"><Link href="/portal/client/messages">Open</Link></Button>}>
            <p className="text-sm text-muted-foreground">Message AMG Operations about this mission.</p>
          </SectionCard>

          <SectionCard title="Documents" icon="fileText" actions={<Button asChild size="sm" variant="outline" className="text-xs"><Link href="/portal/client/documents">View all</Link></Button>}>
            <p className="text-sm text-muted-foreground">Mission documents and flight packets.</p>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
