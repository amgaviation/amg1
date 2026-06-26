import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  publicFormDatabaseRow,
} from "../lib/public-form-normalization.ts";
import {
  normalizeServiceInquirySearchParams,
  validateServiceInquiryFormData,
} from "../lib/public-inquiries.ts";

function fd(entries) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const contact = normalizeContactSubmission(fd({
  full_name: "  Jane Owner ",
  email: " JANE@example.com ",
  phone: " 555-111-2222 ",
  inquiry_type: "Plan Review Question",
  message: " Please review plan options. ",
  acknowledgment: "accepted",
  aircraft_status: "Should stay in payload only unless whitelisted",
}));

assert(contact.ok, "contact form should normalize");
assert(contact.submission.email === "jane@example.com", "contact email should be normalized");
assert(contact.submission.payload.acknowledgment === true, "acknowledgment should be boolean in payload");

const support = normalizeSupportSubmission(fd({
  full_name: "Alex Dispatcher",
  email: "alex@example.com",
  phone: "555-333-4444",
  company_operator: "Example Flight Dept",
  requester_role: "Flight Department",
  preferred_contact_method: "Email",
  aircraft_category: "Light Jet",
  aircraft_type: "Phenom 300",
  tail_number: " n123ab ",
  home_airport: "kpmp",
  aircraft_status: "Active / Available",
  support_path: "Contract Pilot Support",
  requested_support_summary: "Need SIC coverage.",
  timeline_urgency: "This week",
  owner_operator_approval_status: "Yes",
  departure_airport: "kpmp",
  arrival_airport: "kteb",
  crew_need_type: "SIC",
  acknowledgment: "accepted",
}));

assert(support.ok, "structured support form should normalize");
assert(support.submission.tailNumber === "N123AB", "tail number should be normalized");
assert(support.submission.departureAirport === "KPMP", "airport should be uppercased");

const legacySupport = normalizeSupportSubmission(fd({
  first_name: "Morgan",
  last_name: "Crew",
  email: "morgan@example.com",
  phone: "555-555-1212",
  requested_service_category: "contract-pilot-support",
  requested_timing: "Next month",
  operational_summary: "Need pilot support for owner trip.",
  acknowledgment: "accepted",
}));

assert(legacySupport.ok, "legacy public support form should normalize");
const row = publicFormDatabaseRow(legacySupport.submission, {
  sourceUrl: "https://example.com/request-support",
  referrer: "https://example.com/request-support",
  userAgent: "verification",
});

assert(Object.hasOwn(row, "payload"), "database row should include payload");
assert(!Object.hasOwn(row, "requested_service_category"), "database row must not insert arbitrary raw fields");
assert(row.acknowledgement === true, "database row acknowledgement should be boolean");
assert(row.marketing_consent === false, "missing marketing consent should store as false");
assert(row.status === "new", "database row should use lowercase new status");

const serviceContext = normalizeServiceInquirySearchParams({
  service: "aircraft-management-support",
  plan: "baseline",
  aircraftCategory: "light-jet",
  source: "services-page",
});

assert(serviceContext.service === "aircraft-management", "legacy service aliases should normalize to canonical services");
assert(serviceContext.plan === "baseline", "plan context should remain separate from service");
assert(serviceContext.aircraftCategory === "light-jet", "aircraft category context should remain separate from service");

const managementInquiry = validateServiceInquiryFormData(fd({
  service_type: "aircraft-management",
  full_name: "Jane Owner",
  email: "jane@example.com",
  phone: "",
  summary: "",
  primary_support_need: "full-management",
  idempotency_key: "verify-management",
}));

assert(managementInquiry.ok, "aircraft management should validate without route or date");
assert(managementInquiry.inquiry.assignedTeam === "management", "aircraft management should route to management");
assert(!Object.hasOwn(managementInquiry.inquiry.serviceDetails, "origin"), "management inquiry should not store route fields");

const generalInquiry = validateServiceInquiryFormData(fd({
  service_type: "general",
  full_name: "Alex General",
  email: "alex@example.com",
  summary: "",
  idempotency_key: "verify-general",
}));

assert(!generalInquiry.ok, "general inquiry should require brief details");
assert(generalInquiry.fieldErrors.summary, "general inquiry summary error should be field-specific");

const aogInquiry = validateServiceInquiryFormData(fd({
  service_type: "maintenance-flight",
  full_name: "Morgan Maintenance",
  email: "morgan@example.com",
  aircraft_identifier: "N123AB",
  current_location: "KPMP",
  maintenance_support_type: "aog-urgent",
  requested_timeframe: "Today",
  idempotency_key: "verify-aog",
}));

assert(!aogInquiry.ok, "AOG maintenance inquiry should require phone");
assert(aogInquiry.fieldErrors.phone, "AOG phone error should be field-specific");

console.log("Public form normalization verification passed.");
