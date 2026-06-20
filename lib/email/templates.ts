export const OPERATIONAL_EMAIL_FOOTER =
  "AMG support is reviewed before acceptance. No request is considered accepted until applicable operational, aircraft, crew, approval, and condition items have been reviewed.";

export function interpolateTemplate(template: string, variables: Record<string, string | number | null | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

export function operationalEmailText(body: string) {
  return `${body.trim()}\n\n---\n${OPERATIONAL_EMAIL_FOOTER}`;
}

export function operationalEmailHtml(body: string) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      ${paragraphs}
      <hr style="border: 0; border-top: 1px solid #dbe3ef; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b;">${escapeHtml(OPERATIONAL_EMAIL_FOOTER)}</p>
    </div>
  `;
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
