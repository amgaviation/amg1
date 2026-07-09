import "server-only";

import { revalidatePath } from "next/cache";
import { absolutePortalUrl } from "@/lib/email/config";
import { amgEmailLayout } from "@/lib/portal/email-templates";
import { sendEmail } from "@/lib/portal/notification-delivery";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";
import type { SessionUser } from "@/lib/portal/session";
import {
  findAuthUserIdByEmail,
  generatePortalPasswordSetupLink,
} from "@/lib/portal/account-setup";
export {
  NETWORK_APPLICATION_STATUSES,
  NETWORK_STATUS_LABELS,
  NETWORK_STATUS_TONES,
  type NetworkApplicationStatus,
} from "@/lib/portal/network-application-constants";
import { NETWORK_APPLICATION_STATUSES, type NetworkApplicationSource, type NetworkApplicationStatus } from "@/lib/portal/network-application-constants";
import {
  buildNetworkDecisionEmailCopy,
  decisionReasonFor,
  mergeTemplateTokens,
  networkDecisionTemplateKey,
  renderDecisionEmailText,
} from "@/lib/portal/network-application-email-copy";
import { getEmailTemplateCopies } from "@/lib/portal/email-template-registry";

export const CERTIFICATE_OPTIONS = [
  "Private Pilot",
  "Commercial Pilot",
  "ATP",
  "CFI",
  "CFII",
  "MEI",
  "Remote Pilot",
  "Other",
];

export const RATING_OPTIONS = [
  "Instrument",
  "Multi-Engine Land",
  "Multi-Engine Sea",
  "Single-Engine Land",
  "Single-Engine Sea",
  "Type Rating(s)",
  "Other",
];

export const ASSIGNMENT_TYPE_OPTIONS = [
  "Contract pilot",
  "Ferry / aircraft movement",
  "Maintenance repositioning",
  "Owner trip support",
  "SIC support",
  "PIC support",
  "Last-minute coverage",
  "Recurrent / recurring support",
];

export type NetworkApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  home_airport: string;
  closest_major_airport: string;
  commute_time: string;
  minimum_call_time: string;
  total_time: number;
  pic_time: number | null;
  sic_time: number | null;
  multi_engine_time: number | null;
  turbine_time: number | null;
  jet_time: number | null;
  instrument_time: number | null;
  certificates_held: string[];
  ratings_held: string[];
  type_ratings: string | null;
  medical_certificate: string;
  medical_expiration_date: string | null;
  work_authorization_status: string;
  passport_available: boolean | null;
  international_ops: boolean | null;
  preferred_assignment_types: string[];
  desired_day_rate: number | null;
  additional_notes: string | null;
  status: NetworkApplicationStatus;
  other_status_reason: string | null;
  internal_notes: string | null;
  missing_information: string | null;
  denial_reason: string | null;
  decision_email_sent_at: string | null;
  source: NetworkApplicationSource;
  import_batch_id: string | null;
  position_applied: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  crew_user_id: string | null;
  crew_profile_id: string | null;
  status_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NetworkApplicationFile = {
  id: string;
  application_id: string;
  file_kind: "resume" | "certificate" | "supporting_document";
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  content_type: string | null;
  file_size: number | null;
  uploaded_at: string;
};

export type NetworkApplicationEvent = {
  id: string;
  application_id: string;
  previous_status: NetworkApplicationStatus | null;
  new_status: NetworkApplicationStatus;
  note: string | null;
  other_status_reason: string | null;
  missing_information: string | null;
  changed_by: string | null;
  changed_at: string;
  email_sent: boolean;
  email_sent_at: string | null;
  email_error: string | null;
};

export type NetworkApplicationDetail = NetworkApplication & {
  files: NetworkApplicationFile[];
  events: NetworkApplicationEvent[];
  crewProfile: {
    id: string;
    updated_at: string | null;
    profile_completion_percent: number | null;
    total_time: number | null;
    medical_certificate: string | null;
    weekly_availability: unknown;
  } | null;
};

const BUCKET = "network-application-files";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_DOC_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const DISCLAIM =
  "Submission, review, or approval does not guarantee assignment, compensation, contractor status, employment status, or future engagement.";

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function arr(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value).trim()).filter(Boolean);
}

function boolOrNull(value: FormDataEntryValue | null) {
  const raw = text(value).toLowerCase();
  if (!raw) return null;
  if (["yes", "true", "1"].includes(raw)) return true;
  if (["no", "false", "0"].includes(raw)) return false;
  return null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const raw = text(value);
  if (!raw) return null;
  const next = Number(raw);
  return Number.isFinite(next) ? next : null;
}

