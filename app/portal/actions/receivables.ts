"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { emailInvoicePdf } from "@/lib/portal/billing-emails";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, str } from "./_helpers";

const AR_PATH = "/portal/admin/receivables";

/** Re-send an open invoice to the client as a payment reminder. */
export async function sendInvoiceReminder(formData: FormData) {
  const admin = await actor(["admin"]);
  const invoiceId = str(formData, "invoice_id");
  if (!invoiceId) redirect(`${AR_PATH}?error=missing`);

  const db = (await createServiceClient()) as any;
  const { data: invoice } = await db
    .from("invoices")
    .select("id, invoice_number, status, amount_due, client_id, due_date")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) redirect(`${AR_PATH}?error=missing`);
  if (!["sent", "viewed", "partially_paid", "overdue"].includes(invoice.status)) {
    redirect(`${AR_PATH}?error=closed`);
  }

  try {
    await emailInvoicePdf(invoiceId, admin.id);
  } catch (error) {
    console.error("[receivables] reminder email failed", invoiceId, error);
    redirect(`${AR_PATH}?error=email`);
  }

  if (invoice.client_id) {
    await notifyUser({
      userId: invoice.client_id,
      title: `Payment reminder: invoice ${invoice.invoice_number}`,
      body: "An AMG invoice on your account is awaiting payment. Open Billing in AMG Connect to review and pay.",
      type: "invoice_reminder",
      entityType: "invoice",
      entityId: invoiceId,
    });
  }

  await logAuditEvent({
    actor: admin,
    action: "invoice_reminder_sent",
    detail: `Reminder for ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  revalidatePath(AR_PATH);
  redirect(`${AR_PATH}?success=reminded`);
}

/** Mark an open invoice overdue explicitly (surface it in client + admin views). */
export async function markInvoiceOverdue(formData: FormData) {
  const admin = await actor(["admin"]);
  const invoiceId = str(formData, "invoice_id");
  if (!invoiceId) redirect(`${AR_PATH}?error=missing`);

  const db = (await createServiceClient()) as any;
  const { error } = await db
    .from("invoices")
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .in("status", ["sent", "viewed", "partially_paid"]);
  if (error) redirect(`${AR_PATH}?error=save`);

  await logAuditEvent({
    actor: admin,
    action: "invoice_marked_overdue",
    entityType: "invoice",
    entityId: invoiceId,
  });
  revalidatePath(AR_PATH);
  redirect(`${AR_PATH}?success=overdue`);
}
