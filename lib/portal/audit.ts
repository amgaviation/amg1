import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/portal/session";
import { queueNotificationDeliveries } from "@/lib/portal/notification-delivery";

export type AuditInput = {
  actor: Pick<SessionUser, "id" | "email" | "role">;
  action: string;
  detail?: string;
  entityType?: string;
  entityId?: string | null;
};

/**
 * Append an immutable audit event. Best-effort: failures are logged but
 * never block the originating action.
 */
export async function logAuditEvent(input: AuditInput): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.from("audit_events").insert({
      actor_id: input.actor.id,
      actor_email: input.actor.email,
      actor_role: input.actor.role,
      action: input.action,
      detail: input.detail ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });
  } catch (error) {
    console.error("[audit] failed to record event", input.action, error);
  }
}

/**
 * Create an in-app notification and immediately attempt configured external
 * delivery. Delivery failures are recorded but do not block the form action.
 */
export async function notifyUser(params: {
  userId: string;
  title: string;
  body?: string;
  html?: string;
  type?: string;
  entityType?: string;
  entityId?: string | null;
  replyTo?: string;
}): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const { data } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        title: params.title,
        body: params.body ?? null,
        notification_type: params.type ?? null,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
      })
      .select("id")
      .single();

    await queueNotificationDeliveries({
      userId: params.userId,
      notificationId: data?.id ?? null,
      title: params.title,
      body: params.body ?? null,
      html: params.html ?? null,
      eventType: params.type ?? null,
      replyTo: params.replyTo ?? null,
    });
  } catch (error) {
    console.error("[notify] failed to create notification", params.title, error);
  }
}

/**
 * Notify every approved administrator. Each admin receives an in-app
 * notification and an email at the address stored in public.profiles.email.
 */
export async function notifyAdmins(params: {
  title: string;
  body?: string;
  html?: string;
  type?: string;
  entityType?: string;
  entityId?: string | null;
  replyTo?: string;
}): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("status", "approved");

    if (!admins?.length) return;

    for (const admin of admins) {
      await notifyUser({
        userId: admin.id,
        title: params.title,
        body: params.body,
        html: params.html,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        replyTo: params.replyTo,
      });
    }
  } catch (error) {
    console.error("[notify] failed to notify admins", params.title, error);
  }
}
