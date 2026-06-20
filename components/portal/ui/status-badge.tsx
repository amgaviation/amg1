import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/portal/constants";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-slate-300 bg-slate-100 text-slate-700",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-800",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-800",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800",
  danger: "border-destructive/40 bg-destructive/10 text-red-800",
  accent: "border-primary/40 bg-primary/10 text-primary",
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
