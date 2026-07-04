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
        <h1 className="deck-title mt-2 text-[1.65rem] sm:text-[2rem]">{title}</h1>
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--deck-gold-line)] bg-[var(--deck-gold-tint)] text-[var(--deck-gold-deep)]">
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
    accent: "text-[var(--deck-gold-deep)]",
    warn: "text-[#8F5F12]",
    danger: "text-[#A82E2E]",
    info: "text-[#1D4ED8]",
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
    <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-gold)]">
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--deck-line-strong)] bg-[#F8FAFB] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--deck-gold-line)] bg-[var(--deck-gold-tint)]">
        <PortalIcon name={icon} className="h-5 w-5 text-[var(--deck-gold-deep)]" />
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
    <div className="grid grid-cols-[9.5rem_1fr] gap-4 border-b border-[var(--deck-line)] py-3 last:border-0">
      <dt className="deck-eyebrow self-center !text-[0.6rem] !text-[var(--deck-text-3)]">
        {label}
      </dt>
      <dd className="min-w-0 text-sm text-[var(--deck-text)]">{children}</dd>
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
          <span className="absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full border-2 border-[var(--deck-gold)] bg-white shadow-[0_0_0_4px_rgba(176,141,87,0.14)]" />
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
    info: "border-[#C9DAF8] bg-[#EFF4FE] text-[#173A8A]",
    success: "border-[#BFE3D2] bg-[#EAF6F0] text-[#0E5238]",
    danger: "border-[#EFC7C7] bg-[#FBEFEF] text-[#7E2222]",
    warn: "border-[#EAD9AE] bg-[#FBF4E3] text-[#6E4A0E]",
  }[tone];
  const rail = {
    info: "bg-[#2563EB]",
    success: "bg-[#17845A]",
    danger: "bg-[#C03636]",
    warn: "bg-[#D9970F]",
  }[tone];
  return (
    <div className={cn("relative overflow-hidden rounded-xl border px-4 py-3 pl-5 text-sm", cls)}>
      <span className={cn("absolute inset-y-0 left-0 w-1", rail)} aria-hidden />
      {children}
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
