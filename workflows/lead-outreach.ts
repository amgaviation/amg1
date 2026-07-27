import { sleep } from "workflow";
import { createServiceClient } from "@/lib/supabase/server";
import { OUTREACH_AUTOMATION_ACTOR, getLeadEmailTemplates, sendLeadEmail } from "@/lib/portal/lead-email";
import { isSuppressed } from "@/lib/portal/lead-suppression";
import { getOutreachSettings, outreachBlockedReason, outreachSentLast24h } from "@/lib/portal/outreach-settings";
import { msUntilSendWindow } from "@/lib/portal/outreach-window";
import type { LeadBusinessType, LeadEmailStage } from "@/lib/portal/lead-email-templates";

/**
 * Automated three-touch outreach for one lead: intro, then two follow-ups if
 * the lead stays silent.
 *
 * There is no per-email approval click, so every guardrail is a code path here:
 * the kill switch and template-approval gate, the daily cap, the send window,
 * and a suppression check before each individual send. All of them are re-read
 * from the database at each touch rather than captured at the start — a run
 * spans a week and a half, and "switch it off" has to mean off now, not off for
 * runs that start tomorrow.
 *
 * Every decision this makes, including the ones that stop it, is written to
 * crm_activities so the lead's history in the admin portal is the full record.
 */

type LeadRow = {
  id: string;
  full_name: string;
  contact_first_name: string | null;
  company: string | null;
  email: string | null;
  stage: string;
  do_not_contact: boolean;
  notes: string | null;
};

/** Stage values that mean a human has taken over — stop automating. */
const HUMAN_OWNED_STAGES = ["qualified", "proposal", "won", "lost"];

async function log(leadId: string, type: string, body: string) {
  "use step";
  const db = (await createServiceClient()) as any;
  await db.from("crm_activities").insert({
    lead_id: leadId,
    activity_type: type,
    body: body.length > 4000 ? `${body.slice(0, 3999)}…` : body,
    created_by_email: "automation@amgaviationgroup.com",
  });
}

