export type PublicInquiryService =
  | "aircraft-management"
  | "contract-crew"
  | "ferry-repositioning"
  | "maintenance-flight"
  | "operations-coordination"
  | "fleet-support"
  | "general";

export type PublicInquiryTeam = "management" | "operations" | "general";
export type PublicInquiryUrgency = "standard" | "urgent" | "aog";
export type FieldErrors = Record<string, string>;

export type PublicInquiryContext = {
  service: PublicInquiryService | null;
  source: string | null;
  plan: string | null;
  aircraftCategory: string | null;
};

type Option = { value: string; label: string };

export type PublicInquiryServiceConfig = {
  value: PublicInquiryService;
  label: string;
  description: string;
  submitLabel: string;
  assignedTeam: PublicInquiryTeam;
  urgentEligible: boolean;
  legacyAliases: readonly string[];
  options: Record<string, readonly Option[]>;
};

export type NormalizedServiceInquiry = {
  serviceType: PublicInquiryService;
  serviceLabel: string;
  assignedTeam: PublicInquiryTeam;
  requesterName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  urgency: PublicInquiryUrgency;
  aircraftIdentifier: string | null;
  origin: string | null;
  destination: string | null;
  requestedDate: string | null;
  timeframe: string | null;
  summary: string | null;
  serviceDetails: Record<string, string | number | string[] | boolean>;
  context: { source: string | null; plan: string | null; aircraftCategory: string | null };
  idempotencyKey: string;
};

