import "server-only";

import { notifyUser } from "@/lib/portal/audit";
import { getBillingSettings } from "@/lib/portal/billing-config";
import { amgEmailLayout } from "@/lib/portal/email-templates";
import { formatDate, formatMoney } from "@/lib/portal/format";
import { sendEmail } from "@/lib/portal/notification-delivery";
import {
  createInvoiceCheckoutSessionForSend,
  invoicePaymentPortalUrl,
} from "@/lib/portal/stripe-invoices";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Automated client dunning sweep for overdue invoices. Standalone module
 * modeled on lib/portal/sweeps/payout-reminders.ts — NOT wired into the
 * nightly cron here; the orchestrator adds it. Sends an escalating reminder
 * cadence to the invoice's billing contact at T+3 (gentle nudge), T+7 (firm
 * reminder), and T+14 (final notice) days past due. Each stage is deduped
 * against the audit trail (`invoice_dunning_t3` / `_t7` / `_t14`), so an
 * invoice can never receive the same stage twice, and at most ONE stage goes
 * out per invoice per run — an invoice that was already deep past due when
 * the feature turned on gets only its highest owed stage, not a burst of all
 * three. Gated on billing_settings.dunning_enabled (global, default off) and
 * invoices.dunning_paused (per-invoice hold from the Receivables page).
 */

type SupabaseService = Awaited<ReturnType<typeof createServiceClient>>;

const DAY_MS = 24 * 60 * 60 * 1000;

// Cadence thresholds (days past due) — the whole schedule lives here.
const DUNNING_T3_DAYS = 3;
const DUNNING_T7_DAYS = 7;
const DUNNING_T14_DAYS = 14;

// Per-run send ceiling mirroring the payout/credential sweeps: a large first
// backlog drains over successive runs instead of firing hundreds of client
// emails in one cron invocation.
const DUNNING_BATCH_LIMIT = 50;
// Overdue invoices scanned per run (oldest debt first) before stage math.
const DUNNING_SCAN_LIMIT = 500;
// Bounded concurrency — each send does a Stripe session + email + bell.
const SEND_CONCURRENCY = 4;

export type DunningStageAction =
  | "invoice_dunning_t3"
  | "invoice_dunning_t7"
  | "invoice_dunning_t14";

export type DunningStage = {
  action: DunningStageAction;
  /** Days past due at which this stage becomes owed. */
  days: number;
  /** Short label for admin UI ("T+3"). */
  label: string;
  tone: "gentle" | "firm" | "final";
};

/** Ascending cadence — order matters for "highest owed stage" selection. */
export const DUNNING_STAGES: DunningStage[] = [
  { action: "invoice_dunning_t3", days: DUNNING_T3_DAYS, label: "T+3", tone: "gentle" },
  { action: "invoice_dunning_t7", days: DUNNING_T7_DAYS, label: "T+7", tone: "firm" },
  { action: "invoice_dunning_t14", days: DUNNING_T14_DAYS, label: "T+14", tone: "final" },
];

export const DUNNING_STAGE_ACTIONS = DUNNING_STAGES.map((stage) => stage.action);

// Same open set the AR rollup uses; excludes draft/void/written_off/refunded.
const DUNNABLE_STATUSES = ["sent", "viewed", "partially_paid", "overdue"];

type DunnableInvoice = {
  id: string;
  invoice_number: string;
  status: string;
  amount_due: number;
  due_date: string | null;
  client_id: string | null;
  recipient_email: string | null;
  cc_emails: string[] | null;
  dunning_paused: boolean | null;
  client: {
    full_name: string | null;
    email: string | null;
    company_name: string | null;
    billing_contact_email: string | null;
    billing_cc_emails: string[] | null;
  } | null;
};

export type DunningSweepCounts = {
  enabled: boolean;
  scanned: number;
  sent: number;
  skippedPaused: number;
  skippedAlreadySent: number;
  skippedNoRecipient: number;
  failed: number;
};

function emptyCounts(enabled: boolean): DunningSweepCounts {
  return {
    enabled,
    scanned: 0,
    sent: 0,
    skippedPaused: 0,
    skippedAlreadySent: 0,
    skippedNoRecipient: 0,
    failed: 0,
  };
}

/** Audit row attributed to the cron itself rather than a human actor. */
function systemAuditRow(params: {
  action: string;
  detail: string;
  entityType?: string;
  entityId?: string | null;
}) {
  return {
    actor_id: null,
    actor_email: "system-cron",
    actor_role: "admin",
    action: params.action,
    detail: params.detail,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
  };
}

/** Highest cadence stage owed at this age, or null when < T+3. */
export function dunningStageForDays(daysPastDue: number): DunningStage | null {
  let owed: DunningStage | null = null;
  for (const stage of DUNNING_STAGES) {
    if (daysPastDue >= stage.days) owed = stage;
  }
  return owed;
}

function recipientFor(invoice: DunnableInvoice): { to: string | null; cc: string[] } {
  const to =
    invoice.recipient_email ??
    invoice.client?.billing_contact_email ??
    invoice.client?.email ??
    null;
  return {
    to: to ? String(to) : null,
    cc: [...(invoice.cc_emails ?? []), ...(invoice.client?.billing_cc_emails ?? [])].filter(Boolean),
  };
}

