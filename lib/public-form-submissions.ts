import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/portal/notification-delivery";

export const FORM_SUBMISSION_INBOX = "information@amgaviationgroup.com";

type SubmissionType = "contact_inquiry" | "support_request";

type SubmissionPayload = {
  sourcePage: "Contact" | "Request Support";
  submissionType: SubmissionType;
  inquiryType?: string;
  supportPath?: string;
  fullName: string;
  email: string;
  phone: string;
  companyOperator?: string;
  preferredContactMethod?: string;
  requesterRole?: string;
  aircraftCategory?: string;
  aircraftType?: string;
  tailNumber?: string;
  homeAirport?: string;
  currentAircraftLocation?: string;
  aircraftStatus?: string;
  timelineUrgency?: string;
  ownerOperatorApprovalStatus?: string;
  message?: string;
  requestedSupportSummary?: string;
  conditionalDetails: Record<string, string>;
  rawForm: Record<string, string>;
  acknowledgement: string;
};

export type SubmissionResult =
  | { ok: true; id: string }
  | { ok: false; reason: "validation" | "database" | "email"; message: string; id?: string };

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function formDataToRecord(formData: FormData) {
  const output: Record<string, string> = {};
  for (const [key, raw] of formData.entries()) {
    if (key === "website") continue;
    if (typeof raw === "string") output[key] = raw.trim();
  }
  return output;
}

function isEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

function labelize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function display(input?: string | null) {
  return input?.trim() || "Not provided";
}

function collectDetails(rawForm: Record<string, string>, excluded: string[]) {
  const blocked = new Set([...excluded, "acknowledgment"]);
  return Object.fromEntries(
    Object.entries(rawForm).filter(([key, fieldValue]) => !blocked.has(key) && fieldValue),
  );
}

export function normalizeContactSubmission(formData: FormData): SubmissionPayload | null {
  const rawForm = formDataToRecord(formData);
  const fullName = value(formData, "full_name");
  const email = value(formData, "email").toLowerCase();
  const phone = value(formData, "phone");
  const inquiryType = value(formData, "inquiry_type");
  const message = value(formData, "message");
  const acknowledgement = value(formData, "acknowledgment");

  if (!fullName || !isEmail(email) || !phone || !inquiryType || !message || acknowledgement !== "accepted") {
    return null;
  }

  return {
    sourcePage: "Contact",
    submissionType: "contact_inquiry",
    inquiryType,
    fullName,
    email,
    phone,
    companyOperator: value(formData, "company_operator"),
    preferredContactMethod: value(formData, "preferred_contact_method"),
    message,
    conditionalDetails: {},
    rawForm,
    acknowledgement,
  };
}

export function normalizeSupportSubmission(formData: FormData): SubmissionPayload | null {
  const rawForm = formDataToRecord(formData);
  const fullName = value(formData, "full_name");
  const email = value(formData, "email").toLowerCase();
  const phone = value(formData, "phone");
  const companyOperator = value(formData, "company_operator");
  const requesterRole = value(formData, "requester_role");
  const preferredContactMethod = value(formData, "preferred_contact_method");
  const aircraftCategory = value(formData, "aircraft_category");
  const aircraftType = value(formData, "aircraft_type");
  const homeAirport = value(formData, "home_airport");
  const aircraftStatus = value(formData, "aircraft_status");
  const supportPath = value(formData, "support_path");
  const requestedSupportSummary = value(formData, "requested_support_summary");
  const timelineUrgency = value(formData, "timeline_urgency");
  const ownerOperatorApprovalStatus = value(formData, "owner_operator_approval_status");
  const acknowledgement = value(formData, "acknowledgment");

  if (
    !fullName ||
    !isEmail(email) ||
    !phone ||
    !companyOperator ||
    !requesterRole ||
    !preferredContactMethod ||
    !aircraftCategory ||
    !aircraftType ||
    !homeAirport ||
    !aircraftStatus ||
    !supportPath ||
    !requestedSupportSummary ||
    !timelineUrgency ||
    !ownerOperatorApprovalStatus ||
    acknowledgement !== "accepted"
  ) {
    return null;
  }

  return {
    sourcePage: "Request Support",
    submissionType: "support_request",
    supportPath,
    fullName,
    email,
    phone,
    companyOperator,
    requesterRole,
    preferredContactMethod,
    aircraftCategory,
    aircraftType,
    tailNumber: value(formData, "tail_number").toUpperCase().replace(/\s+/g, ""),
    homeAirport,
    currentAircraftLocation: value(formData, "current_aircraft_location"),
    aircraftStatus,
    timelineUrgency,
    ownerOperatorApprovalStatus,
    message: value(formData, "additional_notes"),
    requestedSupportSummary,
    conditionalDetails: collectDetails(rawForm, [
      "full_name",
      "email",
      "phone",
      "company_operator",
      "requester_role",
      "preferred_contact_method",
      "aircraft_category",
      "aircraft_type",
      "tail_number",
      "home_airport",
      "current_aircraft_location",
      "aircraft_status",
      "support_path",
      "requested_support_summary",
      "desired_start_date",
      "desired_completion_timeline",
      "departure_current_airport",
      "destination_airport",
      "timeline_urgency",
      "owner_operator_approval_status",
      "known_limitations",
      "additional_notes",
    ]),
    rawForm,
    acknowledgement,
  };
}

