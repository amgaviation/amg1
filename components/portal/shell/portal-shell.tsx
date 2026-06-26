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
    <div className="amg-portal relative min-h-screen text-white lg:grid lg:grid-cols-[17.5rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-[#050B14]/96 text-white shadow-[4px_0_24px_rgba(0,0,0,0.24)] lg:flex">
        <SidebarContent role={role} nav={nav} />
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-white/10 bg-[#050B14] text-white shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full border border-white/10 p-2 text-slate-300 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent role={role} nav={nav} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 bg-[#050B14]/88 px-5 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:px-8">
          {/* Left: mobile menu + role label */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md border border-white/12 bg-white/[0.04] p-2 text-slate-300 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden sm:block">
              <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-primary">
                {ROLE_SHORT[role]}
              </p>
              <p className="text-sm font-semibold text-white">{ROLE_LABELS[role]}</p>
            </div>
          </div>

          {/* Right: notifications + user identity + sign out */}
          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            <Link
              href={NOTIFICATIONS_HREF[role]}
              className="relative rounded-md border border-white/12 bg-white/[0.04] p-2 text-slate-300 transition-colors hover:border-primary/50 hover:text-white"
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
              className="hidden rounded-md border border-white/12 bg-white/[0.04] p-2 text-slate-300 transition-colors hover:border-primary/50 hover:text-white sm:block"
              aria-label="Settings"
            >
              <PortalIcon name="settings" className="h-4 w-4" />
            </Link>

            {/* User identity */}
            <div className="hidden items-center gap-3 pl-2 sm:flex">
              <div className="border-l border-white/12 pl-3 text-right">
                <p className="max-w-[10rem] truncate text-sm font-semibold leading-tight text-white">
                  {user.name}
                </p>
                <p className="max-w-[10rem] truncate text-xs text-slate-400">
                  {user.companyName ?? user.email}
                </p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/15 text-xs font-bold text-blue-100">
                {initials(user.name)}
              </div>
            </div>

            {/* Sign out */}
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/24 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-5 lg:px-7 lg:py-8 2xl:px-8">
          <div className="mx-auto w-full max-w-[96rem] space-y-6">{children}</div>
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
      <div className="shrink-0 border-b border-white/10 px-5 py-5">
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.png"
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className="h-7 w-auto"
          />
        </Link>
        <p className="mt-2 text-[0.6rem] uppercase tracking-widest text-slate-400">
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/16 font-semibold text-white ring-1 ring-primary/25"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
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
      <div className="shrink-0 border-t border-white/10 px-5 py-4">
        <p className="text-[0.6rem] uppercase tracking-wider text-slate-400">
          AMG Aviation Group
        </p>
        <p className="mt-0.5 text-[0.6rem] text-slate-500">
          Part 91 Operational Support
        </p>
      </div>
    </>
  );
}
