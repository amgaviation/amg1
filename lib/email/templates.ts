import {
  AMG_EMAIL_BRAND,
  OPERATIONAL_EMAIL_DISCLAIMER,
  SHARED_EMAIL_FOOTER,
  SITE_URL,
  absolutePortalUrl,
} from "@/lib/email/config";

export const OPERATIONAL_EMAIL_FOOTER = OPERATIONAL_EMAIL_DISCLAIMER;

export type EmailSection = {
  title?: string;
  rows?: Array<{
    label: string;
    value?: string | number | null;
  }>;
  body?: string | null;
};

export type EmailCta = {
  label: string;
  href: string;
};

export type BaseEmailTemplateInput = {
  previewText?: string;
  eyebrow?: string;
  title: string;
  intro?: string | null;
  reference?: string | null;
  status?: string | null;
  sections?: EmailSection[];
  cta?: EmailCta;
  footerNote?: string | null;
  showPortalCta?: boolean;
  portalUrl?: string | null;
  portalCtaLabel?: string;
};

export type OperationalEmailInput = {
  title: string;
  preheader?: string;
  body: string;
  eyebrow?: string;
  reference?: string | null;
  status?: string | null;
  details?: Array<{ label: string; value?: string | number | null }>;
  sections?: EmailSection[];
  primaryCta?: EmailCta;
  footerNote?: string | null;
  showPortalCta?: boolean;
  portalUrl?: string | null;
  portalCtaLabel?: string;
};

const brand = {
  midnight: AMG_EMAIL_BRAND.primaryColor,
  deepBlue: AMG_EMAIL_BRAND.secondaryDarkColor,
  accentBlue: AMG_EMAIL_BRAND.accentBlue,
  slateGray: AMG_EMAIL_BRAND.slateText,
  lightGray: AMG_EMAIL_BRAND.lightGray,
  white: AMG_EMAIL_BRAND.white,
  cardBorder: "#1E2A3C",
  softBlue: "#EFF6FF",
  offWhite: "#F8FAFC",
};

