export const CREW_EMAIL_TEMPLATE_KEYS = [
  "crew_network_acceptance",
  "account_suspension",
  "mission_request",
  "document_request",
  "logbook_request",
  "post_mission_follow_up",
  "credential_expiration_reminder",
  "profile_information_request",
  "mission_availability_check",
  "general_crew_communication",
] as const;

export type CrewEmailTemplateKey = (typeof CREW_EMAIL_TEMPLATE_KEYS)[number];

export const CREW_EMAIL_VARIABLES = [
  "crew_first_name",
  "crew_full_name",
  "crew_email",
  "home_airport",
  "mission_id",
  "mission_date",
  "departure_airport",
  "arrival_airport",
  "aircraft_type",
  "tail_number",
  "requested_documents",
  "portal_link",
  "amg_operations_email",
] as const;

export type CrewEmailVariableKey = (typeof CREW_EMAIL_VARIABLES)[number];
export type CrewEmailVariables = Record<CrewEmailVariableKey, string>;

export type CrewEmailTemplateSeed = {
  key: CrewEmailTemplateKey;
  name: string;
  category: "crew_coordination" | "documents" | "status_update" | "general";
  subject: string;
  body: string;
  variables: CrewEmailVariableKey[];
  active: boolean;
};

const allVariables = [...CREW_EMAIL_VARIABLES];
const coreVariables = ["crew_first_name", "crew_full_name", "crew_email", "portal_link", "amg_operations_email"] as CrewEmailVariableKey[];
const missionVariables = [
  "mission_id",
  "mission_date",
  "departure_airport",
  "arrival_airport",
  "aircraft_type",
  "tail_number",
] as CrewEmailVariableKey[];

export const CREW_EMAIL_TEMPLATES: CrewEmailTemplateSeed[] = [
  {
    key: "crew_network_acceptance",
    name: "Crew Network Acceptance",
    category: "crew_coordination",
    subject: "Accepted into the AMG Crew Network",
    body: `Hello {{crew_first_name}},

AMG has accepted you into the AMG Crew Network.

This means AMG may contact you for mission opportunities when your qualifications, aircraft experience, location, availability, and operational fit align with a request. Mission contact is based on operational need and does not guarantee an assignment.

Please keep your AMG portal profile, aircraft experience, credentials, contact details, and availability current.

AMG Operations
{{amg_operations_email}}`,
    variables: [...coreVariables, "home_airport"],
    active: true,
  },
  {
    key: "account_suspension",
    name: "Account Suspension",
    category: "status_update",
    subject: "AMG Crew Network account status",
    body: `Hello {{crew_first_name}},

Your AMG portal or crew network account has been suspended or placed on hold pending review.

During this review period, AMG may pause mission outreach, credential review, portal access, or network activity connected to your profile. AMG Operations will contact you if more information is needed.

If you believe this status is incorrect, reply to this message or contact AMG Operations at {{amg_operations_email}}.

AMG Operations`,
    variables: coreVariables,
    active: true,
  },
  {
    key: "mission_request",
    name: "Mission Request",
    category: "crew_coordination",
    subject: "Availability request: {{mission_id}}",
    body: `Hello {{crew_first_name}},

AMG is checking your availability and interest for a potential mission.

Mission: {{mission_id}}
Date: {{mission_date}}
Route: {{departure_airport}} to {{arrival_airport}}
Aircraft: {{aircraft_type}}
Tail: {{tail_number}}

Please reply with your availability, any duty or travel constraints, and relevant aircraft-specific notes. This message is an availability request only; the mission is not assigned or confirmed until AMG Operations completes review and issues a separate confirmation.

AMG Operations
{{amg_operations_email}}`,
    variables: [...coreVariables, ...missionVariables],
    active: true,
  },
  {
    key: "document_request",
    name: "Document Request",
    category: "documents",
    subject: "Documents needed for AMG crew review",
    body: `Hello {{crew_first_name}},

AMG needs updated or missing crew documents before continuing review.

Requested documents:
{{requested_documents}}

Please upload the requested files through the AMG portal or reply with any questions. Portal link: {{portal_link}}

AMG Operations`,
    variables: [...coreVariables, "requested_documents"],
    active: true,
  },
  {
    key: "logbook_request",
    name: "Logbook Request",
    category: "documents",
    subject: "Logbook details requested",
    body: `Hello {{crew_first_name}},

AMG needs logbook details or experience verification for crew review.

Please provide the relevant logbook pages, time summaries, recency details, aircraft-specific experience, or type-specific totals. If the request relates to a mission, include any context for {{aircraft_type}} or {{tail_number}} that may help AMG Operations complete review.

You may upload documents in the portal at {{portal_link}} or reply with questions.

AMG Operations`,
    variables: [...coreVariables, "aircraft_type", "tail_number"],
    active: true,
  },
  {
    key: "post_mission_follow_up",
    name: "Post-Mission Follow-Up Inquiry",
    category: "crew_coordination",
    subject: "Post-mission follow-up: {{mission_id}}",
    body: `Hello {{crew_first_name}},

AMG is following up on {{mission_id}}.

Please reply with any post-mission feedback, timing notes, aircraft or crew coordination issues, FBO or ground handling notes, documentation items, or other details AMG should retain for the record.

AMG Operations`,
    variables: [...coreVariables, ...missionVariables],
    active: true,
  },
  {
    key: "credential_expiration_reminder",
    name: "Credential Expiration Reminder",
    category: "documents",
    subject: "Crew credential update needed",
    body: `Hello {{crew_first_name}},

AMG records show one or more crew credentials or documents are expired or approaching expiration.

Requested documents:
{{requested_documents}}

Please upload the updated item through the AMG portal when available: {{portal_link}}

AMG Operations`,
    variables: [...coreVariables, "requested_documents"],
    active: true,
  },
  {
    key: "profile_information_request",
    name: "Profile Information Request",
    category: "crew_coordination",
    subject: "AMG crew profile update requested",
    body: `Hello {{crew_first_name}},

AMG is updating crew network records and needs your current profile information.

Please review your availability, aircraft types, rates, home airport, service areas, contact details, and any recent qualification changes. You can update your profile in the AMG portal: {{portal_link}}

AMG Operations`,
    variables: [...coreVariables, "home_airport"],
    active: true,
  },
  {
    key: "mission_availability_check",
    name: "Mission Availability Check",
    category: "crew_coordination",
    subject: "Crew availability check",
    body: `Hello {{crew_first_name}},

AMG is checking crew availability for an upcoming date range, aircraft type, or location.

Aircraft: {{aircraft_type}}
Departure: {{departure_airport}}
Arrival: {{arrival_airport}}
Date: {{mission_date}}

Please reply with your availability, positioning constraints, and any limits AMG should consider before moving forward.

AMG Operations`,
    variables: [...coreVariables, "mission_date", "departure_airport", "arrival_airport", "aircraft_type"],
    active: true,
  },
  {
    key: "general_crew_communication",
    name: "General Crew Communication",
    category: "general",
    subject: "AMG Crew Network update",
    body: `Hello {{crew_first_name}},

AMG Operations is contacting you regarding your AMG Crew Network profile.

Please review the message details and reply with any questions or updates.

AMG Operations
{{amg_operations_email}}`,
    variables: allVariables,
    active: true,
  },
];

