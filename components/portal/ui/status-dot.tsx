import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/portal/constants";
import { STATUS_DOT_CLASSES } from "@/lib/status-styles";

/**
 * Bare status dot + mono microlabel — the oc-dot vocabulary from the public
 * site. Lighter than StatusBadge (no pill): use in page headers, table cells,
 * and the status strip where a bordered chip is too loud.
 */
export function StatusDot({
  tone = "neutral",
  label,
  pulse = false,
  className,
}: {
  tone?: Tone;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        {pulse ? (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              STATUS_DOT_CLASSES[tone]
            )}
          />
        ) : null}
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