export function interpolateTemplate(template: string, variables: Record<string, string | number | null | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

export function operationalEmailText(body: string) {
  return `${body.trim()}\n\n---\n${OPERATIONAL_EMAIL_FOOTER}`;
}

function logoUrl() {
  return SITE_URL ? `${SITE_URL}/images/logo-white.png` : null;
}

function row(label: string, value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "";
  return `
    <tr>
      <td style="padding: 11px 0; color: ${brand.slateGray}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.11em; vertical-align: top; width: 176px; border-bottom: 1px solid #E5E7EB;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 11px 0; color: #111827; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.55; vertical-align: top; border-bottom: 1px solid #E5E7EB;">
        ${formatMultiline(String(value))}
      </td>
    </tr>
  `;
}

function formatMultiline(value?: string | number | null) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function sectionToText(section: EmailSection) {
  const parts = [
    section.title,
    section.body,
    ...(section.rows ?? [])
      .filter((item) => item.value !== undefined && item.value !== null && item.value !== "")
      .map((item) => `${item.label}: ${item.value}`),
  ].filter(Boolean);

  return parts.join("\n");
}

function bodySections(body: string, details?: OperationalEmailInput["details"], sections: EmailSection[] = []) {
  const allSections: EmailSection[] = [
    {
      title: "Message",
      body,
    },
  ];

  if (details?.length) {
    allSections.push({
      title: "Details",
      rows: details,
    });
  }

  return [...allSections, ...sections];
}

export function amgEmailLayout(input: BaseEmailTemplateInput) {
  const previewText = input.previewText || input.title;
  const logo = logoUrl();
  const resolvedPortalUrl = input.portalUrl ?? (input.showPortalCta ? absolutePortalUrl("/portal") : null);
  const showPortalCta = input.showPortalCta !== false && Boolean(resolvedPortalUrl);

  const sectionsHtml = (input.sections ?? [])
    .map((section) => {
      const rowsHtml = section.rows
        ?.map((item) => row(item.label, item.value))
        .join("");

      const bodyHtml = section.body
        ? `<p style="margin: 0; color: #1F2937; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.7;">${formatMultiline(section.body)}</p>`
        : "";

      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 24px; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
          ${
            section.title
              ? `<tr>
                  <td colspan="2" style="padding: 15px 18px; background: ${brand.offWhite}; border-bottom: 1px solid #E5E7EB;">
                    <h2 style="margin: 0; color: ${brand.deepBlue}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.4; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em;">
                      ${escapeHtml(section.title)}
                    </h2>
                  </td>
                </tr>`
              : ""
          }
          ${bodyHtml ? `<tr><td colspan="2" style="padding: 18px;">${bodyHtml}</td></tr>` : ""}
          ${rowsHtml ? `<tr><td colspan="2" style="padding: 0 18px 6px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rowsHtml}</table></td></tr>` : ""}
        </table>
      `;
    })
    .join("");

  const ctaHtml = input.cta
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
        <tr>
          <td style="border-radius: 999px; background: ${brand.accentBlue};">
            <a href="${escapeHtml(input.cta.href)}" style="display: inline-block; padding: 13px 22px; color: ${brand.white}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 800; text-decoration: none; letter-spacing: 0.04em;">
              ${escapeHtml(input.cta.label)}
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  const portalCtaHtml = showPortalCta
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #E5E7EB;">
        <tr>
          <td>
            <p style="margin: 0 0 12px; color: #4B5563; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.55;">
              Need to review this in the portal?
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="border-radius: 999px; background: ${brand.accentBlue};">
                  <a href="${escapeHtml(resolvedPortalUrl)}" style="display: inline-block; padding: 10px 17px; color: ${brand.white}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 800; text-decoration: none; letter-spacing: 0.03em;">
                    ${escapeHtml(input.portalCtaLabel || "Open Portal")}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    : "";

  const logoHtml = logo
    ? `<img src="${escapeHtml(logo)}" width="190" alt="AMG Aviation Group" style="display: block; width: 190px; max-width: 78%; height: auto; border: 0; outline: none; text-decoration: none;" />`
    : `<div style="color: ${brand.white}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 20px; line-height: 1.2; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;">AMG Aviation Group</div>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${brand.midnight};">
    <div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">
      ${escapeHtml(previewText)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${brand.midnight}; padding: 34px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 700px; background: ${brand.white}; border: 1px solid ${brand.cardBorder}; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 55px rgba(0,0,0,0.22);">
            <tr>
              <td style="padding: 28px 32px 30px; background: ${brand.deepBlue}; border-bottom: 4px solid ${brand.accentBlue};">
                ${logoHtml}
                <div style="margin-top: 22px; color: ${brand.accentBlue}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;">
                  ${escapeHtml(input.eyebrow || "Operational Notification")}
                </div>
                <div style="margin-top: 8px; color: ${brand.white}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 24px; line-height: 1.25; font-weight: 800;">
                  ${escapeHtml(input.title)}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 32px 32px 36px; background: ${brand.white};">
                ${
                  input.status || input.reference
                    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                        <tr>
                          <td>
                            ${
                              input.reference
                                ? `<span style="display: inline-block; margin-right: 8px; margin-bottom: 8px; padding: 8px 11px; border-radius: 999px; background: ${brand.softBlue}; color: ${brand.accentBlue}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 800;">
                                    Ref ${escapeHtml(input.reference)}
                                  </span>`
                                : ""
                            }
                            ${
                              input.status
                                ? `<span style="display: inline-block; margin-bottom: 8px; padding: 8px 11px; border-radius: 999px; background: ${brand.deepBlue}; color: ${brand.white}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 800;">
                                    ${escapeHtml(input.status)}
                                  </span>`
                                : ""
                            }
                          </td>
                        </tr>
                      </table>`
                    : ""
                }

                <h1 style="margin: 0; color: ${brand.midnight}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 24px; line-height: 1.26; font-weight: 800;">
                  ${escapeHtml(input.title)}
                </h1>

                ${
                  input.intro
                    ? `<p style="margin: 14px 0 0; color: #374151; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.7;">
                        ${formatMultiline(input.intro)}
                      </p>`
                    : ""
                }

                ${sectionsHtml}
                ${ctaHtml}
                ${portalCtaHtml}

                ${
                  input.footerNote
                    ? `<p style="margin: 28px 0 0; padding-top: 18px; border-top: 1px solid #E5E7EB; color: #4B5563; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.65;">
                        ${formatMultiline(input.footerNote)}
                      </p>`
                    : ""
                }
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 32px; background: ${brand.deepBlue}; border-top: 1px solid ${brand.cardBorder};">
                <p style="margin: 0; color: ${brand.white}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.65; font-weight: 700;">
                  ${escapeHtml(AMG_EMAIL_BRAND.companyName)}
                </p>
                <p style="margin: 6px 0 0; color: ${brand.lightGray}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.65;">
                  Operational support, crew coordination, aircraft movement, and flight department support.
                </p>
                <p style="margin: 10px 0 0; color: ${brand.lightGray}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.65;">
                  ${formatMultiline(SHARED_EMAIL_FOOTER)}
                </p>
                <p style="margin: 12px 0 0; color: ${brand.slateGray}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.65;">
                  This message may contain operationally sensitive information. If you received it in error, delete it and notify AMG Aviation Group.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin: 18px 0 0; color: ${brand.slateGray}; font-family: Inter, Arial, Helvetica, sans-serif; font-size: 11px;">
            &copy; ${new Date().getFullYear()} ${escapeHtml(AMG_EMAIL_BRAND.companyName)}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderOperationalEmail(input: OperationalEmailInput) {
  const sections = bodySections(input.body, input.details, input.sections);
  const portalUrl = input.portalUrl ?? absolutePortalUrl("/portal");
  const showPortalCta = input.showPortalCta !== false;
  const footerNote = input.footerNote ?? OPERATIONAL_EMAIL_FOOTER;
  const textParts = [
    input.title,
    ...sections.map(sectionToText),
    showPortalCta && portalUrl ? `Open Portal: ${portalUrl}` : null,
    footerNote,
    SHARED_EMAIL_FOOTER,
  ].filter(Boolean);

  return {
    text: textParts.join("\n\n"),
    html: amgEmailLayout({
      previewText: input.preheader,
      eyebrow: input.eyebrow,
      title: input.title,
      reference: input.reference,
      status: input.status,
      sections,
      cta: input.primaryCta,
      footerNote,
      showPortalCta,
      portalUrl,
      portalCtaLabel: input.portalCtaLabel,
    }),
  };
}

export function operationalEmailHtml(body: string) {
  return renderOperationalEmail({
    title: "AMG Operations Message",
    body,
    showPortalCta: false,
  }).html;
}

export function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
