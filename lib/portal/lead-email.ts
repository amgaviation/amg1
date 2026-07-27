import "server-only";

import { AMG_EMAIL_BRAND, SITE_URL, replyToAddress } from "@/lib/email/config";
import { getEmailProvider, emailProviderStatus } from "@/lib/email/provider";
import { operationalEmailHtml, operationalEmailText } from "@/lib/email/templates";
import { isValidEmailAddress } from "@/lib/email/threading";
import { logServerError } from "@/lib/errors/user-facing-errors";
import { logAuditEvent } from "@/lib/portal/audit";
import { getEmailTemplateCopies } from "@/lib/portal/email-template-registry";
import {
  LEAD_BUSINESS_TYPES,
  LEAD_EMAIL_STAGES,
  buildLeadEmailVariables,
  leadEmailTemplateKey,
  mergeLeadEmailText,
  type LeadBusinessType,
  type LeadEmailStage,
  type LeadEmailVariables,
  type TemplateCopy,
} from "@/lib/portal/lead-email-templates";
import { isSuppressed, unsubscribeUrl } from "@/lib/portal/lead-suppression";
import type { SessionUser } from "@/lib/portal/session";
import { SITE } from "@/lib/site-config";
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
  | {
      ok: false;
      reason: "validation" | "configuration" | "provider" | "suppressed" | "unknown";
      referenceId?: string;
    };

/**
 * Who a send is attributed to. The automated sequence has no signed-in user,
 * and borrowing a real admin's identity would make the audit trail lie about
 * who sent what — so it carries a null id and its own address instead.
 * created_by is nullable precisely so this is representable.
 */
export type EmailActor = Pick<SessionUser, "id" | "email" | "role"> | AutomationActor;

export type AutomationActor = {
  id: null;
  email: string;
  role: "automation";
};

/** Only the display name is needed to merge template variables. */
export type TemplateSender = { name?: string | null };

export const OUTREACH_AUTOMATION_ACTOR: AutomationActor = {
  id: null,
  email: "automation@amgaviationgroup.com",
  role: "automation",
};

/**
 * The CAN-SPAM footer every outreach email carries: who we are, where we are,
 * and how to make it stop. SITE.streetAddress is a real street address, which
 * the statute requires — a PO box only qualifies if it is registered to the
 * sender.
 */
function leadEmailFooter(recipientEmail: string) {
  const url = unsubscribeUrl(recipientEmail);
  return {
    unsubscribeUrl: url,
    text: [
      "—",
      `${AMG_EMAIL_BRAND.companyName} · ${SITE.streetAddress}`,
      `You received this because we believe AMG's aircraft support services are relevant to your operation.`,
      `Not interested? Unsubscribe and we won't contact you again: ${url}`,
    ].join("\n"),
  };
}

export function leadEmailVariablesFor(
  lead: { full_name: string; company: string | null },
  sender: TemplateSender
): LeadEmailVariables {
  return buildLeadEmailVariables({
    lead: { fullName: lead.full_name, company: lead.company },
    senderName: sender.name || AMG_EMAIL_BRAND.operationsName,
    opsEmail: AMG_EMAIL_BRAND.contactEmail,
    siteUrl: SITE_URL,
  });
}

export type LeadEmailTemplateMap = Record<LeadEmailStage, Record<LeadBusinessType, TemplateCopy>>;

/**
 * Every stage × business-type outreach template for this lead, with global
 * overrides applied and variables already merged — ready for the composer.
 */
export async function getLeadEmailTemplates(
  lead: { full_name: string; company: string | null },
  sender: TemplateSender
): Promise<LeadEmailTemplateMap> {
  const variables = leadEmailVariablesFor(lead, sender);
  const keys: string[] = [];
  for (const stage of LEAD_EMAIL_STAGES) {
    for (const type of LEAD_BUSINESS_TYPES) {
      keys.push(leadEmailTemplateKey(stage.value, type.value));
    }
  }
  const copies = await getEmailTemplateCopies(keys);

  const map = {} as LeadEmailTemplateMap;
  for (const stage of LEAD_EMAIL_STAGES) {
    const perType = {} as Record<LeadBusinessType, TemplateCopy>;
    for (const type of LEAD_BUSINESS_TYPES) {
      const copy = copies.get(leadEmailTemplateKey(stage.value, type.value));
      perType[type.value] = {
        subject: mergeLeadEmailText(copy?.subject ?? "", variables),
        body: mergeLeadEmailText(copy?.body ?? "", variables),
      };
    }
    map[stage.value] = perType;
  }
  return map;
}

