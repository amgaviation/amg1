"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { actor, safeRedirectPath, str } from "@/app/portal/actions/_helpers";
import { logAuditEvent, notifyAdmins, notifyUser } from "@/lib/portal/audit";
import {
  contractorMayReferenceMission,
  vendorInvoiceEditable,
  VENDOR_INVOICE_STATUS_LABEL,
} from "@/lib/portal/vendor-invoices";

/**
 * Contractor invoicing actions. Crew and partners submit invoices to AMG;
 * admins review, request changes, approve/reject, and mark them paid.
 * Receipt files live in the private "documents" bucket under
 * vendor-receipts/<uploader>/ and are streamed by an authenticated route.
 */

const MAX_TOTAL = 9_999_999_999.99;
const MAX_RECEIPT_BYTES = 25 * 1024 * 1024;
const RECEIPT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/heic", "image/webp"]);
const MAX_LINES = 40;

function money(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(/[$,]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > MAX_TOTAL) return null;
  return Math.round(n * 100) / 100;
}

function newRef() {
  return `VIN-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, "0")}`;
}

type ParsedLine = { description: string; quantity: number; unit_amount: number; amount: number; position: number };

function parseLines(formData: FormData): ParsedLine[] | null {
  const descriptions = formData.getAll("line_description").map(String);
  const quantities = formData.getAll("line_quantity").map(String);
  const unitAmounts = formData.getAll("line_unit_amount").map(String);
  const lines: ParsedLine[] = [];
  for (let i = 0; i < Math.min(descriptions.length, MAX_LINES); i++) {
    const description = descriptions[i]?.trim();
    if (!description) continue;
    const quantityRaw = Number((quantities[i] ?? "1").replace(/,/g, ""));
    const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 && quantityRaw <= 100000 ? Math.round(quantityRaw * 100) / 100 : 1;
    const unit = money(unitAmounts[i] ?? "");
    if (unit === null) return null;
    const amount = Math.round(quantity * unit * 100) / 100;
    if (amount > MAX_TOTAL) return null;
    lines.push({ description: description.slice(0, 500), quantity, unit_amount: unit, amount, position: lines.length });
  }
  return lines.length ? lines : null;
}

