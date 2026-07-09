"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/app/portal/actions/auth";
import { CommandPalette } from "@/components/portal/shell/command-palette";
import { Breadcrumbs } from "@/components/portal/ui/breadcrumbs";
import { PortalIcon } from "@/components/portal/ui/icon";
import { RoleBadge } from "@/components/portal/ui/status-badge";
import { ThemeToggle } from "@/components/portal/ui/theme-toggle";
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
import { navModuleForHref } from "@/lib/portal/permissions-catalog";

/**
 * Flight Deck Console shell — the chrome every portal page renders inside.
 * Night-mode chrome rail in both themes, grouped mono-labelled navigation,
 * and a status strip with breadcrumbs, Zulu clock, and the theme toggle.
 *
 * Rendered once by the per-role layout (app/portal/<role>/layout.tsx). Pages
 * that still render their own <PortalShell> are harmless: a nested shell
 * detects the layout-rendered one via context and renders bare children,
 * so wrappers can be stripped role-by-role instead of in one big bang.
 */

type ShellUser = {
  id?: string;
  name: string;
  email: string;
  role: PortalRole;
  companyName: string | null;
  avatarPath?: string | null;
};

function Avatar({ user, className }: { user: ShellUser; className: string }) {
  if (user.id && user.avatarPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/portal/avatars/${user.id}?v=${encodeURIComponent(user.avatarPath)}`}
        alt=""
        className={cn(className, "object-cover")}
      />
    );
  }
  return <span className={className}>{initials(user.name)}</span>;
}

const ShellNestingContext = createContext(false);

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

const PROFILE_HREF: Record<PortalRole, string> = {
  client: "/portal/client/profile",
  crew: "/portal/crew/profile",
  admin: "/portal/admin/settings",
  partner: "/portal/partner/profile",
  super_admin: "/portal/admin/settings",
};

function resolveNavGroups(role: PortalRole, userRole: PortalRole): NavGroup[] {
  const base = role === "super_admin" ? DECK_NAV.admin : DECK_NAV[role];
  if (userRole === "super_admin" && (role === "admin" || role === "super_admin")) {
    return [...base, SUPER_ADMIN_NAV_GROUP];
  }
  return base;
}

/**
 * Hide nav items whose module the role cannot view (role-permission matrix).
 * Chrome only — pages and actions remain the enforcement boundary. Items with
 * no module mapping (dashboards, personal settings) always show, and a
 * missing map fails open so the shell never blanks out on a lookup error.
 */
function filterNavGroups(groups: NavGroup[], moduleView?: Record<string, boolean>): NavGroup[] {
  if (!moduleView) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const moduleKey = navModuleForHref(item.href);
        return !moduleKey || moduleView[moduleKey] !== false;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function PortalShell({
  role,
  user,
  unread = 0,
  moduleView,
  children,
}: {
  role: PortalRole;
  user: ShellUser;
  unread?: number;
  /** module → can-view flags from the role-permission matrix (server-resolved). */
  moduleView?: Record<string, boolean>;
  children: React.ReactNode;
}) {
  const nested = useContext(ShellNestingContext);
  const [open, setOpen] = useState(false);
  const navGroups = filterNavGroups(resolveNavGroups(role, user.role), moduleView);

  const drawerRef = useRef<HTMLElement | null>(null);
  const drawerReturnFocus = useRef<HTMLElement | null>(null);

  // Mobile drawer ergonomics: lock body scroll, move focus into the drawer,
  // trap Tab, close on Escape, and restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const FOCUSABLE =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerReturnFocus.current = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const panel = drawerRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      drawerReturnFocus.current?.focus?.();
    };
  }, [open]);

  // A shell already wraps this subtree (per-role layout): stay out of the way.
  if (nested) return <>{children}</>;

  return (
    <ShellNestingContext.Provider value={true}>
      <div className="amg-portal relative min-h-screen bg-[var(--deck-canvas)] overflow-x-clip lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="deck-chrome-surface sticky top-0 hidden h-screen flex-col border-r border-[var(--deck-chrome-line)] lg:flex">
          <SidebarContent role={role} user={user} navGroups={navGroups} />
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div
              className="absolute inset-0 bg-[rgba(4,8,16,0.66)] backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setOpen(false)}
            />
            <aside ref={drawerRef} className="deck-chrome-surface absolute left-0 top-0 flex h-[100dvh] w-[18rem] max-w-[85vw] flex-col border-r border-[var(--deck-chrome-line)] shadow-2xl animate-in slide-in-from-left duration-200 [padding-left:env(safe-area-inset-left)]">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-md border border-[var(--deck-chrome-line)] p-2.5 text-[var(--deck-chrome-muted)] transition-colors hover:text-[var(--deck-chrome-text)]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent
                role={role}
                user={user}
                navGroups={navGroups}
                onNavigate={() => setOpen(false)}
                showWorkspaceSwitch
              />
            </aside>
          </div>
        )}

        <div className="flex min-h-screen min-w-0 flex-col">
          {/* Status strip */}
          <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-[var(--deck-line)] bg-[var(--deck-canvas)]/90 px-4 backdrop-blur-xl sm:px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] p-2.5 text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)] lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden min-w-0 md:block">
                <Breadcrumbs role={role} />
              </div>
              <p className="deck-micro truncate text-[var(--deck-text-3)] md:hidden">
                {ROLE_SHORT[role]}
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {isAdminRole(user.role) ? <CommandPalette /> : null}

              <ZuluClock />

              {isAdminRole(user.role) ? <ViewSwitcher role={role} /> : null}

              <ThemeToggle />

              <Link
                href={NOTIFICATIONS_HREF[role]}
                className="relative rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] p-2.5 text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)] hover:text-[var(--deck-text)] lg:p-1.5"
                aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
              >
                <PortalIcon name="bell" className="h-4 w-4" />
                {unread > 0 && (
                  <span className="deck-num absolute -right-1.5 -top-1.5 flex h-4 min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--deck-accent)] px-1 text-[0.6rem] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>

              <UserMenu role={role} user={user} />
            </div>
          </header>

          {/* Main content */}
          <main className="w-full max-w-full min-w-0 overflow-hidden flex-1 px-4 py-6 sm:px-5 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-[96rem] min-w-0 space-y-5">
              {children}
            </div>
          </main>

          <footer className="border-t border-[var(--deck-line)] px-4 py-3 sm:px-8">
            <p className="deck-micro text-[var(--deck-text-3)]">
              AMG Aviation Group · AMG Connect · UTC Ops
            </p>
          </footer>
        </div>
      </div>
    </ShellNestingContext.Provider>
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
      className="deck-mono hidden items-center gap-1.5 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-2.5 py-1.5 text-[var(--deck-text-2)] md:flex"
      title="Coordinated Universal Time"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--deck-success)]" aria-hidden />
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
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)] px-2.5 py-1.5 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)]"
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
                  "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--deck-accent-tint)]",
                  t.role === role
                    ? "font-semibold text-[var(--deck-accent-ink)]"
                    : "text-[var(--deck-text-2)]"
                )}
              >
                {t.label}
                {t.role === role ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--deck-accent)]" aria-hidden />
                ) : null}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Avatar dropdown: identity, workspace label, settings, sign out. */
function UserMenu({ role, user }: { role: PortalRole; user: ShellUser }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] text-[0.68rem] font-bold text-[var(--deck-accent-ink)] transition-colors hover:border-[var(--deck-accent)]"
      >
        <Avatar user={user} className="flex h-full w-full items-center justify-center rounded-full" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="deck-card absolute right-0 z-50 mt-2 w-64 overflow-hidden">
            <div className="border-b border-[var(--deck-line)] px-4 py-3">
              <p className="truncate text-sm font-semibold text-[var(--deck-text)]">{user.name}</p>
              <p className="truncate text-xs text-[var(--deck-text-3)]">
                {user.companyName ?? user.email}
              </p>
              <p className="deck-micro mt-2 text-[var(--deck-text-3)]">{ROLE_LABELS[role]}</p>
            </div>
            <div className="p-1.5">
              <Link
                href={PROFILE_HREF[role]}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--deck-text-2)] transition-colors hover:bg-[var(--deck-accent-tint)] hover:text-[var(--deck-text)]"
              >
                <PortalIcon name="users" className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href={SETTINGS_HREF[role]}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-[var(--deck-text-2)] transition-colors hover:bg-[var(--deck-accent-tint)] hover:text-[var(--deck-text)]"
              >
                <PortalIcon name="settings" className="h-4 w-4" />
                Settings
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  onClick={clearPortalIntroBrowserState}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-[var(--deck-text-2)] transition-colors hover:bg-[var(--deck-danger-tint)] hover:text-[var(--deck-danger)]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const NAV_COLLAPSE_KEY = "amg-deck-nav-collapsed";

function SidebarContent({
  role,
  user,
  navGroups,
  onNavigate,
  showWorkspaceSwitch = false,
}: {
  role: PortalRole;
  user: ShellUser;
  navGroups: NavGroup[];
  onNavigate?: () => void;
  showWorkspaceSwitch?: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(NAV_COLLAPSE_KEY);
      if (stored) setCollapsed(JSON.parse(stored));
    } catch {
      /* first visit or blocked storage — leave all groups expanded */
    }
  }, []);

  function toggleGroup(label: string) {
    setCollapsed((current) => {
      const next = { ...current, [label]: !current[label] };
      try {
        window.localStorage.setItem(NAV_COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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
        <p className="deck-micro mt-2.5 text-[var(--deck-chrome-muted)]">
          AMG Connect · Console
        </p>
        <div className="mt-3">
          <RoleBadge role={role} />
        </div>
      </div>

      {/* Nav */}
      <nav className="deck-scroll flex-1 overflow-y-auto px-3 py-4">
        <div>
          {navGroups.map((group, index) => {
            const groupActive = group.items.some((item) => isActive(item.href));
            // A group holding the current page never collapses out from under you.
            const isCollapsed = collapsed[group.label] && !groupActive;
            return (
              <div
                key={group.label}
                className={cn(
                  index > 0 && "mt-3 border-t border-[var(--deck-chrome-line)] pt-3"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!isCollapsed}
                  className="deck-nav-group flex w-full items-center justify-between px-3 pb-1.5 text-left transition-colors hover:text-[var(--deck-chrome-text)]"
                >
                  {group.label}
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 shrink-0 transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                </button>
                {!isCollapsed ? (
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
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Workspace quick-switch — the header ViewSwitcher is hidden below md,
            so the mobile drawer is where admins change workspaces on a phone. */}
        {showWorkspaceSwitch && isAdminRole(user.role) ? (
          <div className="mt-3 border-t border-[var(--deck-chrome-line)] pt-3">
            <p className="deck-nav-group px-3 pb-1.5">Switch Workspace</p>
            <div className="space-y-0.5">
              {(
                [
                  { role: "admin", label: "Operations Command" },
                  { role: "client", label: "Client Portal" },
                  { role: "crew", label: "Crew Portal" },
                  { role: "partner", label: "Partner Portal" },
                ] as { role: PortalRole; label: string }[]
              ).map((target) => (
                <Link
                  key={target.role}
                  href={ROLE_HOME[target.role]}
                  onClick={onNavigate}
                  data-active={target.role === role}
                  className="deck-nav-link"
                >
                  <PortalIcon name="layers" className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="min-w-0 flex-1 truncate">{target.label}</span>
                  {target.role === role ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--deck-accent)]" aria-hidden />
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-[var(--deck-chrome-line)] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--deck-accent-line)] bg-[var(--deck-accent-tint)] text-xs font-bold text-[#9FC5FF]">
            <Avatar user={user} className="flex h-full w-full items-center justify-center rounded-full" />
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
        <p className="deck-micro mt-3 !text-[9px] text-[var(--deck-chrome-muted)]">
          AMG Aviation Group
        </p>
      </div>
    </>
  );
}
