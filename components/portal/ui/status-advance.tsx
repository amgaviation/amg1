import Link from "next/link";
import { updateMissionStatus } from "@/app/portal/actions/missions";
import { PortalIcon } from "@/components/portal/ui/icon";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import {
  LEGAL_TRANSITIONS,
  type MissionStatus,
  isMissionStatus,
} from "@/lib/portal/mission-lifecycle";
import { transitionMeta, type TransitionMeta } from "@/lib/portal/mission-transitions";
import { MISSION_STATUS_LABEL, MISSION_STATUS_TONE, toneFor } from "@/lib/portal/constants";

/**
 * Guided status movement for a support request. Offers only the legal next
 * steps for the record's current status — the server (updateMissionStatus)
 * remains the enforcement boundary for transitions, gates, and overrides.
 *
 * "board": the single natural forward step plus a link to the record for
 * everything else. "full": every legal move, grouped forward / back / cancel,
 * with gate hints and confirmations on material moves.
 */

type MissionRef = { id: string; ref: string | null; status: string };

function legalMoves(status: string): { to: MissionStatus; meta: TransitionMeta }[] {
  if (!isMissionStatus(status)) return [];
  return LEGAL_TRANSITIONS[status].map((to) => ({ to, meta: transitionMeta(status, to) }));
}

function TransitionForm({
  mission,
  to,
  meta,
  backTo,
  compact = false,
}: {
  mission: MissionRef;
  to: MissionStatus;
  meta: TransitionMeta;
  backTo?: string;
  compact?: boolean;
}) {
  const variant =
    meta.kind === "cancel" ? "destructive" : meta.kind === "forward" ? "default" : "outline";
  return (
    <form action={updateMissionStatus} className={compact ? "flex-1" : "flex items-center gap-2"}>
      <input type="hidden" name="mission_id" value={mission.id} />
      <input type="hidden" name="status" value={to} />
      {backTo ? <input type="hidden" name="back_to" value={backTo} /> : null}
      <SubmitButton
        variant={variant}
        size="sm"
        pendingText="Moving…"
        confirm={meta.confirm}
        className={compact ? "w-full" : undefined}
      >
        {meta.label}
      </SubmitButton>
    </form>
  );
}

/** Compact control for board cards: the natural forward step only. */
export function MissionStatusAdvanceCompact({
  mission,
  backTo,
}: {
  mission: MissionRef;
  backTo?: string;
}) {
  const moves = legalMoves(mission.status);
  const forward = moves.find((m) => m.meta.kind === "forward" || m.meta.kind === "hold");
  return (
    <div className="mt-2.5 flex items-center gap-2">
      {forward ? (
        <TransitionForm mission={mission} to={forward.to} meta={forward.meta} backTo={backTo} compact />
      ) : (
        <span className="text-xs text-[var(--deck-text-3)]">No further steps</span>
      )}
      <Link
        href={`/portal/admin/trips/${mission.id}`}
        className="shrink-0 rounded-md border border-[var(--deck-line-strong)] px-2.5 py-1.5 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)]"
        aria-label={`Open ${mission.ref ?? "request"}`}
      >
        Open
      </Link>
    </div>
  );
}

/**
 * Full status panel for the record page: current status, every legal move
 * with its consequences, and the audited override path for anything else.
 */
export function MissionStatusPanel({
  mission,
  blockers = [],
  warnings = [],
}: {
  mission: MissionRef;
  blockers?: string[];
  warnings?: string[];
}) {
  const moves = legalMoves(mission.status);
  const ordered = [
    ...moves.filter((m) => m.meta.kind === "forward"),
    ...moves.filter((m) => m.meta.kind === "hold"),
    ...moves.filter((m) => m.meta.kind === "back"),
    ...moves.filter((m) => m.meta.kind === "cancel"),
  ];
  const terminal = moves.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--deck-text-2)]">Current status</p>
        <StatusBadge
          label={MISSION_STATUS_LABEL[mission.status] ?? mission.status}
          tone={toneFor(MISSION_STATUS_TONE, mission.status)}
        />
      </div>

      {blockers.length > 0 ? (
        <div className="rounded-md border border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--deck-danger)]">
            <PortalIcon name="shield" className="h-3.5 w-3.5" />
            Blocking the next step
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-5 text-[var(--deck-danger)]">
            {blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <ul className="list-disc space-y-1 rounded-md border border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] p-3 pl-7 text-xs leading-5 text-[var(--deck-warn)]">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {terminal ? (
        <p className="text-sm text-[var(--deck-text-3)]">
          This request is {MISSION_STATUS_LABEL[mission.status]?.toLowerCase() ?? mission.status} —
          no further status movement.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {ordered.map(({ to, meta }) => (
            <li
              key={to}
              className="deck-inset flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-3"
            >
              <div className="min-w-0 flex-1 basis-52">
                <p className="text-sm font-semibold text-[var(--deck-text)]">
                  {MISSION_STATUS_LABEL[to] ?? to}
                  {meta.gate ? (
                    <span className="ml-2 inline-flex items-center gap-1 align-middle text-[0.7rem] font-medium text-[var(--deck-warn)]">
                      <PortalIcon name="shield" className="h-3 w-3" />
                      {meta.gate === "movement" ? "Insurance gate" : "Closeout gate"}
                    </span>
                  ) : null}
                </p>
                {meta.hint ? (
                  <p className="mt-0.5 text-xs leading-5 text-[var(--deck-text-3)]">{meta.hint}</p>
                ) : null}
              </div>
              <TransitionForm mission={mission} to={to} meta={meta} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
