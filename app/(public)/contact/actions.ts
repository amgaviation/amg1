"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/portal/audit";

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

export async function submitPublicSupportRequest(formData: FormData) {
  const requesterName = value(formData, "requester_name");
  const email = value(formData, "email").toLowerCase();
  const organization = value(formData, "organization");
  const aircraft = value(formData, "aircraft");
  const tailNumber = value(formData, "tail_number").toUpperCase().replace(/\s+/g, "");
  const route = value(formData, "route");
  const timing = value(formData, "timing");
  const supportType = value(formData, "support_type") || "aircraft_support";
  const crewNeed = value(formData, "crew_need");
  const passengerContext = value(formData, "passenger_context");
  const notes = value(formData, "notes");

  if (!requesterName || !email || !route || !supportType) {
    redirect(`/contact?error=missing&service=${encodeURIComponent(supportType)}`);
  }

  const db = await createServiceClient();
  const departure = routePart(route, 0);
  const arrival = routePart(route, 1);
  const clientNotes = [
    `Public website support request`,
    `Requester: ${requesterName}`,
    `Email: ${email}`,
    organization ? `Organization: ${organization}` : null,
    aircraft ? `Aircraft: ${aircraft}` : null,
    tailNumber ? `Tail: ${tailNumber}` : null,
    timing ? `Timing: ${timing}` : null,
    crewNeed ? `Crew need: ${crewNeed}` : null,
    passengerContext ? `Passenger context: ${passengerContext}` : null,
    notes ? `Notes: ${notes}` : null,
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
    redirect(`/contact?success=${encodeURIComponent(existing.ref)}&duplicate=1`);
  }

  const { data: mission, error } = await db
    .from("missions")
    .insert({
      client_id: null,
      created_by: null,
      aircraft_id: null,
      tail_number: tailNumber || null,
      mission_type: supportType,
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
      baggage_estimate: passengerContext || null,
      client_notes: clientNotes,
      additional_notes: notes || null,
      special_handling: crewNeed || null,
    })
    .select("id, ref")
    .single();

  if (error || !mission) {
    redirect(`/contact?error=failed&service=${encodeURIComponent(supportType)}`);
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
    title: "New public support request",
    body: `${requesterName} submitted ${mission.ref} (${departure}-${arrival}).`,
    type: "public_support_request",
    entityType: "mission",
    entityId: mission.id,
  });

  redirect(`/contact?success=${encodeURIComponent(mission.ref)}`);
}
