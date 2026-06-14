"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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
  const nav = PORTAL_NAV[role];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-950 lg:grid lg:grid-cols-[17rem_1fr]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_84%_0%,rgba(59,130,246,0.13),transparent_30rem),radial-gradient(circle_at_10%_16%,rgba(56,189,248,0.08),transparent_24rem),linear-gradient(180deg,rgba(248,251,255,1),rgba(239,244,250,1))]" />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/10 bg-[var(--amg-ink)] text-white shadow-[12px_0_40px_rgba(8,20,36,0.12)] lg:flex">
        <SidebarContent role={role} nav={nav} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-white/10 bg-[var(--amg-ink)] text-white">
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
      ) : null}

      <div className="flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 py-3 shadow-[0_10px_30px_rgba(8,20,36,0.06)] backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-md border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden sm:block">
              <p className="eyebrow text-[0.6rem] text-primary">{ROLE_SHORT[role]}</p>
              <p className="text-sm font-semibold text-slate-950">{ROLE_LABELS[role]}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/portal/${role}/dashboard`}
              className="relative rounded-md border border-slate-200 bg-white p-2 text-slate-500 hover:text-primary"
              aria-label="Notifications"
            >
              <PortalIcon name="bell" className="h-4 w-4" />
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight text-slate-950">{user.name}</p>
                <p className="text-xs text-slate-500">{user.companyName ?? user.email}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-xs font-bold text-primary shadow-[0_0_28px_rgba(59,130,246,0.12)]">
                {initials(user.name)}
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-primary hover:text-primary"
              >
                <PortalIcon name="logout" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
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
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-white.png" alt="AMG Aviation Group" width="1088" height="221" className="h-7 w-auto" />
        </Link>
        <p className="mt-1 text-[0.62rem] uppercase text-slate-400">
          Connect Operations
        </p>
        <div className="mt-3">
          <RoleBadge role={role} />
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const base = item.href.split("?")[0];
          const active =
            pathname === base ||
            (base !== `/portal/${role}/dashboard` && pathname.startsWith(base));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                active
                  ? "border-sky-300/30 bg-sky-300/12 font-semibold text-sky-200 shadow-[0_12px_34px_rgba(59,130,246,0.12)]"
                  : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/8 hover:text-white"
              )}
            >
              <PortalIcon name={item.icon} className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-[0.62rem] leading-5 text-slate-400">
        AMG Aviation Group
        <br />
        Part 91 Operational Support
      </div>
    </>
  );
}
