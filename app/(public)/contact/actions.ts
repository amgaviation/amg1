"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/portal/audit";
import { sendEmail } from "@/lib/portal/notification-delivery";
import {
  publicSupportRequestAdminEmail,
  publicSupportRequestClientConfirmationEmail,
} from "@/lib/portal/email-templates";

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function routePart(route: string, index: number): string {
  const parts = route
    .toUpperCase()
    .split(/(?:\s+TO\s+|[-/>,])/i)
    .map((part) => part.trim().replace(/[^A-Z0-9]/g, ""))
    .filter(Boolean);
  return parts[index] || "TBD";
}

function formDataToRecord(formData: FormData) {
  const output: Record<string, string> = {};
  for (const [key, raw] of formData.entries()) {
    if (key === "website") continue;
    if (typeof raw === "string") output[key] = raw.trim();
  }
  return output;
}

const allowedCategories = new Set([
  "aircraft-management-support",
  "contract-pilot-support",
  "ferry-and-repositioning",
  "maintenance-flight-support",
  "flight-operations-coordination",
  "fleet-support-program",
  "subscription-program-inquiry",
  "other-support",
]);

const missionTypeBySupportCategory: Record<string, string> = {
  "aircraft-management-support": "aircraft_support",
  "contract-pilot-support": "aircraft_support",
  "ferry-and-repositioning": "ferry",
  "maintenance-flight-support": "maintenance_reposition",
  "flight-operations-coordination": "aircraft_support",
  "fleet-support-program": "aircraft_support",
  "subscription-program-inquiry": "aircraft_support",
  "other-support": "aircraft_support",
};

const detailFields = [
  "ownership_entity",
  "current_crew_arrangement",
  "existing_management_arrangement",
  "maintenance_tracking_system",
  "scheduling_expectations",
  "records_status",
  "accounting_support_requirements",
  "desired_management_scope",
  "anticipated_start_date",
  "number_of_aircraft",
  "current_operational_concerns",
  "crew_seat",
  "type_rating_requirements",
  "insurance_minimums",
  "requested_dates",
  "origin",
  "destination",
  "estimated_duty_period",
  "number_of_legs",
  "domestic_or_international",
  "passport_requirement",
  "currency_requirements",
  "crew_positioning_expectations",
  "lodging_requirements",
  "known_operator_requirements",
  "special_mission_notes",
  "current_aircraft_location",
  "desired_movement_date",
  "airworthiness_status",
  "maintenance_status",
  "ferry_permit_status",
  "owner_operator_authorization_status",
  "maintenance_facility_contact",
  "aircraft_records_availability",
  "international_customs_requirements",
  "required_crew_qualifications",
  "known_squawks_or_limitations",
  "special_equipment_requirements",
  "maintenance_facility",
  "facility_contact",
  "inspection_or_maintenance_event",
  "aircraft_release_status",
  "return_to_service_status",
  "functional_check_flight_requirement",
  "acceptance_flight_requirement",
  "proposed_flight_profile",
  "responsible_operator",
  "required_pilot_qualifications",
  "maintenance_documentation_status",
  "desired_completion_date",
  "known_discrepancies",
  "mission_dates",
  "origin_destination",
  "number_of_passengers",
  "crew_requirements",
  "aircraft_status",
  "fbo_requirements",
  "ground_transportation",
  "lodging",
  "international_requirements",
  "permit_requirements",
  "catering",
  "special_timing_or_access_restrictions",
  "primary_decision_maker",
  "aircraft_types",
  "bases",
  "current_staffing",
  "expected_monthly_activity",
  "maintenance_activity",
  "desired_support_functions",
  "reporting_needs",
  "dedicated_contact_requirement",
  "after_hours_requirement",
  "aircraft_category",
  "single_or_two_pilot",
  "preferred_billing",
  "expected_client_flight_duty_days",
  "expected_mx_movements",
  "domestic_or_international_activity",
  "expected_overnight_frequency",
  "travel_lodging_preference",
  "desired_tier",
  "expected_start_date",
  "questions_or_special_requirements",
  "aircraft_information",
  "detailed_support_description",
  "relevant_contacts",
  "documents_available",
] as const;

