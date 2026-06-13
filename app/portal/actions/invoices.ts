"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { combinedPaymentInstructions, getBillingSettings } from "@/lib/portal/billing-config";
import { createInvoiceDraftFromQuote, generateAndStoreInvoicePdf } from "@/lib/portal/billing-documents";
import { emailInvoicePdf, emailReceiptPdf } from "@/lib/portal/billing-emails";
import { nextBillingDocumentNumber } from "@/lib/portal/billing-numbering";
import { actor, bool, num, str } from "./_helpers";

function money(formData: FormData, key: string): number {
  return num(formData, key) ?? 0;
}

function invoiceItemsFromForm(formData: FormData) {
  const categories = formData.getAll("category[]").map((value) => String(value).trim());
  const descriptions = formData.getAll("description[]").map((value) => String(value).trim());
  const quantities = formData.getAll("quantity[]").map((value) => Number(value) || 1);
  const unitPrices = formData.getAll("unit_price[]").map((value) => Number(value) || 0);
  const units = formData.getAll("unit[]").map((value) => String(value).trim());
  const costTypes = formData.getAll("cost_type[]").map((value) => String(value).trim());
  const clientNotes = formData.getAll("client_notes[]").map((value) => String(value).trim());
  const internalNotes = formData.getAll("internal_notes[]").map((value) => String(value).trim());

  return categories
    .map((category, index) => ({
      category,
      description: descriptions[index] || null,
      quantity: quantities[index] || 1,
      unit: units[index] || null,
      unit_price: unitPrices[index] || 0,
      amount: (quantities[index] || 1) * (unitPrices[index] || 0),
      cost_type: costTypes[index] || null,
      client_notes: clientNotes[index] || null,
      internal_notes: internalNotes[index] || null,
      sort_order: index,
    }))
    .filter((item) => item.category);
}

