"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent, notifyUser } from "@/lib/portal/audit";
import { emailReceiptPdf } from "@/lib/portal/billing-emails";
import { nextBillingDocumentNumber } from "@/lib/portal/billing-numbering";
import { ACKNOWLEDGMENT_TEXT, COMPLIANCE_POLICY_VERSION, POLICY_KEYS } from "@/lib/compliance/config";
import { recordComplianceEvidence } from "@/lib/compliance/evidence";
import {
  getStripeExternalPayment,
  syncStripeExternalPayments,
} from "@/lib/portal/stripe-external-payments";
import { actor, bool, str } from "./_helpers";

const BASE = "/portal/admin/payments/stripe";

function back(params: Record<string, string | undefined>): never {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  redirect(qs ? `${BASE}?${qs}` : BASE);
}

function refresh() {
  revalidatePath(BASE);
  revalidatePath("/portal/admin/payments");
}

export async function syncStripePayments() {
  const admin = await actor(["admin"], "payments.add");
  const result = await syncStripeExternalPayments();
  refresh();
  if (!result.ok) back({ error: "sync" });
  await logAuditEvent({
    actor: admin,
    action: "stripe_external_payments_synced",
    detail: `Scanned ${result.ok ? result.scanned : 0} Stripe payments, captured ${result.ok ? result.added : 0} new`,
    entityType: "payment",
    entityId: null,
  });
  back({ success: "synced", added: String(result.ok ? result.added : 0) });
}