function subjectFor(payload: SubmissionPayload) {
  if (payload.submissionType === "support_request") {
    return payload.supportPath
      ? `New AMG Support Request — ${payload.supportPath}`
      : "New AMG Support Request";
  }
  return payload.inquiryType
    ? `New AMG Contact Inquiry — ${payload.inquiryType}`
    : "New AMG Contact Inquiry";
}

function emailRows(payload: SubmissionPayload, submittedAt: string) {
  const base =
    payload.submissionType === "support_request"
      ? [
          ["Full Name", payload.fullName],
          ["Email", payload.email],
          ["Phone", payload.phone],
          ["Company / Operator", payload.companyOperator],
          ["Requester Role", payload.requesterRole],
          ["Preferred Contact Method", payload.preferredContactMethod],
          ["Aircraft Category", payload.aircraftCategory],
          ["Aircraft Type", payload.aircraftType],
          ["Tail Number", payload.tailNumber],
          ["Home Airport / Base", payload.homeAirport],
          ["Current Aircraft Location", payload.currentAircraftLocation],
          ["Aircraft Status", payload.aircraftStatus],
          ["Support Path", payload.supportPath],
          ["Requested Support Summary", payload.requestedSupportSummary],
          ["Desired Start Date", payload.rawForm.desired_start_date],
          ["Desired Completion Date or Timeline", payload.rawForm.desired_completion_timeline],
          ["Departure / Current Airport", payload.rawForm.departure_current_airport],
          ["Destination Airport", payload.rawForm.destination_airport],
          ["Timeline / Urgency", payload.timelineUrgency],
          ["Owner/Operator Approval Status", payload.ownerOperatorApprovalStatus],
          ["Known Limitations / Squawks / Inspection Concerns", payload.rawForm.known_limitations],
          ["Additional Notes", payload.message],
          ["Acknowledgment Status", payload.acknowledgement === "accepted" ? "Accepted" : payload.acknowledgement],
          ["Submitted At", submittedAt],
          ["Source Page", payload.sourcePage],
        ]
      : [
          ["Full Name", payload.fullName],
          ["Email", payload.email],
          ["Phone", payload.phone],
          ["Company / Operator", payload.companyOperator],
          ["Preferred Contact Method", payload.preferredContactMethod],
          ["Inquiry Type", payload.inquiryType],
          ["Message", payload.message],
          ["Acknowledgment Status", payload.acknowledgement === "accepted" ? "Accepted" : payload.acknowledgement],
          ["Submitted At", submittedAt],
          ["Source Page", payload.sourcePage],
        ];
  return base as [string, string | undefined][];
}

