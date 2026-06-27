import "server-only";

import { AMG_EMAIL_BRAND, absolutePortalUrl, replyToAddress } from "@/lib/email/config";
import { getEmailProvider, emailProviderStatus } from "@/lib/email/provider";
import { operationalEmailHtml, operationalEmailText } from "@/lib/email/templates";
import { generateCommunicationPublicId, isValidEmailAddress, subjectWithThreadToken } from "@/lib/email/threading";
import {
  CREW_EMAIL_TEMPLATE_KEYS,
  CREW_EMAIL_TEMPLATES,
  buildCrewEmailVariables,
  mergeCrewEmailText,
  type CrewEmailTemplateKey,
  type CrewEmailVariables,
} from "@/lib/portal/crew-email-templates";
import type { SessionUser } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/errors/user-facing-errors";

type Db = Awaited<ReturnType<typeof createServiceClient>> & {
  from: (table: string) => any;
};

export type CrewEmailTemplateOption = {
  id: string;
  key: CrewEmailTemplateKey;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
};

export type CrewCommunicationRow = {
  id: string;
  threadId: string;
  createdAt: string;
  sentAt: string | null;
  subject: string;
  body: string;
  status: string;
  templateKey: string | null;
  sentBy: string | null;
  recipientEmail: string;
  provider: string | null;
  providerMessageId: string | null;
  errorMessage: string | null;
};

export type CrewEmailContext = {
  variables: CrewEmailVariables;
  provider: ReturnType<typeof emailProviderStatus>;
};

export type CrewEmailSendInput = {
  crewId: string;
  recipientEmail: string;
  templateKey: string;
  subject: string;
  body: string;
  requestedDocuments?: string | null;
  missionId?: string | null;
};

export type CrewEmailSendResult =
  | { ok: true; threadId: string; messageId: string }
  | { ok: false; reason: "validation" | "configuration" | "provider" | "unknown"; threadId?: string; messageId?: string; referenceId?: string };

async function db() {
  return (await createServiceClient()) as Db;
}

function now() {
  return new Date().toISOString();
}

function fallbackTemplate(key: string | null | undefined): CrewEmailTemplateOption | null {
  const seed = CREW_EMAIL_TEMPLATES.find((template) => template.key === key);
  if (!seed) return null;
  return {
    id: seed.key,
    key: seed.key,
    name: seed.name,
    category: seed.category,
    subject: seed.subject,
    body: seed.body,
    variables: seed.variables,
  };
}

function normalizeTemplate(row: any): CrewEmailTemplateOption | null {
  const key = row.template_key;
  if (!CREW_EMAIL_TEMPLATE_KEYS.includes(key)) return null;
  return {
    id: row.id,
    key,
    name: row.name,
    category: row.category,
    subject: row.subject_template,
    body: row.body_template_text ?? "",
    variables: Array.isArray(row.variables) ? row.variables : [],
  };
}

export async function listCrewEmailTemplates(): Promise<CrewEmailTemplateOption[]> {
  const fallback = CREW_EMAIL_TEMPLATES.map((template) => fallbackTemplate(template.key)).filter(Boolean) as CrewEmailTemplateOption[];

  try {
    const client = await db();
    const { data, error } = await client
      .from("communication_templates")
      .select("id,template_key,name,category,subject_template,body_template_text,variables,active")
      .in("template_key", [...CREW_EMAIL_TEMPLATE_KEYS])
      .eq("active", true)
      .order("name");

    if (error) return fallback;
    const templates = (data ?? []).map(normalizeTemplate).filter(Boolean) as CrewEmailTemplateOption[];
    return templates.length ? templates : fallback;
  } catch {
    return fallback;
  }
}

