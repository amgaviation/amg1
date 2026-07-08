"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, bool, safeRedirectPath, str } from "./_helpers";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { EVENT_STATUS_LABEL, EVENT_TYPE_LABEL } from "@/lib/portal/calendar-events";

/**
 * Ops calendar events. Admins create events, optionally linked to a mission,
 * an aircraft, and any number of people. Each linked person is notified once
 * when added (in-app + email) unless the admin opts out with "do not notify".
 */

const CAL_BASE = "/portal/admin/calendar";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVENT_TYPES = new Set(Object.keys(EVENT_TYPE_LABEL));
const EVENT_STATUSES = new Set(Object.keys(EVENT_STATUS_LABEL));

/** Combine a date + optional time into a UTC ISO string (the grid is UTC). */
function toIso(date: string, time: string, fallbackTime: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const t = /^\d{2}:\d{2}$/.test(time) ? time : fallbackTime;
  const parsed = new Date(`${date}T${t}:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function uuidOrNull(value: string): string | null {
  return UUID_RE.test(value) ? value : null;
}

function attendeeIds(formData: FormData): string[] {
  const seen = new Set<string>();
  for (const raw of formData.getAll("attendee_ids")) {
    const id = String(raw);
    if (UUID_RE.test(id)) seen.add(id);
  }
  return [...seen];
}

function eventDateLabel(startsAt: string, allDay: boolean): string {
  const date = new Date(startsAt);
  const dateText = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  if (allDay) return `${dateText} (all day, UTC)`;
  const timeText = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${dateText} at ${timeText} UTC`;
}

async function notifyAttendees(
  ids: string[],
  event: { id: string; title: string; startsAt: string; allDay: boolean; location: string | null; description: string | null }
): Promise<void> {
  if (!ids.length) return;
  const when = eventDateLabel(event.startsAt, event.allDay);
  const bodyParts = [when];
  if (event.location) bodyParts.push(`Location: ${event.location}`);
  if (event.description) bodyParts.push(event.description);
  await Promise.all(
    ids.map((userId) =>
      notifyUser({
        userId,
        title: `You've been added to: ${event.title}`,
        body: bodyParts.join("\n\n"),
        type: "calendar_event",
        entityType: "calendar_event",
        entityId: event.id,
      })
    )
  );
}

function parseEvent(formData: FormData) {
  const title = str(formData, "title").slice(0, 200);
  const eventTypeRaw = str(formData, "event_type");
  const eventType = EVENT_TYPES.has(eventTypeRaw) ? eventTypeRaw : "meeting";
  const statusRaw = str(formData, "status");
  const status = EVENT_STATUSES.has(statusRaw) ? statusRaw : "scheduled";
  const allDay = bool(formData, "all_day");
  const startsAt = toIso(str(formData, "start_date"), str(formData, "start_time"), "00:00");
  const endDate = str(formData, "end_date");
  const endsAt = endDate
    ? toIso(endDate, str(formData, "end_time"), allDay ? "23:59" : "00:00")
    : null;

  return {
    title,
    eventType,
    status,
    allDay,
    startsAt,
    endsAt,
    location: str(formData, "location").slice(0, 200) || null,
    description: str(formData, "description").slice(0, 4000) || null,
    missionId: uuidOrNull(str(formData, "mission_id")),
    aircraftId: uuidOrNull(str(formData, "aircraft_id")),
  };
}

export async function createCalendarEvent(formData: FormData) {
  const admin = await actor(["admin"], "missions.edit");
  const backTo = safeRedirectPath(str(formData, "back_to"), CAL_BASE);
  const parsed = parseEvent(formData);
  const doNotNotify = bool(formData, "do_not_notify");
  const ids = attendeeIds(formData);

  if (!parsed.title) redirect(`${backTo}?error=title`);
  if (!parsed.startsAt) redirect(`${backTo}?error=date`);
  // A supplied end must not precede the start.
  if (parsed.endsAt && parsed.endsAt < parsed.startsAt) redirect(`${backTo}?error=range`);

  const db = await createServiceClient();
  const { data: event, error } = await db
    .from("calendar_events")
    .insert({
      title: parsed.title,
      description: parsed.description,
      event_type: parsed.eventType,
      location: parsed.location,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      all_day: parsed.allDay,
      status: parsed.status,
      mission_id: parsed.missionId,
      aircraft_id: parsed.aircraftId,
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !event) redirect(`${backTo}?error=save`);

  if (ids.length) {
    await db.from("calendar_event_attendees").insert(
      ids.map((profileId) => ({
        event_id: event.id,
        profile_id: profileId,
        notified: !doNotNotify,
      }))
    );
    if (!doNotNotify) {
      await notifyAttendees(ids, {
        id: event.id,
        title: parsed.title,
        startsAt: parsed.startsAt,
        allDay: parsed.allDay,
        location: parsed.location,
        description: parsed.description,
      });
    }
  }

  await logAuditEvent({
    actor: admin,
    action: "calendar_event_created",
    detail: `${parsed.title} (${EVENT_TYPE_LABEL[parsed.eventType]}) — ${ids.length} attendee${ids.length === 1 ? "" : "s"}${doNotNotify ? ", not notified" : ""}`,
    entityType: "calendar_event",
    entityId: event.id,
  });

  revalidatePath(CAL_BASE);
  redirect(`${backTo}?success=created`);
}

export async function updateCalendarEvent(formData: FormData) {
  const admin = await actor(["admin"], "missions.edit");
  const backTo = safeRedirectPath(str(formData, "back_to"), CAL_BASE);
  const eventId = uuidOrNull(str(formData, "event_id"));
  if (!eventId) redirect(`${backTo}?error=notfound`);
  const parsed = parseEvent(formData);
  const doNotNotify = bool(formData, "do_not_notify");
  const ids = attendeeIds(formData);

  if (!parsed.title) redirect(`${backTo}?error=title`);
  if (!parsed.startsAt) redirect(`${backTo}?error=date`);
  if (parsed.endsAt && parsed.endsAt < parsed.startsAt) redirect(`${backTo}?error=range`);

  const db = await createServiceClient();
  const { data: existing } = await db
    .from("calendar_events")
    .select("id, title")
    .eq("id", eventId!)
    .maybeSingle();
  if (!existing) redirect(`${backTo}?error=notfound`);

  const { error: updateError } = await db
    .from("calendar_events")
    .update({
      title: parsed.title,
      description: parsed.description,
      event_type: parsed.eventType,
      location: parsed.location,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      all_day: parsed.allDay,
      status: parsed.status,
      mission_id: parsed.missionId,
      aircraft_id: parsed.aircraftId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId!);
  if (updateError) redirect(`${backTo}?error=save`);

  // Reconcile attendees: drop removed rows, add new ones. Only people newly
  // added this save are notified — existing attendees are left untouched.
  const { data: current } = await db
    .from("calendar_event_attendees")
    .select("profile_id")
    .eq("event_id", eventId!);
  const currentIds = new Set((current ?? []).map((row) => row.profile_id));
  const target = new Set(ids);
  const added = ids.filter((id) => !currentIds.has(id));
  const removed = [...currentIds].filter((id) => !target.has(id));

  if (removed.length) {
    await db
      .from("calendar_event_attendees")
      .delete()
      .eq("event_id", eventId!)
      .in("profile_id", removed);
  }
  if (added.length) {
    await db.from("calendar_event_attendees").insert(
      added.map((profileId) => ({
        event_id: eventId!,
        profile_id: profileId,
        notified: !doNotNotify,
      }))
    );
    if (!doNotNotify) {
      await notifyAttendees(added, {
        id: eventId!,
        title: parsed.title,
        startsAt: parsed.startsAt,
        allDay: parsed.allDay,
        location: parsed.location,
        description: parsed.description,
      });
    }
  }

  await logAuditEvent({
    actor: admin,
    action: "calendar_event_updated",
    detail: `${parsed.title} — +${added.length}/-${removed.length} attendees${doNotNotify ? ", not notified" : ""}`,
    entityType: "calendar_event",
    entityId: eventId!,
  });

  revalidatePath(CAL_BASE);
  redirect(`${backTo}?success=updated`);
}

export async function deleteCalendarEvent(formData: FormData) {
  const admin = await actor(["admin"], "missions.edit");
  const backTo = safeRedirectPath(str(formData, "back_to"), CAL_BASE);
  const eventId = uuidOrNull(str(formData, "event_id"));
  if (!eventId) redirect(`${backTo}?error=notfound`);

  const db = await createServiceClient();
  const { data: existing } = await db
    .from("calendar_events")
    .select("id, title")
    .eq("id", eventId!)
    .maybeSingle();
  if (!existing) redirect(`${backTo}?error=notfound`);

  // Attendee rows cascade on delete.
  const { error } = await db.from("calendar_events").delete().eq("id", eventId!);
  if (error) redirect(`${backTo}?error=save`);

  await logAuditEvent({
    actor: admin,
    action: "calendar_event_deleted",
    detail: `Deleted event ${existing.title}`,
    entityType: "calendar_event",
    entityId: eventId!,
  });

  revalidatePath(CAL_BASE);
  redirect(`${backTo}?success=deleted`);
}
