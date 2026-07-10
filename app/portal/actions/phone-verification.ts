"use server";

import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { createServiceClient } from "@/lib/supabase/server";
import {
  confirmPhoneVerification,
  normalizePhoneE164,
  startPhoneVerification,
} from "@/lib/portal/phone-verification";
import { actor, bool, safeRedirectPath, str } from "./_helpers";

export async function sendSmsVerificationCode(formData: FormData) {
  const user = await actor();
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal");

  const phone = normalizePhoneE164(str(formData, "phone"));
  if (!phone) redirect(`${backTo}?smsError=invalid-phone`);

  const result = await startPhoneVerification(user.id, phone);
  if (result !== "sent") redirect(`${backTo}?smsError=${result}`);

  await logAuditEvent({
    actor: user,
    action: "phone_verification_sent",
    detail: `Sent SMS verification code to ${phone}`,
    entityType: "profile",
    entityId: user.id,
  });
  redirect(`${backTo}?sms=code-sent`);
}

export async function confirmSmsVerificationCode(formData: FormData) {
  const user = await actor();
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal");

  const code = str(formData, "code").replace(/\s+/g, "");
  if (!/^\d{4,8}$/.test(code)) redirect(`${backTo}?smsError=invalid-code`);

  const result = await confirmPhoneVerification(user.id, code);
  if (result !== "verified") redirect(`${backTo}?smsError=${result}`);

  await logAuditEvent({
    actor: user,
    action: "phone_verified",
    detail: "Verified mobile number for SMS notifications",
    entityType: "profile",
    entityId: user.id,
  });
  redirect(`${backTo}?sms=verified`);
}

export async function updateSmsNotificationPreference(formData: FormData) {
  const user = await actor();
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal");
  const enabled = bool(formData, "sms_notifications_enabled");

  const db = (await createServiceClient()) as any;
  const { error } = await db
    .from("profiles")
    .update({
      sms_notifications_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) redirect(`${backTo}?smsError=preference-failed`);

  await logAuditEvent({
    actor: user,
    action: "sms_preference_updated",
    detail: enabled ? "Enabled SMS notifications" : "Disabled SMS notifications",
    entityType: "profile",
    entityId: user.id,
  });
  redirect(`${backTo}?sms=preference-saved`);
}