async function getCrewEmailTemplate(key: string): Promise<CrewEmailTemplateOption | null> {
  const fallback = fallbackTemplate(key);

  try {
    const client = await db();
    const { data, error } = await client
      .from("communication_templates")
      .select("id,template_key,name,category,subject_template,body_template_text,variables,active")
      .eq("template_key", key)
      .eq("active", true)
      .maybeSingle();

    if (error || !data) return fallback;
    return normalizeTemplate(data) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function buildCrewEmailContext(crewId: string, options: {
  requestedDocuments?: string | null;
  missionId?: string | null;
} = {}): Promise<CrewEmailContext | null> {
  const client = await db();
  const { data: crew } = await client
    .from("profiles")
    .select("id,email,full_name,home_base,role")
    .eq("id", crewId)
    .eq("role", "crew")
    .maybeSingle();

  if (!crew?.email) return null;

  const [{ data: crewProfile }, { data: mission }] = await Promise.all([
    client.from("crew_profiles").select("source_email,display_name,location_display").eq("id", crewId).maybeSingle(),
    options.missionId
      ? client
          .from("missions")
          .select("id,ref,requested_departure,departure_airport,arrival_airport,tail_number,aircraft:aircraft_id(tail_number,make,model)")
          .eq("id", options.missionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const aircraft = Array.isArray(mission?.aircraft) ? mission.aircraft[0] : mission?.aircraft;
  const variables = buildCrewEmailVariables({
    crew: {
      fullName: crewProfile?.display_name ?? crew.full_name,
      email: crew.email,
      homeAirport: crew.home_base,
    },
    mission: mission
      ? {
          id: mission.ref ?? mission.id,
          date: mission.requested_departure,
          departureAirport: mission.departure_airport,
          arrivalAirport: mission.arrival_airport,
          aircraftType: [aircraft?.make, aircraft?.model].filter(Boolean).join(" ") || null,
          tailNumber: mission.tail_number ?? aircraft?.tail_number,
        }
      : null,
    requestedDocuments: options.requestedDocuments,
    portalLink: absolutePortalUrl("/portal/crew"),
    operationsEmail: AMG_EMAIL_BRAND.contactEmail,
  });

  return {
    variables,
    provider: emailProviderStatus(),
  };
}

export async function listCrewCommunications(crewId: string): Promise<CrewCommunicationRow[]> {
  const client = await db();
  const { data: crew } = await client
    .from("profiles")
    .select("id,email")
    .eq("id", crewId)
    .eq("role", "crew")
    .maybeSingle();

  if (!crew?.email) return [];

  const { data: participants } = await client
    .from("communication_participants")
    .select("thread_id")
    .eq("crew_id", crewId);

  const threadIds = Array.from(new Set((participants ?? []).map((row: any) => row.thread_id).filter(Boolean)));
  let messages: any[] = [];

  if (threadIds.length) {
    const { data } = await client
      .from("communication_messages")
      .select("*, thread:thread_id(id)")
      .in("thread_id", threadIds)
      .eq("direction", "outbound")
      .order("created_at", { ascending: false });
    messages = data ?? [];
  }

  if (!messages.length) {
    const { data } = await client
      .from("communication_messages")
      .select("*")
      .contains("to_emails", [crew.email.toLowerCase()])
      .eq("direction", "outbound")
      .order("created_at", { ascending: false });
    messages = data ?? [];
  }

  const senderIds = Array.from(new Set(messages.map((message) => message.sent_by_user_id).filter(Boolean)));
  const { data: senders } = senderIds.length
    ? await client.from("profiles").select("id,email,full_name").in("id", senderIds)
    : { data: [] };
  const senderById = new Map((senders ?? []).map((sender: any) => [sender.id, sender.full_name ?? sender.email]));

  return messages.map((message) => ({
    id: message.id,
    threadId: message.thread_id,
    createdAt: message.created_at,
    sentAt: message.sent_at,
    subject: message.subject ?? "AMG Crew Communication",
    body: message.body_text ?? "",
    status: message.status,
    templateKey: typeof message.raw_payload?.template_key === "string" ? message.raw_payload.template_key : null,
    sentBy: message.sent_by_user_id ? senderById.get(message.sent_by_user_id) ?? null : null,
    recipientEmail: (message.to_emails ?? []).join(", "),
    provider: message.provider,
    providerMessageId: message.provider_message_id,
    errorMessage: message.failure_reason,
  }));
}

export async function sendCrewEmail(input: CrewEmailSendInput, user: SessionUser): Promise<CrewEmailSendResult> {
  const client = await db();
  const provider = getEmailProvider();
  const template = await getCrewEmailTemplate(input.templateKey);
  const recipientEmail = input.recipientEmail.trim().toLowerCase();

  if (!input.crewId || !template || !recipientEmail || !isValidEmailAddress(recipientEmail)) {
    return { ok: false, reason: "validation" };
  }

  const context = await buildCrewEmailContext(input.crewId, {
    requestedDocuments: input.requestedDocuments,
    missionId: input.missionId,
  });

  if (!context) return { ok: false, reason: "validation" };

  const subject = mergeCrewEmailText(input.subject.trim() || template.subject, context.variables);
  const body = mergeCrewEmailText(input.body.trim() || template.body, context.variables);

  if (!subject || !body) return { ok: false, reason: "validation" };

  let threadId: string | undefined;
  let messageId: string | undefined;

  try {
    const threadPublicId = generateCommunicationPublicId("THR");
    const { data: thread, error: threadError } = await client
      .from("communication_threads")
      .insert({
        public_id: threadPublicId,
        subject,
        status: "new",
        priority: "normal",
        channel: "email",
        created_by_user_id: user.id,
        related_request_id: input.missionId || null,
        last_message_at: now(),
      })
      .select("id,public_id")
      .single();

    if (threadError || !thread) throw threadError ?? new Error("Unable to create crew communication thread");
    threadId = thread.id;

    await client.from("communication_participants").insert({
      thread_id: thread.id,
      participant_type: "crew",
      user_id: input.crewId,
      crew_id: input.crewId,
      email: recipientEmail,
      name: context.variables.crew_full_name,
      role_label: "Crew",
      is_primary: true,
    });

    const subjectWithToken = subjectWithThreadToken(subject, thread.public_id);
    const text = operationalEmailText(body);
    const html = operationalEmailHtml(body);
    const providerConfigured = provider.configured();

    const { data: message, error: messageError } = await client
      .from("communication_messages")
      .insert({
        thread_id: thread.id,
        public_id: generateCommunicationPublicId("MSG"),
        message_type: "email",
        direction: "outbound",
        visibility: "internal",
        status: providerConfigured ? "queued" : "failed",
        provider: provider.name,
        from_name: "AMG Operations",
        to_emails: [recipientEmail],
        subject: subjectWithToken,
        body_text: text,
        body_html: html,
        sent_by_user_id: user.id,
        created_by_user_id: user.id,
        failed_at: providerConfigured ? null : now(),
        failure_reason: providerConfigured ? null : "Email provider is not configured",
        raw_payload: {
          template_key: template.key,
          variables: context.variables,
          recipient_type: "crew",
          recipient_id: input.crewId,
        },
      })
      .select("id")
      .single();

    if (messageError || !message) throw messageError ?? new Error("Unable to create crew communication message");
    messageId = message.id;

    if (!providerConfigured) {
      await client.from("communication_threads").update({ status: "action_required", updated_at: now() }).eq("id", thread.id);
      await client.from("communication_audit_log").insert({
        thread_id: thread.id,
        message_id: message.id,
        actor_user_id: user.id,
        event_type: "send_failed",
        metadata: { reason: "configuration_missing", template_key: template.key, recipient_type: "crew", recipient_id: input.crewId },
      });
      return { ok: false, reason: "configuration", threadId: thread.id, messageId: message.id };
    }

    const result = await provider.sendEmail({
      to: [recipientEmail],
      subject: subjectWithToken,
      text,
      html,
      replyTo: process.env.EMAIL_INBOUND_DOMAIN
        ? `thread+${thread.public_id}@${process.env.EMAIL_INBOUND_DOMAIN}`
        : replyToAddress(),
      headers: {
        "X-AMG-Thread-ID": thread.public_id,
        "X-AMG-Recipient-Type": "crew",
      },
    });

    if (!result.ok) {
      await client.from("communication_messages").update({
        status: "failed",
        failed_at: now(),
        failure_reason: result.error,
      }).eq("id", message.id);
      await client.from("communication_threads").update({ status: "action_required", updated_at: now(), last_message_at: now() }).eq("id", thread.id);
      await client.from("communication_audit_log").insert({
        thread_id: thread.id,
        message_id: message.id,
        actor_user_id: user.id,
        event_type: "send_failed",
        metadata: { provider: result.provider, template_key: template.key, recipient_type: "crew", recipient_id: input.crewId },
      });
      return { ok: false, reason: "provider", threadId: thread.id, messageId: message.id };
    }

    await client.from("communication_messages").update({
      status: result.status === "sent" ? "sent" : "queued",
      provider: result.provider,
      provider_message_id: result.providerMessageId,
      sent_at: now(),
    }).eq("id", message.id);
    await client.from("communication_threads").update({ status: "waiting_on_crew", updated_at: now(), last_message_at: now() }).eq("id", thread.id);
    await client.from("communication_audit_log").insert({
      thread_id: thread.id,
      message_id: message.id,
      actor_user_id: user.id,
      event_type: "message_sent",
      metadata: { provider: result.provider, template_key: template.key, recipient_type: "crew", recipient_id: input.crewId },
    });

    return { ok: true, threadId: thread.id, messageId: message.id };
  } catch (error) {
    const referenceId = logServerError("Crew email send failed", error, {
      userId: user.id,
      crewId: input.crewId,
      threadId,
      messageId,
    });
    if (threadId) await client.from("communication_threads").update({ status: "action_required", updated_at: now() }).eq("id", threadId);
    if (messageId) await client.from("communication_messages").update({ status: "failed", failed_at: now(), failure_reason: "Server-side send failure" }).eq("id", messageId);
    return { ok: false, reason: "unknown", threadId, messageId, referenceId };
  }
}

export { emailProviderStatus };
