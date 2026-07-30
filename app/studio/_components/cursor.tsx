"use client";

import { useEffect, useRef } from "react";
import { useMotionPrefs } from "./use-motion-prefs";

/**
 * Reticle cursor accent. It sits *alongside* the native cursor rather than
 * replacing it — hiding the system cursor on a marketing page costs more in
 * usability than the effect is worth, and a visitor who relies on a large or
 * high-contrast pointer keeps it.
 *
 * Desktop pointers only, never on touch, never under reduced motion.
 */
export function StudioCursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { ready, reduced, finePointer } = useMotionPrefs();

  useEffect(() => {
    const node = ref.current;
    if (!node || !ready || reduced || !finePointer) return;

    let frame = 0;
    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;

    const render = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      frame = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      tx = event.clientX;
      ty = event.clientY;
      node.dataset.visible = "true";

      const target = event.target as Element | null;
      const hot = Boolean(
        target?.closest?.("a, button, input, select, textarea, [data-cursor='hot']"),
      );
      node.dataset.hot = hot ? "true" : "false";
    };

    const onLeave = () => {
      node.dataset.visible = "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [ready, reduced, finePointer]);

  if (ready && (reduced || !finePointer)) return null;

  return <div ref={ref} className="s-cursor" aria-hidden="true" data-visible="false" />;
}
