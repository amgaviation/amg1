import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/portal/constants";
import { STATUS_DOT_CLASSES } from "@/lib/status-styles";

/**
 * Bare status dot + mono microlabel. Lighter than StatusBadge (no pill): use
 * in page headers, table cells, and the status strip where a bordered chip is
 * too loud. The `pulse` prop is kept for kit-export stability but renders the
 * same static dot (the v4 contract bans the ping halo animation).
 */
export function StatusDot({
  tone = "neutral",
  label,
  className,
}: {
  tone?: Tone;
  label?: string;
  /** No-op: retained for kit-export API stability (the ping halo is banned). */
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        <span
          className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", STATUS_DOT_CLASSES[tone])}
        />
      </span>
      {label ? (
        <span className="deck-micro text-[var(--deck-text-2)]">{label}</span>
      ) : null}
    </span>
  );
}
