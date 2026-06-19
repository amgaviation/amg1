export const contactInquiryTypes = [
  { value: "General Inquiry", label: "General Inquiry" },
  { value: "Plan Review Question", label: "Plan Review Question" },
  { value: "Pilot Network Question", label: "Pilot Network Question" },
  { value: "Vendor / Partner Inquiry", label: "Vendor / Partner Inquiry" },
  { value: "Billing / Administrative Question", label: "Billing / Administrative Question" },
  { value: "Aircraft Support Question", label: "Aircraft Support Question" },
] as const;

export const preferredContactMethods = [
  { value: "Email", label: "Email" },
  { value: "Phone", label: "Phone" },
  { value: "Text", label: "Text" },
  { value: "No Preference", label: "No Preference" },
] as const;

export const requesterRoles = [
  { value: "Owner", label: "Owner" },
  { value: "Operator", label: "Operator" },
  { value: "Flight Department", label: "Flight Department" },
  { value: "Pilot / Crew", label: "Pilot / Crew" },
  { value: "Passenger / Authorized Requester", label: "Passenger / Authorized Requester" },
  { value: "Maintenance Provider", label: "Maintenance Provider" },
  { value: "Vendor / Partner", label: "Vendor / Partner" },
  { value: "Other", label: "Other" },
] as const;

export const aircraftCategories = [
  { value: "Piston", label: "Piston" },
  { value: "Very Light Jet", label: "Very Light Jet" },
  { value: "Light Jet", label: "Light Jet" },
  { value: "Midsize Jet", label: "Midsize Jet" },
  { value: "Super-Midsize Jet", label: "Super-Midsize Jet" },
  { value: "Heavy Jet", label: "Heavy Jet" },
  { value: "Ultra-Long-Range / Bizliner", label: "Ultra-Long-Range / Bizliner" },
  { value: "Other / Not Sure", label: "Other / Not Sure" },
] as const;

export const aircraftStatuses = [
  { value: "Active / Available", label: "Active / Available" },
  { value: "In Maintenance", label: "In Maintenance" },
  { value: "Awaiting Maintenance", label: "Awaiting Maintenance" },
  { value: "AOG / Unavailable", label: "AOG / Unavailable" },
  { value: "Pre-Purchase / Acquisition Review", label: "Pre-Purchase / Acquisition Review" },
  { value: "Unknown / To Be Reviewed", label: "Unknown / To Be Reviewed" },
] as const;

export const supportPaths = [
  { value: "Aircraft Management Support", label: "Aircraft Management Support" },
  { value: "Contract Pilot Support", label: "Contract Pilot Support" },
  { value: "Ferry & Repositioning", label: "Ferry & Repositioning" },
  { value: "Maintenance Flight Support", label: "Maintenance Flight Support" },
  { value: "Flight Operations Coordination", label: "Flight Operations Coordination" },
  { value: "Fleet Support Program", label: "Fleet Support Program" },
  { value: "Plan / Subscription Review", label: "Plan / Subscription Review" },
  { value: "Pilot Network Inquiry", label: "Pilot Network Inquiry" },
  { value: "Vendor / Partner Coordination", label: "Vendor / Partner Coordination" },
  { value: "Other Support", label: "Other Support" },
] as const;

export const timelineOptions = [
  { value: "General / No immediate timeline", label: "General / No immediate timeline" },
  { value: "This week", label: "This week" },
  { value: "Within 48 hours", label: "Within 48 hours" },
  { value: "Same-day / urgent", label: "Same-day / urgent" },
  { value: "Recurring support discussion", label: "Recurring support discussion" },
] as const;

export const ownerApprovalStatuses = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
  { value: "Pending", label: "Pending" },
  { value: "Not Applicable", label: "Not Applicable" },
  { value: "Unknown", label: "Unknown" },
] as const;

export const submissionStatuses = [
  "new",
  "reviewed",
  "in_progress",
  "closed",
  "archived",
] as const;

