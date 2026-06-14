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
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  return targetPath === "/"
    ? currentPath === "/"
    : currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        "fixed inset-x-0 top-0 z-50 h-[var(--public-header-height)] border-b transition-all duration-200 motion-reduce:transition-none",
        scrolled || open
          ? "border-white/10 bg-[var(--amg-ink)]/94 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-xl"
          : "border-white/12 bg-slate-950/12 backdrop-blur-sm"
      )}
    >
      <nav className="relative z-50 mx-auto flex h-full max-w-7xl items-center gap-6 px-6 lg:px-10">
        <Link href="/" prefetch={false} className="group flex min-h-11 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.png"
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className="h-8 w-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
          />
        </Link>

        <ul className="ml-auto hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "eyebrow relative text-xs transition-colors",
                    active
                      ? "text-accent after:absolute after:inset-x-0 after:-bottom-2 after:h-px after:bg-accent"
                      : "text-slate-200 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <Link
            href="/login"
            prefetch={false}
            aria-current={isActivePath(pathname, "/login") ? "page" : undefined}
            className={cn(
              "hidden min-h-11 items-center gap-1.5 rounded-full border px-5 py-2.5 font-display text-xs font-semibold uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:inline-flex",
              isActivePath(pathname, "/login")
                ? "border-accent bg-accent/10 text-accent"
                : "border-white/20 bg-white/8 text-white hover:border-accent hover:text-accent"
            )}
          >
            Member Login
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/contact"
            prefetch={false}
            aria-current={isActivePath(pathname, "/contact") ? "page" : undefined}
            className={cn(
              "hidden min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-display text-xs font-semibold uppercase text-primary-foreground shadow-[0_18px_34px_rgba(59,130,246,0.22)] transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:inline-flex",
              isActivePath(pathname, "/contact") &&
                "ring-2 ring-accent ring-offset-2 ring-offset-background"
            )}
          >
            Request Support
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/8 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="public-mobile-menu"
          ref={menuRef}
          className="fixed inset-0 z-40 overflow-y-auto border-t border-slate-200 bg-white/96 px-6 pb-10 pt-[calc(var(--public-header-height)+2rem)] backdrop-blur-2xl animate-in fade-in duration-300"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_12%,rgba(59,130,246,0.16),transparent_28rem),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,246,252,0.98))]" />
          <ul className="mx-auto flex max-w-7xl flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group block border-b border-slate-200 px-0 py-5 font-display text-5xl font-extrabold uppercase leading-none text-slate-950 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:text-6xl lg:text-7xl",
                      active
                        ? "text-primary"
                        : "text-slate-800 hover:text-primary"
                    )}
                  >
                    <span className="inline-flex items-center gap-4">
                      {link.label}
                      <ArrowUpRight className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  </Link>
                </li>
              );
            })}
            <li className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2 lg:max-w-2xl">
              <Link
                href="/login"
                prefetch={false}
                aria-current={isActivePath(pathname, "/login") ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border px-5 py-3 font-display text-xs font-semibold uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
                  isActivePath(pathname, "/login")
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-300 text-slate-800"
                )}
              >
                Member Login
              </Link>
              <Link
                href="/contact"
                prefetch={false}
                aria-current={isActivePath(pathname, "/contact") ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 py-3 font-display text-xs font-semibold uppercase text-primary-foreground shadow-[0_18px_34px_rgba(59,130,246,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
                  isActivePath(pathname, "/contact") &&
                    "ring-2 ring-accent ring-offset-2 ring-offset-background"
                )}
              >
                Request Support
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