export async function sendLeadEmail(
  input: LeadEmailSendInput,
  user: EmailActor
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
    .select("id, full_name, email, do_not_contact")
    .eq("id", input.leadId)
    .maybeSingle();
  if (!lead) return { ok: false, reason: "validation" };

  // Suppression is enforced HERE, in the one function every lead email passes
  // through, rather than in each caller. The automated sequence sends days
  // apart with no human in the loop, so a check the caller has to remember is a
  // check that eventually gets forgotten — and the cost of forgetting is
  // emailing someone who told us to stop.
  if (lead.do_not_contact || (await isSuppressed(recipientEmail))) {
    await db.from("crm_activities").insert({
      lead_id: lead.id,
      activity_type: "outreach_skipped",
      body: `Send blocked: ${recipientEmail} is on the do-not-contact list.`,
      created_by: user.id,
      created_by_email: user.email,
    });
    return { ok: false, reason: "suppressed" };
  }

  const provider = getEmailProvider();
  if (!provider.configured()) {
    await logAuditEvent({
      actor: { id: user.id, email: user.email, role: user.role },
      action: "crm_lead_email_send_failed",
      detail: "Email provider is not configured",
      entityType: "crm_lead",
      entityId: lead.id,
    });
    return { ok: false, reason: "configuration" };
  }

  try {
    // CAN-SPAM (15 U.S.C. 7704(a)(3),(a)(5)) applies to this mail: it is
    // commercial, and the recipient never asked for it. Every message needs a
    // working opt-out and a physical postal address. Appended here, in the
    // shared send path, for the same reason the suppression check is — so it
    // cannot be omitted by an individual caller or edited out of a template.
    const footer = leadEmailFooter(recipientEmail);
    const text = operationalEmailText(`${body}\n\n${footer.text}`);
    const html = operationalEmailHtml(`${body}\n\n${footer.text}`, {
      title: subject,
      eyebrow: AMG_EMAIL_BRAND.companyName,
    });
    const result = await provider.sendEmail({
      to: [recipientEmail],
      subject,
      text,
      html,
      replyTo: replyToAddress(),
      headers: {
        "X-AMG-Recipient-Type": "lead",
        // RFC 8058: gives Gmail/Outlook a native unsubscribe control, which
        // measurably reduces spam complaints on cold B2B mail.
        "List-Unsubscribe": `<${footer.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (!result.ok) {
      await logAuditEvent({
        actor: { id: user.id, email: user.email, role: user.role },
        action: "crm_lead_email_send_failed",
        detail: result.error ?? "Lead email provider send failed",
        entityType: "crm_lead",
        entityId: lead.id,
      });
      return { ok: false, reason: "provider" };
    }

    const activityBody = `To: ${recipientEmail}\nSubject: ${subject}\n\n${body}`;
    // The type distinguishes who sent it, and that distinction is load-bearing.
    // workflows/lead-outreach.ts decides whether to keep sending by looking for
    // HUMAN activity on the lead, and "email" is one of the types it counts. If
    // an automated send wrote "email", the sequence would see its own intro on
    // the next check, conclude the lead had replied, and stop — turning a
    // three-touch sequence into a one-touch one while logging that a reply
    // arrived. "outreach_email" is also what the daily cap counts, so this row
    // is the single record of one send.
    await db.from("crm_activities").insert({
      lead_id: lead.id,
      activity_type: user.id === null ? "outreach_email" : "email",
      body: activityBody.length > 4000 ? `${activityBody.slice(0, 3999)}…` : activityBody,
      created_by: user.id,
      created_by_email: user.email,
    });
    await db
      .from("crm_leads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", lead.id);
    await logAuditEvent({
      actor: { id: user.id, email: user.email, role: user.role },
      action: "crm_lead_email_sent",
      detail: `Email sent to ${recipientEmail}: ${subject}`,
      entityType: "crm_lead",
      entityId: lead.id,
    });
    return { ok: true };
  } catch (error) {
    const referenceId = logServerError("Lead email send failed", error, {
      userId: user.id ?? undefined,
      leadId: input.leadId,
    });
    return { ok: false, reason: "unknown", referenceId };
  }
}

export { emailProviderStatus };
