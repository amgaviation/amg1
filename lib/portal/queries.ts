import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
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
  type?: string;
}): Promise<MissionListItem[]> {
  const db = await createServiceClient();
  let q = db.from("missions").select(MISSION_LIST_SELECT).order("created_at", { ascending: false });
  if (filter?.status) q = q.eq("status", filter.status);
  if (filter?.type) q = q.eq("mission_type", filter.type);
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
): Promise<(Quote & { items: QuoteLineItem[]; mission: { ref: string; id: string } | null }) | null> {
  const db = await createServiceClient();
  const { data: quote } = await db
    .from("quotes")
    .select("*, mission:mission_id(id,ref)")
    .eq("id", id)
    .maybeSingle()
    .returns<(Quote & { mission: { ref: string; id: string } | null }) | null>();
  if (!quote) return null;
  const { data: items } = await db
    .from("quote_line_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort_order");
  return { ...quote, items: items ?? [] };
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
export async function listAllDocuments(): Promise<DocumentRow[]> {
  const db = await createServiceClient();
  const { data } = await db.from("documents").select("*").order("created_at", { ascending: false });
  return data ?? [];
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
    if (d.visibility === "owner") return d.uploaded_by === params.userId || params.role === "client";
    if (d.visibility === params.role) return true;
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

export async function listAllCrew(): Promise<
  (Profile & { crew_profile: CrewProfile | null })[]
> {
  const db = await createServiceClient();
  const { data: profiles } = await db
    .from("profiles")
    .select("*")
    .eq("role", "crew")
    .order("full_name");
  const ids = (profiles ?? []).map((p) => p.id);
  const { data: crewProfiles } = ids.length
    ? await db.from("crew_profiles").select("*").in("id", ids)
    : { data: [] as CrewProfile[] };
  const byId = new Map((crewProfiles ?? []).map((c) => [c.id, c]));
  return (profiles ?? []).map((p) => ({ ...p, crew_profile: byId.get(p.id) ?? null }));
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

export async function listPendingUsers(): Promise<Profile[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listAllUsers(): Promise<Profile[]> {
  const db = await createServiceClient();
  const { data } = await db
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
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

  const [missionsActive, missionsSubmitted, pendingUsers, pendingDocs, pendingExpenses, crewCount] =
    await Promise.all([
      db
        .from("missions")
        .select("id", { count: "exact", head: true })
        .in("status", ["approved", "crew_assigned", "scheduled", "in_progress"]),
      db.from("missions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      db.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
      db.from("expenses").select("id", { count: "exact", head: true }).eq("status", "submitted"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "crew"),
    ]);

  return {
    activeMissions: missionsActive.count ?? 0,
    submittedMissions: missionsSubmitted.count ?? 0,
    pendingUsers: pendingUsers.count ?? 0,
    pendingDocuments: pendingDocs.count ?? 0,
    pendingExpenses: pendingExpenses.count ?? 0,
    crewCount: crewCount.count ?? 0,
  };
}
