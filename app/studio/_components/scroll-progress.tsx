"use client";

import { useEffect, useRef } from "react";

/**
 * Hairline read-out across the top of the page that "greens up" as you descend
 * — the gear motif applied to progress.
 *
 * Purely decorative (aria-hidden): the same information is available from the
 * scrollbar. Writes a single custom property and lets CSS do the transform, so
 * scrolling stays on the compositor.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      node.style.setProperty("--p", ratio.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="s-progress" aria-hidden="true">
      <span />
    </div>
  );
}