function buildEmail(payload: SubmissionPayload, submittedAt: string) {
  const rows = emailRows(payload, submittedAt);
  const allRows = Object.entries(payload.rawForm).map(([key, fieldValue]) => [labelize(key), fieldValue] as [string, string]);
  const conditionalRows = Object.entries(payload.conditionalDetails).map(([key, fieldValue]) => [labelize(key), fieldValue] as [string, string]);
  const text = [
    ...rows.map(([label, fieldValue]) => `${label}: ${display(fieldValue)}`),
    conditionalRows.length
      ? `Conditional Details:\n${conditionalRows.map(([label, fieldValue]) => `${label}: ${display(fieldValue)}`).join("\n")}`
      : null,
    `All Submitted Fields:\n${allRows.map(([label, fieldValue]) => `${label}: ${display(fieldValue)}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const renderRows = (items: [string, string | undefined][]) =>
    items
      .map(
        ([label, fieldValue]) => `
        <tr>
          <th style="width: 34%; padding: 10px 12px; text-align: left; vertical-align: top; border-bottom: 1px solid #e5e7eb; color: #334155; font-size: 13px;">${escapeHtml(label)}</th>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #0f172a; font-size: 13px; white-space: pre-wrap;">${escapeHtml(display(fieldValue))}</td>
        </tr>`,
      )
      .join("");

  const html = `
    <div style="margin: 0; padding: 0; background: #f6f8fb; font-family: Arial, sans-serif; color: #0f172a;">
      <div style="max-width: 760px; margin: 0 auto; padding: 28px 16px;">
        <div style="overflow: hidden; border: 1px solid #dbe3ec; border-radius: 14px; background: #ffffff;">
          <div style="padding: 24px 26px; background: #0b1a2b; color: #ffffff;">
            <p style="margin: 0 0 8px; color: #b6bdc5; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;">${escapeHtml(payload.sourcePage)}</p>
            <h1 style="margin: 0; font-size: 22px; line-height: 1.25;">${escapeHtml(subjectFor(payload))}</h1>
          </div>
          <div style="padding: 22px 26px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;"><tbody>${renderRows(rows)}</tbody></table>
            ${conditionalRows.length ? `<h2 style="margin: 24px 0 10px; font-size: 16px;">Conditional Details</h2><table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;"><tbody>${renderRows(conditionalRows)}</tbody></table>` : ""}
            <h2 style="margin: 24px 0 10px; font-size: 16px;">All Submitted Fields</h2>
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;"><tbody>${renderRows(allRows)}</tbody></table>
          </div>
        </div>
      </div>
    </div>`;

  return { text, html };
}

export async function saveAndEmailSubmission(payload: SubmissionPayload): Promise<SubmissionResult> {
  const submittedAt = new Date().toISOString();
  const db = await createServiceClient();
  const { data, error } = await (db as any)
    .from("contact_form_submissions")
    .insert({
      source_page: payload.sourcePage,
      submission_type: payload.submissionType,
      inquiry_type: payload.inquiryType || null,
      support_path: payload.supportPath || null,
      full_name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      company_operator: payload.companyOperator || null,
      preferred_contact_method: payload.preferredContactMethod || null,
      requester_role: payload.requesterRole || null,
      aircraft_category: payload.aircraftCategory || null,
      aircraft_type: payload.aircraftType || null,
      tail_number: payload.tailNumber || null,
      home_airport: payload.homeAirport || null,
      current_aircraft_location: payload.currentAircraftLocation || null,
      aircraft_status: payload.aircraftStatus || null,
      timeline_urgency: payload.timelineUrgency || null,
      owner_operator_approval_status: payload.ownerOperatorApprovalStatus || null,
      message: payload.message || null,
      requested_support_summary: payload.requestedSupportSummary || null,
      conditional_details: payload.conditionalDetails,
      raw_form: payload.rawForm,
      acknowledgement: payload.acknowledgement === "accepted" ? "Accepted" : payload.acknowledgement,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("Public form submission database insert failed", {
      sourcePage: payload.sourcePage,
      submissionType: payload.submissionType,
      error,
    });
    return { ok: false, reason: "database", message: "Database insert failed" };
  }

  const email = buildEmail(payload, submittedAt);
  const emailResult = await sendEmail({
    to: FORM_SUBMISSION_INBOX,
    subject: subjectFor(payload),
    text: email.text,
    html: email.html,
    replyTo: payload.email,
  });

  if (emailResult.status !== "sent") {
    await (db as any)
      .from("contact_form_submissions")
      .update({
        email_sent: false,
        email_error: emailResult.error || "Email delivery failed",
      })
      .eq("id", data.id);
    console.error("Public form submission email failed", {
      id: data.id,
      recipient: FORM_SUBMISSION_INBOX,
      status: emailResult.status,
      error: emailResult.error,
    });
    return { ok: false, reason: "email", id: data.id, message: emailResult.error || "Email delivery failed" };
  }

  await (db as any)
    .from("contact_form_submissions")
    .update({
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      email_error: null,
    })
    .eq("id", data.id);

  return { ok: true, id: data.id };
}
