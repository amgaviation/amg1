import { OPERATIONAL_EMAIL_DISCLAIMER } from "@/lib/email/config";
import { amgEmailLayout } from "@/lib/portal/email-templates";

export const OPERATIONAL_EMAIL_FOOTER = OPERATIONAL_EMAIL_DISCLAIMER;

export function interpolateTemplate(template: string, variables: Record<string, string | number | null | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

export function operationalEmailText(body: string) {
  return `${body.trim()}\n\n---\n${OPERATIONAL_EMAIL_FOOTER}`;
}

export function operationalEmailHtml(
  body: string,
  options?: { title?: string; eyebrow?: string }
) {
  // Every operational email renders through the one global AMG layout.
  return amgEmailLayout({
    eyebrow: options?.eyebrow ?? "AMG Operations",
    title: options?.title ?? "Message from AMG Operations",
    intro: body,
    footerNote: OPERATIONAL_EMAIL_FOOTER,
  });
}

export function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
