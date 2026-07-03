"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { PUBLIC_NAV_CTAS, PUBLIC_NAV_LINKS } from "@/lib/navigation";
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
    const update = () => setAtTop(window.scrollY < 32);
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
          : "border-[var(--oc-line-dark)] bg-[#060A14]/88 shadow-[0_14px_50px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
      )}
    >
      <nav className="oc-shell flex h-full items-center gap-6">
        <Link
          href="/"
          prefetch={false}
          onClick={closeMenu}
          className="relative z-50 flex min-h-11 shrink-0 items-center"
          aria-label="AMG Aviation Group home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.png"
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className="h-6 w-auto sm:h-7"
          />
        </Link>

        <ul className="mx-auto hidden items-center gap-0.5 lg:flex">
          {PUBLIC_NAV_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  onClick={closeMenu}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-11 items-center rounded-full px-3.5 text-[0.84rem] font-semibold leading-none text-white/[0.72] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
                    active && "text-white"
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-3.5 bottom-1.5 h-px origin-left scale-x-0 bg-[var(--oc-sky)] transition-transform duration-300",
                      active && "scale-x-100"
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2.5 lg:ml-0">
          <Link
            href={PUBLIC_NAV_CTAS.secondary.href}
            prefetch={false}
            onClick={closeMenu}
            className="hidden min-h-11 items-center whitespace-nowrap px-2 text-[0.84rem] font-semibold leading-none text-white/[0.74] transition-colors hover:text-white md:inline-flex"
          >
            {PUBLIC_NAV_CTAS.secondary.label}
          </Link>
          <Link
            href={PUBLIC_NAV_CTAS.primary.href}
            prefetch={false}
            onClick={closeMenu}
            className="oc-btn oc-btn-primary !hidden !min-h-11 !px-4 text-[0.84rem] sm:!inline-flex"
          >
            {PUBLIC_NAV_CTAS.primary.label}
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.16] text-white transition-colors hover:border-white/[0.4] lg:hidden"
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
          className="fixed inset-x-0 top-[var(--public-header-height)] z-40 flex h-[calc(100svh-var(--public-header-height))] flex-col overflow-y-auto border-t border-[var(--oc-line-dark)] bg-[#060A14]/97 px-6 pb-10 pt-8 backdrop-blur-2xl lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {PUBLIC_NAV_LINKS.map((link, index) => {
              const active = isActivePath(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    onClick={closeMenu}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "amg-rise flex min-h-14 items-center justify-between border-b border-white/[0.07] font-display text-2xl font-semibold text-white/[0.85] transition-colors hover:text-white",
                      active && "text-[var(--oc-sky)]"
                    )}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    {link.label}
                    <ArrowUpRight className="h-5 w-5 opacity-40" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto grid gap-3 pt-10">
            <Link
              href={PUBLIC_NAV_CTAS.primary.href}
              prefetch={false}
              onClick={closeMenu}
              className="oc-btn oc-btn-primary w-full"
            >
              {PUBLIC_NAV_CTAS.primary.label}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href={PUBLIC_NAV_CTAS.secondary.href}
              prefetch={false}
              onClick={closeMenu}
              className="oc-btn oc-btn-ghost-dark w-full"
            >
              {PUBLIC_NAV_CTAS.secondary.label}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
