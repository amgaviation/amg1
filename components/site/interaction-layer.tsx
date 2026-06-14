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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.dataset.revealed = "true";
          observer.unobserve(element);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
