import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { absolutePortalUrl } from "@/lib/email/config";
import { amgEmailLayout } from "@/lib/portal/email-templates";
import { RESEND_AUTOMATION_EVENTS, automationIdempotencyKey } from "@/lib/email/automation";
import { sendEmail } from "@/lib/portal/notification-delivery";
import { invoicePaymentEmailContent } from "@/lib/portal/stripe-invoice-core";
import {
  createInvoiceCheckoutSessionForSend,
  invoicePaymentPortalUrl,
} from "@/lib/portal/stripe-invoices";
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
  const select =
    table === "quotes"
      ? "recipient_email, manual_client_email, cc_emails, client:client_id(email,billing_contact_email,billing_cc_emails)"
      : "recipient_email, cc_emails, client:client_id(email,billing_contact_email,billing_cc_emails)";
  const { data } = await db
    .from(table)
    .select(select)
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

async function invoiceEmailRecord(invoiceId: string) {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("invoices")
    .select("id, invoice_number, status, amount_due, currency, due_date, payment_instructions, client_id, client:client_id(full_name,email,company_name,billing_contact_email)")
    .eq("id", invoiceId)
    .maybeSingle();
  return data ?? null;
}

export async function emailQuotePdf(quoteId: string, actorId?: string | null) {
  const email = await clientEmailFor("quotes", quoteId);
  if (!email.to) return null;
  const pdf = await generateAndStoreQuotePdf(quoteId, actorId);
  const result = await sendEmail({
    to: email.to,
    cc: email.cc,
    subject: `AMG Aviation Group quote ${pdf.document.document_number}`,
    text: `Your AMG Aviation Group quote ${pdf.document.document_number} is attached for review. Review and approve it any time from your AMG Connect portal.`,
    html: amgEmailLayout({
      previewText: `Quote ${pdf.document.document_number} is ready for review`,
      eyebrow: "Quote Ready",
      title: `Quote ${pdf.document.document_number}`,
      reference: pdf.document.document_number,
      intro:
        "Your AMG Aviation Group quote is attached as a PDF. You can review the full breakdown and approve it any time from your AMG Connect portal.",
      cta: { label: "Review in Portal", href: absolutePortalUrl("/portal/client/quotes") },
      footerNote:
        "Questions about scope, timing, or pricing? Reply to this email and AMG Operations will follow up.",
    }),
    attachments: [attachment(pdf)],
    idempotencyKey: automationIdempotencyKey(RESEND_AUTOMATION_EVENTS.quoteSent, quoteId, email.to),
    eventType: RESEND_AUTOMATION_EVENTS.quoteSent,
  });
  if (result.status === "sent") {
    await markBillingDocumentEmailed(pdf.document.id, [email.to, ...email.cc]);
  }
  return { result, document: pdf.document };
}

export async function emailInvoicePdf(invoiceId: string, actorId?: string | null) {
  const email = await clientEmailFor("invoices", invoiceId);
  if (!email.to) return null;
  const invoice = await invoiceEmailRecord(invoiceId);
  const checkout = await createInvoiceCheckoutSessionForSend(invoiceId).catch((error) => {
    console.error("[billing] failed to create Stripe invoice payment link", invoiceId, error);
    return null;
  });
  const pdf = await generateAndStoreInvoicePdf(invoiceId, actorId);
  const content = invoice
    ? invoicePaymentEmailContent({
        invoice,
        paymentUrl: checkout?.ok ? checkout.url : null,
        portalUrl: invoicePaymentPortalUrl(invoiceId),
      })
    : {
        subject: `Invoice ${pdf.document.document_number} from AMG Aviation Group`,
        text: `Your AMG Aviation Group invoice ${pdf.document.document_number} is attached. View it any time from your AMG Connect portal.`,
        html: amgEmailLayout({
          previewText: `Invoice ${pdf.document.document_number} from AMG Aviation Group`,
          eyebrow: "Invoice",
          title: `Invoice ${pdf.document.document_number}`,
          reference: pdf.document.document_number,
          intro:
            "Your AMG Aviation Group invoice is attached as a PDF. Payment details are on the invoice, and the full history is available in your AMG Connect portal.",
          cta: { label: "View in Portal", href: absolutePortalUrl("/portal/client/billing") },
        }),
      };
  const result = await sendEmail({
    to: email.to,
    cc: email.cc,
    subject: content.subject,
    text: content.text,
    html: content.html,
    attachments: [attachment(pdf)],
    idempotencyKey: automationIdempotencyKey(RESEND_AUTOMATION_EVENTS.invoiceSent, invoiceId, email.to),
    eventType: RESEND_AUTOMATION_EVENTS.invoiceSent,
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
    text: `Your AMG Aviation Group payment receipt ${pdf.document.document_number} is attached. Thank you — your payment has been recorded.`,
    html: amgEmailLayout({
      previewText: `Payment received — receipt ${pdf.document.document_number}`,
      eyebrow: "Payment Received",
      title: `Receipt ${pdf.document.document_number}`,
      reference: pdf.document.document_number,
      intro:
        "Thank you — your payment has been recorded. Your official receipt is attached as a PDF, and your billing history is available in your AMG Connect portal.",
      cta: { label: "View Billing", href: absolutePortalUrl("/portal/client/billing") },
    }),
    attachments: [attachment(pdf)],
    idempotencyKey: automationIdempotencyKey(RESEND_AUTOMATION_EVENTS.paymentReceived, paymentId, email.to),
    eventType: RESEND_AUTOMATION_EVENTS.paymentReceived,
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
