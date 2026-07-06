"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { outboundMessageSenderLabel } from "@/lib/portal/message-display";
import { ACKNOWLEDGMENT_TEXT, COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
import { actor, safeRedirectPath, str } from "./_helpers";

async function verifyThreadMissionReference(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  user: Awaited<ReturnType<typeof actor>>,
  missionId: string
) {
  if (user.role === "client") {
    const { data } = await db
      .from("missions")
      .select("id")
      .eq("id", missionId)
      .eq("client_id", user.id)
      .maybeSingle();
    return Boolean(data);
  }

  if (user.role === "crew") {
    const { data } = await db
      .from("mission_crew_assignments")
      .select("mission_id")
      .eq("mission_id", missionId)
      .eq("crew_id", user.id)
      .maybeSingle();
    return Boolean(data);
  }

  if (user.role === "partner") {
    const { data } = await db
      .from("mission_partner_assignments")
      .select("mission_id")
      .eq("mission_id", missionId)
      .eq("partner_id", user.id)
      .maybeSingle();
    return Boolean(data);
  }

  return false;
}

/** Post a message into an existing thread. */
export async function postMessage(formData: FormData) {
  const user = await actor(undefined, "messages.add");
  const db = await createServiceClient();
  const threadId = str(formData, "thread_id");
  const body = str(formData, "body");
  const messagesRoot = `/portal/${user.role}/messages`;
  const requestedBackTo = safeRedirectPath(str(formData, "back_to"), messagesRoot);
  const backTo = requestedBackTo.startsWith(messagesRoot) ? requestedBackTo : messagesRoot;
  if (!threadId || !body) redirect(`${backTo}?error=empty`);
  const paymentFindings = detectProhibitedPaymentData({ body });
  if (paymentFindings.length) {
    await recordComplianceEvidence({
      actor: user,
      audience: user.role,
      eventType: "no_online_payment_notice_acknowledged",
      eventArea: "communications",
      policyKey: POLICY_KEYS.noOnlinePayment,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: ACKNOWLEDGMENT_TEXT.noOnlinePayment,
      metadata: { action: "portal_message_blocked", fields: paymentFindings.map((finding) => finding.field) },
    });
    redirect(`${backTo}?error=payment-data`);
  }

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
  const user = await actor(["client", "crew", "partner"], "messages.add");
  const db = await createServiceClient();
  const title = str(formData, "title") || "AMG Operations";
  const body = str(formData, "body");
  const missionId = str(formData, "mission_id") || null;
  if (!body) redirect(`/portal/${user.role}/messages?error=empty`);
  const paymentFindings = detectProhibitedPaymentData({ title, body });
  if (paymentFindings.length) {
    await recordComplianceEvidence({
      actor: user,
      audience: user.role,
      eventType: "no_online_payment_notice_acknowledged",
      eventArea: "communications",
      policyKey: POLICY_KEYS.noOnlinePayment,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: ACKNOWLEDGMENT_TEXT.noOnlinePayment,
      metadata: { action: "portal_thread_blocked", fields: paymentFindings.map((finding) => finding.field) },
    });
    redirect(`/portal/${user.role}/messages?error=payment-data`);
  }
  if (missionId && !(await verifyThreadMissionReference(db, user, missionId))) {
    redirect(`/portal/${user.role}/messages?error=forbidden`);
  }

  const { data: thread } = await db
    .from("message_threads")
    .insert({
      scope_type: missionId ? "mission" : "general",
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
