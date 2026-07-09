"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, num, safeRedirectPath, str } from "./_helpers";
import { logAuditEvent, notifyAdmins } from "@/lib/portal/audit";

/**
 * Client-submitted aircraft: owners add their own aircraft, which lands in
 * the admin Aircraft directory as "Pending Review" for AMG to verify and
 * activate. Clients never set status directly.
 */
export async function submitClientAircraft(formData: FormData) {
  // Adding aircraft is a distinct permission from viewing them; clients have
  // aircraft.add by default, so this enforces the matrix without changing
  // default behavior.
  const user = await actor(["client"], "aircraft.add");
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/client/aircraft");

  const tail = str(formData, "tail_number").trim().toUpperCase().slice(0, 20);
  if (!tail) redirect(`${backTo}?error=tail`);

  const db = await createServiceClient();
  const { data: existing } = await db
    .from("aircraft")
    .select("id, client_id")
    .ilike("tail_number", tail)
    .maybeSingle();
  if (existing) redirect(`${backTo}?error=tail-exists`);

  const year = num(formData, "year");
  const capacity = num(formData, "passenger_capacity");
  const { data: aircraft, error } = await db
    .from("aircraft")
    .insert({
      tail_number: tail,
      client_id: user.id,
      status: "pending_review",
      make: str(formData, "make").trim().slice(0, 80) || null,
      model: str(formData, "model").trim().slice(0, 80) || null,
      year: year && year >= 1940 && year <= 2100 ? Math.round(year) : null,
      serial_number: str(formData, "serial_number").trim().slice(0, 80) || null,
      home_base: str(formData, "home_base").trim().toUpperCase().slice(0, 12) || null,
      aircraft_category: str(formData, "aircraft_category").trim().slice(0, 60) || null,
      passenger_capacity:
        capacity && capacity > 0 && capacity <= 100 ? Math.round(capacity) : null,
      notes: str(formData, "notes").trim().slice(0, 2000) || null,
    })
    .select("id, tail_number")
    .single();
  if (error || !aircraft) redirect(`${backTo}?error=save`);

  await logAuditEvent({
    actor: user,
    action: "aircraft_submitted",
    detail: `${aircraft.tail_number}: submitted by owner for AMG review`,
    entityType: "aircraft",
    entityId: aircraft.id,
  });
  await notifyAdmins({
    title: `Aircraft ${aircraft.tail_number} submitted for review`,
    body: `${user.name}${user.companyName ? ` (${user.companyName})` : ""} added ${aircraft.tail_number} from the client portal. Review it in the Aircraft directory and set it Active.`,
    type: "aircraft_submitted",
    entityType: "aircraft",
    entityId: aircraft.id,
  });

  revalidatePath("/portal/admin/aircraft");
  revalidatePath("/portal/client/aircraft");
  redirect(`${backTo}?success=submitted`);
}
