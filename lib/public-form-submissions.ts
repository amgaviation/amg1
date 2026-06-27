import "server-only";

import { AMG_EMAIL_BRAND } from "@/lib/email/config";
import { amgEmailLayout } from "@/lib/portal/email-templates";
import { sendEmail } from "@/lib/portal/notification-delivery";
import { ACKNOWLEDGMENT_TEXT, COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import {
  recordComplianceEvidence,
  recordConsentEvent,
  recordSupportRequestDisclaimerAcknowledgment,
} from "@/lib/compliance/evidence";
import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  publicFormDatabaseRow,
  type NormalizedPublicFormSubmission,
  type PublicFormPayload,
} from "@/lib/public-form-normalization";
import {
  createSupportRequestFromFormSubmission,
  isOperationalSupportRequest,
} from "@/lib/public-support-request-routing";
import { notifyAdmins } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";

export { normalizeContactSubmission, normalizeSupportSubmission };

export const FORM_SUBMISSION_INBOX = AMG_EMAIL_BRAND.contactEmail;

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

function submittedValue(value: string | number | boolean | string[] | null | undefined) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) {
    const values = value.filter((item) => item.trim());
    return values.length ? values.join(", ") : null;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function payloadText(payload: PublicFormPayload) {
  return Object.entries(payload)
    .map(([key, value]) => ({ label: labelize(key), value: submittedValue(value) }))
    .filter((row): row is { label: string; value: string } => Boolean(row.value))
    .map((row) => `${row.label}: ${row.value}`)
    .join("\n");
}

function payloadRows(payload: PublicFormPayload) {
  return Object.entries(payload)
    .map(([key, value]) => ({
      label: labelize(key),
      value: submittedValue(value),
    }))
    .filter((row): row is { label: string; value: string } => Boolean(row.value));
}

function row(label: string, value?: string | number | boolean | null) {
  const rendered = submittedValue(value);
  return rendered ? { label, value: rendered } : null;
}

function compactRows(rows: Array<{ label: string; value: string } | null>) {
  return rows.filter((item): item is { label: string; value: string } => Boolean(item));
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
  return compactRows([
    row("Submission ID", id),
    row("Source Page", submission.sourcePage),
    row("Submission Type", submission.submissionType === "support_request" ? "Support Request" : "Contact Inquiry"),
    row("Inquiry / Support Type", submission.supportType ?? submission.serviceInterest),
  ]);
}

function buildInternalEmail(submission: NormalizedPublicFormSubmission, id: string) {
  const rows = normalizedRows(submission, id);
  const submittedRows = payloadRows(submission.payload);
  const payload = payloadText(submission.payload);
  const text = [
    subjectFor(submission),
    "",
    ...rows.map((row) => `${row.label}: ${row.value}`),
    "",
    "Submitted Fields:",
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
        title: "Submission Metadata",
        rows,
      },
      {
        title: "Submitted Fields",
        rows: submittedRows,
      },
    ],
    footerNote:
      "Replying to this notification should reply to the submitter when the email provider accepts the Reply-To header.",
  });

  return { text, html };
}

