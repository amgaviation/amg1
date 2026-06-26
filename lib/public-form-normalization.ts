export type SubmissionType = "contact_inquiry" | "support_request";

export type PublicFormPayload = Record<string, string | boolean | string[]>;

export type NormalizedPublicFormSubmission = {
  sourcePage: "Contact" | "Request Support";
  submissionType: SubmissionType;
  requesterName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string;
  company: string | null;
  organization: string | null;
  aircraft: string | null;
  aircraftCategory: string | null;
  aircraftStatus: string | null;
  tailNumber: string | null;
  route: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  timing: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  supportType: string | null;
  serviceInterest: string | null;
  crewNeed: string | null;
  passengerContext: string | null;
  message: string | null;
  acknowledgement: boolean;
  marketingConsent: boolean | null;
  smsConsent: boolean | null;
  payload: PublicFormPayload;
};

export type PublicFormValidationResult =
  | { ok: true; submission: NormalizedPublicFormSubmission }
  | { ok: false; errors: string[] };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HONEYPOT_FIELDS = new Set(["website"]);
const BOOLEAN_FIELDS = new Set([
  "acknowledgment",
  "acknowledgement",
  "marketing_consent",
  "sms_consent",
  "privacy_consent",
  "terms_acknowledgment",
]);

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\u0000/g, "").trim();
  return trimmed ? trimmed : null;
}

function field(formData: FormData, key: string): string | null {
  return clean(formData.get(key));
}

function firstOf(formData: FormData, keys: string[]): string | null {
  for (const key of keys) {
    const value = field(formData, key);
    if (value) return value;
  }
  return null;
}

function boolField(formData: FormData, keys: string[]): boolean {
  return keys.some((key) => {
    const value = field(formData, key);
    if (!value) return false;
    return ["1", "true", "yes", "on", "accepted", "checked"].includes(value.toLowerCase());
  });
}

function optionalBoolField(formData: FormData, keys: string[]): boolean | null {
  const hasField = keys.some((key) => formData.has(key));
  return hasField ? boolField(formData, keys) : null;
}

function normalizeTailNumber(value: string | null) {
  return value ? value.toUpperCase().replace(/\s+/g, "") : null;
}

function normalizeAirport(value: string | null) {
  return value ? value.toUpperCase() : null;
}

