"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { combinedPaymentInstructions, getBillingSettings } from "@/lib/portal/billing-config";
import { createInvoiceDraftFromQuote, generateAndStoreInvoicePdf } from "@/lib/portal/billing-documents";
import { emailInvoicePdf, emailReceiptPdf } from "@/lib/portal/billing-emails";
import { nextBillingDocumentNumber } from "@/lib/portal/billing-numbering";
import { ACKNOWLEDGMENT_TEXT, COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import { detectProhibitedPaymentData } from "@/lib/compliance/payment-data-guard";
import { can, noAccessPath } from "@/lib/portal/permissions";
import { INVOICE_STATUS } from "@/lib/portal/constants";
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
  const admin = await actor(["admin"], "invoices.add");
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

  // Email-first send (mirrors sendInvoicePdf): create the invoice as a draft
  // even for intent=send, and only mark it "sent" — and the quote converted —
  // once the email provider actually accepts the message.
  const intent = str(formData, "intent");
  const invoiceId = await createInvoiceDraftFromQuote({
    quoteId,
    actorId: admin.id,
    status: "draft",
    dueDate: str(formData, "due_date") || null,
    terms: str(formData, "terms") || null,
  }).catch(() => null);
  if (!invoiceId) redirect("/portal/admin/invoices?error=save");

  const { data: invoice } = await db
    .from("invoices")
    .select("invoice_number")
    .eq("id", invoiceId)
    .maybeSingle();
  let emailFailed = false;
  if (intent === "send") {
    const outcome = await emailInvoicePdf(invoiceId, admin.id).catch((error) => {
      console.error("[billing] failed to email invoice PDF", invoiceId, error);
      return null;
    });
    if (outcome?.result?.status === "sent") {
      await (db as any)
        .from("invoices")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", invoiceId);
      await db.from("quotes").update({ status: "converted" }).eq("id", quote.id);
    } else {
      emailFailed = true;
    }
  }

  await logAuditEvent({
    actor: admin,
    action: "invoice_created_from_quote",
    detail: `Created ${invoice?.invoice_number ?? "invoice"} from ${quote.ref}${
      intent === "send" ? (emailFailed ? " (email failed; saved as draft)" : " and emailed it to the client") : ""
    }`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  if (quote.client_id && intent !== "send") {
    await notifyUser({
      userId: quote.client_id,
      title: "Invoice drafted",
      body: `${invoice?.invoice_number ?? "An invoice"} has been created for AMG review.`,
      type: "invoice_issued",
      entityType: "invoice",
      entityId: invoiceId,
    });
  }
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoiceId}?success=created${emailFailed ? "&email=failed" : ""}`);
}

export async function createStandaloneInvoice(formData: FormData) {
  const admin = await actor(["admin"], "invoices.add");
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
  // Validate against the invoice vocabulary and reject a client-supplied
  // "paid": payment state is recorded only through payment flows, never
  // fabricated at creation time.
  if (!INVOICE_STATUS.some((s) => s.value === status) || status === "paid") {
    redirect("/portal/admin/invoices?error=invalid-status");
  }
  // Email-first send (mirrors sendInvoicePdf): a "sent" request is inserted as
  // a draft and only promoted to "sent" once the email provider accepts it.
  const sendNow = status === "sent";

  const { data: invoice, error } = await billingDb
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      client_id: clientId,
      mission_id: str(formData, "mission_id") || null,
      aircraft_id: str(formData, "aircraft_id") || null,
      status: sendNow ? "draft" : status,
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
      sent_at: null,
    })
    .select("id, invoice_number")
    .single();
  if (error || !invoice) redirect("/portal/admin/invoices?error=save");

  const { error: lineError } = await billingDb
    .from("invoice_line_items")
    .insert(items.map((item) => ({ ...item, invoice_id: invoice.id })));
  if (lineError) {
    // Never leave a lineless invoice behind: undo the header insert
    // (mirrors submitVendorInvoice's compensation).
    await billingDb.from("invoices").delete().eq("id", invoice.id);
    redirect("/portal/admin/invoices?error=save");
  }

  let emailFailed = false;
  if (sendNow) {
    const outcome = await emailInvoicePdf(invoice.id, admin.id).catch((error) => {
      console.error("[billing] failed to email standalone invoice PDF", invoice.id, error);
      return null;
    });
    if (outcome?.result?.status === "sent") {
      await billingDb
        .from("invoices")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", invoice.id);
    } else {
      emailFailed = true;
    }
  }
  await logAuditEvent({
    actor: admin,
    action: "invoice_created",
    detail: `Created ${invoice.invoice_number}${
      sendNow ? (emailFailed ? " (email failed; saved as draft)" : " and emailed it to the client") : ""
    }`,
    entityType: "invoice",
    entityId: invoice.id,
  });
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoice.id}?success=created${emailFailed ? "&email=failed" : ""}`);
}

