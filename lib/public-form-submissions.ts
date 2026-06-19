import "server-only";

import { amgEmailLayout } from "@/lib/portal/email-templates";
import { sendEmail } from "@/lib/portal/notification-delivery";
import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  publicFormDatabaseRow,
  type NormalizedPublicFormSubmission,
  type PublicFormPayload,
} from "@/lib/public-form-normalization";
import { createServiceClient } from "@/lib/supabase/server";

export { normalizeContactSubmission, normalizeSupportSubmission };

export const FORM_SUBMISSION_INBOX = "information@amgaviationgroup.com";

export type PublicFormRequestContext = {
  sourceUrl?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
};

export type SubmissionResult =
  | { ok: true; id: string; emailWarnings?: string[] }
  | { ok: false; reason: "database"; message: string };

function labelize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function display(value?: string | number | boolean | null) {
  if (value === undefined || value === null || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function payloadText(payload: PublicFormPayload) {
  return Object.entries(payload)
    .map(([key, value]) => {
      const rendered = Array.isArray(value) ? value.join(", ") : display(value);
      return `${labelize(key)}: ${rendered}`;
    })
    .join("\n");
}

function payloadRows(payload: PublicFormPayload) {
  return Object.entries(payload).map(([key, value]) => ({
    label: labelize(key),
    value: Array.isArray(value) ? value.join(", ") : display(value),
  }));
}

function subjectFor(submission: NormalizedPublicFormSubmission) {
  if (submission.submissionType === "support_request") {
    return submission.supportType
      ? `New AMG Support Request - ${submission.supportType}`
      : "New AMG Support Request";
  }
  return submission.serviceInterest
    ? `New AMG Contact Inquiry - ${submission.serviceInterest}`
    : "New AMG Contact Inquiry";
}

function normalizedRows(submission: NormalizedPublicFormSubmission, id: string) {
  return [
    { label: "Submission ID", value: id },
    { label: "Source Page", value: submission.sourcePage },
    { label: "Submission Type", value: submission.submissionType },
    { label: "Submitter Name", value: submission.requesterName },
    { label: "Email", value: submission.email },
    { label: "Phone", value: submission.phone },
    { label: "Company / Organization", value: submission.company ?? submission.organization },
    { label: "Aircraft", value: submission.aircraft },
    { label: "Aircraft Category", value: submission.aircraftCategory },
    { label: "Aircraft Status", value: submission.aircraftStatus },
    { label: "Tail Number", value: submission.tailNumber },
    { label: "Requested Support / Service", value: submission.supportType ?? submission.serviceInterest },
    { label: "Crew Need", value: submission.crewNeed },
    { label: "Route", value: submission.route },
    { label: "Departure", value: submission.departureAirport },
    { label: "Arrival", value: submission.arrivalAirport },
    { label: "Timing", value: submission.timing },
    { label: "Requested Date", value: submission.requestedDate },
    { label: "Requested Time", value: submission.requestedTime },
    { label: "Passenger Context", value: submission.passengerContext },
    { label: "Acknowledgement", value: submission.acknowledgement },
    { label: "Marketing Consent", value: submission.marketingConsent },
  ].map((row) => ({ ...row, value: display(row.value) }));
}

function buildInternalEmail(submission: NormalizedPublicFormSubmission, id: string) {
  const rows = normalizedRows(submission, id);
  const payload = payloadText(submission.payload);
  const text = [
    subjectFor(submission),
    "",
    ...rows.map((row) => `${row.label}: ${display(row.value)}`),
    "",
    "Message / Notes:",
    display(submission.message),
    "",
    "Full Payload:",
    payload || "No payload fields were captured.",
  ].join("\n");

  const html = amgEmailLayout({
    previewText: `${subjectFor(submission)} from ${submission.requesterName}`,
    eyebrow: "Website Form Submission",
    title: subjectFor(submission),
    intro:
      "A public website form was submitted. Review the details below before accepting, scheduling, assigning crew, or approving any operational next step.",
    reference: id,
    status: "New",
    sections: [
      {
        title: "Submission Details",
        rows,
      },
      {
        title: "Message / Notes",
        body: submission.message || "No message or notes provided.",
      },
      {
        title: "Full Payload",
        rows: payloadRows(submission.payload),
      },
    ],
    footerNote:
      "Replying to this notification should reply to the submitter when the email provider accepts the Reply-To header.",
  });

  return { text, html };
}

function buildConfirmationEmail(submission: NormalizedPublicFormSubmission, id: string) {
  const requestedCategory = submission.supportType ?? submission.serviceInterest ?? "Website inquiry";
  const text = [
    `AMG received your ${requestedCategory}.`,
    "",
    `Reference: ${id}`,
    "",
    "AMG will review the request before acceptance. Review may depend on support scope, aircraft status, crew availability, owner/operator approvals, route and airport constraints, weather, maintenance status, documentation, and operating conditions.",
    "",
    "This confirmation does not mean the request is accepted, confirmed, scheduled, operationally approved, or binding.",
  ].join("\n");

  const html = amgEmailLayout({
    previewText: `AMG received your submission ${id}`,
    eyebrow: "Request Received",
    title: "AMG received your website submission",
    intro:
      "Thank you for contacting AMG Aviation Group. Your submission has been received and will be reviewed by AMG before any request is accepted, scheduled, assigned, or operationally approved.",
    reference: id,
    status: "Received",
    sections: [
      {
        title: "Submission Summary",
        rows: [
          { label: "Name", value: submission.requesterName },
          { label: "Category", value: requestedCategory },
          { label: "Aircraft", value: submission.aircraft },
          { label: "Tail Number", value: submission.tailNumber },
          { label: "Timing", value: submission.timing },
          { label: "Reference", value: id },
        ],
      },
      {
        title: "Review Required",
        body:
          "AMG will review the request based on support scope, aircraft status, crew availability, applicable approvals, route and airport constraints, weather, maintenance status, documentation, and operating conditions. AMG will follow up if additional information is needed.",
      },
    ],
    footerNote:
      "This confirmation does not constitute acceptance of a mission, crew assignment, aircraft movement, operational release, quote, or commitment to provide services. AMG will confirm availability, scope, approvals, and next steps separately.",
  });

  return { text, html };
}

function errorSummary(error: unknown) {
  if (!error || typeof error !== "object") return { message: String(error ?? "Unknown error") };
  const err = error as { code?: string; message?: string; details?: string };
  return {
    code: err.code,
    message: err.message,
    details: err.details,
  };
}

async function markEmailDelivery(
  db: any,
  id: string,
  internal: { sent: boolean; error?: string | null },
  confirmation: { sent: boolean; error?: string | null },
) {
  const errors = [internal.error, confirmation.error].filter(Boolean).join("; ") || null;
  const now = new Date().toISOString();

  const { error } = await db
    .from("contact_form_submissions")
    .update({
      email_sent: internal.sent,
      email_sent_at: internal.sent ? now : null,
      email_error: errors,
      internal_email_sent: internal.sent,
      internal_email_sent_at: internal.sent ? now : null,
      confirmation_email_sent: confirmation.sent,
      confirmation_email_sent_at: confirmation.sent ? now : null,
      updated_at: now,
    })
    .eq("id", id);

  if (error) {
    console.warn("Public form submission email status update failed", {
      id,
      error: errorSummary(error),
    });
  }
}

export async function saveAndEmailSubmission(
  submission: NormalizedPublicFormSubmission,
  context?: PublicFormRequestContext,
): Promise<SubmissionResult> {
  const db = await createServiceClient();
  const row = publicFormDatabaseRow(submission, context);
  const normalizedKeys = Object.keys(row).sort();
  const { data, error } = await (db as any)
    .from("contact_form_submissions")
    .insert(row)
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("Public form submission database insert failed", {
      sourcePage: submission.sourcePage,
      submissionType: submission.submissionType,
      normalizedKeys,
      error: errorSummary(error),
    });
    return { ok: false, reason: "database", message: "Database insert failed" };
  }

  const id = data.id as string;
  const internalEmail = buildInternalEmail(submission, id);
  const confirmationEmail = buildConfirmationEmail(submission, id);
  const [internalResult, confirmationResult] = await Promise.all([
    sendEmail({
      to: FORM_SUBMISSION_INBOX,
      subject: subjectFor(submission),
      text: internalEmail.text,
      html: internalEmail.html,
      replyTo: submission.email,
    }),
    sendEmail({
      to: submission.email,
      subject: "AMG Aviation Group received your submission",
      text: confirmationEmail.text,
      html: confirmationEmail.html,
    }),
  ]);

  const internalSent = internalResult.status === "sent";
  const confirmationSent = confirmationResult.status === "sent";
  await markEmailDelivery(
    db,
    id,
    { sent: internalSent, error: internalSent ? null : internalResult.error || internalResult.status },
    { sent: confirmationSent, error: confirmationSent ? null : confirmationResult.error || confirmationResult.status },
  );

  const warnings = [
    internalSent ? null : `internal email: ${internalResult.error || internalResult.status}`,
    confirmationSent ? null : `confirmation email: ${confirmationResult.error || confirmationResult.status}`,
  ].filter(Boolean) as string[];

  if (warnings.length) {
    console.warn("Public form submission stored but email delivery was incomplete", {
      id,
      sourcePage: submission.sourcePage,
      submissionType: submission.submissionType,
      warnings,
    });
  }

  return warnings.length ? { ok: true, id, emailWarnings: warnings } : { ok: true, id };
}
