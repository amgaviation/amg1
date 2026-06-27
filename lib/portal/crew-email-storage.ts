type Db = {
  from: (table: string) => any;
};

type StorageUser = {
  id: string;
  email?: string | null;
};

export type CrewEmailDraftMode = "communication" | "legacy";

export type CrewEmailDraft = {
  mode: CrewEmailDraftMode;
  threadId: string;
  messageId: string;
  threadToken: string;
};

export type PersistCrewEmailDraftInput = {
  user: StorageUser;
  crewId: string;
  recipientEmail: string;
  recipientName: string | null | undefined;
  missionId?: string | null;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  providerName: string;
  providerConfigured: boolean;
  templateKey: string;
  variables: Record<string, unknown>;
  threadPublicId: string;
  messagePublicId: string;
  timestamp: string;
};

export function isMissingCommunicationSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown; hint?: unknown };
  const message = typeof candidate.message === "string" ? candidate.message : "";
  const hint = typeof candidate.hint === "string" ? candidate.hint : "";
  return (
    candidate.code === "PGRST205" &&
    (message.includes("communication_") || hint.includes("message_threads") || hint.includes("messages"))
  );
}

async function createLegacyCrewEmailDraft(client: Db, input: PersistCrewEmailDraftInput): Promise<CrewEmailDraft> {
  const { data: thread, error: threadError } = await client
    .from("message_threads")
    .insert({
      scope_type: input.missionId ? "mission" : "general",
      scope_id: input.missionId || input.crewId,
      mission_id: input.missionId || null,
      title: input.subject,
      last_message_at: input.timestamp,
    })
    .select("id")
    .single();

  if (threadError || !thread) throw threadError ?? new Error("Unable to create legacy crew message thread");

  const { data: admins } = await client
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("status", "approved");
  const memberIds = Array.from(new Set([input.crewId, input.user.id, ...((admins ?? []).map((admin: any) => admin.id).filter(Boolean))]));

  if (memberIds.length) {
    const { error: memberError } = await client
      .from("thread_members")
      .insert(memberIds.map((profile_id) => ({ thread_id: thread.id, profile_id })));
    if (memberError) throw memberError;
  }

  const { data: message, error: messageError } = await client
    .from("messages")
    .insert({
      thread_id: thread.id,
      sender_id: input.user.id,
      sender_email: input.user.email ?? null,
      body: input.bodyText,
      visibility: "all",
    })
    .select("id")
    .single();

  if (messageError || !message) throw messageError ?? new Error("Unable to create legacy crew message");

  return {
    mode: "legacy",
    threadId: thread.id,
    messageId: message.id,
    threadToken: thread.id,
  };
}

export async function persistCrewEmailDraft(client: Db, input: PersistCrewEmailDraftInput): Promise<CrewEmailDraft> {
  const { data: thread, error: threadError } = await client
    .from("communication_threads")
    .insert({
      public_id: input.threadPublicId,
      subject: input.subject,
      status: "new",
      priority: "normal",
      channel: "email",
      created_by_user_id: input.user.id,
      related_request_id: input.missionId || null,
      last_message_at: input.timestamp,
    })
    .select("id,public_id")
    .single();

  if (threadError || !thread) {
    if (isMissingCommunicationSchemaError(threadError)) {
      return createLegacyCrewEmailDraft(client, input);
    }
    throw threadError ?? new Error("Unable to create crew communication thread");
  }

  await client.from("communication_participants").insert({
    thread_id: thread.id,
    participant_type: "crew",
    user_id: input.crewId,
    crew_id: input.crewId,
    email: input.recipientEmail,
    name: input.recipientName,
    role_label: "Crew",
    is_primary: true,
  });

  const { data: message, error: messageError } = await client
    .from("communication_messages")
    .insert({
      thread_id: thread.id,
      public_id: input.messagePublicId,
      message_type: "email",
      direction: "outbound",
      visibility: "internal",
      status: input.providerConfigured ? "queued" : "failed",
      provider: input.providerName,
      from_name: "AMG Operations",
      to_emails: [input.recipientEmail],
      subject: input.subject,
      body_text: input.bodyText,
      body_html: input.bodyHtml,
      sent_by_user_id: input.user.id,
      created_by_user_id: input.user.id,
      failed_at: input.providerConfigured ? null : input.timestamp,
      failure_reason: input.providerConfigured ? null : "Email provider is not configured",
      raw_payload: {
        template_key: input.templateKey,
        variables: input.variables,
        recipient_type: "crew",
        recipient_id: input.crewId,
      },
    })
    .select("id")
    .single();

  if (messageError || !message) {
    if (isMissingCommunicationSchemaError(messageError)) {
      return createLegacyCrewEmailDraft(client, input);
    }
    throw messageError ?? new Error("Unable to create crew communication message");
  }

  return {
    mode: "communication",
    threadId: thread.id,
    messageId: message.id,
    threadToken: thread.public_id,
  };
}
