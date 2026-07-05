import "server-only";

import { amgEmailLayout } from "@/lib/portal/email-templates";

export const WAITLIST_CONTACT_TEMPLATE_KEY = "waitlist_contact_request";

export function waitlistContactRequestTemplate(input: { fullName?: string | null; email: string }) {
  const firstName = input.fullName?.trim().split(/\s+/)[0] || "there";
  const text = [
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

  return {
    templateName: WAITLIST_CONTACT_TEMPLATE_KEY,
    subject: "AMG Portal Access Request",
    text,
    html: amgEmailLayout({
      eyebrow: "Portal Access",
      title: "AMG Portal Access Request",
      intro: text,
    }),
  };
}
