import "server-only";

import { createHash } from "crypto";
import { amgEmailLayout } from "@/lib/portal/email-templates";
import { absolutePortalUrl, OPERATIONAL_EMAIL_DISCLAIMER } from "@/lib/email/config";
import { sendEmail, type DeliveryResult } from "@/lib/portal/notification-delivery";

export const RESEND_AUTOMATION_EVENTS = {
  accessRequested: "access.requested",
  accessApproved: "access.approved",
  accessDenied: "access.denied",
  accessWaitlisted: "access.waitlisted",
  supportRequested: "support.requested",
  supportStatusChanged: "support.status_changed",
  pilotApplicationReceived: "pilot_application.received",
  pilotApplicationStatusChanged: "pilot_application.status_changed",
  documentRequested: "document.requested",
  documentExpiringSoon: "document.expiring_soon",
  missionStatusChanged: "mission.status_changed",
  crewAssigned: "crew.assigned",
  quoteSent: "quote.sent",
  quoteApproved: "quote.approved",
  invoiceSent: "invoice.sent",
  invoiceOverdue: "invoice.overdue",
  paymentReceived: "payment.received",
  postMissionCloseout: "post_mission.closeout",
} as const;

export type ResendAutomationEventName =
  (typeof RESEND_AUTOMATION_EVENTS)[keyof typeof RESEND_AUTOMATION_EVENTS];

export type AutomationPayload = {
  recipientEmail: string;
  recipientName?: string | null;
  recordId: string;
  reference?: string | null;
  status?: string | null;
  actionUrl?: string | null;
  summary?: string | null;
};

export type EmitAutomationInput = {
  event: ResendAutomationEventName;
  payload: AutomationPayload;
  subject?: string;
  previewText?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  idempotencyKey?: string;
};

function label(value: string) {
  return value.replace(/[._]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function automationIdempotencyKey(event: ResendAutomationEventName, recordId: string, recipientEmail: string) {
  return createHash("sha256")
    .update([event, recordId, recipientEmail.trim().toLowerCase()].join(":"))
    .digest("hex");
}

export function automationEmailCopy(input: EmitAutomationInput) {
  const eventLabel = label(input.event);
  const heading = input.heading ?? eventLabel;
  const intro =
    input.body ??
    input.payload.summary ??
    `AMG Aviation Group has a ${eventLabel.toLowerCase()} update for your review.`;
  const actionUrl = input.payload.actionUrl ?? absolutePortalUrl("/portal");
  const subject = input.subject ?? `AMG Aviation Group: ${eventLabel}`;
  const text = [
    input.payload.recipientName ? `Hello ${input.payload.recipientName},` : "Hello,",
    intro,
    input.payload.reference ? `Reference: ${input.payload.reference}` : null,
    input.payload.status ? `Status: ${input.payload.status}` : null,
    actionUrl ? `Open AMG Connect: ${actionUrl}` : null,
    OPERATIONAL_EMAIL_DISCLAIMER,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    subject,
    text,
    html: amgEmailLayout({
      previewText: input.previewText ?? subject,
      eyebrow: "AMG Connect",
      title: heading,
      intro,
      reference: input.payload.reference ?? undefined,
      status: input.payload.status ?? label(input.event),
      sections: [
        {
          title: "Update Details",
          rows: [
            { label: "Event", value: label(input.event) },
            { label: "Reference", value: input.payload.reference },
            { label: "Status", value: input.payload.status },
          ],
        },
        {
          title: "Operational Note",
          body:
            "AMG Aviation Group provides aviation operations support and coordination. The aircraft owner/operator and PIC retain operational control and go/no-go authority.",
        },
      ],
      cta: actionUrl ? { label: input.ctaLabel ?? "Open AMG Connect", href: actionUrl } : undefined,
      footerNote: OPERATIONAL_EMAIL_DISCLAIMER,
    }),
  };
}

export async function emitResendAutomationEvent(input: EmitAutomationInput): Promise<DeliveryResult> {
  const copy = automationEmailCopy(input);
  return sendEmail({
    to: input.payload.recipientEmail,
    subject: copy.subject,
    text: copy.text,
    html: copy.html,
    idempotencyKey:
      input.idempotencyKey ??
      automationIdempotencyKey(input.event, input.payload.recordId, input.payload.recipientEmail),
    eventType: input.event,
  });
}
