import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { readSlaFields, slaChipState } from "@/lib/portal/sla";

/**
 * Compact mono SLA-clock chip for admin mission surfaces. Renders nothing when
 * the mission has no SLA clock set (created before the migration, or intake
 * stamp skipped), so callers can drop it in unconditionally. `now` is passed
 * for deterministic server rendering; countdowns are server-rendered relative
 * time (no live ticking).
 */
export function SlaChip({
  mission,
  now,
  className,
}: {
  mission: unknown;
  now?: Date;
  className?: string;
}) {
  const state = slaChipState(readSlaFields(mission), now ?? new Date());
  if (state.state === "none") return null;
  return (
    <span title={state.title} className="inline-flex">
      <StatusBadge label={state.label} tone={state.tone} className={cn("deck-mono", className)} />
    </span>
  );
}
