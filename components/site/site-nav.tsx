"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Phone, X } from "lucide-react";
import { PUBLIC_NAV_LINKS } from "@/lib/navigation";
import { PhoneLink } from "@/components/site/tracked-link";
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
                    "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 font-mono text-[0.66rem] font-medium uppercase leading-none [letter-spacing:0.16em] text-white/[0.70] transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--instrument-ink)]",
                    active && "bg-[rgba(11,94,212,0.08)] text-white"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2.5 xl:ml-4">
          <PhoneLink
            source="nav"
            className="oc-mono hidden min-h-11 items-center gap-2 whitespace-nowrap px-2 text-sm text-white/[0.74] transition-colors hover:text-white lg:inline-flex"
          />
          <Link
            href="/connect"
            prefetch={false}
            onClick={closeMenu}
            className="hidden min-h-11 items-center whitespace-nowrap px-2 font-mono text-[0.66rem] font-medium uppercase leading-none [letter-spacing:0.16em] text-white/[0.74] transition-colors hover:text-[var(--instrument-ink)] sm:inline-flex"
          >
            Portal login
          </Link>
          <Link
            href="/request"
            prefetch={false}
            onClick={closeMenu}
            className="oc-btn oc-btn-light !hidden sm:!inline-flex"
          >
            Get a Quote
            <ArrowUpRight className="h-4 w-4" />
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

            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/request" prefetch={false} onClick={closeMenu} className="oc-btn oc-btn-light justify-center">
                Get a Quote
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/connect" prefetch={false} onClick={closeMenu} className="oc-btn oc-btn-ghost-dark justify-center">
                Portal login
              </Link>
            </div>

            <span className="inline-flex items-center gap-2 text-white/[0.82]">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <PhoneLink
                source="nav_mobile"
                className="oc-mono inline-flex min-h-11 items-center text-base text-white/[0.82]"
              />
            </span>
          </div>
        </div>
      ) : null}
    </header>
  );
}
