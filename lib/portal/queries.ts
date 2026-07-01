import "server-only";

import { listAdminCrewProfiles, type AdminCrewProfile } from "@/lib/portal/admin-crew-query";
import { createServiceClient } from "@/lib/supabase/server";
import type { BillingDocumentRow } from "@/lib/portal/billing-documents";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Read layer for the portal. Authorization is enforced by the calling
 * page (requireRole + explicit owner scoping); these helpers use the
 * service client so cross-profile joins (crew/client names) resolve.
 * RLS remains active as defense-in-depth for any user-client access.
 */

export type Mission = Tables<"missions">;
export type Aircraft = Tables<"aircraft">;
export type Quote = Tables<"quotes">;
export type QuoteLineItem = Tables<"quote_line_items">;
export type Invoice = Tables<"invoices">;
export type InvoiceLineItem = Tables<"invoice_line_items">;
export type Payment = Tables<"payments">;
export type Expense = Tables<"expenses">;
export type DocumentRow = Tables<"documents">;
export type Profile = Tables<"profiles">;
export type CrewProfile = Tables<"crew_profiles">;
export type CrewCredential = Tables<"crew_credentials">;
export type CrewAvailability = Tables<"crew_availability">;
export type PartnerProfile = Tables<"partner_profiles">;
export type PartnerAssignment = Tables<"mission_partner_assignments">;
export type CrewAssignment = Tables<"mission_crew_assignments">;
export type MissionPassenger = Tables<"mission_passengers">;
export type AuditEvent = Tables<"audit_events">;
export type NotificationRow = Tables<"notifications">;
export type MessageThread = Tables<"message_threads">;
export type Message = Tables<"messages">;

type MiniProfile = { full_name: string | null; email: string; company_name: string | null };
type MiniAircraft = { tail_number: string; make: string | null; model: string | null };

