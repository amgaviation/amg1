"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll-reveal driver for the public marketing pages. The design system
 * already ships an (until now orphaned) reveal contract in globals.css —
 * `[data-scroll-animate]`, `[data-stagger-container]`, `[data-stagger-item]`
 * become visible only once `data-revealed="true"` is set. Nothing ever set it,
 * so every element rendered static. This mounts once (non-home routes, from
 * PublicShell), adds the `js-reveal` gate class so the hidden pre-reveal state
 * only applies when JS is present (no-JS/SEO keeps content visible), then uses
 * one IntersectionObserver to reveal elements as they enter the viewport.
 *
 * Reduced motion: the class is never added, so everything stays visible with
 * no transition — matching the flight-deck's reduced-motion behavior.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".public-site");
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    root.classList.add("js-reveal");

    const reveal = (el: Element) => el.setAttribute("data-revealed", "true");

    // Stagger the children of a container by their index so a card grid
    // cascades in rather than snapping together.
    const items = Array.from(
      root.querySelectorAll<HTMLElement>("[data-scroll-animate], [data-stagger-item]")
    ).filter((el) => !el.hasAttribute("data-revealed"));

    root.querySelectorAll<HTMLElement>("[data-stagger-container]").forEach((container) => {
      const kids = container.querySelectorAll<HTMLElement>("[data-stagger-item]");
      kids.forEach((kid, index) => {
        kid.style.transitionDelay = `${Math.min(index, 8) * 85}ms`;
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );

    // Above-the-fold elements are already painted visible (SSR). Reveal them
    // synchronously in this same tick so adding `js-reveal` never fades them
    // out first; only below-fold elements start hidden and animate on scroll.
    const vh = window.innerHeight;
    for (const el of items) {
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.92 && rect.bottom > 0) reveal(el);
      else observer.observe(el);
    }

    // Safety net: never leave content hidden if the observer misfires.
    const timer = window.setTimeout(() => items.forEach(reveal), 2600);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