export async function updateInvoiceDraft(formData: FormData) {
  const admin = await actor(["admin"], "invoices.edit");
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

  // Replace lines wholesale, guarded so a failed insert never leaves the
  // invoice lineless: snapshot the old lines first and restore them if the
  // replacement insert fails (mirrors updateVendorInvoice). The restore
  // itself is best-effort — either way the admin sees ?error=save.
  const { data: oldLines } = await billingDb
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", invoiceId);

  const { error: deleteError } = await billingDb.from("invoice_line_items").delete().eq("invoice_id", invoiceId);
  if (deleteError) redirect(`/portal/admin/invoices/${invoiceId}/edit?error=save`);
  if (items.length) {
    const { error: insertError } = await billingDb
      .from("invoice_line_items")
      .insert(items.map((item) => ({ ...item, invoice_id: invoiceId })));
    if (insertError) {
      if (oldLines?.length) {
        await billingDb.from("invoice_line_items").insert(
          oldLines.map(({ id: _id, invoice_id: _invoiceId, created_at: _createdAt, ...line }: any) => ({
            ...line,
            invoice_id: invoiceId,
          })),
        );
      }
      redirect(`/portal/admin/invoices/${invoiceId}/edit?error=save`);
    }
  }

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

export async function createInvoiceRevision(formData: FormData) {
  const admin = await actor(["admin"], "invoices.add");
  const db = await createServiceClient();
  const billingDb = db as any;
  const invoiceId = str(formData, "invoice_id");
  if (!invoiceId) redirect("/portal/admin/invoices?error=missing");

  const { data: invoice } = await billingDb.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (!invoice) redirect("/portal/admin/invoices?error=missing");
  if (["paid", "void", "written_off"].includes(invoice.status)) {
    redirect(`/portal/admin/invoices/${invoiceId}?error=locked`);
  }

  const { data: items } = await billingDb
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order");
  const invoiceNumber = await nextBillingDocumentNumber("invoice");
  const {
    id: _id,
    invoice_number: _invoiceNumber,
    status: _status,
    created_at: _createdAt,
    updated_at: _updatedAt,
    sent_at: _sentAt,
    paid_at: _paidAt,
    superseded_by_invoice_id: _supersededByInvoiceId,
    pdf_document_id: _pdfDocumentId,
    amount_paid: _amountPaid,
    ...copyable
  } = invoice;

  const { data: revision, error } = await billingDb
    .from("invoices")
    .insert({
      ...copyable,
      invoice_number: invoiceNumber,
      status: "draft",
      created_by: admin.id,
      revised_from_invoice_id: invoice.id,
      superseded_by_invoice_id: null,
      revision_reason: str(formData, "revision_reason") || "Revision created from admin portal",
      version_number: Number(invoice.version_number ?? 1) + 1,
      sent_at: null,
      paid_at: null,
      pdf_document_id: null,
      amount_paid: 0,
      amount_due: invoice.total ?? 0,
    })
    .select("id, invoice_number")
    .single();
  if (error || !revision) redirect(`/portal/admin/invoices/${invoiceId}?error=revision`);

  if (items?.length) {
    await billingDb.from("invoice_line_items").insert(
      items.map(({ id, invoice_id, created_at, ...item }: any) => ({
        ...item,
        invoice_id: revision.id,
      })),
    );
  }

  await billingDb
    .from("invoices")
    .update({ superseded_by_invoice_id: revision.id, status: "void" })
    .eq("id", invoiceId);
  await logAuditEvent({
    actor: admin,
    action: "invoice_revision_created",
    detail: `Created ${revision.invoice_number} from ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: revision.id,
  });
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  revalidatePath(`/portal/admin/invoices/${revision.id}`);
  revalidatePath("/portal/admin/invoices");
  redirect(`/portal/admin/invoices/${revision.id}/edit?success=revision`);
}

export async function previewInvoicePdf(formData: FormData) {
  const admin = await actor(["admin"], "invoices.view");
  const invoiceId = str(formData, "invoice_id");
  if (!invoiceId) redirect("/portal/admin/invoices?error=missing");
  const pdf = await generateAndStoreInvoicePdf(invoiceId, admin.id);
  redirect(`/portal/billing-documents/${pdf.document.id}/view`);
}

export async function sendInvoicePdf(formData: FormData) {
  const admin = await actor(["admin"], "invoices.edit");
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

  // Send FIRST; only mark the invoice sent once the provider accepts the email.
  const outcome = await emailInvoicePdf(invoiceId, admin.id).catch((error) => {
    console.error("[billing] failed to email invoice PDF", invoiceId, error);
    return null;
  });
  if (!outcome || outcome.result.status !== "sent") {
    redirect(`/portal/admin/invoices/${invoiceId}?error=send-failed`);
  }
  await billingDb
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", invoiceId);
  await logAuditEvent({
    actor: admin,
    action: "invoice_pdf_sent",
    detail: `Sent ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoiceId}?success=sent`);
}

export async function recordInvoicePayment(formData: FormData) {
  const admin = await actor(["admin"], "payments.add");
  const db = await createServiceClient();
  const billingDb = db as any;
  const invoiceId = str(formData, "invoice_id");
  const amount = money(formData, "amount");
  if (!invoiceId || amount <= 0) redirect("/portal/admin/invoices?error=payment");
  const paymentFindings = detectProhibitedPaymentData({
    payment_method: str(formData, "payment_method"),
    payment_reference: str(formData, "payment_reference"),
    notes: str(formData, "notes"),
    internal_notes: str(formData, "internal_notes"),
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
      metadata: { action: "invoice_payment_blocked", fields: paymentFindings.map((finding) => finding.field) },
    });
    redirect(`/portal/admin/invoices/${invoiceId}?error=payment-data`);
  }

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
  // Optimistic concurrency: the rollup only applies if amount_paid is still the
  // value we read. If another payment (manual/Stripe/credit) landed first, zero
  // rows update — undo this payment row so amount_paid can't be double-counted,
  // and ask the admin to retry against the fresh balance.
  const rollup = db
    .from("invoices")
    .update({
      amount_paid: amountPaid,
      amount_due: Math.max(total - amountPaid, 0),
      status,
      paid_at: paidAt,
    })
    .eq("id", invoiceId);
  const { data: rolledUp, error: rollupError } = await (
    invoice.amount_paid == null ? rollup.is("amount_paid", null) : rollup.eq("amount_paid", invoice.amount_paid)
  )
    .select("id")
    .maybeSingle();
  if (rollupError || !rolledUp) {
    await billingDb.from("payments").delete().eq("id", payment.id);
    redirect(`/portal/admin/invoices/${invoiceId}?error=conflict`);
  }
  await logAuditEvent({
    actor: admin,
    action: "invoice_payment_recorded",
    detail: `Recorded payment ${amount} on ${invoice.invoice_number}`,
    entityType: "invoice",
    entityId: invoiceId,
  });
  await recordComplianceEvidence({
    actor: admin,
    audience: "admin",
    eventType: "payment_marked_paid",
    eventArea: "billing",
    relatedRecordType: "invoice",
    relatedRecordId: invoiceId,
    policyKey: POLICY_KEYS.noOnlinePayment,
    policyVersion: COMPLIANCE_POLICY_VERSION,
    acknowledgmentText: ACKNOWLEDGMENT_TEXT.noOnlinePayment,
    metadata: { amount, status, paymentId: payment.id },
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
  const admin = await actor(["admin"], "invoices.edit");
  const db = await createServiceClient();
  const billingDb = db as any;
  const invoiceId = str(formData, "invoice_id");
  const status = str(formData, "status");
  if (!invoiceId || !status) redirect("/portal/admin/invoices?error=missing");
  // A malformed submission must not persist a status no surface can render.
  if (!INVOICE_STATUS.some((s) => s.value === status)) {
    redirect(`/portal/admin/invoices/${invoiceId}?error=invalid-status`);
  }
  if (status === "paid") redirect(`/portal/admin/invoices/${invoiceId}?error=payment-required`);
  // Voiding / writing off / refunding a receivable is a payments-authority
  // action (separation of duties) on top of the invoices.edit base gate.
  if (["void", "written_off", "refunded"].includes(status) && !(await can(admin.role, "payments", "edit"))) {
    redirect(noAccessPath("payments", "edit"));
  }
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
  }
  // No mark-paid shortcut here: status === "paid" is rejected up front
  // (payment-required guard) — payments are recorded only through
  // recordInvoicePayment or the Stripe webhook, which both carry the full
  // audit + compliance trail.
  revalidatePath(`/portal/admin/invoices/${invoiceId}`);
  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/client/billing");
  redirect(`/portal/admin/invoices/${invoiceId}?success=status`);
}

export async function addExpenseToInvoice(formData: FormData) {
  const admin = await actor(["admin"], "invoices.edit");
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
