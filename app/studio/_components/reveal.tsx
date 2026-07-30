"use client";

import {
  createElement,
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger in ms, applied as a CSS transition-delay. */
  delay?: number;
  as?: ElementType;
  className?: string;
  id?: string;
};

/**
 * Scroll reveal. The visual work is CSS (`[data-reveal]` in studio.css) so a
 * reduced-motion visitor gets fully-present content from the first paint without
 * this component having to know about it; all JS does is flip the attribute once
 * the element has been seen.
 *
 * Observers disconnect after firing — reveals never replay, and nothing stays
 * subscribed to scroll for the life of the page.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (or already past): show it and stop.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // createElement with a widened tag: a union of intrinsic elements ("div" | "li")
  // resolves its props to the *intersection* of their prop types, which TS
  // collapses to `never` — so JSX with a polymorphic `as` cannot typecheck
  // without a cast. The runtime shape is a plain element either way.
  return createElement(
    Tag as React.ElementType<Record<string, unknown>>,
    {
      ref,
      id,
      className,
      "data-reveal": shown ? "in" : "out",
      style: delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined,
    },
    children,
  );
}
