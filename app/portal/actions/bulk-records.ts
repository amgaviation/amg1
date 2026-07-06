"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/portal/audit";
import { actor, safeRedirectPath, str } from "./_helpers";

/**
 * Bulk deletion for the DataTable-based admin tabs. Every action follows the
 * bulkDeletePortalAccounts contract: dedup ids[] from the form, guard each row
 * individually (skip, never abort the batch), audit per row, and redirect back
 * with ?bulk=deleted&deleted=N&skipped=N.
 *
 * Delete strategies come from the entity's linkage graph:
 * - CRM leads: hard delete + explicit crm_activities cleanup; skip won/converted.
 * - Documents: hard delete + storage object removal; skip credential evidence.
 * - Quotes: hard delete drafts only (draft/internal_review); line items first.
 * - Invoices: hard delete only when draft/ready_to_send, unpaid, and untouched
 *   by Stripe — a payments row or Stripe id is an absolute block (financial
 *   history must never cascade away).
 * Missions, payments, receivables, subscriptions, and the audit log are
 * deliberately NOT bulk-deletable.
 */

/** Serverless-friendly ceiling: each row costs several sequential DB round
 * trips, so an unbounded batch could time out mid-loop with no result. */
const MAX_BULK_IDS = 200;

function formIds(formData: FormData): string[] {
  return Array.from(
    new Set(formData.getAll("ids").map((value) => String(value).trim()).filter(Boolean))
  );
}

/** Merge result params into back_to without corrupting an existing query string. */
function redirectWith(backTo: string, extra: Record<string, string>): never {
  const [path, existing = ""] = backTo.split("?");
  const params = new URLSearchParams(existing);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  redirect(`${path}?${params.toString()}`);
}

function bulkResultRedirect(backTo: string, deleted: number, skipped: number): never {
  redirectWith(backTo, {
    bulk: "deleted",
    deleted: String(deleted),
    ...(skipped ? { skipped: String(skipped) } : {}),
  });
}

function guardBatch(ids: string[], backTo: string): void {
  if (!ids.length) redirectWith(backTo, { error: "none-selected" });
  if (ids.length > MAX_BULK_IDS) redirectWith(backTo, { error: "too-many-selected" });
}

/** CRM leads: cheap prospect records. Won/converted leads carry conversion history — skipped. */
export async function bulkDeleteLeads(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/crm");
  const ids = formIds(formData);
  guardBatch(ids, backTo);

  let deleted = 0;
  let skipped = 0;

  for (const id of ids) {
    const { data: lead } = await db
      .from("crm_leads")
      .select("id, full_name, company, email, stage, converted_profile_id")
      .eq("id", id)
      .maybeSingle();

    if (!lead) {
      skipped += 1;
      continue;
    }

    if (lead.stage === "won" || lead.converted_profile_id) {
      skipped += 1;
      continue;
    }

    // crm_activities.lead_id is ON DELETE CASCADE (verified on the live DB),
    // so the single parent delete removes the activity history atomically —
    // no separate child delete that could destroy history if this row fails.
    const { error } = await db.from("crm_leads").delete().eq("id", id);
    if (error) {
      skipped += 1;
      continue;
    }

    await logAuditEvent({
      actor: admin,
      action: "crm_lead_deleted",
      detail: `Bulk deleted lead ${lead.company ?? lead.full_name ?? lead.email ?? id}`,
      entityType: "crm_lead",
      entityId: id,
    });
    deleted += 1;
  }

  revalidatePath("/portal/admin/crm");
  bulkResultRedirect(backTo, deleted, skipped);
}

/** Documents: remove the storage object with the row; credential evidence is protected. */
export async function bulkDeleteDocuments(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/documents");
  const ids = formIds(formData);
  guardBatch(ids, backTo);

  let deleted = 0;
  let skipped = 0;

  for (const id of ids) {
    const { data: document } = await db
      .from("documents")
      .select("id, name, original_file_name, storage_bucket, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (!document) {
      skipped += 1;
      continue;
    }

    // A crew credential's evidence file must outlive this tab.
    const { count: credentialRefs } = await db
      .from("crew_credentials")
      .select("id", { count: "exact", head: true })
      .eq("document_id", id);

    if ((credentialRefs ?? 0) > 0) {
      skipped += 1;
      continue;
    }

    // Row first, storage second: if the row delete fails the document is
    // reported as skipped and must still be fully intact (openable file).
    const { error } = await db.from("documents").delete().eq("id", id);
    if (error) {
      skipped += 1;
      continue;
    }

    if (document.storage_path) {
      // storage.remove() returns { data, error } rather than throwing. Legacy
      // rows may say storage_bucket="documents" while the object actually
      // lives in "crew-credentials" (mirrors the download route's fallback),
      // so retry there when the primary bucket removes nothing.
      const primaryBucket = document.storage_bucket || "documents";
      const { data: removed, error: removeError } = await db.storage
        .from(primaryBucket)
        .remove([document.storage_path]);
      if (removeError) {
        console.warn("[bulk-records] storage removal failed", removeError.message);
      } else if (!removed?.length && primaryBucket === "documents") {
        const { error: fallbackError } = await db.storage
          .from("crew-credentials")
          .remove([document.storage_path]);
        if (fallbackError) {
          console.warn("[bulk-records] fallback storage removal failed", fallbackError.message);
        }
      }
    }

    await logAuditEvent({
      actor: admin,
      action: "document_deleted",
      detail: `Bulk deleted document ${document.name ?? document.original_file_name ?? id}`,
      entityType: "document",
      entityId: id,
    });
    deleted += 1;
  }

  revalidatePath("/portal/admin/documents");
  bulkResultRedirect(backTo, deleted, skipped);
}

