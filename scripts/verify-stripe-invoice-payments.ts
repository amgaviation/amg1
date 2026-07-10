import assert from "node:assert/strict";
import {
  buildInvoiceCheckoutSummary,
  canInvoiceReceiveStripePayment,
  invoiceCheckoutIdempotencyKey,
  invoicePaymentEmailContent,
  shouldProcessStripeWebhookEvent,
  stripeAmountMatchesInvoice,
} from "../lib/portal/stripe-invoice-core";

const invoice = {
  id: "11111111-1111-4111-8111-111111111111",
  invoice_number: "AMG-I-2026-06-0007",
  status: "sent",
  amount_due: 12850.75,
  currency: "USD",
  due_date: "2026-07-15",
  payment_instructions: "Wire, Zelle, or card link accepted by AMG.",
  client: {
    company_name: "Example Flight LLC",
    full_name: "Avery Client",
    email: "avery@example.com",
  },
};

assert.equal(canInvoiceReceiveStripePayment(invoice).ok, true);
assert.equal(canInvoiceReceiveStripePayment({ ...invoice, status: "paid" }).ok, false);
assert.equal(canInvoiceReceiveStripePayment({ ...invoice, amount_due: 0 }).ok, false);
assert.equal(canInvoiceReceiveStripePayment({ ...invoice, status: "draft" }).ok, false);

const checkout = buildInvoiceCheckoutSummary(invoice, {
  siteUrl: "https://amgaviation.net",
  environment: "test",
});
assert.equal(checkout.amountCents, 1285075);
assert.equal(checkout.currency, "usd");
assert.equal(checkout.metadata.invoice_id, invoice.id);
assert.equal(checkout.metadata.invoice_number, invoice.invoice_number);
assert.equal(checkout.successUrl, "https://amgaviation.net/payments/stripe/success?invoice_id=11111111-1111-4111-8111-111111111111");

assert.equal(stripeAmountMatchesInvoice(invoice, { amountTotal: 1285075, currency: "usd" }), true);
assert.equal(stripeAmountMatchesInvoice(invoice, { amountTotal: 1285074, currency: "usd" }), false);
assert.equal(stripeAmountMatchesInvoice(invoice, { amountTotal: 1285075, currency: "eur" }), false);

const initialCheckoutKey = invoiceCheckoutIdempotencyKey(invoice, null);
assert.equal(initialCheckoutKey, invoiceCheckoutIdempotencyKey(invoice, null));
assert.notEqual(initialCheckoutKey, invoiceCheckoutIdempotencyKey(invoice, "cs_expired_123"));
assert.notEqual(
  initialCheckoutKey,
  invoiceCheckoutIdempotencyKey({ ...invoice, amount_due: invoice.amount_due + 1 }, null),
);

const email = invoicePaymentEmailContent({
  invoice,
  paymentUrl: "https://checkout.stripe.com/c/pay/cs_test_123",
  portalUrl: "https://amgaviation.net/portal/client/billing/11111111-1111-4111-8111-111111111111",
});
assert.match(email.subject, /Invoice AMG-I-2026-06-0007 from AMG Aviation Group/);
assert.match(email.html, /Pay Invoice/);
assert.match(email.html, /checkout\.stripe\.com/);
assert.match(email.text, /Amount due: \$12,850\.75/);
assert.doesNotMatch(email.subject, /11111111-1111/);

const processedEvents = new Set(["evt_existing"]);
assert.equal(shouldProcessStripeWebhookEvent("evt_new", processedEvents), true);
assert.equal(shouldProcessStripeWebhookEvent("evt_existing", processedEvents), false);

console.log("Stripe invoice payment verification passed.");
