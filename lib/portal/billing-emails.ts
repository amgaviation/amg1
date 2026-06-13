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

function splitCc(value?: string[] | null) {
  return (value ?? []).filter(Boolean);
}

async function clientEmailFor(table: "quotes" | "invoices", id: string) {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from(table)
    .select("recipient_email, manual_client_email, cc_emails, client:client_id(email,billing_contact_email,billing_cc_emails)")
    .eq("id", id)
    .maybeSingle();
  const to = data?.recipient_email ?? data?.client?.billing_contact_email ?? data?.manual_client_email ?? data?.client?.email ?? null;
  return {
    to: to ? String(to) : null,
    cc: [...splitCc(data?.cc_emails), ...splitCc(data?.client?.billing_cc_emails)],
  };
}

async function paymentClientEmail(paymentId: string) {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("payments")
    .select("invoice:invoice_id(recipient_email,cc_emails,client:client_id(email,billing_contact_email,billing_cc_emails))")
    .eq("id", paymentId)
    .maybeSingle();
  const to = data?.invoice?.recipient_email ?? data?.invoice?.client?.billing_contact_email ?? data?.invoice?.client?.email ?? null;
  return {
    to: to ? String(to) : null,
    cc: [...splitCc(data?.invoice?.cc_emails), ...splitCc(data?.invoice?.client?.billing_cc_emails)],
  };
}

export async function emailQuotePdf(quoteId: string, actorId?: string | null) {
  const email = await clientEmailFor("quotes", quoteId);
  if (!email.to) return null;
  const pdf = await generateAndStoreQuotePdf(quoteId, actorId);
  const result = await sendEmail({
    to: email.to,
    cc: email.cc,
    subject: `AMG Aviation Group quote ${pdf.document.document_number}`,
    text: `Your AMG Aviation Group quote ${pdf.document.document_number} is attached for review.`,
    html: `<p>Your AMG Aviation Group quote <strong>${pdf.document.document_number}</strong> is attached for review.</p>`,
    attachments: [attachment(pdf)],
  });
  if (result.status === "sent") {
    await markBillingDocumentEmailed(pdf.document.id, [email.to, ...email.cc]);
  }
  return { result, document: pdf.document };
}

export async function emailInvoicePdf(invoiceId: string, actorId?: string | null) {
  const email = await clientEmailFor("invoices", invoiceId);
  if (!email.to) return null;
  const pdf = await generateAndStoreInvoicePdf(invoiceId, actorId);
  const result = await sendEmail({
    to: email.to,
    cc: email.cc,
    subject: `AMG Aviation Group invoice ${pdf.document.document_number}`,
    text: `Your AMG Aviation Group invoice ${pdf.document.document_number} is attached.`,
    html: `<p>Your AMG Aviation Group invoice <strong>${pdf.document.document_number}</strong> is attached.</p>`,
    attachments: [attachment(pdf)],
  });
  if (result.status === "sent") {
    await markBillingDocumentEmailed(pdf.document.id, [email.to, ...email.cc]);
  }
  return { result, document: pdf.document };
}

export async function emailReceiptPdf(paymentId: string, actorId?: string | null) {
  const email = await paymentClientEmail(paymentId);
  if (!email.to) return null;
  const pdf = await generateAndStoreReceiptPdf(paymentId, actorId);
  const result = await sendEmail({
    to: email.to,
    cc: email.cc,
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
    await markBillingDocumentEmailed(pdf.document.id, [email.to, ...email.cc]);
  }
  return { result, document: pdf.document };
}
