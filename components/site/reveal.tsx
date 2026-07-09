"use client";

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Scroll-reveal for the public marketing pages: content rises + fades in as it
 * enters the viewport, echoing the flight-deck home's entrance motion without
 * pulling GSAP into these lighter pages. IntersectionObserver toggles a
 * `data-shown` attribute; the transition lives in globals.css ([data-reveal]).
 *
 * Reduced motion and a safety timeout both force the shown state so content is
 * never stuck hidden. The element renders with `data-reveal` server-side so
 * there is no flash of already-visible content before the observer attaches.
 */
export function Reveal({
  as,
  className,
  children,
  delay = 0,
  y = 22,
  once = true,
  style,
  ...rest
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  /** Rise distance in px. */
  y?: number;
  once?: boolean;
  style?: React.CSSProperties;
} & Record<string, unknown>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.setAttribute("data-shown", "");
      return;
    }

    const show = () => el.setAttribute("data-shown", "");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.removeAttribute("data-shown");
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    observer.observe(el);
    // Safety: never leave content hidden if the observer misfires.
    const timer = window.setTimeout(show, 2200);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [once]);

  return createElement(
    Tag,
    {
      ref,
      "data-reveal": "",
      className,
      style: { ...style, "--reveal-delay": `${delay}ms`, "--reveal-y": `${y}px` } as React.CSSProperties,
      ...rest,
    },
    children
  );
}
