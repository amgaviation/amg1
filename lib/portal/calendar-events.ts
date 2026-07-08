import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Ops calendar events (server queries). An event can link to a mission, an
 * aircraft, and any number of people (attendees). Attendees live in a
 * junction table so each one can be notified exactly once when added.
 * Client-safe vocab lives in calendar-constants.ts (re-exported here).
 */

export {
  EVENT_TYPE_OPTIONS,
  EVENT_TYPE_LABEL,
  eventTypeTone,
  EVENT_STATUS_OPTIONS,
  EVENT_STATUS_LABEL,
  eventStatusTone,
} from "@/lib/portal/calendar-constants";

export type EventAttendee = {
  id: string;
  profile_id: string;
  notified: boolean;
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    company_name: string | null;
  } | null;
};

export type CalendarEvent = Tables<"calendar_events"> & {
  mission: { id: string; ref: string; departure_airport: string | null; arrival_airport: string | null } | null;
  aircraft: { id: string; tail_number: string } | null;
  attendees: EventAttendee[];
};

const EVENT_SELECT =
  "*, mission:mission_id(id, ref, departure_airport, arrival_airport), aircraft:aircraft_id(id, tail_number), attendees:calendar_event_attendees(id, profile_id, notified, profile:profile_id(id, full_name, email, role, company_name))";

/** Events whose start falls in (or adjacent to) the given month. */
export async function listCalendarEventsForMonth(
  year: number,
  month: number
): Promise<CalendarEvent[]> {
  const db = await createServiceClient();
  // Widen the window by a day on each side: an event's per-zone local date can
  // land inside this month while its UTC instant sits just outside it (max
  // offset ±14h < 1 day). The page re-buckets by each event's local date.
  const from = new Date(Date.UTC(year, month, 0)).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 2)).toISOString();
  const { data } = await db
    .from("calendar_events")
    .select(EVENT_SELECT)
    .gte("starts_at", from)
    .lt("starts_at", to)
    .order("starts_at", { ascending: true })
    .returns<CalendarEvent[]>();
  return data ?? [];
}

export async function getCalendarEvent(id: string): Promise<CalendarEvent | null> {
  const db = await createServiceClient();
  const { data } = await db
    .from("calendar_events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle()
    .returns<CalendarEvent | null>();
  return data ?? null;
}

export type EventFormOptions = {
  missions: { value: string; label: string }[];
  aircraft: { value: string; label: string }[];
  peopleGroups: {
    label: string;
    options: { id: string; label: string; description?: string }[];
  }[];
};

/** Everything the create/edit form needs to populate its link pickers. */
export async function listEventFormOptions(): Promise<EventFormOptions> {
  const db = await createServiceClient();

  const [missionsRes, aircraftRes, peopleRes] = await Promise.all([
    db
      .from("missions")
      .select("id, ref, departure_airport, arrival_airport, requested_departure")
      .order("requested_departure", { ascending: false, nullsFirst: false })
      .limit(400),
    db.from("aircraft").select("id, tail_number, make, model").order("tail_number").limit(400),
    db
      .from("profiles")
      .select("id, full_name, email, role, company_name")
      .in("role", ["client", "crew", "partner", "admin", "super_admin"])
      .eq("status", "approved")
      .order("full_name")
      .limit(2000),
  ]);

  const missions = (missionsRes.data ?? []).map((mission) => ({
    value: mission.id,
    label: `${mission.ref}${mission.departure_airport && mission.arrival_airport ? ` · ${mission.departure_airport}→${mission.arrival_airport}` : ""}`,
  }));

  const aircraft = (aircraftRes.data ?? []).map((ac) => ({
    value: ac.id,
    label: `${ac.tail_number}${[ac.make, ac.model].filter(Boolean).length ? ` · ${[ac.make, ac.model].filter(Boolean).join(" ")}` : ""}`,
  }));

  const ROLE_GROUP: { role: string; label: string }[] = [
    { role: "client", label: "Clients" },
    { role: "crew", label: "Crew" },
    { role: "partner", label: "Partners" },
    { role: "admin", label: "Staff" },
    { role: "super_admin", label: "Staff" },
  ];
  const groupMap = new Map<string, { id: string; label: string; description?: string }[]>();
  for (const profile of peopleRes.data ?? []) {
    const groupLabel = ROLE_GROUP.find((entry) => entry.role === profile.role)?.label ?? "Other";
    const list = groupMap.get(groupLabel) ?? [];
    list.push({
      id: profile.id,
      label: profile.full_name ?? profile.email,
      description: [profile.company_name, profile.email].filter(Boolean).join(" · "),
    });
    groupMap.set(groupLabel, list);
  }
  const ORDER = ["Clients", "Crew", "Partners", "Staff", "Other"];
  const peopleGroups = [...groupMap.entries()]
    .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map(([label, options]) => ({ label, options }));

  return { missions, aircraft, peopleGroups };
}
