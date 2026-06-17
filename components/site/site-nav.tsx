"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/content";

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
  // Transparent, light-on-dark treatment only while the homepage cinematic hero
  // fills the viewport. Every other state (scrolled, menu open, interior pages)
  // uses the solid navy-on-paper header so the logo and links stay readable.
  const transparent = isHome && atTop && !open;

  useEffect(() => setOpen(false), [pathname]);

  // Track whether the dark hero still sits behind the fixed header (home only).
  useEffect(() => {
    if (!isHome) {
      setAtTop(false);
      return;
    }
    // Reading scrollY/innerHeight is cheap and React bails out on an
    // unchanged value, so update directly rather than via rAF (which is
    // throttled when the tab is backgrounded and would stall the swap).
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
        "fixed inset-x-0 top-0 z-50 h-[var(--public-header-height)] transition-[background-color,box-shadow,border-color] duration-300",
        transparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-[var(--oc-line)] bg-[var(--oc-paper)]/94 shadow-[0_14px_36px_rgba(11,26,43,0.08)] backdrop-blur-xl"
      )}
    >
      <nav className="oc-shell flex h-full items-center gap-5">
        <Link
          href="/"
          prefetch={false}
          className="relative z-50 flex min-h-11 items-center"
          aria-label="AMG Aviation Group — home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={transparent ? "/images/logo-white.png" : "/images/logo-navy.png"}
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className="h-7 w-auto"
          />
        </Link>

        <ul className="ml-auto hidden items-center gap-3 xl:flex 2xl:gap-5">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-11 items-center whitespace-nowrap text-[0.72rem] font-semibold uppercase leading-none transition-colors",
                    transparent
                      ? "text-[var(--oc-paper)]/75 hover:text-[var(--oc-paper)]"
                      : "text-[var(--oc-ink)]/66 hover:text-[var(--oc-ink)]",
                    active && (transparent ? "text-[var(--oc-paper)]" : "text-[var(--oc-ink)]"),
                    active && "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:bg-current"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2.5 xl:ml-5">
          <Link
            href="/request-support"
            prefetch={false}
            className={cn(
              "oc-btn hidden sm:inline-flex",
              transparent ? "oc-btn-light" : "oc-btn-primary"
            )}
          >
            Request Support
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            prefetch={false}
            className={cn(
              "hidden min-h-11 items-center whitespace-nowrap px-2 text-[0.72rem] font-semibold uppercase leading-none transition-colors sm:inline-flex",
              transparent
                ? "text-[var(--oc-paper)]/80 hover:text-[var(--oc-paper)]"
                : "text-[var(--oc-ink)]/70 hover:text-[var(--oc-ink)]"
            )}
          >
            Member Login
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border transition-colors xl:hidden",
              transparent
                ? "border-[var(--oc-line-dark)] text-[var(--oc-paper)] hover:border-[var(--oc-paper)]"
                : "border-[var(--oc-line-strong)] text-[var(--oc-ink)] hover:border-[var(--oc-navy)]"
            )}
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
          className="fixed inset-x-0 top-[var(--public-header-height)] z-40 h-[calc(100svh-var(--public-header-height))] overflow-y-auto bg-[var(--oc-paper)] px-6 pb-12 pt-6 xl:hidden"
        >
          <ul className="oc-shell flex flex-col">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                    "oc-display group flex items-center justify-between gap-4 border-b border-[var(--oc-line)] py-5 text-3xl text-[var(--oc-ink)] transition-colors sm:text-5xl",
                      active ? "text-[var(--oc-blue)]" : "hover:text-[var(--oc-blue)]"
                    )}
                  >
                    {link.label}
                    <ArrowUpRight className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="oc-shell mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/request-support" prefetch={false} className="oc-btn oc-btn-primary justify-center">
              Request Support
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/login" prefetch={false} className="oc-btn oc-btn-ghost justify-center">
              Member Login
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
