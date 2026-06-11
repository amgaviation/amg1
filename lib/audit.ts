import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

type AuditEventInput = {
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  detail?: string;
  entityType?: string;
  entityId?: string;
};

export async function logAuditEvent({
  actorId,
  actorEmail,
  actorRole,
  action,
  detail,
  entityType,
  entityId,
}: AuditEventInput) {
  try {
    const supabase = await createServiceClient();
    await supabase.from("audit_events").insert({
      actor_id: actorId ?? null,
      actor_email: actorEmail ?? null,
      actor_role: actorRole ?? null,
      action,
      detail: detail ?? null,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
    });
  } catch {
    // Audit failures should not break the main flow
  }
}
