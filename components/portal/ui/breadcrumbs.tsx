"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DECK_NAV,
  ROLE_HOME,
  ROLE_SHORT,
  SUPER_ADMIN_NAV_GROUP,
  type NavItem,
  type PortalRole,
} from "@/lib/portal/constants";

export type Crumb = { label: string; href?: string };

/**
 * Console breadcrumb trail. Auto-derived from DECK_NAV href prefixes so deep
 * routes (e.g. Billing → Invoices → INV-2041 → Edit) always show a path home;
 * pages can pass explicit `items` when they know better labels (record refs).
 * Renders nothing at role home — the trail only appears once there is a trail.
 */
export function Breadcrumbs({
  role,
  items,
  className,
}: {
  role: PortalRole;
  items?: Crumb[];
  className?: string;
}) {
  const pathname = usePathname();
  const crumbs = items ?? deriveCrumbs(role, pathname);
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="deck-micro flex min-w-0 items-center gap-1.5 text-[var(--deck-text-3)]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {isLast || !crumb.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="truncate text-[var(--deck-text)]"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate transition-colors hover:text-[var(--deck-text)]"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function prettify(segment: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(segment)) return segment.slice(0, 8).toUpperCase();
  if (/^\d+$/.test(segment)) return `#${segment}`;
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function deriveCrumbs(role: PortalRole, pathname: string): Crumb[] {
  const groups =
    role === "super_admin"
      ? [...DECK_NAV.admin, SUPER_ADMIN_NAV_GROUP]
      : DECK_NAV[role];
  const home = ROLE_HOME[role];
  const crumbs: Crumb[] = [{ label: ROLE_SHORT[role], href: home }];

  let best: NavItem | null = null;
  let bestBase = "";
  for (const group of groups) {
    for (const item of group.items) {
      const base = item.href.split("?")[0];
      if (pathname === base || pathname.startsWith(`${base}/`)) {
        if (base.length > bestBase.length) {
          best = item;
          bestBase = base;
        }
      }
    }
  }

  if (best) {
    if (bestBase !== home) crumbs.push({ label: best.label, href: bestBase });
    let acc = bestBase;
    for (const segment of pathname.slice(bestBase.length).split("/").filter(Boolean)) {
      acc += `/${segment}`;
      crumbs.push({ label: prettify(segment), href: acc });
    }
  } else if (pathname !== home) {
    // Route not in the nav (viewers, one-offs): fall back to raw segments
    // after /portal/<area>.
    const segments = pathname.split("/").filter(Boolean).slice(2);
    let acc = pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 2)
      .reduce((path, part) => `${path}/${part}`, "");
    for (const segment of segments) {
      acc += `/${segment}`;
      crumbs.push({ label: prettify(segment), href: acc });
    }
  }

  if (crumbs.length > 1) delete crumbs[crumbs.length - 1].href;
  return crumbs;
}