function normalizeAirport(value: string) {
  const raw = value.trim();
  if (/^[a-z0-9]{3,4}$/i.test(raw)) return raw.toUpperCase();
  return raw.replace(/\s+/g, " ");
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateHours(value: number | null, required = false) {
  if (value === null) return !required;
  return value >= 0 && value <= 100000;
}

export function safeFilename(name: string) {
  const safe = name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_");
  return safe.slice(0, 140) || "document";
}

function validateFile(file: File, allowedTypes: Set<string>) {
  if (!file.size) return "File is empty.";
  if (file.size > MAX_FILE_SIZE) return "Files must be 50 MB or smaller.";
  if (file.type && !allowedTypes.has(file.type)) return "File type is not supported.";
  return null;
}

/**
 * Portal Spec §3.3 fields (90-day currency, insurance-history questionnaire,
 * references) are captured as structured form inputs and folded into
 * additional_notes so the launch schema needs no migration; the portal's
 * vetting checklist reads them from the application record.
 */
function foldSpecFieldsIntoNotes(formData: FormData, notes: string): string {
  const lines = [
    ["Flight time last 90 days", text(formData.get("hours_last_90_days"))],
    ["Accidents / incidents / enforcement actions", text(formData.get("insurance_incidents"))],
    ["Incident details", text(formData.get("insurance_incident_details"))],
    ["Insurance denied or special conditions", text(formData.get("insurance_denied"))],
    ["Insurance history details", text(formData.get("insurance_denied_details"))],
    ["Reference 1", text(formData.get("reference_1"))],
    ["Reference 2", text(formData.get("reference_2"))],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);
  if (!lines.length) return notes;
  const block = `— Insurance history & references —\n${lines.join("\n")}`;
  return notes ? `${notes}\n\n${block}` : block;
}

export function parseNetworkApplicationForm(formData: FormData) {
  const payload = {
    full_name: text(formData.get("full_name")),
    email: text(formData.get("email")).toLowerCase(),
    phone: text(formData.get("phone")),
    home_airport: normalizeAirport(text(formData.get("home_airport"))),
    closest_major_airport: normalizeAirport(text(formData.get("closest_major_airport"))),
    commute_time: text(formData.get("commute_time")),
    minimum_call_time: text(formData.get("minimum_call_time")),
    total_time: numberOrNull(formData.get("total_time")),
    pic_time: numberOrNull(formData.get("pic_time")),
    sic_time: numberOrNull(formData.get("sic_time")),
    multi_engine_time: numberOrNull(formData.get("multi_engine_time")),
    turbine_time: numberOrNull(formData.get("turbine_time")),
    jet_time: numberOrNull(formData.get("jet_time")),
    instrument_time: numberOrNull(formData.get("instrument_time")),
    certificates_held: arr(formData, "certificates_held"),
    ratings_held: arr(formData, "ratings_held"),
    type_ratings: text(formData.get("type_ratings")) || null,
    medical_certificate: text(formData.get("medical_certificate")),
    medical_expiration_date: text(formData.get("medical_expiration_date")) || null,
    work_authorization_status: text(formData.get("work_authorization_status")),
    passport_available: boolOrNull(formData.get("passport_available")),
    international_ops: boolOrNull(formData.get("international_ops")),
    preferred_assignment_types: arr(formData, "preferred_assignment_types"),
    desired_day_rate: numberOrNull(formData.get("desired_day_rate")),
    additional_notes:
      foldSpecFieldsIntoNotes(formData, text(formData.get("additional_notes"))) || null,
  };

  const errors: Record<string, string> = {};
  for (const key of [
    "full_name",
    "email",
    "phone",
    "home_airport",
    "closest_major_airport",
    "commute_time",
    "minimum_call_time",
    "medical_certificate",
    "work_authorization_status",
  ] as const) {
    if (!payload[key]) errors[key] = "Required.";
  }
  if (!validEmail(payload.email)) errors.email = "Enter a valid email.";
  if (!validateHours(payload.total_time, true)) errors.total_time = "Enter a valid total time.";
  for (const key of ["pic_time", "sic_time", "multi_engine_time", "turbine_time", "jet_time", "instrument_time"] as const) {
    if (!validateHours(payload[key])) errors[key] = "Enter a valid non-negative value.";
  }
  if (payload.desired_day_rate !== null && (payload.desired_day_rate < 0 || payload.desired_day_rate > 100000)) {
    errors.desired_day_rate = "Enter a valid day rate.";
  }
  if (!payload.certificates_held.length) errors.certificates_held = "Select at least one certificate.";
  if (!payload.ratings_held.length) errors.ratings_held = "Select at least one rating.";
  if (formData.get("legal_acknowledgment") !== "accepted") errors.legal_acknowledgment = "Required.";
  if (formData.get("policy_acknowledgment") !== "accepted") errors.policy_acknowledgment = "Required.";

  const resume = formData.get("resume");
  if (!(resume instanceof File) || !resume.size) errors.resume = "Resume upload is required.";
  if (resume instanceof File && resume.size) {
    const fileError = validateFile(resume, ALLOWED_RESUME_TYPES);
    if (fileError) errors.resume = fileError;
  }

  const certificateFiles = formData.getAll("certificates").filter((item): item is File => item instanceof File && item.size > 0);
  if (certificateFiles.length > 10) errors.certificates = "Upload no more than 10 certificate files.";
  for (const file of certificateFiles) {
    const fileError = validateFile(file, ALLOWED_DOC_TYPES);
    if (fileError) errors.certificates = fileError;
  }
  const supportingFiles = formData.getAll("supporting_documents").filter((item): item is File => item instanceof File && item.size > 0);
  if (supportingFiles.length > 10) errors.supporting_documents = "Upload no more than 10 supporting documents.";
  for (const file of supportingFiles) {
    const fileError = validateFile(file, ALLOWED_DOC_TYPES);
    if (fileError) errors.supporting_documents = fileError;
  }

  // Bound the whole submission so a public caller can't post many max-size files.
  const MAX_TOTAL_UPLOAD_BYTES = 80 * 1024 * 1024;
  const totalUploadBytes = [
    resume instanceof File ? resume.size : 0,
    ...certificateFiles.map((file) => file.size),
    ...supportingFiles.map((file) => file.size),
  ].reduce((sum, size) => sum + size, 0);
  if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
    errors.form = "Total upload size exceeds the 80 MB limit. Please reduce file sizes and try again.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    payload: { ...payload, total_time: payload.total_time ?? 0 },
    files: {
      resume: resume instanceof File ? resume : null,
      certificates: certificateFiles,
      supportingDocuments: supportingFiles,
    },
  };
}

