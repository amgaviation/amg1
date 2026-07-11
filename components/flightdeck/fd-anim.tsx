"use client";

/**
 * Flight Deck 2026 — motion utilities for the public marketing home.
 *
 * The design handoff prototype polled scroll position with setInterval
 * because its preview sandbox suppressed rAF / scroll events /
 * IntersectionObserver. In production those are all available, so these
 * are the real thing: IntersectionObserver reveals, a rAF-throttled
 * scroll-progress reader (works with Lenis, which updates window.scrollY
 * and emits scroll events), and rAF counters.
 *
 * Everything is reduced-motion aware: reveals resolve to fully visible,
 * counters jump to their final value, and scrubbed sections read their
 * static end-state.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** True once `ref` scrolls within `offset` of the viewport bottom. Fires once. */
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  offset = 0.88
): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    // Trigger when the element's top passes `offset` of the viewport height:
    // a bottom rootMargin of -(1-offset)*100% shrinks the observed area.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: `0px 0px -${Math.round((1 - offset) * 100)}% 0px`, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, offset]);
  return inView;
}

type RevealProps = {
  className?: string;
  style?: CSSProperties;
  offset?: number;
  children: ReactNode;
  id?: string;
};

/**
 * Adds `.in-view` to its wrapper `<div>` once it enters the viewport.
 * Children opt into the reveal via `.rv` / `.rv-mask` + `--d` stagger
 * delays (see the `.fd-anim .rv` rules in globals.css).
 */
export function Reveal({
  className = "",
  style,
  offset = 0.88,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, offset);
  return (
    <div
      ref={ref}
      className={`${className}${inView ? " in-view" : ""}`}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * 0 → 1 progress through a tall scroll-scrubbed section. rAF-throttled so a
 * burst of scroll events collapses to one measurement per frame. Returns 1
 * immediately under reduced motion so the section reads its end-state.
 */
export function useSectionProgress(
  ref: React.RefObject<HTMLElement | null>
): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setP(1);
      return;
    }
    let frame = 0;
    let ticking = false;
    const measure = () => {
      ticking = false;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const v = Math.min(1, Math.max(0, -rect.top / total));
      setP((prev) => (Math.abs(prev - v) > 0.001 ? v : prev));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
  return p;
}

type CountUpProps = {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
};

/** Counts `from` → `to` once scrolled into view (quart ease-out). */
export function CountUp({
  from = 0,
  to,
  duration = 1400,
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, 0.95);
  const [val, setVal] = useState(from);
  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setVal(to);
      return;
    }
    let frame = 0;
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const tick = () => {
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 4);
      setVal(Math.round(from + (to - from) * e));
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [inView, from, to, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/** Magnetic hover — the element leans toward the cursor, springs back on leave. */
export function Magnetic({
  children,
  strength = 0.3,
  max = 7,
}: {
  children: ReactNode;
  strength?: number;
  max?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const clamp = (v: number) => Math.max(-max, Math.min(max, v * strength));
      el.style.transform = `translate(${clamp(dx)}px, ${clamp(dy)}px)`;
    },
    [strength, max]
  );
  const onLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "";
  }, []);
  return (
    <span ref={ref} className="fd-magnetic" onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </span>
  );
}

/** Fixed 2px scroll-progress bar (blue → sky), width tracks scroll depth. */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let frame = 0;
    let ticking = false;
    const measure = () => {
      ticking = false;
      const h =
        document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? Math.min(1, window.scrollY / h) : 0);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 90,
        height: 2,
        width: `${p * 100}%`,
        background:
          "linear-gradient(90deg, var(--amg-action-blue), var(--sp-sky))",
        transition: "width 0.15s linear",
        pointerEvents: "none",
      }}
    />
  );
}

/** Shared arrow glyphs (Lucide-matched stroke weight). */
export function ArrowNE({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

export function ArrowR({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
