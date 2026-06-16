"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const REVEAL_SELECTOR =
  "[data-scroll-animate], [data-stagger-container], [data-process-step]";
const STAGGER_SELECTOR = "[data-stagger-item]";
const PROGRESS_SELECTOR = "[data-progress-rail]";

const revealKeyframes: Keyframe[] = [
  { opacity: 0, transform: "translate3d(0, 24px, 0)" },
  { opacity: 1, transform: "translate3d(0, 0, 0)" },
];

const progressKeyframes: Keyframe[] = [
  { transform: "scaleY(0.18)", opacity: 0.4 },
  { transform: "scaleY(1)", opacity: 1 },
];

function canAnimate(element: HTMLElement) {
  return typeof element.animate === "function";
}

function markVisible(element: HTMLElement) {
  element.dataset.revealed = "true";
}

function animateReveal(element: HTMLElement, delay = 0) {
  markVisible(element);

  if (!canAnimate(element)) return;

  element.animate(revealKeyframes, {
    delay,
    duration: 640,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "none",
  });
}

function animateStaggerChildren(container: HTMLElement) {
  const children = Array.from(container.querySelectorAll<HTMLElement>(STAGGER_SELECTOR));

  children.forEach((child, index) => {
    markVisible(child);

    if (!canAnimate(child)) return;

    child.animate(revealKeyframes, {
      delay: Math.min(index * 70, 280),
      duration: 560,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "none",
    });
  });
}

function animateProgressRail(container: HTMLElement) {
  const rail = container.querySelector<HTMLElement>(PROGRESS_SELECTOR);

  if (!rail || !canAnimate(rail)) return;

  rail.style.transformOrigin = "top center";
  rail.animate(progressKeyframes, {
    duration: 900,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "none",
  });
}

export function InteractionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".public-site");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));

    if (!elements.length) {
      root?.setAttribute("data-reveal-ready", "true");
      return;
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        markVisible(element);
        animateStaggerChildren(element);
      });
      root?.setAttribute("data-reveal-ready", "true");
      return;
    }

    elements.forEach((element) => {
      element.removeAttribute("data-revealed");
      element.querySelectorAll<HTMLElement>(STAGGER_SELECTOR).forEach((child) => child.removeAttribute("data-revealed"));
    });

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        markVisible(element);
        animateStaggerChildren(element);
      }
    });

    root?.setAttribute("data-reveal-ready", "true");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          animateReveal(element);
          animateStaggerChildren(element);
          animateProgressRail(element);
          observer.unobserve(element);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    elements
      .filter((element) => element.dataset.revealed !== "true")
      .forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