/** Escalating email copy per stage: gentle nudge → firm reminder → final notice. */
function stageEmailContent(params: {
  stage: DunningStage;
  invoice: DunnableInvoice;
  daysPastDue: number;
  paymentUrl: string | null;
  portalUrl: string;
}) {
  const { stage, invoice, daysPastDue, paymentUrl, portalUrl } = params;
  const ref = invoice.invoice_number;
  const amount = formatMoney(invoice.amount_due);
  const dueDate = invoice.due_date ? formatDate(invoice.due_date) : "—";

  const copy =
    stage.tone === "gentle"
      ? {
          subject: `Payment reminder — invoice ${ref} is past due`,
          eyebrow: "Payment Reminder",
          title: `Invoice ${ref} is past due`,
          intro: `This is a friendly reminder that AMG Aviation Group invoice ${ref} was due on ${dueDate} and remains unpaid. If your payment is already on the way, thank you — no further action is needed.`,
          footerNote:
            "Questions about this invoice? Reply to this email and AMG Billing will follow up.",
        }
      : stage.tone === "firm"
        ? {
            subject: `Second notice — invoice ${ref} is ${daysPastDue} days past due`,
            eyebrow: "Second Notice",
            title: `Invoice ${ref} requires your attention`,
            intro: `AMG Aviation Group invoice ${ref} is now ${daysPastDue} days past due. Please arrange payment at your earliest convenience, or reply to this email if there is a question about the balance so we can resolve it together.`,
            footerNote:
              "If payment has already been sent, please disregard this notice and reply with the payment details so we can reconcile promptly.",
          }
        : {
            subject: `Final notice — invoice ${ref} requires immediate payment`,
            eyebrow: "Final Notice",
            title: `Final notice for invoice ${ref}`,
            intro: `Despite previous reminders, AMG Aviation Group invoice ${ref} remains unpaid ${daysPastDue} days past its due date. Please settle the outstanding balance immediately. Continued non-payment may result in a temporary pause of services on your account until the balance is resolved.`,
            footerNote:
              "To discuss payment arrangements, reply to this email and AMG Billing will work with you directly.",
          };

  const textLines = [
    copy.intro,
    "",
    `Invoice: ${ref}`,
    `Amount due: ${amount}`,
    `Due date: ${dueDate}`,
    `Days past due: ${daysPastDue}`,
    "",
    paymentUrl ? `Pay invoice: ${paymentUrl}` : null,
    `View in portal: ${portalUrl}`,
  ].filter((line): line is string => line !== null);

  return {
    subject: copy.subject,
    text: textLines.join("\n"),
    html: amgEmailLayout({
      previewText: copy.subject,
      eyebrow: copy.eyebrow,
      title: copy.title,
      reference: ref,
      intro: copy.intro,
      sections: [
        {
          title: "Balance Summary",
          rows: [
            { label: "Invoice", value: ref },
            { label: "Amount due", value: amount },
            { label: "Due date", value: dueDate },
            { label: "Days past due", value: String(daysPastDue) },
          ],
        },
      ],
      cta: paymentUrl
        ? { label: "Pay Invoice", href: paymentUrl }
        : { label: "View Invoice in Portal", href: portalUrl },
      footerNote: copy.footerNote,
    }),
  };
}

/**
 * Send the owed dunning stage for each eligible overdue invoice. Returns
 * per-outcome counts. Safe to call repeatedly — dedupe is audit-trail backed.
 */