const DELETABLE_QUOTE_STATUSES = new Set(["draft", "internal_review"]);

/** Quotes: drafts only. Sent/approved/converted quotes are client-facing — void them instead. */
export async function bulkDeleteQuotes(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/quotes");
  const ids = formIds(formData);
  guardBatch(ids, backTo);

  let deleted = 0;
  let skipped = 0;

  for (const id of ids) {
    const { data: quote } = await db
      .from("quotes")
      .select("id, quote_number, status, sent_at")
      .eq("id", id)
      .maybeSingle();

    // sent_at backstops the status check: a quote that ever reached a client
    // stays undeletable even if its status was walked back to draft.
    if (!quote || !DELETABLE_QUOTE_STATUSES.has(String(quote.status)) || quote.sent_at) {
      skipped += 1;
      continue;
    }

    await db.from("quote_line_items").delete().eq("quote_id", id);
    const { error } = await db.from("quotes").delete().eq("id", id);
    if (error) {
      skipped += 1;
      continue;
    }

    await logAuditEvent({
      actor: admin,
      action: "quote_deleted",
      detail: `Bulk deleted draft quote ${quote.quote_number ?? id}`,
      entityType: "quote",
      entityId: id,
    });
    deleted += 1;
  }

  revalidatePath("/portal/admin/quotes");
  bulkResultRedirect(backTo, deleted, skipped);
}

const DELETABLE_INVOICE_STATUSES = new Set(["draft", "ready_to_send"]);

/** Invoices: only unsent, unpaid, Stripe-untouched drafts. Everything else → void/write off. */
export async function bulkDeleteInvoices(formData: FormData) {
  const admin = await actor(["admin"]);
  const db = await createServiceClient();
  const backTo = safeRedirectPath(str(formData, "back_to"), "/portal/admin/invoices");
  const ids = formIds(formData);
  guardBatch(ids, backTo);

  let deleted = 0;
  let skipped = 0;

  for (const id of ids) {
    const { data: invoice } = await db
      .from("invoices")
      .select(
        "id, invoice_number, status, amount_paid, sent_at, stripe_checkout_session_id, stripe_payment_intent_id, payment_provider_session_id"
      )
      .eq("id", id)
      .maybeSingle();

    // sent_at backstops the status check (updateInvoiceStatus allows walking a
    // sent invoice back to draft); payment_provider_session_id is the legacy
    // column stripe-invoices.ts still treats as a live Checkout session.
    if (
      !invoice ||
      !DELETABLE_INVOICE_STATUSES.has(String(invoice.status)) ||
      Number(invoice.amount_paid ?? 0) !== 0 ||
      invoice.sent_at ||
      invoice.stripe_checkout_session_id ||
      invoice.stripe_payment_intent_id ||
      invoice.payment_provider_session_id
    ) {
      skipped += 1;
      continue;
    }

    // Any recorded payment is an absolute block — never rely on the cascade.
    const { count: paymentCount } = await db
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", id);

    if ((paymentCount ?? 0) > 0) {
      skipped += 1;
      continue;
    }

    // Line items carrying crew expenses would strand those expenses forever
    // (status stays "added_to_invoice", so they could never be re-billed).
    const { count: expenseLineCount } = await db
      .from("invoice_line_items")
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", id)
      .not("expense_id", "is", null);

    if ((expenseLineCount ?? 0) > 0) {
      skipped += 1;
      continue;
    }

    const { error } = await db.from("invoices").delete().eq("id", id);
    if (error) {
      skipped += 1;
      continue;
    }

    await logAuditEvent({
      actor: admin,
      action: "invoice_deleted",
      detail: `Bulk deleted draft invoice ${invoice.invoice_number ?? id}`,
      entityType: "invoice",
      entityId: id,
    });
    deleted += 1;
  }

  revalidatePath("/portal/admin/invoices");
  revalidatePath("/portal/admin/receivables");
  bulkResultRedirect(backTo, deleted, skipped);
}
