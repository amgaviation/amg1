"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { outboundMessageSenderLabel } from "@/lib/portal/message-display";
import { actor, str } from "./_helpers";

/** Post a message into an existing thread. */
export async function postMessage(formData: FormData) {
  const user = await actor();
  const db = await createServiceClient();
  const threadId = str(formData, "thread_id");
  const body = str(formData, "body");
  const backTo = str(formData, "back_to") || `/portal/${user.role}/messages`;
  if (!threadId || !body) redirect(`${backTo}?error=empty`);

  // Authorize: admin or thread member
  if (user.role !== "admin") {
    const { data: member } = await db
      .from("thread_members")
      .select("thread_id")
      .eq("thread_id", threadId)
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!member) redirect(`${backTo}?error=forbidden`);
  }

  await db.from("messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    sender_email: user.email,
    body,
    visibility: "all",
  });
  await db
    .from("message_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  const senderLabel = outboundMessageSenderLabel(user);

  // Notify other members
  const { data: members } = await db
    .from("thread_members")
    .select("profile_id")
    .eq("thread_id", threadId);
  for (const m of members ?? []) {
    if (m.profile_id !== user.id) {
      await notifyUser({
        userId: m.profile_id,
        title: "New message",
        body: `${senderLabel}: ${body.slice(0, 80)}`,
        type: "message",
        entityType: "thread",
        entityId: threadId,
      });
    }
  }

  await logAuditEvent({
    actor: user,
    action: "message_sent",
    detail: `Message in thread ${threadId}`,
    entityType: "thread",
    entityId: threadId,
  });
  revalidatePath(`${backTo}/${threadId}`);
  revalidatePath(backTo);
  redirect(`${backTo}/${threadId}`);
}

/** Open a new thread to AMG Operations (client / crew / partner). */
export async function startThread(formData: FormData) {
  const user = await actor(["client", "crew", "partner"]);
  const db = await createServiceClient();
  const title = str(formData, "title") || "AMG Operations";
  const body = str(formData, "body");
  const missionId = str(formData, "mission_id") || null;
  if (!body) redirect(`/portal/${user.role}/messages?error=empty`);

  const { data: thread } = await db
    .from("message_threads")
    .insert({
      scope_type: missionId ? "general" : "general",
      scope_id: missionId,
      mission_id: missionId,
      title,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (!thread) redirect(`/portal/${user.role}/messages?error=failed`);

  // Members: the sender plus all approved admins
  const { data: admins } = await db
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("status", "approved");
  const memberIds = new Set<string>([user.id, ...(admins ?? []).map((a) => a.id)]);
  await db
    .from("thread_members")
    .insert([...memberIds].map((profile_id) => ({ thread_id: thread.id, profile_id })));

  await db.from("messages").insert({
    thread_id: thread.id,
    sender_id: user.id,
    sender_email: user.email,
    body,
    visibility: "all",
  });

  for (const a of admins ?? []) {
    await notifyUser({
      userId: a.id,
      title: "New message thread",
      body: `${user.name} started: ${title}`,
      type: "message",
      entityType: "thread",
      entityId: thread.id,
    });
  }

  await logAuditEvent({
    actor: user,
    action: "thread_started",
    detail: `Started thread "${title}"`,
    entityType: "thread",
    entityId: thread.id,
  });
  redirect(`/portal/${user.role}/messages/${thread.id}`);
}
