"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { signOut } from "@/app/portal/actions/auth";
import { PortalIcon } from "@/components/portal/ui/icon";
import { RoleBadge } from "@/components/portal/ui/status-badge";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/portal/format";
import {
  PORTAL_NAV,
  ROLE_LABELS,
  ROLE_SHORT,
  type PortalRole,
} from "@/lib/portal/constants";

type ShellUser = {
  name: string;
  email: string;
  role: PortalRole;
  companyName: string | null;
};

const NOTIFICATIONS_HREF: Record<PortalRole, string> = {
  client: "/portal/client/notifications",
  crew: "/portal/crew/notifications",
  admin: "/portal/admin/dashboard",
  partner: "/portal/partner/dashboard",
  super_admin: "/portal/admin/dashboard",
};

const SETTINGS_HREF: Record<PortalRole, string> = {
  client: "/portal/client/settings",
  crew: "/portal/crew/settings",
  admin: "/portal/admin/settings",
  partner: "/portal/partner/settings",
  super_admin: "/portal/admin/settings",
};

const WEBSITE_EDITOR_NAV = {
  label: "Website Editor",
  href: "/portal/super-admin/website-editor",
  icon: "fileText",
};

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
  const nav =
    user.role === "super_admin" && role === "admin"
      ? [WEBSITE_EDITOR_NAV, ...PORTAL_NAV.admin]
      : PORTAL_NAV[role];

  return (
    <div className="amg-portal relative min-h-screen bg-slate-50 text-slate-950 overflow-hidden lg:grid lg:grid-cols-[17.5rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-white text-foreground shadow-[4px_0_24px_rgba(15,23,42,0.05)] lg:flex">
        <SidebarContent role={role} nav={nav} />
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-white text-foreground shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent role={role} nav={nav} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col bg-slate-50">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-white/95 px-5 py-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:px-8">
          {/* Left: mobile menu + role label */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md border border-border bg-white p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden sm:block">
              <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-primary">
                {ROLE_SHORT[role]}
              </p>
              <p className="text-sm font-semibold text-foreground">{ROLE_LABELS[role]}</p>
            </div>
          </div>

          {/* Right: notifications + user identity + sign out */}
          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            <Link
              href={NOTIFICATIONS_HREF[role]}
              className="relative rounded-md border border-border bg-white p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-blue-50 hover:text-foreground"
              aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            >
              <PortalIcon name="bell" className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>

            {/* Settings link */}
            <Link
              href={SETTINGS_HREF[role]}
              className="hidden rounded-md border border-border bg-white p-2 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-blue-50 hover:text-foreground sm:block"
              aria-label="Settings"
            >
              <PortalIcon name="settings" className="h-4 w-4" />
            </Link>

            {/* User identity */}
            <div className="hidden items-center gap-3 pl-2 sm:flex">
              <div className="border-l border-border pl-3 text-right">
                <p className="max-w-[10rem] truncate text-sm font-semibold leading-tight text-foreground">
                  {user.name}
                </p>
                <p className="max-w-[10rem] truncate text-xs text-muted-foreground">
                  {user.companyName ?? user.email}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-blue-50 text-xs font-bold text-primary">
                {initials(user.name)}
              </div>
            </div>

            {/* Sign out */}
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-blue-50 hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Main content */}
        <main className="w-full max-w-full min-w-0 flex-1 overflow-hidden bg-slate-50 px-4 py-6 sm:px-5 lg:px-7 lg:py-8 2xl:px-8">
          <div className="mx-auto w-full max-w-[96rem] min-w-0 space-y-6 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  role,
  nav,
  onNavigate,
}: {
  role: PortalRole;
  nav: { label: string; href: string; icon: string }[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="shrink-0 border-b border-border px-5 py-5">
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-navy.png"
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className="h-7 w-auto"
          />
        </Link>
        <p className="mt-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          Connect Operations
        </p>
        <div className="mt-3">
          <RoleBadge role={role} />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {nav.map((item) => {
            const base = item.href.split("?")[0];
            const isOverview = base === `/portal/${role}/dashboard`;
            const active =
              pathname === base ||
              (!isOverview && pathname.startsWith(base));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-primary/20 bg-blue-50 font-semibold text-primary shadow-[inset_3px_0_0_var(--amg-accent-blue)]"
                    : "text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-foreground"
                )}
              >
                <PortalIcon name={item.icon} className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-5 py-4">
        <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
          AMG Aviation Group
        </p>
        <p className="mt-0.5 text-[0.6rem] text-slate-500">
          Part 91 Operational Support
        </p>
      </div>
    </>
  );
}