function buildConfirmationEmail(submission: NormalizedPublicFormSubmission, id: string) {
  const requestedCategory = submission.supportType ?? submission.serviceInterest ?? "Website inquiry";
  const submittedRows = payloadRows(submission.payload);
  const text = [
    `AMG received your ${requestedCategory}.`,
    "",
    `Reference: ${id}`,
    "",
    "Submitted Fields:",
    payloadText(submission.payload) || "No payload fields were captured.",
    "",
    "AMG will review the request before acceptance. Review may depend on support scope, aircraft status, crew availability, owner/operator approvals, route and airport constraints, weather, maintenance status, documentation, and operating conditions.",
    "",
    "AMG Aviation does not provide emergency response services through this website or portal. Time-sensitive requests remain subject to review, availability, and operational conditions.",
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
        rows: compactRows([
          row("Reference", id),
          row("Category", requestedCategory),
        ]),
      },
      {
        title: "Submitted Fields",
        rows: submittedRows,
      },
      {
        title: "Review Required",
        body:
          "AMG will review the request based on support scope, aircraft status, crew availability, applicable approvals, route and airport constraints, weather, maintenance status, documentation, and operating conditions. AMG will follow up if additional information is needed.",
      },
      {
        title: "No Emergency Response",
        body:
          "AMG Aviation does not provide emergency response services through this website or portal. Time-sensitive requests remain subject to review, availability, and operational conditions.",
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

function missingSchemaColumn(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const err = error as { code?: string; message?: string };
  if (err.code !== "PGRST204" || !err.message) return null;
  return err.message.match(/'([^']+)' column/)?.[1] ?? null;
}

function notNullColumn(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const err = error as { code?: string; message?: string };
  if (err.code !== "23502" || !err.message) return null;
  return err.message.match(/null value in column "([^"]+)"/)?.[1] ?? null;
}

function booleanTypeSyntaxError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return err.code === "22P02" && Boolean(err.message?.includes("invalid input syntax for type boolean"));
}

function booleanFromText(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on", "accepted", "checked"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "not accepted", "unchecked"].includes(normalized)) return false;
  return null;
}

const BOOLEAN_COMPATIBILITY_COLUMNS = [
  "acknowledgement",
  "marketing_consent",
  "sms_consent",
  "email_sent",
  "internal_email_sent",
  "confirmation_email_sent",
];

function booleanCompatibilityColumn(error: unknown, row: Record<string, unknown>) {
  if (!booleanTypeSyntaxError(error)) return null;

  for (const column of BOOLEAN_COMPATIBILITY_COLUMNS) {
    const value = row[column];
    if (typeof value !== "string") continue;

    const booleanValue = booleanFromText(value);
    if (booleanValue !== null) return { column, value: booleanValue };
  }

  return null;
}

const NOT_NULL_COMPATIBILITY_VALUES: Record<string, unknown> = {
  marketing_consent: false,
  sms_consent: false,
};

async function insertSubmissionRow(db: any, row: Record<string, unknown>) {
  const insertRow = { ...row };
  const omittedColumns: string[] = [];
  const coercedColumns: string[] = [];
  const defaultedColumns: string[] = [];
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await db
      .from("contact_form_submissions")
      .insert(insertRow)
      .select("id")
      .single();

    if (!error && data?.id) {
      return { data, error: null, omittedColumns, coercedColumns, defaultedColumns };
    }

    lastError = error;
    const missingColumn = missingSchemaColumn(error);
    if (missingColumn && missingColumn in insertRow) {
      delete insertRow[missingColumn];
      omittedColumns.push(missingColumn);
      continue;
    }

    const requiredColumn = notNullColumn(error);
    if (
      requiredColumn
      && insertRow[requiredColumn] === null
      && Object.hasOwn(NOT_NULL_COMPATIBILITY_VALUES, requiredColumn)
    ) {
      insertRow[requiredColumn] = NOT_NULL_COMPATIBILITY_VALUES[requiredColumn];
      defaultedColumns.push(requiredColumn);
      continue;
    }

    const booleanCoercion = booleanCompatibilityColumn(error, insertRow);
    if (booleanCoercion) {
      insertRow[booleanCoercion.column] = booleanCoercion.value;
      coercedColumns.push(booleanCoercion.column);
      continue;
    }

    return { data, error, omittedColumns, coercedColumns, defaultedColumns };
  }

  return { data: null, error: lastError, omittedColumns, coercedColumns, defaultedColumns };
}

async function updateWithSchemaDriftRetry(
  table: any,
  patch: Record<string, unknown>,
  id: string,
) {
  const updatePatch = { ...patch };
  const omittedColumns: string[] = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await table.update(updatePatch).eq("id", id);
    if (!error) return { error: null, omittedColumns };

    const missingColumn = missingSchemaColumn(error);
    if (!missingColumn || !(missingColumn in updatePatch)) {
      return { error, omittedColumns };
    }

    delete updatePatch[missingColumn];
    omittedColumns.push(missingColumn);
  }

  return { error: new Error("Schema drift retry limit exceeded"), omittedColumns };
}