export const PUBLIC_INQUIRY_SERVICES = [
  {
    value: "aircraft-management",
    label: "Aircraft Management Support",
    description: "Management, owner communication, records, scheduling, and recurring aircraft support context.",
    submitLabel: "Request Management Consultation",
    assignedTeam: "management",
    urgentEligible: false,
    legacyAliases: ["aircraft-management-support"],
    options: {
      primarySupportNeed: [
        { value: "full-management", label: "Full management" },
        { value: "crew-coordination", label: "Crew coordination" },
        { value: "maintenance-oversight", label: "Maintenance oversight" },
        { value: "scheduling-operations", label: "Scheduling and operations" },
        { value: "records-administration", label: "Records and administration" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
  },
  {
    value: "contract-crew",
    label: "Contract Pilot / Crew Support",
    description: "Aircraft-specific pilot, cabin, or maintenance crew coverage review.",
    submitLabel: "Request Crew Support",
    assignedTeam: "operations",
    urgentEligible: true,
    legacyAliases: ["contract-pilot-support"],
    options: {
      positionNeeded: [
        { value: "pic", label: "PIC" },
        { value: "sic", label: "SIC" },
        { value: "cabin-attendant", label: "Cabin attendant" },
        { value: "maintenance-pilot-mechanic", label: "Maintenance pilot or mechanic" },
        { value: "other-not-sure", label: "Other / not sure" },
      ],
    },
  },
  {
    value: "ferry-repositioning",
    label: "Ferry & Repositioning",
    description: "Aircraft movement, delivery, repositioning, or maintenance positioning review.",
    submitLabel: "Request Ferry Review",
    assignedTeam: "operations",
    urgentEligible: true,
    legacyAliases: ["ferry-and-repositioning"],
    options: {},
  },
  {
    value: "maintenance-flight",
    label: "Maintenance Flight Support",
    description: "Maintenance positioning, acceptance, check-flight, return, or urgent AOG support context.",
    submitLabel: "Request Maintenance Support",
    assignedTeam: "operations",
    urgentEligible: true,
    legacyAliases: ["maintenance-flight-support"],
    options: {
      maintenanceSupportType: [
        { value: "position-to-maintenance", label: "Position aircraft to maintenance" },
        { value: "return-from-maintenance", label: "Return aircraft from maintenance" },
        { value: "acceptance-check-flight", label: "Acceptance or check-flight coordination" },
        { value: "aog-urgent", label: "AOG or urgent support" },
        { value: "other-maintenance-movement", label: "Other maintenance-related movement" },
      ],
    },
  },
  {
    value: "operations-coordination",
    label: "Flight Operations Coordination",
    description: "Scheduling, crew logistics, vendor coordination, documentation, and operational communication.",
    submitLabel: "Request Operations Support",
    assignedTeam: "operations",
    urgentEligible: true,
    legacyAliases: ["flight-operations-coordination"],
    options: {
      supportAreas: [
        { value: "scheduling", label: "Scheduling" },
        { value: "crew-logistics", label: "Crew logistics" },
        { value: "travel-lodging", label: "Travel and lodging" },
        { value: "vendor-fbo-coordination", label: "Vendor or FBO coordination" },
        { value: "documentation", label: "Documentation" },
        { value: "operational-communication", label: "Operational communication" },
        { value: "other", label: "Other" },
      ],
      timingFrequency: [
        { value: "one-time-need", label: "One-time need" },
        { value: "upcoming-mission", label: "Upcoming mission" },
        { value: "recurring-support", label: "Recurring support" },
        { value: "not-sure", label: "Not sure yet" },
      ],
    },
  },
  {
    value: "fleet-support",
    label: "Fleet Support Programs",
    description: "Recurring support review for multiple aircraft, departments, and ongoing coordination needs.",
    submitLabel: "Discuss Fleet Support",
    assignedTeam: "management",
    urgentEligible: false,
    legacyAliases: ["fleet-support-programs", "subscription-program-inquiry"],
    options: {
      supportFrequency: [
        { value: "occasional", label: "Occasional" },
        { value: "several-times-month", label: "Several times per month" },
        { value: "weekly", label: "Weekly" },
        { value: "frequent-ongoing", label: "Frequent or ongoing" },
        { value: "not-sure", label: "Not sure yet" },
      ],
      fleetSupportAreas: [
        { value: "crew-support", label: "Crew support" },
        { value: "scheduling-coordination", label: "Scheduling and coordination" },
        { value: "maintenance-movement", label: "Maintenance movement" },
        { value: "records-documentation", label: "Records and documentation" },
        { value: "vendor-coordination", label: "Vendor coordination" },
        { value: "owner-communication", label: "Owner communication" },
        { value: "general-fleet-support", label: "General fleet support" },
      ],
    },
  },
  {
    value: "general",
    label: "General Inquiry",
    description: "General AMG questions that do not require operational intake at first contact.",
    submitLabel: "Send Inquiry",
    assignedTeam: "general",
    urgentEligible: false,
    legacyAliases: ["aircraft_support", "other-support"],
    options: {},
  },
] as const satisfies readonly PublicInquiryServiceConfig[];

export const PUBLIC_INQUIRY_SERVICE_BY_VALUE = Object.fromEntries(
  PUBLIC_INQUIRY_SERVICES.map((service) => [service.value, service]),
) as unknown as Record<PublicInquiryService, PublicInquiryServiceConfig>;

export const PUBLIC_INQUIRY_ALIAS_TO_SERVICE = Object.fromEntries(
  PUBLIC_INQUIRY_SERVICES.flatMap((service) => [
    [service.value, service.value],
    ...service.legacyAliases.map((alias) => [alias, service.value] as const),
  ]),
) as Record<string, PublicInquiryService>;

const SOURCE_VALUES = new Set(["services-page", "plans-page", "aircraft-page", "navigation", "homepage", "site-cta", "booking-request", "request-support", "contact-page"]);
const PLAN_VALUES = new Set(["baseline", "active", "fleet", "custom-fleet"]);
const AIRCRAFT_CATEGORY_VALUES = new Set(["piston", "single-engine-piston", "multi-engine-piston", "turboprop", "light-jet", "midsize-jet", "super-midsize-jet", "large-cabin-heavy-jet", "single-engine-jet-vlj", "helicopter"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function param(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.replace(/\u0000/g, "").trim() : "";
}

function contextValue(value: string | null, allowed: Set<string>) {
  return value && allowed.has(value) ? value : null;
}

function optional(formData: FormData, key: string, max: number, errors: FieldErrors, label: string) {
  const value = clean(formData.get(key));
  if (!value) return null;
  if (value.length > max) {
    errors[key] = `${label} must be ${max} characters or fewer.`;
    return null;
  }
  return value;
}

function required(formData: FormData, key: string, max: number, errors: FieldErrors, label: string) {
  const value = optional(formData, key, max, errors, label);
  if (!value && !errors[key]) errors[key] = `${label} is required.`;
  return value;
}

function enumField(formData: FormData, key: string, options: readonly Option[], errors: FieldErrors, label: string) {
  const value = clean(formData.get(key));
  if (!value) {
    errors[key] = `${label} is required.`;
    return null;
  }
  if (!options.some((option) => option.value === value)) {
    errors[key] = `Choose a valid ${label.toLowerCase()}.`;
    return null;
  }
  return value;
}

function checkboxes(formData: FormData, key: string, options: readonly Option[], errors: FieldErrors, label: string) {
  const values = formData.getAll(key).map(clean).filter(Boolean);
  const allowed = new Set(options.map((option) => option.value));
  if (!values.length) {
    errors[key] = `${label} is required.`;
    return [];
  }
  if (values.some((value) => !allowed.has(value))) {
    errors[key] = `Choose valid ${label.toLowerCase()}.`;
    return [];
  }
  return values;
}

function dateField(formData: FormData, key: string, errors: FieldErrors, label: string) {
  const value = clean(formData.get(key));
  if (!value) {
    errors[key] = `${label} is required.`;
    return null;
  }
  if (!DATE_PATTERN.test(value)) {
    errors[key] = `${label} must use YYYY-MM-DD format.`;
    return null;
  }
  return value;
}

export function normalizeServiceValue(value?: string | null): PublicInquiryService | null {
  return value ? PUBLIC_INQUIRY_ALIAS_TO_SERVICE[value] ?? null : null;
}

export function normalizeServiceInquirySearchParams(params: Record<string, string | string[] | undefined>): PublicInquiryContext {
  return {
    service: normalizeServiceValue(param(params, "service")),
    source: contextValue(param(params, "source"), SOURCE_VALUES),
    plan: contextValue(param(params, "plan"), PLAN_VALUES),
    aircraftCategory: contextValue(param(params, "aircraftCategory"), AIRCRAFT_CATEGORY_VALUES),
  };
}

export function createInquiryReference(date = new Date()) {
  return `AMG-INQ-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function validateServiceInquiryFormData(formData: FormData):
  | { ok: true; inquiry: NormalizedServiceInquiry }
  | { ok: false; fieldErrors: FieldErrors; formError?: string } {
  const fieldErrors: FieldErrors = {};
  const serviceType = normalizeServiceValue(clean(formData.get("service_type")));
  if (!serviceType) return { ok: false, fieldErrors: { service_type: "Choose the service needed." } };

  const config = PUBLIC_INQUIRY_SERVICE_BY_VALUE[serviceType];
  const requesterName = required(formData, "full_name", 120, fieldErrors, "Full name");
  const rawEmail = required(formData, "email", 254, fieldErrors, "Email");
  const email = rawEmail?.toLowerCase() ?? null;
  if (email && !EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  const phone = optional(formData, "phone", 40, fieldErrors, "Phone")?.replace(/\s+/g, " ") ?? null;
  const summary = optional(formData, "summary", 2000, fieldErrors, "Brief details");
  const idempotencyKey = required(formData, "idempotency_key", 120, fieldErrors, "Submission token");
  const context = {
    source: contextValue(clean(formData.get("source")) || null, SOURCE_VALUES),
    plan: contextValue(clean(formData.get("plan")) || null, PLAN_VALUES),
    aircraftCategory: contextValue(clean(formData.get("aircraftCategory")) || null, AIRCRAFT_CATEGORY_VALUES),
  };
  const serviceDetails: NormalizedServiceInquiry["serviceDetails"] = {};
  let organization: string | null = null;
  let aircraftIdentifier: string | null = null;
  let origin: string | null = null;
  let destination: string | null = null;
  let requestedDate: string | null = null;
  let timeframe: string | null = null;
  let urgency: PublicInquiryUrgency = config.urgentEligible && clean(formData.get("urgent")) === "yes" ? "urgent" : "standard";

  if (serviceType === "general" && !summary) fieldErrors.summary = "Brief details are required for general inquiries.";
  if (serviceType === "aircraft-management") {
    organization = optional(formData, "organization", 160, fieldErrors, "Company / owner entity");
    aircraftIdentifier = optional(formData, "aircraft_identifier", 160, fieldErrors, "Aircraft make/model or tail number");
    const aircraftBase = optional(formData, "aircraft_base", 160, fieldErrors, "Aircraft base or location");
    const need = enumField(formData, "primary_support_need", config.options.primarySupportNeed, fieldErrors, "Primary support need");
    if (aircraftBase) serviceDetails.aircraftBase = aircraftBase;
    if (need) serviceDetails.primarySupportNeed = need;
  }
  if (serviceType === "contract-crew") {
    aircraftIdentifier = required(formData, "aircraft_identifier", 160, fieldErrors, "Aircraft make/model");
    const position = enumField(formData, "position_needed", config.options.positionNeeded, fieldErrors, "Position needed");
    const coverage = required(formData, "coverage_location", 160, fieldErrors, "Coverage location");
    timeframe = required(formData, "start_timeframe", 160, fieldErrors, "Start date or general timeframe");
    if (position) serviceDetails.positionNeeded = position;
    if (coverage) serviceDetails.coverageLocation = coverage;
  }
  if (serviceType === "ferry-repositioning") {
    aircraftIdentifier = required(formData, "aircraft_identifier", 160, fieldErrors, "Aircraft make/model or tail number");
    origin = required(formData, "origin", 160, fieldErrors, "Origin airport or location");
    destination = required(formData, "destination", 160, fieldErrors, "Destination airport or location");
    requestedDate = dateField(formData, "aircraft_ready_date", fieldErrors, "Aircraft-ready date");
  }
  if (serviceType === "maintenance-flight") {
    aircraftIdentifier = required(formData, "aircraft_identifier", 160, fieldErrors, "Aircraft make/model or tail number");
    const location = required(formData, "current_location", 160, fieldErrors, "Current airport or aircraft location");
    const support = enumField(formData, "maintenance_support_type", config.options.maintenanceSupportType, fieldErrors, "Support needed");
    timeframe = required(formData, "requested_timeframe", 160, fieldErrors, "Requested date or timeframe");
    if (support === "aog-urgent") urgency = "aog";
    if (location) serviceDetails.currentLocation = location;
    if (support) serviceDetails.maintenanceSupportType = support;
  }
  if (serviceType === "operations-coordination") {
    organization = optional(formData, "organization", 160, fieldErrors, "Company or flight department");
    const aircraftBaseContext = optional(formData, "aircraft_base_context", 240, fieldErrors, "Aircraft / primary operating base");
    const supportAreas = checkboxes(formData, "support_areas", config.options.supportAreas, fieldErrors, "Support areas");
    const timing = enumField(formData, "timing_frequency", config.options.timingFrequency, fieldErrors, "Timing or frequency");
    if (aircraftBaseContext) serviceDetails.aircraftBaseContext = aircraftBaseContext;
    if (supportAreas.length) serviceDetails.supportAreas = supportAreas;
    if (timing) serviceDetails.timingFrequency = timing;
  }
  if (serviceType === "fleet-support") {
    const countRaw = required(formData, "aircraft_count", 4, fieldErrors, "Number of aircraft");
    const count = countRaw ? Number(countRaw) : NaN;
    if (countRaw && (!Number.isInteger(count) || count < 1 || count > 999)) fieldErrors.aircraft_count = "Enter a positive aircraft count under 1,000.";
    else if (countRaw) serviceDetails.aircraftCount = count;
    const aircraftTypesBases = optional(formData, "aircraft_types_bases", 240, fieldErrors, "Aircraft types and primary bases");
    const frequency = enumField(formData, "support_frequency", config.options.supportFrequency, fieldErrors, "Support frequency");
    const supportAreas = checkboxes(formData, "fleet_support_areas", config.options.fleetSupportAreas, fieldErrors, "Support areas");
    if (aircraftTypesBases) serviceDetails.aircraftTypesBases = aircraftTypesBases;
    if (frequency) serviceDetails.supportFrequency = frequency;
    if (supportAreas.length) serviceDetails.fleetSupportAreas = supportAreas;
  }

  if (phone && phone.replace(/\D/g, "").length < 7) fieldErrors.phone = "Enter a phone number with at least 7 digits.";
  if (urgency !== "standard" && !phone) fieldErrors.phone = "Phone is required for urgent or AOG inquiries.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };

  return {
    ok: true,
    inquiry: {
      serviceType,
      serviceLabel: config.label,
      assignedTeam: config.assignedTeam,
      requesterName: requesterName!,
      email: email!,
      phone,
      organization,
      urgency,
      aircraftIdentifier,
      origin,
      destination,
      requestedDate,
      timeframe,
      summary,
      serviceDetails,
      context,
      idempotencyKey: idempotencyKey!,
    },
  };
}