export async function matchStripeExternalPayment(formData: FormData) {
  const admin = await actor(["admin"], "payments.add");
  const db = await createServiceClient();
  const billingDb = db as any;
  const externalId = str(formData, "external_id");
  const invoiceId = str(formData, "invoice_id");
  if (!externalId) back({ error: "missing" });
  if (!invoiceId) back({ error: "invoice-required", record: externalId });

  const external = await getStripeExternalPayment(externalId);
  if (!external) back({ error: "missing" });
  if (external.status !== "unmatched") back({ error: "resolved", record: externalId });

  // Idempotency: if this intent already has a payments row (concurrent match,
  // or reconciled through another path), just link it instead of double-recording.
  const { data: existingPayment } = await billingDb
    .from("payments")
    .select("id, invoice_id")
    .eq("provider_payment_id", external.stripe_payment_intent_id)
    .maybeSingle();
  if (existingPayment) {
    await billingDb
      .from("stripe_external_payments")
      .update({
        status: "matched",
        matched_invoice_id: existingPayment.invoice_id,
        matched_payment_id: existingPayment.id,
        resolved_by: admin.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", externalId)
      .eq("status", "unmatched");
    refresh();
    back({ success: "matched", record: externalId });
  }

  const { data: invoice } = await db
    .from("invoices")
    .select("id, amount_paid, total, client_id, invoice_number, status, currency")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) back({ error: "invoice-missing", record: externalId });
  if (["paid", "void", "written_off"].includes(invoice.status)) {
    back({ error: "invoice-locked", record: externalId });
  }
  const invoiceCurrency = (invoice.currency ?? "USD").toLowerCase();
  if (invoiceCurrency !== external.currency.toLowerCase()) {
    back({ error: "currency", record: externalId });
  }

  const amount = Number(external.amount_cents) / 100;
  const amountPaid = Number(invoice.amount_paid ?? 0) + amount;
  const total = Number(invoice.total ?? 0);
  const status = amountPaid >= total ? "paid" : "partially_paid";
  const paidAt = external.paid_at;
  const sendReceipt = bool(formData, "send_receipt");

  const receiptNumber = await nextBillingDocumentNumber("receipt");
  const { data: payment, error: paymentError } = await billingDb
    .from("payments")
    .insert({
      invoice_id: invoice.id,
      amount,
      currency: external.currency.toUpperCase(),
      payment_method: "card",
      provider: "stripe",
      provider_payment_id: external.stripe_payment_intent_id,
      provider_customer_id: external.stripe_customer_id,
      payment_provider: "stripe",
      payment_status: "paid",
      payment_reference: external.stripe_payment_intent_id,
      receipt_number: receiptNumber,
      receipt_send_suppressed: !sendReceipt,
      notes: `Stripe payment matched from reconciliation (${external.source === "hurdlr" ? "Hurdlr" : "external"}${external.external_reference ? ` ref ${external.external_reference}` : ""})`,
      recorded_by: admin.id,
      status: "recorded",
      paid_at: paidAt,
    })
    .select("id")
    .single();
  if (paymentError || !payment) back({ error: "payment", record: externalId });

  // Optimistic concurrency (mirrors recordInvoicePayment): the rollup only
  // applies if amount_paid is still the value read above; otherwise undo the
  // payment row and ask the admin to retry against the fresh balance.
  const rollup = billingDb
    .from("invoices")
    .update({
      amount_paid: amountPaid,
      amount_due: Math.max(total - amountPaid, 0),
      status,
      paid_at: status === "paid" ? paidAt : null,
      payment_provider: "stripe",
      payment_status: "paid",
      stripe_payment_intent_id: external.stripe_payment_intent_id,
      stripe_customer_id: external.stripe_customer_id,
      stripe_payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);
  const { data: rolledUp, error: rollupError } = await (
    invoice.amount_paid == null ? rollup.is("amount_paid", null) : rollup.eq("amount_paid", invoice.amount_paid)
  )
    .select("id")
    .maybeSingle();
  if (rollupError || !rolledUp) {
    await billingDb.from("payments").delete().eq("id", payment.id);
    back({ error: "conflict", record: externalId });
  }

  await billingDb
    .from("stripe_external_payments")
    .update({
      status: "matched",
      matched_invoice_id: invoice.id,
      matched_payment_id: payment.id,
      resolved_by: admin.id,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", externalId);

  await logAuditEvent({
    actor: admin,
    action: "invoice_payment_recorded",
    detail: `Matched external Stripe payment ${external.stripe_payment_intent_id} (${amount}) to ${invoice.invoice_number} (receipt ${receiptNumber})`,
    entityType: "invoice",
    entityId: invoice.id,
  });
  await recordComplianceEvidence({
    actor: admin,
    audience: "admin",
    eventType: "payment_marked_paid",
    eventArea: "billing",
    relatedRecordType: "invoice",
    relatedRecordId: invoice.id,
    policyKey: POLICY_KEYS.noOnlinePayment,
    policyVersion: COMPLIANCE_POLICY_VERSION,
    acknowledgmentText: ACKNOWLEDGMENT_TEXT.noOnlinePayment,
    metadata: {
      amount,
      status,
      paymentId: payment.id,
      stripePaymentIntentId: external.stripe_payment_intent_id,
      source: external.source,
    },
  });
  if (sendReceipt) {
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
      entityId: invoice.id,
    });
  }

  refresh();
  revalidatePath(`/portal/admin/invoices/${invoice.id}`);
  revalidatePath("/portal/client/billing");
  back({ success: "matched", record: externalId });
}

export async function dismissStripeExternalPayment(formData: FormData) {
  const admin = await actor(["admin"], "payments.add");
  const db = (await createServiceClient()) as any;
  const externalId = str(formData, "external_id");
  if (!externalId) back({ error: "missing" });

  const external = await getStripeExternalPayment(externalId);
  if (!external) back({ error: "missing" });
  if (external.status !== "unmatched") back({ error: "resolved", record: externalId });

  await db
    .from("stripe_external_payments")
    .update({
      status: "dismissed",
      resolution_note: str(formData, "resolution_note") || null,
      resolved_by: admin.id,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", externalId)
    .eq("status", "unmatched");

  await logAuditEvent({
    actor: admin,
    action: "stripe_external_payment_dismissed",
    detail: `Dismissed external Stripe payment ${external.stripe_payment_intent_id} (${Number(external.amount_cents) / 100} ${external.currency.toUpperCase()})`,
    entityType: "payment",
    entityId: null,
  });

  refresh();
  back({ success: "dismissed", record: externalId });
}

export async function reopenStripeExternalPayment(formData: FormData) {
  const admin = await actor(["admin"], "payments.add");
  const db = (await createServiceClient()) as any;
  const externalId = str(formData, "external_id");
  if (!externalId) back({ error: "missing" });

  const external = await getStripeExternalPayment(externalId);
  if (!external) back({ error: "missing" });
  if (external.status !== "dismissed") back({ error: "resolved", record: externalId });

  await db
    .from("stripe_external_payments")
    .update({
      status: "unmatched",
      resolution_note: null,
      resolved_by: null,
      resolved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", externalId)
    .eq("status", "dismissed");

  await logAuditEvent({
    actor: admin,
    action: "stripe_external_payment_reopened",
    detail: `Reopened external Stripe payment ${external.stripe_payment_intent_id}`,
    entityType: "payment",
    entityId: null,
  });

  refresh();
  back({ success: "reopened", record: externalId });
}
