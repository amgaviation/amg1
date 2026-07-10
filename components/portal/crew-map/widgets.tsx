import { PortalIcon } from "@/components/portal/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Command-Center data widgets for the Live Crew Map pages. Presentational only
 * (server-renderable) — all values are passed in. Built on the --deck-* tokens
 * so they track the portal's light/dark themes. No charting library exists in
 * the repo, so Sparkline is hand-rolled inline SVG.
 */

type Tone = "accent" | "success" | "warn" | "danger" | "info" | "neutral";

const TONE_VAR: Record<Tone, string> = {
  accent: "var(--deck-accent)",
  success: "var(--deck-success)",
  warn: "var(--deck-warn)",
  danger: "var(--deck-danger)",
  info: "var(--deck-info)",
  neutral: "var(--deck-text-2)",
};

export function Sparkline({
  data,
  tone = "accent",
  className,
}: {
  data: number[];
  tone?: Tone;
  className?: string;
}) {
  const w = 120;
  const h = 32;
  const pad = 2;
  const color = TONE_VAR[tone];
  const pts = data.length >= 2 ? data : [...data, ...data, 0].slice(0, 2);
  const max = Math.max(1, ...pts);
  const stepX = pts.length > 1 ? (w - pad * 2) / (pts.length - 1) : 0;
  const coords = pts.map((v, i) => [pad + i * stepX, h - pad - (v / max) * (h - pad * 2)] as const);
  const line = coords.map((c, i) => `${i ? "L" : "M"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${h} L${coords[0][0].toFixed(1)},${h} Z`;
  const gid = `spark-grad-${tone}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.26" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Compact metric tile with optional sparkline, for the left rail. */
export function TrendTile({
  label,
  value,
  unit,
  detail,
  icon,
  tone = "accent",
  spark,
}: {
  label: string;
  value: string | number;
  unit?: string;
  detail?: string;
  icon?: string;
  tone?: Tone;
  spark?: number[];
}) {
  return (
    <div className="deck-inset relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="deck-eyebrow text-[var(--deck-text-3)]">{label}</p>
        {icon ? <PortalIcon name={icon} className="h-4 w-4 shrink-0 text-[var(--deck-text-3)]" /> : null}
      </div>
      <p className="deck-num mt-2 text-2xl font-bold leading-none text-[var(--deck-text)]">
        {value}
        {unit ? <span className="ml-1 text-sm font-semibold text-[var(--deck-text-3)]">{unit}</span> : null}
      </p>
      {detail ? <p className="mt-1 text-xs text-[var(--deck-text-3)]">{detail}</p> : null}
      {spark && spark.length ? <Sparkline data={spark} tone={tone} className="mt-3 h-8 w-full" /> : null}
    </div>
  );
}

/** Horizontal ranked bar row (e.g. busiest airports). */
export function RankBar({
  label,
  sub,
  value,
  max,
  tone = "accent",
}: {
  label: string;
  sub?: string | null;
  value: number;
  max: number;
  tone?: Tone;
}) {
  const pct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="deck-mono truncate text-[var(--deck-text)]">{label}</span>
          <span className="deck-num text-xs text-[var(--deck-text-2)]">{value}</span>
        </div>
        {sub ? <p className="truncate text-[0.7rem] text-[var(--deck-text-3)]">{sub}</p> : null}
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--deck-line)]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TONE_VAR[tone] }} />
        </div>
      </div>
    </div>
  );
}

/** Wrapping chip list (e.g. type ratings online). */
export function ChipRow({ items, empty = "—" }: { items: string[]; empty?: string }) {
  if (!items.length) return <span className="text-sm text-[var(--deck-text-3)]">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className="rounded-[0.25rem] border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-2.5 py-1 text-xs text-[var(--deck-text)]"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/** The status legend + LIVE pill shown above the map. */
export function MapLegend({ className }: { className?: string }) {
  const dot = "inline-block h-2 w-2 rounded-full";
  return (
    <div className={cn("flex items-center gap-3 text-xs text-[var(--deck-text-3)]", className)}>
      <span className="flex items-center gap-1.5">
        <span className={dot} style={{ background: "var(--deck-accent)" }} /> Available
      </span>
      <span className="flex items-center gap-1.5">
        <span className={dot} style={{ background: "var(--deck-warn)" }} /> Expiring
      </span>
      <span className="flex items-center gap-1.5">
        <span className={dot} style={{ background: "var(--deck-danger)" }} /> Ending soon
      </span>
    </div>
  );
}
