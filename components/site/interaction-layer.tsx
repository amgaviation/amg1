"use client";

import { useEffect } from "react";

export function InteractionLayer() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-animate], [data-stagger-container]")
    );

    if (!elements.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.dataset.revealed = "true";
      });
      return;
    }

    const reveal = (element: HTMLElement) => {
      element.dataset.revealed = "true";
      observer.unobserve(element);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          // Reveal as soon as any part enters the viewport, OR if the element
          // already sits at/above the fold. Sections taller than the viewport
          // can never reach a high intersection ratio, so a low threshold plus
          // this fallback guarantees content is never left permanently hidden.
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
            reveal(element);
          }
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));

    // Safety net: shortly after load, reveal anything that is already at or
    // above the fold but somehow still hidden (observer edge case). Genuinely
    // below-the-fold sections are left to the observer so they still animate in.
    const safety = window.setTimeout(() => {
      elements.forEach((element) => {
        if (element.dataset.revealed === "true") return;
        if (element.getBoundingClientRect().top < window.innerHeight) {
          element.dataset.revealed = "true";
        }
      });
    }, 1600);

    return () => {
      window.clearTimeout(safety);
      observer.disconnect();
    };
  }, []);

  return null;
}
