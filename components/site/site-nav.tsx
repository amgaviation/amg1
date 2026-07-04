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
  const closeMenu = () => setOpen(false);

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
        "fixed inset-x-0 top-0 z-50 h-[var(--public-header-height)] border-b transition-[background-color,box-shadow,border-color] duration-300",
        transparent
          ? "border-transparent bg-transparent"
          : "border-[var(--oc-line-dark)] bg-[#070B14]/92 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      )}
    >
      <nav className="oc-shell flex h-full items-center gap-5">
        <Link
          href="/"
          prefetch={false}
          onClick={closeMenu}
          className="relative z-50 flex min-h-11 flex-col justify-center gap-1"
          aria-label="AMG Aviation Group home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-short.png"
            alt="AMG Aviation Group"
            width="1110"
            height="242"
            className="h-6 w-auto md:h-7"
          />
          <span className="font-mono text-[8px] uppercase [letter-spacing:0.22em] text-[var(--t3)] max-sm:hidden">
            Aircraft support coordination
          </span>
        </Link>

        <ul className="ml-auto hidden items-center gap-1 xl:flex">
          {PUBLIC_NAV_GROUPS.map((group) => {
            const active = isActivePath(pathname, group.href) || group.items.some((item) => isActivePath(pathname, item.href));
            return (
              <li key={group.label} className="group relative">
                <Link
                  href={group.href}
                  prefetch={false}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-mono text-[0.66rem] font-medium uppercase leading-none [letter-spacing:0.16em] text-white/[0.70] transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--instrument)]",
                    active && "bg-[rgba(11, 94, 212,0.08)] text-white"
                  )}
                >
                  {group.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Link>
                <div className="invisible absolute left-1/2 top-[calc(100%+0.7rem)] w-[26rem] -translate-x-1/2 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="max-h-[calc(100svh-var(--public-header-height)-2rem)] overflow-y-auto rounded-lg border border-[var(--oc-line-dark)] bg-[#07111F]/96 p-2 shadow-[0_26px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl">
                    {group.items.map((item) => (
                      <Link
                        key={`${group.label}-${item.href}-${item.label}`}
                        href={item.href}
                        prefetch={false}
                        onClick={closeMenu}
                        className="group/item block rounded-md px-4 py-3 transition hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-white">
                          {item.label}
                          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--oc-blue)] opacity-0 transition group-hover/item:opacity-100" />
                        </span>
                        {item.description ? (
                          <span className="mt-1 block text-xs leading-5 text-[var(--oc-aluminum-2)]">{item.description}</span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2.5 xl:ml-5">
          <Link
            href="/booking-request"
            prefetch={false}
            onClick={closeMenu}
            className="oc-btn oc-btn-ghost-dark !hidden sm:!inline-flex"
          >
            Request support
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            prefetch={false}
            onClick={closeMenu}
            className="hidden min-h-11 items-center whitespace-nowrap px-2 font-mono text-[0.66rem] font-medium uppercase leading-none [letter-spacing:0.16em] text-white/[0.74] transition-colors hover:text-[var(--instrument)] sm:inline-flex"
          >
            Member login
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-white/[0.18] text-white transition-colors hover:border-white/[0.42] xl:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="amg-mobile-menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="amg-mobile-menu"
          ref={menuRef}
          className="fixed inset-x-0 top-[var(--public-header-height)] z-40 h-[calc(100svh-var(--public-header-height))] overflow-y-auto border-t border-[var(--oc-line-dark)] bg-[#050B14] px-6 pb-12 pt-6 xl:hidden"
        >
          <div className="oc-shell grid gap-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {PUBLIC_NAV_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    onClick={closeMenu}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center justify-between rounded-lg border border-[var(--oc-line-dark)] px-4 text-sm font-semibold uppercase text-white/[0.78] transition hover:border-[var(--oc-blue)] hover:text-white",
                      active && "border-[var(--oc-blue)] bg-[var(--oc-blue)]/10 text-white"
                    )}
                  >
                    {link.label}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-5">
              {PUBLIC_NAV_GROUPS.map((group) => (
                <section key={group.label} className="rounded-lg border border-[var(--oc-line-dark)] bg-white/[0.035] p-4">
                  <h2 className="oc-kicker text-[var(--oc-aluminum-2)]">{group.label}</h2>
                  <div className="mt-3 grid gap-2">
                    {group.items.map((item) => (
                      <Link
                        key={`${group.label}-mobile-${item.href}-${item.label}`}
                        href={item.href}
                        prefetch={false}
                        onClick={closeMenu}
                        className="rounded-md px-2 py-2 text-sm text-[var(--oc-aluminum)] transition hover:bg-white/[0.06] hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/booking-request" prefetch={false} onClick={closeMenu} className="oc-btn oc-btn-light justify-center">
                Request support
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/login" prefetch={false} onClick={closeMenu} className="oc-btn oc-btn-ghost-dark justify-center">
                Member login
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
