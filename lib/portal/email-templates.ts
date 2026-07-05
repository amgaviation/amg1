import "server-only";

import { AMG_EMAIL_BRAND, SITE_URL } from "@/lib/email/config";

type EmailSection = {
  title?: string;
  rows?: Array<{
    label: string;
    value?: string | number | null;
  }>;
  body?: string | null;
};

type EmailCta = {
  label: string;
  href: string;
};

type BaseEmailTemplateInput = {
  previewText?: string;
  eyebrow?: string;
  title: string;
  intro?: string | null;
  reference?: string | null;
  status?: string | null;
  sections?: EmailSection[];
  cta?: EmailCta;
  footerNote?: string | null;
};

export type PublicSupportRequestEmailInput = {
  reference: string;
  requesterName: string;
  email: string;
  phone: string;
  preferredContact?: string | null;
  requestedCategory: string;
  organization?: string | null;
  aircraft?: string | null;
  tailNumber?: string | null;
  aircraftBase?: string | null;
  timing?: string | null;
  departure?: string | null;
  arrival?: string | null;
  operationalSummary?: string | null;
  categoryDetails?: string | null;
  portalUrl?: string | null;
};

export type ClientConfirmationEmailInput = {
  requesterName: string;
  reference: string;
  requestedCategory: string;
  timing?: string | null;
  portalUrl?: string | null;
};

export type PortalNotificationEmailInput = {
  title: string;
  body?: string | null;
  reference?: string | null;
  eventType?: string | null;
  portalUrl?: string | null;
};

/**
 * AMG Instrument — the ONE global email design. Every email and emailed
 * notification the portal sends renders through amgEmailLayout below:
 * clean white card, ink typography, single instrument-blue accent,
 * hairline rules — matching the portal's design language. Email-client
 * safe: tables, inline styles, system font stack.
 */