export async function createInvoiceFromQuote(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const quoteId = str(formData, "quote_id");
  if (!quoteId) redirect("/portal/admin/invoices?error=missing");

  const { data: quote } = await db
    .from("quotes")
    .select("id, ref, client_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) redirect("/portal/admin/invoices?error=quote");

  const { data: existing } = await db
    .from("invoices")
    .select("id")
    .eq("quote_id", quoteId)
    .neq("status", "void")
    .maybeSingle();
  if (existing) redirect(`/portal/admin/invoices/${existing.id}?error=duplicate`);

  const invoiceId = await createInvoiceDraftFromQuote({
    quoteId,
    actorId: admin.id,
    status: str(formData, "intent") === "send" ? "sent" : "draft",
    dueDate: str(formData, "due_date") || null,
    terms: str(formData, "terms") || null,
  }).catch(() => null);
  if (!invoiceId) redirect("/portal/admin/invoices?error=save");

  const { data: invoice } = await db
    .from("invoices")
    .select("invoice_number")
    .eq("id", invoiceId)
    .maybeSingle();
  if (str(formData, "intent") === "send") {
    await emailInvoicePdf(invoiceId, admin.id).catch((error) => {
      console.error("[billing] failed to email invoice PDF", invoiceId, error);
    });
    await db.from("quotes").update({ status: "converted" }).eq("id", quote.id);
  }

  await logAuditEvent({
    actor: admin,
    action: "invoice_created_from_quote",
    detail: `Created ${invoice?.invoice_number ?? "invoice"} from ${quote.ref}`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  if (quote.client_id) {
    await notifyUser({
      userId: quote.client_id,
      title: str(formData, "intent") === "send" ? "Invoice issued" : "Invoice drafted",
      body:
        str(formData, "intent") === "send"
          ? `${invoice?.invoice_number ?? "An invoice"} is available in your billing portal.`
          : `${invoice?.invoice_number ?? "An invoice"} has been created for AMG review.`,
      type: "invoice_issued",
      entityType: "invoice",
      entityId: invoiceId,
    });
  }
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoiceId}?success=created`);
}

export async function createStandaloneInvoice(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const clientId = str(formData, "client_id");
  const items = invoiceItemsFromForm(formData);
  if (!clientId || !items.length) redirect("/portal/admin/invoices?error=missing");
  const amount = items.reduce((sum, item) => sum + item.amount, 0);
  const settings = await getBillingSettings();
  const discountTotal = money(formData, "discount_total");
  const taxTotal = money(formData, "tax_total");
  const total = Math.max(amount - discountTotal + taxTotal, 0);
  const invoiceNumber = await nextBillingDocumentNumber("invoice");
  const status = str(formData, "status") || "draft";

  const { data: invoice, error } = await billingDb
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      client_id: clientId,
      mission_id: str(formData, "mission_id") || null,
      aircraft_id: str(formData, "aircraft_id") || null,
      status,
      subtotal: amount,
      discount: discountTotal,
      discount_total: discountTotal,
      tax: taxTotal,
      tax_total: taxTotal,
      total,
      amount_due: total,
      due_date: str(formData, "due_date") || null,
      terms: str(formData, "terms") || settings.invoice_terms,
      payment_instructions: str(formData, "payment_instructions") || combinedPaymentInstructions(settings),
      client_notes: str(formData, "client_notes") || null,
      internal_notes: str(formData, "internal_notes") || null,
      created_by: admin.id,
      issued_at: new Date().toISOString(),
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .select("id, invoice_number")
    .single();
  if (error || !invoice) redirect("/portal/admin/invoices?error=save");

  await billingDb.from("invoice_line_items").insert(items.map((item) => ({ ...item, invoice_id: invoice.id })));
  await logAuditEvent({
    actor: admin,
    action: "invoice_created",
    detail: `Created ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: invoice.id,
  });
  if (status === "sent") {
    await emailInvoicePdf(invoice.id, admin.id).catch((error) => {
      console.error("[billing] failed to email standalone invoice PDF", invoice.id, error);
    });
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

export async function updateInvoiceDraft(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const invoiceId = str(formData, "invoice_id");
  const items = invoiceItemsFromForm(formData);
  if (!invoiceId || !items.length) redirect("/portal/admin/invoices?error=missing");

  const { data: invoice } = await db
    .from("invoices")
    .select("id, invoice_number, status, amount_paid, quote_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) redirect("/portal/admin/invoices?error=missing");
  if (!["draft", "ready_to_send"].includes(invoice.status)) {
    redirect(`/portal/admin/invoices/${invoiceId}?error=locked`);
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountTotal = money(formData, "discount_total");
  const taxTotal = money(formData, "tax_total");
  const total = Math.max(subtotal - discountTotal + taxTotal, 0);
  const amountPaid = Number(invoice.amount_paid ?? 0);
  const amountDue = Math.max(total - amountPaid, 0);

  const { error } = await billingDb
    .from("invoices")
    .update({
      status: str(formData, "status") || invoice.status,
      due_date: str(formData, "due_date") || null,
      subtotal,
      discount: discountTotal,
      discount_total: discountTotal,
      tax: taxTotal,
      tax_total: taxTotal,
      total,
      amount_due: amountDue,
      terms: str(formData, "terms") || null,
      payment_instructions: str(formData, "payment_instructions") || null,
      client_notes: str(formData, "client_notes") || null,
      internal_notes: str(formData, "internal_notes") || null,
      recipient_email: str(formData, "recipient_email") || null,
      cc_emails: formData
        .getAll("cc_emails")
        .flatMap((value) => String(value).split(","))
        .map((value) => value.trim())
        .filter(Boolean),
      pdf_template: str(formData, "pdf_template") || null,
      opening_note: str(formData, "opening_note") || null,
      closing_note: str(formData, "closing_note") || null,
      footer_note: str(formData, "footer_note") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
  if (error) redirect(`/portal/admin/invoices/${invoiceId}/edit?error=save`);

  await billingDb.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
  await billingDb.from("invoice_line_items").insert(items.map((item) => ({ ...item, invoice_id: invoiceId })));

  await logAuditEvent({
    actor: admin,
    action: "invoice_draft_updated",
    detail: `Updated draft ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoiceId}?success=updated`);
}

export async function previewInvoicePdf(formData: FormData) {
  const admin = await actor(["admin"]);
  const invoiceId = str(formData, "invoice_id");
  if (!invoiceId) redirect("/portal/admin/invoices?error=missing");
  const pdf = await generateAndStoreInvoicePdf(invoiceId, admin.id);
  redirect(`/api/portal/billing-documents/${pdf.document.id}/download`);
}

export async function sendInvoicePdf(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const invoiceId = str(formData, "invoice_id");
  if (!invoiceId) redirect("/portal/admin/invoices?error=missing");

  const { data: invoice } = await db
    .from("invoices")
    .select("id, invoice_number, status, client_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) redirect("/portal/admin/invoices?error=missing");
  if (["paid", "void", "written_off"].includes(invoice.status)) {
    redirect(`/portal/admin/invoices/${invoiceId}?error=locked`);
  }

  await billingDb
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", invoiceId);
  await emailInvoicePdf(invoiceId, admin.id).catch((error) => {
    console.error("[billing] failed to email invoice PDF", invoiceId, error);
  });
  await logAuditEvent({
    actor: admin,
    action: "invoice_pdf_sent",
    detail: `Sent ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  if (invoice.client_id) {
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
  redirect(`/portal/admin/invoices/${invoiceId}?success=sent`);
}

export async function recordInvoicePayment(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const invoiceId = str(formData, "invoice_id");
  const amount = money(formData, "amount");
  if (!invoiceId || amount <= 0) redirect("/portal/admin/invoices?error=payment");

  const { data: invoice } = await db
    .from("invoices")
    .select("amount_paid, total, client_id, invoice_number, status")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) redirect("/portal/admin/invoices?error=missing");
  if (["paid", "void", "written_off"].includes(invoice.status)) {
    redirect(`/portal/admin/invoices/${invoiceId}?error=locked`);
  }
  const amountPaid = (invoice.amount_paid ?? 0) + amount;
  const total = invoice.total ?? 0;
  const status = amountPaid >= total ? "paid" : "partially_paid";
  const paidAt = status === "paid" ? new Date().toISOString() : null;

  const receiptNumber = await nextBillingDocumentNumber("receipt");
  const { data: payment, error: paymentError } = await billingDb.from("payments").insert({
    invoice_id: invoiceId,
    amount,
    payment_method: str(formData, "payment_method") || "manual",
    payment_reference: str(formData, "payment_reference") || null,
    receipt_number: receiptNumber,
    notes: str(formData, "notes") || null,
    internal_notes: str(formData, "internal_notes") || null,
    receipt_send_suppressed: !bool(formData, "send_receipt"),
    recorded_by: admin.id,
    status: "recorded",
  }).select("id").single();
  if (paymentError || !payment) redirect(`/portal/admin/invoices/${invoiceId}?error=payment`);
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
  if (bool(formData, "send_receipt")) {
    await emailReceiptPdf(payment.id, admin.id).catch((error) => {
      console.error("[billing] failed to email receipt PDF", payment.id, error);
    });
  }
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
  const billingDb = db as any;
  const invoiceId = str(formData, "invoice_id");
  const status = str(formData, "status");
  if (!invoiceId || !status) redirect("/portal/admin/invoices?error=missing");
  if (status === "paid") redirect(`/portal/admin/invoices/${invoiceId}?error=payment-required`);
  const { data: invoice } = await billingDb
    .from("invoices")
    .update({
      status,
      sent_at: status === "sent" ? new Date().toISOString() : undefined,
      internal_notes: str(formData, "internal_notes") || null,
    })
    .eq("id", invoiceId)
    .select("invoice_number, client_id, amount_paid, amount_due, total")
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
    await emailInvoicePdf(invoiceId, admin.id).catch((error) => {
      console.error("[billing] failed to email invoice PDF after status update", invoiceId, error);
    });
    await notifyUser({
      userId: invoice.client_id,
      title: "Invoice issued",
      body: `${invoice.invoice_number} is available in your billing portal.`,
      type: "invoice_issued",
      entityType: "invoice",
      entityId: invoiceId,
    });
  }
  if (invoice.client_id && status === "paid" && Number(invoice.amount_due ?? 0) > 0) {
    const amount = Number(invoice.amount_due ?? 0);
    const paidTotal = Number(invoice.amount_paid ?? 0) + amount;
    const receiptNumber = await nextBillingDocumentNumber("receipt");
    const { data: payment } = await billingDb
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        amount,
        payment_method: "manual",
        payment_reference: "Marked paid in admin portal",
        receipt_number: receiptNumber,
        notes: str(formData, "internal_notes") || null,
        recorded_by: admin.id,
        status: "recorded",
      })
      .select("id")
      .single();
    await billingDb
      .from("invoices")
      .update({
        amount_paid: paidTotal,
        amount_due: 0,
        paid_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);
    if (payment?.id) {
      await emailReceiptPdf(payment.id, admin.id).catch((error) => {
        console.error("[billing] failed to email paid-status receipt PDF", payment.id, error);
      });
    }
  }
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoiceId}?success=status`);
}

export async function addExpenseToInvoice(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const expenseId = str(formData, "expense_id");
  const invoiceId = str(formData, "invoice_id");
  if (!expenseId || !invoiceId) redirect("/portal/admin/expenses?error=missing");

  const { data: existing } = await db
    .from("invoice_line_items")
    .select("id")
    .eq("expense_id", expenseId)
    .maybeSingle();
  if (existing) redirect("/portal/admin/expenses?error=already_billed");

  const { data: expense } = await db
    .from("expenses")
    .select("id, amount, approved_amount, category, notes, merchant, mission_id, status, billable_to_client")
    .eq("id", expenseId)
    .maybeSingle();
  if (!expense || !["approved", "partially_approved"].includes(expense.status) || !expense.billable_to_client) {
    redirect("/portal/admin/expenses?error=not_billable");
  }

  const amount = expense.approved_amount ?? expense.amount;
  const { data: line, error } = await db
    .from("invoice_line_items")
    .insert({
      invoice_id: invoiceId,
      expense_id: expense.id,
      category: expense.category,
      description: [expense.merchant, expense.notes].filter(Boolean).join(" - ") || "Approved crew expense",
      quantity: 1,
      unit_price: amount,
      amount,
      sort_order: 100,
    })
    .select("id")
    .single();
  if (error || !line) redirect("/portal/admin/expenses?error=save");

  const { data: invoice } = await db
    .from("invoices")
    .select("subtotal, total, amount_paid")
    .eq("id", invoiceId)
    .maybeSingle();
  const subtotal = Number(invoice?.subtotal ?? 0) + amount;
  const total = Number(invoice?.total ?? 0) + amount;
  const amountPaid = Number(invoice?.amount_paid ?? 0);
  await db
    .from("invoices")
    .update({ subtotal, total, amount_due: Math.max(total - amountPaid, 0) })
    .eq("id", invoiceId);
  await db
    .from("expenses")
    .update({ status: "added_to_invoice", invoice_line_item_id: line.id })
    .eq("id", expenseId);

  await logAuditEvent({
    actor: admin,
    action: "expense_added_to_invoice",
    detail: `Added expense ${expenseId} to invoice ${invoiceId}`,
    entityType: "expense",
    entityId: expenseId,
  });
  revalidatePath("/portal/admin/expenses");
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  redirect(`/portal/admin/invoices/${invoiceId}?success=expense`);
}
