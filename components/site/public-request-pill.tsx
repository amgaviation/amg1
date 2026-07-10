"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Persistent bottom-center "Request Support" pill for the public marketing pages —
 * the flight-deck home's signature CTA, ported to every secondary page so the
 * quote action is always one tap away. CSS-only (no GSAP): it stays hidden
 * while the hero is on screen and hides again whenever a section carrying its
 * own /request CTA is in view, so it never doubles a nearby button. Not shown
 * on the /request page itself, nor on /pilots/apply (its sticky Submit button
 * would physically collide with the pill on narrow viewports).
 */
export function PublicRequestPill() {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isSuppressed =
    pathname === "/request" ||
    pathname === "/request/" ||
    pathname === "/pilots/apply" ||
    pathname === "/pilots/apply/";

  useEffect(() => {
    if (isSuppressed || typeof IntersectionObserver === "undefined") return;

    const main = document.getElementById("main-content");
    if (!main) return;

    const watched: Element[] = [];
    // The hero (first block in <main>) — pill hidden while it's on screen.
    const hero = main.firstElementChild;
    if (hero) watched.push(hero);
    // Any section that already has a /request CTA — pill hides near it.
    main.querySelectorAll<HTMLAnchorElement>('a[href="/request"]').forEach((a) => {
      const section = a.closest("section") ?? a.parentElement;
      if (section && !watched.includes(section)) watched.push(section);
    });
    // Sections that opt out explicitly (e.g. the /pricing plan table, whose
    // stacked mobile cards the pill would otherwise ride on top of).
    main.querySelectorAll<HTMLElement>("[data-pill-hide]").forEach((section) => {
      if (!watched.includes(section)) watched.push(section);
    });
    if (!watched.length) {
      setShown(true);
      return;
    }

    const inView = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      }
      setShown(inView.size === 0);
    });
    watched.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname, isSuppressed]);

  if (isSuppressed) return null;

  return (
    <div
      ref={ref}
      data-shown={shown}
      className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 translate-y-4 opacity-0 transition-[opacity,transform] duration-500 ease-out data-[shown=true]:translate-y-0 data-[shown=true]:opacity-100"
      style={{ pointerEvents: shown ? "auto" : "none" }}
    >
      <div className="rounded-full border border-[var(--oc-line-strong)] bg-[#0A1322] p-1 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
        <Link
          href="/request"
          prefetch={false}
          className="group flex items-center gap-2 rounded-full bg-[var(--instrument)] py-2 pl-6 pr-2 text-white shadow-[0_0_40px_rgba(11,94,212,0.35)] transition-shadow hover:shadow-[0_0_60px_rgba(11,94,212,0.55)]"
        >
          <span className="whitespace-nowrap font-mono text-xs font-medium uppercase [letter-spacing:0.14em]">
            Request Support
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--canvas)] text-[var(--instrument)] transition-transform duration-500 ease-out group-hover:rotate-45">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 3L9.5 14.5M21 3l-6.5 18-3-8.5L3 9.5 21 3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
