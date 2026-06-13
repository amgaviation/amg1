"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent } from "@/lib/portal/audit";
import { emailReceiptPdf } from "@/lib/portal/billing-emails";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, str } from "./_helpers";

export async function resendReceiptPdf(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = (await createServiceClient()) as any;
  const paymentId = str(formData, "payment_id");
  if (!paymentId) redirect("/portal/admin/receipts?error=missing");

  const { data: payment } = await db
    .from("payments")
    .select("id, receipt_number, invoice_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) redirect("/portal/admin/receipts?error=missing");

  await emailReceiptPdf(paymentId, admin.id).catch((error) => {
    console.error("[billing] failed to resend receipt PDF", paymentId, error);
  });
  await logAuditEvent({
    actor: admin,
    action: "receipt_pdf_resent",
    detail: `Resent ${payment.receipt_number ?? "receipt"}`,
    entityType: "invoice",
    entityId: payment.invoice_id,
  });
  revalidatePath("/portal/admin/receipts");
  if (payment.invoice_id) revalidatePath(`/portal/admin/invoices/${payment.invoice_id}`);
  redirect("/portal/admin/receipts?success=resent");
}
