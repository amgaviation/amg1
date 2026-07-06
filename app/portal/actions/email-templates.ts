"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { buildEmailTemplateDefaults } from "@/lib/portal/email-template-registry";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, safeRedirectPath, str } from "./_helpers";

const EDITOR_PATH = "/portal/admin/settings/email-templates";

function backPath(formData: FormData) {
  return safeRedirectPath(str(formData, "back_to"), EDITOR_PATH);
}

function withStatus(base: string, key: string, value: string) {
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${key}=${encodeURIComponent(value)}`;
}

/** Save a global override for an email template (upsert by template_key). */
export async function saveEmailTemplate(formData: FormData) {
  const admin = await actor(["admin"]);
  const backTo = backPath(formData);
  const key = str(formData, "template_key");
  const subject = str(formData, "subject").slice(0, 300);
  const body = str(formData, "body").slice(0, 20000);
  if (!key || !subject || !body) redirect(withStatus(backTo, "error", "missing"));

  const db = (await createServiceClient()) as any;
  const defaults = buildEmailTemplateDefaults();
  const def = defaults.find((entry) => entry.key === key);

  const { data: existing, error: lookupError } = await db
    .from("communication_templates")
    .select("id")
    .eq("template_key", key)
    .maybeSingle();
  if (lookupError) redirect(withStatus(backTo, "error", "save"));

  // Only registry keys may create new rows; unknown keys must already exist
  // (comms-center starters and other DB-native templates).
  if (!existing && !def) redirect(withStatus(backTo, "error", "unknown"));

  if (existing) {
    const { error } = await db
      .from("communication_templates")
      .update({
        subject_template: subject,
        body_template_text: body,
        active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) redirect(withStatus(backTo, "error", "save"));
  } else {
    const { error } = await db.from("communication_templates").insert({
      template_key: key,
      name: def!.name,
      category: def!.family,
      subject_template: subject,
      body_template_text: body,
      allowed_roles: ["admin"],
      variables: def!.variables,
      active: true,
    });
    if (error) redirect(withStatus(backTo, "error", "save"));
  }

  await logAuditEvent({
    actor: admin,
    action: "email_template_saved",
    detail: key,
    entityType: "communication_template",
    entityId: null,
  });
  revalidatePath(EDITOR_PATH);
  redirect(withStatus(backTo, "success", "saved"));
}

/** Remove an override so the template falls back to the shipped default. */
export async function resetEmailTemplate(formData: FormData) {
  const admin = await actor(["admin"]);
  const backTo = backPath(formData);
  const key = str(formData, "template_key");
  const defaults = buildEmailTemplateDefaults();
  // Only registry-backed templates have a default to fall back to.
  if (!key || !defaults.some((entry) => entry.key === key)) {
    redirect(withStatus(backTo, "error", "unknown"));
  }

  const db = (await createServiceClient()) as any;
  const { error } = await db.from("communication_templates").delete().eq("template_key", key);
  if (error) redirect(withStatus(backTo, "error", "save"));

  await logAuditEvent({
    actor: admin,
    action: "email_template_reset",
    detail: key,
    entityType: "communication_template",
    entityId: null,
  });
  revalidatePath(EDITOR_PATH);
  redirect(withStatus(backTo, "success", "reset"));
}
