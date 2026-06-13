"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/content";
import { MagneticLink } from "@/components/site/magnetic-link";

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
          ? "border-white/10 bg-background/80 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-[22px]"
          : "border-white/5 bg-background/20 backdrop-blur-md"
      )}
    >
      <nav className="relative z-50 mx-auto flex h-full max-w-7xl items-center gap-6 px-6 lg:px-10">
        <Link href="/" prefetch={false} className="group flex items-center gap-3" data-cursor="HOME">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.png"
            alt="AMG Aviation Group"
            width="1088"
            height="221"
            className="h-8 w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
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
                  data-cursor="OPEN"
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
          <MagneticLink
            href="/login"
            prefetch={false}
            aria-current={isActivePath(pathname, "/login") ? "page" : undefined}
            cursorLabel="ENTER"
            className={cn(
              "magnetic-link hidden min-h-11 items-center gap-1.5 rounded-full border px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:inline-flex",
              isActivePath(pathname, "/login")
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-foreground hover:border-accent hover:text-accent"
            )}
          >
            Member Login
            <ArrowUpRight className="h-3.5 w-3.5" />
          </MagneticLink>
          <MagneticLink
            href="/contact"
            prefetch={false}
            aria-current={isActivePath(pathname, "/contact") ? "page" : undefined}
            cursorLabel="REQUEST"
            className={cn(
              "magnetic-link hidden min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-[0_18px_44px_rgba(59,130,246,0.24)] transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:inline-flex",
              isActivePath(pathname, "/contact") &&
                "ring-2 ring-accent ring-offset-2 ring-offset-background"
            )}
          >
            Request Support
          </MagneticLink>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            data-cursor={open ? "CLOSE" : "MENU"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="public-mobile-menu"
          ref={menuRef}
          className="fixed inset-0 z-40 overflow-y-auto border-t border-white/10 bg-background/96 px-6 pb-10 pt-[calc(var(--public-header-height)+2rem)] backdrop-blur-2xl animate-in fade-in duration-300"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_12%,rgba(59,130,246,0.22),transparent_28rem),linear-gradient(180deg,rgba(5,11,20,0.92),rgba(3,7,13,0.98))]" />
          <ul className="mx-auto flex max-w-7xl flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    data-cursor="OPEN"
                    className={cn(
                      "group block border-b border-white/10 px-0 py-5 font-display text-5xl font-extrabold uppercase leading-none tracking-wide text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:text-6xl lg:text-7xl",
                      active
                        ? "text-accent"
                        : "text-foreground/80 hover:text-accent"
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
              <MagneticLink
                href="/login"
                prefetch={false}
                aria-current={isActivePath(pathname, "/login") ? "page" : undefined}
                cursorLabel="ENTER"
                className={cn(
                  "magnetic-link inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full border px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                  isActivePath(pathname, "/login")
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-foreground"
                )}
              >
                Member Login
              </MagneticLink>
              <MagneticLink
                href="/contact"
                prefetch={false}
                aria-current={isActivePath(pathname, "/contact") ? "page" : undefined}
                cursorLabel="REQUEST"
                className={cn(
                  "magnetic-link inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-[0_18px_44px_rgba(59,130,246,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
                  isActivePath(pathname, "/contact") &&
                    "ring-2 ring-accent ring-offset-2 ring-offset-background"
                )}
              >
                Request Support
              </MagneticLink>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
