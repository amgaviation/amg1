"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { actor, num, str } from "./_helpers";

function money(formData: FormData, key: string): number {
  return num(formData, key) ?? 0;
}

export async function createInvoiceFromQuote(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const quoteId = str(formData, "quote_id");
  if (!quoteId) redirect("/portal/admin/invoices?error=missing");

  const { data: quote } = await db
    .from("quotes")
    .select("*, mission:mission_id(aircraft_id)")
    .eq("id", quoteId)
    .maybeSingle()
    .returns<({ id: string; ref: string; status: string; mission_id: string | null; client_id: string | null; subtotal: number; total: number; client_notes: string | null; mission: { aircraft_id: string | null } | null }) | null>();
  if (!quote) redirect("/portal/admin/invoices?error=quote");

  const { data: existing } = await db
    .from("invoices")
    .select("id")
    .eq("quote_id", quoteId)
    .neq("status", "void")
    .maybeSingle();
  if (existing) redirect(`/portal/admin/invoices/${existing.id}?error=duplicate`);

  const { data: quoteItems } = await db
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order");
  const dueDate = str(formData, "due_date") || null;
  const terms = str(formData, "terms") || "Due on receipt unless otherwise agreed in writing.";
  const subtotal = quote.total ?? quote.subtotal ?? 0;

  const { data: invoice, error } = await db
    .from("invoices")
    .insert({
      quote_id: quote.id,
      mission_id: quote.mission_id,
      aircraft_id: quote.mission?.aircraft_id ?? null,
      client_id: quote.client_id,
      status: "sent",
      subtotal,
      total: subtotal,
      amount_due: subtotal,
      issued_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      due_date: dueDate,
      terms,
      client_notes: quote.client_notes,
      created_by: admin.id,
    })
    .select("id, invoice_number")
    .single();
  if (error || !invoice) redirect("/portal/admin/invoices?error=save");

  if (quoteItems?.length) {
    await db.from("invoice_line_items").insert(
      quoteItems.map((item) => ({
        invoice_id: invoice.id,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        sort_order: item.sort_order,
      }))
    );
  }
  await db.from("quotes").update({ status: "converted" }).eq("id", quote.id);

  await logAuditEvent({
    actor: admin,
    action: "invoice_created_from_quote",
    detail: `Created ${invoice.invoice_number} from ${quote.ref}`,
    entityType: "invoice",
    entityId: invoice.id,
  });
  if (quote.client_id) {
    await notifyUser({
      userId: quote.client_id,
      title: "Invoice issued",
      body: `${invoice.invoice_number} is available in your billing portal.`,
      type: "invoice_issued",
      entityType: "invoice",
      entityId: invoice.id,
    });
  }
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoice.id}?success=created`);
}

export async function createStandaloneInvoice(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const clientId = str(formData, "client_id");
  const category = str(formData, "category");
  const description = str(formData, "description");
  const quantity = money(formData, "quantity") || 1;
  const unitPrice = money(formData, "unit_price");
  if (!clientId || !category) redirect("/portal/admin/invoices?error=missing");
  const amount = quantity * unitPrice;

  const { data: invoice, error } = await db
    .from("invoices")
    .insert({
      client_id: clientId,
      mission_id: str(formData, "mission_id") || null,
      aircraft_id: str(formData, "aircraft_id") || null,
      status: str(formData, "status") || "draft",
      subtotal: amount,
      total: amount,
      amount_due: amount,
      due_date: str(formData, "due_date") || null,
      terms: str(formData, "terms") || null,
      client_notes: str(formData, "client_notes") || null,
      internal_notes: str(formData, "internal_notes") || null,
      created_by: admin.id,
      issued_at: new Date().toISOString(),
      sent_at: str(formData, "status") === "sent" ? new Date().toISOString() : null,
    })
    .select("id, invoice_number")
    .single();
  if (error || !invoice) redirect("/portal/admin/invoices?error=save");

  await db.from("invoice_line_items").insert({
    invoice_id: invoice.id,
    category,
    description: description || null,
    quantity,
    unit_price: unitPrice,
    amount,
    sort_order: 0,
  });
  await logAuditEvent({
    actor: admin,
    action: "invoice_created",
    detail: `Created ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: invoice.id,
  });
  if (str(formData, "status") === "sent") {
    await notifyUser({
      userId: clientId,
      title: "Invoice issued",
      body: `${invoice.invoice_number} is available in your billing portal.`,
      type: "invoice_issued",
      entityType: "invoice",
      entityId: invoice.id,
    });
  }
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoice.id}?success=created`);
}

export async function recordInvoicePayment(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const invoiceId = str(formData, "invoice_id");
  const amount = money(formData, "amount");
  if (!invoiceId || amount <= 0) redirect("/portal/admin/invoices?error=payment");

  const { data: invoice } = await db
    .from("invoices")
    .select("amount_paid, total, client_id, invoice_number")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) redirect("/portal/admin/invoices?error=missing");
  const amountPaid = (invoice.amount_paid ?? 0) + amount;
  const total = invoice.total ?? 0;
  const status = amountPaid >= total ? "paid" : "partially_paid";
  const paidAt = status === "paid" ? new Date().toISOString() : null;

  await db.from("payments").insert({
    invoice_id: invoiceId,
    amount,
    payment_method: str(formData, "payment_method") || "manual",
    notes: str(formData, "notes") || null,
    recorded_by: admin.id,
    status: "recorded",
  });
  await db
    .from("invoices")
    .update({
      amount_paid: amountPaid,
      amount_due: Math.max(total - amountPaid, 0),
      status,
      paid_at: paidAt,
    })
    .eq("id", invoiceId);
  await logAuditEvent({
    actor: admin,
    action: "invoice_payment_recorded",
    detail: `Recorded payment ${amount} on ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  if (invoice.client_id) {
    await notifyUser({
      userId: invoice.client_id,
      title: "Invoice payment updated",
      body: `${invoice.invoice_number} is now ${status.replace(/_/g, " ")}.`,
      type: "invoice_payment",
      entityType: "invoice",
      entityId: invoiceId,
    });
  }
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoiceId}?success=payment`);
}

export async function updateInvoiceStatus(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const invoiceId = str(formData, "invoice_id");
  const status = str(formData, "status");
  if (!invoiceId || !status) redirect("/portal/admin/invoices?error=missing");
  const { data: invoice } = await db
    .from("invoices")
    .update({
      status,
      sent_at: status === "sent" ? new Date().toISOString() : undefined,
      internal_notes: str(formData, "internal_notes") || null,
    })
    .eq("id", invoiceId)
    .select("invoice_number, client_id")
    .single();
  if (!invoice) redirect("/portal/admin/invoices?error=save");
  await logAuditEvent({
    actor: admin,
    action: "invoice_status_updated",
    detail: `${invoice.invoice_number} set to ${status}`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  if (invoice.client_id && status === "sent") {
    await notifyUser({
      userId: invoice.client_id,
      title: "Invoice issued",
      body: `${invoice.invoice_number} is available in your billing portal.`,
      type: "invoice_issued",
      entityType: "invoice",
      entityId: invoiceId,
    });
  }
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoiceId}?success=status`);
}