async function setLeadState(leadId: string, state: string, stampSend: boolean) {
  "use step";
  const db = (await createServiceClient()) as any;
  await db
    .from("crm_leads")
    .update({
      outreach_state: state,
      ...(stampSend ? { last_outreach_at: new Date().toISOString(), stage: "contacted" } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);
}

async function readLead(leadId: string): Promise<LeadRow | null> {
  "use step";
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("crm_leads")
    .select("id, full_name, contact_first_name, company, email, stage, do_not_contact, notes")
    .eq("id", leadId)
    .maybeSingle();
  return (data as LeadRow) ?? null;
}

/**
 * Has the lead replied since we last wrote to them?
 *
 * Any human-authored activity counts — an inbound email logged by the reply
 * handler, or an admin logging a call. The point is "a person is now in this
 * conversation", and once that is true the automation should get out of the
 * way rather than keep sending scheduled follow-ups underneath it.
 */
async function hasHumanActivity(leadId: string): Promise<boolean> {
  "use step";
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("crm_activities")
    .select("activity_type")
    .eq("lead_id", leadId)
    .in("activity_type", ["reply", "call", "meeting", "note", "email"])
    .limit(1);
  return Boolean(data?.length);
}

type GateResult =
  | { go: true }
  | { go: false; stop: boolean; reason: string };

/**
 * Everything that must be true for one send to proceed. Returns stop:true when
 * the condition is permanent for this lead (unsubscribed, human took over) and
 * stop:false when it is merely "not right now" (cap reached, switched off).
 */
async function gate(leadId: string): Promise<GateResult> {
  "use step";
  const settings = await getOutreachSettings();

  const blocked = outreachBlockedReason(settings);
  if (blocked) return { go: false, stop: false, reason: blocked };

  const db = (await createServiceClient()) as any;
  const { data: lead } = await db
    .from("crm_leads")
    .select("id, email, stage, do_not_contact")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return { go: false, stop: true, reason: "Lead no longer exists." };
  if (!lead.email) return { go: false, stop: true, reason: "Lead has no email address." };
  if (lead.do_not_contact) return { go: false, stop: true, reason: "Lead is marked do-not-contact." };
  if (await isSuppressed(lead.email)) {
    return { go: false, stop: true, reason: `${lead.email} is on the suppression list.` };
  }
  if (HUMAN_OWNED_STAGES.includes(lead.stage)) {
    return { go: false, stop: true, reason: `Lead moved to "${lead.stage}" — a person has taken over.` };
  }

  const sent = await outreachSentLast24h();
  if (sent >= settings.dailySendCap) {
    return {
      go: false,
      stop: false,
      reason: `Daily send cap reached (${sent}/${settings.dailySendCap}).`,
    };
  }

  return { go: true };
}

/** How long to wait before the send window is next open. */
async function waitForWindowMs(): Promise<number> {
  "use step";
  const settings = await getOutreachSettings();
  return msUntilSendWindow(new Date(), {
    startHour: settings.sendWindowStartHour,
    endHour: settings.sendWindowEndHour,
    days: settings.sendDays,
    timeZone: settings.sendTimezone,
  });
}

async function delayDays(which: 1 | 2): Promise<number> {
  "use step";
  const settings = await getOutreachSettings();
  return which === 1 ? settings.followup1DelayDays : settings.followup2DelayDays;
}

async function send(leadId: string, stage: LeadEmailStage, businessType: LeadBusinessType) {
  "use step";
  const lead = await readLead(leadId);
  if (!lead?.email) return { ok: false as const, reason: "no-email" };

  // Templates are resolved at send time, not at run start: an admin editing
  // the copy mid-sequence should see the new wording on the next touch.
  const templates = await getLeadEmailTemplates(
    { full_name: lead.contact_first_name || lead.full_name, company: lead.company },
    { name: "AMG Operations" },
  );

  const copy = templates[stage]?.[businessType];
  if (!copy) return { ok: false as const, reason: "no-template" };

  const result = await sendLeadEmail(
    {
      leadId,
      recipientEmail: lead.email,
      subject: copy.subject,
      body: copy.body,
    },
    OUTREACH_AUTOMATION_ACTOR,
  );

  return result.ok
    ? { ok: true as const, subject: copy.subject }
    : { ok: false as const, reason: result.reason };
}

export async function leadOutreach(leadId: string, businessType: LeadBusinessType) {
  "use workflow";

  const touches: { stage: LeadEmailStage; state: string; label: string; delay: 0 | 1 | 2 }[] = [
    { stage: "new", state: "intro_sent", label: "Introduction", delay: 0 },
    { stage: "contacted", state: "followup_1_sent", label: "Follow-up 1", delay: 1 },
    { stage: "contacted", state: "followup_2_sent", label: "Follow-up 2", delay: 2 },
  ];

  for (const touch of touches) {
    if (touch.delay !== 0) {
      const days = await delayDays(touch.delay);
      await sleep(`${days}d`);

      // A reply is the whole point of sending. If one arrived while we slept,
      // the sequence has done its job and anything further would talk over a
      // conversation already in progress.
      if (await hasHumanActivity(leadId)) {
        await log(leadId, "outreach_stopped", `${touch.label} skipped — the lead replied or a person logged activity.`);
        await setLeadState(leadId, "completed", false);
        return { leadId, outcome: "replied" };
      }
    }

    // Hold until the send window opens. Re-checked in a loop because the cap
    // and the kill switch can also push us out of the window, and because the
    // wait itself can cross a weekend.
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const waitMs = await waitForWindowMs();
      if (waitMs === 0) break;
      await sleep(waitMs);
    }

    const decision = await gate(leadId);
    if (!decision.go) {
      await log(leadId, decision.stop ? "outreach_stopped" : "outreach_skipped", `${touch.label}: ${decision.reason}`);
      if (decision.stop) {
        await setLeadState(leadId, "stopped", false);
        return { leadId, outcome: "stopped", reason: decision.reason };
      }
      // Not permanent — wait a day and let the next touch re-evaluate rather
      // than burning the sequence because today happened to be capped.
      await sleep("1d");
      continue;
    }

    const result = await send(leadId, touch.stage, businessType);
    if (!result.ok) {
      await log(leadId, "outreach_failed", `${touch.label} failed to send: ${result.reason}`);
      if (result.reason === "suppressed" || result.reason === "no-email") {
        await setLeadState(leadId, "suppressed", false);
        return { leadId, outcome: "suppressed" };
      }
      await setLeadState(leadId, "failed", false);
      return { leadId, outcome: "failed", reason: result.reason };
    }

    // "outreach_touch" not "outreach_email": sendLeadEmail already writes the
    // outreach_email row that the daily cap counts, and a second one here would
    // make every send count twice against the cap.
    await log(leadId, "outreach_touch", `${touch.label} sent — "${result.subject}"`);
    await setLeadState(leadId, touch.state, true);
  }

  await log(leadId, "outreach_completed", "Outreach sequence finished — three touches, no reply.");
  await setLeadState(leadId, "completed", false);
  return { leadId, outcome: "exhausted" };
}