const brand = {
  page: "#EEF1F5",
  card: "#FFFFFF",
  cardBorder: "#E3E7ED",
  hairline: "#E9EDF2",
  ink: "#16191E",
  body: "#4A5160",
  muted: "#8A93A3",
  faint: "#9AA3B2",
  accent: "#0B5ED4",
  accentTint: "#EEF4FC",
  footerBg: "#F7F9FB",
  white: "#FFFFFF",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

function escapeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMultiline(value?: string | null) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function absoluteAppUrl() {
  return SITE_URL;
}

function logoUrl() {
  const appUrl = absoluteAppUrl();
  return appUrl ? `${appUrl}/images/logo-navy.png` : null;
}

function row(label: string, value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "";
  return `
    <tr>
      <td style="padding: 10px 0; color: ${brand.muted}; font-family: ${brand.font}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; vertical-align: top; width: 168px; border-bottom: 1px solid ${brand.hairline};">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 10px 0; color: ${brand.ink}; font-family: ${brand.font}; font-size: 14px; line-height: 1.6; vertical-align: top; border-bottom: 1px solid ${brand.hairline};">
        ${formatMultiline(String(value))}
      </td>
    </tr>
  `;
}

export function amgEmailLayout(input: BaseEmailTemplateInput) {
  const previewText = input.previewText || input.title;
  const logo = logoUrl();
  const siteUrl = absoluteAppUrl() || `https://${AMG_EMAIL_BRAND.websiteLabel}`;

  const sectionsHtml = (input.sections ?? [])
    .map((section) => {
      const rowsHtml = section.rows?.map((item) => row(item.label, item.value)).join("") ?? "";
      const bodyHtml = section.body
        ? `<p style="margin: ${section.title ? "8px" : "0"} 0 0; color: ${brand.body}; font-family: ${brand.font}; font-size: 14px; line-height: 1.7;">${formatMultiline(section.body)}</p>`
        : "";
      if (!rowsHtml && !bodyHtml) return "";

      return `
        <div style="margin-top: 26px;">
          ${
            section.title
              ? `<div style="padding-bottom: 8px; border-bottom: 1px solid ${brand.hairline}; color: ${brand.muted}; font-family: ${brand.font}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em;">
                  ${escapeHtml(section.title)}
                </div>`
              : ""
          }
          ${bodyHtml}
          ${rowsHtml ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 2px;">${rowsHtml}</table>` : ""}
        </div>
      `;
    })
    .join("");

  const chipsHtml =
    input.reference || input.status
      ? `<div style="margin: 0 0 16px;">
          ${
            input.reference
              ? `<span style="display: inline-block; margin-right: 8px; padding: 5px 10px; border-radius: 4px; background: ${brand.accentTint}; color: ${brand.accent}; font-family: ${brand.font}; font-size: 12px; font-weight: 700; letter-spacing: 0.04em;">${escapeHtml(input.reference)}</span>`
              : ""
          }
          ${
            input.status
              ? `<span style="display: inline-block; padding: 5px 10px; border-radius: 4px; background: #F2F4F8; border: 1px solid ${brand.hairline}; color: ${brand.body}; font-family: ${brand.font}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">${escapeHtml(input.status)}</span>`
              : ""
          }
        </div>`
      : "";

  const ctaHtml = input.cta
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
        <tr>
          <td style="border-radius: 8px; background: ${brand.accent};">
            <a href="${escapeHtml(input.cta.href)}" style="display: inline-block; padding: 13px 26px; color: ${brand.white}; font-family: ${brand.font}; font-size: 14px; font-weight: 700; text-decoration: none;">
              ${escapeHtml(input.cta.label)}
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  const logoHtml = logo
    ? `<img src="${escapeHtml(logo)}" width="168" alt="${escapeHtml(AMG_EMAIL_BRAND.companyName)}" style="display: block; width: 168px; max-width: 60%; height: auto; border: 0; outline: none; text-decoration: none;" />`
    : `<div style="color: ${brand.ink}; font-family: ${brand.font}; font-size: 17px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;">${escapeHtml(AMG_EMAIL_BRAND.companyName)}</div>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: ${brand.page};">
    <div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">
      ${escapeHtml(previewText)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${brand.page};">
      <tr>
        <td align="center" style="padding: 36px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background: ${brand.card}; border: 1px solid ${brand.cardBorder}; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="height: 4px; background: ${brand.accent}; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding: 26px 36px; border-bottom: 1px solid ${brand.hairline};">
                <a href="${escapeHtml(siteUrl)}" style="text-decoration: none;">${logoHtml}</a>
              </td>
            </tr>

            <tr>
              <td style="padding: 32px 36px 38px;">
                <div style="margin: 0 0 10px; color: ${brand.accent}; font-family: ${brand.font}; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;">
                  ${escapeHtml(input.eyebrow || "AMG Operations")}
                </div>
                <h1 style="margin: 0 0 16px; color: ${brand.ink}; font-family: ${brand.font}; font-size: 23px; line-height: 1.3; font-weight: 700;">
                  ${escapeHtml(input.title)}
                </h1>
                ${chipsHtml}
                ${
                  input.intro
                    ? `<p style="margin: 0; color: ${brand.body}; font-family: ${brand.font}; font-size: 15px; line-height: 1.7;">
                        ${formatMultiline(input.intro)}
                      </p>`
                    : ""
                }

                ${sectionsHtml}
                ${ctaHtml}

                ${
                  input.footerNote
                    ? `<p style="margin: 30px 0 0; padding-top: 18px; border-top: 1px solid ${brand.hairline}; color: ${brand.muted}; font-family: ${brand.font}; font-size: 12px; line-height: 1.65;">
                        ${formatMultiline(input.footerNote)}
                      </p>`
                    : ""
                }
              </td>
            </tr>

            <tr>
              <td style="padding: 22px 36px; background: ${brand.footerBg}; border-top: 1px solid ${brand.hairline};">
                <p style="margin: 0; color: ${brand.ink}; font-family: ${brand.font}; font-size: 13px; font-weight: 700;">
                  ${escapeHtml(AMG_EMAIL_BRAND.companyName)}
                </p>
                <p style="margin: 6px 0 0; color: ${brand.muted}; font-family: ${brand.font}; font-size: 12px; line-height: 1.65;">
                  Operational support, crew coordination, aircraft movement, and flight department support.
                </p>
                <p style="margin: 8px 0 0; font-family: ${brand.font}; font-size: 12px; line-height: 1.65;">
                  <a href="mailto:${escapeHtml(AMG_EMAIL_BRAND.contactEmail)}" style="color: ${brand.accent}; text-decoration: none;">${escapeHtml(AMG_EMAIL_BRAND.contactEmail)}</a>
                  <span style="color: ${brand.faint};">&nbsp;·&nbsp;</span>
                  <a href="${escapeHtml(siteUrl)}" style="color: ${brand.accent}; text-decoration: none;">${escapeHtml(AMG_EMAIL_BRAND.websiteLabel)}</a>
                </p>
                <p style="margin: 12px 0 0; color: ${brand.faint}; font-family: ${brand.font}; font-size: 11px; line-height: 1.6;">
                  This message may contain operationally sensitive information. If you received it in error, delete it and notify ${escapeHtml(AMG_EMAIL_BRAND.companyName)}.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin: 16px 0 0; color: ${brand.faint}; font-family: ${brand.font}; font-size: 11px;">
            © ${new Date().getFullYear()} ${escapeHtml(AMG_EMAIL_BRAND.companyName)}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function publicSupportRequestAdminEmail(input: PublicSupportRequestEmailInput) {
  return amgEmailLayout({
    previewText: `New public support request ${input.reference} from ${input.requesterName}`,
    eyebrow: "New Public Support Request",
    title: `${input.requesterName} submitted a support request`,
    intro:
      "A new request was submitted through the AMG Aviation Group website. Review the operational details below and follow up through the portal or by direct reply.",
    reference: input.reference,
    status: "Submitted",
    sections: [
      {
        title: "Requester",
        rows: [
          { label: "Name", value: input.requesterName },
          { label: "Email", value: input.email },
          { label: "Phone", value: input.phone },
          { label: "Preferred Contact", value: input.preferredContact || "Not specified" },
          { label: "Organization", value: input.organization },
        ],
      },
      {
        title: "Aircraft / Mission",
        rows: [
          { label: "Category", value: input.requestedCategory },
          { label: "Aircraft", value: input.aircraft },
          { label: "Tail Number", value: input.tailNumber },
          { label: "Base", value: input.aircraftBase },
          { label: "Route", value: [input.departure, input.arrival].filter(Boolean).join(" → ") },
          { label: "Timing", value: input.timing },
        ],
      },
      {
        title: "Operational Summary",
        body: input.operationalSummary || "No operational summary provided.",
      },
      {
        title: "Category Details",
        body: input.categoryDetails || "No category-specific details provided.",
      },
    ],
    cta: input.portalUrl
      ? {
          label: "Open Portal",
          href: input.portalUrl,
        }
      : undefined,
    footerNote:
      "Replying to this email should reply directly to the requester if Reply-To was set by the application.",
  });
}

export function publicSupportRequestClientConfirmationEmail(input: ClientConfirmationEmailInput) {
  return amgEmailLayout({
    previewText: `AMG received your request ${input.reference}`,
    eyebrow: "Request Received",
    title: "We received your AMG Aviation Group request",
    intro:
      "Your request has been received by AMG Aviation Group. Our team will review the operational details and respond through the appropriate contact method.",
    reference: input.reference,
    status: "Received",
    sections: [
      {
        title: "Request Summary",
        rows: [
          { label: "Name", value: input.requesterName },
          { label: "Category", value: input.requestedCategory },
          { label: "Requested Timing", value: input.timing || "Not specified" },
          { label: "Reference", value: input.reference },
        ],
      },
      {
        title: "Next Steps",
        body:
          "AMG Operations will review the aircraft, requested timing, service category, and support scope submitted. If additional information is needed, AMG will contact you using your preferred contact method. Availability, scope, and any operational next actions will be confirmed before any mission, crew assignment, aircraft movement, or operational support is accepted.",
      },
    ],
    cta: input.portalUrl
      ? {
          label: "Visit AMG Aviation Group",
          href: input.portalUrl,
        }
      : undefined,
    footerNote:
      "This confirmation does not constitute acceptance of a mission, crew assignment, operational release, or commitment to provide services. AMG will confirm availability and scope separately.",
  });
}

export function portalNotificationEmail(input: PortalNotificationEmailInput) {
  return amgEmailLayout({
    previewText: input.title,
    eyebrow: "Portal Notification",
    title: input.title,
    intro: input.body || "A new portal notification requires review.",
    reference: input.reference,
    status: input.eventType || "Notification",
    sections: [
      {
        title: "Details",
        body: input.body || "No additional details provided.",
      },
    ],
    cta: input.portalUrl
      ? {
          label: "Open Portal",
          href: input.portalUrl,
        }
      : undefined,
  });
}

export function accessRequestAdminEmail(input: {
  name: string;
  email: string;
  organization?: string | null;
  requestedRole?: string | null;
  reason?: string | null;
  portalUrl?: string | null;
}) {
  return amgEmailLayout({
    previewText: `New portal access request from ${input.name}`,
    eyebrow: "Portal Access Request",
    title: `${input.name} requested portal access`,
    intro:
      "A user requested access to the AMG portal. Review the request before approving any account role or operational permissions.",
    status: "Pending Review",
    sections: [
      {
        title: "Requester",
        rows: [
          { label: "Name", value: input.name },
          { label: "Email", value: input.email },
          { label: "Organization", value: input.organization },
          { label: "Requested Role", value: input.requestedRole },
        ],
      },
      {
        title: "Reason",
        body: input.reason || "No reason provided.",
      },
    ],
    cta: input.portalUrl
      ? {
          label: "Review Access Request",
          href: input.portalUrl,
        }
      : undefined,
  });
}

export function credentialSubmissionAdminEmail(input: {
  crewName: string;
  credentialType?: string | null;
  aircraftType?: string | null;
  expirationDate?: string | null;
  portalUrl?: string | null;
}) {
  return amgEmailLayout({
    previewText: `Credential submitted by ${input.crewName}`,
    eyebrow: "Credential Submission",
    title: `${input.crewName} submitted a credential`,
    intro:
      "A pilot or crew member submitted credential information. Review the document and confirm compliance before assigning operational work.",
    status: "Review Required",
    sections: [
      {
        title: "Credential",
        rows: [
          { label: "Crew Member", value: input.crewName },
          { label: "Credential Type", value: input.credentialType },
          { label: "Aircraft Type", value: input.aircraftType },
          { label: "Expiration Date", value: input.expirationDate },
        ],
      },
    ],
    cta: input.portalUrl
      ? {
          label: "Review Credential",
          href: input.portalUrl,
        }
      : undefined,
  });
}
