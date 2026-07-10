"use client";

import { useEffect } from "react";

/**
 * Motion enhancer for /pricing — a numbers-first page that, until now, never
 * animated a number. Mirrors the established secondary-page idiom
 * (components/site/reveal.tsx): a mount-once client component that queries the
 * server-rendered DOM and layers on IntersectionObserver/CSS motion. Every
 * effect is trigger-once, respects prefers-reduced-motion, and — critically —
 * leaves the SSR markup's final values untouched until after mount, so there is
 * no hydration mismatch (the count-ups animate imperatively via textContent,
 * never through React re-render).
 *
 * Wires four things:
 *  - Count-up on the plan-table dollar cells and the two day-rate ranges.
 *  - Desktop plan-table column hover (lift + 2px instrument-blue top rule).
 *  - Worked-example tally: 80ms line stagger + a soft glow pulse on the total.
 * (The FAQ smooth-open is pure CSS in the page and needs no JS here.)
 */
export function PricingMotion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    // ── Count-up ──────────────────────────────────────────────────────────
    if (!reduce && typeof IntersectionObserver !== "undefined") {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-countup]"))
        // Skip anything not actually laid out (e.g. the desktop table while the
        // mobile card layout is active) so IO doesn't leave it stuck at zero.
        .filter((el) => el.offsetParent !== null);

      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

      const run = (el: HTMLElement) => {
        const finalText = el.textContent ?? "";
        // Tokenize into numeric / literal segments so "$1,000–1,600/day",
        // "$149/mo", "$0" all reconstruct exactly, commas and units preserved.
        const segs: Array<{ num: number; commas: boolean; decimals: number } | string> = [];
        const re = /[\d,]+(?:\.\d+)?/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(finalText))) {
          if (m.index > last) segs.push(finalText.slice(last, m.index));
          const raw = m[0];
          segs.push({
            num: parseFloat(raw.replace(/,/g, "")),
            commas: raw.includes(","),
            decimals: raw.includes(".") ? raw.split(".")[1].length : 0,
          });
          last = m.index + raw.length;
        }
        if (last < finalText.length) segs.push(finalText.slice(last));

        const render = (e: number) => {
          el.textContent = segs
            .map((s) => {
              if (typeof s === "string") return s;
              const cur = s.num * e;
              if (s.commas || s.decimals) {
                return cur.toLocaleString("en-US", {
                  minimumFractionDigits: s.decimals,
                  maximumFractionDigits: s.decimals,
                });
              }
              return String(Math.round(cur));
            })
            .join("");
        };

        render(0); // paint zero-state synchronously — no flash of the final value
        const duration = 600;
        const start = performance.now();
        const frame = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          if (p < 1) {
            render(easeOut(p));
            requestAnimationFrame(frame);
          } else {
            el.textContent = finalText;
          }
        };
        requestAnimationFrame(frame);
      };

      // Keep the SSR value untouched until the cell actually rests in view: on
      // intersect we drop it to the zero-state and count up in the *same* tick
      // (no paint in between, so no flash of the final value). Cells the reader
      // scrolls straight past never fire and simply keep their real SSR number —
      // nothing can get stranded at zero.
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            observer.unobserve(el);
            run(el);
          }
        },
        { threshold: 0.4 }
      );

      els.forEach((el) => observer.observe(el));
      cleanups.push(() => observer.disconnect());
    }

    // ── Desktop plan-table column hover ───────────────────────────────────
    const table = document.querySelector<HTMLTableElement>("[data-plan-table]");
    if (table) {
      const clear = () =>
        table
          .querySelectorAll("[data-col-active]")
          .forEach((c) => c.removeAttribute("data-col-active"));

      const onOver = (event: Event) => {
        const cell = (event.target as HTMLElement).closest<HTMLTableCellElement>("td, th");
        if (!cell || !table.contains(cell)) return;
        const idx = cell.cellIndex;
        clear();
        if (idx < 1) return; // row-label column / spanning header rows
        table.querySelectorAll<HTMLTableRowElement>("tr").forEach((row) => {
          const target = row.cells[idx];
          if (!target || target.colSpan > 1) return;
          const inHead = row.parentElement?.tagName === "THEAD";
          target.setAttribute("data-col-active", inHead ? "head" : "cell");
        });
      };

      table.addEventListener("pointerover", onOver);
      table.addEventListener("pointerleave", clear);
      cleanups.push(() => {
        table.removeEventListener("pointerover", onOver);
        table.removeEventListener("pointerleave", clear);
      });
    }

    // ── Worked-example tally: stagger + total pulse ───────────────────────
    const tally = document.querySelector<HTMLElement>("[data-tally]");
    if (tally && !reduce && typeof IntersectionObserver !== "undefined") {
      const lines = Array.from(tally.querySelectorAll<HTMLElement>("[data-tally-line]"));
      const total = tally.querySelector<HTMLElement>("[data-tally-total]");
      const timers: number[] = [];

      // Arm the hidden pre-state (JS-gated, so no-JS/reduced-motion stays visible).
      lines.forEach((line) => {
        line.style.opacity = "0";
        line.style.transform = "translateY(8px)";
        line.style.transition = "opacity 400ms ease, transform 400ms ease";
      });

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            io.disconnect();
            lines.forEach((line, i) => {
              timers.push(
                window.setTimeout(() => {
                  line.style.opacity = "1";
                  line.style.transform = "none";
                }, i * 80)
              );
            });
            if (total) {
              timers.push(
                window.setTimeout(() => {
                  total.setAttribute("data-tally-pulse", "");
                }, lines.length * 80 + 220)
              );
            }
          }
        },
        { threshold: 0.35 }
      );
      io.observe(tally);
      cleanups.push(() => {
        io.disconnect();
        timers.forEach((t) => window.clearTimeout(t));
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
