"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/app/portal/actions/auth";
import { PortalIcon } from "@/components/portal/ui/icon";
import { RoleBadge } from "@/components/portal/ui/status-badge";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/portal/format";
import { clearPortalIntroBrowserState } from "@/lib/portal/intro";
import {
  DECK_NAV,
  ROLE_HOME,
  ROLE_LABELS,
  ROLE_SHORT,
  SUPER_ADMIN_NAV_GROUP,
  isAdminRole,
  type NavGroup,
  type PortalRole,
} from "@/lib/portal/constants";

/**
 * AMG Operations Deck shell — the chrome every portal page renders inside.
 * Dark navy sidebar with grouped navigation, light canvas, topbar with
 * Zulu clock, notifications, and role context.
 */

type ShellUser = {
  name: string;
  email: string;
  role: PortalRole;
  companyName: string | null;
};

const NOTIFICATIONS_HREF: Record<PortalRole, string> = {
  client: "/portal/client/notifications",
  crew: "/portal/crew/notifications",
  admin: "/portal/admin/notifications",
  partner: "/portal/partner/notifications",
  super_admin: "/portal/admin/notifications",
};

const SETTINGS_HREF: Record<PortalRole, string> = {
  client: "/portal/client/settings",
  crew: "/portal/crew/settings",
  admin: "/portal/admin/settings",
  partner: "/portal/partner/settings",
  super_admin: "/portal/admin/settings",
};

function resolveNavGroups(role: PortalRole, userRole: PortalRole): NavGroup[] {
  const base = role === "super_admin" ? DECK_NAV.admin : DECK_NAV[role];
  if (userRole === "super_admin" && (role === "admin" || role === "super_admin")) {
    return [...base, SUPER_ADMIN_NAV_GROUP];
  }
  return base;
}

export function PortalShell({
  role,
  user,
  unread = 0,
  children,
}: {
  role: PortalRole;
  user: ShellUser;
  unread?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navGroups = resolveNavGroups(role, user.role);

  return (
    <div className="amg-portal relative min-h-screen bg-[var(--deck-canvas)] overflow-hidden lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="deck-chrome-surface sticky top-0 hidden h-screen flex-col border-r border-[var(--deck-chrome-line)] lg:flex">
        <SidebarContent role={role} user={user} navGroups={navGroups} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[rgba(6,12,22,0.62)] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="deck-chrome-surface absolute left-0 top-0 flex h-full w-[19rem] flex-col border-r border-[var(--deck-chrome-line)] shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md border border-[var(--deck-chrome-line)] p-2 text-[var(--deck-chrome-muted)] transition-colors hover:text-[var(--deck-chrome-text)]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              role={role}
              user={user}
              navGroups={navGroups}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--deck-line)] bg-white/92 px-4 py-2.5 backdrop-blur-xl sm:px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-[var(--deck-line)] bg-white p-2 text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-gold-line)] hover:text-[var(--deck-text)] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="deck-eyebrow">{ROLE_SHORT[role]}</p>
              <p className="truncate text-sm font-semibold text-[var(--deck-text)]">
                {ROLE_LABELS[role]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ZuluClock />

            {isAdminRole(user.role) ? <ViewSwitcher role={role} /> : null}

            <Link
              href={NOTIFICATIONS_HREF[role]}
              className="relative rounded-lg border border-[var(--deck-line)] bg-white p-2 text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-gold-line)] hover:bg-[var(--deck-gold-tint)] hover:text-[var(--deck-text)]"
              aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            >
              <PortalIcon name="bell" className="h-4 w-4" />
              {unread > 0 && (
                <span className="deck-num absolute -right-1.5 -top-1.5 flex h-4 min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--deck-gold)] px-1 text-[0.6rem] font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>

            <Link
              href={SETTINGS_HREF[role]}
              className="hidden rounded-lg border border-[var(--deck-line)] bg-white p-2 text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-gold-line)] hover:bg-[var(--deck-gold-tint)] hover:text-[var(--deck-text)] sm:block"
              aria-label="Settings"
            >
              <PortalIcon name="settings" className="h-4 w-4" />
            </Link>

            <div className="hidden items-center gap-3 pl-2 sm:flex">
              <div className="border-l border-[var(--deck-line)] pl-3 text-right">
                <p className="max-w-[11rem] truncate text-sm font-semibold leading-tight text-[var(--deck-text)]">
                  {user.name}
                </p>
                <p className="max-w-[11rem] truncate text-xs text-[var(--deck-text-3)]">
                  {user.companyName ?? user.email}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--deck-gold-line)] bg-[var(--deck-gold-tint)] text-xs font-bold text-[var(--deck-gold-deep)]">
                {initials(user.name)}
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                onClick={clearPortalIntroBrowserState}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--deck-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-gold-line)] hover:bg-[var(--deck-gold-tint)] hover:text-[var(--deck-text)]"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Main content */}
        <main className="w-full max-w-full min-w-0 overflow-hidden flex-1 px-4 py-6 sm:px-5 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[96rem] min-w-0 space-y-5">
            {children}
          </div>
        </main>

        <footer className="border-t border-[var(--deck-line)] px-4 py-3 sm:px-8">
          <p className="text-[0.62rem] text-[var(--deck-text-3)]">
            AMG Aviation Group · AMG Connect · Part 91 Operational Support
          </p>
        </footer>
      </div>
    </div>
  );
}

