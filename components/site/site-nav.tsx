"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { PUBLIC_NAV_GROUPS, PUBLIC_NAV_LINKS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function normalizePath(path: string) {
  const normalized = path.split(/[?#]/)[0].replace(/\/+$/, "");
  return normalized || "/";
}

function isActivePath(pathname: string, href: string) {
  const current = normalizePath(pathname);
  const target = normalizePath(href);
  return target === "/" ? current === "/" : current === target || current.startsWith(`${target}/`);
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isHome = normalizePath(pathname) === "/";
  const transparent = isHome && atTop && !open;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!isHome) {
      setAtTop(false);
      return;
    }
    const update = () => setAtTop(window.scrollY < window.innerHeight - 88);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isHome]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = menuRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]");
    focusable?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-[var(--public-header-height)] border-b transition-all duration-300",
        transparent
          ? "border-transparent bg-transparent"
          : "border-white/[0.06] bg-black/40 shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl"
      )}
    >
      <nav className="oc-shell flex h-full items-center gap-4">
        <Link
          href="/"
          prefetch={false}
          className="relative z-50 flex min-h-11 items-center"
          aria-label="AMG Aviation Group home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.png"
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className="h-6 w-auto"
          />
        </Link>

        <ul className="ml-auto hidden items-center gap-0.5 xl:flex">
          {PUBLIC_NAV_GROUPS.map((group) => {
            const active = isActivePath(pathname, group.href) || group.items.some((item) => isActivePath(pathname, item.href));
            return (
              <li key={group.label} className="group relative">
                <Link
                  href={group.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1 rounded-full px-3.5 text-[0.7rem] font-semibold uppercase tracking-widest leading-none text-white/50 transition-all duration-200 hover:bg-white/[0.05] hover:text-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
                    active && "bg-white/[0.06] text-white/90"
                  )}
                >
                  {group.label}
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Link>
                <div className="invisible absolute left-1/2 top-[calc(100%+0.5rem)] w-[22rem] -translate-x-1/2 -translate-y-1 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="rounded-xl border border-white/[0.07] bg-black/80 p-1.5 shadow-[0_30px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                    {group.items.map((item) => (
                      <Link
                        key={`${group.label}-${item.href}-${item.label}`}
                        href={item.href}
                        prefetch={false}
                        className="group/item block rounded-lg px-4 py-2.5 transition hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <span className="flex items-center justify-between gap-3 text-[0.8rem] font-semibold text-white/80">
                          {item.label}
                          <ArrowUpRight className="h-3 w-3 text-white/30 opacity-0 transition group-hover/item:opacity-100" />
                        </span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs leading-5 text-white/30">{item.description}</span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2 xl:ml-4">
          <Link
            href="/request-support"
            prefetch={false}
            className="!hidden sm:!inline-flex items-center gap-2 rounded-full border border-white/90 bg-white px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-widest text-black transition-all duration-200 hover:bg-white/85 hover:shadow-[0_0_28px_rgba(255,255,255,0.15)]"
          >
            Start a Request
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/login"
            prefetch={false}
            className="hidden min-h-9 items-center rounded-full border border-white/[0.1] px-4 text-[0.7rem] font-semibold uppercase tracking-widest leading-none text-white/50 transition-all duration-200 hover:border-white/[0.2] hover:text-white/90 sm:inline-flex"
          >
            Login
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-white/70 transition-all duration-200 hover:border-white/[0.2] hover:text-white xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="amg-mobile-menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="amg-mobile-menu"
          ref={menuRef}
          className="fixed inset-x-0 top-[var(--public-header-height)] z-40 h-[calc(100svh-var(--public-header-height))] overflow-y-auto border-t border-white/[0.06] bg-black/95 px-6 pb-12 pt-6 backdrop-blur-2xl xl:hidden"
        >
          <div className="oc-shell grid gap-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {PUBLIC_NAV_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center justify-between rounded-xl border border-white/[0.07] px-4 text-sm font-semibold uppercase tracking-widest text-white/60 transition hover:border-white/[0.14] hover:text-white",
                      active && "border-white/[0.14] bg-white/[0.04] text-white"
                    )}
                  >
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-4">
              {PUBLIC_NAV_GROUPS.map((group) => (
                <section key={group.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h2 className="oc-kicker text-white/30 tracking-widest">{group.label}</h2>
                  <div className="mt-3 grid gap-1">
                    {group.items.map((item) => (
                      <Link
                        key={`${group.label}-mobile-${item.href}-${item.label}`}
                        href={item.href}
                        prefetch={false}
                        className="rounded-lg px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/request-support" prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-full border border-white bg-white px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-widest text-black transition hover:bg-white/85">
                Start a Request
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/login" prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.1] px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-widest text-white/60 transition hover:border-white/[0.2] hover:text-white">
                Member Login
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
