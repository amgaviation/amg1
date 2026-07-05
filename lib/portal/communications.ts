import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/portal/session";
import { replyToAddress } from "@/lib/email/config";
import { getEmailProvider, emailProviderStatus } from "@/lib/email/provider";
import { COMMUNICATION_ATTACHMENT_BUCKET, communicationAttachmentPath, validateAttachment } from "@/lib/email/attachments";
import { normalizeEmailList, isValidEmailAddress, generateCommunicationPublicId, subjectWithThreadToken, extractThreadPublicId } from "@/lib/email/threading";
import { operationalEmailHtml, operationalEmailText, stripHtml, interpolateTemplate } from "@/lib/email/templates";
import type { NormalizedInboundMessage, SendEmailInput } from "@/lib/email/types";
import { logServerError } from "@/lib/errors/user-facing-errors";

type Db = Awaited<ReturnType<typeof createServiceClient>> & {
  from: (table: string) => any;
  storage: any;
};

export type CommunicationThread = {
  id: string;
  public_id: string;
  subject: string | null;
  status: string;
  priority: string;
  channel: string;
  assigned_to_user_id: string | null;
  created_by_user_id: string | null;
  related_client_id: string | null;
  related_aircraft_id: string | null;
  related_request_id: string | null;
  related_quote_id: string | null;
  related_invoice_id: string | null;
  related_crew_assignment_id: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type CommunicationMessage = {
  id: string;
  thread_id: string;
  public_id: string;
  message_type: string;
  direction: string;
  visibility: string;
  status: string;
  provider: string | null;
  provider_message_id: string | null;
  in_reply_to: string | null;
  references_header: string | null;
  from_email: string | null;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  reply_to_email: string | null;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  email_category?: string | null;
  template_id?: string | null;
  template_name?: string | null;
  body_preview?: string | null;
  sent_by_user_id: string | null;
  created_by_user_id: string | null;
  received_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

export type CommunicationAttachment = {
  id: string;
  message_id: string;
  thread_id: string;
  file_name: string;
  content_type: string | null;
  file_size_bytes: number | null;
  storage_bucket: string;
  storage_path: string;
  source: string;
  created_at: string;
};

export type CommunicationTemplate = {
  id: string;
  name: string;
  category: string;
  subject_template: string;
  body_template_text: string | null;
  body_template_html: string | null;
  active: boolean;
};

export type ThreadSummary = CommunicationThread & {
  last_message_preview: string | null;
  sender_label: string | null;
  has_attachments: boolean;
  failed_count: number;
  assigned_admin_name: string | null;
  related_label: string | null;
};

export type CommunicationThreadDetail = {
  thread: CommunicationThread;
  messages: CommunicationMessage[];
  attachments: CommunicationAttachment[];
};

export type CommunicationRecordOptions = {
  admins: { id: string; label: string }[];
  clients: { id: string; label: string }[];
  aircraft: { id: string; label: string }[];
  requests: { id: string; label: string }[];
  quotes: { id: string; label: string }[];
  invoices: { id: string; label: string }[];
};

export type CommunicationActionResult =
  | { ok: true; threadId: string; messageId?: string }
  | { ok: false; threadId?: string; messageId?: string; reason: "validation" | "configuration" | "provider" | "storage" | "unknown"; referenceId?: string };

const THREAD_SELECT = "*";
const EMAIL_SOURCE_LABEL = "AMG Operations";

export { emailProviderStatus };

async function db() {
  return (await createServiceClient()) as Db;
}

function now() {
  return new Date().toISOString();
}

function compact<T>(items: (T | null | undefined | false)[]) {
  return items.filter(Boolean) as T[];
}

function bodyPreview(message: CommunicationMessage | null) {
  if (!message) return null;
  return (message.body_text || (message.body_html ? stripHtml(message.body_html) : "")).slice(0, 180);
}

function relatedLabel(thread: CommunicationThread) {
  if (thread.related_request_id) return "Support Request";
  if (thread.related_quote_id) return "Quote";
  if (thread.related_invoice_id) return "Invoice";
  if (thread.related_aircraft_id) return "Aircraft";
  if (thread.related_crew_assignment_id) return "Crew Assignment";
  if (thread.related_client_id) return "Client";
  return "General";
}

async function addAudit(input: {
  db: Db;
  threadId?: string | null;
  messageId?: string | null;
  actorUserId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await input.db.from("communication_audit_log").insert({
    thread_id: input.threadId ?? null,
    message_id: input.messageId ?? null,
    actor_user_id: input.actorUserId ?? null,
    event_type: input.eventType,
    metadata: input.metadata ?? {},
  });
}

export async function listCommunicationTemplates(): Promise<CommunicationTemplate[]> {
  const client = await db();
  const { data } = await client
    .from("communication_templates")
    .select("id,name,category,subject_template,body_template_text,body_template_html,active")
    .eq("active", true)
    .order("category")
    .order("name");
  return data ?? [];
}

export async function getCommunicationTemplate(id: string | null) {
  if (!id) return null;
  const client = await db();
  const { data } = await client
    .from("communication_templates")
    .select("id,name,category,subject_template,body_template_text,body_template_html,active")
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();
  return (data as CommunicationTemplate | null) ?? null;
}

export async function listCommunicationRecordOptions(): Promise<CommunicationRecordOptions> {
  const client = await db();
  const [admins, clients, aircraft, requests, quotes, invoices] = await Promise.all([
    client.from("profiles").select("id,email,full_name,company_name").eq("role", "admin").eq("status", "approved").order("full_name"),
    client.from("profiles").select("id,email,full_name,company_name").eq("role", "client").order("company_name"),
    client.from("aircraft").select("id,tail_number,make,model").order("tail_number"),
    client.from("missions").select("id,ref,tail_number,mission_type,status").order("created_at", { ascending: false }).limit(100),
    client.from("quotes").select("id,ref,quote_number,status").order("created_at", { ascending: false }).limit(100),
    client.from("invoices").select("id,invoice_number,status").order("created_at", { ascending: false }).limit(100),
  ]);

  return {
    admins: (admins.data ?? []).map((row: any) => ({ id: row.id, label: row.full_name ?? row.email })),
    clients: (clients.data ?? []).map((row: any) => ({
      id: row.id,
      label: row.company_name ?? row.full_name ?? row.email,
    })),
    aircraft: (aircraft.data ?? []).map((row: any) => ({
      id: row.id,
      label: [row.tail_number, row.make, row.model].filter(Boolean).join(" - "),
    })),
    requests: (requests.data ?? []).map((row: any) => ({
      id: row.id,
      label: [row.ref, row.tail_number, row.mission_type, row.status].filter(Boolean).join(" - "),
    })),
    quotes: (quotes.data ?? []).map((row: any) => ({
      id: row.id,
      label: [row.quote_number ?? row.ref, row.status].filter(Boolean).join(" - "),
    })),
    invoices: (invoices.data ?? []).map((row: any) => ({
      id: row.id,
      label: [row.invoice_number, row.status].filter(Boolean).join(" - "),
    })),
  };
}

export async function listCommunicationThreads(input: {
  view?: string | null;
  q?: string | null;
  status?: string | null;
  priority?: string | null;
} = {}): Promise<ThreadSummary[]> {
  const client = await db();
  let query = client
    .from("communication_threads")
    .select(THREAD_SELECT)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (input.view === "unassigned") query = query.is("assigned_to_user_id", null).neq("is_archived", true);
  if (input.view === "archived") query = query.eq("is_archived", true);
  if (input.view === "failed") query = query.eq("status", "action_required");
  if (input.status) query = query.eq("status", input.status);
  if (input.priority) query = query.eq("priority", input.priority);
  if (!input.view || input.view !== "archived") query = query.eq("is_archived", false);

  const { data: threads } = await query;
  const rows = (threads ?? []) as CommunicationThread[];
  if (!rows.length) return [];

  const threadIds = rows.map((thread) => thread.id);
  const [{ data: messages }, { data: attachments }, { data: admins }] = await Promise.all([
    client
      .from("communication_messages")
      .select("id,thread_id,body_text,body_html,from_email,from_name,status,created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
    client.from("communication_attachments").select("thread_id").in("thread_id", threadIds),
    client.from("profiles").select("id,full_name,email").in("id", compact(rows.map((thread) => thread.assigned_to_user_id))),
  ]);

  const lastByThread = new Map<string, CommunicationMessage>();
  const failedByThread = new Map<string, number>();
  for (const message of (messages ?? []) as CommunicationMessage[]) {
    if (!lastByThread.has(message.thread_id)) lastByThread.set(message.thread_id, message);
    if (message.status === "failed" || message.status === "bounced") {
      failedByThread.set(message.thread_id, (failedByThread.get(message.thread_id) ?? 0) + 1);
    }
  }

  const attachmentThreads = new Set((attachments ?? []).map((row: any) => row.thread_id));
  const adminById = new Map((admins ?? []).map((row: any) => [row.id, row.full_name ?? row.email]));
  const q = input.q?.trim().toLowerCase();

  return rows
    .map((thread) => {
      const last = lastByThread.get(thread.id) ?? null;
      return {
        ...thread,
        last_message_preview: bodyPreview(last),
        sender_label: last?.from_name ?? last?.from_email ?? EMAIL_SOURCE_LABEL,
        has_attachments: attachmentThreads.has(thread.id),
        failed_count: failedByThread.get(thread.id) ?? 0,
        assigned_admin_name: thread.assigned_to_user_id ? adminById.get(thread.assigned_to_user_id) ?? null : null,
        related_label: relatedLabel(thread),
      };
    })
    .filter((thread) => {
      if (!q) return true;
      return [
        thread.subject,
        thread.public_id,
        thread.sender_label,
        thread.last_message_preview,
        thread.related_label,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
}

export async function getCommunicationThreadDetail(threadId: string): Promise<CommunicationThreadDetail | null> {
  const client = await db();
  const { data: thread } = await client
    .from("communication_threads")
    .select(THREAD_SELECT)
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) return null;

  const [{ data: messages }, { data: attachments }] = await Promise.all([
    client.from("communication_messages").select("*").eq("thread_id", threadId).order("created_at"),
    client.from("communication_attachments").select("*").eq("thread_id", threadId).order("created_at"),
  ]);

  return {
    thread,
    messages: messages ?? [],
    attachments: attachments ?? [],
  };
}

export type EmailCommunicationLogRow = CommunicationMessage & {
  sender_name: string | null;
  recipient_name: string | null;
  recipient_user_id: string | null;
};

export async function listEmailCommunicationLogs(input: {
  q?: string | null;
  user?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  time?: string | null;
  category?: string | null;
  template?: string | null;
  status?: string | null;
  sender?: string | null;
} = {}): Promise<EmailCommunicationLogRow[]> {
  const client = await db();
  let query = client
    .from("communication_messages")
    .select("*")
    .eq("message_type", "email")
    .order("created_at", { ascending: false })
    .limit(150);

  if (input.status) query = query.eq("status", input.status);
  if (input.category) query = query.eq("email_category", input.category);
  if (input.template) query = query.eq("template_id", input.template);
  if (input.sender) query = query.eq("sent_by_user_id", input.sender);
  if (input.dateFrom) query = query.gte("created_at", `${input.dateFrom}T00:00:00.000Z`);
  if (input.dateTo) query = query.lte("created_at", `${input.dateTo}T23:59:59.999Z`);

  const { data } = await query;
  let userEmailFilter = input.user?.trim().toLowerCase() ?? "";
  if (userEmailFilter && /^[0-9a-f-]{32,}$/i.test(userEmailFilter)) {
    const { data: profile } = await client
      .from("profiles")
      .select("email")
      .eq("id", userEmailFilter)
      .maybeSingle();
    userEmailFilter = profile?.email?.toLowerCase() ?? userEmailFilter;
  }

  const rows = ((data ?? []) as CommunicationMessage[]).filter((message) => {
    const q = input.q?.trim().toLowerCase();
    const time = input.time?.trim();
    const created = new Date(message.created_at);
    const timeText = Number.isNaN(created.getTime()) ? "" : created.toISOString().slice(11, 16);

    if (time && !timeText.startsWith(time)) return false;
    if (userEmailFilter && !message.to_emails.some((email) => email.toLowerCase().includes(userEmailFilter))) return false;
    if (!q) return true;

    return [
      message.subject,
      message.email_category,
      message.template_name,
      message.status,
      message.provider,
      message.provider_message_id,
      message.body_preview,
      message.to_emails.join(" "),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  const senderIds = compact(rows.map((message) => message.sent_by_user_id));
  const recipientEmails = Array.from(new Set(rows.flatMap((message) => message.to_emails).map((email) => email.toLowerCase())));

  const [{ data: senders }, { data: recipients }] = await Promise.all([
    senderIds.length
      ? client.from("profiles").select("id,email,full_name").in("id", senderIds)
      : { data: [] },
    recipientEmails.length
      ? client.from("profiles").select("id,email,full_name").in("email", recipientEmails)
      : { data: [] },
  ]);

  const senderById = new Map((senders ?? []).map((row: any) => [row.id, row.full_name ?? row.email]));
  const recipientByEmail = new Map((recipients ?? []).map((row: any) => [String(row.email).toLowerCase(), row]));

  return rows.map((message) => {
    const firstRecipient = recipientByEmail.get(message.to_emails[0]?.toLowerCase());
    return {
      ...message,
      sender_name: message.sent_by_user_id ? senderById.get(message.sent_by_user_id) ?? null : null,
      recipient_name: firstRecipient?.full_name ?? firstRecipient?.email ?? null,
      recipient_user_id: firstRecipient?.id ?? null,
    };
  });
}

async function getOrCreateThread(client: Db, input: {
  threadId?: string | null;
  subject: string;
  userId?: string | null;
  relatedClientId?: string | null;
  relatedAircraftId?: string | null;
  relatedRequestId?: string | null;
  relatedQuoteId?: string | null;
  relatedInvoiceId?: string | null;
  relatedCrewAssignmentId?: string | null;
}) {
  if (input.threadId) {
    const { data } = await client.from("communication_threads").select("*").eq("id", input.threadId).maybeSingle();
    if (data) return data as CommunicationThread;
  }

  const { data, error } = await client
    .from("communication_threads")
    .insert({
      public_id: generateCommunicationPublicId("THR"),
      subject: input.subject,
      status: "new",
      priority: "normal",
      channel: "email",
      created_by_user_id: input.userId ?? null,
      related_client_id: input.relatedClientId ?? null,
      related_aircraft_id: input.relatedAircraftId ?? null,
      related_request_id: input.relatedRequestId ?? null,
      related_quote_id: input.relatedQuoteId ?? null,
      related_invoice_id: input.relatedInvoiceId ?? null,
      related_crew_assignment_id: input.relatedCrewAssignmentId ?? null,
      last_message_at: now(),
    })
    .select("*")
    .single();

  if (error || !data) throw error ?? new Error("Unable to create communication thread");
  await addAudit({ db: client, threadId: data.id, actorUserId: input.userId ?? null, eventType: "thread_created" });
  return data as CommunicationThread;
}

async function uploadMessageAttachments(input: {
  client: Db;
  thread: CommunicationThread;
  message: CommunicationMessage;
  files: File[];
  source: "outbound_email" | "portal_upload" | "inbound_email";
  userId?: string | null;
}) {
  const providerAttachments: { filename: string; content: string; contentType?: string | null }[] = [];

  for (const file of input.files) {
    if (!file || file.size === 0) continue;
    const valid = validateAttachment(file);
    if (!valid.ok) throw new Error(`Invalid attachment: ${valid.reason}`);

    const bytes = Buffer.from(await file.arrayBuffer());
    const path = communicationAttachmentPath({
      threadPublicId: input.thread.public_id,
      messagePublicId: input.message.public_id,
      fileName: file.name,
    });

    const { error } = await input.client.storage
      .from(COMMUNICATION_ATTACHMENT_BUCKET)
      .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw error;

    await input.client.from("communication_attachments").insert({
      message_id: input.message.id,
      thread_id: input.thread.id,
      file_name: file.name,
      content_type: file.type || null,
      file_size_bytes: file.size,
      storage_bucket: COMMUNICATION_ATTACHMENT_BUCKET,
      storage_path: path,
      source: input.source,
      uploaded_by_user_id: input.userId ?? null,
    });

    providerAttachments.push({
      filename: file.name,
      content: bytes.toString("base64"),
      contentType: file.type || null,
    });
  }

  return providerAttachments;
}

export async function sendCommunicationEmail(formData: FormData, user: SessionUser): Promise<CommunicationActionResult> {
  const client = await db();
  const provider = getEmailProvider();
  const to = Array.from(new Set(normalizeEmailList(formData.getAll("to").map((value) => String(value)).join(","))));
  const cc = normalizeEmailList(String(formData.get("cc") ?? ""));
  const bcc = normalizeEmailList(String(formData.get("bcc") ?? ""));
  const threadId = String(formData.get("thread_id") ?? "").trim() || null;
  const subjectInput = String(formData.get("subject") ?? "").trim();
  const bodyInput = String(formData.get("body") ?? "").trim();
  const template = await getCommunicationTemplate(String(formData.get("template_id") ?? "").trim() || null);
  const category = String(formData.get("category") ?? "General").trim() || "General";
  const subject = subjectInput || template?.subject_template || "";
  const body = bodyInput || template?.body_template_text || "";
  const explicitGeneral = String(formData.get("general_thread") ?? "") === "on";
  const relatedClientId = String(formData.get("related_client_id") ?? "").trim() || null;
  const relatedAircraftId = String(formData.get("related_aircraft_id") ?? "").trim() || null;
  const relatedRequestId = String(formData.get("related_request_id") ?? "").trim() || null;
  const relatedQuoteId = String(formData.get("related_quote_id") ?? "").trim() || null;
  const relatedInvoiceId = String(formData.get("related_invoice_id") ?? "").trim() || null;
  const relatedCrewAssignmentId = String(formData.get("related_crew_assignment_id") ?? "").trim() || null;
  const relatedPresent = Boolean(relatedClientId || relatedAircraftId || relatedRequestId || relatedQuoteId || relatedInvoiceId || relatedCrewAssignmentId);

  if (!to.length || !subject || !body || to.some((email) => !isValidEmailAddress(email)) || cc.some((email) => !isValidEmailAddress(email)) || bcc.some((email) => !isValidEmailAddress(email))) {
    return { ok: false, reason: "validation" };
  }
  if (!threadId && !relatedPresent && !explicitGeneral) return { ok: false, reason: "validation" };

  let thread: CommunicationThread | null = null;
  let message: CommunicationMessage | null = null;
  try {
    thread = await getOrCreateThread(client, {
      threadId,
      subject,
      userId: user.id,
      relatedClientId,
      relatedAircraftId,
      relatedRequestId,
      relatedQuoteId,
      relatedInvoiceId,
      relatedCrewAssignmentId,
    });

    const messagePublicId = generateCommunicationPublicId("MSG");
    const subjectWithToken = subjectWithThreadToken(interpolateTemplate(subject, { threadPublicId: thread.public_id }), thread.public_id);
    const text = operationalEmailText(interpolateTemplate(body, { threadPublicId: thread.public_id }));
    const html = operationalEmailHtml(interpolateTemplate(body, { threadPublicId: thread.public_id }), { title: interpolateTemplate(subject, { threadPublicId: thread.public_id }), eyebrow: "AMG Communications" });

    const { data, error } = await client
      .from("communication_messages")
      .insert({
        thread_id: thread.id,
        public_id: messagePublicId,
        message_type: "email",
        direction: "outbound",
        visibility: "internal",
        status: provider.configured() ? "queued" : "failed",
        provider: provider.name,
        from_name: EMAIL_SOURCE_LABEL,
        to_emails: to,
        cc_emails: cc,
        bcc_emails: bcc,
        subject: subjectWithToken,
        body_text: text,
        body_html: html,
        email_category: category,
        template_id: template?.id ?? null,
        template_name: template?.name ?? (template ? null : "Custom Email"),
        body_preview: stripHtml(body).slice(0, 240),
        sent_by_user_id: user.id,
        created_by_user_id: user.id,
        failed_at: provider.configured() ? null : now(),
        failure_reason: provider.configured() ? null : "Email provider is not configured",
      })
      .select("*")
      .single();
    if (error || !data) throw error ?? new Error("Unable to create communication message");
    message = data as CommunicationMessage;

    const files = formData.getAll("attachments").filter((file): file is File => file instanceof File && file.size > 0);
    const providerAttachments = await uploadMessageAttachments({
      client,
      thread,
      message,
      files,
      source: "outbound_email",
      userId: user.id,
    });

    if (!provider.configured()) {
      await client.from("communication_threads").update({ status: "action_required", updated_at: now(), last_message_at: now() }).eq("id", thread.id);
      await addAudit({ db: client, threadId: thread.id, messageId: message.id, actorUserId: user.id, eventType: "send_failed", metadata: { reason: "configuration_missing" } });
      return { ok: false, threadId: thread.id, messageId: message.id, reason: "configuration" };
    }

    const sendInput: SendEmailInput = {
      to,
      cc,
      bcc,
      subject: subjectWithToken,
      text,
      html,
      replyTo: process.env.EMAIL_INBOUND_DOMAIN
        ? `thread+${thread.public_id}@${process.env.EMAIL_INBOUND_DOMAIN}`
        : replyToAddress(),
      headers: {
        "X-AMG-Thread-ID": thread.public_id,
      },
      attachments: providerAttachments,
    };

    const result = await provider.sendEmail(sendInput);

    if (!result.ok) {
      await client.from("communication_messages").update({
        status: "failed",
        failed_at: now(),
        failure_reason: result.error,
      }).eq("id", message.id);
      await client.from("communication_threads").update({ status: "action_required", updated_at: now(), last_message_at: now() }).eq("id", thread.id);
      await addAudit({ db: client, threadId: thread.id, messageId: message.id, actorUserId: user.id, eventType: "send_failed", metadata: { provider: result.provider } });
      return { ok: false, threadId: thread.id, messageId: message.id, reason: "provider" };
    }

    await client.from("communication_messages").update({
      status: result.status === "sent" ? "sent" : "queued",
      provider: result.provider,
      provider_message_id: result.providerMessageId,
      sent_at: now(),
    }).eq("id", message.id);
    await client.from("communication_threads").update({ status: "waiting_on_client", updated_at: now(), last_message_at: now() }).eq("id", thread.id);
    await addAudit({ db: client, threadId: thread.id, messageId: message.id, actorUserId: user.id, eventType: "message_sent", metadata: { provider: result.provider, template_id: template?.id ?? null } });

    return { ok: true, threadId: thread.id, messageId: message.id };
  } catch (error) {
    const referenceId = logServerError("Communication email send failed", error, {
      userId: user.id,
      threadId: thread?.id,
      messageId: message?.id,
    });
    if (thread?.id) await client.from("communication_threads").update({ status: "action_required", updated_at: now() }).eq("id", thread.id);
    if (message?.id) await client.from("communication_messages").update({ status: "failed", failed_at: now(), failure_reason: "Server-side send failure" }).eq("id", message.id);
    return { ok: false, threadId: thread?.id, messageId: message?.id, reason: "unknown", referenceId };
  }
}

export async function addCommunicationInternalNote(formData: FormData, user: SessionUser): Promise<CommunicationActionResult> {
  const client = await db();
  const threadId = String(formData.get("thread_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!threadId || !body) return { ok: false, reason: "validation" };

  try {
    const { data, error } = await client
      .from("communication_messages")
      .insert({
        thread_id: threadId,
        public_id: generateCommunicationPublicId("NOTE"),
        message_type: "internal_note",
        direction: "internal",
        visibility: "admin_only",
        status: "received",
        from_email: user.email,
        from_name: user.name,
        body_text: body,
        created_by_user_id: user.id,
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("Unable to add internal note");
    await client.from("communication_threads").update({ updated_at: now(), last_message_at: now() }).eq("id", threadId);
    await addAudit({ db: client, threadId, messageId: data.id, actorUserId: user.id, eventType: "internal_note_added" });
    return { ok: true, threadId, messageId: data.id };
  } catch (error) {
    const referenceId = logServerError("Communication internal note failed", error, { userId: user.id, threadId });
    return { ok: false, threadId, reason: "unknown", referenceId };
  }
}

export async function updateCommunicationThread(formData: FormData, user: SessionUser): Promise<CommunicationActionResult> {
  const client = await db();
  const threadId = String(formData.get("thread_id") ?? "").trim();
  if (!threadId) return { ok: false, reason: "validation" };

  const patch = {
    status: String(formData.get("status") ?? "").trim() || "needs_review",
    priority: String(formData.get("priority") ?? "").trim() || "normal",
    assigned_to_user_id: String(formData.get("assigned_to_user_id") ?? "").trim() || null,
    updated_at: now(),
    closed_at: ["resolved", "closed", "archived"].includes(String(formData.get("status") ?? "")) ? now() : null,
    is_archived: String(formData.get("status") ?? "") === "archived",
  };

  const { error } = await client.from("communication_threads").update(patch).eq("id", threadId);
  if (error) {
    const referenceId = logServerError("Communication thread update failed", error, { userId: user.id, threadId });
    return { ok: false, threadId, reason: "unknown", referenceId };
  }
  await addAudit({ db: client, threadId, actorUserId: user.id, eventType: "status_changed", metadata: patch });
  return { ok: true, threadId };
}

export async function linkCommunicationThread(formData: FormData, user: SessionUser): Promise<CommunicationActionResult> {
  const client = await db();
  const threadId = String(formData.get("thread_id") ?? "").trim();
  if (!threadId) return { ok: false, reason: "validation" };

  const patch = {
    related_client_id: String(formData.get("related_client_id") ?? "").trim() || null,
    related_aircraft_id: String(formData.get("related_aircraft_id") ?? "").trim() || null,
    related_request_id: String(formData.get("related_request_id") ?? "").trim() || null,
    related_quote_id: String(formData.get("related_quote_id") ?? "").trim() || null,
    related_invoice_id: String(formData.get("related_invoice_id") ?? "").trim() || null,
    related_crew_assignment_id: String(formData.get("related_crew_assignment_id") ?? "").trim() || null,
    updated_at: now(),
  };

  const { error } = await client.from("communication_threads").update(patch).eq("id", threadId);
  if (error) {
    const referenceId = logServerError("Communication thread link failed", error, { userId: user.id, threadId });
    return { ok: false, threadId, reason: "unknown", referenceId };
  }
  await addAudit({ db: client, threadId, actorUserId: user.id, eventType: "record_linked", metadata: patch });
  return { ok: true, threadId };
}

async function findThreadForInbound(client: Db, inbound: NormalizedInboundMessage): Promise<CommunicationThread | null> {
  const token = extractThreadPublicId(inbound.subject) || extractThreadPublicId(inbound.references) || extractThreadPublicId(inbound.inReplyTo);
  if (token) {
    const { data } = await client.from("communication_threads").select("*").eq("public_id", token).maybeSingle();
    if (data) return data as CommunicationThread;
  }

  const providerIds = compact([inbound.inReplyTo, inbound.providerMessageId]);
  if (providerIds.length) {
    const { data } = await client
      .from("communication_messages")
      .select("thread_id")
      .in("provider_message_id", providerIds)
      .limit(1)
      .maybeSingle();
    if (data?.thread_id) {
      const { data: thread } = await client
        .from("communication_threads")
        .select("*")
        .eq("id", data.thread_id)
        .maybeSingle();
      if (thread) return thread as CommunicationThread;
    }
  }

  if (inbound.fromEmail) {
    const { data: profile } = await client
      .from("profiles")
      .select("id,role")
      .ilike("email", inbound.fromEmail)
      .maybeSingle();
    if (profile?.role === "client") {
      const { data } = await client
        .from("communication_threads")
        .select("*")
        .eq("related_client_id", profile.id)
        .eq("is_archived", false)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) return data as CommunicationThread;
    }
  }

  return null;
}

export async function storeInboundCommunication(inbound: NormalizedInboundMessage) {
  const client = await db();
  const { data: existing } = await client
    .from("communication_messages")
    .select("id,thread_id")
    .eq("inbound_webhook_event_id", inbound.eventId)
    .maybeSingle();
  if (existing) return { ok: true as const, threadId: existing.thread_id, messageId: existing.id, duplicate: true };

  let thread = await findThreadForInbound(client, inbound);
  if (!thread) {
    thread = await getOrCreateThread(client, {
      subject: inbound.subject || "(No subject)",
      relatedClientId: null,
    });
    await client.from("communication_threads").update({ status: "needs_review" }).eq("id", thread.id);
  }

  const bodyText = inbound.bodyText || (inbound.bodyHtml ? stripHtml(inbound.bodyHtml) : "");
  const { data: message, error } = await client
    .from("communication_messages")
    .insert({
      thread_id: thread.id,
      public_id: generateCommunicationPublicId("MSG"),
      message_type: "email",
      direction: "inbound",
      visibility: "internal",
      status: "received",
      provider: inbound.provider,
      provider_message_id: inbound.providerMessageId ?? null,
      provider_thread_id: inbound.providerThreadId ?? null,
      inbound_webhook_event_id: inbound.eventId,
      in_reply_to: inbound.inReplyTo ?? null,
      references_header: inbound.references ?? null,
      from_email: inbound.fromEmail,
      from_name: inbound.fromName ?? null,
      to_emails: inbound.toEmails,
      cc_emails: inbound.ccEmails ?? [],
      subject: inbound.subject,
      body_text: bodyText,
      body_html: inbound.bodyHtml ?? null,
      raw_headers: inbound.rawHeaders ?? null,
      raw_payload: inbound.rawPayload ?? null,
      received_at: inbound.receivedAt ?? now(),
    })
    .select("*")
    .single();

  if (error || !message) throw error ?? new Error("Unable to store inbound message");

  for (const attachment of inbound.attachments ?? []) {
    if (!attachment.contentBase64) continue;
    const bytes = Buffer.from(attachment.contentBase64, "base64");
    const fileName = attachment.fileName || "attachment";
    const path = communicationAttachmentPath({
      threadPublicId: thread.public_id,
      messagePublicId: message.public_id,
      fileName,
    });
    const contentType = attachment.contentType ?? "application/octet-stream";
    const { error: uploadError } = await client.storage
      .from(COMMUNICATION_ATTACHMENT_BUCKET)
      .upload(path, bytes, { contentType, upsert: false });
    if (uploadError) throw uploadError;
    await client.from("communication_attachments").insert({
      message_id: message.id,
      thread_id: thread.id,
      file_name: fileName,
      content_type: contentType,
      file_size_bytes: attachment.size ?? bytes.length,
      storage_bucket: COMMUNICATION_ATTACHMENT_BUCKET,
      storage_path: path,
      source: "inbound_email",
    });
  }

  await client.from("communication_threads").update({
    status: thread.status === "waiting_on_client" ? "needs_review" : thread.status,
    unread_count: (thread.unread_count ?? 0) + 1,
    last_message_at: inbound.receivedAt ?? now(),
    updated_at: now(),
  }).eq("id", thread.id);
  await addAudit({ db: client, threadId: thread.id, messageId: message.id, eventType: "inbound_received", metadata: { provider: inbound.provider } });

  return { ok: true as const, threadId: thread.id, messageId: message.id, duplicate: false };
}

export async function updateCommunicationDeliveryStatus(input: {
  providerMessageId: string;
  status: "delivered" | "failed" | "bounced";
  rawPayload?: Record<string, unknown>;
}) {
  const client = await db();
  const patch =
    input.status === "delivered"
      ? { status: "delivered", delivered_at: now() }
      : { status: input.status, failed_at: now(), failure_reason: input.status };
  const { data } = await client
    .from("communication_messages")
    .update(patch)
    .eq("provider_message_id", input.providerMessageId)
    .select("id,thread_id")
    .maybeSingle();
  if (data) {
    await addAudit({ db: client, threadId: data.thread_id, messageId: data.id, eventType: input.status === "delivered" ? "message_delivered" : "send_failed", metadata: input.rawPayload ?? {} });
    if (input.status !== "delivered") {
      await client.from("communication_threads").update({ status: "action_required", updated_at: now() }).eq("id", data.thread_id);
    }
  }
  return { ok: true as const };
}

export async function createCommunicationAttachmentSignedUrl(attachmentId: string) {
  const client = await db();
  const { data: attachment } = await client
    .from("communication_attachments")
    .select("storage_bucket,storage_path,file_name")
    .eq("id", attachmentId)
    .maybeSingle();
  if (!attachment) return null;
  const { data, error } = await client.storage.from(attachment.storage_bucket).createSignedUrl(attachment.storage_path, 60 * 5, {
    download: attachment.file_name,
  });
  if (error) throw error;
  return data?.signedUrl ?? null;
}
