"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export async function addPassenger(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const preferences = String(formData.get("preferences") ?? "").trim() || null;
  const is_frequent = formData.get("is_frequent") === "true";

  if (!full_name) redirect("/portal/passengers?error=missing-name");

  const { error } = await supabase.from("passenger_profiles").insert({
    owner_id: user.id,
    full_name,
    preferences,
    is_frequent,
  });

  if (!error) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "Added passenger profile",
      detail: full_name,
      entityType: "passenger_profile",
    });
  }

  revalidatePath("/portal/passengers");
  redirect("/portal/passengers");
}

export async function deletePassenger(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/portal/passengers");

  const { error } = await supabase
    .from("passenger_profiles")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (!error) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "Removed passenger profile",
      entityType: "passenger_profile",
      entityId: id,
    });
  }

  revalidatePath("/portal/passengers");
  redirect("/portal/passengers");
}

export async function toggleFrequent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "").trim();
  const is_frequent = formData.get("is_frequent") === "true";

  if (!id) redirect("/portal/passengers");

  await supabase
    .from("passenger_profiles")
    .update({ is_frequent })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/portal/passengers");
  redirect("/portal/passengers");
}
