"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, safeRedirectPath, str } from "./_helpers";

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
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/client/settings");

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

/**
 * Self-service profile edit: name, phone, company, home base. Users may only
 * edit their OWN row — role/status/email are deliberately not touchable here
 * (email changes go through the account security flow).
 */
export async function updateOwnProfile(formData: FormData) {
  const user = await actor(["client", "crew", "partner", "admin"]);
  const db = await createServiceClient();
  const backTo = safeRedirectPath(str(formData, "back_to"), `/portal/${user.role === "admin" ? "admin/settings" : `${user.role}/profile`}`);

  const fullName = str(formData, "full_name").trim().slice(0, 160);
  if (!fullName) redirect(`${backTo}?error=profile-name`);

  const { error } = await db
    .from("profiles")
    .update({
      full_name: fullName,
      phone: str(formData, "phone").trim().slice(0, 50) || null,
      company_name: str(formData, "company_name").trim().slice(0, 200) || null,
      home_base: str(formData, "home_base").trim().slice(0, 120) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) redirect(`${backTo}?error=profile-save`);

  await logAuditEvent({
    actor: user,
    action: "profile_updated",
    detail: "Updated own profile details",
    entityType: "profile",
    entityId: user.id,
  });
  revalidatePath(backTo);
  redirect(`${backTo}?success=profile`);
}

const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** Upload/replace the caller's profile picture (documents bucket, avatars/). */
export async function uploadAvatar(formData: FormData) {
  const user = await actor(["client", "crew", "partner", "admin"]);
  const db = await createServiceClient();
  const backTo = safeRedirectPath(str(formData, "back_to"), `/portal/${user.role === "admin" ? "admin/settings" : `${user.role}/profile`}`);

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) redirect(`${backTo}?error=avatar-file`);
  const ext = AVATAR_TYPES[(file as File).type];
  if (!ext || (file as File).size > MAX_AVATAR_BYTES) redirect(`${backTo}?error=avatar-file`);

  // Versioned path so browser/CDN caches of the old picture can't linger.
  const path = `avatars/${user.id}/${Date.now()}.${ext}`;
  const { error: uploadErr } = await db.storage
    .from("documents")
    .upload(path, file as File, { contentType: (file as File).type });
  if (uploadErr) redirect(`${backTo}?error=avatar-save`);

  const { data: previous } = await db.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  const { error } = await db.from("profiles").update({ avatar_path: path, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (error) redirect(`${backTo}?error=avatar-save`);
  if (previous?.avatar_path && previous.avatar_path !== path) {
    await db.storage.from("documents").remove([previous.avatar_path]);
  }

  await logAuditEvent({
    actor: user,
    action: "avatar_updated",
    detail: "Updated profile picture",
    entityType: "profile",
    entityId: user.id,
  });
  revalidatePath(backTo);
  redirect(`${backTo}?success=avatar`);
}
