import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { Tone } from "@/lib/portal/constants";

/**
 * Contractor invoicing: invoices crew and partners send TO AMG for their
 * services (the reverse direction of the client-facing invoices table), plus
 * the receipts they upload — attached to an invoice or standalone.
 */

export type VendorInvoice = Tables<"vendor_invoices">;
export type VendorInvoiceLine = Tables<"vendor_invoice_lines">;
export type VendorReceipt = Tables<"vendor_receipts">;

export type VendorInvoiceWithJoins = VendorInvoice & {
  mission: { id: string; ref: string } | null;
  submitter: { id: string; full_name: string | null; email: string; company_name: string | null } | null;
};

export const VENDOR_INVOICE_STATUS = [
  "submitted",
  "under_review",
  "needs_changes",
  "approved",
  "rejected",
  "paid",
  "void",
] as const;
export type VendorInvoiceStatus = (typeof VENDOR_INVOICE_STATUS)[number];

export const VENDOR_INVOICE_STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  needs_changes: "Needs Changes",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
  void: "Void",
};

export const VENDOR_INVOICE_STATUS_TONE: Record<string, Tone> = {
  submitted: "info",
  under_review: "warn",
  needs_changes: "warn",
  approved: "success",
  rejected: "danger",
  paid: "success",
  void: "neutral",
};

/** Statuses a contractor may still edit / attach receipts to. */
export function vendorInvoiceEditable(status: string): boolean {
  return status === "submitted" || status === "needs_changes";
}

const INVOICE_SELECT =
  "*, mission:mission_id(id, ref), submitter:submitter_id(id, full_name, email, company_name)";

export async function listVendorInvoicesForSubmitter(
  submitterId: string
): Promise<VendorInvoiceWithJoins[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("vendor_invoices")
    .select(INVOICE_SELECT)
    .eq("submitter_id", submitterId)
    .order("created_at", { ascending: false })
    .limit(2000)
    .returns<VendorInvoiceWithJoins[]>();
  return data ?? [];
}

export async function listAllVendorInvoices(filters?: {
  status?: string;
  role?: string;
}): Promise<VendorInvoiceWithJoins[]> {
  const db = await createServiceClient();
  let query = db
    .from("vendor_invoices")
    .select(INVOICE_SELECT)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.role) query = query.eq("submitter_role", filters.role);
  const { data } = await query.returns<VendorInvoiceWithJoins[]>();
  return data ?? [];
}

export async function getVendorInvoice(id: string): Promise<{
  invoice: VendorInvoiceWithJoins;
  lines: VendorInvoiceLine[];
  receipts: VendorReceipt[];
} | null> {
  const db = await createServiceClient();
  const { data: invoice } = await db
    .from("vendor_invoices")
    .select(INVOICE_SELECT)
    .eq("id", id)
    .maybeSingle<VendorInvoiceWithJoins>();
  if (!invoice) return null;
  const [{ data: lines }, { data: receipts }] = await Promise.all([
    db
      .from("vendor_invoice_lines")
      .select("*")
      .eq("invoice_id", id)
      .order("position", { ascending: true }),
    db
      .from("vendor_receipts")
      .select("*")
      .eq("invoice_id", id)
      .order("created_at", { ascending: true }),
  ]);
  return { invoice, lines: lines ?? [], receipts: receipts ?? [] };
}

export type VendorReceiptWithJoins = VendorReceipt & {
  mission: { id: string; ref: string } | null;
  invoice: { id: string; ref: string; status: string } | null;
  uploader: { id: string; full_name: string | null; email: string; company_name: string | null } | null;
};

const RECEIPT_SELECT =
  "*, mission:mission_id(id, ref), invoice:invoice_id(id, ref, status), uploader:uploader_id(id, full_name, email, company_name)";

export async function listVendorReceiptsForUploader(
  uploaderId: string
): Promise<VendorReceiptWithJoins[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("vendor_receipts")
    .select(RECEIPT_SELECT)
    .eq("uploader_id", uploaderId)
    .order("created_at", { ascending: false })
    .limit(2000)
    .returns<VendorReceiptWithJoins[]>();
  return data ?? [];
}

export async function getVendorReceipt(id: string): Promise<VendorReceiptWithJoins | null> {
  const db = await createServiceClient();
  const { data } = await db
    .from("vendor_receipts")
    .select(RECEIPT_SELECT)
    .eq("id", id)
    .maybeSingle<VendorReceiptWithJoins>();
  return data ?? null;
}

/**
 * Missions a contractor may reference on an invoice or receipt: crew see
 * missions they are (or were) assigned to; partners see missions from their
 * partner assignments.
 */
export async function listMissionOptionsForContractor(
  userId: string,
  role: "crew" | "partner"
): Promise<{ id: string; ref: string }[]> {
  const db = await createServiceClient();
  if (role === "crew") {
    const [direct, assignments] = await Promise.all([
      db.from("missions").select("id, ref").eq("assigned_crew_id", userId),
      db
        .from("mission_crew_assignments")
        .select("mission:mission_id(id, ref)")
        .eq("crew_id", userId)
        .returns<{ mission: { id: string; ref: string } | null }[]>(),
    ]);
    const seen = new Map<string, { id: string; ref: string }>();
    for (const m of direct.data ?? []) seen.set(m.id, m);
    for (const row of assignments.data ?? []) {
      if (row.mission) seen.set(row.mission.id, row.mission);
    }
    return Array.from(seen.values()).sort((a, b) => b.ref.localeCompare(a.ref));
  }
  const { data } = await db
    .from("mission_partner_assignments")
    .select("mission:mission_id(id, ref)")
    .eq("partner_id", userId)
    .returns<{ mission: { id: string; ref: string } | null }[]>();
  const seen = new Map<string, { id: string; ref: string }>();
  for (const row of data ?? []) {
    if (row.mission) seen.set(row.mission.id, row.mission);
  }
  return Array.from(seen.values()).sort((a, b) => b.ref.localeCompare(a.ref));
}

/** True when the given mission id is in the contractor's allowed set. */
export async function contractorMayReferenceMission(
  userId: string,
  role: "crew" | "partner",
  missionId: string
): Promise<boolean> {
  const options = await listMissionOptionsForContractor(userId, role);
  return options.some((option) => option.id === missionId);
}
