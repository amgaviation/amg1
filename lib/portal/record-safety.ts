import "server-only";

type PortalDb = any;

export type RecordDependency = {
  label: string;
  count: number;
};

function plural(label: string, count: number) {
  if (count === 1) return label;
  if (label === "aircraft") return "aircraft";
  if (label.endsWith("y")) return `${label.slice(0, -1)}ies`;
  return `${label}s`;
}

export function dependencySummaryText(dependencies: RecordDependency[]) {
  const active = dependencies.filter((item) => item.count > 0);
  if (!active.length) return "No linked operational records were found.";
  return active.map((item) => `${item.count} ${plural(item.label, item.count)}`).join(", ");
}

export function dependencyAuditDetail(dependencies: RecordDependency[]) {
  const summary = dependencySummaryText(dependencies);
  return summary === "No linked operational records were found." ? "No linked records found" : `Linked records preserved: ${summary}`;
}

export function dependencyConfirmMessage({
  action,
  entity,
  dependencies,
  fallback,
}: {
  action: string;
  entity: string;
  dependencies: RecordDependency[];
  fallback: string;
}) {
  const active = dependencies.filter((item) => item.count > 0);
  if (!active.length) return fallback;
  return `${action} this ${entity}? Linked records will be preserved: ${dependencySummaryText(active)}. This is a soft action and historical records remain available to authorized admins.`;
}

async function countByColumn(db: PortalDb, table: string, column: string, value: string): Promise<number> {
  try {
    const { count, error } = await db
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(column, value);
    if (error) {
      console.warn(`[record-safety] ${table}.${column} count failed`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.warn(`[record-safety] ${table}.${column} count failed`, error);
    return 0;
  }
}

async function countByOr(db: PortalDb, table: string, expression: string): Promise<number> {
  try {
    const { count, error } = await db
      .from(table)
      .select("id", { count: "exact", head: true })
      .or(expression);
    if (error) {
      console.warn(`[record-safety] ${table} OR count failed`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.warn(`[record-safety] ${table} OR count failed`, error);
    return 0;
  }
}

export async function summarizeClientDependencies(db: PortalDb, clientId: string): Promise<RecordDependency[]> {
  const [
    aircraft,
    missions,
    quotes,
    invoices,
    subscriptions,
    billingDocuments,
    documents,
    communicationThreads,
  ] = await Promise.all([
    countByColumn(db, "aircraft", "client_id", clientId),
    countByColumn(db, "missions", "client_id", clientId),
    countByColumn(db, "quotes", "client_id", clientId),
    countByColumn(db, "invoices", "client_id", clientId),
    countByColumn(db, "client_subscriptions", "client_id", clientId),
    countByColumn(db, "billing_documents", "client_id", clientId),
    countByOr(db, "documents", `scope_id.eq.${clientId},uploaded_by.eq.${clientId}`),
    countByColumn(db, "communication_threads", "related_client_id", clientId),
  ]);

  return [
    { label: "aircraft", count: aircraft },
    { label: "mission", count: missions },
    { label: "quote", count: quotes },
    { label: "invoice", count: invoices },
    { label: "subscription", count: subscriptions },
    { label: "billing document", count: billingDocuments },
    { label: "document", count: documents },
    { label: "communication thread", count: communicationThreads },
  ];
}

export async function summarizeCrewDependencies(db: PortalDb, crewId: string): Promise<RecordDependency[]> {
  const [assignments, credentials, documents, expenses, participants, messages] = await Promise.all([
    countByColumn(db, "mission_crew_assignments", "crew_id", crewId),
    countByColumn(db, "crew_credentials", "crew_id", crewId),
    countByOr(db, "documents", `scope_id.eq.${crewId},uploaded_by.eq.${crewId}`),
    countByColumn(db, "expenses", "crew_id", crewId),
    countByColumn(db, "communication_participants", "crew_id", crewId),
    countByOr(db, "communication_messages", `sent_by_user_id.eq.${crewId},created_by_user_id.eq.${crewId}`),
  ]);

  return [
    { label: "crew assignment", count: assignments },
    { label: "credential", count: credentials },
    { label: "document", count: documents },
    { label: "expense", count: expenses },
    { label: "communication participant", count: participants },
    { label: "message", count: messages },
  ];
}

export async function summarizePartnerDependencies(db: PortalDb, partnerId: string): Promise<RecordDependency[]> {
  const [assignments, documents, participants] = await Promise.all([
    countByColumn(db, "mission_partner_assignments", "partner_id", partnerId),
    countByOr(db, "documents", `scope_id.eq.${partnerId},uploaded_by.eq.${partnerId}`),
    countByColumn(db, "communication_participants", "user_id", partnerId),
  ]);

  return [
    { label: "partner assignment", count: assignments },
    { label: "document", count: documents },
    { label: "communication participant", count: participants },
  ];
}

export async function summarizeAircraftDependencies(db: PortalDb, aircraftId: string): Promise<RecordDependency[]> {
  const [missions, quotes, invoices, documents, communicationThreads] = await Promise.all([
    countByColumn(db, "missions", "aircraft_id", aircraftId),
    countByColumn(db, "quotes", "aircraft_id", aircraftId),
    countByColumn(db, "invoices", "aircraft_id", aircraftId),
    countByColumn(db, "documents", "scope_id", aircraftId),
    countByColumn(db, "communication_threads", "related_aircraft_id", aircraftId),
  ]);

  return [
    { label: "mission", count: missions },
    { label: "quote", count: quotes },
    { label: "invoice", count: invoices },
    { label: "document", count: documents },
    { label: "communication thread", count: communicationThreads },
  ];
}

export async function summarizeProfileDependencies(
  db: PortalDb,
  profileId: string,
  role?: string | null
): Promise<RecordDependency[]> {
  const roleDependencies =
    role === "client"
      ? await summarizeClientDependencies(db, profileId)
      : role === "crew"
        ? await summarizeCrewDependencies(db, profileId)
        : role === "partner"
          ? await summarizePartnerDependencies(db, profileId)
          : [];

  const [notifications, auditEvents, communicationThreads, messages] = await Promise.all([
    countByColumn(db, "notifications", "user_id", profileId),
    countByColumn(db, "audit_events", "actor_id", profileId),
    countByOr(db, "communication_threads", `assigned_to_user_id.eq.${profileId},created_by_user_id.eq.${profileId}`),
    countByOr(db, "communication_messages", `sent_by_user_id.eq.${profileId},created_by_user_id.eq.${profileId}`),
  ]);

  return [
    ...roleDependencies,
    { label: "notification", count: notifications },
    { label: "audit event", count: auditEvents },
    { label: "communication thread", count: communicationThreads },
    { label: "message", count: messages },
  ];
}