function labelize(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function submitPublicSupportRequest(formData: FormData) {
  const firstName = value(formData, "first_name");
  const lastName = value(formData, "last_name");
  const requesterName = `${firstName} ${lastName}`.trim();
  const email = value(formData, "email").toLowerCase();
  const phone = value(formData, "phone");
  const preferredContact = value(formData, "preferred_contact_method") || "Not specified";
  const organization = value(formData, "company");
  const aircraftMake = value(formData, "aircraft_make");
  const aircraftModel = value(formData, "aircraft_model");
  const aircraft = [aircraftMake, aircraftModel].filter(Boolean).join(" ");
  const aircraftBase = value(formData, "aircraft_base");
  const tailNumber = value(formData, "tail_number").toUpperCase().replace(/\s+/g, "");
  const timing = value(formData, "requested_timing");
  const supportType = value(formData, "requested_service_category") || "aircraft-management-support";
  const notes = value(formData, "operational_summary");
  const acknowledgment = value(formData, "acknowledgment");
  const honeypot = value(formData, "website");

  if (honeypot) {
    redirect("/contact?success=received");
  }

  if (!requesterName || !email || !phone || !timing || !supportType || !notes || acknowledgment !== "accepted" || !allowedCategories.has(supportType)) {
    redirect(`/contact?error=missing&category=${encodeURIComponent(supportType)}`);
  }

  const missionType = missionTypeBySupportCategory[supportType] || "aircraft_support";
  const db = await createServiceClient();
  const route = value(formData, "origin_destination") || [value(formData, "origin"), value(formData, "destination")].filter(Boolean).join(" to ");
  const departure = route ? routePart(route, 0) : routePart(aircraftBase, 0);
  const arrival = route ? routePart(route, 1) : "TBD";
  const categoryDetailPairs = detailFields.flatMap((key) => {
    const fieldValue = value(formData, key);
    return fieldValue ? [[key, fieldValue] as const] : [];
  });
  const categoryDetailsRecord = Object.fromEntries(categoryDetailPairs);
  const categoryDetails = categoryDetailPairs
    .map(([key, fieldValue]) => `${labelize(key)}: ${fieldValue}`)
    .join("\n");

  const { data: existingProfile } = await db
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  const clientNotes = [
    "Public website support request",
    `Requester: ${requesterName}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Preferred contact: ${preferredContact}`,
    `Requested category: ${supportType}`,
    organization ? `Organization: ${organization}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: existing } = await db
    .from("missions")
    .select("id, ref")
    .eq("status", "submitted")
    .eq("departure_airport", departure)
    .eq("arrival_airport", arrival)
    .gte("created_at", since)
    .ilike("client_notes", `%Email: ${email}%`)
    .maybeSingle();

  if (existing) {
    redirect(`/contact?success=${encodeURIComponent(existing.ref)}&duplicate=1&category=${encodeURIComponent(supportType)}`);
  }

  const { data: mission, error } = await db
    .from("missions")
    .insert({
      client_id: existingProfile?.id ?? null,
      created_by: null,
      aircraft_id: null,
      tail_number: tailNumber || null,
      mission_type: missionType,
      status: "submitted",
      urgency: "standard",
      departure_airport: departure,
      arrival_airport: arrival,
      passenger_count: 0,
      flexible_time: true,
      pets_onboard: false,
      ground_transport: false,
      catering: false,
      is_international: false,
      baggage_estimate: value(formData, "number_of_passengers") || null,
      client_notes: clientNotes,
      additional_notes: notes || null,
      special_handling: categoryDetails || null,
    })
    .select("id, ref")
    .single();

  if (error || !mission) {
    console.error("Public support request mission insert failed", {
      error,
      supportType,
      missionType,
      departure,
      arrival,
    });
    redirect(`/contact?error=failed&category=${encodeURIComponent(supportType)}`);
  }

  const { error: publicRequestError } = await (db as any)
    .from("public_support_requests")
    .insert({
      mission_id: mission.id,
      client_id: existingProfile?.id ?? null,
      first_name: firstName || null,
      last_name: lastName || null,
      requester_name: requesterName,
      email,
      phone: phone || null,
      preferred_contact_method: preferredContact,
      company_name: organization || null,
      requested_service_category: supportType,
      aircraft_make: aircraftMake || null,
      aircraft_model: aircraftModel || null,
      aircraft_display: aircraft || null,
      tail_number: tailNumber || null,
      aircraft_base: aircraftBase || null,
      requested_timing: timing || null,
      route: route || null,
      departure_airport: departure || null,
      arrival_airport: arrival || null,
      operational_summary: notes || null,
      category_details: categoryDetailsRecord,
      raw_form: formDataToRecord(formData),
      portal_account_status: existingProfile?.id ? "existing_account" : "not_created",
      portal_account_user_id: existingProfile?.id ?? null,
    });

  if (publicRequestError) {
    console.error("Public support request structured insert failed", {
      ref: mission.ref,
      error: publicRequestError,
    });
  }

  await db.from("audit_events").insert({
    actor_email: email,
    actor_role: "public",
    action: "public_support_request_submitted",
    detail: `${requesterName} submitted ${mission.ref} from the public website.`,
    entity_type: "mission",
    entity_id: mission.id,
  });

  await notifyAdmins({
    title: `New public support request: ${mission.ref}`,
    body: [
      `${requesterName} submitted ${mission.ref} (${departure}-${arrival}).`,
      clientNotes,
      categoryDetails ? `Category details:\n${categoryDetails}` : null,
    ].filter(Boolean).join("\n\n"),
    html: publicSupportRequestAdminEmail({
      reference: mission.ref,
      requesterName,
      email,
      phone,
      preferredContact,
      requestedCategory: supportType,
      organization,
      aircraft,
      tailNumber,
      aircraftBase,
      timing,
      departure,
      arrival,
      operationalSummary: notes,
      categoryDetails,
      portalUrl: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/admin`
        : undefined,
    }),
    type: "public_support_request",
    entityType: "mission",
    entityId: mission.id,
    replyTo: email,
  });

  const confirmationBody = [
    `Hello ${requesterName},`,
    `AMG Aviation Group has received your request ${mission.ref}.`,
    `Requested category: ${supportType}`,
    timing ? `Requested timing: ${timing}` : null,
    `Next steps:`,
    `1. AMG Operations will review the aircraft, timing, scope, and support category submitted.`,
    `2. If additional operational details are needed, AMG will contact you using your preferred contact method.`,
    `3. AMG will confirm availability, scope, and any applicable next actions before any mission, crew assignment, aircraft movement, or operational support is accepted.`,
    `For urgent updates, reply to this email or contact AMG Aviation Group directly at information@amgaviationgroup.com.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const confirmationResult = await sendEmail({
    to: email,
    subject: `AMG Aviation Group received your request ${mission.ref}`,
    text: confirmationBody,
    html: publicSupportRequestClientConfirmationEmail({
      requesterName,
      reference: mission.ref,
      requestedCategory: supportType,
      timing,
      portalUrl: process.env.NEXT_PUBLIC_APP_URL || undefined,
    }),
    replyTo: process.env.EMAIL_REPLY_TO,
  });

  if (confirmationResult.status !== "sent") {
    console.error("Public support request customer confirmation email failed", {
      ref: mission.ref,
      recipient: email,
      status: confirmationResult.status,
      error: confirmationResult.error,
    });
  }

  redirect(`/contact?success=${encodeURIComponent(mission.ref)}&category=${encodeURIComponent(supportType)}`);
}