async function uploadReceiptFiles(
  db: Awaited<ReturnType<typeof createServiceClient>>,
  files: File[],
  uploaderId: string,
  backTo: string
): Promise<{ storage_path: string; file_name: string; file_size: number; mime_type: string | null }[]> {
  const uploaded: { storage_path: string; file_name: string; file_size: number; mime_type: string | null }[] = [];
  for (const file of files) {
    if (file.size > MAX_RECEIPT_BYTES || (file.type && !RECEIPT_TYPES.has(file.type))) {
      redirect(`${backTo}?error=receipt-file`);
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const path = `vendor-receipts/${uploaderId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error } = await db.storage
      .from("documents")
      .upload(path, file, { contentType: file.type || undefined });
    if (error) redirect(`${backTo}?error=receipt-upload`);
    uploaded.push({ storage_path: path, file_name: file.name.slice(-160), file_size: file.size, mime_type: file.type || null });
  }
  return uploaded;
}

function receiptFiles(formData: FormData): File[] {
  return formData
    .getAll("receipts")
    .filter((f): f is File => f instanceof File && f.size > 0);
}

/** Shared field parsing for submit + update. */
function parseInvoiceFields(formData: FormData, backTo: string) {
  const billFromName = str(formData, "bill_from_name").trim();
  if (!billFromName) redirect(`${backTo}?error=bill-from`);
  const lines = parseLines(formData);
  if (!lines) redirect(`${backTo}?error=lines`);
  const subtotal = Math.round(lines!.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;
  if (subtotal <= 0 || subtotal > MAX_TOTAL) redirect(`${backTo}?error=lines`);
  const invoiceDate = str(formData, "invoice_date").trim() || null;
  const dueDate = str(formData, "due_date").trim() || null;
  return {
    lines: lines!,
    subtotal,
    core: {
      bill_from_name: billFromName.slice(0, 200),
      bill_from_company: str(formData, "bill_from_company").trim().slice(0, 200) || null,
      bill_from_email: str(formData, "bill_from_email").trim().slice(0, 200) || null,
      bill_from_phone: str(formData, "bill_from_phone").trim().slice(0, 50) || null,
      bill_from_address: str(formData, "bill_from_address").trim().slice(0, 500) || null,
      bill_from_tax_id: str(formData, "bill_from_tax_id").trim().slice(0, 60) || null,
      invoice_number: str(formData, "invoice_number").trim().slice(0, 60) || null,
      ...(invoiceDate ? { invoice_date: invoiceDate } : {}),
      due_date: dueDate,
      notes: str(formData, "notes").trim().slice(0, 2000) || null,
      payment_instructions: str(formData, "payment_instructions").trim().slice(0, 1000) || null,
      subtotal,
      total: subtotal,
    },
  };
}

export async function submitVendorInvoice(formData: FormData) {
  const user = await actor(["crew", "partner"]);
  const role = user.role as "crew" | "partner";
  const base = `/portal/${role}/invoices`;
  const backTo = safeRedirectPath(str(formData, "back_to"), `${base}/new`);
  const db = await createServiceClient();

  const missionId = str(formData, "mission_id").trim() || null;
  if (missionId && !(await contractorMayReferenceMission(user.id, role, missionId))) {
    redirect(`${backTo}?error=mission`);
  }

  const { lines, core } = parseInvoiceFields(formData, backTo);
  const files = receiptFiles(formData);
  const uploads = await uploadReceiptFiles(db, files, user.id, backTo);

  const { data: invoice, error } = await db
    .from("vendor_invoices")
    .insert({
      ref: newRef(),
      submitter_id: user.id,
      submitter_role: role,
      mission_id: missionId,
      status: "submitted",
      ...core,
    })
    .select("id, ref")
    .single();
  if (error || !invoice) redirect(`${backTo}?error=save`);

  const fail = async () => {
    await db.from("vendor_invoices").delete().eq("id", invoice!.id);
    redirect(`${backTo}?error=save`);
  };

  const { error: lineErr } = await db
    .from("vendor_invoice_lines")
    .insert(lines.map((line) => ({ ...line, invoice_id: invoice.id })));
  if (lineErr) await fail();

  if (uploads.length) {
    const { error: receiptErr } = await db.from("vendor_receipts").insert(
      uploads.map((upload) => ({
        ...upload,
        uploader_id: user.id,
        invoice_id: invoice.id,
        mission_id: missionId,
      }))
    );
    if (receiptErr) await fail();
  }

  await logAuditEvent({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "vendor_invoice_submitted",
    entityType: "vendor_invoice",
    entityId: invoice.id,
    detail: `${invoice.ref}: ${user.name} submitted an invoice for $${core.total.toFixed(2)}`,
  });
  await notifyAdmins({
    title: `Contractor invoice ${invoice.ref} submitted`,
    body: `${user.name}${core.bill_from_company ? ` (${core.bill_from_company})` : ""} submitted an invoice for $${core.total.toFixed(2)}. Review it in Vendor Invoices.`,
    type: "vendor_invoice_submitted",
    entityType: "vendor_invoice",
    entityId: invoice.id,
  });

  redirect(`${base}?success=submitted&record=${invoice.id}`);
}

export async function updateVendorInvoice(formData: FormData) {
  const user = await actor(["crew", "partner"]);
  const role = user.role as "crew" | "partner";
  const base = `/portal/${role}/invoices`;
  const invoiceId = str(formData, "invoice_id").trim();
  const backTo = safeRedirectPath(str(formData, "back_to"), `${base}/${invoiceId}/edit`);
  const db = await createServiceClient();

  const { data: existing } = await db
    .from("vendor_invoices")
    .select("id, ref, status, submitter_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!existing || existing.submitter_id !== user.id) redirect(`${base}?error=not-found`);
  if (!vendorInvoiceEditable(existing!.status)) redirect(`${base}?error=locked&record=${invoiceId}`);

  const missionId = str(formData, "mission_id").trim() || null;
  if (missionId && !(await contractorMayReferenceMission(user.id, role, missionId))) {
    redirect(`${backTo}?error=mission`);
  }

  const { lines, core } = parseInvoiceFields(formData, backTo);
  const files = receiptFiles(formData);
  const uploads = await uploadReceiptFiles(db, files, user.id, backTo);

  // Replace lines wholesale (small sets), guarded so a failed insert never
  // leaves the invoice lineless: on failure the old lines are restored.
  const { data: oldLines } = await db
    .from("vendor_invoice_lines")
    .select("description, quantity, unit_amount, amount, position")
    .eq("invoice_id", invoiceId);

  const { error: updateErr } = await db
    .from("vendor_invoices")
    .update({
      ...core,
      mission_id: missionId,
      status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);
  if (updateErr) redirect(`${backTo}?error=save`);

  await db.from("vendor_invoice_lines").delete().eq("invoice_id", invoiceId);
  const { error: lineErr } = await db
    .from("vendor_invoice_lines")
    .insert(lines.map((line) => ({ ...line, invoice_id: invoiceId })));
  if (lineErr) {
    if (oldLines?.length) {
      await db
        .from("vendor_invoice_lines")
        .insert(oldLines.map((line) => ({ ...line, invoice_id: invoiceId })));
    }
    redirect(`${backTo}?error=save`);
  }

  if (uploads.length) {
    await db.from("vendor_receipts").insert(
      uploads.map((upload) => ({
        ...upload,
        uploader_id: user.id,
        invoice_id: invoiceId,
        mission_id: missionId,
      }))
    );
  }

  await logAuditEvent({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "vendor_invoice_updated",
    entityType: "vendor_invoice",
    entityId: invoiceId,
    detail: `${existing!.ref}: resubmitted after edits (total $${core.total.toFixed(2)})`,
  });
  await notifyAdmins({
    title: `Contractor invoice ${existing!.ref} resubmitted`,
    body: `${user.name} updated and resubmitted invoice ${existing!.ref} (total $${core.total.toFixed(2)}).`,
    type: "vendor_invoice_updated",
    entityType: "vendor_invoice",
    entityId: invoiceId,
  });

  redirect(`${base}?success=updated&record=${invoiceId}`);
}

/** Standalone receipt upload from the crew/partner Receipts tab. */
export async function uploadVendorReceipt(formData: FormData) {
  const user = await actor(["crew", "partner"]);
  const role = user.role as "crew" | "partner";
  const base = `/portal/${role}/receipts`;
  const backTo = safeRedirectPath(str(formData, "back_to"), base);
  const db = await createServiceClient();

  const files = receiptFiles(formData);
  if (!files.length) redirect(`${backTo}?error=receipt-file`);

  const missionId = str(formData, "mission_id").trim() || null;
  if (missionId && !(await contractorMayReferenceMission(user.id, role, missionId))) {
    redirect(`${backTo}?error=mission`);
  }
  const invoiceId = str(formData, "invoice_id").trim() || null;
  if (invoiceId) {
    const { data: invoice } = await db
      .from("vendor_invoices")
      .select("id, submitter_id")
      .eq("id", invoiceId)
      .maybeSingle();
    if (!invoice || invoice.submitter_id !== user.id) redirect(`${backTo}?error=invoice`);
  }

  const amount = money(str(formData, "amount"));
  const uploads = await uploadReceiptFiles(db, files, user.id, backTo);
  const { error } = await db.from("vendor_receipts").insert(
    uploads.map((upload) => ({
      ...upload,
      uploader_id: user.id,
      invoice_id: invoiceId,
      mission_id: missionId,
      description: str(formData, "description").trim().slice(0, 500) || null,
      amount,
    }))
  );
  if (error) redirect(`${backTo}?error=save`);

  await logAuditEvent({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "vendor_receipt_uploaded",
    entityType: "vendor_receipt",
    detail: `${user.name} uploaded ${uploads.length} receipt${uploads.length === 1 ? "" : "s"}${missionId ? " (mission-linked)" : ""}`,
  });

  redirect(`${base}?success=uploaded`);
}

// ─── Admin review ────────────────────────────────────────────────────

const ADMIN_BASE = "/portal/admin/vendor-invoices";
const REVIEW_DECISIONS = new Set(["under_review", "needs_changes", "approved", "rejected", "void"]);

export async function reviewVendorInvoice(formData: FormData) {
  const user = await actor(["admin"], "invoices.edit");
  const invoiceId = str(formData, "invoice_id").trim();
  const decision = str(formData, "decision").trim();
  const reviewNotes = str(formData, "review_notes").trim().slice(0, 2000) || null;
  const backTo = safeRedirectPath(str(formData, "back_to"), `${ADMIN_BASE}?record=${invoiceId}`);
  if (!REVIEW_DECISIONS.has(decision)) redirect(`${backTo}&error=decision`);
  if ((decision === "needs_changes" || decision === "rejected") && !reviewNotes) {
    redirect(`${backTo}&error=notes-required`);
  }

  const db = await createServiceClient();
  const { data: invoice, error } = await db
    .from("vendor_invoices")
    .update({
      status: decision,
      review_notes: reviewNotes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .in("status", ["submitted", "under_review", "needs_changes", "approved"])
    .select("id, ref, submitter_id, total")
    .single();
  if (error || !invoice) redirect(`${backTo}&error=save`);

  await logAuditEvent({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "vendor_invoice_reviewed",
    entityType: "vendor_invoice",
    entityId: invoiceId,
    detail: `${invoice.ref}: ${VENDOR_INVOICE_STATUS_LABEL[decision] ?? decision}${reviewNotes ? ` — ${reviewNotes}` : ""}`,
  });
  await notifyUser({
    userId: invoice.submitter_id,
    title: `Invoice ${invoice.ref} ${VENDOR_INVOICE_STATUS_LABEL[decision]?.toLowerCase() ?? decision}`,
    body:
      decision === "needs_changes"
        ? `AMG requested changes to invoice ${invoice.ref}: ${reviewNotes}. Open your Invoices tab to edit and resubmit.`
        : decision === "rejected"
          ? `AMG rejected invoice ${invoice.ref}${reviewNotes ? `: ${reviewNotes}` : "."}`
          : `AMG marked invoice ${invoice.ref} ${VENDOR_INVOICE_STATUS_LABEL[decision]?.toLowerCase() ?? decision}.`,
    type: "vendor_invoice_reviewed",
    entityType: "vendor_invoice",
    entityId: invoiceId,
  });

  redirect(`${ADMIN_BASE}?success=reviewed&record=${invoiceId}`);
}

export async function markVendorInvoicePaid(formData: FormData) {
  const user = await actor(["admin"], "payments.add");
  const invoiceId = str(formData, "invoice_id").trim();
  const paymentReference = str(formData, "payment_reference").trim().slice(0, 200) || null;
  const backTo = safeRedirectPath(str(formData, "back_to"), `${ADMIN_BASE}?record=${invoiceId}`);

  const db = await createServiceClient();
  const { data: invoice, error } = await db
    .from("vendor_invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_reference: paymentReference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId)
    .eq("status", "approved")
    .select("id, ref, submitter_id, total")
    .single();
  if (error || !invoice) redirect(`${backTo}&error=not-approved`);

  await logAuditEvent({
    actor: { id: user.id, email: user.email, role: user.role },
    action: "vendor_invoice_paid",
    entityType: "vendor_invoice",
    entityId: invoiceId,
    detail: `${invoice.ref}: marked paid ($${Number(invoice.total).toFixed(2)})${paymentReference ? ` — ref ${paymentReference}` : ""}`,
  });
  await notifyUser({
    userId: invoice.submitter_id,
    title: `Invoice ${invoice.ref} paid`,
    body: `AMG marked invoice ${invoice.ref} as paid${paymentReference ? ` (reference ${paymentReference})` : ""}.`,
    type: "vendor_invoice_paid",
    entityType: "vendor_invoice",
    entityId: invoiceId,
  });

  redirect(`${ADMIN_BASE}?success=paid&record=${invoiceId}`);
}
