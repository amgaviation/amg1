import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/portal/session";

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
 * Create an in-app notification for a user. Email/SMS delivery is a
 * documented follow-on (see lib/notify.ts).
 */
export async function notifyUser(params: {
  userId: string;
  title: string;
  body?: string;
  type?: string;
  entityType?: string;
  entityId?: string | null;
}): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.from("notifications").insert({
      user_id: params.userId,
      title: params.title,
      body: params.body ?? null,
      notification_type: params.type ?? null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
    });
  } catch (error) {
    console.error("[notify] failed to create notification", params.title, error);
  }
}

/** Notify every approved admin (e.g. new request submitted). */
export async function notifyAdmins(params: {
  title: string;
  body?: string;
  type?: string;
  entityType?: string;
  entityId?: string | null;
}): Promise<void> {
  try {
    const supabase = await createServiceClient();
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("status", "approved");
    if (!admins?.length) return;
    await supabase.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        title: params.title,
        body: params.body ?? null,
        notification_type: params.type ?? null,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
      }))
    );
  } catch (error) {
    console.error("[notify] failed to notify admins", params.title, error);
  }
}
