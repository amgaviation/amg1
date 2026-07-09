import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import {
  DetailRow,
  Notice,
  PageHeader,
  SectionCard,
} from "@/components/portal/ui/primitives";
import { FormModal, RecordModal } from "@/components/portal/ui/record-modal";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { Button } from "@/components/ui/button";
import { listAllMissions } from "@/lib/portal/queries";
import {
  EVENT_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  eventStatusTone,
  eventTypeTone,
  getCalendarEvent,
  listCalendarEventsForMonth,
  listEventFormOptions,
} from "@/lib/portal/calendar-events";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/app/portal/actions/calendar-events";
import { CalendarGrid, type GridEvent, type GridMission } from "@/components/portal/admin/calendar-grid";
import { CalendarEventForm } from "@/components/portal/admin/calendar-event-form";
import {
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import {
  DEFAULT_TIMEZONE,
  getZonedDateParts,
  tzAbbrev,
  zonedClock,
  zonedClockWithZone,
  zonedDateLong,
} from "@/lib/portal/timezones";

export const metadata = { title: "Ops Calendar - AMG Operations" };
export const dynamic = "force-dynamic";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const BASE = "/portal/admin/calendar";

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function whenLabel(startsAt: string, endsAt: string | null, allDay: boolean, timeZone: string) {
  const dateText = zonedDateLong(startsAt, timeZone);
  if (allDay) {
    if (endsAt) {
      const endText = zonedDateLong(endsAt, timeZone);
      if (endText !== dateText) return `${dateText} → ${endText} (all day)`;
    }
    return `${dateText} (all day)`;
  }
  let text = `${dateText} · ${zonedClock(startsAt, timeZone)}`;
  if (endsAt) text += ` – ${zonedClock(endsAt, timeZone)}`;
  // Append the zone abbreviation once, from the start instant.
  const abbrev = tzAbbrev(startsAt, timeZone);
  return abbrev ? `${text} ${abbrev}` : text;
}

export default async function OpsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    new?: string;
    date?: string;
    event?: string;
    edit?: string;
    success?: string;
    error?: string;
  }>;
}) {
  await requireRolePermission("admin", "missions");
  const params = await searchParams;

  // "Today" and the default month are anchored to a business reference zone,
  // not the server's UTC clock — otherwise an evening admin west of UTC sees
  // tomorrow highlighted and lands on next month.
  const nowParts = getZonedDateParts(new Date().toISOString(), DEFAULT_TIMEZONE);
  let year = nowParts.year;
  let month = nowParts.month - 1;
  const match = /^(\d{4})-(\d{2})$/.exec(params.month ?? "");
  if (match) {
    year = Number(match[1]);
    month = Math.min(11, Math.max(0, Number(match[2]) - 1));
  }
  const monthKey = monthParam(year, month);

  const [missions, events, formOptions] = await Promise.all([
    listAllMissions(),
    listCalendarEventsForMonth(year, month),
    listEventFormOptions(),
  ]);

  // Bucket missions (by requested departure) and events (by start) into days.
  const missionsByDay: Record<number, GridMission[]> = {};
  for (const mission of missions) {
    if (!mission.requested_departure) continue;
    const departure = new Date(mission.requested_departure);
    if (departure.getUTCFullYear() !== year || departure.getUTCMonth() !== month) continue;
    const day = departure.getUTCDate();
    (missionsByDay[day] ??= []).push({
      id: mission.id,
      ref: mission.tail_number ?? mission.ref,
      label: `${mission.departure_airport ?? "?"}→${mission.arrival_airport ?? "?"}`,
    });
  }

  const eventsByDay: Record<number, GridEvent[]> = {};
  for (const event of events) {
    // Bucket by the event's local (its-zone) calendar date, then keep only the
    // ones whose local date actually lands in the month being viewed.
    const parts = getZonedDateParts(event.starts_at, event.timezone);
    if (parts.year !== year || parts.month !== month + 1) continue;
    (eventsByDay[parts.day] ??= []).push({
      id: event.id,
      title: event.title,
      type: event.event_type,
      typeLabel: EVENT_TYPE_LABEL[event.event_type] ?? event.event_type,
      tone: eventTypeTone(event.event_type),
      allDay: event.all_day,
      time: event.all_day ? null : zonedClockWithZone(event.starts_at, event.timezone),
      status: event.status,
    });
  }

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = month === 0 ? monthParam(year - 1, 11) : monthParam(year, month - 1);
  const next = month === 11 ? monthParam(year + 1, 0) : monthParam(year, month + 1);
  const todayDay =
    year === nowParts.year && month === nowParts.month - 1 ? nowParts.day : null;

  const navLink =
    "rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-4 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]";

  // Detail-list days: union of days that have events or missions.
  const detailDays = [...new Set([...Object.keys(eventsByDay), ...Object.keys(missionsByDay)].map(Number))].sort(
    (a, b) => a - b
  );

  // Active record for the view/edit modals. Edit wins if both params are set
  // (stale/hand-built URL) so only one modal ever renders; a plain ?event only
  // opens the view when there's no ?edit alongside it.
  const editId = params.edit && /^[0-9a-f-]{36}$/i.test(params.edit) ? params.edit : null;
  const viewId = !editId && params.event && /^[0-9a-f-]{36}$/i.test(params.event) ? params.event : null;
  const activeEvent = editId
    ? await getCalendarEvent(editId)
    : viewId
      ? await getCalendarEvent(viewId)
      : null;
  // A ?event/?edit that points at a deleted or bad id resolves to nothing.
  const missingEvent = Boolean((params.event || params.edit) && !activeEvent);

  const SUCCESS_TEXT: Record<string, string> = {
    created: "Event created.",
    updated: "Event updated.",
    deleted: "Event deleted.",
  };
  const ERROR_TEXT: Record<string, string> = {
    title: "Give the event a title.",
    date: "Choose a start date for the event.",
    range: "The end can't be before the start.",
    save: "The event could not be saved. Try again.",
    notfound: "That event no longer exists.",
  };

  return (
    <>
      {params.success && SUCCESS_TEXT[params.success] ? (
        <Notice tone="success">{SUCCESS_TEXT[params.success]}</Notice>
      ) : null}
      {params.error && ERROR_TEXT[params.error] ? (
        <Notice tone="danger">{ERROR_TEXT[params.error]}</Notice>
      ) : null}
      {missingEvent ? <Notice tone="warn">That event no longer exists.</Notice> : null}

      <PageHeader
        eyebrow="AMG Operations"
        title="Ops Calendar"
        description="Mission departures and scheduled events by day. Click any day to add an event, or open one to edit it."
        actions={
          <>
            <Link href={`${BASE}?month=${prev}`} className={navLink}>← Previous</Link>
            <Link href={BASE} className={navLink}>Today</Link>
            <Link href={`${BASE}?month=${next}`} className={navLink}>Next →</Link>
            <Button asChild size="sm">
              <Link href={`${BASE}?month=${monthKey}&new=1`}>+ New Event</Link>
            </Button>
          </>
        }
      />

      <SectionCard
        title={`${MONTHS[month]} ${year}`}
        icon="calendar"
        description={`${events.length} event${events.length === 1 ? "" : "s"} · ${Object.values(missionsByDay).reduce((sum, list) => sum + list.length, 0)} mission departure${Object.values(missionsByDay).reduce((sum, list) => sum + list.length, 0) === 1 ? "" : "s"} this month`}
        bodyClassName="p-3"
      >
        <CalendarGrid
          year={year}
          month={month}
          monthKey={monthKey}
          cells={cells}
          eventsByDay={eventsByDay}
          missionsByDay={missionsByDay}
          todayDay={todayDay}
        />

        {/* Day detail list — phone-first surface and a scannable agenda. */}
        <div className="mt-4 space-y-2">
          {detailDays.length === 0 ? (
            <p className="deck-inset px-4 py-6 text-center text-sm text-[var(--deck-text-3)]">
              Nothing scheduled this month yet. Click a day above to add an event.
            </p>
          ) : null}
          {detailDays.map((day) => (
            <div key={day} className="deck-inset flex flex-wrap items-start gap-3 px-4 py-2.5">
              <span className="deck-num w-16 shrink-0 pt-1 text-sm font-bold text-[var(--deck-text)]">
                {MONTHS[month].slice(0, 3)} {day}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                {(eventsByDay[day] ?? []).map((event) => (
                  <Link
                    key={event.id}
                    href={`${BASE}?month=${monthKey}&event=${event.id}`}
                    className="inline-flex items-center gap-2 rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] py-1 pl-2.5 pr-3 text-xs transition-colors hover:border-[var(--deck-accent-line)]"
                  >
                    <StatusBadge label={event.typeLabel} tone={event.tone} />
                    {event.time ? (
                      <span className="deck-num text-[var(--deck-text-3)]">{event.time}</span>
                    ) : null}
                    <span className={event.status === "cancelled" ? "line-through opacity-60" : ""}>
                      {event.title}
                    </span>
                  </Link>
                ))}
                {(missionsByDay[day] ?? []).map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/portal/admin/trips/${mission.id}`}
                    className="inline-flex items-center gap-2 rounded-md border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] py-1 pl-3 pr-3 text-xs transition-colors hover:border-[var(--deck-accent-line)]"
                  >
                    <span className="deck-mono text-[var(--deck-accent-ink)]">{mission.label}</span>
                    {mission.ref}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Create window */}
      {params.new === "1" ? (
        <FormModal
          eyebrow="AMG Operations"
          title="New calendar event"
          meta="Link a mission, aircraft, and people. Linked people are notified unless you opt out."
          paramKeys={["new", "date"]}
          wide
        >
          <CalendarEventForm
            action={createCalendarEvent}
            backTo={`${BASE}?month=${monthKey}`}
            peopleGroups={formOptions.peopleGroups}
            missions={formOptions.missions}
            aircraft={formOptions.aircraft}
            defaultDate={/^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "") ? params.date : ""}
            submitLabel="Create event"
          />
        </FormModal>
      ) : null}

      {/* Edit window */}
      {editId && activeEvent ? (
        <FormModal
          eyebrow="AMG Operations"
          title={`Edit: ${activeEvent.title}`}
          meta="Newly added people are notified on save unless you opt out."
          paramKeys={["edit"]}
          wide
        >
          <CalendarEventForm
            action={updateCalendarEvent}
            backTo={`${BASE}?month=${monthKey}`}
            peopleGroups={formOptions.peopleGroups}
            missions={formOptions.missions}
            aircraft={formOptions.aircraft}
            event={{
              id: activeEvent.id,
              title: activeEvent.title,
              description: activeEvent.description,
              event_type: activeEvent.event_type,
              location: activeEvent.location,
              timezone: activeEvent.timezone,
              starts_at: activeEvent.starts_at,
              ends_at: activeEvent.ends_at,
              all_day: activeEvent.all_day,
              status: activeEvent.status,
              mission_id: activeEvent.mission_id,
              aircraft_id: activeEvent.aircraft_id,
              attendees: activeEvent.attendees.map((a) => ({
                id: a.profile_id,
                label: a.profile?.full_name ?? a.profile?.email ?? "Unknown",
              })),
            }}
            submitLabel="Save changes"
          />
        </FormModal>
      ) : null}

      {/* View window */}
      {viewId && activeEvent ? (
        <RecordModal
          eyebrow={EVENT_TYPE_LABEL[activeEvent.event_type] ?? "Event"}
          title={activeEvent.title}
          meta={whenLabel(activeEvent.starts_at, activeEvent.ends_at, activeEvent.all_day, activeEvent.timezone)}
          paramKeys={["event"]}
          badge={
            <StatusBadge
              label={EVENT_STATUS_LABEL[activeEvent.status] ?? activeEvent.status}
              tone={eventStatusTone(activeEvent.status)}
            />
          }
          actions={
            <>
              <Button asChild size="sm">
                <Link href={`${BASE}?month=${monthKey}&edit=${activeEvent.id}`}>Edit</Link>
              </Button>
              <form action={deleteCalendarEvent}>
                <input type="hidden" name="event_id" value={activeEvent.id} />
                <input type="hidden" name="back_to" value={`${BASE}?month=${monthKey}`} />
                <SubmitButton
                  variant="outline"
                  className="border-[var(--deck-danger-line)] text-[var(--deck-danger)] hover:border-[var(--deck-danger-line)]"
                  confirm="Delete this event? This cannot be undone."
                  pendingText="Deleting…"
                >
                  Delete
                </SubmitButton>
              </form>
            </>
          }
        >
          <dl>
            <DetailRow label="Type">{EVENT_TYPE_LABEL[activeEvent.event_type] ?? activeEvent.event_type}</DetailRow>
            <DetailRow label="When">{whenLabel(activeEvent.starts_at, activeEvent.ends_at, activeEvent.all_day, activeEvent.timezone)}</DetailRow>
            <DetailRow label="Timezone">{activeEvent.timezone}</DetailRow>
            <DetailRow label="Location">{activeEvent.location ?? "—"}</DetailRow>
            <DetailRow label="Mission">
              {activeEvent.mission ? (
                <Link href={`/portal/admin/trips/${activeEvent.mission.id}`} className="text-[var(--deck-accent-ink)] hover:underline">
                  {activeEvent.mission.ref}
                  {activeEvent.mission.departure_airport && activeEvent.mission.arrival_airport
                    ? ` · ${activeEvent.mission.departure_airport}→${activeEvent.mission.arrival_airport}`
                    : ""}
                </Link>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Aircraft">{activeEvent.aircraft?.tail_number ?? "—"}</DetailRow>
            <DetailRow label="People">
              {activeEvent.attendees.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeEvent.attendees.map((attendee) => (
                    <span
                      key={attendee.id}
                      title={attendee.notified ? "Notified" : "Not notified"}
                      className="inline-flex items-center gap-1.5 rounded-[0.25rem] border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-2 py-1 text-xs text-[var(--deck-text)]"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${attendee.notified ? "bg-[var(--deck-accent)]" : "bg-[var(--deck-text-3)]"}`}
                        aria-hidden
                      />
                      {attendee.profile?.full_name ?? attendee.profile?.email ?? "Unknown"}
                      {attendee.profile?.role ? (
                        <span className="text-[var(--deck-text-3)]">· {attendee.profile.role}</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </DetailRow>
            {activeEvent.description ? (
              <DetailRow label="Details">
                <span className="whitespace-pre-wrap">{activeEvent.description}</span>
              </DetailRow>
            ) : null}
          </dl>
        </RecordModal>
      ) : null}
    </>
  );
}
