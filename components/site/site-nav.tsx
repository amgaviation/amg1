"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY, NAV_LINKS } from "@/lib/content";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-18 max-w-7xl items-center gap-6 px-6 py-4 lg:px-10">
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
            AMG <span className="text-accent">Aviation</span>
          </span>
        </Link>

        <ul className="ml-auto hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "eyebrow text-xs transition-colors",
                    active
                      ? "text-accent"
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
            href="/dashboard"
            className="hidden items-center gap-1.5 rounded-full border border-border px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-accent hover:text-accent sm:inline-flex"
          >
            Member Portal
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/contact"
            className="hidden items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-all hover:bg-primary/90 md:inline-flex"
          >
            Request Support
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <ul className="flex flex-col gap-1 px-6 py-6">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-3 font-display text-lg font-semibold uppercase tracking-wide text-foreground/80 hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-4 flex flex-col gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest text-foreground"
                >
                  Member Portal
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground"
                >
                  Request Support
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
