import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import {
  combinedPaymentInstructions,
  getBillingSettings,
  type BillingSettings,
} from "@/lib/portal/billing-config";
import { nextBillingDocumentNumber, type BillingDocumentType } from "@/lib/portal/billing-numbering";
import { renderBillingPdf, type BillingPdfInput } from "@/lib/portal/billing-pdfs";

const BUCKET = "billing-documents";

export type BillingDocumentRow = {
  id: string;
  document_type: BillingDocumentType;
  document_number: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  quote_id: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  client_id: string | null;
  emailed_to: string[];
  emailed_at: string | null;
  created_at: string;
};

export type StoredBillingPdf = {
  document: BillingDocumentRow;
  buffer: Buffer;
  filename: string;
};

function dollars(value: unknown) {
  return Number(value ?? 0);
}

function fileName(type: BillingDocumentType, number: string) {
  return `${number}-${type}.pdf`.replace(/[^a-z0-9_.-]/gi, "_");
}

function storagePath(type: BillingDocumentType, clientId: string | null, number: string) {
  const owner = clientId ?? "unassigned";
  return `${type}s/${owner}/${fileName(type, number)}`;
}

function clientName(client: any) {
  return client?.company_name ?? client?.full_name ?? client?.email ?? null;
}

function lineItems(items: any[] = []) {
  return items.map((item) => ({
    category: item.category,
    description: item.description,
    quantity: dollars(item.quantity) || 1,
    unit_price: dollars(item.unit_price),
    amount: dollars(item.amount),
    notes: item.notes ?? null,
  }));
}