export async function sweepInvoiceDunning(
  db: SupabaseService,
  now: Date
): Promise<DunningSweepCounts> {
  // Global gate: the business turns dunning on deliberately from Billing
  // Settings; until then the sweep is a no-op.
  const settings = await getBillingSettings();
  if (!settings.dunning_enabled) return emptyCounts(false);

  const counts = emptyCounts(true);

  // If email delivery is wholly unconfigured, bail before consuming any
  // cadence stage — audit rows are written ahead of sends (see below), and
  // burning stages with zero deliverability helps no one.
  if (!process.env.RESEND_API_KEY) {
    console.error("[sweep/dunning] RESEND_API_KEY missing — skipping dunning sweep");
    return counts;
  }

  const today = now.toISOString().slice(0, 10);
  // dunning_paused is ahead of the generated database types until the next
  // regen, hence the contained cast (same convention as the other sweeps).
  const { data, error } = await (db as any)
    .from("invoices")
    .select(
      "id, invoice_number, status, amount_due, due_date, client_id, recipient_email, cc_emails, dunning_paused, client:client_id(full_name, email, company_name, billing_contact_email, billing_cc_emails)"
    )
    .in("status", DUNNABLE_STATUSES)
    .lt("due_date", today)
    .gt("amount_due", 0)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(DUNNING_SCAN_LIMIT);
  if (error) throw new Error(error.message);

  const invoices = (data ?? []) as DunnableInvoice[];
  counts.scanned = invoices.length;
  if (!invoices.length) return counts;

  // Which stage (if any) does each invoice owe right now? At most one — the
  // highest threshold the invoice's age has crossed.
  const owed = invoices
    .map((invoice) => {
      const daysPastDue = invoice.due_date
        ? Math.floor((now.getTime() - Date.parse(invoice.due_date)) / DAY_MS)
        : 0;
      return { invoice, daysPastDue, stage: dunningStageForDays(daysPastDue) };
    })
    .filter(
      (item): item is { invoice: DunnableInvoice; daysPastDue: number; stage: DunningStage } =>
        item.stage !== null
    );
  if (!owed.length) return counts;

  // Dedupe per stage against the audit trail, mirroring the manual
  // invoice-reminder throttle and the payout-reminder sweep: an invoice that
  // already carries a stage's action never receives that stage again.
  const { data: prior, error: priorError } = await (db as any)
    .from("audit_events")
    .select("entity_id, action")
    .in("action", DUNNING_STAGE_ACTIONS)
    .eq("entity_type", "invoice")
    .in(
      "entity_id",
      owed.map((item) => item.invoice.id)
    );
  if (priorError) throw new Error(priorError.message);
  const alreadySent = new Set<string>();
  for (const event of (prior ?? []) as { entity_id: string | null; action: string }[]) {
    if (event.entity_id) alreadySent.add(`${event.action}:${event.entity_id}`);
  }

  const due: typeof owed = [];
  for (const item of owed) {
    if (item.invoice.dunning_paused) {
      counts.skippedPaused += 1;
      continue;
    }
    if (alreadySent.has(`${item.stage.action}:${item.invoice.id}`)) {
      counts.skippedAlreadySent += 1;
      continue;
    }
    if (!recipientFor(item.invoice).to) {
      counts.skippedNoRecipient += 1;
      continue;
    }
    due.push(item);
    if (due.length >= DUNNING_BATCH_LIMIT) break;
  }
  if (!due.length) return counts;

  const sendOne = async (item: (typeof due)[number]) => {
    const { invoice, stage, daysPastDue } = item;
    const email = recipientFor(invoice);
    if (!email.to) return; // re-checked for type narrowing; counted above

    // Audit FIRST — same bias as the payout sweep: a partial failure after
    // this point suppresses the stage on the next run rather than re-nagging
    // the client. A stage lost to a transient send failure self-heals via the
    // next cadence tier; a duplicate "final notice" does not.
    const { error: auditError } = await (db as any).from("audit_events").insert(
      systemAuditRow({
        action: stage.action,
        detail: `Dunning ${stage.label} for invoice ${invoice.invoice_number} (${formatMoney(invoice.amount_due)} due, ${daysPastDue} days past due) sent to ${email.to}.`,
        entityType: "invoice",
        entityId: invoice.id,
      })
    );
    if (auditError) throw new Error(auditError.message);

    // Hosted Stripe payment link via the exact helper the invoice-send email
    // uses. It is cron-safe (service client + env keys, no user session),
    // reuses the invoice's stored open checkout session when still valid, and
    // creates a fresh one otherwise. When Stripe is unavailable the email
    // still goes out with the portal billing URL as the action link.
    const checkout = await createInvoiceCheckoutSessionForSend(invoice.id).catch(
      (checkoutError) => {
        console.error(
          "[sweep/dunning] payment link creation failed",
          invoice.id,
          checkoutError
        );
        return null;
      }
    );
    const paymentUrl = checkout?.ok ? checkout.url : null;
    const portalUrl = invoicePaymentPortalUrl(invoice.id);

    const content = stageEmailContent({ stage, invoice, daysPastDue, paymentUrl, portalUrl });
    const result = await sendEmail({
      to: email.to,
      cc: email.cc,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    if (result.status !== "sent") {
      throw new Error(result.error ?? `email delivery ${result.status}`);
    }

    // Portal bell for clients with an account — best-effort, never blocks.
    if (invoice.client_id) {
      await notifyUser({
        userId: invoice.client_id,
        title:
          stage.tone === "final"
            ? `Final notice: invoice ${invoice.invoice_number} is overdue`
            : `Payment reminder: invoice ${invoice.invoice_number} is overdue`,
        body: `Invoice ${invoice.invoice_number} (${formatMoney(invoice.amount_due)}) is ${daysPastDue} days past due. Open Billing in AMG Connect to review and pay.`,
        type: "invoice_dunning",
        entityType: "invoice",
        entityId: invoice.id,
      }).catch((notifyError) => {
        console.error("[sweep/dunning] portal notification failed", invoice.id, notifyError);
      });
    }
  };

  // Bounded concurrency with a per-invoice try/catch — one bad invoice never
  // blocks the rest of the batch.
  for (let i = 0; i < due.length; i += SEND_CONCURRENCY) {
    await Promise.all(
      due.slice(i, i + SEND_CONCURRENCY).map(async (item) => {
        try {
          await sendOne(item);
          counts.sent += 1;
        } catch (sendError) {
          counts.failed += 1;
          console.error(
            "[sweep/dunning] stage send failed",
            item.invoice.id,
            item.stage.action,
            sendError
          );
        }
      })
    );
  }

  return counts;
}
