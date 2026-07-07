import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { MISSION_FLOW_STAGES } from "@/lib/portal/constants";

/**
 * Mission lifecycle state machine + operational gates.
 *
 * Two business rules from the AMG ops plan are enforced here:
 *  1. MOVEMENT GATE — insurance must be confirmed (and credentials current)
 *     for every crew member before a mission moves into crew_assigned,
 *     scheduled, or in_progress.
 *  2. CLOSEOUT GATE — a mission cannot be completed without a linked,
 *     non-void invoice; missing payments/documents surface as warnings.
 *
 * Blockers stop a transition unless an admin records an explicit override
 * reason (audited as "mission_gate_overridden" + admin notification), so ops
 * is never hard-blocked in an emergency. Warnings never block.
 */

export type MissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_client_info"
  | "quoted"
  | "approved"
  | "crew_assigned"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

type Db = Awaited<ReturnType<typeof createServiceClient>>;

/**
 * The real operational flow. Forward steps follow the Mission Control
 * pipeline (Intake → Quote → Crew & Schedule → In Flight → Completed);
 * limited backward steps let ops unwind a schedule; cancel is reachable
 * from every non-terminal status. Terminal statuses go nowhere.
 */
export const LEGAL_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review", "cancelled"],
  under_review: ["awaiting_client_info", "quoted", "cancelled"],
  awaiting_client_info: ["under_review", "cancelled"],
  quoted: ["approved", "under_review", "cancelled"],
  approved: ["crew_assigned", "cancelled"],
  crew_assigned: ["scheduled", "approved", "cancelled"],
  scheduled: ["in_progress", "crew_assigned", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const TERMINAL_MISSION_STATUSES: MissionStatus[] = ["completed", "cancelled"];

/** An override reason shorter than this is treated as absent. */
export const MIN_GATE_OVERRIDE_REASON_LENGTH = 10;

/** Statuses that mean crew/aircraft movement is committed — insurance gate applies. */
export const MOVEMENT_STATUSES: MissionStatus[] = ["crew_assigned", "scheduled", "in_progress"];

export function isMissionStatus(value: unknown): value is MissionStatus {
  return typeof value === "string" && value in LEGAL_TRANSITIONS;
}

export function isTerminalMissionStatus(value: string): boolean {
  return TERMINAL_MISSION_STATUSES.includes(value as MissionStatus);
}

/** Unknown statuses fail closed: only mapped from→to pairs are legal. */
export function canTransition(from: string, to: string): boolean {
  if (!isMissionStatus(from) || !isMissionStatus(to)) return false;
  return LEGAL_TRANSITIONS[from].includes(to);
}

/** Which named gate guards a target status (drives ?gate=… error codes + copy). */
export function gateNameFor(targetStatus: string): "movement" | "closeout" | null {
  if (MOVEMENT_STATUSES.includes(targetStatus as MissionStatus)) return "movement";
  if (targetStatus === "completed") return "closeout";
  return null;
}

/**
 * Happy-path pipeline order, derived from MISSION_FLOW_STAGES plus the
 * terminal "completed". awaiting_client_info is a hold state inside Intake
 * (its natural exit is back to under_review), not a forward step.
 */
const HAPPY_PATH: string[] = [
  ...MISSION_FLOW_STAGES.flatMap((stage) =>
    stage.statuses.filter((status) => status !== "awaiting_client_info")
  ),
  "completed",
];

/** The next natural (forward) transition for a status; null once terminal. */
export function nextNaturalStatus(current: string): MissionStatus | null {
  if (current === "draft") return "submitted";
  if (current === "awaiting_client_info") return "under_review";
  const index = HAPPY_PATH.indexOf(current);
  if (index === -1 || index === HAPPY_PATH.length - 1) return null;
  return HAPPY_PATH[index + 1] as MissionStatus;
}

// ─── Crew compliance (insurance + credentials) ─────────────────────

export type CrewComplianceIssue = {
  crewId: string;
  name: string;
  problems: string[];
};

/** Assignment rows that commit a crew member to the mission. */
const ACTIVE_ASSIGNMENT_STATUSES = ["offered", "accepted"];

/**
 * Insurance + credential check for a set of crew members. FAILS CLOSED: a
 * missing crew profile counts as not insurance-approved. Credential blockers
 * are limited to rows already marked status="expired" — "expiring" stays a
 * ramp warning elsewhere, never a gate.
 */
export async function listCrewComplianceIssues(
  db: Db,
  crewIds: string[]
): Promise<CrewComplianceIssue[]> {
  const ids = [...new Set(crewIds.filter(Boolean))];
  if (!ids.length) return [];

  const [profilesRes, crewProfilesRes, credentialsRes] = await Promise.all([
    db.from("profiles").select("id, full_name, email").in("id", ids),
    db.from("crew_profiles").select("id, insurance_approved").in("id", ids),
    db
      .from("crew_credentials")
      .select("crew_id, credential_type")
      .in("crew_id", ids)
      .eq("status", "expired"),
  ]);

  const nameById = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p.full_name || p.email || p.id])
  );
  const insuranceById = new Map(
    (crewProfilesRes.data ?? []).map((p) => [p.id, p.insurance_approved])
  );
  const expiredByCrew = new Map<string, string[]>();
  for (const row of credentialsRes.data ?? []) {
    const list = expiredByCrew.get(row.crew_id) ?? [];
    if (!list.includes(row.credential_type)) list.push(row.credential_type);
    expiredByCrew.set(row.crew_id, list);
  }

  const issues: CrewComplianceIssue[] = [];
  for (const id of ids) {
    const problems: string[] = [];
    if (insuranceById.get(id) !== true) problems.push("insurance not approved");
    const expired = expiredByCrew.get(id);
    if (expired?.length) {
      problems.push(`expired credential${expired.length > 1 ? "s" : ""}: ${expired.join(", ")}`);
    }
    if (problems.length) issues.push({ crewId: id, name: nameById.get(id) ?? id, problems });
  }
  return issues;
}

