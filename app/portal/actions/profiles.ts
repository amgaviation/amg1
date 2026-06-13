"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, str } from "./_helpers";

function splitEmails(value: string) {
  return value
    .split(/[,;\n]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function updateBillingContact(formData: FormData) {
  const user = await actor(["client", "admin"]);
  const db = (await createServiceClient()) as any;
  const profileId = str(formData, "profile_id") || user.id;
  const backTo = str(formData, "back_to") || "/portal/client/settings";

  if (user.role !== "admin" && profileId !== user.id) redirect("/access-denied");

  const { error } = await db
    .from("profiles")
    .update({
      billing_contact_name: str(formData, "billing_contact_name") || null,
      billing_contact_email: str(formData, "billing_contact_email") || null,
      billing_contact_phone: str(formData, "billing_contact_phone") || null,
      billing_cc_emails: splitEmails(str(formData, "billing_cc_emails")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (error) redirect(`${backTo}?error=billing-contact`);

  await logAuditEvent({
    actor: user,
    action: "billing_contact_updated",
    detail: user.id === profileId ? "Updated billing contact preferences" : `Updated billing contact for ${profileId}`,
    entityType: "profile",
    entityId: profileId,
  });
  revalidatePath("/portal/admin/clients");
  revalidatePath("/portal/client/settings");
  redirect(`${backTo}?success=billing-contact`);
}
