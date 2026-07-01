"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyAdmins, notifyUser } from "@/lib/portal/audit";
import { ACKNOWLEDGMENT_TEXT, COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import { notifyMissionContactByEmail } from "@/lib/portal/mission-client-notifications";
import { combinedPaymentInstructions, getBillingSettings } from "@/lib/portal/billing-config";
import { createInvoiceDraftFromQuote, generateAndStoreQuotePdf } from "@/lib/portal/billing-documents";
import { emailInvoicePdf, emailQuotePdf } from "@/lib/portal/billing-emails";
import { nextBillingDocumentNumber } from "@/lib/portal/billing-numbering";
import { actor, bool, num, str } from "./_helpers";

function splitEmails(value: string) {
  return value
    .split(/[,;\n]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function quoteItemsFromForm(formData: FormData) {
  const categories = formData.getAll("category[]").map((v) => String(v).trim());
  const descriptions = formData.getAll("description[]").map((v) => String(v).trim());
  const quantities = formData.getAll("quantity[]").map((v) => Number(v) || 0);
  const unitPrices = formData.getAll("unit_price[]").map((v) => Number(v) || 0);
  const units = formData.getAll("unit[]").map((v) => String(v).trim());
  const costTypes = formData.getAll("cost_type[]").map((v) => String(v).trim());
  const clientNotes = formData.getAll("client_notes[]").map((v) => String(v).trim());
  const internalNotes = formData.getAll("internal_notes[]").map((v) => String(v).trim());

  return categories
    .map((category, i) => ({
      category,
      description: descriptions[i] || null,
      quantity: quantities[i] || 1,
      unit: units[i] || null,
      unit_price: unitPrices[i] || 0,
      amount: (quantities[i] || 1) * (unitPrices[i] || 0),
      cost_type: costTypes[i] || null,
      client_visible: formData.get(`client_visible_${i}`) !== "false",
      billable: formData.get(`billable_${i}`) !== "false",
      included_in_total: formData.get(`included_in_total_${i}`) !== "false",
      taxable: formData.get(`taxable_${i}`) === "true",
      client_notes: clientNotes[i] || null,
      internal_notes: internalNotes[i] || null,
      sort_order: i,
    }))
    .filter((it) => it.category && it.amount >= 0);
}

function quoteTotals(formData: FormData, items: { amount: number; billable?: boolean; included_in_total?: boolean }[]) {
  const subtotal = items
    .filter((item) => item.billable !== false && item.included_in_total !== false)
    .reduce((sum, it) => sum + it.amount, 0);
  const discountTotal = num(formData, "discount_total") ?? 0;
  const taxTotal = num(formData, "tax_total") ?? 0;
  return {
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal: Math.max(subtotal - discountTotal + taxTotal, 0),
  };
}

function quotePayload(formData: FormData, settings: Awaited<ReturnType<typeof getBillingSettings>>) {
  const depositAmount = num(formData, "deposit_amount") ?? 0;
  return {
    manual_client_name: str(formData, "manual_client_name") || null,
    manual_client_company: str(formData, "manual_client_company") || null,
    manual_client_email: str(formData, "manual_client_email") || null,
    manual_client_phone: str(formData, "manual_client_phone") || null,
    recipient_email: str(formData, "recipient_email") || str(formData, "manual_client_email") || null,
    cc_emails: splitEmails(str(formData, "cc_emails")),
    billing_contact_name: str(formData, "billing_contact_name") || null,
    billing_contact_company: str(formData, "billing_contact_company") || str(formData, "manual_client_company") || null,
    billing_contact_phone: str(formData, "billing_contact_phone") || str(formData, "manual_client_phone") || null,
    aircraft_summary: str(formData, "aircraft_summary") || null,
    tail_number: str(formData, "tail_number") || null,
    route_summary: str(formData, "route_summary") || null,
    service_scope: str(formData, "service_scope") || null,
    requested_timing: str(formData, "requested_timing") || null,
    deposit_required: bool(formData, "deposit_required") || depositAmount > 0,
    deposit_amount: depositAmount,
    deposit_percent: num(formData, "deposit_percent"),
    deposit_due_date: str(formData, "deposit_due_date") || null,
    balance_due_timing: str(formData, "balance_due_timing") || null,
    deposit_terms: str(formData, "deposit_terms") || null,
    payment_terms: str(formData, "payment_terms") || settings.quote_terms,
    payment_instructions: str(formData, "payment_instructions") || combinedPaymentInstructions(settings),
    expires_at: str(formData, "expires_at") || null,
    client_notes: str(formData, "client_notes") || null,
    internal_notes: str(formData, "internal_notes") || null,
    pdf_template: str(formData, "pdf_template") || "standard",
    opening_note: str(formData, "opening_note") || null,
    closing_note: str(formData, "closing_note") || null,
    footer_note: str(formData, "footer_note") || null,
    show_aircraft_block: formData.get("show_aircraft_block") !== "false",
    show_mission_block: formData.get("show_mission_block") !== "false",
    show_route_block: formData.get("show_route_block") !== "false",
    show_deposit_block: formData.get("show_deposit_block") !== "false",
    show_tax_line: bool(formData, "show_tax_line"),
    group_line_items_by_category: bool(formData, "group_line_items_by_category"),
    show_line_item_details: formData.get("show_line_item_details") !== "false",
  };
}

export async function createQuote(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const missionId = str(formData, "mission_id") || null;

  const { data: mission } = missionId
    ? await db
        .from("missions")
        .select("ref, client_id")
        .eq("id", missionId)
        .maybeSingle()
    : { data: null };

  const items = quoteItemsFromForm(formData);

  const settings = await getBillingSettings();
  const totals = quoteTotals(formData, items);
  const quoteNumber = await nextBillingDocumentNumber("quote");
  const sendNow = str(formData, "intent") !== "draft";
  const payload = quotePayload(formData, settings);
  const clientId = str(formData, "client_id") || mission?.client_id || null;

  const { data: quote } = await billingDb
    .from("quotes")
    .insert({
      ref: quoteNumber,
      quote_number: quoteNumber,
      mission_id: missionId,
      client_id: clientId,
      status: sendNow ? "sent" : "draft",
      subtotal: totals.subtotal,
      discount_total: totals.discountTotal,
      tax_total: totals.taxTotal,
      total: totals.grandTotal,
      sent_at: sendNow ? new Date().toISOString() : null,
      created_by: admin.id,
      ...payload,
    })
    .select("id, ref")
    .single();

  if (quote && items.length) {
    await billingDb
      .from("quote_line_items")
      .insert(items.map((it) => ({ ...it, quote_id: quote.id })));
  }
  if (missionId) {
    await db.from("missions").update({ status: "quoted" }).eq("id", missionId);
  }

  await logAuditEvent({
    actor: admin,
    action: "quote_created",
    detail: `Created ${quote?.ref ?? "quote"} ($${totals.grandTotal})`,
    entityType: "quote",
    entityId: quote?.id ?? null,
  });
  if (sendNow && quote) {
    await emailQuotePdf(quote.id, admin.id).catch((error) => {
      console.error("[billing] failed to email quote PDF", quote.id, error);
    });
  }
  if (clientId && sendNow) {
    await notifyUser({
      userId: clientId,
      title: "Quote ready",
      body: `${quote?.ref ?? "A quote"} is ready for your review.`,
      type: "quote_sent",
      entityType: "quote",
      entityId: quote?.id ?? null,
    });
  }
  if (quote && sendNow && missionId) {
    await notifyMissionContactByEmail({
      missionId,
      title: "Quote ready for review",
      eventLabel: "Quote Sent",
      subject: `AMG Aviation Group quote ${quote.ref} is ready`,
      intro:
        "AMG Aviation Group has prepared a quote for your request. Please review the quote details and contact AMG Operations with any questions or required changes.",
      details: [
        { label: "Quote Reference", value: quote.ref },
        { label: "Quote Total", value: `$${totals.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      ],
    });
  }
  if (missionId) revalidatePath(`/portal/admin/trips/${missionId}`);
  revalidatePath("/portal/admin/quotes");
  redirect(sendNow ? `/portal/admin/quotes/${quote?.id}?success=sent` : `/portal/admin/quotes/${quote?.id}?success=draft`);
}

export async function updateQuoteDraft(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const quoteId = str(formData, "quote_id");
  if (!quoteId) redirect("/portal/admin/quotes?error=missing");

  const { data: quote } = await db.from("quotes").select("id, status").eq("id", quoteId).maybeSingle();
  if (!quote) redirect("/portal/admin/quotes?error=missing");
  if (!["draft", "internal_review"].includes(quote.status)) redirect(`/portal/admin/quotes/${quoteId}?error=locked`);

  const settings = await getBillingSettings();
  const items = quoteItemsFromForm(formData);
  const totals = quoteTotals(formData, items);
  await billingDb
    .from("quotes")
    .update({
      ...quotePayload(formData, settings),
      client_id: str(formData, "client_id") || null,
      mission_id: str(formData, "mission_id") || null,
      subtotal: totals.subtotal,
      discount_total: totals.discountTotal,
      tax_total: totals.taxTotal,
      total: totals.grandTotal,
    })
    .eq("id", quoteId);
  await db.from("quote_line_items").delete().eq("quote_id", quoteId);
  if (items.length) {
    await billingDb.from("quote_line_items").insert(items.map((it) => ({ ...it, quote_id: quoteId })));
  }
  await logAuditEvent({
    actor: admin,
    action: "quote_draft_updated",
    detail: `Updated quote draft ${quoteId}`,
    entityType: "quote",
    entityId: quoteId,
  });
  revalidatePath(`/portal/admin/quotes/${quoteId}`);
  redirect(`/portal/admin/quotes/${quoteId}?success=saved`);
}

export async function createQuoteRevision(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const quoteId = str(formData, "quote_id");
  if (!quoteId) redirect("/portal/admin/quotes?error=missing");

  const { data: quote } = await billingDb.from("quotes").select("*").eq("id", quoteId).maybeSingle();
  if (!quote) redirect("/portal/admin/quotes?error=missing");
  if (quote.status === "void") redirect(`/portal/admin/quotes/${quoteId}?error=locked`);

  const { data: items } = await billingDb
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order");
  const quoteNumber = await nextBillingDocumentNumber("quote");
  const {
    id: _id,
    ref: _ref,
    quote_number: _quoteNumber,
    status: _status,
    created_at: _createdAt,
    updated_at: _updatedAt,
    sent_at: _sentAt,
    viewed_at: _viewedAt,
    approved_by: _approvedBy,
    approved_at: _approvedAt,
    rejected_by: _rejectedBy,
    rejected_at: _rejectedAt,
    converted_invoice_id: _convertedInvoiceId,
    superseded_by_quote_id: _supersededByQuoteId,
    pdf_document_id: _pdfDocumentId,
    ...copyable
  } = quote;

  const { data: revision, error } = await billingDb
    .from("quotes")
    .insert({
      ...copyable,
      ref: quoteNumber,
      quote_number: quoteNumber,
      status: "draft",
      created_by: admin.id,
      revised_from_quote_id: quote.id,
      superseded_by_quote_id: null,
      revision_reason: str(formData, "revision_reason") || "Revision created from admin portal",
      version_number: Number(quote.version_number ?? 1) + 1,
      sent_at: null,
      viewed_at: null,
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      converted_invoice_id: null,
      pdf_document_id: null,
    })
    .select("id, ref")
    .single();
  if (error || !revision) redirect(`/portal/admin/quotes/${quoteId}?error=revision`);

  if (items?.length) {
    await billingDb.from("quote_line_items").insert(
      items.map(({ id, quote_id, created_at, ...item }: any) => ({
        ...item,
        quote_id: revision.id,
      })),
    );
  }

  await billingDb
    .from("quotes")
    .update({ superseded_by_quote_id: revision.id, status: quote.status === "converted" ? "converted" : "void" })
    .eq("id", quoteId);

  await logAuditEvent({
    actor: admin,
    action: "quote_revision_created",
    detail: `Created ${revision.ref} from ${quote.ref}`,
    entityType: "quote",
    entityId: revision.id,
  });
  revalidatePath(`/portal/admin/quotes/${quoteId}`);
  revalidatePath(`/portal/admin/quotes/${revision.id}`);
  revalidatePath("/portal/admin/quotes");
  redirect(`/portal/admin/quotes/${revision.id}/edit?success=revision`);
}

export async function previewQuotePdf(formData: FormData) {
  const admin = await actor(["admin"]);
  const quoteId = str(formData, "quote_id");
  if (!quoteId) redirect("/portal/admin/quotes?error=missing");
  const pdf = await generateAndStoreQuotePdf(quoteId, admin.id);
  redirect(`/portal/billing-documents/${pdf.document.id}/view`);
}

export async function sendQuote(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const quoteId = str(formData, "quote_id");
  if (!quoteId) redirect("/portal/admin/quotes?error=missing");

  const { data: quote } = await db
    .from("quotes")
    .select("id, status, mission_id, client_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) redirect("/portal/admin/quotes?error=missing");
  if (["approved", "converted", "void"].includes(quote.status)) redirect(`/portal/admin/quotes/${quoteId}?error=locked`);

  await billingDb
    .from("quotes")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", quoteId);
  await emailQuotePdf(quoteId, admin.id).catch((error) => {
    console.error("[billing] failed to email quote PDF", quoteId, error);
  });
  if (quote.client_id) {
    await notifyUser({
      userId: quote.client_id,
      title: "Quote ready",
      body: "A quote is ready for your review.",
      type: "quote_sent",
      entityType: "quote",
      entityId: quoteId,
    });
  }
  revalidatePath(`/portal/admin/quotes/${quoteId}`);
  redirect(`/portal/admin/quotes/${quoteId}?success=sent`);
}

export async function convertApprovedQuoteToInvoice(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const quoteId = str(formData, "quote_id");
  if (!quoteId) redirect("/portal/admin/quotes?error=missing");
  const { data: quote } = await db.from("quotes").select("status").eq("id", quoteId).maybeSingle();
  if (!quote || quote.status !== "approved") redirect(`/portal/admin/quotes/${quoteId}?error=not-approved`);
  const invoiceId = await createInvoiceDraftFromQuote({ quoteId, actorId: admin.id, status: "draft" });
  await billingDb.from("quotes").update({ converted_invoice_id: invoiceId, status: "converted" }).eq("id", quoteId);
  redirect(`/portal/admin/invoices/${invoiceId}?success=created`);
}

export async function respondToQuote(formData: FormData) {
  const user = await actor(["client", "admin"]);
  const db = await createServiceClient();
  const billingDb = db as any;
  const quoteId = str(formData, "quote_id");
  const decision = str(formData, "decision"); // approved | rejected | revision_requested
  if (decision === "approved" && str(formData, "quote_terms_acknowledged") !== "accepted") {
    redirect(`/portal/client/quotes/${quoteId}?error=terms`);
  }

  const { data: quote } = await db
    .from("quotes")
    .select("ref, mission_id, client_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) redirect("/portal/client/quotes?error=notfound");
  if (user.role !== "admin" && quote.client_id !== user.id) {
    redirect("/portal/client/quotes?error=forbidden");
  }

  await billingDb
    .from("quotes")
    .update({
      status: decision === "approved" ? "approved" : decision === "revision_requested" ? "revision_requested" : "rejected",
      approved_by: decision === "approved" ? user.id : null,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
      rejected_by: decision !== "approved" ? user.id : null,
      rejected_at: decision !== "approved" ? new Date().toISOString() : null,
    })
    .eq("id", quoteId);

  let invoiceId: string | null = null;
  if (decision === "approved") {
    if (quote.mission_id) await db.from("missions").update({ status: "approved" }).eq("id", quote.mission_id);
    const settings = await getBillingSettings();
    invoiceId = await createInvoiceDraftFromQuote({
      quoteId,
      actorId: user.id,
      status: settings.auto_send_invoice_on_quote_approval ? "sent" : "draft",
    });
    if (settings.auto_send_invoice_on_quote_approval) {
      await emailInvoicePdf(invoiceId, user.id).catch((error) => {
        console.error("[billing] failed to email invoice PDF after quote approval", invoiceId, error);
      });
    }
  }

  await logAuditEvent({
    actor: user,
    action: decision === "approved" ? "quote_approved" : "quote_rejected",
    detail: `${decision} ${quote.ref}`,
    entityType: "quote",
    entityId: quoteId,
  });
  if (decision === "approved") {
    await recordComplianceEvidence({
      actor: user,
      audience: user.role,
      eventType: "quote_terms_acknowledged",
      eventArea: "quotes",
      relatedRecordType: "quote",
      relatedRecordId: quoteId,
      policyKey: POLICY_KEYS.quoteTerms,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      acknowledgmentText: ACKNOWLEDGMENT_TEXT.quoteApproval,
      metadata: { quoteRef: quote.ref, invoiceCreated: invoiceId },
    });
    await recordComplianceEvidence({
      actor: user,
      audience: user.role,
      eventType: "quote_approved",
      eventArea: "quotes",
      relatedRecordType: "quote",
      relatedRecordId: quoteId,
      policyVersion: COMPLIANCE_POLICY_VERSION,
      metadata: { quoteRef: quote.ref, invoiceCreated: invoiceId },
    });
  }
  await notifyAdmins({
    title: `Quote ${decision}`,
    body:
      decision === "approved" && invoiceId
        ? `${user.name} approved ${quote.ref}. Invoice draft created for review.`
        : `${user.name} ${decision} ${quote.ref}.`,
    type: "quote_response",
    entityType: "quote",
    entityId: quoteId,
  });

  revalidatePath("/portal/client/quotes");
  redirect(`/portal/client/quotes/${quoteId}?success=${decision}`);
}
