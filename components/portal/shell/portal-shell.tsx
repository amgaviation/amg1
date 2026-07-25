"use client";

import { Suspense, createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/app/portal/actions/auth";
import { CommandPalette } from "@/components/portal/shell/command-palette";
import { HelpMenu, IdleTipCoach } from "@/components/portal/ui/help-tips";
import { PortalIcon } from "@/components/portal/ui/icon";
import { ThemeToggle } from "@/components/portal/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/portal/format";
import { clearPortalIntroBrowserState } from "@/lib/portal/intro";
import {
  DECK_NAV,
  PRIMARY_ACTION,
  ROLE_HOME,
  ROLE_LABELS,
  ROLE_SHORT,
  SUPER_ADMIN_NAV_GROUP,
  isAdminRole,
  type NavGroup,
  type NavItem,
  type PortalRole,
} from "@/lib/portal/constants";
import { navModuleForHref } from "@/lib/portal/permissions-catalog";

/**
 * AMG Connect "Meridian" shell — a top-navigation product frame.
 *
 * No sidebar anywhere: the brand and the role's workspaces run across the
 * top; the active workspace's destinations appear as a contextual tab row
 * beneath. Content sits centered on an open canvas. Phones get the same
 * two rows plus a full-screen menu sheet. An idle-time tip coach and a
 * per-page Help menu provide contextual guidance.
 *
 * Rendered once by the per-role layout (app/portal/<role>/layout.tsx). Pages
 * that still render their own <PortalShell> are harmless: a nested shell
 * detects the layout-rendered one via context and renders bare children.
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

function resolveNavGroups(role: PortalRole, user: ShellUser): NavGroup[] {
  const base = role === "super_admin" ? DECK_NAV.admin : DECK_NAV[role];
  // Website governance is a super_admin-only workspace; it also rides along
  // when a super admin works the admin console.
  if (
    (user.role === "super_admin" && role === "admin") ||
    (user.role === "super_admin" && role === "super_admin")
  ) {
    return [...base, SUPER_ADMIN_NAV_GROUP];
  }
  return base;
}

/**
 * Hide nav items whose module the role cannot view (role-permission matrix).
 * Chrome only — pages and actions remain the enforcement boundary. Items with
 * no module mapping (dashboards, workspace landings) always show, and a
 * missing map fails open so the shell never blanks out on a lookup error.
 */
function filterNavGroups(groups: NavGroup[], moduleView?: Record<string, boolean>): NavGroup[] {
  const allowed = (href: string) => {
    if (!moduleView) return true;
    const moduleKey = navModuleForHref(href);
    return !moduleKey || moduleView[moduleKey] !== false;
  };
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed(item.href)),
      href: group.href && allowed(group.href) ? group.href : undefined,
    }))
    .filter((group) => group.items.length > 0)
    .map((group) => ({ ...group, href: group.href ?? group.items[0].href }));
}

function baseOf(href: string) {
  return href.split("?")[0];
}

