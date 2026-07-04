import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/portal/constants";
import { STATUS_DOT_CLASSES, STATUS_TONE_CLASSES } from "@/lib/status-styles";

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
    <span className={cn("deck-chip", STATUS_TONE_CLASSES[tone], className)}>
      <span
        className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_CLASSES[tone])}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const labels: Record<string, string> = {
    client: "Client",
    crew: "Crew",
    admin: "AMG Operations",
    partner: "Partner Network",
    super_admin: "Super Admin",
  };
  const tones: Record<string, Tone> = {
    client: "info",
    crew: "success",
    admin: "accent",
    partner: "warn",
    super_admin: "danger",
  };
  return (
    <StatusBadge
      label={labels[role] ?? role}
      tone={tones[role] ?? "neutral"}
      className={className}
    />
  );
}

export const PortalStatusBadge = StatusBadge;
