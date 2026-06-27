import {
  normalizeContactSubmission,
  normalizeSupportSubmission,
  publicFormDatabaseRow,
} from "../lib/public-form-normalization.ts";
import {
  buildSupportRequestRoutingRecords,
  isOperationalSupportRequest,
} from "../lib/public-support-request-routing.ts";
import { MISSION_STATUS_LABEL } from "../lib/portal/constants.ts";
import { readFileSync } from "node:fs";

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
assert(!isOperationalSupportRequest(contact.submission), "contact inquiry should stay a generic form submission");

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
assert(isOperationalSupportRequest(support.submission), "request support form should route as an operational support request");

const sourceSubmissionId = "00000000-0000-4000-8000-000000000001";
const supportRouting = buildSupportRequestRoutingRecords(support.submission, sourceSubmissionId);
assert(supportRouting.mission.status === "submitted", "new support request mission should use submitted status");
assert(MISSION_STATUS_LABEL.submitted === "New", "submitted support requests should be labeled New in the admin UI");
assert(supportRouting.mission.mission_type === "crew_reposition", "contract pilot support should route to crew reposition mission type");
assert(supportRouting.mission.departure_airport === "KPMP", "mission should preserve departure airport");
assert(supportRouting.mission.arrival_airport === "KTEB", "mission should preserve arrival airport");
assert(supportRouting.publicSupportRequest.source_submission_id === sourceSubmissionId, "support request should link to source form submission");
assert(supportRouting.publicSupportRequest.source_form_type === "support_request", "support request should preserve source form type");
assert(supportRouting.publicSupportRequest.raw_form.crew_need_type === "SIC", "support request should preserve raw submitted payload");
assert(supportRouting.publicSupportRequest.category_details.crew_need_type === "SIC", "support request should expose category details");

const ferry = normalizeSupportSubmission(fd({
  full_name: "Fran Ferry",
  email: "fran@example.com",
  aircraft_category: "Light Jet",
  aircraft_type: "Citation CJ3",
  support_path: "Ferry & Repositioning",
  requested_support_summary: "Move the aircraft to maintenance.",
  timeline_urgency: "Within 48 hours",
  owner_operator_approval_status: "Yes",
  departure_current_airport: "kpbi",
  destination_airport: "kfxe",
  acknowledgment: "accepted",
}));

assert(ferry.ok, "ferry request should normalize");
const ferryRouting = buildSupportRequestRoutingRecords(ferry.submission, "00000000-0000-4000-8000-000000000002");
assert(ferryRouting.mission.mission_type === "ferry", "ferry support should route to ferry mission type");
assert(ferryRouting.mission.urgency === "aog", "48 hour ferry support should route as urgent");

const maintenance = normalizeSupportSubmission(fd({
  full_name: "Mia Maintenance",
  email: "mia@example.com",
  aircraft_category: "Midsize Jet",
  aircraft_type: "Citation XLS",
  support_path: "Maintenance Flight Support",
  requested_support_summary: "Coordinate a maintenance repositioning.",
  timeline_urgency: "This week",
  owner_operator_approval_status: "Pending",
  departure_current_airport: "kteb",
  destination_airport: "kbed",
  acknowledgment: "accepted",
}));

assert(maintenance.ok, "maintenance support request should normalize");
const maintenanceRouting = buildSupportRequestRoutingRecords(maintenance.submission, "00000000-0000-4000-8000-000000000003");
assert(maintenanceRouting.mission.mission_type === "maintenance_reposition", "maintenance support should route to maintenance reposition mission type");
assert(maintenanceRouting.mission.urgency === "priority", "this-week maintenance support should route as priority");

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

const migration = readFileSync(
  new URL("../supabase/migrations/20260627120000_route_support_requests_to_portal.sql", import.meta.url),
  "utf8",
);
const portalQueries = readFileSync(new URL("../lib/portal/queries.ts", import.meta.url), "utf8");
const formSubmissionQueries = readFileSync(new URL("../lib/portal/form-submissions.ts", import.meta.url), "utf8");

assert(migration.includes("source_submission_id uuid"), "migration should add source_submission_id");
assert(migration.includes("insert into public.missions"), "migration should backfill support requests into missions");
assert(migration.includes("insert into public.public_support_requests"), "migration should backfill public support request detail rows");
assert(migration.includes("enable row level security"), "migration should enable RLS for public_support_requests");
assert(portalQueries.includes('.neq("submission_type", "support_request")'), "admin dashboard form count should exclude support requests");
assert(formSubmissionQueries.includes('.neq("submission_type", "support_request")'), "form submissions list should exclude support requests by default");

console.log("Public form normalization verification passed.");
