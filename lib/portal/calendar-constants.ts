import type { Tone } from "@/lib/portal/constants";

/**
 * Client-safe calendar vocab (types, labels, tones). Kept separate from
 * calendar-events.ts so client components can import it without pulling in the
 * server-only Supabase client.
 */

export const EVENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "meeting", label: "Meeting" },
  { value: "flight", label: "Flight / Trip" },
  { value: "maintenance", label: "Maintenance" },
  { value: "training", label: "Training" },
  { value: "check_ride", label: "Check Ride" },
  { value: "inspection", label: "Inspection" },
  { value: "deadline", label: "Deadline" },
  { value: "reminder", label: "Reminder" },
  { value: "call", label: "Call" },
  { value: "travel", label: "Travel" },
  { value: "other", label: "Other" },
];

export const EVENT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

const EVENT_TYPE_TONE: Record<string, Tone> = {
  meeting: "info",
  flight: "accent",
  maintenance: "warn",
  training: "info",
  check_ride: "info",
  inspection: "warn",
  deadline: "danger",
  reminder: "neutral",
  call: "info",
  travel: "accent",
  other: "neutral",
};

export function eventTypeTone(value: string): Tone {
  return EVENT_TYPE_TONE[value] ?? "neutral";
}

export const EVENT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "tentative", label: "Tentative" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const EVENT_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_STATUS_OPTIONS.map((option) => [option.value, option.label])
);

const EVENT_STATUS_TONE: Record<string, Tone> = {
  scheduled: "success",
  tentative: "warn",
  completed: "neutral",
  cancelled: "danger",
};

export function eventStatusTone(value: string): Tone {
  return EVENT_STATUS_TONE[value] ?? "neutral";
}