async function uploadApplicationFile(input: {
  db: any;
  applicationId: string;
  file: File;
  kind: NetworkApplicationFile["file_kind"];
  folder: string;
}) {
  const storagePath = `network-applications/${input.applicationId}/${input.folder}/${Date.now()}-${safeFilename(input.file.name)}`;
  const { error } = await input.db.storage.from(BUCKET).upload(storagePath, input.file, {
    contentType: input.file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error("file_upload_failed");

  const { error: metaError } = await input.db.from("network_application_files").insert({
    application_id: input.applicationId,
    file_kind: input.kind,
    storage_bucket: BUCKET,
    storage_path: storagePath,
    original_filename: input.file.name,
    content_type: input.file.type || null,
    file_size: input.file.size,
  });
  if (metaError) throw new Error("file_metadata_failed");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function emailBodyForStatus(input: {
  application: Pick<
    NetworkApplication,
    "full_name" | "email" | "missing_information" | "other_status_reason" | "denial_reason"
  >;
  status: NetworkApplicationStatus;
  setupLink?: string | null;
  /** Global template override from Settings → Email Templates, if any. */
  override?: { subject: string; body: string } | null;
}) {
  const name = firstName(input.application.full_name);
  const portalLink = absolutePortalUrl("/login");
  const common = {
    footerNote: DISCLAIM,
    eyebrow: "AMG Crew Network",
  };

  // additional_information_needed keeps its dedicated template.
  if (input.status === "additional_information_needed") {
    const missing = input.application.missing_information || "AMG Operations needs additional information before review can continue.";
    return {
      subject: "Additional Information Needed for AMG Crew Network Review",
      text: `Hello ${name},\n\nAMG needs additional information before crew-network review can continue.\n\nInformation requested:\n${missing}\n\nPlease reply through approved AMG channels and do not send unrelated sensitive documents.\n\n${DISCLAIM}`,
      html: amgEmailLayout({
        ...common,
        title: "Additional Information Needed for AMG Crew Network Review",
        intro: `Hello ${name}, AMG needs additional information before crew-network review can continue.`,
        sections: [{ title: "Information Requested", body: missing }],
      }),
    };
  }

  // All decision emails share one copy source with the admin preview modal.
  const copy = buildNetworkDecisionEmailCopy({
    status: input.status,
    fullName: input.application.full_name,
    denialReason: input.application.denial_reason,
    otherStatusReason: input.application.other_status_reason,
  });
  if (!copy) return null;

  const ctaHref = input.setupLink ?? portalLink;

  // A customized template replaces the structured copy with edited flat text;
  // the disclaimer and (for approvals) the setup CTA still apply.
  if (input.override) {
    const variables = {
      first_name: name,
      full_name: input.application.full_name,
      reason: decisionReasonFor({
        status: input.status,
        denialReason: input.application.denial_reason,
        otherStatusReason: input.application.other_status_reason,
      }),
    };
    const subject = mergeTemplateTokens(input.override.subject, variables);
    const body = mergeTemplateTokens(input.override.body, variables);
    return {
      subject,
      text: [body, ...(copy.cta ? [`${copy.cta.label}: ${ctaHref}`] : []), DISCLAIM].join("\n\n"),
      html: amgEmailLayout({
        ...common,
        title: subject,
        intro: body,
        ...(copy.cta ? { cta: { label: copy.cta.label, href: ctaHref } } : {}),
      }),
    };
  }

  return {
    subject: copy.subject,
    text: renderDecisionEmailText(copy, { ctaHref: copy.cta ? ctaHref : null }),
    html: amgEmailLayout({
      ...common,
      title: copy.subject,
      intro: copy.intro,
      sections: copy.sections,
      ...(copy.cta ? { cta: { label: copy.cta.label, href: ctaHref } } : {}),
    }),
  };
}

async function sendStatusEmail(application: NetworkApplication, setupLink?: string | null) {
  const overrideKey = networkDecisionTemplateKey(application.status);
  const override = overrideKey
    ? (await getEmailTemplateCopies([overrideKey])).get(overrideKey)
    : null;
  const template = emailBodyForStatus({
    application,
    status: application.status,
    setupLink,
    override: override?.overridden ? override : null,
  });
  if (!template) return { sent: false, error: null };
  const result = await sendEmail({
    to: application.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
  return {
    sent: result.status === "sent",
    error: result.status === "sent" ? null : result.error ?? result.status,
  };
}

export async function submitNetworkApplication(formData: FormData) {
  const parsed = parseNetworkApplicationForm(formData);
  if (!parsed.ok) return { ok: false as const, errors: parsed.errors };

  const db = (await createServiceClient()) as any;
  const { data: application, error } = await db
    .from("network_applications")
    .insert(parsed.payload)
    .select("*")
    .single();
  if (error || !application) {
    console.error("[network-applications] insert failed", {
      code: error?.code,
      message: error?.message,
      hint: error?.hint,
    });
    return {
      ok: false as const,
      errors: {
        form:
          error?.code === "PGRST205"
            ? "Application storage is being prepared. Please try again in a few minutes."
            : "Application could not be submitted.",
      },
    };
  }

  try {
    if (!parsed.files.resume) throw new Error("missing_resume");
    await uploadApplicationFile({ db, applicationId: application.id, file: parsed.files.resume, kind: "resume", folder: "resume" });
    for (const file of parsed.files.certificates) {
      await uploadApplicationFile({ db, applicationId: application.id, file, kind: "certificate", folder: "certificates" });
    }
    for (const file of parsed.files.supportingDocuments) {
      await uploadApplicationFile({ db, applicationId: application.id, file, kind: "supporting_document", folder: "supporting" });
    }
  } catch (uploadError) {
    await db.from("network_applications").delete().eq("id", application.id);
    console.error("[network-applications] upload failed", uploadError);
    return { ok: false as const, errors: { form: "File upload failed. Review file types and sizes, then submit again." } };
  }

  const confirmation = await sendEmail({
    to: application.email,
    subject: "AMG Crew Network Application Received",
    text: `Hello ${firstName(application.full_name)},\n\nAMG received your Crew Network application. AMG will review qualifications, airport coverage, aircraft experience, credential readiness, and assignment suitability. AMG may request additional information. Do not reply with sensitive documents unless requested through approved AMG channels.\n\n${DISCLAIM}`,
    html: amgEmailLayout({
      eyebrow: "AMG Crew Network",
      title: "AMG Crew Network Application Received",
      intro: `Hello ${firstName(application.full_name)}, AMG received your Crew Network application.`,
      sections: [
        { body: "AMG will review qualifications, airport coverage, aircraft experience, credential readiness, and assignment suitability. AMG may request additional information." },
        { body: "Do not reply with sensitive documents unless requested through approved AMG channels." },
      ],
      footerNote: DISCLAIM,
    }),
  });

  await notifyAdmins({
    title: "New Crew Network application",
    body: `${application.full_name} submitted an AMG Crew Network application from ${application.home_airport}.`,
    type: "network_application_submitted",
    entityType: "network_application",
    entityId: application.id,
  });

  if (confirmation.status !== "sent") {
    await db.from("network_application_status_events").insert({
      application_id: application.id,
      new_status: "awaiting_review",
      note: "Submission confirmation email did not send.",
      email_sent: false,
      email_error: confirmation.error ?? confirmation.status,
    });
  }

  return { ok: true as const, id: application.id };
}

export async function listNetworkApplications(filters: {
  q?: string;
  status?: string;
  airport?: string;
  sort?: string;
} = {}) {
  const db = (await createServiceClient()) as any;
  let query = db.from("network_applications").select("*");
  if (filters.status && NETWORK_APPLICATION_STATUSES.includes(filters.status as NetworkApplicationStatus)) {
    query = query.eq("status", filters.status);
  }
  if (filters.airport) {
    const airport = normalizeAirport(filters.airport);
    query = query.or(`home_airport.ilike.%${airport}%,closest_major_airport.ilike.%${airport}%`);
  }
  if (filters.q) {
    const q = filters.q.replace(/[,%]/g, "").trim();
    if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,home_airport.ilike.%${q}%,closest_major_airport.ilike.%${q}%,type_ratings.ilike.%${q}%`);
  }
  if (filters.sort === "updated") query = query.order("updated_at", { ascending: false });
  else if (filters.sort === "total_time") query = query.order("total_time", { ascending: false });
  else query = query.order("submitted_at", { ascending: false });
  const { data } = await query;
  return (data ?? []) as NetworkApplication[];
}

export async function getNetworkApplicationDetails(id: string): Promise<NetworkApplicationDetail | null> {
  const db = (await createServiceClient()) as any;
  const { data: application } = await db.from("network_applications").select("*").eq("id", id).maybeSingle();
  if (!application) return null;
  const [files, events, crewProfile] = await Promise.all([
    db.from("network_application_files").select("*").eq("application_id", id).order("uploaded_at"),
    db.from("network_application_status_events").select("*").eq("application_id", id).order("changed_at", { ascending: false }),
    application.crew_profile_id
      ? db.from("crew_profiles").select("id, updated_at, profile_completion_percent, total_time, medical_certificate, weekly_availability").eq("id", application.crew_profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    ...(application as NetworkApplication),
    files: (files.data ?? []) as NetworkApplicationFile[],
    events: (events.data ?? []) as NetworkApplicationEvent[],
    crewProfile: crewProfile.data ?? null,
  };
}

export async function updateNetworkApplicationInternalNotes(input: {
  actor: SessionUser;
  applicationId: string;
  internalNotes: string | null;
}) {
  const db = (await createServiceClient()) as any;
  const { error } = await db.from("network_applications").update({ internal_notes: input.internalNotes }).eq("id", input.applicationId);
  if (error) return { ok: false as const, error: "Internal notes could not be saved." };
  await logAuditEvent({ actor: input.actor, action: "network_application_notes_updated", entityType: "network_application", entityId: input.applicationId });
  revalidatePath("/portal/admin/network-applications");
  return { ok: true as const };
}

export async function approveNetworkApplicationAndCreateCrewAccount(input: {
  actor: SessionUser;
  application: NetworkApplication;
}) {
  const db = (await createServiceClient()) as any;
  const email = input.application.email.toLowerCase();
  let authUserId = await findAuthUserIdByEmail(email);
  if (!authUserId) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: input.application.full_name, role: "crew" },
    });
    if (error || !data.user) return { ok: false as const, error: "Crew auth account could not be created." };
    authUserId = data.user.id;
  }

  const profileRow = {
    id: authUserId,
    email,
    full_name: input.application.full_name,
    role: "crew",
    status: "approved",
    is_active: true,
    phone: input.application.phone,
    home_base: input.application.home_airport,
    invitation_status: "portal_setup_pending",
    invitation_channel: "email",
    invited_by: input.actor.id,
    updated_at: new Date().toISOString(),
  };
  const { error: profileError } = await db.from("profiles").upsert(profileRow);
  if (profileError) return { ok: false as const, error: "Crew portal profile could not be linked." };

  const crewProfile = {
    id: authUserId,
    source_email: email,
    display_name: input.application.full_name,
    home_airport: input.application.home_airport,
    closest_major_airport: input.application.closest_major_airport,
    minimum_call_time: input.application.minimum_call_time,
    total_time: input.application.total_time,
    pic_time: input.application.pic_time,
    sic_time: input.application.sic_time,
    multi_time: input.application.multi_engine_time,
    turbine_time: input.application.turbine_time,
    jet_time: input.application.jet_time,
    instrument_time: input.application.instrument_time,
    certificates_held: input.application.certificates_held,
    ratings_held: input.application.ratings_held,
    type_ratings: input.application.type_ratings ? input.application.type_ratings.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean) : [],
    medical_certificate: input.application.medical_certificate,
    medical_expiration_date: input.application.medical_expiration_date,
    desired_day_rate: input.application.desired_day_rate,
    day_rate: input.application.desired_day_rate,
    international_experience: input.application.international_ops ?? false,
    short_notice_available: input.application.minimum_call_time ? ["2 hours", "4 hours"].includes(input.application.minimum_call_time) : false,
    preferred_aircraft: input.application.type_ratings ? input.application.type_ratings.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean) : [],
    preferred_regions: [],
    profile_status: "approved",
    crew_status: "approved",
    approved: true,
    reviewed: true,
  };
  const { error: crewError } = await db.from("crew_profiles").upsert(crewProfile);
  if (crewError) return { ok: false as const, error: "Crew qualification profile could not be created." };

  const setupLink = await generatePortalPasswordSetupLink(email);
  if (!setupLink) return { ok: false as const, error: "Password setup link could not be generated." };

  await db.from("network_applications").update({
    crew_user_id: authUserId,
    crew_profile_id: authUserId,
    approved_at: new Date().toISOString(),
    approved_by: input.actor.id,
  }).eq("id", input.application.id);

  await logAuditEvent({
    actor: input.actor,
    action: "network_application_approved_account_created",
    detail: `Approved Crew Network application for ${email}`,
    entityType: "network_application",
    entityId: input.application.id,
  });

  return { ok: true as const, crewUserId: authUserId, crewProfileId: authUserId, setupLink };
}

export async function updateNetworkApplicationStatus(input: {
  actor: SessionUser;
  applicationId: string;
  status: NetworkApplicationStatus;
  missingInformation?: string | null;
  otherStatusReason?: string | null;
  denialReason?: string | null;
  note?: string | null;
}) {
  if (!NETWORK_APPLICATION_STATUSES.includes(input.status)) return { ok: false as const, error: "Invalid status." };
  if (input.status === "additional_information_needed" && !input.missingInformation?.trim()) {
    return { ok: false as const, error: "Information requested is required." };
  }
  if (input.status === "other" && !input.otherStatusReason?.trim()) {
    return { ok: false as const, error: "Other status reason is required." };
  }
  if (input.status === "denied" && !input.denialReason?.trim()) {
    return { ok: false as const, error: "A denial reason is required." };
  }

  const db = (await createServiceClient()) as any;
  const { data: current } = await db.from("network_applications").select("*").eq("id", input.applicationId).maybeSingle();
  if (!current) return { ok: false as const, error: "Application was not found." };

  let setupLink: string | null = null;
  if (input.status === "approved" && !current.crew_user_id) {
    const approved = await approveNetworkApplicationAndCreateCrewAccount({ actor: input.actor, application: current });
    if (!approved.ok) return approved;
    setupLink = approved.setupLink;
  }

  const update = {
    status: input.status,
    missing_information: input.status === "additional_information_needed" ? input.missingInformation?.trim() : current.missing_information,
    other_status_reason: input.status === "other" ? input.otherStatusReason?.trim() : current.other_status_reason,
    denial_reason: input.status === "denied" ? input.denialReason?.trim() : current.denial_reason,
    reviewed_at: input.status !== "awaiting_review" ? new Date().toISOString() : current.reviewed_at,
    reviewed_by: input.status !== "awaiting_review" ? input.actor.id : current.reviewed_by,
    approved_at: input.status === "approved" ? (current.approved_at ?? new Date().toISOString()) : current.approved_at,
    approved_by: input.status === "approved" ? (current.approved_by ?? input.actor.id) : current.approved_by,
    status_updated_at: new Date().toISOString(),
    status_updated_by: input.actor.id,
  };
  const { data: application, error } = await db.from("network_applications").update(update).eq("id", input.applicationId).select("*").single();
  if (error || !application) return { ok: false as const, error: "Status could not be saved." };

  const emailResult = await sendStatusEmail(application as NetworkApplication, setupLink);
  if (emailResult.sent) {
    await db
      .from("network_applications")
      .update({ decision_email_sent_at: new Date().toISOString() })
      .eq("id", input.applicationId);
  }
  await db.from("network_application_status_events").insert({
    application_id: input.applicationId,
    previous_status: current.status,
    new_status: input.status,
    note: input.note?.trim() || null,
    missing_information: update.missing_information ?? null,
    other_status_reason: update.other_status_reason ?? null,
    changed_by: input.actor.id,
    email_sent: emailResult.sent,
    email_sent_at: emailResult.sent ? new Date().toISOString() : null,
    email_error: emailResult.error,
  });

  await logAuditEvent({
    actor: input.actor,
    action: "network_application_status_changed",
    detail: `${current.status} -> ${input.status}`,
    entityType: "network_application",
    entityId: input.applicationId,
  });
  revalidatePath("/portal/admin/network-applications");
  revalidatePath(`/portal/admin/network-applications/${input.applicationId}`);
  // Status is saved either way; the caller surfaces a failed send with a
  // retry (Resend button) instead of silently reporting success.
  return { ok: true as const, emailSent: emailResult.sent, emailError: emailResult.error };
}

/** Re-send the decision email for the application's current status. */
export async function resendNetworkDecisionEmail(input: {
  actor: SessionUser;
  applicationId: string;
}) {
  const db = (await createServiceClient()) as any;
  const { data: application } = await db.from("network_applications").select("*").eq("id", input.applicationId).maybeSingle();
  if (!application) return { ok: false as const, error: "Application was not found." };

  // Approved applications regenerate a fresh password-setup link when the
  // account hasn't finished setup yet.
  let setupLink: string | null = null;
  if (application.status === "approved" && application.crew_user_id) {
    setupLink = await generatePortalPasswordSetupLink(application.email.toLowerCase());
  }

  const emailResult = await sendStatusEmail(application as NetworkApplication, setupLink);
  if (!emailResult.sent) {
    return { ok: false as const, error: `Email could not be sent: ${emailResult.error ?? "unknown error"}` };
  }

  await db
    .from("network_applications")
    .update({ decision_email_sent_at: new Date().toISOString() })
    .eq("id", input.applicationId);
  await db.from("network_application_status_events").insert({
    application_id: input.applicationId,
    previous_status: application.status,
    new_status: application.status,
    note: "Decision email re-sent.",
    changed_by: input.actor.id,
    email_sent: true,
    email_sent_at: new Date().toISOString(),
  });
  await logAuditEvent({
    actor: input.actor,
    action: "network_application_email_resent",
    detail: `Re-sent ${application.status} email to ${application.email}`,
    entityType: "network_application",
    entityId: input.applicationId,
  });
  revalidatePath(`/portal/admin/network-applications/${input.applicationId}`);
  return { ok: true as const };
}

// ─── Manual prospects + CSV/XLSX import ─────────────────────────────

export type ProspectInput = {
  full_name: string;
  email: string;
  phone?: string | null;
  position?: string | null;
  certificates_ratings?: string | null;
  total_hours?: number | null;
  notes?: string | null;
};

function prospectRow(input: ProspectInput, source: NetworkApplicationSource, batchId?: string | null) {
  return {
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || "",
    home_airport: "",
    closest_major_airport: "",
    commute_time: "",
    minimum_call_time: "",
    total_time: input.total_hours ?? 0,
    type_ratings: input.certificates_ratings?.trim() || null,
    medical_certificate: "",
    work_authorization_status: "unknown",
    additional_notes: input.notes?.trim() || null,
    position_applied: input.position?.trim() || null,
    status: "awaiting_review",
    source,
    import_batch_id: batchId ?? null,
  };
}

/** Manually add one prospect (e.g. a pilot who emailed directly). */
export async function addManualProspect(input: { actor: SessionUser; prospect: ProspectInput }) {
  const email = input.prospect.email.trim().toLowerCase();
  if (!input.prospect.full_name.trim()) return { ok: false as const, error: "Name is required." };
  if (!validEmail(email)) return { ok: false as const, error: "Enter a valid email." };

  const db = (await createServiceClient()) as any;
  const [{ data: existingApp }, { data: existingProfile }] = await Promise.all([
    db.from("network_applications").select("id").ilike("email", email).maybeSingle(),
    db.from("profiles").select("id").ilike("email", email).maybeSingle(),
  ]);
  if (existingApp) return { ok: false as const, error: "An application with this email already exists." };
  if (existingProfile) return { ok: false as const, error: "A portal user with this email already exists." };

  const { data, error } = await db
    .from("network_applications")
    .insert(prospectRow(input.prospect, "manual"))
    .select("id")
    .single();
  if (error || !data) return { ok: false as const, error: "Prospect could not be created." };

  await logAuditEvent({
    actor: input.actor,
    action: "network_application_prospect_added",
    detail: `Manually added ${email}`,
    entityType: "network_application",
    entityId: data.id,
  });
  revalidatePath("/portal/admin/network-applications");
  return { ok: true as const, id: data.id };
}

/** Bulk-import prospects (already parsed client-side from CSV/XLSX). */
export async function importProspects(input: {
  actor: SessionUser;
  source: "csv_import" | "xlsx_import";
  rows: ProspectInput[];
}) {
  const db = (await createServiceClient()) as any;
  const batchId = `${input.source === "csv_import" ? "csv" : "xlsx"}-${Date.now()}`;

  const seen = new Set<string>();
  const valid: ProspectInput[] = [];
  let skipped = 0;
  for (const row of input.rows) {
    const email = row.email?.trim().toLowerCase() ?? "";
    if (!row.full_name?.trim() || !validEmail(email) || seen.has(email)) {
      skipped += 1;
      continue;
    }
    seen.add(email);
    valid.push({ ...row, email });
  }

  const emails = valid.map((r) => r.email);
  let duplicates = 0;
  let toInsert = valid;
  if (emails.length) {
    const [{ data: existingApps }, { data: existingProfiles }] = await Promise.all([
      db.from("network_applications").select("email").in("email", emails),
      db.from("profiles").select("email").in("email", emails),
    ]);
    const existing = new Set(
      [...(existingApps ?? []), ...(existingProfiles ?? [])].map((r: { email: string | null }) =>
        (r.email ?? "").toLowerCase()
      )
    );
    toInsert = valid.filter((r) => !existing.has(r.email));
    duplicates = valid.length - toInsert.length;
  }

  let imported = 0;
  if (toInsert.length) {
    const { error, data } = await db
      .from("network_applications")
      .insert(toInsert.map((r) => prospectRow(r, input.source, batchId)))
      .select("id");
    if (error) return { ok: false as const, error: "Import failed while inserting rows." };
    imported = (data ?? []).length;
  }

  await logAuditEvent({
    actor: input.actor,
    action: "network_application_prospects_imported",
    detail: `${imported} imported, ${duplicates} duplicates, ${skipped} skipped (${batchId})`,
    entityType: "network_application",
    entityId: null,
  });
  revalidatePath("/portal/admin/network-applications");
  return { ok: true as const, imported, duplicates, skipped, batchId };
}

export async function getNetworkApplicationFileSignedUrl(input: {
  actor: SessionUser;
  fileId: string;
}) {
  const db = (await createServiceClient()) as any;
  const { data: file } = await db.from("network_application_files").select("*").eq("id", input.fileId).maybeSingle();
  if (!file) return { ok: false as const, error: "File not found." };
  const { data, error } = await db.storage.from(file.storage_bucket).createSignedUrl(file.storage_path, 60);
  if (error || !data?.signedUrl) return { ok: false as const, error: "Secure file link could not be created." };
  await logAuditEvent({
    actor: input.actor,
    action: "network_application_file_viewed",
    detail: file.original_filename,
    entityType: "network_application",
    entityId: file.application_id,
  });
  return { ok: true as const, url: data.signedUrl };
}

export function calculateCrewProfileCompletion(input: {
  phone?: string | null;
  homeAirport?: string | null;
  closestAirport?: string | null;
  totalTime?: number | null;
  certificates?: string[] | null;
  ratings?: string[] | null;
  medical?: string | null;
  availability?: unknown;
}) {
  const checks = [
    Boolean(input.phone),
    Boolean(input.homeAirport && input.closestAirport),
    input.totalTime !== null && input.totalTime !== undefined,
    Boolean(input.certificates?.length && input.ratings?.length),
    Boolean(input.medical),
    Boolean(input.availability && JSON.stringify(input.availability) !== "{}"),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** Portal account state per approved applicant: finished setup or still pending. */
export async function getCrewAccountStates(
  crewUserIds: string[]
): Promise<Record<string, "active" | "setup_pending">> {
  const ids = crewUserIds.filter(Boolean);
  if (!ids.length) return {};
  const db = (await createServiceClient()) as any;
  const { data } = await db.from("profiles").select("id, invitation_status").in("id", ids);
  const out: Record<string, "active" | "setup_pending"> = {};
  for (const row of (data ?? []) as { id: string; invitation_status: string | null }[]) {
    out[row.id] = row.invitation_status === "password_created" ? "active" : "setup_pending";
  }
  return out;
}
