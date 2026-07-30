"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMotionPrefs } from "./use-motion-prefs";

type MagneticProps = {
  children: ReactNode;
  /** Pull radius in px beyond the element's own box. */
  radius?: number;
  /** How far the element may travel, as a fraction of the offset. */
  strength?: number;
  className?: string;
};

/**
 * Pointer-aware wrapper: the child drifts toward the cursor as it approaches,
 * then springs back. Transform-only, so it never triggers layout.
 *
 * Desktop-only by construction — a touch device has no hover state to key off,
 * and a magnetic button that only moves *after* you have already tapped it is
 * noise. Reduced motion turns it off entirely.
 */
export function Magnetic({
  children,
  radius = 70,
  strength = 0.32,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const { ready, reduced, finePointer } = useMotionPrefs();

  useEffect(() => {
    const node = ref.current;
    if (!node || !ready || reduced || !finePointer) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let running = false;

    const render = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1) {
        frame = requestAnimationFrame(render);
      } else {
        running = false;
        node.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(render);
    };

    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const inRange =
        Math.abs(dx) < box.width / 2 + radius && Math.abs(dy) < box.height / 2 + radius;
      targetX = inRange ? dx * strength : 0;
      targetY = inRange ? dy * strength : 0;
      start();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      start();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onLeave, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onLeave);
      cancelAnimationFrame(frame);
      node.style.transform = "";
    };
  }, [ready, reduced, finePointer, radius, strength]);

  return (
    <span ref={ref} className={className} style={{ display: "inline-flex" }}>
      {children}
    </span>
  );
}
