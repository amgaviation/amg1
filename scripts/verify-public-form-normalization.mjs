import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  publicFormDatabaseRow,
} from "../lib/public-form-normalization.ts";

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
assert(row.status === "new", "database row should use lowercase new status");

console.log("Public form normalization verification passed.");