function splitName(fullName: string | null, firstName: string | null, lastName: string | null) {
  if (firstName || lastName) {
    const requesterName = [firstName, lastName].filter(Boolean).join(" ").trim();
    return {
      requesterName: requesterName || fullName || "",
      firstName,
      lastName,
    };
  }

  const parts = (fullName ?? "").split(/\s+/).filter(Boolean);
  return {
    requesterName: fullName || "",
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function payloadValue(key: string, value: string): string | boolean {
  if (BOOLEAN_FIELDS.has(key)) {
    return ["1", "true", "yes", "on", "accepted", "checked"].includes(value.toLowerCase());
  }
  return value;
}

export function formDataToPayload(formData: FormData): PublicFormPayload {
  const output: PublicFormPayload = {};

  for (const [key, raw] of formData.entries()) {
    if (HONEYPOT_FIELDS.has(key)) continue;
    if (typeof raw !== "string") continue;

    const value = clean(raw);
    if (value === null) continue;
    const normalized = payloadValue(key, value);
    const existing = output[key];

    if (Array.isArray(existing)) {
      existing.push(String(normalized));
    } else if (typeof existing === "string") {
      output[key] = [existing, String(normalized)];
    } else if (typeof existing === "boolean") {
      output[key] = [String(existing), String(normalized)];
    } else {
      output[key] = normalized;
    }
  }

  return output;
}

function baseSubmission(
  formData: FormData,
  sourcePage: NormalizedPublicFormSubmission["sourcePage"],
  submissionType: SubmissionType,
): NormalizedPublicFormSubmission {
  const fullName = firstOf(formData, ["requester_name", "full_name", "name"]);
  const names = splitName(
    fullName,
    field(formData, "first_name"),
    field(formData, "last_name"),
  );
  const email = (firstOf(formData, ["email", "requester_email"]) ?? "").toLowerCase();
  const phone = firstOf(formData, ["phone", "requester_phone"]) ?? "";
  const company = firstOf(formData, ["company", "company_operator"]);
  const aircraftMake = field(formData, "aircraft_make");
  const aircraftModel = field(formData, "aircraft_model");
  const aircraft =
    firstOf(formData, ["aircraft", "aircraft_type", "aircraft_information"])
    ?? ([aircraftMake, aircraftModel].filter(Boolean).join(" ").trim() || null);
  const departureAirport = normalizeAirport(firstOf(formData, [
    "departure_airport",
    "departure_current_airport",
    "origin",
  ]));
  const arrivalAirport = normalizeAirport(firstOf(formData, [
    "arrival_airport",
    "destination_airport",
    "destination",
  ]));
  const route =
    firstOf(formData, ["route", "origin_destination"])
    ?? ([departureAirport, arrivalAirport].filter(Boolean).join(" to ") || null);

  return {
    sourcePage,
    submissionType,
    requesterName: names.requesterName,
    firstName: names.firstName,
    lastName: names.lastName,
    email,
    phone,
    company,
    organization: firstOf(formData, ["organization", "ownership_entity", "company_operator"]) ?? company,
    aircraft,
    aircraftCategory: firstOf(formData, ["aircraft_category"]),
    aircraftStatus: firstOf(formData, ["aircraft_status", "airworthiness_status", "aircraft_release_status"]),
    tailNumber: normalizeTailNumber(firstOf(formData, ["tail_number"])),
    route,
    departureAirport,
    arrivalAirport,
    timing: firstOf(formData, [
      "timing",
      "requested_timing",
      "timeline_urgency",
      "desired_completion_timeline",
      "requested_dates",
      "mission_dates",
    ]),
    requestedDate: firstOf(formData, [
      "requested_date",
      "desired_start_date",
      "desired_movement_date",
      "anticipated_start_date",
      "expected_start_date",
    ]),
    requestedTime: firstOf(formData, ["requested_time"]),
    supportType: firstOf(formData, ["support_type", "support_path", "requested_service_category"]),
    serviceInterest: firstOf(formData, [
      "service_interest",
      "inquiry_type",
      "requested_service_category",
      "support_path",
      "desired_tier",
    ]),
    crewNeed: firstOf(formData, [
      "crew_need",
      "crew_need_type",
      "crew_seat",
      "crew_requirements",
      "pic_sic_requirement",
      "single_or_two_pilot",
    ]),
    passengerContext: firstOf(formData, ["passenger_context", "number_of_passengers"]),
    message: firstOf(formData, [
      "message",
      "requested_support_summary",
      "operational_summary",
      "additional_notes",
      "detailed_support_description",
      "questions_or_special_requirements",
    ]),
    acknowledgement: boolField(formData, ["acknowledgment", "acknowledgement", "terms_acknowledgment"]),
    marketingConsent: optionalBoolField(formData, ["marketing_consent"]),
    smsConsent: optionalBoolField(formData, ["sms_consent"]),
    payload: formDataToPayload(formData),
  };
}

function validateCommon(submission: NormalizedPublicFormSubmission) {
  const errors: string[] = [];
  if (!submission.requesterName) errors.push("requester_name");
  if (!submission.email || !EMAIL_PATTERN.test(submission.email)) errors.push("email");
  if (!submission.acknowledgement) errors.push("acknowledgement");
  return errors;
}

export function normalizeContactSubmission(formData: FormData): PublicFormValidationResult {
  const submission = baseSubmission(formData, "Contact", "contact_inquiry");
  const errors = validateCommon(submission);

  if (!submission.serviceInterest) errors.push("inquiry_type");
  if (!submission.message) errors.push("message");

  return errors.length ? { ok: false, errors } : { ok: true, submission };
}

export function normalizeSupportSubmission(formData: FormData): PublicFormValidationResult {
  const submission = baseSubmission(formData, "Request Support", "support_request");
  const errors = validateCommon(submission);
  const isStructuredSupportForm = formData.has("full_name");

  if (!submission.supportType) errors.push("support_type");
  if (!submission.message) errors.push("message");
  if (!submission.timing) errors.push("timing");

  if (isStructuredSupportForm) {
    if (!submission.aircraftCategory) errors.push("aircraft_category");
    if (!submission.aircraft) errors.push("aircraft");
    if (!field(formData, "owner_operator_approval_status")) errors.push("owner_operator_approval_status");
  }

  return errors.length ? { ok: false, errors } : { ok: true, submission };
}

export function publicFormDatabaseRow(
  submission: NormalizedPublicFormSubmission,
  context?: {
    sourceUrl?: string | null;
    referrer?: string | null;
    userAgent?: string | null;
  },
) {
  return {
    source_page: submission.sourcePage,
    submission_type: submission.submissionType,
    requester_name: submission.requesterName,
    first_name: submission.firstName,
    last_name: submission.lastName,
    full_name: submission.requesterName,
    email: submission.email,
    phone: submission.phone,
    company: submission.company,
    organization: submission.organization,
    company_operator: submission.company,
    aircraft: submission.aircraft,
    aircraft_category: submission.aircraftCategory,
    aircraft_type: submission.aircraft,
    aircraft_status: submission.aircraftStatus,
    tail_number: submission.tailNumber,
    route: submission.route,
    departure_airport: submission.departureAirport,
    arrival_airport: submission.arrivalAirport,
    timing: submission.timing,
    requested_date: submission.requestedDate,
    requested_time: submission.requestedTime,
    support_type: submission.supportType,
    support_path: submission.supportType,
    service_interest: submission.serviceInterest,
    inquiry_type: submission.submissionType === "contact_inquiry" ? submission.serviceInterest : null,
    crew_need: submission.crewNeed,
    passenger_context: submission.passengerContext,
    message: submission.message,
    requested_support_summary: submission.submissionType === "support_request" ? submission.message : null,
    acknowledgement: submission.acknowledgement,
    marketing_consent: submission.marketingConsent ?? false,
    sms_consent: submission.smsConsent ?? false,
    source_url: context?.sourceUrl ?? null,
    referrer: context?.referrer ?? null,
    user_agent: context?.userAgent ?? null,
    payload: submission.payload,
    raw_form: submission.payload,
    status: "new",
  };
}
