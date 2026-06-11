"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

export async function updateAvailability(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const availability_status = String(formData.get("availability_status") ?? "").trim();
  const validStatuses = ["available", "limited", "unavailable"];
  if (!validStatuses.includes(availability_status)) redirect("/portal/crew-profile?error=invalid");

  // Upsert crew_profile
  const { error } = await supabase.from("crew_profiles").upsert(
    { id: user.id, availability_status, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );

  if (!error) {
    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: "crew",
      action: "Updated availability status",
      detail: availability_status,
      entityType: "crew_profile",
      entityId: user.id,
    });
  }

  revalidatePath("/portal/crew-profile");
  redirect("/portal/crew-profile");
}
