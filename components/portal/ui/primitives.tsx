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
          <p className="eyebrow text-[0.64rem] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
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
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            {icon ? <PortalIcon name={icon} className="h-4 w-4 text-accent" /> : null}
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
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
  tone?: "default" | "accent" | "warn" | "danger";
}) {
  const ring =
    tone === "accent"
      ? "border-accent/40"
      : tone === "warn"
        ? "border-amber-500/40"
        : tone === "danger"
          ? "border-destructive/40"
          : "border-border";
  const inner = (
    <div className={cn("h-full rounded-xl border bg-card p-5 transition-colors", ring, href && "hover:border-accent/60")}>
      <p className="font-display text-4xl font-extrabold uppercase leading-none">{value}</p>
      <p className="eyebrow mt-3 text-[0.6rem] text-accent">{label}</p>
      {detail ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p> : null}
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/40 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
        <PortalIcon name={icon} className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
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
    <div className="grid grid-cols-[9rem_1fr] gap-4 border-b border-border/60 py-3 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
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
    <ol className="relative ml-2 space-y-5 border-l border-border pl-6">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border border-accent bg-card" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            {item.meta ? (
              <span className="font-mono text-xs text-muted-foreground">{item.meta}</span>
            ) : null}
          </div>
          {item.body ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p>
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
    info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    danger: "border-destructive/40 bg-destructive/10 text-red-200",
    warn: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  }[tone];
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", cls)}>{children}</div>
  );
}