export function firstNameFromName(name: string | null | undefined, email: string) {
  const clean = name?.trim();
  if (clean) return clean.split(/\s+/)[0] ?? clean;
  return email.split("@")[0] || "Crew Member";
}

export function mergeCrewEmailText(template: string, variables: Record<string, string | null | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (token, key: string) => {
    const value = variables[key];
    return value === null || value === undefined || value === "" ? token : String(value);
  });
}

export function buildCrewEmailVariables(input: {
  crew: {
    fullName?: string | null;
    email: string;
    homeAirport?: string | null;
  };
  mission?: {
    id?: string | null;
    date?: string | null;
    departureAirport?: string | null;
    arrivalAirport?: string | null;
    aircraftType?: string | null;
    tailNumber?: string | null;
  } | null;
  requestedDocuments?: string | null;
  portalLink?: string | null;
  operationsEmail?: string | null;
}): CrewEmailVariables {
  const fullName = input.crew.fullName?.trim() || input.crew.email;

  return {
    crew_first_name: firstNameFromName(fullName, input.crew.email),
    crew_full_name: fullName,
    crew_email: input.crew.email,
    home_airport: input.crew.homeAirport ?? "",
    mission_id: input.mission?.id ?? "",
    mission_date: input.mission?.date ?? "",
    departure_airport: input.mission?.departureAirport ?? "",
    arrival_airport: input.mission?.arrivalAirport ?? "",
    aircraft_type: input.mission?.aircraftType ?? "",
    tail_number: input.mission?.tailNumber ?? "",
    requested_documents: input.requestedDocuments ?? "",
    portal_link: input.portalLink ?? "",
    amg_operations_email: input.operationsEmail ?? "",
  };
}