/** The workspace whose items best match the current pathname. */
function activeGroupFor(groups: NavGroup[], pathname: string): NavGroup | null {
  let best: NavGroup | null = null;
  let bestLen = -1;
  for (const group of groups) {
    const candidates = [...group.items.map((i) => i.href), ...(group.href ? [group.href] : [])];
    for (const href of candidates) {
      const base = baseOf(href);
      if ((pathname === base || pathname.startsWith(`${base}/`)) && base.length > bestLen) {
        best = group;
        bestLen = base.length;
      }
    }
  }
  return best;
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
  const pathname = usePathname();
  const navGroups = filterNavGroups(resolveNavGroups(role, user), moduleView);
  const activeGroup = activeGroupFor(navGroups, pathname);
  const primaryAction = PRIMARY_ACTION[role];
  const showPrimaryAction =
    primaryAction &&
    (!moduleView ||
      (() => {
        const moduleKey = navModuleForHref(primaryAction.href);
        return !moduleKey || moduleView[moduleKey] !== false;
      })());
  // An admin inside another role's workspace is previewing a layout with
  // their own account — never another user's data, never a different role.
  const previewing = isAdminRole(user.role) && role !== "admin" && role !== "super_admin";

  const sheetRef = useRef<HTMLElement | null>(null);
  const sheetReturnFocus = useRef<HTMLElement | null>(null);

  // Menu-sheet ergonomics: lock body scroll, move focus in, trap Tab, close
  // on Escape, restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const FOCUSABLE =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetReturnFocus.current = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const panel = sheetRef.current;
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
      sheetReturnFocus.current?.focus?.();
    };
  }, [open]);

  // A shell already wraps this subtree (per-role layout): stay out of the way.
  if (nested) return <>{children}</>;

  return (
    <ShellNestingContext.Provider value={true}>
      <div className="amg-portal relative flex min-h-screen flex-col bg-[var(--deck-canvas)] overflow-x-clip">
        {/* ── Top bar: brand · workspaces · actions ── */}
        <header className="sticky top-0 z-30 border-b border-[var(--deck-line)] bg-[var(--deck-panel)]/95 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-[86rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border border-[var(--deck-line)] p-2.5 text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-line-strong)] hover:text-[var(--deck-text)] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href={ROLE_HOME[role]} className="flex shrink-0 items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-navy.png" alt="AMG Aviation Group" width="1088" height="221" className="logo-when-light h-5 w-auto sm:h-6" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo-white.png" alt="" width="1088" height="221" className="logo-when-dark h-5 w-auto sm:h-6" />
              <span className="hidden text-[0.8125rem] font-medium text-[var(--deck-text-3)] 2xl:inline">
                Connect
              </span>
            </Link>

            {/* Workspace navigation */}
            <nav
              aria-label="Workspaces"
              className="deck-scroll-x hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex"
            >
              {navGroups.map((group) => {
                const isActive = group.label === activeGroup?.label;
                return (
                  <Link
                    key={group.label}
                    href={group.href ?? group.items[0].href}
                    data-active={isActive}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-[0.84rem] font-medium transition-colors",
                      isActive
                        ? "bg-[var(--deck-accent-tint)] font-semibold text-[var(--deck-accent-ink)]"
                        : "text-[var(--deck-text-2)] hover:bg-[var(--deck-panel-2)] hover:text-[var(--deck-text)]"
                    )}
                  >
                    {group.label}
                  </Link>
                );
              })}
            </nav>
            <div className="min-w-0 flex-1 lg:hidden" />

            {/* Right cluster */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {showPrimaryAction ? (
                <Link
                  href={primaryAction!.href}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--deck-accent)] px-3 py-2 text-[0.8125rem] font-semibold text-[var(--deck-on-accent)] shadow-[var(--deck-shadow-card)] transition-opacity hover:opacity-90 sm:px-4"
                >
                  <PortalIcon name={primaryAction!.icon} className="h-4 w-4" />
                  <span className="hidden md:inline">{primaryAction!.label}</span>
                </Link>
              ) : null}
              {isAdminRole(user.role) ? <CommandPalette /> : null}
              <ZuluClock />
              <HelpMenu />
              {isAdminRole(user.role) ? <PreviewMenu role={role} /> : null}
              <ThemeToggle />
              <Link
                href={NOTIFICATIONS_HREF[role]}
                className="relative rounded-lg p-2 text-[var(--deck-text-2)] transition-colors hover:bg-[var(--deck-panel-2)] hover:text-[var(--deck-text)]"
                aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
              >
                <PortalIcon name="bell" className="h-[1.1rem] w-[1.1rem]" />
                {unread > 0 && (
                  <span className="deck-num absolute right-0 top-0 flex h-4 min-w-[1.05rem] items-center justify-center rounded-full bg-[var(--deck-accent)] px-1 text-[0.6rem] font-bold text-[var(--deck-on-accent)]">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
              <UserMenu role={role} user={user} />
            </div>
          </div>

          {/* ── Contextual tabs: destinations inside the active workspace ── */}
          {activeGroup && activeGroup.items.filter((i) => !i.secondary).length > 1 ? (
            <Suspense fallback={<ContextTabs group={activeGroup} pathname={pathname} />}>
              <ContextTabsWithQuery group={activeGroup} pathname={pathname} />
            </Suspense>
          ) : null}
        </header>

        {/* Preview notice — admins looking at another role's workspace. */}
        {previewing ? (
          <div className="border-b border-[var(--deck-info-line)] bg-[var(--deck-info-tint)]">
            <div className="mx-auto flex w-full max-w-[86rem] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs text-[var(--deck-info)] sm:px-6 lg:px-8">
              <span className="font-semibold">Previewing the {ROLE_LABELS[role]} layout</span>
              <span className="hidden sm:inline">
                You are signed in with your administrator account — this is not another user&apos;s view.
              </span>
              <Link href={ROLE_HOME[user.role]} className="ml-auto font-semibold underline underline-offset-2 hover:opacity-80">
                Exit preview
              </Link>
            </div>
          </div>
        ) : null}

        {/* Menu sheet (phones / tablets) */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="absolute inset-0 bg-[var(--deck-scrim)] backdrop-blur-sm" onClick={() => setOpen(false)} />
            <aside
              ref={sheetRef}
              className="absolute inset-x-0 top-0 max-h-[92dvh] overflow-y-auto rounded-b-2xl border-b border-[var(--deck-line)] bg-[var(--deck-panel)] pb-6 shadow-[var(--deck-shadow-modal)]"
            >
              <div className="flex items-center justify-between px-5 pb-2 pt-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo-navy.png" alt="AMG Aviation Group" width="1088" height="221" className="logo-when-light h-5 w-auto" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo-white.png" alt="" width="1088" height="221" className="logo-when-dark h-5 w-auto" />
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[var(--deck-line)] p-2.5 text-[var(--deck-text-2)] hover:text-[var(--deck-text)]"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <MenuSheet
                role={role}
                user={user}
                navGroups={navGroups}
                activeGroup={activeGroup}
                pathname={pathname}
                primaryAction={showPrimaryAction ? primaryAction : undefined}
                onNavigate={() => setOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="w-full max-w-full min-w-0 overflow-hidden flex-1">
          <div className="mx-auto w-full max-w-[86rem] min-w-0 space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </div>
        </main>

        <footer className="border-t border-[var(--deck-line)]">
          <p className="deck-micro mx-auto w-full max-w-[86rem] px-4 py-3 text-[var(--deck-text-3)] sm:px-6 lg:px-8">
            AMG Aviation Group · AMG Connect · {ROLE_SHORT[role]} · Times in UTC
          </p>
        </footer>

        <IdleTipCoach />
      </div>
    </ShellNestingContext.Provider>
  );
}

function ContextTabsWithQuery({ group, pathname }: { group: NavGroup; pathname: string }) {
  const searchParams = useSearchParams();
  return <ContextTabs group={group} pathname={pathname} search={searchParams?.toString() ?? ""} />;
}

/**
 * Second row: the active workspace's destinations as quiet underline tabs.
 * Plain links — deep links, bookmarks, and back/forward all keep working.
 * Query-pinned items (e.g. ?pool=open) win only when their params match.
 */
function ContextTabs({
  group,
  pathname,
  search = "",
}: {
  group: NavGroup;
  pathname: string;
  search?: string;
}) {
  const items = group.items.filter((item) => !item.secondary);
  const current = new URLSearchParams(search);

  let activeHref: string | null = null;
  let bestScore = -1;
  for (const item of items) {
    const [base, query] = item.href.split("?");
    if (!(pathname === base || pathname.startsWith(`${base}/`))) continue;
    let score = base.length * 10;
    if (query) {
      const wanted = new URLSearchParams(query);
      let matched = true;
      for (const [key, value] of wanted.entries()) {
        if (current.get(key) !== value) matched = false;
      }
      score += matched ? 1000 : -5;
    }
    if (score > bestScore) {
      bestScore = score;
      activeHref = item.href;
    }
  }

  return (
    <nav aria-label={`${group.label} sections`} className="border-t border-[var(--deck-line)]">
      <div className="deck-scroll-x mx-auto -mb-px flex w-full max-w-[86rem] gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[2.65rem] shrink-0 items-center border-b-2 px-3 text-[0.84rem] font-medium transition-colors",
                active
                  ? "border-[var(--deck-accent)] font-semibold text-[var(--deck-accent-ink)]"
                  : "border-transparent text-[var(--deck-text-2)] hover:border-[var(--deck-line-strong)] hover:text-[var(--deck-text)]"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
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
      className="deck-num hidden items-center gap-1.5 rounded-full border border-[var(--deck-line)] px-3 py-1.5 text-xs text-[var(--deck-text-2)] md:flex"
      title="Coordinated Universal Time"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--deck-success)]" aria-hidden />
      <span className="font-semibold">{hh}:{mm} UTC</span>
    </div>
  );
}

