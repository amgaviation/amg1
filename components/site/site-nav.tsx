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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

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

  // transparent over the dark hero at the very top; solid ivory once scrolled
  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-[var(--public-header-height)] transition-colors duration-300 motion-reduce:transition-none",
        solid
          ? "border-b border-[var(--oc-line)] bg-[var(--oc-paper)]/88 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="oc-shell flex h-full items-center gap-6">
        <Link href="/" prefetch={false} className="relative z-50 flex min-h-11 items-center" aria-label="AMG Aviation Group — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.png"
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className={cn("h-7 w-auto transition-opacity duration-300", solid ? "opacity-0" : "opacity-100")}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-navy.png"
            alt=""
            aria-hidden="true"
            width="1088"
            height="221"
            className={cn("absolute left-0 h-7 w-auto transition-opacity duration-300", solid ? "opacity-100" : "opacity-0")}
          />
        </Link>

        <ul className="ml-auto hidden items-center gap-7 xl:flex">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "oc-kicker relative inline-flex min-h-11 items-center transition-colors",
                    solid ? "text-[var(--oc-ink)]/65 hover:text-[var(--oc-ink)]" : "text-white/75 hover:text-white",
                    active && (solid ? "text-[var(--oc-ink)]" : "text-white"),
                    active && "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:bg-current"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2.5 xl:ml-8">
          <Link
            href="/login"
            prefetch={false}
            className={cn(
              "oc-kicker hidden min-h-11 items-center px-2 transition-colors sm:inline-flex",
              solid ? "text-[var(--oc-ink)]/70 hover:text-[var(--oc-ink)]" : "text-white/80 hover:text-white"
            )}
          >
            Member Login
          </Link>
          <Link
            href="/contact"
            prefetch={false}
            className={cn("oc-btn hidden sm:inline-flex", solid ? "oc-btn-primary" : "oc-btn-light")}
          >
            Request Support
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors xl:hidden",
              solid ? "border-[var(--oc-line-strong)] text-[var(--oc-ink)]" : "border-white/30 text-white"
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
                      "oc-display group flex items-center justify-between border-b border-[var(--oc-line)] py-5 text-4xl text-[var(--oc-ink)] transition-colors sm:text-5xl",
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
            <Link href="/login" prefetch={false} className="oc-btn oc-btn-ghost justify-center">
              Member Login
            </Link>
            <Link href="/contact" prefetch={false} className="oc-btn oc-btn-primary justify-center">
              Request Support
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
