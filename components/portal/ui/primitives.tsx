import Link from "next/link";
import { cn } from "@/lib/utils";
import { PortalIcon } from "@/components/portal/ui/icon";

/** Page header with eyebrow, title, optional description and right-aligned actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="eyebrow text-[0.64rem] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none text-white sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--amg-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Bordered surface used for nearly every content block. */
export function SectionCard({
  title,
  description,
  icon,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-white/10 bg-[#07111F]/92 shadow-[0_18px_58px_rgba(0,0,0,0.24)] backdrop-blur", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            {icon ? <PortalIcon name={icon} className="h-4 w-4 text-primary" /> : null}
            <div>
              <h2 className="font-display text-lg font-bold uppercase text-white">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-xs leading-5 text-[var(--amg-text-muted)]">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** KPI tile. */
export function StatCard({
  label,
  value,
  detail,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  tone?: "default" | "accent" | "warn" | "danger" | "info";
}) {
  const ring =
    tone === "accent"
      ? "border-accent/40"
      : tone === "warn"
        ? "border-amber-500/40"
        : tone === "danger"
          ? "border-destructive/40"
          : tone === "info"
            ? "border-primary/40"
            : "border-white/10";
  const inner = (
    <div className={cn("h-full rounded-lg border bg-[#07111F]/92 p-5 shadow-[0_18px_58px_rgba(0,0,0,0.2)] transition-colors", ring, href && "hover:border-primary/60")}>
      <p className="font-display text-4xl font-extrabold uppercase leading-none text-white">{value}</p>
      <p className="eyebrow mt-3 text-[0.6rem] text-primary">{label}</p>
      {detail ? <p className="mt-2 text-xs leading-5 text-[var(--amg-text-muted)]">{detail}</p> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** Empty / zero-state. */
export function EmptyState({
  icon = "clipboard",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.04] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
        <PortalIcon name={icon} className="h-5 w-5 text-[var(--amg-text-secondary)]" />
      </div>
      <h3 className="font-display text-lg font-bold uppercase text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--amg-text-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Definition row used in detail panels. */
export function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 border-b border-white/10 py-3 last:border-0">
      <dt className="text-xs uppercase text-[var(--amg-text-muted)]">{label}</dt>
      <dd className="text-sm text-slate-100">{children}</dd>
    </div>
  );
}

/** Vertical event timeline. */
export function Timeline({
  items,
}: {
  items: { title: string; meta?: string; body?: string; tone?: string }[];
}) {
  return (
    <ol className="relative ml-2 space-y-5 border-l border-white/10 pl-6">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border border-primary bg-[#07111F] shadow-[0_0_24px_rgba(59,130,246,0.22)]" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-white">{item.title}</p>
            {item.meta ? (
              <span className="font-mono text-xs text-[var(--amg-text-muted)]">{item.meta}</span>
            ) : null}
          </div>
          {item.body ? (
            <p className="mt-1 text-xs leading-5 text-[var(--amg-text-muted)]">{item.body}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/** Notice / flash banner driven by ?error= / ?success= search params. */
export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "danger" | "warn";
  children: React.ReactNode;
}) {
  const cls = {
    info: "border-primary/30 bg-primary/10 text-blue-100",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    danger: "border-red-400/40 bg-red-400/10 text-red-100",
    warn: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  }[tone];
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", cls)}>{children}</div>
  );
}

export const PortalPageHeader = PageHeader;
export const PortalSection = SectionCard;
export const PortalCard = SectionCard;
export const PortalMetricCard = StatCard;
export const PortalEmptyState = EmptyState;
export const PortalErrorState = Notice;
export const PortalLoadingState = EmptyState;
