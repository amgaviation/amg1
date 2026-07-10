"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { loadMotion, runWithMotion } from "./motion";
import { prefersReducedMotion } from "./reveal";

/**
 * Bottom-center CTA pill with magnetic hover (position eases toward the
 * cursor inside a proximity radius).
 *
 * Visibility is scroll-aware so it never duplicates a nearby CTA: the
 * pill stays hidden while the hero is on screen, and hides again whenever
 * any section carrying its own /request link (the worked example, the
 * global footer) is in view. It sits on a solid canvas plate — bg +
 * border + shadow — so it never reads see-through over section copy.
 */
export default function RequestPill() {
  const wrap = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);

  // Scroll-aware visibility: one observer watches the hero plus every
  // section that contains its own request CTA; the pill shows only while
  // none of them intersect the viewport.
  useEffect(() => {
    const node = wrap.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const reduced = prefersReducedMotion();
    // Start hidden in both motion modes — the synchronous equivalent of the
    // old pre-chunk gsap.set(autoAlpha: 0). CSS keeps [data-fd-hidden] at
    // opacity 0, but the reduced-motion stylesheet forces that back to 1,
    // so visibility is what actually gates the pill there; it also keeps
    // the invisible pill unclickable while the motion chunk is loading.
    node.style.visibility = "hidden";

    let cleanup: (() => void) | undefined;
    let disposed = false;

    // One observer watches the hero plus every section carrying its own
    // request CTA; `applyVisibility(show)` is the only per-motion-mode part.
    const wire = (applyVisibility: (show: boolean) => void) => {
      const watched: Element[] = [];
      const hero = document.getElementById("top");
      if (hero) watched.push(hero);
      document
        .querySelectorAll<HTMLAnchorElement>('.fd-site section a[href="/request"]')
        .forEach((a) => {
          const section = a.closest("section");
          if (section && !watched.includes(section)) watched.push(section);
        });

      const inView = new Set<Element>();
      let shown = false;

      const apply = () => {
        const show = inView.size === 0;
        if (show === shown) return;
        shown = show;
        // The footer timeline also scrubs pointer-events on .fd-pill;
        // restore it explicitly whenever the pill comes back.
        node.style.pointerEvents = show ? "auto" : "none";
        applyVisibility(show);
      };

      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inView.add(entry.target);
          else inView.delete(entry.target);
        }
        apply();
      });
      watched.forEach((el) => io.observe(el));
      cleanup = () => io.disconnect();
    };

    if (reduced) {
      // No motion chunk at all under reduced motion: flip visibility
      // directly (matching what gsap.set(autoAlpha) used to do).
      wire((show) => {
        node.style.visibility = show ? "visible" : "hidden";
      });
    } else {
      loadMotion().then(
        ({ gsap }) => {
          if (disposed) return;
          gsap.set(node, { autoAlpha: 0, y: 16 });
          wire((show) => {
            gsap.to(node, {
              autoAlpha: show ? 1 : 0,
              y: show ? 0 : 16,
              duration: show ? 0.6 : 0.35,
              ease: "power3.out",
              overwrite: "auto",
            });
          });
        },
        () => {
          // Chunk failed — fall back to an unanimated toggle so the CTA
          // still appears mid-page (opacity too: without reduced motion the
          // [data-fd-hidden] CSS otherwise keeps it at 0).
          if (!disposed) {
            wire((show) => {
              node.style.visibility = show ? "visible" : "hidden";
              node.style.opacity = show ? "1" : "0";
            });
          }
        }
      );
    }

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  // Magnetic hover, motion permitting — the whole plate eases toward the
  // cursor, so the button never slides off its solid backdrop.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const el = plate.current;
    if (!el) return;

    return runWithMotion(({ gsap }) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < 140) {
          xTo(dx * 0.35);
          yTo(dy * 0.35);
        } else {
          xTo(0);
          yTo(0);
        }
      };
      window.addEventListener("mousemove", onMove);
      return () => window.removeEventListener("mousemove", onMove);
    });
  }, []);

  return (
    <div
      ref={wrap}
      data-fd-hidden
      className="fd-pill fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
    >
      <div
        ref={plate}
        className="rounded-full border border-grid-silver bg-[#0A1322] p-1 shadow-[0_18px_50px_rgba(0,0,0,0.5)]"
      >
        <Link
          href="/request"
          prefetch={false}
          className="group flex items-center gap-2 rounded-full bg-instrument py-2 pl-6 pr-2 text-white shadow-[0_0_40px_rgba(11,94,212,0.35)] transition-shadow hover:shadow-[0_0_60px_rgba(11,94,212,0.55)]"
        >
          <span className="whitespace-nowrap font-mono text-xs font-medium uppercase tracking-widecap">
            Get a Quote
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-instrument transition-transform duration-500 ease-out-expo group-hover:rotate-45">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 3L9.5 14.5M21 3l-6.5 18-3-8.5L3 9.5 21 3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