/** One blocker line per non-compliant crew member, by name. */
export function formatCrewComplianceBlockers(issues: CrewComplianceIssue[]): string[] {
  return issues.map((issue) => `${issue.name} — ${issue.problems.join("; ")}`);
}

/** Page-friendly wrapper (creates its own service client, pool.ts-style). */
export async function getCrewComplianceIssues(crewIds: string[]): Promise<CrewComplianceIssue[]> {
  if (!crewIds.length) return [];
  const db = await createServiceClient();
  return listCrewComplianceIssues(db, crewIds);
}

// ─── Gate evaluation ────────────────────────────────────────────────

export type MissionGateResult = {
  /** Stop the transition unless explicitly overridden (audited). */
  blockers: string[];
  /** Surfaced to ops and recorded in the audit detail; never block. */
  warnings: string[];
};

/**
 * Evaluate the movement + closeout gates for a proposed target status.
 * Statuses outside the gated set (including "cancelled") always come back
 * clean — cancel must never be gate-blocked.
 */
export async function checkMissionGates(
  db: Db,
  missionId: string,
  targetStatus: string
): Promise<MissionGateResult> {
  const blockers: string[] = [];
  const warnings: string[] = [];

  // MOVEMENT GATE: every committed crew member must be insurance-approved
  // with no expired credentials before the mission moves.
  if (MOVEMENT_STATUSES.includes(targetStatus as MissionStatus)) {
    const [assignmentsRes, missionRes] = await Promise.all([
      db
        .from("mission_crew_assignments")
        .select("crew_id")
        .eq("mission_id", missionId)
        .in("status", ACTIVE_ASSIGNMENT_STATUSES),
      db.from("missions").select("assigned_crew_id").eq("id", missionId).maybeSingle(),
    ]);
    const crewIds = [
      ...(assignmentsRes.data ?? []).map((a) => a.crew_id),
      ...(missionRes.data?.assigned_crew_id ? [missionRes.data.assigned_crew_id] : []),
    ];
    const issues = await listCrewComplianceIssues(db, crewIds);
    blockers.push(...formatCrewComplianceBlockers(issues));
  }

  // CLOSEOUT GATE: completion requires a linked non-void invoice; missing
  // payments and missing mission documents are warn-level only.
  if (targetStatus === "completed") {
    const { data: invoices } = await db
      .from("invoices")
      .select("id")
      .eq("mission_id", missionId)
      .neq("status", "void");
    if (!invoices?.length) {
      blockers.push("No invoice is linked to this mission — closeout requires a non-void invoice.");
    } else {
      const { data: payments } = await db
        .from("payments")
        .select("id")
        .in(
          "invoice_id",
          invoices.map((invoice) => invoice.id)
        )
        .limit(1);
      if (!payments?.length) {
        warnings.push("No payments recorded yet on the linked invoice(s).");
      }
    }

    const { data: documents } = await db
      .from("documents")
      .select("id")
      .eq("mission_id", missionId)
      .limit(1);
    if (!documents?.length) {
      warnings.push("No documents (agreement / receipts) are linked to this mission.");
    }
  }

  return { blockers, warnings };
}

// ─── Readiness (admin trip detail panel) ────────────────────────────

export type MissionReadiness = {
  /** The next natural forward step, or null when the mission is terminal. */
  nextStatus: MissionStatus | null;
  blockers: string[];
  warnings: string[];
};

/**
 * Gate state for a mission's next natural transition — what the admin trip
 * detail Readiness panel renders. Terminal missions have nothing to check.
 */
export async function getMissionReadiness(
  missionId: string,
  currentStatus: string
): Promise<MissionReadiness> {
  const nextStatus = nextNaturalStatus(currentStatus);
  if (!nextStatus) return { nextStatus: null, blockers: [], warnings: [] };
  const db = await createServiceClient();
  const gates = await checkMissionGates(db, missionId, nextStatus);
  return { nextStatus, ...gates };
}