async function markEmailDelivery(
  db: any,
  id: string,
  internal: { sent: boolean; error?: string | null },
  confirmation: { sent: boolean; error?: string | null },
) {
  const errors = [internal.error, confirmation.error].filter(Boolean).join("; ") || null;
  const now = new Date().toISOString();

  const { error, omittedColumns } = await updateWithSchemaDriftRetry(
    db.from("contact_form_submissions"),
    {
      email_sent: internal.sent,
      email_sent_at: internal.sent ? now : null,
      email_error: errors,
      internal_email_sent: internal.sent,
      internal_email_sent_at: internal.sent ? now : null,
      confirmation_email_sent: confirmation.sent,
      confirmation_email_sent_at: confirmation.sent ? now : null,
      updated_at: now,
    },
    id,
  );

  if (omittedColumns.length) {
    console.warn("Public form submission email status used schema drift fallback", {
      id,
      omittedColumns,
    });
  }

  if (error) {
    console.warn("Public form submission email status update failed", {
      id,
      error: errorSummary(error),
    });
  }
}

async function recordPublicFormConsents(
  db: any,
  submission: NormalizedPublicFormSubmission,
  id: string,
  context?: PublicFormRequestContext,
) {
  const rows = [
    submission.marketingConsent === null
      ? null
      : {
          email: submission.email,
          phone: submission.phone || null,
          requester_name: submission.requesterName,
          consent_channel: "email",
          consent_status: submission.marketingConsent ? "opted_in" : "not_opted_in",
          consent_source: submission.submissionType,
          consent_text: "Optional AMG email updates checkbox on public website form.",
          consent_version: "2026-06-20",
          related_submission_id: id,
          source_url: context?.sourceUrl ?? null,
          user_agent: context?.userAgent ?? null,
        },
    submission.smsConsent === null
      ? null
      : {
          email: submission.email,
          phone: submission.phone || null,
          requester_name: submission.requesterName,
          consent_channel: "sms",
          consent_status: submission.smsConsent ? "opted_in" : "not_opted_in",
          consent_source: submission.submissionType,
          consent_text: "Optional AMG SMS consent checkbox on public website form. Message and data rates may apply.",
          consent_version: "2026-06-20",
          related_submission_id: id,
          source_url: context?.sourceUrl ?? null,
          user_agent: context?.userAgent ?? null,
        },
  ].filter(Boolean);

  if (!rows.length) return;

  const { error } = await db.from("marketing_consents").insert(rows);
  if (error) {
    console.warn("Public form consent history insert failed", {
      id,
      sourcePage: submission.sourcePage,
      submissionType: submission.submissionType,
      error: errorSummary(error),
    });
  }

  if (submission.marketingConsent !== null) {
    await recordConsentEvent({
      actorEmail: submission.email,
      actorRole: "public",
      audience: "public_form_submitter",
      eventType: submission.marketingConsent ? "marketing_consent_given" : "marketing_consent_revoked",
      relatedRecordType: "contact_form_submission",
      relatedRecordId: id,
      policyKey: "email-communications",
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: "Optional AMG email updates checkbox on public website form.",
      metadata: { sourcePage: submission.sourcePage, submissionType: submission.submissionType },
    });
  }

  if (submission.smsConsent !== null) {
    await recordConsentEvent({
      actorEmail: submission.email,
      actorRole: "public",
      audience: "public_form_submitter",
      eventType: submission.smsConsent ? "sms_consent_given" : "sms_consent_revoked",
      relatedRecordType: "contact_form_submission",
      relatedRecordId: id,
      policyKey: "sms-terms",
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: "Optional AMG SMS consent checkbox on public website form.",
      metadata: { sourcePage: submission.sourcePage, submissionType: submission.submissionType },
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
  const { data, error, omittedColumns, coercedColumns, defaultedColumns } = await insertSubmissionRow(db as any, row);

  if (error || !data?.id) {
    console.error("Public form submission database insert failed", {
      sourcePage: submission.sourcePage,
      submissionType: submission.submissionType,
      normalizedKeys,
      error: errorSummary(error),
    });
    return { ok: false, reason: "database", message: "Database insert failed" };
  }

  if (omittedColumns.length || coercedColumns.length || defaultedColumns.length) {
    console.warn("Public form submission stored with schema drift fallback", {
      sourcePage: submission.sourcePage,
      submissionType: submission.submissionType,
      omittedColumns,
      coercedColumns,
      defaultedColumns,
    });
  }

  const id = data.id as string;
  let routedSupportRequest: { missionId: string; missionRef: string | null } | null = null;

  if (isOperationalSupportRequest(submission)) {
    const routing = await createSupportRequestFromFormSubmission(db as any, submission, id);

    if (!routing.ok) {
      console.error("Public support request routing failed", {
        id,
        sourcePage: submission.sourcePage,
        submissionType: submission.submissionType,
        stage: routing.stage,
        error: errorSummary(routing.error),
      });

      await updateWithSchemaDriftRetry(
        (db as any).from("contact_form_submissions"),
        {
          admin_notes: `Support request routing failed at ${routing.stage}. Review this submission before contacting the requester.`,
          updated_at: new Date().toISOString(),
        },
        id,
      );

      return { ok: false, reason: "database", message: "Support request routing failed" };
    }

    routedSupportRequest = {
      missionId: routing.missionId,
      missionRef: routing.missionRef,
    };

    await notifyAdmins({
      title: "New support request",
      body: `${submission.requesterName} submitted ${routing.missionRef ?? "a new support request"}${submission.supportType ? ` (${submission.supportType})` : ""}.`,
      type: "mission_submitted",
      entityType: "mission",
      entityId: routing.missionId,
      replyTo: submission.email,
    });

    await recordSupportRequestDisclaimerAcknowledgment({
      actorEmail: submission.email,
      actorRole: "public",
      audience: "public_form_submitter",
      relatedRecordType: "contact_form_submission",
      relatedRecordId: id,
      policyKey: POLICY_KEYS.missionAcceptance,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: ACKNOWLEDGMENT_TEXT.supportRequest,
      metadata: { sourcePage: submission.sourcePage, supportType: submission.supportType },
    });
  } else {
    await recordComplianceEvidence({
      actorEmail: submission.email,
      actorRole: "public",
      audience: "public_form_submitter",
      eventType: "privacy_acknowledged",
      eventArea: "public_site",
      relatedRecordType: "contact_form_submission",
      relatedRecordId: id,
      policyKey: POLICY_KEYS.privacy,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: "Contact form submitter acknowledged AMG privacy and non-acceptance notices.",
      metadata: { sourcePage: submission.sourcePage, serviceInterest: submission.serviceInterest },
    });
  }
  await recordComplianceEvidence({
    actorEmail: submission.email,
    actorRole: "public",
    audience: "public_form_submitter",
    eventType: submission.submissionType === "support_request" ? "support_request_submitted" : "privacy_acknowledged",
    eventArea: submission.submissionType === "support_request" ? "request_support" : "public_site",
    relatedRecordType: routedSupportRequest ? "mission" : "contact_form_submission",
    relatedRecordId: routedSupportRequest?.missionId ?? id,
    policyVersion: COMPLIANCE_POLICY_VERSION,
    metadata: {
      sourcePage: submission.sourcePage,
      submissionType: submission.submissionType,
      sourceSubmissionId: routedSupportRequest ? id : undefined,
      missionRef: routedSupportRequest?.missionRef ?? undefined,
    },
  });
  await recordPublicFormConsents(db as any, submission, id, context);
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
