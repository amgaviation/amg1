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
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="eyebrow text-[0.64rem] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none text-foreground sm:text-4xl">
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
    <section className={cn("rounded-lg border border-border bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-border bg-slate-50/70 px-5 py-4">
          <div className="flex items-center gap-3">
            {icon ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/15 bg-blue-50 text-primary">
                <PortalIcon name={icon} className="h-4 w-4" />
              </span>
            ) : null}
            <div>
              <h2 className="font-display text-lg font-bold uppercase text-foreground">
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
            : "border-border";
  const inner = (
    <div className={cn("h-full rounded-lg border bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] transition-colors", ring, href && "hover:border-primary/60 hover:bg-blue-50/45")}>
      <p className="font-display text-4xl font-extrabold uppercase leading-none text-foreground">{value}</p>
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white">
        <PortalIcon name={icon} className="h-5 w-5 text-[var(--amg-text-secondary)]" />
      </div>
      <h3 className="font-display text-lg font-bold uppercase text-foreground">{title}</h3>
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
    <div className="grid grid-cols-[9rem_1fr] gap-4 border-b border-border py-3 last:border-0">
      <dt className="text-xs uppercase text-[var(--amg-text-muted)]">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
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
    <ol className="relative ml-2 space-y-5 border-l border-slate-200 pl-6">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border border-primary bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.12)]" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
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
    info: "border-blue-200 bg-blue-50 text-slate-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    danger: "border-red-200 bg-red-50 text-red-950",
    warn: "border-amber-200 bg-amber-50 text-amber-950",
  }[tone];
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.04)]", cls)}>{children}</div>
  );
}

export const PortalPageHeader = PageHeader;
export const PortalSection = SectionCard;
export const PortalCard = SectionCard;
export const PortalMetricCard = StatCard;
export const PortalEmptyState = EmptyState;
export const PortalErrorState = Notice;
export const PortalLoadingState = EmptyState;