export type SubscriptionPlan = {
  id: string;
  name: string;
  aircraft_category: string | null;
  description: string | null;
  status: string;
  billing_cadence_supported: string[];
  base_admin_fee_monthly: number;
  base_admin_fee_annual: number;
  annual_discount_percent: number;
  default_terms: string | null;
  plan_code?: string | null;
  stripe_product_id?: string | null;
  stripe_test_product_id?: string | null;
  stripe_live_product_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlanTier = {
  id: string;
  plan_id: string;
  name: string;
  included_flights: number;
  included_mx_repositions: number;
  included_admin_hours: number;
  crew_day_rate: number | null;
  lodging_policy: string | null;
  travel_policy: string | null;
  priority_level: string | null;
  monthly_price: number;
  annual_price: number;
  stripe_monthly_price_id?: string | null;
  stripe_annual_price_id?: string | null;
  stripe_product_id?: string | null;
  stripe_test_monthly_price_id?: string | null;
  stripe_test_annual_price_id?: string | null;
  stripe_live_monthly_price_id?: string | null;
  stripe_live_annual_price_id?: string | null;
  stripe_test_product_id?: string | null;
  stripe_live_product_id?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ClientSubscription = {
  id: string;
  client_id: string | null;
  aircraft_id: string | null;
  plan_id: string | null;
  tier_id: string | null;
  status: string;
  billing_cadence: string;
  start_date: string;
  end_date: string | null;
  renewal_date: string | null;
  monthly_price: number;
  annual_price: number;
  custom_price: number | null;
  included_flights: number;
  included_mx_repositions: number;
  included_admin_hours: number;
  credit_balance: number;
  notes: string | null;
  created_by: string | null;
  plan_name?: string | null;
  plan_code?: string | null;
  tier_key?: string | null;
  amount_cents?: number | null;
  currency?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
  cancel_at_period_end?: boolean | null;
  canceled_at?: string | null;
  ended_at?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  stripe_product_id?: string | null;
  stripe_mode?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_checkout_url?: string | null;
  stripe_latest_invoice_id?: string | null;
  stripe_payment_status?: string | null;
  stripe_sync_status?: string | null;
  stripe_last_event_id?: string | null;
  stripe_last_event_type?: string | null;
  stripe_last_event_at?: string | null;
  stripe_last_synced_at?: string | null;
  stripe_sync_warning?: string | null;
  source?: string | null;
  ignored_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionUsageEvent = {
  id: string;
  subscription_id: string;
  client_id: string;
  mission_id: string | null;
  usage_type: string;
  quantity: number;
  unit: string | null;
  covered_quantity: number;
  overage_quantity: number;
  unit_rate: number;
  covered_amount: number;
  overage_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type SubscriptionCredit = {
  id: string;
  subscription_id: string;
  client_id: string;
  source_type: string;
  amount: number;
  description: string | null;
  expires_at: string | null;
  applied_to_invoice_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type SubscriptionBillingInvoice = {
  id: string;
  subscription_id: string | null;
  client_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_invoice_id: string;
  stripe_invoice_number: string | null;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string | null;
  payment_status: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StripeWebhookEventRow = {
  id: string;
  stripe_event_id: string;
  type: string;
  event_type?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_invoice_id?: string | null;
  portal_subscription_id?: string | null;
  received_at?: string | null;
  processed_at: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

export type MissionListItem = Mission & {
  aircraft: MiniAircraft | null;
  client: MiniProfile | null;
};

export type MissionDetail = Mission & {
  aircraft: Aircraft | null;
  client: MiniProfile | null;
  passengers: MissionPassenger[];
  crew: (CrewAssignment & { crew: MiniProfile | null })[];
  partners: (PartnerAssignment & { partner: MiniProfile | null })[];
  quotes: Quote[];
};

export type SubscriptionDetail = ClientSubscription & {
  client: MiniProfile | null;
  aircraft: MiniAircraft | null;
  plan: SubscriptionPlan | null;
  tier: SubscriptionPlanTier | null;
  usage: (SubscriptionUsageEvent & { mission: { id: string; ref: string } | null })[];
  credits: SubscriptionCredit[];
  billingInvoices: SubscriptionBillingInvoice[];
  stripeEvents: StripeWebhookEventRow[];
};

// ─── Aircraft ───────────────────────────────────────────────────────
export async function listAircraftForClient(
  clientId: string,
  options: { includeInactive?: boolean } = {}
): Promise<Aircraft[]> {
  const db = await createServiceClient();
  let q = db
    .from("aircraft")
    .select("*")
    .eq("client_id", clientId)
    .order("tail_number");
  if (!options.includeInactive) q = q.eq("status", "active");
  const { data } = await q;
  return data ?? [];
}

export async function listAllAircraft(): Promise<(Aircraft & { client: MiniProfile | null })[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("aircraft")
    .select("*, client:client_id(full_name,email,company_name)")
    .order("tail_number")
    .returns<(Aircraft & { client: MiniProfile | null })[]>();
  return data ?? [];
}

export async function getAircraft(id: string): Promise<Aircraft | null> {
  const db = await createServiceClient();
  const { data } = await db.from("aircraft").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

// ─── Missions ───────────────────────────────────────────────────────
const MISSION_LIST_SELECT =
  "*, aircraft:aircraft_id(tail_number,make,model), client:client_id(full_name,email,company_name)";

export async function listMissionsForClient(clientId: string): Promise<MissionListItem[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("missions")
    .select(MISSION_LIST_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .returns<MissionListItem[]>();
  return data ?? [];
}

export async function listAllMissions(filter?: {
  status?: string;
  statusIn?: string[];
  type?: string;
  limit?: number;
}): Promise<MissionListItem[]> {
  const db = await createServiceClient();
  let q = db.from("missions").select(MISSION_LIST_SELECT).order("created_at", { ascending: false });
  if (filter?.status) q = q.eq("status", filter.status);
  if (filter?.statusIn?.length) q = q.in("status", filter.statusIn);
  if (filter?.type) q = q.eq("mission_type", filter.type);
  if (filter?.limit) q = q.limit(filter.limit);
  const { data } = await q.returns<MissionListItem[]>();
  return data ?? [];
}

/** Missions a crew member is offered/assigned to. */
export async function listMissionsForCrew(crewId: string): Promise<
  (MissionListItem & { assignment_status: string | null })[]
> {
  const db = await createServiceClient();
  const { data: assignments } = await db
    .from("mission_crew_assignments")
    .select("mission_id, status")
    .eq("crew_id", crewId);
  const ids = (assignments ?? []).map((a) => a.mission_id);
  if (!ids.length) return [];
  const { data } = await db
    .from("missions")
    .select(MISSION_LIST_SELECT)
    .in("id", ids)
    .order("requested_departure", { ascending: true })
    .returns<MissionListItem[]>();
  const statusByMission = new Map((assignments ?? []).map((a) => [a.mission_id, a.status]));
  return (data ?? []).map((m) => ({
    ...m,
    assignment_status: statusByMission.get(m.id) ?? null,
  }));
}

/** Open-pool missions awaiting crew (no crew assigned yet). */
export async function listOpenPoolMissions(): Promise<MissionListItem[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("missions")
    .select(MISSION_LIST_SELECT)
    .is("assigned_crew_id", null)
    .in("status", ["submitted", "under_review", "approved", "quoted"])
    .order("requested_departure", { ascending: true })
    .returns<MissionListItem[]>();
  return data ?? [];
}

export async function getMissionDetail(id: string): Promise<MissionDetail | null> {
  const db = await createServiceClient();
  const { data: mission } = await db
    .from("missions")
    .select("*, aircraft:aircraft_id(*), client:client_id(full_name,email,company_name)")
    .eq("id", id)
    .maybeSingle()
    .returns<(Mission & { aircraft: Aircraft | null; client: MiniProfile | null }) | null>();
  if (!mission) return null;

  const [passengers, crew, partners, quotes] = await Promise.all([
    db.from("mission_passengers").select("*").eq("mission_id", id).order("created_at"),
    db
      .from("mission_crew_assignments")
      .select("*, crew:crew_id(full_name,email,company_name)")
      .eq("mission_id", id)
      .returns<(CrewAssignment & { crew: MiniProfile | null })[]>(),
    db
      .from("mission_partner_assignments")
      .select("*, partner:partner_id(full_name,email,company_name)")
      .eq("mission_id", id)
      .returns<(PartnerAssignment & { partner: MiniProfile | null })[]>(),
    db.from("quotes").select("*").eq("mission_id", id).order("created_at", { ascending: false }),
  ]);

  return {
    ...mission,
    passengers: passengers.data ?? [],
    crew: crew.data ?? [],
    partners: partners.data ?? [],
    quotes: quotes.data ?? [],
  };
}

// ─── Quotes ─────────────────────────────────────────────────────────
export async function listQuotesForClient(clientId: string): Promise<
  (Quote & { mission: { ref: string } | null })[]
> {
  const db = await createServiceClient();
  const { data } = await db
    .from("quotes")
    .select("*, mission:mission_id(ref)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .returns<(Quote & { mission: { ref: string } | null })[]>();
  return data ?? [];
}

export async function listAllQuotes(): Promise<
  (Quote & { mission: { ref: string } | null; client: MiniProfile | null })[]
> {
  const db = await createServiceClient();
  const { data } = await db
    .from("quotes")
    .select("*, mission:mission_id(ref), client:client_id(full_name,email,company_name)")
    .order("created_at", { ascending: false })
    .returns<(Quote & { mission: { ref: string } | null; client: MiniProfile | null })[]>();
  return data ?? [];
}

export async function getQuoteDetail(
  id: string
): Promise<
  | (Quote & {
      items: QuoteLineItem[];
      mission: { ref: string; id: string } | null;
      documents: BillingDocumentRow[];
      auditEvents: AuditEvent[];
    })
  | null
> {
  const db = await createServiceClient();
  const billingDb = db as any;
  const { data: quote } = await db
    .from("quotes")
    .select("*, mission:mission_id(id,ref)")
    .eq("id", id)
    .maybeSingle()
    .returns<(Quote & { mission: { ref: string; id: string } | null }) | null>();
  if (!quote) return null;
  const [items, documents, auditEvents] = await Promise.all([
    db.from("quote_line_items").select("*").eq("quote_id", id).order("sort_order"),
    billingDb.from("billing_documents").select("*").eq("quote_id", id).order("created_at", { ascending: false }),
    db.from("audit_events").select("*").eq("entity_type", "quote").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);
  return { ...quote, items: items.data ?? [], documents: documents.data ?? [], auditEvents: auditEvents.data ?? [] };
}

// Billing
export async function listAllInvoices(): Promise<
  (Invoice & {
    client: MiniProfile | null;
    mission: { ref: string } | null;
    quote: { ref: string } | null;
  })[]
> {
  const db = await createServiceClient();
  const { data } = await db
    .from("invoices")
    .select("*, client:client_id(full_name,email,company_name), mission:mission_id(ref), quote:quote_id(ref)")
    .order("created_at", { ascending: false })
    .returns<
      (Invoice & {
        client: MiniProfile | null;
        mission: { ref: string } | null;
        quote: { ref: string } | null;
      })[]
    >();
  return data ?? [];
}

export async function listInvoicesForClient(clientId: string): Promise<
  (Invoice & { mission: { ref: string } | null; quote: { ref: string } | null })[]
> {
  const db = await createServiceClient();
  const { data } = await db
    .from("invoices")
    .select("*, mission:mission_id(ref), quote:quote_id(ref)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .returns<(Invoice & { mission: { ref: string } | null; quote: { ref: string } | null })[]>();
  return data ?? [];
}

export async function getInvoiceDetail(
  id: string
): Promise<
  | (Invoice & {
      client: MiniProfile | null;
      mission: Mission | null;
      quote: Quote | null;
      items: InvoiceLineItem[];
      payments: Payment[];
      documents: BillingDocumentRow[];
      receiptDocuments: BillingDocumentRow[];
      auditEvents: AuditEvent[];
    })
  | null
> {
  const db = await createServiceClient();
  const billingDb = db as any;
  const { data: invoice } = await db
    .from("invoices")
    .select("*, client:client_id(full_name,email,company_name), mission:mission_id(*), quote:quote_id(*)")
    .eq("id", id)
    .maybeSingle()
    .returns<(Invoice & { client: MiniProfile | null; mission: Mission | null; quote: Quote | null }) | null>();
  if (!invoice) return null;
  const [items, payments, documents, receiptDocuments, auditEvents] = await Promise.all([
    db.from("invoice_line_items").select("*").eq("invoice_id", id).order("sort_order"),
    db.from("payments").select("*").eq("invoice_id", id).order("paid_at", { ascending: false }),
    billingDb.from("billing_documents").select("*").eq("invoice_id", id).eq("document_type", "invoice").order("created_at", { ascending: false }),
    billingDb.from("billing_documents").select("*").eq("invoice_id", id).eq("document_type", "receipt").order("created_at", { ascending: false }),
    db.from("audit_events").select("*").eq("entity_type", "invoice").eq("entity_id", id).order("created_at", { ascending: false }),
  ]);
  return {
    ...invoice,
    items: items.data ?? [],
    payments: payments.data ?? [],
    documents: documents.data ?? [],
    receiptDocuments: receiptDocuments.data ?? [],
    auditEvents: auditEvents.data ?? [],
  };
}

export async function listAllPayments(): Promise<
  (Payment & {
    invoice: (Invoice & { client: MiniProfile | null }) | null;
    receipt_document: BillingDocumentRow | null;
    recorded_by_profile: MiniProfile | null;
  })[]
> {
  const db = await createServiceClient();
  const billingDb = db as any;
  const { data: payments } = await billingDb
    .from("payments")
    .select("*, invoice:invoice_id(*, client:client_id(full_name,email,company_name)), recorded_by_profile:recorded_by(full_name,email,company_name)")
    .order("paid_at", { ascending: false });
  const ids = (payments ?? []).map((payment: Payment) => payment.id);
  const { data: documents } = ids.length
    ? await billingDb.from("billing_documents").select("*").eq("document_type", "receipt").in("payment_id", ids)
    : { data: [] };
  const byPayment = new Map((documents ?? []).map((document: BillingDocumentRow) => [document.payment_id, document]));
  return (payments ?? []).map((payment: any) => ({
    ...payment,
    receipt_document: byPayment.get(payment.id) ?? null,
  }));
}

export async function listAllReceipts(): Promise<
  (BillingDocumentRow & {
    payment: (Payment & { invoice: (Invoice & { client: MiniProfile | null }) | null }) | null;
  })[]
> {
  const db = (await createServiceClient()) as any;
  const { data: documents } = await db
    .from("billing_documents")
    .select("*, payment:payment_id(*, invoice:invoice_id(*, client:client_id(full_name,email,company_name)))")
    .eq("document_type", "receipt")
    .order("created_at", { ascending: false });
  return documents ?? [];
}

// ─── Subscriptions ─────────────────────────────────────────────────
export async function listSubscriptionPlans(): Promise<(SubscriptionPlan & { tiers: SubscriptionPlanTier[] })[]> {
  const db = (await createServiceClient()) as any;
  const [plansResult, tiersResult] = await Promise.all([
    db.from("subscription_plans").select("*").order("name"),
    db.from("subscription_plan_tiers").select("*").order("sort_order"),
  ]);
  const tiersByPlan = new Map<string, SubscriptionPlanTier[]>();
  for (const tier of tiersResult.data ?? []) {
    const list = tiersByPlan.get(tier.plan_id) ?? [];
    list.push(tier);
    tiersByPlan.set(tier.plan_id, list);
  }
  return (plansResult.data ?? []).map((plan: SubscriptionPlan) => ({
    ...plan,
    tiers: tiersByPlan.get(plan.id) ?? [],
  }));
}

export async function listAllSubscriptions(): Promise<
  (ClientSubscription & {
    client: MiniProfile | null;
    aircraft: MiniAircraft | null;
    plan: SubscriptionPlan | null;
    tier: SubscriptionPlanTier | null;
  })[]
> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("client_subscriptions")
    .select("*, client:client_id(full_name,email,company_name), aircraft:aircraft_id(tail_number,make,model), plan:plan_id(*), tier:tier_id(*)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listSubscriptionsForClient(clientId: string): Promise<
  (ClientSubscription & {
    aircraft: MiniAircraft | null;
    plan: SubscriptionPlan | null;
    tier: SubscriptionPlanTier | null;
  })[]
> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("client_subscriptions")
    .select("*, aircraft:aircraft_id(tail_number,make,model), plan:plan_id(*), tier:tier_id(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSubscriptionDetail(id: string): Promise<SubscriptionDetail | null> {
  const db = (await createServiceClient()) as any;
  const { data: subscription } = await db
    .from("client_subscriptions")
    .select("*, client:client_id(full_name,email,company_name), aircraft:aircraft_id(tail_number,make,model), plan:plan_id(*), tier:tier_id(*)")
    .eq("id", id)
    .maybeSingle();
  if (!subscription) return null;
  const [usage, credits, billingInvoices, stripeEvents] = await Promise.all([
    db
      .from("subscription_usage_events")
      .select("*, mission:mission_id(id,ref)")
      .eq("subscription_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("subscription_credits")
      .select("*")
      .eq("subscription_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("subscription_billing_invoices")
      .select("*")
      .eq("subscription_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("stripe_webhook_events")
      .select("*")
      .eq("portal_subscription_id", id)
      .order("created_at", { ascending: false }),
  ]);
  return {
    ...subscription,
    usage: usage.data ?? [],
    credits: credits.data ?? [],
    billingInvoices: billingInvoices.data ?? [],
    stripeEvents: stripeEvents.data ?? [],
  };
}

export async function listStripeSubscriptionEvents(): Promise<StripeWebhookEventRow[]> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("stripe_webhook_events")
    .select("*")
    .or("stripe_subscription_id.not.is.null,portal_subscription_id.not.is.null")
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function getSubscriptionOverageTotal(): Promise<number> {
  const db = (await createServiceClient()) as any;
  const { data } = await db
    .from("subscription_usage_events")
    .select("overage_amount")
    .gt("overage_amount", 0);
  return (data ?? []).reduce((sum: number, event: { overage_amount: number | string | null }) => {
    return sum + Number(event.overage_amount ?? 0);
  }, 0);
}

// ─── Expenses ───────────────────────────────────────────────────────
export async function listExpensesForCrew(crewId: string): Promise<
  (Expense & { mission: { ref: string } | null })[]
> {
  const db = await createServiceClient();
  const { data } = await db
    .from("expenses")
    .select("*, mission:mission_id(ref)")
    .eq("crew_id", crewId)
    .order("expense_date", { ascending: false })
    .returns<(Expense & { mission: { ref: string } | null })[]>();
  return data ?? [];
}

export async function listAllExpenses(): Promise<
  (Expense & { mission: { ref: string } | null; crew: MiniProfile | null })[]
> {
  const db = await createServiceClient();
  const { data } = await db
    .from("expenses")
    .select("*, mission:mission_id(ref), crew:crew_id(full_name,email,company_name)")
    .order("created_at", { ascending: false })
    .returns<(Expense & { mission: { ref: string } | null; crew: MiniProfile | null })[]>();
  return data ?? [];
}

// ─── Documents ──────────────────────────────────────────────────────
export type DocumentFilters = {
  status?: string;
  visibility?: string;
  role?: string;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export async function listAllDocuments(filters: DocumentFilters = {}): Promise<DocumentRow[]> {
  const db = await createServiceClient();
  let q = db.from("documents").select("*").order("created_at", { ascending: false });
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.visibility) q = q.eq("visibility", filters.visibility);
  if (filters.role) q = q.eq("scope_type", filters.role);
  if (filters.dateFrom) q = q.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) q = q.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
  if (filters.search) q = q.ilike("name", `%${filters.search}%`);
  const { data } = await q;
  const docs = data ?? [];
  if (!filters.ownerId) return docs;
  return docs.filter((document) => document.scope_id === filters.ownerId || document.uploaded_by === filters.ownerId);
}

/** Documents visible to a non-admin role. */
export async function listDocumentsForUser(params: {
  userId: string;
  role: string;
}): Promise<DocumentRow[]> {
  const db = await createServiceClient();
  const all = await listAllDocuments();
  if (params.role === "admin") return all;
  return all.filter((d) => {
    if (d.visibility === "public") return true;
    if (d.uploaded_by === params.userId) return true;
    if (d.scope_id === params.userId) return true;
    if (params.role === "client" && d.visibility === "owner") return false;
    if (d.visibility === params.role) return d.scope_id === params.userId;
    return false;
  });
}

// ─── Crew ───────────────────────────────────────────────────────────
export async function getCrewProfile(crewId: string): Promise<CrewProfile | null> {
  const db = await createServiceClient();
  const { data } = await db.from("crew_profiles").select("*").eq("id", crewId).maybeSingle();
  return data ?? null;
}

export async function listCredentials(crewId: string): Promise<CrewCredential[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("crew_credentials")
    .select("*")
    .eq("crew_id", crewId)
    .order("created_at");
  return data ?? [];
}

export async function listAvailability(crewId: string): Promise<CrewAvailability[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("crew_availability")
    .select("*")
    .eq("crew_id", crewId)
    .order("start_date");
  return data ?? [];
}

export async function listAllCrew(): Promise<AdminCrewProfile[]> {
  const db = await createServiceClient();
  return listAdminCrewProfiles(db);
}

export async function listAllCredentials(): Promise<
  (CrewCredential & { crew: MiniProfile | null })[]
> {
  const db = await createServiceClient();
  const { data } = await db
    .from("crew_credentials")
    .select("*, crew:crew_id(full_name,email,company_name)")
    .order("expiration_date", { ascending: true, nullsFirst: false })
    .returns<(CrewCredential & { crew: MiniProfile | null })[]>();
  return data ?? [];
}

// ─── Partners ───────────────────────────────────────────────────────
export async function getPartnerProfile(partnerId: string): Promise<PartnerProfile | null> {
  const db = await createServiceClient();
  const { data } = await db.from("partner_profiles").select("*").eq("id", partnerId).maybeSingle();
  return data ?? null;
}

export async function listPartnerAssignments(
  partnerId: string
): Promise<(PartnerAssignment & { mission: { ref: string } | null })[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("mission_partner_assignments")
    .select("*, mission:mission_id(ref)")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false })
    .returns<(PartnerAssignment & { mission: { ref: string } | null })[]>();
  return data ?? [];
}

export async function getPartnerAssignment(
  id: string
): Promise<(PartnerAssignment & { mission: Mission | null }) | null> {
  const db = await createServiceClient();
  const { data } = await db
    .from("mission_partner_assignments")
    .select("*, mission:mission_id(*)")
    .eq("id", id)
    .maybeSingle()
    .returns<(PartnerAssignment & { mission: Mission | null }) | null>();
  return data ?? null;
}

export async function listAllPartnerAssignments(): Promise<
  (PartnerAssignment & { mission: { ref: string } | null; partner: MiniProfile | null })[]
> {
  const db = await createServiceClient();
  const { data } = await db
    .from("mission_partner_assignments")
    .select("*, mission:mission_id(ref), partner:partner_id(full_name,email,company_name)")
    .order("created_at", { ascending: false })
    .returns<
      (PartnerAssignment & { mission: { ref: string } | null; partner: MiniProfile | null })[]
    >();
  return data ?? [];
}

export async function listAllPartners(): Promise<
  (Profile & { partner_profile: PartnerProfile | null })[]
> {
  const db = await createServiceClient();
  const { data: profiles } = await db
    .from("profiles")
    .select("*")
    .eq("role", "partner")
    .order("full_name");
  const ids = (profiles ?? []).map((p) => p.id);
  const { data: partnerProfiles } = ids.length
    ? await db.from("partner_profiles").select("*").in("id", ids)
    : { data: [] as PartnerProfile[] };
  const byId = new Map((partnerProfiles ?? []).map((c) => [c.id, c]));
  return (profiles ?? []).map((p) => ({ ...p, partner_profile: byId.get(p.id) ?? null }));
}

// ─── Profiles / users ───────────────────────────────────────────────
export async function listClients(): Promise<Profile[]> {
  const db = await createServiceClient();
  const { data } = await db.from("profiles").select("*").eq("role", "client").order("full_name");
  return data ?? [];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const db = await createServiceClient();
  const { data } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listPendingUsers(): Promise<Profile[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("profiles")
    .select("*")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listWaitlistedUsers(): Promise<Profile[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("profiles")
    .select("*")
    .eq("status", "waitlisted")
    .order("status_updated_at", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listAllUsers(filter?: { status?: string }): Promise<Profile[]> {
  const db = await createServiceClient();
  let query = db
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);

  const { data } = await query;
  return data ?? [];
}

// ─── Messaging ──────────────────────────────────────────────────────
export type ThreadSummary = MessageThread & {
  members: string[];
  last_body: string | null;
};

export async function listThreadsForUser(userId: string, isAdmin: boolean): Promise<ThreadSummary[]> {
  const db = await createServiceClient();
  let threadIds: string[] | null = null;
  if (!isAdmin) {
    const { data: memberships } = await db
      .from("thread_members")
      .select("thread_id")
      .eq("profile_id", userId);
    threadIds = (memberships ?? []).map((m) => m.thread_id);
    if (!threadIds.length) return [];
  }
  let q = db.from("message_threads").select("*").order("last_message_at", { ascending: false });
  if (threadIds) q = q.in("id", threadIds);
  const { data: threads } = await q;
  if (!threads?.length) return [];
  const { data: lastMessages } = await db
    .from("messages")
    .select("thread_id, body, created_at")
    .in(
      "thread_id",
      threads.map((t) => t.id)
    )
    .order("created_at", { ascending: false });
  const lastByThread = new Map<string, string>();
  for (const m of lastMessages ?? []) {
    if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m.body);
  }
  return threads.map((t) => ({
    ...t,
    members: [],
    last_body: lastByThread.get(t.id) ?? null,
  }));
}

export async function getThreadWithMessages(
  threadId: string
): Promise<{ thread: MessageThread; messages: (Message & { sender: MiniProfile | null })[] } | null> {
  const db = await createServiceClient();
  const { data: thread } = await db
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) return null;
  const { data: messages } = await db
    .from("messages")
    .select("*, sender:sender_id(full_name,email,company_name)")
    .eq("thread_id", threadId)
    .order("created_at")
    .returns<(Message & { sender: MiniProfile | null })[]>();
  return { thread, messages: messages ?? [] };
}

export async function isThreadMember(threadId: string, userId: string): Promise<boolean> {
  const db = await createServiceClient();
  const { data } = await db
    .from("thread_members")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("profile_id", userId)
    .maybeSingle();
  return Boolean(data);
}

// ─── Notifications ──────────────────────────────────────────────────
export async function listNotifications(userId: string): Promise<NotificationRow[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function countUnread(userId: string): Promise<number> {
  const db = await createServiceClient();
  const { count } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = await createServiceClient();
  await db.from("notifications").update({ is_read: true }).in("id", ids);
}

// ─── Audit ──────────────────────────────────────────────────────────
export async function listAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ─── Admin metrics ──────────────────────────────────────────────────
export async function getAdminMetrics() {
  const db = await createServiceClient();

  const [
    missionsActive,
    missionsSubmitted,
    pendingUsers,
    pendingDocs,
    pendingExpenses,
    crewCount,
    activeSubscriptions,
    subscriptionOverages,
    newFormSubmissions,
    openInvoices,
  ] = await Promise.all([
    db
      .from("missions")
      .select("id", { count: "exact", head: true })
      .in("status", ["approved", "crew_assigned", "scheduled", "in_progress"]),
    db.from("missions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    db.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    db.from("expenses").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "crew"),
    (db as any).from("client_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    (db as any).from("subscription_usage_events").select("id", { count: "exact", head: true }).gt("overage_amount", 0),
    (db as any)
      .from("contact_form_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "new")
      .neq("submission_type", "support_request"),
    db.from("invoices").select("id", { count: "exact", head: true }).in("status", ["sent", "viewed", "overdue", "partially_paid"]),
  ]);

  return {
    activeMissions: missionsActive.count ?? 0,
    submittedMissions: missionsSubmitted.count ?? 0,
    pendingUsers: pendingUsers.count ?? 0,
    pendingDocuments: pendingDocs.count ?? 0,
    pendingExpenses: pendingExpenses.count ?? 0,
    crewCount: crewCount.count ?? 0,
    activeSubscriptions: activeSubscriptions.count ?? 0,
    subscriptionOverages: subscriptionOverages.count ?? 0,
    newFormSubmissions: newFormSubmissions.count ?? 0,
    openInvoices: openInvoices.count ?? 0,
  };
}
