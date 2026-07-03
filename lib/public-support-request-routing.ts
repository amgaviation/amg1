type PayloadValue = string | boolean | string[];

export type RoutablePublicFormSubmission = {
  submissionType: string;
  sourcePage: string;
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
  payload: Record<string, PayloadValue>;
};

export type SupportRequestMissionInsert = {
  client_id: null;
  aircraft_id: null;
  tail_number: string | null;
  mission_type: string;
  status: "submitted";
  urgency: "standard" | "priority" | "aog";
  departure_airport: string;
  arrival_airport: string;
  requested_departure: string | null;
  passenger_count: number;
  additional_notes: string | null;
  client_notes: string;
};

export type PublicSupportRequestInsert = {
  mission_id?: string;
  client_id: null;
  first_name: string | null;
  last_name: string | null;
  requester_name: string;
  email: string;
  phone: string | null;
  preferred_contact_method: string | null;
  company_name: string | null;
  requested_service_category: string;
  aircraft_make: null;
  aircraft_model: null;
  aircraft_display: string | null;
  tail_number: string | null;
  aircraft_base: string | null;
  requested_timing: string | null;
  route: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  operational_summary: string | null;
  category_details: Record<string, string>;
  raw_form: Record<string, PayloadValue>;
  source_form_type: "support_request";
  source_submission_id: string;
};

export type SupportRequestRoutingRecords = {
  mission: SupportRequestMissionInsert;
  publicSupportRequest: PublicSupportRequestInsert;
};

type SupportRequestCreationResult =
  | { ok: true; missionId: string; missionRef: string | null }
  | { ok: false; error: unknown; stage: "lookup" | "mission" | "public_support_request" };

const COMMON_PAYLOAD_KEYS = new Set([
  "acknowledgment",
  "acknowledgement",
  "aircraft",
  "aircraft_category",
  "aircraft_information",
  "aircraft_make",
  "aircraft_model",
  "aircraft_status",
  "aircraft_type",
  "arrival_airport",
  "company",
  "company_operator",
  "departure_airport",
  "departure_current_airport",
  "desired_start_date",
  "destination",
  "destination_airport",
  "email",
  "first_name",
  "full_name",
  "home_airport",
  "last_name",
  "message",
  "origin",
  "origin_destination",
  "owner_operator_approval_status",
  "phone",
  "preferred_contact_method",
  "requested_date",
  "requested_service_category",
  "requested_support_summary",
  "requested_time",
  "requested_timing",
  "requester_email",
  "requester_name",
  "requester_phone",
  "requester_role",
  "route",
  "support_path",
  "support_type",
  "tail_number",
  "timeline_urgency",
  "timing",
]);

function compact(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeAirport(value: string | null) {
  return compact(value)?.toUpperCase() ?? null;
}

function payloadString(value: PayloadValue) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value.trim();
}

function categoryDetails(payload: Record<string, PayloadValue>) {
  const details: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (COMMON_PAYLOAD_KEYS.has(key)) continue;
    const rendered = payloadString(value);
    if (rendered) details[key] = rendered;
  }

  return details;
}

function requestedServiceCategory(submission: RoutablePublicFormSubmission) {
  return compact(submission.supportType) ?? compact(submission.serviceInterest) ?? "Aircraft Support";
}

function missionTypeForSupportCategory(category: string) {
  const value = category.toLowerCase();
  if (value.includes("maintenance")) return "maintenance_reposition";
  if (value.includes("ferry") || value.includes("reposition") || value.includes("movement")) return "ferry";
  if (value.includes("pilot") || value.includes("crew")) return "crew_reposition";
  return "aircraft_support";
}

function urgencyForTiming(timing: string | null) {
  const value = timing?.toLowerCase() ?? "";
  if (value.includes("aog") || value.includes("urgent") || value.includes("same-day") || value.includes("48 hour")) {
    return "aog";
  }
  if (value.includes("this week") || value.includes("priority")) return "priority";
  return "standard";
}

function requestedDepartureIso(date: string | null, time: string | null) {
  const cleanDate = compact(date);
  if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return null;

  const cleanTime = compact(time);
  const clock = cleanTime && /^\d{2}:\d{2}$/.test(cleanTime) ? cleanTime : "00:00";
  return `${cleanDate}T${clock}:00.000Z`;
}

