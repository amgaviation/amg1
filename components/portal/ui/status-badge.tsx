import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/portal/constants";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-border bg-secondary/60 text-secondary-foreground",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  danger: "border-destructive/40 bg-destructive/15 text-red-300",
  accent: "border-accent/40 bg-accent/10 text-accent",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
        aria-hidden
      />
      {label}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = {
    client: "Client",
    crew: "Crew",
    admin: "AMG Admin",
    partner: "Partner",
  };
  const tones: Record<string, Tone> = {
    client: "info",
    crew: "accent",
    admin: "success",
    partner: "warn",
  };
  return <StatusBadge label={labels[role] ?? role} tone={tones[role] ?? "neutral"} />;
}