async function insertDocumentRecord(input: {
  type: BillingDocumentType;
  documentNumber: string;
  buffer: Buffer;
  quoteId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  clientId?: string | null;
  actorId?: string | null;
}): Promise<BillingDocumentRow> {
  const db = (await createServiceClient()) as any;
  const filename = fileName(input.type, input.documentNumber);
  const path = storagePath(input.type, input.clientId ?? null, input.documentNumber);

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(path, input.buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error } = await db
    .from("billing_documents")
    .insert({
      document_type: input.type,
      document_number: input.documentNumber,
      storage_bucket: BUCKET,
      storage_path: path,
      file_name: filename,
      file_size: input.buffer.length,
      quote_id: input.quoteId ?? null,
      invoice_id: input.invoiceId ?? null,
      payment_id: input.paymentId ?? null,
      client_id: input.clientId ?? null,
      generated_by: input.actorId ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to store billing document record");
  }

  return data;
}

function settingsTerms(settings: BillingSettings, kind: BillingDocumentType) {
  if (kind === "quote") return settings.quote_terms;
  if (kind === "invoice") return settings.invoice_terms;
  return null;
}

function settingsDisclaimer(settings: BillingSettings, kind: BillingDocumentType) {
  if (kind === "quote") return settings.quote_disclaimer;
  if (kind === "invoice") return settings.invoice_disclaimer;
  return settings.receipt_disclaimer;
}

export async function buildQuotePdfInput(quoteId: string): Promise<BillingPdfInput> {
  const db = (await createServiceClient()) as any;
  const settings = await getBillingSettings();
  const { data: quote, error } = await db
    .from("quotes")
    .select("*, client:client_id(full_name,email,company_name), mission:mission_id(id,ref)")
    .eq("id", quoteId)
    .maybeSingle();
  if (error || !quote) throw new Error(error?.message ?? "Quote not found");

  const { data: items } = await db
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order");

  return {
    kind: "quote",
    documentNumber: quote.quote_number ?? quote.ref,
    status: quote.status,
    issuedAt: quote.sent_at ?? quote.created_at,
    dueDate: quote.expires_at,
    missionRef: quote.mission?.ref ?? null,
    clientName: clientName(quote.client),
    clientEmail: quote.client?.email ?? null,
    settings,
    lineItems: lineItems(items),
    subtotal: dollars(quote.subtotal),
    discountTotal: dollars(quote.discount_total),
    taxTotal: dollars(quote.tax_total),
    depositAmount: dollars(quote.deposit_amount),
    total: dollars(quote.total),
    terms: quote.payment_terms ?? settingsTerms(settings, "quote"),
    paymentInstructions: quote.payment_instructions ?? combinedPaymentInstructions(settings),
    disclaimer: settingsDisclaimer(settings, "quote"),
  };
}

export async function generateAndStoreQuotePdf(
  quoteId: string,
  actorId?: string | null,
): Promise<StoredBillingPdf> {
  const db = (await createServiceClient()) as any;
  const { data: quote } = await db
    .from("quotes")
    .select("id, ref, quote_number, client_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) throw new Error("Quote not found");

  const documentNumber = quote.quote_number ?? quote.ref ?? (await nextBillingDocumentNumber("quote"));
  if (!quote.quote_number) {
    await db.from("quotes").update({ quote_number: documentNumber, ref: documentNumber }).eq("id", quoteId);
  }

  const input = await buildQuotePdfInput(quoteId);
  input.documentNumber = documentNumber;
  const buffer = await renderBillingPdf(input);
  const document = await insertDocumentRecord({
    type: "quote",
    documentNumber,
    buffer,
    quoteId,
    clientId: quote.client_id,
    actorId,
  });
  await db.from("quotes").update({ pdf_document_id: document.id }).eq("id", quoteId);
  return { document, buffer, filename: document.file_name };
}

export async function buildInvoicePdfInput(invoiceId: string): Promise<BillingPdfInput> {
  const db = (await createServiceClient()) as any;
  const settings = await getBillingSettings();
  const { data: invoice, error } = await db
    .from("invoices")
    .select(
      "*, client:client_id(full_name,email,company_name), mission:mission_id(id,ref), quote:quote_id(ref,quote_number)",
    )
    .eq("id", invoiceId)
    .maybeSingle();
  if (error || !invoice) throw new Error(error?.message ?? "Invoice not found");

  const { data: items } = await db
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order");

  return {
    kind: "invoice",
    documentNumber: invoice.invoice_number,
    status: invoice.status,
    issuedAt: invoice.issued_at ?? invoice.created_at,
    dueDate: invoice.due_date,
    missionRef: invoice.mission?.ref ?? null,
    quoteRef: invoice.quote?.quote_number ?? invoice.quote?.ref ?? null,
    clientName: clientName(invoice.client),
    clientEmail: invoice.client?.email ?? null,
    settings,
    lineItems: lineItems(items),
    subtotal: dollars(invoice.subtotal),
    discountTotal: dollars(invoice.discount_total ?? invoice.discount),
    taxTotal: dollars(invoice.tax_total ?? invoice.tax),
    depositAmount: dollars(invoice.deposit_amount),
    amountPaid: dollars(invoice.amount_paid),
    amountDue: dollars(invoice.amount_due),
    total: dollars(invoice.total),
    terms: invoice.terms ?? settingsTerms(settings, "invoice"),
    paymentInstructions: invoice.payment_instructions ?? combinedPaymentInstructions(settings),
    disclaimer: settingsDisclaimer(settings, "invoice"),
  };
}

export async function generateAndStoreInvoicePdf(
  invoiceId: string,
  actorId?: string | null,
): Promise<StoredBillingPdf> {
  const db = (await createServiceClient()) as any;
  const { data: invoice } = await db
    .from("invoices")
    .select("id, invoice_number, client_id")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) throw new Error("Invoice not found");

  let documentNumber = invoice.invoice_number;
  if (!documentNumber || /^INV-/.test(documentNumber)) {
    documentNumber = await nextBillingDocumentNumber("invoice");
    await db.from("invoices").update({ invoice_number: documentNumber }).eq("id", invoiceId);
  }

  const input = await buildInvoicePdfInput(invoiceId);
  input.documentNumber = documentNumber;
  const buffer = await renderBillingPdf(input);
  const document = await insertDocumentRecord({
    type: "invoice",
    documentNumber,
    buffer,
    invoiceId,
    clientId: invoice.client_id,
    actorId,
  });
  await db.from("invoices").update({ pdf_document_id: document.id }).eq("id", invoiceId);
  return { document, buffer, filename: document.file_name };
}

export async function buildReceiptPdfInput(paymentId: string): Promise<BillingPdfInput> {
  const db = (await createServiceClient()) as any;
  const settings = await getBillingSettings();
  const { data: payment, error } = await db
    .from("payments")
    .select(
      "*, invoice:invoice_id(*, client:client_id(full_name,email,company_name), mission:mission_id(id,ref), quote:quote_id(ref,quote_number))",
    )
    .eq("id", paymentId)
    .maybeSingle();
  if (error || !payment?.invoice) throw new Error(error?.message ?? "Payment not found");

  const { data: items } = await db
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", payment.invoice_id)
    .order("sort_order");

  return {
    kind: "receipt",
    documentNumber: payment.receipt_number,
    status: payment.invoice.status,
    issuedAt: payment.paid_at ?? payment.created_at,
    missionRef: payment.invoice.mission?.ref ?? null,
    quoteRef: payment.invoice.quote?.quote_number ?? payment.invoice.quote?.ref ?? null,
    invoiceRef: payment.invoice.invoice_number,
    clientName: clientName(payment.invoice.client),
    clientEmail: payment.invoice.client?.email ?? null,
    settings,
    lineItems: lineItems(items),
    subtotal: dollars(payment.invoice.subtotal),
    discountTotal: dollars(payment.invoice.discount_total ?? payment.invoice.discount),
    taxTotal: dollars(payment.invoice.tax_total ?? payment.invoice.tax),
    amountPaid: dollars(payment.invoice.amount_paid),
    amountDue: dollars(payment.invoice.amount_due),
    total: dollars(payment.invoice.total),
    disclaimer: settingsDisclaimer(settings, "receipt"),
    payment: {
      amount: dollars(payment.amount),
      method: payment.payment_method,
      paidAt: payment.paid_at,
      reference: payment.payment_reference ?? payment.provider_payment_id,
    },
  };
}

export async function generateAndStoreReceiptPdf(
  paymentId: string,
  actorId?: string | null,
): Promise<StoredBillingPdf> {
  const db = (await createServiceClient()) as any;
  const { data: payment } = await db
    .from("payments")
    .select("id, invoice_id, receipt_number, invoice:invoice_id(client_id)")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) throw new Error("Payment not found");

  const documentNumber = payment.receipt_number ?? (await nextBillingDocumentNumber("receipt"));
  if (!payment.receipt_number) {
    await db.from("payments").update({ receipt_number: documentNumber }).eq("id", paymentId);
  }

  const input = await buildReceiptPdfInput(paymentId);
  input.documentNumber = documentNumber;
  const buffer = await renderBillingPdf(input);
  const document = await insertDocumentRecord({
    type: "receipt",
    documentNumber,
    buffer,
    invoiceId: payment.invoice_id,
    paymentId,
    clientId: payment.invoice?.client_id ?? null,
    actorId,
  });
  await db
    .from("payments")
    .update({ receipt_document_id: document.id })
    .eq("id", paymentId);
  return { document, buffer, filename: document.file_name };
}

