import "server-only";

import { AMG_EMAIL_BRAND, SITE_URL, replyToAddress } from "@/lib/email/config";
import { getEmailProvider, emailProviderStatus } from "@/lib/email/provider";
import { operationalEmailHtml, operationalEmailText } from "@/lib/email/templates";
import { isValidEmailAddress } from "@/lib/email/threading";
import { logServerError } from "@/lib/errors/user-facing-errors";
import { logAuditEvent } from "@/lib/portal/audit";
import { buildLeadEmailVariables, type LeadEmailVariables } from "@/lib/portal/lead-email-templates";
import type { SessionUser } from "@/lib/portal/session";
import { createServiceClient } from "@/lib/supabase/server";

/** Outreach email to a sales-pipeline lead: send, log to the lead's activity
 * history, and audit. Leads live outside the portal, so there is no thread
 * token — replies come back to the standard reply-to address. */

export type LeadEmailSendInput = {
  leadId: string;
  recipientEmail: string;
  subject: string;
  body: string;
};

export type LeadEmailSendResult =
  | { ok: true }
  | { ok: false; reason: "validation" | "configuration" | "provider" | "unknown"; referenceId?: string };

export function leadEmailVariablesFor(
  lead: { full_name: string; company: string | null },
  sender: SessionUser
): LeadEmailVariables {
  return buildLeadEmailVariables({
    lead: { fullName: lead.full_name, company: lead.company },
    senderName: sender.name || AMG_EMAIL_BRAND.operationsName,
    opsEmail: AMG_EMAIL_BRAND.contactEmail,
    siteUrl: SITE_URL,
  });
}

export async function sendLeadEmail(
  input: LeadEmailSendInput,
  user: SessionUser
): Promise<LeadEmailSendResult> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!input.leadId || !subject || !body || !isValidEmailAddress(recipientEmail)) {
    return { ok: false, reason: "validation" };
  }

  const db = (await createServiceClient()) as any;
  const { data: lead } = await db
    .from("crm_leads")
    .select("id, full_name, email")
    .eq("id", input.leadId)
    .maybeSingle();
  if (!lead) return { ok: false, reason: "validation" };

  const provider = getEmailProvider();
  if (!provider.configured()) {
    await logAuditEvent({
      actor: user,
      action: "crm_lead_email_send_failed",
      detail: "Email provider is not configured",
      entityType: "crm_lead",
      entityId: lead.id,
    });
    return { ok: false, reason: "configuration" };
  }

  try {
    const text = operationalEmailText(body);
    const html = operationalEmailHtml(body, { title: subject, eyebrow: AMG_EMAIL_BRAND.companyName });
    const result = await provider.sendEmail({
      to: [recipientEmail],
      subject,
      text,
      html,
      replyTo: replyToAddress(),
      headers: { "X-AMG-Recipient-Type": "lead" },
    });

    if (!result.ok) {
      await logAuditEvent({
        actor: user,
        action: "crm_lead_email_send_failed",
        detail: result.error ?? "Lead email provider send failed",
        entityType: "crm_lead",
        entityId: lead.id,
      });
      return { ok: false, reason: "provider" };
    }

    const activityBody = `To: ${recipientEmail}\nSubject: ${subject}\n\n${body}`;
    await db.from("crm_activities").insert({
      lead_id: lead.id,
      activity_type: "email",
      body: activityBody.length > 4000 ? `${activityBody.slice(0, 3999)}…` : activityBody,
      created_by: user.id,
      created_by_email: user.email,
    });
    await db
      .from("crm_leads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", lead.id);
    await logAuditEvent({
      actor: user,
      action: "crm_lead_email_sent",
      detail: `Email sent to ${recipientEmail}: ${subject}`,
      entityType: "crm_lead",
      entityId: lead.id,
    });
    return { ok: true };
  } catch (error) {
    const referenceId = logServerError("Lead email send failed", error, {
      userId: user.id,
      leadId: input.leadId,
    });
    return { ok: false, reason: "unknown", referenceId };
  }
}

export { emailProviderStatus };