/**
 * Admin layout preview — opens another role's workspace with the admin's own
 * account. Explicitly a preview: it never impersonates a user or changes the
 * acting role, and the shell shows a persistent banner while inside one.
 */
function PreviewMenu({ role }: { role: PortalRole }) {
  const [open, setOpen] = useState(false);
  const targets: { role: PortalRole; label: string }[] = [
    { role: "client", label: "Client workspace" },
    { role: "crew", label: "Crew workspace" },
    { role: "partner", label: "Partner workspace" },
  ];
  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--deck-line)] px-3 py-1.5 text-xs font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-line-strong)] hover:text-[var(--deck-text)]"
      >
        <PortalIcon name="layers" className="h-3.5 w-3.5" />
        Preview
        <ChevronDown className={cn("h-3 w-3", open && "rotate-180")} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="deck-card absolute right-0 z-50 mt-2 w-64 p-1.5 shadow-[var(--deck-shadow-pop)]">
            <p className="px-3 pb-1.5 pt-2 text-[0.7rem] leading-4 text-[var(--deck-text-3)]">
              Open a role&apos;s workspace layout with your admin account. Not an
              impersonation — you keep your own access and identity.
            </p>
            {targets.map((t) => (
              <Link
                key={t.role}
                href={ROLE_HOME[t.role]}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--deck-accent-tint)]",
                  t.role === role ? "font-semibold text-[var(--deck-accent-ink)]" : "text-[var(--deck-text-2)]"
                )}
              >
                {t.label}
                {t.role === role ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--deck-accent)]" aria-hidden />
                ) : null}
              </Link>
            ))}
            {role !== "admin" && role !== "super_admin" ? (
              <Link
                href={ROLE_HOME.admin}
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-lg border-t border-[var(--deck-line)] px-3 py-2 text-sm font-semibold text-[var(--deck-text)] hover:bg-[var(--deck-accent-tint)]"
              >
                <PortalIcon name="gauge" className="h-4 w-4" />
                Back to Operations
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Avatar dropdown: identity, workspace label, profile, settings, sign out. */
function UserMenu({ role, user }: { role: PortalRole; user: ShellUser }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--deck-line-strong)] bg-[var(--deck-accent-tint)] text-[0.68rem] font-bold text-[var(--deck-accent-ink)] transition-colors hover:border-[var(--deck-accent)]"
      >
        <Avatar user={user} className="flex h-full w-full items-center justify-center rounded-full" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="deck-card absolute right-0 z-50 mt-2 w-64 overflow-hidden shadow-[var(--deck-shadow-pop)]">
            <div className="border-b border-[var(--deck-line)] px-4 py-3">
              <p className="truncate text-sm font-semibold text-[var(--deck-text)]">{user.name}</p>
              <p className="truncate text-xs text-[var(--deck-text-3)]">{user.companyName ?? user.email}</p>
              <p className="deck-micro mt-2 text-[var(--deck-text-3)]">{ROLE_LABELS[role]}</p>
            </div>
            <div className="p-1.5">
              <Link
                href={PROFILE_HREF[role]}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--deck-text-2)] transition-colors hover:bg-[var(--deck-accent-tint)] hover:text-[var(--deck-text)]"
              >
                <PortalIcon name="users" className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href={SETTINGS_HREF[role]}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--deck-text-2)] transition-colors hover:bg-[var(--deck-accent-tint)] hover:text-[var(--deck-text)]"
              >
                <PortalIcon name="settings" className="h-4 w-4" />
                Settings
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  onClick={clearPortalIntroBrowserState}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[var(--deck-text-2)] transition-colors hover:bg-[var(--deck-danger-tint)] hover:text-[var(--deck-danger)]"
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

