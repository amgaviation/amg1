import "server-only";

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

function row(label: string, value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "";
  return `
    <tr>
      <td style="padding: 10px 0; color: #7a746a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; vertical-align: top; width: 170px;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 10px 0; color: #1e1c18; font-size: 14px; line-height: 1.5; vertical-align: top;">
        ${formatMultiline(String(value))}
      </td>
    </tr>
  `;
}

export function amgEmailLayout(input: BaseEmailTemplateInput) {
  const previewText = input.previewText || input.title;

  const sectionsHtml = (input.sections ?? [])
    .map((section) => {
      const rowsHtml = section.rows
        ?.map((item) => row(item.label, item.value))
        .join("");

      const bodyHtml = section.body
        ? `<p style="margin: 0; color: #2d2a24; font-size: 14px; line-height: 1.65;">${formatMultiline(section.body)}</p>`
        : "";

      return `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 22px; border-top: 1px solid #e8e2d7;">
          ${
            section.title
              ? `<tr>
                  <td colspan="2" style="padding-top: 18px; padding-bottom: 6px;">
                    <h2 style="margin: 0; color: #1e1c18; font-size: 13px; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.12em;">
                      ${escapeHtml(section.title)}
                    </h2>
                  </td>
                </tr>`
              : ""
          }
          ${bodyHtml ? `<tr><td colspan="2" style="padding-top: 10px;">${bodyHtml}</td></tr>` : ""}
          ${rowsHtml ?? ""}
        </table>
      `;
    })
    .join("");

  const ctaHtml = input.cta
    ? `
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
        <tr>
          <td style="border-radius: 999px; background: #1e1c18;">
            <a href="${escapeHtml(input.cta.href)}" style="display: inline-block; padding: 13px 20px; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; letter-spacing: 0.04em;">
              ${escapeHtml(input.cta.label)}
            </a>
          </td>
        </tr>
      </table>
    `
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f5f1ea;">
    <div style="display: none; overflow: hidden; line-height: 1px; opacity: 0; max-height: 0; max-width: 0;">
      ${escapeHtml(previewText)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f5f1ea; padding: 32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; background: #ffffff; border: 1px solid #e6ded2; border-radius: 20px; overflow: hidden;">
            <tr>
              <td style="padding: 26px 30px; background: #171614;">
                <div style="color: #d6c3a1; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;">
                  AMG Aviation Group
                </div>
                <div style="margin-top: 8px; color: #ffffff; font-size: 22px; line-height: 1.25; font-weight: 600;">
                  ${escapeHtml(input.eyebrow || "Operational Notification")}
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding: 32px 30px 34px;">
                ${
                  input.status || input.reference
                    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px;">
                        <tr>
                          <td>
                            ${
                              input.reference
                                ? `<span style="display: inline-block; margin-right: 8px; padding: 7px 10px; border-radius: 999px; background: #f3eadb; color: #4f4028; font-size: 12px; font-weight: 600;">
                                    Ref ${escapeHtml(input.reference)}
                                  </span>`
                                : ""
                            }
                            ${
                              input.status
                                ? `<span style="display: inline-block; padding: 7px 10px; border-radius: 999px; background: #f7f4ef; color: #5f5a51; font-size: 12px; font-weight: 600;">
                                    ${escapeHtml(input.status)}
                                  </span>`
                                : ""
                            }
                          </td>
                        </tr>
                      </table>`
                    : ""
                }

                <h1 style="margin: 0; color: #1e1c18; font-size: 24px; line-height: 1.25; font-weight: 650;">
                  ${escapeHtml(input.title)}
                </h1>

                ${
                  input.intro
                    ? `<p style="margin: 14px 0 0; color: #5f5a51; font-size: 15px; line-height: 1.65;">
                        ${formatMultiline(input.intro)}
                      </p>`
                    : ""
                }

                ${sectionsHtml}
                ${ctaHtml}

                ${
                  input.footerNote
                    ? `<p style="margin: 28px 0 0; padding-top: 18px; border-top: 1px solid #eee7dc; color: #7a746a; font-size: 12px; line-height: 1.6;">
                        ${formatMultiline(input.footerNote)}
                      </p>`
                    : ""
                }
              </td>
            </tr>

            <tr>
              <td style="padding: 22px 30px; background: #fbf8f3; border-top: 1px solid #e8e2d7;">
                <p style="margin: 0; color: #7a746a; font-size: 12px; line-height: 1.6;">
                  AMG Aviation Group LLC<br />
                  Operational support, crew coordination, aircraft movement, and flight department support.
                </p>
                <p style="margin: 12px 0 0; color: #9a9285; font-size: 11px; line-height: 1.6;">
                  This message may contain operationally sensitive information. If you received it in error, delete it and notify AMG Aviation Group.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin: 18px 0 0; color: #9a9285; font-size: 11px;">
            © ${new Date().getFullYear()} AMG Aviation Group LLC
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
