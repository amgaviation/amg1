import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Link-driven page tabs for non-list console pages (Settings, future hubs).
 * URL-synced via a search param (default `tab`) so tabs are linkable and
 * survive refresh — same server-safe approach as FilterTabs, styled as the
 * toolbar chip row. The first option is the default tab (empty param).
 */
export function PageTabs({
  basePath,
  param = "tab",
  current,
  options,
}: {
  basePath: string;
  param?: string;
  current: string | undefined;
  options: { label: string; value: string }[];
}) {
  const fallback = options[0]?.value ?? "";
  const active = current && options.some((o) => o.value === current) ? current : fallback;
  return (
    <div
      role="tablist"
      aria-label="Page sections"
      className="deck-scroll-x -mx-1 flex gap-2 overflow-x-auto border-b border-[var(--deck-line)] px-1 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {options.map((option) => {
        const isActive = option.value === active;
        const href =
          option.value === fallback ? basePath : `${basePath}?${param}=${encodeURIComponent(option.value)}`;
        return (
          <Link
            key={option.value}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "shrink-0 rounded-[0.25rem] border px-3 py-2 font-mono text-[0.68rem] font-semibold uppercase [letter-spacing:0.08em] transition-colors sm:py-1.5",
              isActive
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

/** Resolve which tab is active on the server (mirrors PageTabs' fallback). */
export function activeTab(
  current: string | undefined,
  options: { value: string }[]
): string {
  const fallback = options[0]?.value ?? "";
  return current && options.some((o) => o.value === current) ? current : fallback;
}