/** Full navigation for the menu sheet: workspaces with destinations inline. */
function MenuSheet({
  role,
  user,
  navGroups,
  activeGroup,
  pathname,
  primaryAction,
  onNavigate,
}: {
  role: PortalRole;
  user: ShellUser;
  navGroups: NavGroup[];
  activeGroup: NavGroup | null;
  pathname: string;
  primaryAction?: NavItem;
  onNavigate: () => void;
}) {
  return (
    <div className="px-3">
      {primaryAction ? (
        <Link
          href={primaryAction.href}
          onClick={onNavigate}
          className="mx-2 mb-3 flex min-h-[2.75rem] items-center justify-center gap-2 rounded-full bg-[var(--deck-accent)] px-4 text-sm font-semibold text-[var(--deck-on-accent)]"
        >
          <PortalIcon name={primaryAction.icon} className="h-4 w-4" />
          {primaryAction.label}
        </Link>
      ) : null}
      <nav aria-label="Workspaces" className="space-y-1">
        {navGroups.map((group) => {
          const isActive = group.label === activeGroup?.label;
          const subItems = group.items.filter(
            (item) => !item.secondary && baseOf(item.href) !== baseOf(group.href ?? "")
          );
          return (
            <div key={group.label} className={cn(isActive && "rounded-xl bg-[var(--deck-panel-2)] pb-1")}>
              <Link
                href={group.href ?? group.items[0].href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium",
                  isActive ? "font-semibold text-[var(--deck-accent-ink)]" : "text-[var(--deck-text-2)]"
                )}
              >
                <PortalIcon name={group.icon ?? group.items[0].icon} className="h-[1.1rem] w-[1.1rem] opacity-80" />
                {group.label}
              </Link>
              {isActive && subItems.length > 0 ? (
                <div className="ml-10 space-y-0.5 pb-1.5">
                  {subItems.map((item) => {
                    const itemActive =
                      pathname === baseOf(item.href) || pathname.startsWith(`${baseOf(item.href)}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex min-h-[2.4rem] items-center rounded-lg px-3 text-[0.875rem]",
                          itemActive
                            ? "font-semibold text-[var(--deck-accent-ink)]"
                            : "text-[var(--deck-text-2)]"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      {isAdminRole(user.role) ? (
        <div className="mt-4 border-t border-[var(--deck-line)] px-2 pt-3">
          <p className="deck-micro pb-1.5 text-[var(--deck-text-3)]">Preview role layouts</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { role: "admin", label: "Operations" },
                { role: "client", label: "Client" },
                { role: "crew", label: "Crew" },
                { role: "partner", label: "Partner" },
              ] as { role: PortalRole; label: string }[]
            ).map((target) => (
              <Link
                key={target.role}
                href={ROLE_HOME[target.role]}
                onClick={onNavigate}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-medium",
                  target.role === role
                    ? "border-transparent bg-[var(--deck-accent)] text-[var(--deck-on-accent)]"
                    : "border-[var(--deck-line-strong)] text-[var(--deck-text-2)]"
                )}
              >
                {target.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
