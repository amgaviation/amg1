"use client";

import { useEffect, useState } from "react";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { AttendeePicker, type AttendeeGroup } from "@/components/portal/admin/attendee-picker";
import { EVENT_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from "@/lib/portal/calendar-constants";
import {
  DEFAULT_TIMEZONE,
  TIMEZONE_OPTIONS,
  browserTimeZoneOrDefault,
  getZonedDateParts,
} from "@/lib/portal/timezones";

/**
 * Create/edit form for an ops calendar event. Date and time are entered as
 * wall-clock in the selected timezone and stored as an absolute instant. The
 * all-day toggle hides the time inputs. Linked people are notified on save
 * unless "Do not notify" is checked.
 */

type EventFormValues = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  timezone: string;
  status: string;
  mission_id: string | null;
  aircraft_id: string | null;
  attendees: { id: string; label: string }[];
};

/** Split an ISO instant into date (YYYY-MM-DD) + time (HH:MM) in a zone. */
function splitZoned(iso: string | null, timeZone: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const p = getZonedDateParts(iso, timeZone);
  const date = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  const time = `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
  return { date, time };
}

export function CalendarEventForm({
  action,
  backTo,
  peopleGroups,
  missions,
  aircraft,
  event,
  defaultDate = "",
  submitLabel = "Create event",
}: {
  action: (formData: FormData) => void | Promise<void>;
  backTo: string;
  peopleGroups: AttendeeGroup[];
  missions: { value: string; label: string }[];
  aircraft: { value: string; label: string }[];
  event?: EventFormValues;
  /** Pre-selected date (YYYY-MM-DD) when creating from a day click. */
  defaultDate?: string;
  submitLabel?: string;
}) {
  // New events default to the browser's zone (if we offer it); edits keep the
  // event's stored zone. Initialize deterministically for SSR, then adopt the
  // browser zone after mount (create mode only) to avoid a hydration mismatch.
  const [timezone, setTimezone] = useState(event?.timezone ?? DEFAULT_TIMEZONE);
  useEffect(() => {
    if (!event) setTimezone(browserTimeZoneOrDefault());
  }, [event]);
  const start = splitZoned(event?.starts_at ?? null, event?.timezone ?? DEFAULT_TIMEZONE);
  const end = splitZoned(event?.ends_at ?? null, event?.timezone ?? DEFAULT_TIMEZONE);
  const [allDay, setAllDay] = useState(event?.all_day ?? false);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="back_to" value={backTo} />
      {event ? <input type="hidden" name="event_id" value={event.id} /> : null}

      <TextField
        label="Title"
        name="title"
        required
        defaultValue={event?.title ?? ""}
        placeholder="Recurrent training — N123AB"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Event Type"
          name="event_type"
          defaultValue={event?.event_type ?? "meeting"}
          options={EVENT_TYPE_OPTIONS}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={event?.status ?? "scheduled"}
          options={EVENT_STATUS_OPTIONS}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--deck-accent-line)]">
        <input
          type="checkbox"
          name="all_day"
          value="true"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="h-4 w-4 accent-[var(--deck-accent)]"
        />
        <span className="text-[var(--deck-text)]">All-day event</span>
      </label>

      <SelectField
        label="Timezone"
        name="timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        options={TIMEZONE_OPTIONS}
        hint="The date and time below are read in this timezone."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Start Date"
          name="start_date"
          type="date"
          required
          defaultValue={start.date || defaultDate}
        />
        {allDay ? null : (
          <TextField label="Start Time" name="start_time" type="time" defaultValue={start.time} />
        )}
        <TextField
          label="End Date"
          name="end_date"
          type="date"
          defaultValue={end.date}
          hint="Optional — leave blank for a single-day event."
        />
        {allDay ? null : (
          <TextField label="End Time" name="end_time" type="time" defaultValue={end.time} />
        )}
      </div>

      <TextField
        label="Location"
        name="location"
        defaultValue={event?.location ?? ""}
        placeholder="KTEB FBO, Conference room, Zoom…"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Link Mission"
          name="mission_id"
          defaultValue={event?.mission_id ?? ""}
          options={[{ value: "", label: "— None —" }, ...missions]}
        />
        <SelectField
          label="Link Aircraft"
          name="aircraft_id"
          defaultValue={event?.aircraft_id ?? ""}
          options={[{ value: "", label: "— None —" }, ...aircraft]}
        />
      </div>

      <div className="grid gap-2">
        <span className="text-[0.64rem] font-bold uppercase [letter-spacing:0.16em] text-[var(--deck-text-3)]">
          Link People
        </span>
        <AttendeePicker groups={peopleGroups} initial={event?.attendees ?? []} />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-3 py-2.5 text-sm transition-colors hover:border-[var(--deck-accent-line)]">
        <input
          type="checkbox"
          name="do_not_notify"
          value="true"
          className="h-4 w-4 accent-[var(--deck-accent)]"
        />
        <span className="text-[var(--deck-text)]">
          Do not notify — add people silently without sending a notification
        </span>
      </label>

      <TextAreaField
        label="Details"
        name="description"
        rows={3}
        defaultValue={event?.description ?? ""}
        placeholder="Agenda, briefing notes, what attendees should prepare…"
      />

      <div className="flex justify-end pt-1">
        <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
