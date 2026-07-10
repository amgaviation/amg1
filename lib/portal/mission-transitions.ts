/**
 * Presentation vocabulary for support-request status transitions.
 * Pure data — the legal transition map and its enforcement live in
 * lib/portal/mission-lifecycle.ts and app/portal/actions/missions.ts;
 * this file only says how each legal move is offered to an operator.
 */

export type TransitionKind = "forward" | "back" | "hold" | "cancel";

export type TransitionMeta = {
  /** Action verb shown on the control. */
  label: string;
  kind: TransitionKind;
  /** Named server gate that can block this move (mirrors gateNameFor). */
  gate?: "movement" | "closeout";
  /** Confirmation copy for material moves; omit for freely reversible steps. */
  confirm?: string;
  /** One-line consequence note shown beside the control. */
  hint?: string;
};

const BY_PAIR: Record<string, TransitionMeta> = {
  "submitted:under_review": {
    label: "Start Review",
    kind: "forward",
    hint: "Assigns the request to active intake review.",
  },
  "under_review:awaiting_client_info": {
    label: "Request Client Info",
    kind: "hold",
    hint: "Pauses review until the client responds.",
  },
  "under_review:quoted": {
    label: "Mark Quoted",
    kind: "forward",
    hint: "Requires a quote sent to the client.",
  },
  "awaiting_client_info:under_review": {
    label: "Resume Review",
    kind: "forward",
    hint: "Client information received — back to intake.",
  },
  "quoted:approved": {
    label: "Mark Approved",
    kind: "forward",
    confirm: "Mark this request approved on the client's behalf? Normally the client approves the quote themselves.",
    hint: "Client acceptance of the quote.",
  },
  "quoted:under_review": {
    label: "Reopen Review",
    kind: "back",
    hint: "Withdraws the quote stage for rework.",
  },
  "approved:crew_assigned": {
    label: "Mark Crew Assigned",
    kind: "forward",
    gate: "movement",
    hint: "Insurance and credential gate applies to all committed crew.",
  },
  "crew_assigned:scheduled": {
    label: "Mark Scheduled",
    kind: "forward",
    gate: "movement",
    hint: "Confirms the operational schedule.",
  },
  "crew_assigned:approved": {
    label: "Return to Approved",
    kind: "back",
    confirm: "Unwind crew assignment and return this request to Approved?",
    hint: "Unwinds the crew assignment stage.",
  },
  "scheduled:in_progress": {
    label: "Start Execution",
    kind: "forward",
    gate: "movement",
    confirm: "Mark this mission in progress? The client is notified.",
    hint: "The supported mission is underway.",
  },
  "scheduled:crew_assigned": {
    label: "Unwind Schedule",
    kind: "back",
    confirm: "Take this request off the schedule and return it to Crew Assigned?",
    hint: "Removes the confirmed schedule.",
  },
  "in_progress:completed": {
    label: "Complete & Close Out",
    kind: "forward",
    gate: "closeout",
    confirm:
      "Complete this request? Closeout requires a linked invoice and starts the 7-day crew payout clock.",
    hint: "Requires a linked non-void invoice; starts the payout clock.",
  },
  "draft:submitted": {
    label: "Submit Request",
    kind: "forward",
  },
};

const CANCEL_META: TransitionMeta = {
  label: "Cancel Request",
  kind: "cancel",
  confirm: "Cancel this support request? This is terminal — the record cannot be reopened.",
  hint: "Terminal. The client is notified.",
};

export function transitionMeta(from: string, to: string): TransitionMeta {
  if (to === "cancelled") return CANCEL_META;
  return (
    BY_PAIR[`${from}:${to}`] ?? {
      label: `Move to ${to.replace(/_/g, " ")}`,
      kind: "forward",
    }
  );
}
