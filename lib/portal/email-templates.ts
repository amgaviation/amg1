import "server-only";

import { amgEmailLayout } from "@/lib/email/templates";

export { amgEmailLayout };

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
    portalUrl: input.portalUrl,
    showPortalCta: Boolean(input.portalUrl),
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