export type ConditionalField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select";
  options?: readonly { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
};

export const conditionalSupportFields: Record<string, ConditionalField[]> = {
  "Aircraft Management Support": [
    { name: "number_of_aircraft", label: "Number of aircraft", type: "number" },
    { name: "aircraft_usage_profile", label: "Aircraft usage profile", type: "textarea" },
    { name: "desired_management_scope", label: "Desired management/support scope", type: "textarea" },
    { name: "current_flight_department_structure", label: "Current flight department structure", type: "textarea" },
    { name: "owner_operator_communication_preferences", label: "Owner/operator communication preferences", type: "textarea" },
    { name: "recurring_support_needs", label: "Recurring support needs", type: "textarea" },
    { name: "billing_admin_support_needed", label: "Billing/admin support needed?", type: "text" },
    { name: "vendor_coordination_needed", label: "Vendor coordination needed?", type: "text" },
  ],
  "Contract Pilot Support": [
    { name: "crew_need_type", label: "Crew need type", type: "select", options: [
      { value: "PIC", label: "PIC" },
      { value: "SIC", label: "SIC" },
      { value: "Safety Pilot", label: "Safety Pilot" },
      { value: "Contract Crew", label: "Contract Crew" },
      { value: "Acceptance / Maintenance Pilot", label: "Acceptance / Maintenance Pilot" },
      { value: "Other", label: "Other" },
    ] },
    { name: "pic_sic_requirement", label: "PIC/SIC requirement" },
    { name: "number_of_crew_needed", label: "Number of crew needed", type: "number" },
    { name: "aircraft_qualification_requirements", label: "Aircraft qualification requirements", type: "textarea" },
    { name: "trip_dates", label: "Trip dates" },
    { name: "departure_airport", label: "Departure airport" },
    { name: "arrival_airport", label: "Arrival airport" },
    { name: "overnight_expected", label: "Overnight expected?" },
    { name: "insurance_owner_approval_status", label: "Insurance/owner approval status" },
    { name: "part_91_owner_operator_context", label: "Part 91, owner, operator, or other support context?", type: "textarea" },
    { name: "special_crew_requirements", label: "Special crew requirements", type: "textarea" },
  ],
  "Ferry & Repositioning": [
    { name: "current_aircraft_location_detail", label: "Current aircraft location" },
    { name: "destination_airport_detail", label: "Destination airport" },
    { name: "desired_movement_date", label: "Desired movement date", type: "date" },
    { name: "airworthiness_status", label: "Aircraft airworthiness status" },
    { name: "maintenance_release_status", label: "Maintenance release status, if applicable" },
    { name: "required_crew_type", label: "Required crew type" },
    { name: "special_handling_notes", label: "Special handling notes", type: "textarea" },
    { name: "owner_operator_approval_status_detail", label: "Owner/operator approval status" },
    { name: "ferry_permit_or_limitation", label: "Ferry permit or operational limitation known?", type: "textarea" },
  ],
  "Maintenance Flight Support": [
    { name: "maintenance_facility_name", label: "Maintenance facility name" },
    { name: "maintenance_facility_airport", label: "Maintenance facility airport" },
    { name: "maintenance_aircraft_status", label: "Aircraft status" },
    { name: "maintenance_movement_reason", label: "Reason for maintenance movement or test flight", type: "textarea" },
    { name: "squawk_inspection_context", label: "Squawk/inspection context", type: "textarea" },
    { name: "maintenance_release_status", label: "Maintenance release status" },
    { name: "acceptance_test_flight_timing", label: "Desired acceptance/test flight timing" },
    { name: "required_crew_type", label: "Required crew type" },
    { name: "facility_contact", label: "Facility contact, if available" },
    { name: "owner_operator_approval_status_detail", label: "Owner/operator approval status" },
  ],
  "Flight Operations Coordination": [
    { name: "mission_type", label: "Mission type" },
    { name: "number_of_legs", label: "Number of legs, if known", type: "number" },
    { name: "departure_airport", label: "Departure airport" },
    { name: "destination_airport", label: "Destination airport" },
    { name: "passenger_requester_context", label: "Passenger/requester context, if applicable", type: "textarea" },
    { name: "crew_coordination_needed", label: "Crew coordination needed?" },
    { name: "vendor_fbo_coordination_needed", label: "Vendor/FBO coordination needed?" },
    { name: "ground_handling_logistics_notes", label: "Ground handling or logistics notes", type: "textarea" },
    { name: "operating_limitations_constraints", label: "Operating limitations or known constraints", type: "textarea" },
  ],
  "Fleet Support Program": [
    { name: "number_of_aircraft", label: "Number of aircraft", type: "number" },
    { name: "aircraft_categories", label: "Aircraft categories" },
    { name: "current_bases", label: "Current bases", type: "textarea" },
    { name: "expected_monthly_support_volume", label: "Expected monthly support volume", type: "textarea" },
    { name: "support_needs_across_aircraft", label: "Support needs across aircraft", type: "textarea" },
    { name: "crew_coordination_needs", label: "Crew coordination needs", type: "textarea" },
    { name: "maintenance_movement_frequency", label: "Maintenance movement frequency" },
    { name: "owner_operator_reporting_preferences", label: "Owner/operator reporting preferences", type: "textarea" },
    { name: "administrative_billing_support_needs", label: "Administrative/billing support needs", type: "textarea" },
  ],
  "Plan / Subscription Review": [
    { name: "plan_aircraft_category", label: "Aircraft category" },
    { name: "expected_monthly_flight_volume", label: "Expected monthly flight volume" },
    { name: "expected_maintenance_movement_frequency", label: "Expected maintenance movement frequency" },
    { name: "crew_support_needed", label: "Crew support needed?" },
    { name: "owner_operator_visibility_needs", label: "Owner/operator visibility needs", type: "textarea" },
    { name: "preferred_billing_frequency", label: "Preferred billing frequency" },
    { name: "current_support_pain_points", label: "Current support pain points", type: "textarea" },
    { name: "plans_page_tier_interest", label: "Plans page tier of interest, if known" },
  ],
  "Pilot Network Inquiry": [
    { name: "pilot_name", label: "Pilot name, if different from requester" },
    { name: "certificates_ratings_summary", label: "Certificates/ratings summary", type: "textarea" },
    { name: "aircraft_experience", label: "Aircraft experience", type: "textarea" },
    { name: "pilot_home_airport", label: "Home airport" },
    { name: "availability_area", label: "Availability area" },
    { name: "pilot_interest_type", label: "Interest type", type: "select", options: [
      { value: "Join Pilot Network", label: "Join Pilot Network" },
      { value: "Update Pilot Information", label: "Update Pilot Information" },
      { value: "Discuss AMG Crew Opportunities", label: "Discuss AMG Crew Opportunities" },
      { value: "Other Pilot Inquiry", label: "Other Pilot Inquiry" },
    ] },
    { name: "pilot_notes", label: "Notes", type: "textarea" },
  ],
  "Vendor / Partner Coordination": [
    { name: "vendor_company_name", label: "Company name" },
    { name: "service_type", label: "Service type" },
    { name: "airport_location_served", label: "Airport/location served" },
    { name: "aircraft_categories_supported", label: "Aircraft categories supported" },
    { name: "point_of_contact", label: "Point of contact" },
    { name: "partnership_support_notes", label: "Partnership/support notes", type: "textarea" },
  ],
  "Other Support": [
    { name: "support_need_description", label: "Support need description", type: "textarea" },
    { name: "aircraft_context_if_applicable", label: "Aircraft context if applicable", type: "textarea" },
    { name: "other_timing", label: "Timing" },
    { name: "parties_involved", label: "Parties involved", type: "textarea" },
    { name: "approval_operational_limitations", label: "Approval or operational limitations", type: "textarea" },
  ],
};
