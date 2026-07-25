import "server-only";

/**
 * Permitted status flow for a partner's assignment on a mission, mirroring
 * LEGAL_TRANSITIONS in mission-lifecycle.ts.
 *
 * Partner actions are self-service — a vendor drives their own row — so unlike
 * the mission map, which only admins write, nothing here is backstopped by an
 * admin's judgement. Without a map, membership in the PARTNER_STATUS vocabulary
 * was the only check, which accepted `completed → quoted` and
 * `declined → accepted` alike.
 */
export type PartnerAssignmentStatus =
  | "assigned"
  | "accepted"
  | "declined"
  | "quoted"
  | "in_progress"
  | "completed"
  | "cancelled";

/**
 * assigned → the partner responds (accept/decline) or prices the work.
 * quoted ↔ accepted, because a quote can be accepted and a partner may still
 * revise before work starts (see PARTNER_REQUOTABLE_STATUSES).
 * Declined and the two terminal states go nowhere: reopening a finished or
 * refused job is an admin's call, made by reassigning, not the vendor's.
 */
export const PARTNER_LEGAL_TRANSITIONS: Record<PartnerAssignmentStatus, PartnerAssignmentStatus[]> = {
  assigned: ["accepted", "declined", "quoted", "cancelled"],
  quoted: ["accepted", "declined", "cancelled"],
  accepted: ["in_progress", "quoted", "cancelled"],
  in_progress: ["completed", "cancelled"],
  declined: [],
  completed: [],
  cancelled: [],
};

/**
 * Statuses from which a partner may still (re)submit a price.
 *
 * Deliberately excludes in_progress, completed, declined and cancelled: once
 * work is underway the number is what the parties agreed to, and re-pricing
 * mid-job is a renegotiation an admin should broker. Without this, a shop could
 * accept a $2,000 job, do the work, then re-post the quote at $6,000 — the
 * write carried no precondition beyond `partner_id`, so it landed silently and
 * reset the row to "quoted".
 */
export const PARTNER_REQUOTABLE_STATUSES: PartnerAssignmentStatus[] = ["assigned", "quoted", "accepted"];

export function isPartnerAssignmentStatus(value: unknown): value is PartnerAssignmentStatus {
  return typeof value === "string" && value in PARTNER_LEGAL_TRANSITIONS;
}

/** Unknown statuses fail closed: only mapped from→to pairs are legal. */
export function canPartnerTransition(from: string, to: string): boolean {
  if (!isPartnerAssignmentStatus(from) || !isPartnerAssignmentStatus(to)) return false;
  return PARTNER_LEGAL_TRANSITIONS[from].includes(to);
}

export function canPartnerRequote(from: string): boolean {
  return isPartnerAssignmentStatus(from) && PARTNER_REQUOTABLE_STATUSES.includes(from);
}
