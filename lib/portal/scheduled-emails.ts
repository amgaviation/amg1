import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { sendLeadEmail } from "@/lib/portal/lead-email";
import { logAuditEvent } from "@/lib/portal/audit";
import { isPortalRole } from "@/lib/portal/constants";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Scheduled pipeline emails: composed now, delivered at a chosen time.
 * Dispatch runs from the nightly cron AND opportunistically when an admin
 * loads the Sales Pipeline — each due row is claimed with a guarded update
 * (scheduled → sending) so two dispatchers can never double-send.
 */

export type ScheduledEmail = Tables<"scheduled_emails"> & {
  lead: { id: string; full_name: string | null; company_name: string | null } | null;
  creator: { id: string; full_name: string | null; email: string } | null;
};

const SELECT =
  "*, lead:lead_id(id, full_name, company_name), creator:created_by(id, full_name, email)";

export async function listScheduledEmails(options?: {
  includeRecent?: boolean;
}): Promise<ScheduledEmail[]> {
  const db = await createServiceClient();
  let query = db
    .from("scheduled_emails")
    .select(SELECT)
    .order("send_at", { ascending: true })
    .limit(200);
  if (!options?.includeRecent) query = query.eq("status", "scheduled");
  else query = query.in("status", ["scheduled", "sending", "sent", "failed"]);
  const { data } = await query.returns<ScheduledEmail[]>();
  return data ?? [];
}

export async function countPendingScheduledEmails(): Promise<number> {
  const db = await createServiceClient();
  const { count } = await db
    .from("scheduled_emails")
    .select("id", { count: "exact", head: true })
    .eq("status", "scheduled");
  return count ?? 0;
}

/** Dispatch every due scheduled email. Returns how many were attempted. */
export async function processDueScheduledEmails(): Promise<number> {
  const db = await createServiceClient();
  const { data: due } = await db
    .from("scheduled_emails")
    .select("id")
    .eq("status", "scheduled")
    .lte("send_at", new Date().toISOString())
    .limit(25);
  if (!due?.length) return 0;

  let attempted = 0;
  for (const row of due) {
    // Claim atomically — only one dispatcher wins the scheduled → sending flip.
    const { data: claimed } = await db
      .from("scheduled_emails")
      .update({ status: "sending" })
      .eq("id", row.id)
      .eq("status", "scheduled")
      .select("id, lead_id, recipient_email, subject, body, created_by")
      .maybeSingle();
    if (!claimed) continue;
    attempted++;

    const { data: creator } = await db
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", claimed.created_by)
      .maybeSingle();
    const actor = creator
      ? {
          id: creator.id,
          email: creator.email,
          name: creator.full_name ?? creator.email,
          role: isPortalRole(creator.role) ? creator.role : ("admin" as const),
          status: "approved",
          companyName: null,
          phone: null,
          homeBase: null,
          avatarPath: null,
        }
      : null;

    let ok = false;
    let reason: string | null = null;
    if (!claimed.lead_id || !actor) {
      reason = !actor ? "creator-missing" : "lead-missing";
    } else {
      const result = await sendLeadEmail(
        {
          leadId: claimed.lead_id,
          recipientEmail: claimed.recipient_email,
          subject: claimed.subject,
          body: claimed.body,
        },
        actor
      );
      ok = result.ok;
      if (!result.ok) reason = result.reason;
    }

    await db
      .from("scheduled_emails")
      .update(
        ok
          ? { status: "sent", sent_at: new Date().toISOString() }
          : { status: "failed", failure_reason: reason }
      )
      .eq("id", claimed.id);

    if (actor) {
      await logAuditEvent({
        actor,
        action: ok ? "scheduled_email_sent" : "scheduled_email_failed",
        detail: `${claimed.subject} → ${claimed.recipient_email}${reason ? ` (${reason})` : ""}`,
        entityType: "scheduled_email",
        entityId: claimed.id,
      });
    }
  }
  return attempted;
}