export async function createInvoiceDraftFromQuote(input: {
  quoteId: string;
  actorId: string;
  status?: "draft" | "sent";
  dueDate?: string | null;
  terms?: string | null;
}) {
  const db = (await createServiceClient()) as any;
  const settings = await getBillingSettings();
  const { data: quote } = await db
    .from("quotes")
    .select("*, mission:mission_id(aircraft_id)")
    .eq("id", input.quoteId)
    .maybeSingle();
  if (!quote) throw new Error("Quote not found");

  const { data: existing } = await db
    .from("invoices")
    .select("id")
    .eq("quote_id", input.quoteId)
    .neq("status", "void")
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: quoteItems } = await db
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", input.quoteId)
    .order("sort_order");

  const invoiceNumber = await nextBillingDocumentNumber("invoice");
  const subtotal = dollars(quote.subtotal);
  const discountTotal = dollars(quote.discount_total);
  const taxTotal = dollars(quote.tax_total);
  const total = dollars(quote.total);
  const depositAmount = dollars(quote.deposit_amount);
  const amountDue = input.status === "sent" && depositAmount > 0 ? depositAmount : total;

  const { data: invoice, error } = await db
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      quote_id: quote.id,
      mission_id: quote.mission_id,
      aircraft_id: quote.mission?.aircraft_id ?? null,
      client_id: quote.client_id,
      status: input.status ?? "draft",
      subtotal,
      discount: discountTotal,
      discount_total: discountTotal,
      tax: taxTotal,
      tax_total: taxTotal,
      total,
      amount_due: amountDue,
      issued_at: new Date().toISOString(),
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
      due_date: input.dueDate ?? null,
      terms: input.terms ?? settings.invoice_terms,
      client_notes: quote.client_notes,
      payment_instructions: quote.payment_instructions ?? combinedPaymentInstructions(settings),
      deposit_required: Boolean(quote.deposit_required),
      deposit_amount: depositAmount,
      created_by: input.actorId,
    })
    .select("id")
    .single();
  if (error || !invoice) throw new Error(error?.message ?? "Unable to create invoice");

  if (quoteItems?.length) {
    await db.from("invoice_line_items").insert(
      quoteItems.map((item: any) => ({
        invoice_id: invoice.id,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        notes: item.notes ?? null,
        item_code: item.item_code ?? null,
        service_date: item.service_date ?? null,
        sort_order: item.sort_order,
      })),
    );
  }

  await db
    .from("quotes")
    .update({ converted_invoice_id: invoice.id })
    .eq("id", quote.id);

  return invoice.id as string;
}

export async function markBillingDocumentEmailed(id: string, recipients: string[]) {
  const db = (await createServiceClient()) as any;
  await db
    .from("billing_documents")
    .update({ emailed_to: recipients, emailed_at: new Date().toISOString() })
    .eq("id", id);
}
