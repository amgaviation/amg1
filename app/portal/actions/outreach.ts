"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { start } from "workflow/api";
import { leadOutreach } from "@/workflows/lead-outreach";
import { logAuditEvent } from "@/lib/portal/audit";
import { isSuppressed, suppressEmail } from "@/lib/portal/lead-suppression";
import { isLeadBusinessType } from "@/lib/portal/lead-email-templates";
import { runProspecting } from "@/lib/portal/prospecting";
import { importFaaProspects } from "@/lib/portal/faa-import";
import { importSoutheastMroLeads } from "@/lib/portal/mro-lead-import";
import { getOutreachSettings } from "@/lib/portal/outreach-settings";
import { SITE } from "@/lib/site-config";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, num, safeRedirectPath, str } from "./_helpers";

const SETTINGS_PATH = "/portal/admin/settings/outreach";

function withStatus(base: string, key: string, value: string) {
  return `${base}${base.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

/**
 * Save the pacing and window settings that bound the automated sequence.
 *
 * Values are clamped here as well as by the CHECK constraints — a form post is
 * user input, and a 5000/day cap typed into the box should come back as an
 * error, not a database exception.
 */
export async function saveOutreachSettings(formData: FormData) {
  const admin = await actor(["admin"], "settings.edit");
  const backTo = safeRedirectPath(str(formData, "back_to"), SETTINGS_PATH);

  const clamp = (value: number | null, min: number, max: number, fallback: number) =>
    value === null || Number.isNaN(value) ? fallback : Math.min(max, Math.max(min, Math.round(value)));

  const days = formData
    .getAll("send_days")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 7);

  const startHour = clamp(num(formData, "send_window_start_hour"), 0, 23, 9);
  const endHour = clamp(num(formData, "send_window_end_hour"), 1, 24, 19);
  if (startHour >= endHour) redirect(withStatus(backTo, "error", "window"));
  if (!days.length) redirect(withStatus(backTo, "error", "days"));

  const db = (await createServiceClient()) as any;
  const { error } = await db
    .from("outreach_settings")
    .update({
      enabled: str(formData, "enabled") === "on",
      daily_send_cap: clamp(num(formData, "daily_send_cap"), 1, 500, 25),
      followup_1_delay_days: clamp(num(formData, "followup_1_delay_days"), 1, 90, 4),
      followup_2_delay_days: clamp(num(formData, "followup_2_delay_days"), 1, 90, 7),
      send_window_start_hour: startHour,
      send_window_end_hour: endHour,
      send_days: days,
      send_timezone: str(formData, "send_timezone") || "America/New_York",
      prospecting_batch_size: clamp(num(formData, "prospecting_batch_size"), 1, 200, 25),
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq("id", true);

  if (error) redirect(withStatus(backTo, "error", "save"));

  await logAuditEvent({
    actor: admin,
    action: "outreach_settings_updated",
    detail: `Outreach settings updated (enabled=${str(formData, "enabled") === "on"})`,
  });

  revalidatePath(SETTINGS_PATH);
  redirect(withStatus(backTo, "success", "saved"));
}

/**
 * Record that a human has read the lead templates and accepts them going out
 * unattended.
 *
 * Separate from the enable switch on purpose: turning automation on and
 * vouching for the copy are two different decisions, and editing any lead
 * template clears this back to null (see saveEmailTemplate) so a change always
 * gets re-read before it reaches a stranger.
 */
export async function approveOutreachTemplates(formData: FormData) {
  const admin = await actor(["admin"], "settings.edit");
  const backTo = safeRedirectPath(str(formData, "back_to"), SETTINGS_PATH);

  const db = (await createServiceClient()) as any;
  await db
    .from("outreach_settings")
    .update({
      templates_approved_at: new Date().toISOString(),
      templates_approved_by: admin.id,
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    })
    .eq("id", true);

  await logAuditEvent({
    actor: admin,
    action: "outreach_templates_approved",
    detail: "Lead outreach templates approved for automated sending",
  });

  revalidatePath(SETTINGS_PATH);
  redirect(withStatus(backTo, "success", "approved"));
}

/** Emergency stop: switch off automation without touching anything else. */
export async function pauseOutreach(formData: FormData) {
  const admin = await actor(["admin"], "settings.edit");
  const backTo = safeRedirectPath(str(formData, "back_to"), SETTINGS_PATH);

  const db = (await createServiceClient()) as any;
  await db
    .from("outreach_settings")
    .update({ enabled: false, updated_at: new Date().toISOString(), updated_by: admin.id })
    .eq("id", true);

  await logAuditEvent({
    actor: admin,
    action: "outreach_paused",
    detail: "Automated lead outreach paused",
  });

  revalidatePath(SETTINGS_PATH);
  redirect(withStatus(backTo, "success", "paused"));
}

/**
 * Put one lead into the automated sequence.
 *
 * Refuses to double-enrol: a lead already mid-sequence would otherwise receive
 * two overlapping sets of follow-ups, which is the single most damaging thing
 * an outreach system can do to a reputation.
 */
export async function startLeadOutreach(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const leadId = str(formData, "lead_id");
  const backTo = safeRedirectPath(str(formData, "back_to"), `/portal/admin/crm/${leadId}`);
  if (!leadId) redirect(withStatus(backTo, "error", "missing"));

  const businessTypeRaw = str(formData, "business_type") || "general";
  const businessType = isLeadBusinessType(businessTypeRaw) ? businessTypeRaw : "general";

  const db = (await createServiceClient()) as any;
  const { data: lead } = await db
    .from("crm_leads")
    .select("id, email, do_not_contact, outreach_state")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) redirect(withStatus(backTo, "error", "missing"));
  if (!lead.email) redirect(withStatus(backTo, "error", "no-email"));
  if (lead.do_not_contact) redirect(withStatus(backTo, "error", "suppressed"));

  const active = ["queued", "intro_sent", "followup_1_sent", "followup_2_sent"];
  if (active.includes(lead.outreach_state ?? "")) {
    redirect(withStatus(backTo, "error", "already-running"));
  }

  const run = await start(leadOutreach, [leadId, businessType]);

  await db
    .from("crm_leads")
    .update({
      outreach_state: "queued",
      outreach_started_at: new Date().toISOString(),
      outreach_run_id: (run as { runId?: string })?.runId ?? null,
    })
    .eq("id", leadId);

  await db.from("crm_activities").insert({
    lead_id: leadId,
    activity_type: "outreach_started",
    body: `Automated outreach sequence started (${businessType}).`,
    created_by: admin.id,
    created_by_email: admin.email,
  });

  await logAuditEvent({
    actor: admin,
    action: "outreach_started",
    detail: `Automated outreach started for lead ${leadId}`,
    entityType: "crm_lead",
    entityId: leadId,
  });

  revalidatePath(backTo);
  redirect(withStatus(backTo, "success", "outreach-started"));
}

/**
 * Import the bundled Southeast MRO list (FAA Part 145 repair stations) as leads.
 *
 * Every row carries a real published contact email, so unlike the FAA registry
 * import these are emailable on arrival. Creates leads only — it enrols nobody
 * in outreach, so a bad run costs some CRM rows to delete and cannot send mail.
 */
export async function importMroLeads(formData: FormData) {
  const admin = await actor(["admin"], "crm.add");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/crm/prospecting");

  const result = await importSoutheastMroLeads({ actorId: admin.id, actorEmail: admin.email });

  await logAuditEvent({
    actor: admin,
    action: "mro_directory_import",
    detail: result.ok
      ? `MRO directory import created ${result.created} lead(s); ${result.skippedExisting} already present, ${result.skippedSuppressed} suppressed, ${result.failed} failed.`
      : `MRO directory import failed: ${result.error}`,
  });

  if (!result.ok) {
    redirect(withStatus(withStatus(backTo, "error", "mro"), "detail", (result.error ?? "").slice(0, 200)));
  }

  // Nothing created but rows were rejected is a failure wearing a success
  // notice. Report it as the error it is, with the database's own message,
  // rather than a cheerful "0 lead(s) added".
  if (result.created === 0 && result.failed > 0) {
    redirect(
      withStatus(
        withStatus(backTo, "error", "mro"),
        "detail",
        `${result.failed} row(s) rejected. ${result.firstError ?? ""}`.slice(0, 200),
      ),
    );
  }

  revalidatePath("/portal/admin/crm");
  redirect(
    withStatus(
      withStatus(backTo, "success", "mro"),
      "detail",
      `${result.created}|${result.skippedExisting}|${result.skippedSuppressed}`,
    ),
  );
}

/** Outreach states that mean a sequence is already running for this lead. */
const ACTIVE_OUTREACH_STATES = ["queued", "intro_sent", "followup_1_sent", "followup_2_sent"];

/**
 * Enrol many leads in the automated sequence in one action.
 *
 * The single-lead version assumes a human looking at one record, so putting a
 * few hundred leads through it means a few hundred clicks — which is not a
 * thing anyone finishes, so in practice the list never gets worked at all.
 *
 * Every refusal the single version makes is repeated here rather than skipped
 * for speed: no email, opted out, on the suppression list, already mid-sequence,
 * or sitting in a stage a person has taken over. A bulk path that relaxes the
 * guardrails is precisely how an outreach system ends up emailing somebody who
 * asked it not to, several hundred times, unattended.
 *
 * Enrolling is not sending. Each lead still passes the send-time gate — kill
 * switch, template approval, daily cap, send window, and a fresh suppression
 * check — before a single message leaves, so enrolling more leads than a day
 * can send is safe: the surplus wait in the window loop rather than flooding.
 */
export async function startBulkLeadOutreach(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/crm");

  const types = formData
    .getAll("business_types")
    .map((value) => String(value))
    .filter(isLeadBusinessType);
  if (!types.length) redirect(withStatus(backTo, "error", "types"));

  // Hard ceiling independent of the form: this starts a durable workflow per
  // lead, and an unbounded batch would be both a long-running request and a
  // very large number of runs created by one click.
  const requested = num(formData, "limit");
  const limit = Math.min(500, Math.max(1, Math.round(requested ?? 150)));

  const db = (await createServiceClient()) as any;
  const { data: candidates } = await db
    .from("crm_leads")
    .select("id, email, business_type, stage, do_not_contact, outreach_state")
    .in("business_type", types)
    .not("email", "is", null)
    .eq("do_not_contact", false)
    .order("created_at", { ascending: true })
    .limit(limit * 3); // over-fetch: many rows fall out on the checks below

  const skipped = { no_email: 0, opted_out: 0, already_running: 0, human_owned: 0, suppressed: 0 };
  const eligible: { id: string; email: string; businessType: string }[] = [];

  for (const lead of candidates ?? []) {
    if (eligible.length >= limit) break;
    if (!lead.email) { skipped.no_email += 1; continue; }
    if (lead.do_not_contact) { skipped.opted_out += 1; continue; }
    if (ACTIVE_OUTREACH_STATES.includes(lead.outreach_state ?? "")) { skipped.already_running += 1; continue; }
    if (["qualified", "proposal", "won", "lost"].includes(lead.stage)) { skipped.human_owned += 1; continue; }
    if (await isSuppressed(lead.email)) { skipped.suppressed += 1; continue; }
    eligible.push({
      id: lead.id,
      email: lead.email,
      businessType: isLeadBusinessType(lead.business_type) ? lead.business_type : "general",
    });
  }

  // Start in small concurrent chunks: one at a time is too slow for a few
  // hundred, all at once floods the workflow engine from a single request.
  let started = 0;
  let failed = 0;
  const CHUNK = 10;
  for (let i = 0; i < eligible.length; i += CHUNK) {
    const chunk = eligible.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map(async (lead) => {
        try {
          const run = await start(leadOutreach, [lead.id, lead.businessType]);
          await db
            .from("crm_leads")
            .update({
              outreach_state: "queued",
              outreach_started_at: new Date().toISOString(),
              outreach_run_id: (run as { runId?: string })?.runId ?? null,
            })
            .eq("id", lead.id);
          await db.from("crm_activities").insert({
            lead_id: lead.id,
            activity_type: "outreach_started",
            body: `Automated outreach sequence started (${lead.businessType}) via bulk enrolment.`,
            created_by: admin.id,
            created_by_email: admin.email,
          });
          started += 1;
        } catch {
          // One lead failing to enrol must not abort the batch; it stays
          // un-enrolled and can be picked up by the next run.
          failed += 1;
        }
      }),
    );
  }

  await logAuditEvent({
    actor: admin,
    action: "outreach_bulk_started",
    detail:
      `Bulk outreach enrolled ${started} lead(s) of type ${types.join("/")} ` +
      `(${failed} failed; skipped ${skipped.already_running} already running, ` +
      `${skipped.suppressed} suppressed, ${skipped.opted_out} opted out, ` +
      `${skipped.human_owned} human-owned).`,
  });

  revalidatePath("/portal/admin/crm");
  redirect(
    withStatus(
      withStatus(backTo, "success", "bulk-outreach"),
      "detail",
      `${started}|${failed}|${skipped.already_running + skipped.suppressed + skipped.opted_out + skipped.human_owned}`,
    ),
  );
}

/** Add an address to the suppression list by hand. */
export async function suppressLeadEmail(formData: FormData) {
  const admin = await actor(["admin"], "crm.edit");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/crm");
  const email = str(formData, "email").trim().toLowerCase();
  if (!email.includes("@")) redirect(withStatus(backTo, "error", "email"));

  await suppressEmail(email, "manual", `Added by ${admin.email}`);

  await logAuditEvent({
    actor: admin,
    action: "outreach_suppressed",
    detail: `${email} added to the outreach suppression list`,
  });

  revalidatePath(backTo);
  redirect(withStatus(backTo, "success", "suppressed"));
}

/**
 * Run one prospecting pass.
 *
 * Synchronous rather than a workflow: the run takes a minute or two, the admin
 * is watching, and a durable multi-day sleep buys nothing here. It creates
 * leads at stage "new" and enrols nobody in outreach, so a bad run costs a few
 * CRM rows to delete and cannot email anyone.
 */
export async function runProspectingPass(formData: FormData) {
  const admin = await actor(["admin"], "crm.add");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/crm/prospecting");

  const types = formData
    .getAll("business_types")
    .map((value) => String(value))
    .filter(isLeadBusinessType);
  if (!types.length) redirect(withStatus(backTo, "error", "types"));

  const settings = await getOutreachSettings();
  const requested = num(formData, "count");
  const count = Math.min(
    settings.prospectingBatchSize,
    Math.max(1, Math.round(requested ?? settings.prospectingBatchSize)),
  );
  const region = str(formData, "region") || `${SITE.serviceRegion} and the Southeast US`;

  const result = await runProspecting({
    businessTypes: types,
    region,
    count,
    actorId: admin.id,
    actorEmail: admin.email,
  });

  await logAuditEvent({
    actor: admin,
    action: "prospecting_run",
    detail: result.ok
      ? `Prospecting created ${result.created} lead(s); ${result.rejected.length} rejected.`
      : `Prospecting failed: ${result.error}`,
  });

  if (!result.ok) {
    redirect(withStatus(withStatus(backTo, "error", "run"), "detail", (result.error ?? "").slice(0, 200)));
  }

  revalidatePath("/portal/admin/crm");
  redirect(
    withStatus(
      withStatus(backTo, "success", "prospected"),
      "detail",
      `${result.created}|${result.rejected.length}`,
    ),
  );
}

/**
 * Import owners from the FAA Aircraft Registry.
 *
 * Streams a ~70 MB archive and scans ~193 MB of records, so it is slow by
 * nature. Kept synchronous with a long maxDuration on the hosting page rather
 * than made durable: the whole point is that an admin runs it, watches it, and
 * looks at what came back.
 */
export async function runFaaImport(formData: FormData) {
  const admin = await actor(["admin"], "crm.add");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/crm/prospecting");

  const states = str(formData, "states")
    .split(/[,\s]+/)
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^[A-Z]{2}$/.test(value));
  if (!states.length) redirect(withStatus(backTo, "error", "states"));

  const engineClasses = formData
    .getAll("engine_classes")
    .map((value) => String(value))
    .filter((value): value is "piston" | "turboprop" | "jet" =>
      value === "piston" || value === "turboprop" || value === "jet",
    );
  if (!engineClasses.length) redirect(withStatus(backTo, "error", "classes"));

  const requested = num(formData, "limit");
  const limit = Math.min(500, Math.max(1, Math.round(requested ?? 100)));

  const result = await importFaaProspects({
    filter: {
      states,
      engineClasses,
      corporateOnly: str(formData, "corporate_only") === "on",
      limit,
    },
    actorId: admin.id,
    actorEmail: admin.email,
  });

  await logAuditEvent({
    actor: admin,
    action: "faa_import",
    detail: result.ok
      ? `FAA import created ${result.created} lead(s) from ${result.matched} matched owners.`
      : `FAA import failed: ${result.error}`,
  });

  if (!result.ok) {
    redirect(withStatus(withStatus(backTo, "error", "faa"), "detail", (result.error ?? "").slice(0, 200)));
  }

  revalidatePath("/portal/admin/crm");
  redirect(
    withStatus(
      withStatus(backTo, "success", "faa"),
      "detail",
      `${result.created}|${result.matched}|${result.skipped}`,
    ),
  );
}
