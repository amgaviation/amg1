"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { logAuditEvent, notifyAdmins, notifyUser } from "@/lib/portal/audit";
import { MISSION_STATUS, MISSION_TYPE_LABEL, isAdminRole } from "@/lib/portal/constants";
import {
  MIN_GATE_OVERRIDE_REASON_LENGTH,
  canTransition,
  checkMissionGates,
  formatCrewComplianceBlockers,
  gateNameFor,
  isTerminalMissionStatus,
  listCrewComplianceIssues,
} from "@/lib/portal/mission-lifecycle";
import { ACKNOWLEDGMENT_TEXT, COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import { recordComplianceEvidence, recordSupportRequestDisclaimerAcknowledgment } from "@/lib/compliance/evidence";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
import { ensureClientAccountForMission } from "@/lib/portal/client-account-provisioning";
import { notifyMissionContactByEmail } from "@/lib/portal/mission-client-notifications";
import { listQualifiedCrew } from "@/lib/portal/pool";
import { formatDateTime, formatRoute } from "@/lib/portal/format";
import { actor, bool, isoOrNull, num, str } from "./_helpers";

async function logCompletedMissionUsage(db: any, missionId: string, admin: Awaited<ReturnType<typeof actor>>) {
  const { data: mission } = await db
    .from("missions")
    .select("id, ref, client_id, aircraft_id")
    .eq("id", missionId)
    .maybeSingle();
  if (!mission?.client_id) return;

  const { data: existing } = await db
    .from("subscription_usage_events")
    .select("id")
    .eq("mission_id", missionId)
    .eq("usage_type", "flight_support")
    .maybeSingle();
  if (existing) return;

  const { data: subscriptions } = await db
    .from("client_subscriptions")
    .select("id, aircraft_id, included_flights")
    .eq("client_id", mission.client_id)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const subscription =
    (subscriptions ?? []).find((item: any) => item.aircraft_id && item.aircraft_id === mission.aircraft_id) ??
    (subscriptions ?? []).find((item: any) => !item.aircraft_id);
  if (!subscription) return;

  const { data: usage } = await db
    .from("subscription_usage_events")
    .select("quantity")
    .eq("subscription_id", subscription.id)
    .eq("usage_type", "flight_support");
  const usedFlights = (usage ?? []).reduce((sum: number, event: { quantity: number | string | null }) => {
    return sum + Number(event.quantity ?? 0);
  }, 0);
  const includedFlights = Number(subscription.included_flights ?? 0);
  const coveredQuantity = usedFlights < includedFlights ? 1 : 0;
  const overageQuantity = Math.max(1 - coveredQuantity, 0);

  await db.from("subscription_usage_events").insert({
    subscription_id: subscription.id,
    client_id: mission.client_id,
    mission_id: missionId,
    usage_type: "flight_support",
    quantity: 1,
    unit: "mission",
    covered_quantity: coveredQuantity,
    overage_quantity: overageQuantity,
    unit_rate: 0,
    covered_amount: 0,
    overage_amount: 0,
    notes: `Auto-created when ${mission.ref ?? "mission"} was marked completed.`,
    created_by: admin.id,
  });

  await logAuditEvent({
    actor: admin,
    action: "subscription_usage_auto_logged",
    detail: `Logged subscription usage for ${mission.ref ?? missionId}`,
    entityType: "mission",
    entityId: missionId,
  });
}

async function requireMissionAccessForMutation(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  missionId: string,
  user: Awaited<ReturnType<typeof actor>>,
  backTo: string
) {
  if (!missionId) redirect(`${backTo}?error=missing`);

  const { data: mission } = await db
    .from("missions")
    .select("id, client_id, ref")
    .eq("id", missionId)
    .maybeSingle();

  if (!mission) redirect(`${backTo}?error=notfound`);
  if (!isAdminRole(user.role) && mission.client_id !== user.id) {
    redirect(`${backTo}?error=forbidden`);
  }

  return mission;
}

export async function createMission(formData: FormData) {
  const user = await actor(["client", "admin"], "missions.add");
  const db = await createServiceClient();

  const departure = str(formData, "departure_airport").toUpperCase();
  const arrival = str(formData, "arrival_airport").toUpperCase();
  const missionType = str(formData, "mission_type") || "owner_trip";
  if (str(formData, "support_disclaimer_acknowledged") !== "accepted") {
    redirect("/portal/client/trips/new?error=terms");
  }
  const paymentFindings = detectProhibitedPaymentData({
    client_notes: str(formData, "client_notes"),
    customs_notes: str(formData, "customs_notes"),
    additional_notes: str(formData, "additional_notes"),
    passenger_names: str(formData, "passenger_names"),
  });
  if (paymentFindings.length) {
    await recordComplianceEvidence({
      actor: user,
      audience: user.role,
      eventType: "no_online_payment_notice_acknowledged",
      eventArea: "security",
      policyKey: POLICY_KEYS.noOnlinePayment,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: ACKNOWLEDGMENT_TEXT.noOnlinePayment,
      metadata: { action: "portal_support_request_blocked", fields: paymentFindings.map((finding) => finding.field) },
    });
    redirect("/portal/client/trips/new?error=payment-data");
  }

  if (!departure || !arrival) {
    redirect("/portal/client/trips/new?error=missing");
  }

  const aircraftId = str(formData, "aircraft_id") || null;
  let tail: string | null = null;
  let clientId = user.id;
  if (aircraftId) {
    const { data: ac } = await db
      .from("aircraft")
      .select("tail_number, client_id, status")
      .eq("id", aircraftId)
      .maybeSingle();
    if (!ac || ac.status !== "active") {
      redirect("/portal/client/trips/new?error=aircraft");
    }
    tail = ac?.tail_number ?? null;
    if (!isAdminRole(user.role) && ac?.client_id !== user.id) {
      redirect("/portal/client/trips/new?error=aircraft");
    }
    if (isAdminRole(user.role) && ac?.client_id) clientId = ac.client_id;
  } else {
    tail = str(formData, "tail_number").toUpperCase().replace(/\s+/g, "") || null;
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

  const paxRaw = str(formData, "passenger_names");
  const savedPassengers = formData
    .getAll("saved_passengers")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const typedNames = paxRaw
    ? paxRaw
        .split(/[\n,]+/)
        .map((n) => n.trim())
        .filter(Boolean)
    : [];
  const names = [...new Set([...savedPassengers, ...typedNames])].slice(0, 30);
  if (names.length) {
    await db.from("mission_passengers").insert(
      names.map((full_name) => ({ mission_id: mission.id, full_name }))
    );
  }

  await logAuditEvent({
    actor: user,
    action: "mission_submitted",
    detail: `Submitted ${MISSION_TYPE_LABEL[missionType] ?? missionType} ${departure}-${arrival} (${mission.ref})`,
    entityType: "mission",
    entityId: mission.id,
  });
  await recordSupportRequestDisclaimerAcknowledgment({
    actor: user,
    audience: user.role,
    relatedRecordType: "mission",
    relatedRecordId: mission.id,
    policyKey: POLICY_KEYS.missionAcceptance,
    policyVersion: COMPLIANCE_POLICY_VERSION,
    acknowledgmentText: ACKNOWLEDGMENT_TEXT.supportRequest,
    metadata: { missionType, departure, arrival, urgency: str(formData, "urgency") || "standard" },
  });
  await recordComplianceEvidence({
    actor: user,
    audience: user.role,
    eventType: "support_request_submitted",
    eventArea: "client_portal",
    relatedRecordType: "mission",
    relatedRecordId: mission.id,
    policyVersion: COMPLIANCE_POLICY_VERSION,
    metadata: { missionType, departure, arrival, isInternational: bool(formData, "is_international") },
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
  const base = isAdminRole(user.role) ? "/portal/admin/trips" : "/portal/client/trips";
  redirect(`${base}/${mission.id}?success=created`);
}

export async function updateMissionStatus(formData: FormData) {
  const user = await actor(["admin"], "missions.edit");
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const status = str(formData, "status");
  const internalNote = str(formData, "internal_notes");
  const overrideReason = str(formData, "override_reason");
  if (!missionId || !status) redirect("/portal/admin/mission-control?error=missing");
  // A malformed submission must not write a status no surface can render.
  if (!MISSION_STATUS.some((s) => s.value === status)) {
    redirect("/portal/admin/mission-control?error=invalid-status");
  }

  const backTo = `/portal/admin/trips/${missionId}`;
  const { data: current } = await db
    .from("missions")
    .select("status")
    .eq("id", missionId)
    .maybeSingle();
  if (!current) redirect("/portal/admin/mission-control?error=missing");

  // Same-status submits stay legal — admins use this form to save an
  // internal note without moving the mission.
  const isTransition = current!.status !== status;
  const hasOverrideReason = overrideReason.length >= MIN_GATE_OVERRIDE_REASON_LENGTH;
  // The transition map fails closed by default, but an admin with an explicit
  // override reason may force ANY move — same loud audit + all-admin notify
  // as a gate override, so nothing slips through quietly.
  const illegalTransition = isTransition && !canTransition(current!.status, status);
  if (illegalTransition && !hasOverrideReason) {
    redirect(`${backTo}?error=illegal-transition&from=${current!.status}&to=${status}`);
  }

  // Enforced gates: insurance confirmed before movement, closeout file
  // completeness before completed. Blockers stop the transition unless the
  // admin records an explicit override reason; warnings never block.
  const gates = isTransition
    ? await checkMissionGates(db, missionId, status)
    : { blockers: [], warnings: [] };
  const overridden = gates.blockers.length > 0 || illegalTransition;
  if (gates.blockers.length > 0 && !hasOverrideReason) {
    redirect(`${backTo}?error=gate-blocked&gate=${gateNameFor(status) ?? "mission"}`);
  }

  const patch: Database["public"]["Tables"]["missions"]["Update"] = { status };
  if (internalNote) patch.internal_notes = internalNote;

  // Optimistic concurrency: only write if the mission is still in the status we
  // validated against. If another admin moved it in the meantime, zero rows
  // update and we bail with a conflict rather than silently overwriting them.
  const { data: mission } = await db
    .from("missions")
    .update(patch)
    .eq("id", missionId)
    .eq("status", current!.status)
    .select("ref, client_id")
    .maybeSingle();

  if (!mission) {
    redirect(`${backTo}?error=conflict`);
  }

  let notificationClientId = mission?.client_id ?? null;
  if (isTransition && status === "under_review") {
    notificationClientId = (await ensureClientAccountForMission(missionId, user.id)) ?? notificationClientId;
  }
  if (isTransition && status === "completed") {
    await logCompletedMissionUsage(db as any, missionId, user);
    revalidatePath("/portal/admin/subscriptions");
    revalidatePath("/portal/client/subscriptions");
  }

  if (overridden) {
    // Loud, explicit trail: the override is its own audit event and every
    // admin is notified, so a forced move never passes quietly.
    const forced = [
      ...(illegalTransition ? [`out-of-flow transition (${current!.status} → ${status})`] : []),
      ...gates.blockers,
    ];
    await logAuditEvent({
      actor: user,
      action: "mission_gate_overridden",
      detail: `${mission?.ref ?? missionId}: ${current!.status} → ${status} forced past ${forced.length} blocker(s): ${forced.join("; ")} — Override reason: ${overrideReason}`,
      entityType: "mission",
      entityId: missionId,
    });
    await notifyAdmins({
      title: `Gate override — ${mission?.ref ?? "mission"} moved to ${status.replace(/_/g, " ")}`,
      body: `${user.name} overrode ${forced.length} blocker(s) on ${mission?.ref ?? missionId}: ${forced.join("; ")}. Reason: ${overrideReason}`,
      type: "mission_gate_overridden",
      entityType: "mission",
      entityId: missionId,
    });
  }

  // A same-status submit is a note save: no status-change audit, no client
  // push, no client email — those fire only on real transitions.
  if (isTransition) {
    await logAuditEvent({
      actor: user,
      action: "mission_status_changed",
      detail: `${mission?.ref ?? missionId} → ${status}${gates.warnings.length ? ` (warnings: ${gates.warnings.join("; ")})` : ""}`,
      entityType: "mission",
      entityId: missionId,
    });
    if (notificationClientId) {
      await notifyUser({
        userId: notificationClientId,
        title: "Mission status updated",
        body: `${mission?.ref ?? "Your AMG request"} is now ${status.replace(/_/g, " ")}.`,
        type: "mission_status",
        entityType: "mission",
        entityId: missionId,
      });
    }

    await notifyMissionContactByEmail({
      missionId,
      title: "Mission status updated",
      eventLabel: "Status Update",
      intro: `${mission?.ref ?? "Your AMG request"} is now ${status.replace(/_/g, " ")}.`,
      details: [{ label: "New Status", value: status.replace(/_/g, " ") }],
    });
  } else if (internalNote) {
    await logAuditEvent({
      actor: user,
      action: "mission_note_saved",
      detail: `${mission?.ref ?? missionId}: internal note updated (status unchanged: ${status})`,
      entityType: "mission",
      entityId: missionId,
    });
  }

  revalidatePath("/portal/admin/mission-control");
  revalidatePath(`/portal/admin/trips/${missionId}`);
  redirect(`/portal/admin/trips/${missionId}?success=updated`);
}

export async function updateMissionNotes(formData: FormData) {
  const user = await actor(["admin"], "missions.edit");
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
  const user = await actor(["client", "admin"], "missions.edit");
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");

  const { data: mission } = await db
    .from("missions")
    .select("client_id, ref, status")
    .eq("id", missionId)
    .maybeSingle();
  if (!mission) redirect("/portal/client/trips?error=notfound");
  if (!isAdminRole(user.role) && mission.client_id !== user.id) {
    redirect("/portal/client/trips?error=forbidden");
  }

  // Cancel is legal from any non-terminal status and is never gate-blocked —
  // ops must always be able to stand a mission down. Completed/cancelled
  // missions are immutable history.
  if (isTerminalMissionStatus(mission.status)) {
    const errorBase = isAdminRole(user.role) ? "/portal/admin/trips" : "/portal/client/trips";
    redirect(`${errorBase}/${missionId}?error=illegal-transition&from=${mission.status}&to=cancelled`);
  }
  // Once crew are committed or the aircraft is moving, a stand-down is an
  // ops decision — clients request it through AMG instead of one-clicking a
  // mission out from under an assigned pilot.
  if (!isAdminRole(user.role) && ["crew_assigned", "scheduled", "in_progress"].includes(mission.status)) {
    redirect(`/portal/client/trips/${missionId}?error=cancel-requires-ops`);
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
  if (isAdminRole(user.role)) {
    await notifyMissionContactByEmail({
      missionId,
      title: "Mission status updated",
      eventLabel: "Cancelled",
      intro: `${mission.ref} has been marked cancelled by AMG Operations. If this does not match your understanding, contact AMG Aviation Group directly.`,
      details: [{ label: "New Status", value: "Cancelled" }],
    });
  }

  revalidatePath("/portal/client/trips");
  revalidatePath("/portal/admin/mission-control");
  const base = isAdminRole(user.role) ? "/portal/admin/trips" : "/portal/client/trips";
  redirect(`${base}/${missionId}?success=cancelled`);
}

/**
 * Client answers an "Awaiting Client Info" request. The mission moves back to
 * under_review; the text itself is preserved without a schema change — it is
 * appended to the client-visible notes, sent to every admin, and recorded in
 * the audit trail.
 */
export async function provideRequestedInfo(formData: FormData) {
  const user = await actor(["client"], "missions.edit");
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  if (!missionId) redirect("/portal/client/trips?error=missing");
  const backTo = `/portal/client/trips/${missionId}`;

  const info = str(formData, "info").slice(0, 4000);
  if (!info) redirect(`${backTo}?error=info-required`);
  const paymentFindings = detectProhibitedPaymentData({ info });
  if (paymentFindings.length) {
    await recordComplianceEvidence({
      actor: user,
      audience: user.role,
      eventType: "no_online_payment_notice_acknowledged",
      eventArea: "security",
      policyKey: POLICY_KEYS.noOnlinePayment,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: ACKNOWLEDGMENT_TEXT.noOnlinePayment,
      metadata: { action: "portal_client_info_blocked", fields: paymentFindings.map((finding) => finding.field) },
    });
    redirect(`${backTo}?error=payment-data`);
  }

  const { data: mission } = await db
    .from("missions")
    .select("client_id, ref, status, client_notes")
    .eq("id", missionId)
    .maybeSingle();
  if (!mission) redirect("/portal/client/trips?error=notfound");
  if (user.role !== "admin" && mission.client_id !== user.id) {
    redirect("/portal/client/trips?error=forbidden");
  }
  if (mission.status !== "awaiting_client_info") {
    redirect(`${backTo}?error=not-awaiting`);
  }

  const entry = `[Client info · ${new Date().toISOString()}]\n${info}`;
  // Status predicate rides on the write: a double-submit (or admin change
  // mid-flight) matches zero rows instead of re-appending or clobbering a
  // status transition. The write is confirmed before any audit/notification
  // fires so the success notice never lies.
  const { data: updated, error: updateError } = await db
    .from("missions")
    .update({
      status: "under_review",
      client_notes: mission.client_notes ? `${mission.client_notes}\n\n${entry}` : entry,
    })
    .eq("id", missionId)
    .eq("status", "awaiting_client_info")
    .select("id");
  if (updateError) {
    console.error("[missions] provideRequestedInfo update failed", updateError);
    redirect(`${backTo}?error=failed`);
  }
  if (!updated?.length) redirect(`${backTo}?error=not-awaiting`);

  await logAuditEvent({
    actor: user,
    action: "mission_client_info_provided",
    detail: info.slice(0, 2000),
    entityType: "mission",
    entityId: missionId,
  });
  await notifyAdmins({
    title: `Client provided requested info — ${mission.ref}`,
    body: info,
    type: "mission_client_info",
    entityType: "mission",
    entityId: missionId,
  });

  revalidatePath(backTo);
  revalidatePath("/portal/client/trips");
  revalidatePath(`/portal/admin/trips/${missionId}`);
  revalidatePath("/portal/admin/mission-control");
  redirect(`${backTo}?success=info-sent`);
}

export async function addPassenger(formData: FormData) {
  const user = await actor(["client", "admin"], "missions.edit");
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const fullName = str(formData, "full_name");
  if (!missionId || !fullName) redirect(`/portal/client/trips/${missionId}?error=missing`);

  const backTo = isAdminRole(user.role) ? `/portal/admin/trips/${missionId}` : `/portal/client/trips/${missionId}`;
  await requireMissionAccessForMutation(db, missionId, user, backTo);

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
  const base = isAdminRole(user.role) ? "/portal/admin/trips" : "/portal/client/trips";
  revalidatePath(`${base}/${missionId}`);
  redirect(`${base}/${missionId}?success=passenger`);
}

export async function removePassenger(formData: FormData) {
  const user = await actor(["client", "admin"], "missions.edit");
  const db = await createServiceClient();
  const id = str(formData, "passenger_id");
  const missionId = str(formData, "mission_id");

  const backTo = isAdminRole(user.role) ? `/portal/admin/trips/${missionId}` : `/portal/client/trips/${missionId}`;
  await requireMissionAccessForMutation(db, missionId, user, backTo);

  await db.from("mission_passengers").delete().eq("id", id).eq("mission_id", missionId);
  const base = isAdminRole(user.role) ? "/portal/admin/trips" : "/portal/client/trips";
  revalidatePath(`${base}/${missionId}`);
  redirect(`${base}/${missionId}?success=passenger`);
}

// ─── Crew pool (admin) ──────────────────────────────────────────────

function csvList(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Publish/unpublish a mission to the crew Open Pool and set its requirements. */
export async function updateMissionPool(formData: FormData) {
  const admin = await actor(["admin"], "missions.edit");
  const db = await createServiceClient();
  const missionId = str(formData, "mission_id");
  const visible = bool(formData, "pool_visible");

  const requirements = {
    min_total_time: num(formData, "min_total_time"),
    required_type_ratings: csvList(formData, "required_type_ratings"),
    min_time_in_type: num(formData, "min_time_in_type"),
    min_pilot_age: num(formData, "min_pilot_age"),
    max_pilot_age: num(formData, "max_pilot_age"),
    allowed_regions: csvList(formData, "allowed_regions"),
  };

  const { data: mission } = await db
    .from("missions")
    .select("id, ref, pool_visible, departure_airport, arrival_airport, requested_departure, assigned_crew_id")
    .eq("id", missionId)
    .maybeSingle();
  if (!mission) redirect("/portal/admin/trips");

  await db
    .from("missions")
    .update({
      pool_visible: visible,
      pool_published_at: visible ? new Date().toISOString() : null,
      pool_requirements: requirements,
    })
    .eq("id", missionId);

  await logAuditEvent({
    actor: admin,
    action: visible ? "mission_pool_published" : "mission_pool_unpublished",
    detail: `${mission!.ref} ${visible ? "published to" : "removed from"} the crew pool`,
    entityType: "mission",
    entityId: missionId,
  });

  // On publish (never on hide/close), notify every already-qualified crew
  // member so pilots hear about the opening instead of only finding it by
  // browsing. Notify failures must never break the publish, so we swallow
  // them via allSettled; the qualified set is small.
  if (visible) {
    const route = formatRoute(mission!.departure_airport, mission!.arrival_airport);
    const timing = mission!.requested_departure ? ` departing ${formatDateTime(mission!.requested_departure)}` : "";
    const qualified = await listQualifiedCrew(requirements);
    await Promise.allSettled(
      qualified
        .filter((crew) => crew.id !== mission!.assigned_crew_id)
        .map((crew) =>
          notifyUser({
            userId: crew.id,
            title: `New mission open to the pool — ${mission!.ref}`,
            body: `${mission!.ref} — ${route}${timing}. You qualify for this mission. Open the crew Open Pool to review and request it.`,
            type: "crew_pool_published",
            entityType: "mission",
            entityId: missionId,
          })
        )
    );
  }

  revalidatePath(`/portal/admin/trips/${missionId}`);
  revalidatePath("/portal/crew/missions");
  redirect(`/portal/admin/trips/${missionId}?success=pool`);
}

/** Approve or deny a crew member's pool request. Approval creates the assignment. */
export async function decideCrewPoolRequest(formData: FormData) {
  const admin = await actor(["admin"], "missions.edit");
  const db = await createServiceClient();
  const requestId = str(formData, "request_id");
  const decision = str(formData, "decision") === "approved" ? "approved" : "denied";
  const crewRole = str(formData, "crew_role") || "pic";
  const notes = str(formData, "decision_notes");
  const now = new Date().toISOString();

  const { data: request } = await db
    .from("mission_crew_requests")
    .select("*, mission:mission_id(id,ref,assigned_crew_id), crew:crew_id(full_name,email)")
    .eq("id", requestId)
    .maybeSingle();
  if (!request || !request.mission) redirect("/portal/admin/trips");
  const missionId = request!.mission_id as string;
  const missionRef = (request!.mission as { ref: string }).ref;
  if (request!.status !== "pending") {
    redirect(`/portal/admin/trips/${missionId}?error=request-decided`);
  }

  // MOVEMENT GATE (crew edition): approval commits this crew member to the
  // mission, so their insurance approval + credential currency are checked
  // before anything is written. Same override pattern as status changes.
  const overrideReason = str(formData, "override_reason");
  let crewBlockers: string[] = [];
  if (decision === "approved") {
    crewBlockers = formatCrewComplianceBlockers(
      await listCrewComplianceIssues(db, [request!.crew_id as string])
    );
    if (crewBlockers.length && overrideReason.length < MIN_GATE_OVERRIDE_REASON_LENGTH) {
      redirect(`/portal/admin/trips/${missionId}?error=gate-blocked&gate=crew`);
    }
  }

  // The mission move is the write that can conflict, so it goes FIRST: if the
  // mission progressed under us we redirect before the request row or an
  // assignment row is touched, leaving no half-approved state behind.
  if (decision === "approved") {
    const alreadyAssigned = (request!.mission as { assigned_crew_id: string | null }).assigned_crew_id;
    if (alreadyAssigned) {
      // Supplemental crew on a mission that already has a confirmed pilot:
      // just close the pool, never touch the mission status.
      await db.from("missions").update({ pool_visible: false }).eq("id", missionId);
    } else {
      // Committing the first crew member moves the mission to crew_assigned —
      // legal only from an approved mission (mirrors respondToAssignment and
      // canTransition, which only allow approved → crew_assigned). Predicate on
      // the write so a stale request decided after the mission progressed can't
      // drag it backward; zero rows means the mission moved on under us.
      const { data: moved } = await db
        .from("missions")
        .update({ assigned_crew_id: request!.crew_id, status: "crew_assigned", pool_visible: false })
        .eq("id", missionId)
        .eq("status", "approved")
        .select("id")
        .maybeSingle();
      if (!moved) {
        redirect(`/portal/admin/trips/${missionId}?error=conflict`);
      }
    }
  }

  await db
    .from("mission_crew_requests")
    .update({
      status: decision,
      decided_by: admin.id,
      decided_at: now,
      decision_notes: notes || null,
      updated_at: now,
    })
    .eq("id", requestId);

  if (decision === "approved") {
    const { data: existing } = await db
      .from("mission_crew_assignments")
      .select("id")
      .eq("mission_id", missionId)
      .eq("crew_id", request!.crew_id)
      .maybeSingle();
    if (existing) {
      await db
        .from("mission_crew_assignments")
        .update({ status: "accepted", responded_at: now })
        .eq("id", existing.id);
    } else {
      await db.from("mission_crew_assignments").insert({
        mission_id: missionId,
        crew_id: request!.crew_id,
        crew_role: crewRole,
        status: "accepted",
        responded_at: now,
      });
    }

    await notifyUser({
      userId: request!.crew_id,
      title: `Mission request approved — ${missionRef}`,
      body: `AMG Operations approved your request for ${missionRef}. The full mission brief, including passenger details, is now available in My Assignments.`,
      type: "crew_pool_request_approved",
      entityType: "mission",
      entityId: missionId,
    });
    await notifyMissionContactByEmail({
      missionId,
      title: "Crew assignment confirmed",
      eventLabel: "Crew Assigned",
      intro:
        "AMG Operations has confirmed a crew assignment for your mission. We will continue coordinating the remaining operational details and will contact you if additional information is required.",
      details: [{ label: "Crew Status", value: "Confirmed" }],
    });

    if (crewBlockers.length) {
      // Loud override trail — mirrors updateMissionStatus so every forced
      // gate is auditable and visible to the whole admin team.
      await logAuditEvent({
        actor: admin,
        action: "mission_gate_overridden",
        detail: `${missionRef}: crew pool approval forced past ${crewBlockers.length} blocker(s): ${crewBlockers.join("; ")} — Override reason: ${overrideReason}`,
        entityType: "mission",
        entityId: missionId,
      });
      await notifyAdmins({
        title: `Gate override — crew approved on ${missionRef}`,
        body: `${admin.name} approved a crew pool request on ${missionRef} over ${crewBlockers.length} readiness blocker(s): ${crewBlockers.join("; ")}. Reason: ${overrideReason}`,
        type: "mission_gate_overridden",
        entityType: "mission",
        entityId: missionId,
      });
    }
  } else {
    await notifyUser({
      userId: request!.crew_id,
      title: `Mission request update — ${missionRef}`,
      body: `AMG Operations was unable to approve your request for ${missionRef} at this time. Keep an eye on the Open Pool for future missions.`,
      type: "crew_pool_request_denied",
      entityType: "mission",
      entityId: missionId,
    });
  }

  await logAuditEvent({
    actor: admin,
    action: decision === "approved" ? "crew_pool_request_approved" : "crew_pool_request_denied",
    detail: `${decision === "approved" ? "Approved" : "Denied"} crew request for ${missionRef}`,
    entityType: "mission",
    entityId: missionId,
  });

  revalidatePath(`/portal/admin/trips/${missionId}`);
  revalidatePath("/portal/crew/missions");
  redirect(`/portal/admin/trips/${missionId}?success=pool-request`);
}
