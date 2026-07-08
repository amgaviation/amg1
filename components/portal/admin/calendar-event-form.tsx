"use client";

import { useState } from "react";
import { SelectField, TextAreaField, TextField } from "@/components/portal/ui/fields";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { AttendeePicker, type AttendeeGroup } from "@/components/portal/admin/attendee-picker";
import { EVENT_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from "@/lib/portal/calendar-constants";

/**
 * Create/edit form for an ops calendar event. All times are UTC to match the
 * calendar grid. The all-day toggle hides the time inputs. Linked people are
 * notified on save unless "Do not notify" is checked.
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
  status: string;
  mission_id: string | null;
  aircraft_id: string | null;
  attendees: { id: string; label: string }[];
};

/** Split an ISO timestamp into UTC date (YYYY-MM-DD) and time (HH:MM). */
function splitUtc(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const time = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
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
  const start = splitUtc(event?.starts_at ?? null);
  const end = splitUtc(event?.ends_at ?? null);
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

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Start Date"
          name="start_date"
          type="date"
          required
          defaultValue={start.date || defaultDate}
        />
        {allDay ? null : (
          <TextField
            label="Start Time (UTC)"
            name="start_time"
            type="time"
            defaultValue={start.time}
            hint="Times are UTC to match the calendar grid."
          />
        )}
        <TextField
          label="End Date"
          name="end_date"
          type="date"
          defaultValue={end.date}
          hint="Optional — leave blank for a single-day event."
        />
        {allDay ? null : (
          <TextField label="End Time (UTC)" name="end_time" type="time" defaultValue={end.time} />
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
