"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, str } from "./_helpers";

const PASSENGERS_PATH = "/portal/client/passengers";

export async function createPassengerProfile(formData: FormData) {
  const user = await actor(["client"]);
  const fullName = str(formData, "full_name");
  if (!fullName) redirect(`${PASSENGERS_PATH}?error=missing`);

  const preferences = str(formData, "preferences") || null;
  if (preferences && detectProhibitedPaymentData({ preferences }).length) {
    redirect(`${PASSENGERS_PATH}?error=payment-data`);
  }

  const db = (await createServiceClient()) as any;
  const { count } = await db
    .from("passenger_profiles")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  if ((count ?? 0) >= 100) redirect(`${PASSENGERS_PATH}?error=limit`);

  const { error } = await db.from("passenger_profiles").insert({
    owner_id: user.id,
    full_name: fullName,
    preferences,
    is_frequent: str(formData, "is_frequent") === "true",
  });
  if (error) redirect(`${PASSENGERS_PATH}?error=save`);

  await logAuditEvent({
    actor: user,
    action: "passenger_profile_created",
    detail: fullName,
    entityType: "passenger_profile",
  });
  revalidatePath(PASSENGERS_PATH);
  redirect(`${PASSENGERS_PATH}?success=created`);
}

export async function updatePassengerProfile(formData: FormData) {
  const user = await actor(["client"]);
  const passengerId = str(formData, "passenger_id");
  const fullName = str(formData, "full_name");
  if (!passengerId || !fullName) redirect(`${PASSENGERS_PATH}?error=missing`);

  const preferences = str(formData, "preferences") || null;
  if (preferences && detectProhibitedPaymentData({ preferences }).length) {
    redirect(`${PASSENGERS_PATH}?error=payment-data`);
  }

  const db = (await createServiceClient()) as any;
  const { error } = await db
    .from("passenger_profiles")
    .update({
      full_name: fullName,
      preferences,
      is_frequent: str(formData, "is_frequent") === "true",
    })
    .eq("id", passengerId)
    .eq("owner_id", user.id);
  if (error) redirect(`${PASSENGERS_PATH}?error=save`);

  await logAuditEvent({
    actor: user,
    action: "passenger_profile_updated",
    detail: fullName,
    entityType: "passenger_profile",
    entityId: passengerId,
  });
  revalidatePath(PASSENGERS_PATH);
  redirect(`${PASSENGERS_PATH}?success=saved`);
}

export async function deletePassengerProfile(formData: FormData) {
  const user = await actor(["client"]);
  const passengerId = str(formData, "passenger_id");
  if (!passengerId) redirect(`${PASSENGERS_PATH}?error=missing`);

  const db = (await createServiceClient()) as any;
  const { error } = await db
    .from("passenger_profiles")
    .delete()
    .eq("id", passengerId)
    .eq("owner_id", user.id);
  if (error) redirect(`${PASSENGERS_PATH}?error=save`);

  await logAuditEvent({
    actor: user,
    action: "passenger_profile_deleted",
    entityType: "passenger_profile",
    entityId: passengerId,
  });
  revalidatePath(PASSENGERS_PATH);
  redirect(`${PASSENGERS_PATH}?success=deleted`);
}
