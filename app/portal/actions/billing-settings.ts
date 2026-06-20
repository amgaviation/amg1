"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { saveBillingSettings } from "@/lib/portal/billing-config";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/portal/audit";
import { ACKNOWLEDGMENT_TEXT, COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
import { actor, bool, num, str } from "./_helpers";

const COOKIE = "amg_billing_settings_confirmed";

export async function billingSettingsConfirmed() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE)?.value === "true";
}

export async function confirmBillingSettingsAccess(formData: FormData) {
  const admin = await actor(["admin"]);
  const password = str(formData, "password");
  if (!password) redirect("/portal/admin/settings/billing?error=confirm");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: admin.email,
    password,
  });

  if (error) redirect("/portal/admin/settings/billing?error=confirm");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60,
    path: "/portal/admin/settings/billing",
  });

  await logAuditEvent({
    actor: admin,
    action: "billing_settings_access_confirmed",
    detail: "Confirmed access to protected billing settings",
    entityType: "billing_settings",
    entityId: "global",
  });

  redirect("/portal/admin/settings/billing?success=confirmed");
}

export async function updateBillingSettings(formData: FormData) {
  const admin = await actor(["admin"]);
  if (!(await billingSettingsConfirmed())) {
    redirect("/portal/admin/settings/billing?error=confirm");
  }

  const paymentFindings = detectProhibitedPaymentData({
    payment_instructions: str(formData, "payment_instructions"),
    wire_instructions: str(formData, "wire_instructions"),
    ach_instructions: str(formData, "ach_instructions"),
    check_instructions: str(formData, "check_instructions"),
    quote_terms: str(formData, "quote_terms"),
    invoice_terms: str(formData, "invoice_terms"),
  });
  if (paymentFindings.length) {
    await recordComplianceEvidence({
      actor: admin,
      audience: "admin",
      eventType: "no_online_payment_notice_acknowledged",
      eventArea: "billing",
      policyKey: POLICY_KEYS.noOnlinePayment,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: ACKNOWLEDGMENT_TEXT.noOnlinePayment,
      metadata: { action: "billing_settings_blocked", fields: paymentFindings.map((finding) => finding.field), findingTypes: paymentFindings.map((finding) => finding.type) },
    });
    redirect("/portal/admin/settings/billing?error=payment-data");
  }

  await saveBillingSettings({
    company_name: str(formData, "company_name") || "AMG Aviation Group",
    company_legal_name: str(formData, "company_legal_name") || null,
    company_email: str(formData, "company_email") || null,
    company_phone: str(formData, "company_phone") || null,
    company_address: str(formData, "company_address") || null,
    logo_path: str(formData, "logo_path") || "/images/logo-navy.png",
    payment_instructions: str(formData, "payment_instructions") || null,
    wire_instructions: str(formData, "wire_instructions") || null,
    ach_instructions: str(formData, "ach_instructions") || null,
    check_instructions: str(formData, "check_instructions") || null,
    quote_terms: str(formData, "quote_terms") || null,
    invoice_terms: str(formData, "invoice_terms") || null,
    quote_disclaimer: str(formData, "quote_disclaimer") || null,
    invoice_disclaimer: str(formData, "invoice_disclaimer") || null,
    receipt_disclaimer: str(formData, "receipt_disclaimer") || null,
    tax_rate: num(formData, "tax_rate") ?? 0,
    default_deposit_percent: num(formData, "default_deposit_percent") ?? 0,
    auto_send_invoice_on_quote_approval: bool(formData, "auto_send_invoice_on_quote_approval"),
    updated_by: admin.id,
  });

  await logAuditEvent({
    actor: admin,
    action: "billing_settings_updated",
    detail: "Updated global billing settings",
    entityType: "billing_settings",
    entityId: "global",
  });

  revalidatePath("/portal/admin/settings/billing");
  redirect("/portal/admin/settings/billing?success=saved");
}
