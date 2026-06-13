import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/portal/notification-delivery";
import {
  generateAndStoreInvoicePdf,
  generateAndStoreQuotePdf,
  generateAndStoreReceiptPdf,
  markBillingDocumentEmailed,
  type StoredBillingPdf,
} from "@/lib/portal/billing-documents";

function attachment(pdf: StoredBillingPdf) {
  return {
    filename: pdf.filename,
    content: pdf.buffer.toString("base64"),
    content_type: "application/pdf",
  };
}

async function clientEmailFor(table: "quotes" | "invoices", id: string) {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from(table)
    .select("client:client_id(email)")
    .eq("id", id)
    .maybeSingle();
  return data?.client?.email ? String(data.client.email) : null;
}

async function paymentClientEmail(paymentId: string) {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("payments")
    .select("invoice:invoice_id(client:client_id(email))")
    .eq("id", paymentId)
    .maybeSingle();
  return data?.invoice?.client?.email ? String(data.invoice.client.email) : null;
}

export async function emailQuotePdf(quoteId: string, actorId?: string | null) {
  const email = await clientEmailFor("quotes", quoteId);
  if (!email) return null;
  const pdf = await generateAndStoreQuotePdf(quoteId, actorId);
  const result = await sendEmail({
    to: email,
    subject: `AMG Aviation Group quote ${pdf.document.document_number}`,
    text: `Your AMG Aviation Group quote ${pdf.document.document_number} is attached for review.`,
    html: `<p>Your AMG Aviation Group quote <strong>${pdf.document.document_number}</strong> is attached for review.</p>`,
    attachments: [attachment(pdf)],
  });
  if (result.status === "sent") {
    await markBillingDocumentEmailed(pdf.document.id, [email]);
  }
  return { result, document: pdf.document };
}

export async function emailInvoicePdf(invoiceId: string, actorId?: string | null) {
  const email = await clientEmailFor("invoices", invoiceId);
  if (!email) return null;
  const pdf = await generateAndStoreInvoicePdf(invoiceId, actorId);
  const result = await sendEmail({
    to: email,
    subject: `AMG Aviation Group invoice ${pdf.document.document_number}`,
    text: `Your AMG Aviation Group invoice ${pdf.document.document_number} is attached.`,
    html: `<p>Your AMG Aviation Group invoice <strong>${pdf.document.document_number}</strong> is attached.</p>`,
    attachments: [attachment(pdf)],
  });
  if (result.status === "sent") {
    await markBillingDocumentEmailed(pdf.document.id, [email]);
  }
  return { result, document: pdf.document };
}

export async function emailReceiptPdf(paymentId: string, actorId?: string | null) {
  const email = await paymentClientEmail(paymentId);
  if (!email) return null;
  const pdf = await generateAndStoreReceiptPdf(paymentId, actorId);
  const result = await sendEmail({
    to: email,
    subject: `AMG Aviation Group receipt ${pdf.document.document_number}`,
    text: `Your AMG Aviation Group payment receipt ${pdf.document.document_number} is attached.`,
    html: `<p>Your AMG Aviation Group payment receipt <strong>${pdf.document.document_number}</strong> is attached.</p>`,
    attachments: [attachment(pdf)],
  });
  if (result.status === "sent") {
    const db = (await createServiceClient()) as any;
    await db
      .from("payments")
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq("id", paymentId);
    await markBillingDocumentEmailed(pdf.document.id, [email]);
  }
  return { result, document: pdf.document };
}
