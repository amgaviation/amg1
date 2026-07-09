import Link from "next/link";
import { cn } from "@/lib/utils";
import { PortalIcon } from "@/components/portal/ui/icon";

/**
 * Operations Deck primitives — the shared surfaces every portal page is
 * composed from. Exported names are the portal-wide contract; keep them
 * stable when restyling.
 */

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
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="deck-eyebrow">{eyebrow}</p> : null}
        <h1 className="deck-title mt-2 break-words text-[1.65rem] sm:text-[2rem]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--deck-text-2)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
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
    <section className={cn("deck-card overflow-hidden", className)}>
      {title ? (
        <header className="deck-card-header">
          <div className="flex min-w-0 items-center gap-3">
            {icon ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]">
                <PortalIcon name={icon} className="h-4 w-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="text-[0.95rem] font-semibold text-[var(--deck-text)]">
                {title}
              </h2>
              {description ? (
                <p className="mt-0.5 text-xs leading-5 text-[var(--deck-text-3)]">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div
              data-portal-action-bar
              className="flex flex-wrap items-center justify-end gap-2"
            >
              {actions}
            </div>
          ) : null}
        </header>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** KPI tile with tabular numerals and a gold rail when linked/active. */
export function StatCard({
  label,
  value,
  detail,
  href,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  icon?: string;
  tone?: "default" | "accent" | "warn" | "danger" | "info";
}) {
  const toneText = {
    default: "text-[var(--deck-text)]",
    accent: "text-[var(--deck-accent-ink)]",
    warn: "text-[var(--deck-warn)]",
    danger: "text-[var(--deck-danger)]",
    info: "text-[var(--deck-info)]",
  }[tone];

  const inner = (
    <div
      className={cn(
        "deck-card deck-gold-rail h-full p-5 pl-6",
        href && "deck-card-hover"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="deck-eyebrow">{label}</p>
        {icon ? (
          <PortalIcon name={icon} className="h-4 w-4 shrink-0 text-[var(--deck-text-3)]" />
        ) : null}
      </div>
      <p className={cn("deck-num mt-3 text-[2.1rem] font-bold leading-none", toneText)}>
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs leading-5 text-[var(--deck-text-3)]">{detail}</p>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** Empty / zero-state. */
export function EmptyState({
  icon = "inbox",
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
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)]">
        <PortalIcon name={icon} className="h-5 w-5 text-[var(--deck-accent-ink)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--deck-text)]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--deck-text-3)]">
          {description}
        </p>
      ) : null}
      {action ? (
        <div
          data-portal-action-bar
          className="mt-5 flex flex-wrap justify-center gap-2"
        >
          {action}
        </div>
      ) : null}
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
    <div className="grid gap-1 border-b border-[var(--deck-line)] py-3 last:border-0 sm:grid-cols-[9.5rem_1fr] sm:gap-4">
      <dt className="deck-eyebrow !text-[0.6rem] !text-[var(--deck-text-3)] sm:self-center">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm text-[var(--deck-text)]">{children}</dd>
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
    <ol className="relative ml-2 space-y-5 border-l border-[var(--deck-line-strong)] pl-6">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full border-2 border-[var(--deck-accent)] bg-[var(--deck-panel)] shadow-[0_0_0_4px_var(--deck-accent-tint)]" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--deck-text)]">{item.title}</p>
            {item.meta ? <span className="deck-mono text-[var(--deck-text-3)]">{item.meta}</span> : null}
          </div>
          {item.body ? (
            <p className="mt-1 text-xs leading-5 text-[var(--deck-text-3)]">{item.body}</p>
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
    info: "border-[var(--deck-info-line)] bg-[var(--deck-info-tint)] text-[var(--deck-info)]",
    success:
      "border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] text-[var(--deck-success)]",
    danger:
      "border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)] text-[var(--deck-danger)]",
    warn: "border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)] text-[var(--deck-warn)]",
  }[tone];
  const rail = {
    info: "bg-[var(--deck-info)]",
    success: "bg-[var(--deck-success)]",
    danger: "bg-[var(--deck-danger)]",
    warn: "bg-[var(--deck-warn)]",
  }[tone];
  return (
    <div className={cn("relative overflow-hidden rounded-md border px-4 py-3 pl-5 text-sm", cls)}>
      <span className={cn("absolute inset-y-0 left-0 w-1", rail)} aria-hidden />
      {children}
    </div>
  );
}

/** Compact record row used in dashboard feeds and detail side panels. */
export function RecordRow({
  href,
  refLabel,
  title,
  meta,
  trailing,
  tone = "default",
}: {
  href?: string;
  refLabel?: string | null;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  tone?: "default" | "warn" | "danger" | "gold";
}) {
  const toneCls = {
    default: "",
    warn: "!border-[var(--deck-warn-line)] bg-[var(--deck-warn-tint)]",
    danger: "!border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)]",
    gold: "!border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)]",
  }[tone];
  const inner = (
    <div
      className={cn(
        // Wrap (trailing badges drop under the body) only on phones — desktop
        // keeps the classic single-line row with the trailing pinned right.
        "deck-inset flex items-start justify-between gap-3 p-4 max-sm:flex-wrap sm:gap-4",
        href && "deck-card-hover",
        toneCls
      )}
    >
      <div className="min-w-0 flex-1 max-sm:basis-52">
        {refLabel ? (
          <p className="deck-mono text-[var(--deck-accent-ink)]">{refLabel}</p>
        ) : null}
        <div className={cn("text-sm font-semibold text-[var(--deck-text)]", refLabel && "mt-1")}>
          {title}
        </div>
        {meta ? (
          <div className="mt-1 text-xs leading-5 text-[var(--deck-text-3)]">{meta}</div>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right max-sm:w-full max-sm:flex-row max-sm:flex-wrap max-sm:items-center max-sm:justify-start max-sm:text-left">
          {trailing}
        </div>
      ) : null}
    </div>
  );
  return href ? (
    <Link
      href={href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
    >
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** Quick-action tile: icon + label + chevron. */
export function QuickLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: string;
  label: string;
  description?: string;
}) {
  return (
    <Link
      href={href}
      className="deck-inset deck-card-hover group flex items-center gap-3 p-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--deck-accent-line)] bg-[var(--deck-panel)] text-[var(--deck-accent-ink)]">
        <PortalIcon name={icon} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[var(--deck-text)]">
          {label}
        </span>
        {description ? (
          <span className="block truncate text-xs text-[var(--deck-text-3)]">
            {description}
          </span>
        ) : null}
      </span>
      <PortalIcon
        name="arrowUpRight"
        className="h-3.5 w-3.5 shrink-0 text-[var(--deck-text-3)] transition-colors group-hover:text-[var(--deck-accent-ink)]"
      />
    </Link>
  );
}

/** Link-driven filter pills (server-safe — no client JS). */
export function FilterTabs({
  basePath,
  param = "status",
  current,
  options,
  preserve,
}: {
  basePath: string;
  param?: string;
  current: string | undefined;
  options: { label: string; value: string }[];
  preserve?: Record<string, string | undefined>;
}) {
  return (
    <div className="deck-scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {options.map((option) => {
        const active = (current ?? "") === option.value;
        const search = new URLSearchParams();
        for (const [key, val] of Object.entries(preserve ?? {})) {
          if (val) search.set(key, val);
        }
        if (option.value) search.set(param, option.value);
        const qs = search.toString();
        return (
          <Link
            key={option.value || "all"}
            href={qs ? `${basePath}?${qs}` : basePath}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-[0.25rem] border px-3 py-2 font-mono text-[0.68rem] font-semibold uppercase [letter-spacing:0.08em] transition-colors sm:py-1.5",
              active
                ? "border-[var(--deck-accent)] bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]"
                : "border-[var(--deck-line-strong)] bg-[var(--deck-panel)] text-[var(--deck-text-2)] hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)]"
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Link-driven pagination bar for filtered lists. */
export function Pagination({
  basePath,
  page,
  pageCount,
  params = {},
}: {
  basePath: string;
  page: number;
  pageCount: number;
  params?: Record<string, string | number | null | undefined>;
}) {
  if (pageCount <= 1) return null;
  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
    }
    search.set("page", String(target));
    return `${basePath}?${search.toString()}`;
  };
  const linkCls = (disabled: boolean) =>
    cn(
      "rounded-md border px-4 py-2.5 text-xs font-semibold transition-colors sm:py-2",
      disabled
        ? "pointer-events-none border-[var(--deck-line)] text-[var(--deck-text-3)] opacity-50"
        : "border-[var(--deck-line-strong)] bg-[var(--deck-panel)] text-[var(--deck-text-2)] hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
    );
  return (
    <div className="deck-card flex flex-col gap-3 px-5 py-4 text-sm text-[var(--deck-text-3)] sm:flex-row sm:items-center sm:justify-between">
      <span className="deck-num">
        Page {page} of {pageCount}
      </span>
      <div className="flex gap-2">
        {page <= 1 ? (
          <span aria-disabled className={linkCls(true)}>Previous</span>
        ) : (
          <Link href={hrefFor(page - 1)} className={linkCls(false)}>Previous</Link>
        )}
        {page >= pageCount ? (
          <span aria-disabled className={linkCls(true)}>Next</span>
        ) : (
          <Link href={hrefFor(page + 1)} className={linkCls(false)}>Next</Link>
        )}
      </div>
    </div>
  );
}

export const PortalPageHeader = PageHeader;
export const PortalSection = SectionCard;
export const PortalCard = SectionCard;
export const PortalMetricCard = StatCard;
export const PortalEmptyState = EmptyState;
export const PortalErrorState = Notice;
export const PortalLoadingState = EmptyState;
