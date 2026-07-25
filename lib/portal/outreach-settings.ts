import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Settings for the automated lead-outreach sequence.
 *
 * Every value here is a guardrail that a human click used to provide. The
 * sequence sends without per-email review, so these are the only things
 * standing between a template mistake and a few hundred strangers receiving
 * it. Read them fresh on every send rather than caching for the life of a run:
 * a run spans days, and "turn it off" has to mean off now, not off for leads
 * that start their sequence tomorrow.
 */

export type OutreachSettings = {
  enabled: boolean;
  templatesApprovedAt: string | null;
  templatesApprovedBy: string | null;
  dailySendCap: number;
  followup1DelayDays: number;
  followup2DelayDays: number;
  sendWindowStartHour: number;
  sendWindowEndHour: number;
  /** ISO weekdays, 1 = Monday ... 7 = Sunday. */
  sendDays: number[];
  sendTimezone: string;
  prospectingBatchSize: number;
  updatedAt: string | null;
};

/** Matches the column defaults, for the case where the row is somehow absent. */
export const OUTREACH_DEFAULTS: OutreachSettings = {
  enabled: false,
  templatesApprovedAt: null,
  templatesApprovedBy: null,
  dailySendCap: 25,
  followup1DelayDays: 4,
  followup2DelayDays: 7,
  sendWindowStartHour: 9,
  sendWindowEndHour: 19,
  sendDays: [1, 2, 3, 4, 5, 6],
  sendTimezone: "America/New_York",
  prospectingBatchSize: 25,
  updatedAt: null,
};

export async function getOutreachSettings(): Promise<OutreachSettings> {
  const db = (await createServiceClient()) as any;
  const { data } = await db.from("outreach_settings").select("*").eq("id", true).maybeSingle();
  if (!data) return OUTREACH_DEFAULTS;
  return {
    enabled: Boolean(data.enabled),
    templatesApprovedAt: data.templates_approved_at ?? null,
    templatesApprovedBy: data.templates_approved_by ?? null,
    dailySendCap: data.daily_send_cap ?? OUTREACH_DEFAULTS.dailySendCap,
    followup1DelayDays: data.followup_1_delay_days ?? OUTREACH_DEFAULTS.followup1DelayDays,
    followup2DelayDays: data.followup_2_delay_days ?? OUTREACH_DEFAULTS.followup2DelayDays,
    sendWindowStartHour: data.send_window_start_hour ?? OUTREACH_DEFAULTS.sendWindowStartHour,
    sendWindowEndHour: data.send_window_end_hour ?? OUTREACH_DEFAULTS.sendWindowEndHour,
    sendDays: Array.isArray(data.send_days) && data.send_days.length ? data.send_days : OUTREACH_DEFAULTS.sendDays,
    sendTimezone: data.send_timezone || OUTREACH_DEFAULTS.sendTimezone,
    prospectingBatchSize: data.prospecting_batch_size ?? OUTREACH_DEFAULTS.prospectingBatchSize,
    updatedAt: data.updated_at ?? null,
  };
}

/**
 * Why the sequence is not allowed to send right now, or null if it is.
 *
 * Deliberately returns the reason rather than a boolean: this string is written
 * into the lead's activity history, so an admin looking at a lead that went
 * quiet can see it was the kill switch and not a bug.
 */
export function outreachBlockedReason(settings: OutreachSettings): string | null {
  if (!settings.enabled) return "Automated outreach is switched off in settings.";
  if (!settings.templatesApprovedAt) {
    return "Lead outreach templates have not been approved yet.";
  }
  return null;
}

/** Outreach emails sent in the trailing 24h, across every lead. */
export async function outreachSentLast24h(): Promise<number> {
  const db = (await createServiceClient()) as any;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("crm_activities")
    .select("id", { count: "exact", head: true })
    .eq("activity_type", "outreach_email")
    .gte("created_at", since);
  return count ?? 0;
}
