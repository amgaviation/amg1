import "server-only";

import { amgEmailLayout } from "@/lib/portal/email-templates";
import { mergeTemplateTokens } from "@/lib/portal/network-application-email-copy";

export const WAITLIST_CONTACT_TEMPLATE_KEY = "waitlist_contact_request";

export function waitlistContactRequestTemplate(
  input: { fullName?: string | null; email: string },
  override?: { subject: string; body: string } | null
) {
  const firstName = input.fullName?.trim().split(/\s+/)[0] || "there";
  const defaultText = [
    `Hello ${firstName},`,
    "",
    "AMG Aviation Group is reviewing your portal access request.",
    "",
    "Please contact AMG Operations so we can confirm the details needed to continue your access review.",
    "",
    "Email: information@amgaviationgroup.com",
    "",
    "AMG Aviation Group",
  ].join("\n");

  const variables = { first_name: firstName, full_name: input.fullName?.trim() || firstName };
  const subject = override ? mergeTemplateTokens(override.subject, variables) : "AMG Portal Access Request";
  const text = override ? mergeTemplateTokens(override.body, variables) : defaultText;

  return {
    templateName: WAITLIST_CONTACT_TEMPLATE_KEY,
    subject,
    text,
    html: amgEmailLayout({
      eyebrow: "Portal Access",
      title: subject,
      intro: text,
    }),
  };
}
