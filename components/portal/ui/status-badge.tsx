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
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_TONE_CLASSES[tone],
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full opacity-90", STATUS_DOT_CLASSES[tone])}
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
    super_admin: "Super Admin",
  };
  const tones: Record<string, Tone> = {
    client: "info",
    crew: "accent",
    admin: "success",
    partner: "warn",
    super_admin: "danger",
  };
  return <StatusBadge label={labels[role] ?? role} tone={tones[role] ?? "neutral"} />;
}
