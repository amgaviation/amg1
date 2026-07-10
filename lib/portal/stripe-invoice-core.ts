import { OPERATIONAL_EMAIL_FOOTER } from "@/lib/email/templates";

export type StripePayableInvoice = {
  id: string;
  invoice_number: string;
  status: string;
  amount_due: number;
  currency?: string | null;
  due_date?: string | null;
  payment_instructions?: string | null;
  client_id?: string | null;
  client?: {
    company_name?: string | null;
    full_name?: string | null;
    email?: string | null;
    billing_contact_email?: string | null;
  } | null;
};

type CheckoutSummaryOptions = {
  siteUrl: string;
  environment?: string | null;
};

type StripeAmount = {
  amountTotal?: number | null;
  currency?: string | null;
};

const PAYABLE_STATUSES = new Set(["sent", "viewed", "overdue", "partially_paid"]);

export function invoiceAmountDueCents(invoice: Pick<StripePayableInvoice, "amount_due">) {
  return Math.round(Number(invoice.amount_due ?? 0) * 100);
}

export function normalizedCurrency(value?: string | null) {
  return (value || "usd").trim().toLowerCase();
}

export function canInvoiceReceiveStripePayment(invoice: StripePayableInvoice) {
  if (!PAYABLE_STATUSES.has(invoice.status)) {
    return { ok: false, reason: "status" as const };
  }
  if (invoiceAmountDueCents(invoice) <= 0) {
    return { ok: false, reason: "amount" as const };
  }
  return { ok: true, reason: null };
}

export function buildInvoiceCheckoutSummary(
  invoice: StripePayableInvoice,
  options: CheckoutSummaryOptions,
) {
  const siteUrl = options.siteUrl.replace(/\/+$/, "");
  const successUrl = `${siteUrl}/payments/stripe/success?invoice_id=${encodeURIComponent(invoice.id)}`;
  const cancelUrl = `${siteUrl}/payments/stripe/cancel?invoice_id=${encodeURIComponent(invoice.id)}`;

  return {
    amountCents: invoiceAmountDueCents(invoice),
    currency: normalizedCurrency(invoice.currency),
    successUrl,
    cancelUrl,
    metadata: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      client_id: invoice.client_id ?? "",
      environment: options.environment || "local",
    },
  };
}

export function invoiceCheckoutIdempotencyKey(
  invoice: StripePayableInvoice,
  previousSessionId?: string | null,
) {
  return [
    "amg-invoice-checkout",
    invoice.id,
    invoiceAmountDueCents(invoice),
    normalizedCurrency(invoice.currency),
    previousSessionId || "initial",
  ].join(":");
}

export function stripeAmountMatchesInvoice(invoice: StripePayableInvoice, amount: StripeAmount) {
  return (
    invoiceAmountDueCents(invoice) === Number(amount.amountTotal ?? 0) &&
    normalizedCurrency(invoice.currency) === normalizedCurrency(amount.currency)
  );
}

export function shouldProcessStripeWebhookEvent(eventId: string, processedEventIds: Set<string>) {
  return Boolean(eventId) && !processedEventIds.has(eventId);
}

export function invoicePaymentEmailContent(input: {
  invoice: StripePayableInvoice;
  paymentUrl?: string | null;
  portalUrl?: string | null;
}) {
  const invoice = input.invoice;
  const clientName =
    invoice.client?.company_name ?? invoice.client?.full_name ?? invoice.client?.email ?? "Client";
  const amountDue = formatMoney(invoice.amount_due, invoice.currency);
  const dueDate = invoice.due_date ? formatDate(invoice.due_date) : null;
  const subject = `Invoice ${invoice.invoice_number} from AMG Aviation Group`;
  const lines = [
    `AMG Aviation Group invoice ${invoice.invoice_number} is ready for ${clientName}.`,
    `Amount due: ${amountDue}`,
    dueDate ? `Due date: ${dueDate}` : null,
    invoice.payment_instructions ? `Payment instructions: ${invoice.payment_instructions}` : null,
    input.paymentUrl ? `Pay Invoice: ${input.paymentUrl}` : null,
    input.portalUrl ? `Open Portal: ${input.portalUrl}` : null,
  ].filter(Boolean) as string[];

  return {
    subject,
    text: `${lines.join("\n")}\n\n---\n${OPERATIONAL_EMAIL_FOOTER}`,
    html: brandedEmailHtml({
      title: `Invoice ${escapeHtml(invoice.invoice_number)}`,
      intro: `AMG Aviation Group invoice <strong>${escapeHtml(invoice.invoice_number)}</strong> is ready for ${escapeHtml(clientName)}.`,
      rows: [
        ["Amount due", amountDue],
        dueDate ? ["Due date", dueDate] : null,
        ["Invoice summary", `Invoice ${invoice.invoice_number}`],
      ].filter(Boolean) as [string, string][],
      paymentInstructions: invoice.payment_instructions,
      paymentUrl: input.paymentUrl,
      portalUrl: input.portalUrl,
    }),
  };
}

function brandedEmailHtml(input: {
  title: string;
  intro: string;
  rows: [string, string][];
  paymentInstructions?: string | null;
  paymentUrl?: string | null;
  portalUrl?: string | null;
}) {
  const cta = input.paymentUrl
    ? `<p style="margin: 26px 0;"><a href="${escapeAttribute(input.paymentUrl)}" style="display:inline-block;background:#050B14;color:#FFFFFF;text-decoration:none;font-weight:700;border-radius:999px;padding:13px 22px;">Pay Invoice</a></p>`
    : "";
  const portal = input.portalUrl
    ? `<p style="margin: 18px 0 0;"><a href="${escapeAttribute(input.portalUrl)}" style="color:#3B82F6;text-decoration:none;font-size:13px;">Open Portal</a></p>`
    : "";

  return `
    <div style="margin:0;padding:0;background:#f4f7fb;">
      <div style="max-width:640px;margin:0 auto;padding:28px 16px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="background:#050B14;color:#FFFFFF;padding:22px 24px;border-radius:10px 10px 0 0;">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#C0C7D1;">AMG Aviation Group</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">${input.title}</h1>
        </div>
        <div style="background:#FFFFFF;border:1px solid #dbe3ef;border-top:0;border-radius:0 0 10px 10px;padding:24px;">
          <p style="margin:0 0 18px;line-height:1.6;">${input.intro}</p>
          <table style="width:100%;border-collapse:collapse;margin:0 0 18px;">
            <tbody>
              ${input.rows.map(([label, value]) => `<tr><td style="padding:10px 0;border-top:1px solid #edf2f7;color:#64748b;font-size:13px;">${escapeHtml(label)}</td><td style="padding:10px 0;border-top:1px solid #edf2f7;text-align:right;font-weight:700;">${escapeHtml(value)}</td></tr>`).join("")}
            </tbody>
          </table>
          ${cta}
          ${input.paymentInstructions ? `<p style="margin:0;color:#475569;line-height:1.6;font-size:14px;">${escapeHtml(input.paymentInstructions)}</p>` : ""}
          ${portal}
          <hr style="border:0;border-top:1px solid #dbe3ef;margin:24px 0;" />
          <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">${escapeHtml(OPERATIONAL_EMAIL_FOOTER)}</p>
        </div>
      </div>
    </div>
  `;
}

function formatMoney(value: number, currency?: string | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency(currency).toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
