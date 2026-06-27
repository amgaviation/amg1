import "server-only";

import { absolutePortalUrl } from "@/lib/email/config";
import { renderOperationalEmail } from "@/lib/email/templates";
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
  const subject = `Quote ${pdf.document.document_number} from AMG Aviation Group`;
  const rendered = renderOperationalEmail({
    title: subject,
    preheader: `Your AMG Aviation Group quote ${pdf.document.document_number} is attached for review.`,
    body:
      "AMG Aviation Group has prepared a quote for your review. The quote PDF is attached to this email and remains subject to AMG operational review, availability, and final acceptance.",
    details: [{ label: "Quote", value: pdf.document.document_number }],
    portalUrl: absolutePortalUrl("/portal/client/quotes"),
    showPortalCta: true,
  });
  const result = await sendEmail({
    to: email.to,
    cc: email.cc,
    subject,
    text: rendered.text,
    html: rendered.html,
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
  const subject = `Invoice ${pdf.document.document_number} from AMG Aviation Group`;
  const rendered = renderOperationalEmail({
    title: subject,
    preheader: `Your AMG Aviation Group invoice ${pdf.document.document_number} is attached.`,
    body:
      "AMG Aviation Group has issued an invoice for your review. The invoice PDF is attached to this email and includes the current billing details and payment instructions.",
    details: [{ label: "Invoice", value: pdf.document.document_number }],
    portalUrl: absolutePortalUrl("/portal/client/billing"),
    showPortalCta: true,
  });
  const result = await sendEmail({
    to: email.to,
    cc: email.cc,
    subject,
    text: rendered.text,
    html: rendered.html,
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
  const subject = `Receipt ${pdf.document.document_number} from AMG Aviation Group`;
  const rendered = renderOperationalEmail({
    title: subject,
    preheader: `Your AMG Aviation Group payment receipt ${pdf.document.document_number} is attached.`,
    body:
      "AMG Aviation Group has recorded a payment update. The receipt PDF is attached to this email for your records.",
    details: [{ label: "Receipt", value: pdf.document.document_number }],
    portalUrl: absolutePortalUrl("/portal/client/billing"),
    showPortalCta: true,
  });
  const result = await sendEmail({
    to: email.to,
    cc: email.cc,
    subject,
    text: rendered.text,
    html: rendered.html,
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