function clientNotes(submission: RoutablePublicFormSubmission, sourceSubmissionId: string) {
  return [
    `Requester: ${submission.requesterName}`,
    `Email: ${submission.email}`,
    compact(submission.phone) ? `Phone: ${submission.phone}` : null,
    compact(submission.company ?? submission.organization) ? `Organization: ${submission.company ?? submission.organization}` : null,
    `Source form submission: ${sourceSubmissionId}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function isOperationalSupportRequest(submission: { submissionType: string }) {
  return submission.submissionType === "support_request";
}

export function buildSupportRequestRoutingRecords(
  submission: RoutablePublicFormSubmission,
  sourceSubmissionId: string,
): SupportRequestRoutingRecords {
  const category = requestedServiceCategory(submission);
  const departureAirport = normalizeAirport(submission.departureAirport) ?? "TBD";
  const arrivalAirport = normalizeAirport(submission.arrivalAirport) ?? "TBD";

  return {
    mission: {
      client_id: null,
      aircraft_id: null,
      tail_number: compact(submission.tailNumber)?.toUpperCase() ?? null,
      mission_type: missionTypeForSupportCategory(category),
      status: "submitted",
      urgency: urgencyForTiming(submission.timing),
      departure_airport: departureAirport,
      arrival_airport: arrivalAirport,
      requested_departure: requestedDepartureIso(submission.requestedDate, submission.requestedTime),
      passenger_count: 0,
      additional_notes: submission.message,
      client_notes: clientNotes(submission, sourceSubmissionId),
    },
    publicSupportRequest: {
      client_id: null,
      first_name: submission.firstName,
      last_name: submission.lastName,
      requester_name: submission.requesterName,
      email: submission.email,
      phone: compact(submission.phone),
      preferred_contact_method: typeof submission.payload.preferred_contact_method === "string"
        ? compact(submission.payload.preferred_contact_method)
        : null,
      company_name: compact(submission.company ?? submission.organization),
      requested_service_category: category,
      aircraft_make: null,
      aircraft_model: null,
      aircraft_display: submission.aircraft,
      tail_number: compact(submission.tailNumber)?.toUpperCase() ?? null,
      aircraft_base: typeof submission.payload.home_airport === "string"
        ? normalizeAirport(submission.payload.home_airport)
        : null,
      requested_timing: submission.timing,
      route: submission.route,
      departure_airport: departureAirport === "TBD" ? null : departureAirport,
      arrival_airport: arrivalAirport === "TBD" ? null : arrivalAirport,
      operational_summary: submission.message,
      category_details: categoryDetails(submission.payload),
      raw_form: submission.payload,
      source_form_type: "support_request",
      source_submission_id: sourceSubmissionId,
    },
  };
}

export async function createSupportRequestFromFormSubmission(
  db: any,
  submission: RoutablePublicFormSubmission,
  sourceSubmissionId: string,
): Promise<SupportRequestCreationResult> {
  const { data: existing, error: lookupError } = await db
    .from("public_support_requests")
    .select("mission_id, mission:mission_id(ref)")
    .eq("source_submission_id", sourceSubmissionId)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, stage: "lookup", error: lookupError };
  }

  if (existing?.mission_id) {
    const missionRef = Array.isArray(existing.mission)
      ? existing.mission[0]?.ref ?? null
      : existing.mission?.ref ?? null;
    return { ok: true, missionId: existing.mission_id, missionRef };
  }

  const records = buildSupportRequestRoutingRecords(submission, sourceSubmissionId);
  const { data: mission, error: missionError } = await db
    .from("missions")
    .insert(records.mission)
    .select("id, ref")
    .single();

  if (missionError || !mission?.id) {
    return { ok: false, stage: "mission", error: missionError ?? new Error("Mission insert returned no id") };
  }

  const { error: supportError } = await db.from("public_support_requests").insert({
    ...records.publicSupportRequest,
    mission_id: mission.id,
  });

  if (supportError) {
    await db.from("missions").delete().eq("id", mission.id);
    return { ok: false, stage: "public_support_request", error: supportError };
  }

  return { ok: true, missionId: mission.id, missionRef: mission.ref ?? null };
}
