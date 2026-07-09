"use client";

import { createElement, useEffect, useState, type ElementType } from "react";

/**
 * Masked-line headline entrance for the public marketing heroes: each line
 * rises out from behind a clip mask on mount, echoing the flight-deck home's
 * hero. Renders `data-hr="pre"` (hidden) server-side, then flips to "in" after
 * mount; reduced motion and a safety timeout both resolve to the shown state,
 * and the CSS ([data-hr]/.hr-mask in globals.css) forces text visible with no
 * transform when motion is off.
 */
export function HeadlineReveal({
  lines,
  className,
  as = "h1",
}: {
  lines: string[];
  className?: string;
  as?: ElementType;
}) {
  const [state, setState] = useState<"pre" | "in">("pre");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("in");
      return;
    }
    const raf = requestAnimationFrame(() => setState("in"));
    const timer = window.setTimeout(() => setState("in"), 1300);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, []);

  return createElement(
    as,
    { className, "data-hr": state },
    lines.map((line, index) =>
      createElement(
        "span",
        { className: "hr-mask", key: index },
        createElement("span", { style: { transitionDelay: `${index * 90}ms` } }, line)
      )
    )
  );
}