/** Live UTC clock — aviation ops run on Zulu time. */
function ZuluClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div className="hidden w-[4.6rem] md:block" aria-hidden />;
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  return (
    <div
      className="deck-mono hidden items-center gap-1.5 rounded-lg border border-[var(--deck-line)] bg-white px-2.5 py-2 text-[var(--deck-text-2)] md:flex"
      title="Coordinated Universal Time"
    >
      <PortalIcon name="clock" className="h-3.5 w-3.5 text-[var(--deck-gold-deep)]" />
      <span className="deck-num font-semibold">{hh}{mm}Z</span>
    </div>
  );
}

/** Admin quick-switch between role workspaces. */
function ViewSwitcher({ role }: { role: PortalRole }) {
  const [open, setOpen] = useState(false);
  const targets: { role: PortalRole; label: string }[] = [
    { role: "admin", label: "Operations Command" },
    { role: "client", label: "Client Portal" },
    { role: "crew", label: "Crew Portal" },
    { role: "partner", label: "Partner Portal" },
  ];
  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--deck-line)] bg-white px-2.5 py-2 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-gold-line)] hover:text-[var(--deck-text)]"
      >
        <PortalIcon name="layers" className="h-3.5 w-3.5" />
        View
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="deck-card absolute right-0 z-50 mt-2 w-52 p-1.5">
            {targets.map((t) => (
              <Link
                key={t.role}
                href={ROLE_HOME[t.role]}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--deck-gold-tint)]",
                  t.role === role
                    ? "font-semibold text-[var(--deck-gold-deep)]"
                    : "text-[var(--deck-text-2)]"
                )}
              >
                {t.label}
                {t.role === role ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--deck-gold)]" aria-hidden />
                ) : null}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function SidebarContent({
  role,
  user,
  navGroups,
  onNavigate,
}: {
  role: PortalRole;
  user: ShellUser;
  navGroups: NavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    const base = href.split("?")[0];
    const isHome = base.endsWith("/dashboard");
    return pathname === base || (!isHome && pathname.startsWith(base));
  }

  return (
    <>
      {/* Brand */}
      <div className="shrink-0 border-b border-[var(--deck-chrome-line)] px-5 pb-4 pt-5">
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.png"
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className="h-6 w-auto"
          />
        </Link>
        <p className="deck-eyebrow-chrome mt-2.5">Operations Deck</p>
        <div className="mt-3">
          <RoleBadge role={role} />
        </div>
      </div>

      {/* Nav */}
      <nav className="deck-scroll flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="deck-nav-group px-3 pb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    data-active={isActive(item.href)}
                    className="deck-nav-link"
                  >
                    <PortalIcon name={item.icon} className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-[var(--deck-chrome-line)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(176,141,87,0.45)] bg-[rgba(176,141,87,0.14)] text-xs font-bold text-[#D9BE8C]">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[var(--deck-chrome-text)]">
              {user.name}
            </p>
            <p className="truncate text-[0.68rem] text-[var(--deck-chrome-muted)]">
              {user.companyName ?? user.email}
            </p>
          </div>
        </div>
        <p className="deck-eyebrow-chrome mt-3 !text-[0.55rem]">
          AMG Aviation Group
        </p>
      </div>
    </>
  );
}
