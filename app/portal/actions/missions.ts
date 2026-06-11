"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyAdmins, notifyUser } from "@/lib/portal/audit";
import { MISSION_TYPE_LABEL } from "@/lib/portal/constants";
import { actor, bool, isoOrNull, num, str } from "./_helpers";

export async function createMission(formData: FormData) {
  const user = await actor(["client", "admin"]);
  const db = await createServiceClient();

  const departure = str(formData, "departure_airport").toUpperCase();
  const arrival = str(formData, "arrival_airport").toUpperCase();
  const missionType = str(formData, "mission_type") || "owner_trip";

  if (!departure || !arrival) {
    redirect("/portal/client/trips/new?error=missing");
  }

  const aircraftId = str(formData, "aircraft_id") || null;
  let tail: string | null = null;
  let clientId = user.id;
  if (aircraftId) {
    const { data: ac } = await db
      .from("aircraft")
      .select("tail_number, client_id")
      .eq("id", aircraftId)
      .maybeSingle();
    tail = ac?.tail_number ?? null;
    if (user.role === "admin" && ac?.client_id) clientId = ac.client_id;
  }

  const passengerCount = num(formData, "passenger_count") ?? 0;

  const { data: mission, error } = await db
    .from("missions")
    .insert({
      client_id: clientId,
      aircraft_id: aircraftId,
      tail_number: tail,
      mission_type: missionType,
      status: "submitted",
      urgency: str(formData, "urgency") || "standard",
      departure_airport: departure,
      arrival_airport: arrival,
      alternate_airport: str(formData, "alternate_airport") || null,
      requested_departure: isoOrNull(formData, "requested_departure"),
      requested_arrival: isoOrNull(formData, "requested_arrival"),
      flexible_time: bool(formData, "flexible_time"),
      passenger_count: passengerCount,
      baggage_estimate: str(formData, "baggage_estimate") || null,
      pets_onboard: bool(formData, "pets_onboard"),
      ground_transport: bool(formData, "ground_transport"),
      catering: bool(formData, "catering"),
      fbo_preference: str(formData, "fbo_preference") || null,
      is_international: bool(formData, "is_international"),
      customs_notes: str(formData, "customs_notes") || null,
      special_handling: str(formData, "special_handling") || null,
      additional_notes: str(formData, "additional_notes") || null,
      client_notes: str(formData, "client_notes") || null,
      created_by: user.id,
    })
    .select("id, ref")
    .single();

  if (error || !mission) {
    redirect("/portal/client/trips/new?error=failed");
  }

  // Optional passenger names (newline or comma separated)
  const paxRaw = str(formData, "passenger_names");
  if (paxRaw) {
    const names = paxRaw
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, 30);
    if (names.length) {
      await db.from("mission_passengers").insert(
        names.map((full_name) => ({ mission_id: mission.id, full_name }))
      );
    }
  }

  await logAuditEvent({
    actor: user,
    action: "mission_submitted",
    detail: `Submitted ${MISSION_TYPE_LABEL[missionType] ?? missionType} ${departure}-${arrival} (${mission.ref})`,
    entityType: "mission",
    entityId: mission.id,
  });
  await notifyAdmins({
    title: "New trip request",
    body: `${user.name} submitted ${mission.ref} (${departure}-${arrival}).`,
    type: "mission_submitted",
    entityType: "mission",
    entityId: mission.id,
  });

  revalidatePath("/portal/client/trips");
  revalidatePath("/portal/admin/mission-control");
  const base = user.role === "admin" ? "/portal/admin/trips" : "/portal/client/trips";
  redirect(`${base}/${mission.id}?success=created`);
}

export async function updateMissionStatus(formData: FormData) {
  const user = await actor(["admin"]);
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const status = str(formData, "status");
  const internalNote = str(formData, "internal_notes");
  if (!missionId || !status) redirect("/portal/admin/mission-control?error=missing");

  const patch: Record<string, unknown> = { status };
  if (internalNote) patch.internal_notes = internalNote;

  const { data: mission } = await db
    .from("missions")
    .update(patch)
    .eq("id", missionId)
    .select("ref, client_id")
    .single();

  await logAuditEvent({
    actor: user,
    action: "mission_status_changed",
    detail: `${mission?.ref ?? missionId} → ${status}`,
    entityType: "mission",
    entityId: missionId,
  });
  if (mission?.client_id) {
    await notifyUser({
      userId: mission.client_id,
      title: "Mission status updated",
      body: `${mission.ref} is now ${status.replace(/_/g, " ")}.`,
      type: "mission_status",
      entityType: "mission",
      entityId: missionId,
    });
  }

  revalidatePath("/portal/admin/mission-control");
  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=updated`);
}

export async function updateMissionNotes(formData: FormData) {
  const user = await actor(["admin"]);
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  await db
    .from("missions")
    .update({
      internal_notes: str(formData, "internal_notes") || null,
      client_notes: str(formData, "client_notes") || null,
    })
    .eq("id", missionId);
  await logAuditEvent({
    actor: user,
    action: "mission_note_added",
    detail: `Updated notes on ${missionId}`,
    entityType: "mission",
    entityId: missionId,
  });
  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=notes`);
}

export async function cancelMission(formData: FormData) {
  const user = await actor(["client", "admin"]);
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");

  const { data: mission } = await db
    .from("missions")
    .select("client_id, ref, status")
    .eq("id", missionId)
    .maybeSingle();
  if (!mission) redirect("/portal/client/trips?error=notfound");
  if (user.role !== "admin" && mission.client_id !== user.id) {
    redirect("/portal/client/trips?error=forbidden");
  }

  await db.from("missions").update({ status: "cancelled" }).eq("id", missionId);
  await logAuditEvent({
    actor: user,
    action: "mission_cancelled",
    detail: `Cancelled ${mission.ref}`,
    entityType: "mission",
    entityId: missionId,
  });
  await notifyAdmins({
    title: "Mission cancelled",
    body: `${user.name} cancelled ${mission.ref}.`,
    type: "mission_cancelled",
    entityType: "mission",
    entityId: missionId,
  });

  revalidatePath("/portal/client/trips");
  revalidatePath("/portal/admin/mission-control");
  const base = user.role === "admin" ? "/portal/admin/trips" : "/portal/client/trips";
  redirect(`${base}/${missionId}?success=cancelled`);
}

export async function addPassenger(formData: FormData) {
  const user = await actor(["client", "admin"]);
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const fullName = str(formData, "full_name");
  if (!missionId || !fullName) redirect(`/portal/client/trips/${missionId}?error=missing`);
  await db.from("mission_passengers").insert({
    mission_id: missionId,
    full_name: fullName,
    passenger_type: str(formData, "passenger_type") || "passenger",
    notes: str(formData, "notes") || null,
  });
  await logAuditEvent({
    actor: user,
    action: "passenger_added",
    detail: `Added ${fullName}`,
    entityType: "mission",
    entityId: missionId,
  });
  const base = user.role === "admin" ? "/portal/admin/trips" : "/portal/client/trips";
  revalidatePath(`${base}/${missionId}`);
  redirect(`${base}/${missionId}?success=passenger`);
}

export async function removePassenger(formData: FormData) {
  const user = await actor(["client", "admin"]);
  const db = await createServiceClient();
  const id = str(formData, "passenger_id");
  const missionId = str(formData, "mission_id");
  await db.from("mission_passengers").delete().eq("id", id);
  const base = user.role === "admin" ? "/portal/admin/trips" : "/portal/client/trips";
  revalidatePath(`${base}/${missionId}`);
  redirect(`${base}/${missionId}?success=passenger`);
}
