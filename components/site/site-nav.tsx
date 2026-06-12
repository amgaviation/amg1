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
        "fixed inset-x-0 top-0 z-50 h-[var(--public-header-height)] border-b transition-colors duration-200 motion-reduce:transition-none",
        scrolled
          ? "border-border bg-background/90 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-[18px]"
          : "border-transparent bg-background/35 backdrop-blur-sm"
      )}
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center gap-6 px-6 lg:px-10">
        <Link href="/" prefetch={false} className="group flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-white.png" alt="AMG Aviation Group" width="1088" height="221" className="h-8 w-auto" />
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
                      : "text-foreground/70 hover:text-foreground"
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
              "hidden min-h-11 items-center gap-1.5 rounded-full border px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:inline-flex",
              isActivePath(pathname, "/login")
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-foreground hover:border-accent hover:text-accent"
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
              "hidden min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:inline-flex",
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent lg:hidden"
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
          className="fixed inset-x-0 top-[var(--public-header-height)] max-h-[calc(100svh-var(--public-header-height))] overflow-y-auto border-t border-border bg-background/98 px-6 py-8 backdrop-blur-xl lg:hidden"
        >
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block min-h-12 rounded-lg px-4 py-3 font-display text-lg font-semibold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-foreground/80 hover:bg-secondary/50 hover:text-accent"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-4 flex flex-col gap-3 border-t border-border pt-5">
              <Link
                href="/login"
                prefetch={false}
                aria-current={isActivePath(pathname, "/login") ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                  isActivePath(pathname, "/login")
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-foreground"
                )}
              >
                Member Login
              </Link>
              <Link
                href="/contact"
                prefetch={false}
                aria-current={isActivePath(pathname, "/contact") ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
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
