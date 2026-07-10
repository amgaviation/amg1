"use client";

import { useEffect, useRef } from "react";
import { PLAN_TABLE } from "@/lib/site-config";

/**
 * Split-flap fare board for the /pricing hero — the page's signature
 * instrument. The three plans' Band A figures rendered as a Solari-style
 * departure board: each character sits in its own flap cell, and on first
 * view the cells shuffle through a small charset before locking onto the
 * published figure, sweeping left to right (one rAF loop mutating
 * textContent — no re-renders, no GSAP).
 *
 * Honesty & a11y: every figure is composed from PLAN_TABLE (the same
 * single source of truth as the full schedule below), the board is
 * role="img" with a plain-language label, and SSR/no-JS/reduced-motion all
 * render the final resting figures — the shuffle only ever runs forward
 * from the real markup.
 */

const CHARSET = "0123456789$/ABCDEFGHIJKLMNOPQRSTUVWXYZ—·";

function pad(text: string, width: number, align: "left" | "right") {
  const clipped = text.slice(0, width);
  const fill = " ".repeat(width - clipped.length);
  return align === "left" ? clipped + fill : fill + clipped;
}

/** Compose board lines from PLAN_TABLE so figures can never drift. */
function boardLines(): { chars: string; kind: "head" | "row" }[] {
  const { plans, bandA } = PLAN_TABLE;
  const strip = (value: string) => value.replace("/mo", "");
  const lines: { chars: string; kind: "head" | "row" }[] = [
    { chars: `${pad("PLAN", 10, "left")}${pad("MONTHLY", 8, "right")}${pad("MISSION", 9, "right")}`, kind: "head" },
  ];
  plans.forEach((plan, i) => {
    lines.push({
      chars: `${pad(plan.toUpperCase(), 10, "left")}${pad(strip(bandA.monthly[i]), 8, "right")}${pad(
        bandA.coordination[i],
        9,
        "right"
      )}`,
      kind: "row",
    });
  });
  return lines;
}

const LINES = boardLines();

const BOARD_LABEL = (() => {
  const { plans, bandA } = PLAN_TABLE;
  const rows = plans
    .map(
      (plan, i) =>
        `${plan}: ${bandA.monthly[i].replace("/mo", " monthly")}${
          bandA.monthly[i] === "$0" ? " monthly" : ""
        }, ${bandA.coordination[i]} per mission`
    )
    .join("; ");
  return `Published Band A (piston) fees — ${rows}. Full schedule including Band B below.`;
})();

export function FareBoard() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current;
    if (!root) return;

    const cells = Array.from(root.querySelectorAll<HTMLElement>("[data-flap]"));
    if (!cells.length) return;

    // Each cell locks at start + column * wave + a little jitter, having
    // shuffled every ~55ms until then. Blank cells stay blank.
    const targets = cells.map((cell) => cell.textContent ?? " ");
    const locks = cells.map((cell, i) => {
      const col = Number(cell.dataset.col ?? 0);
      const row = Number(cell.dataset.row ?? 0);
      return targets[i].trim() === ""
        ? 0
        : 260 + col * 34 + row * 90 + (((i * 7919) % 5) - 2) * 18;
    });

    let raf = 0;
    let last = 0;
    const started = performance.now();
    const tick = (now: number) => {
      let live = false;
      const elapsed = now - started;
      if (now - last >= 52) {
        last = now;
        cells.forEach((cell, i) => {
          if (elapsed >= locks[i]) {
            if (cell.textContent !== targets[i]) cell.textContent = targets[i];
            return;
          }
          live = true;
          cell.textContent = CHARSET[Math.floor(Math.random() * CHARSET.length)];
        });
      } else {
        live = cells.some((_, i) => elapsed < locks[i]);
      }
      if (live) raf = requestAnimationFrame(tick);
      else cells.forEach((cell, i) => (cell.textContent = targets[i]));
    };
    raf = requestAnimationFrame(tick);

    // Safety net: whatever happens, the real figures land.
    const timer = window.setTimeout(() => {
      cancelAnimationFrame(raf);
      cells.forEach((cell, i) => (cell.textContent = targets[i]));
    }, 3200);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      cells.forEach((cell, i) => (cell.textContent = targets[i]));
    };
  }, []);

  return (
    <div ref={rootRef} className="fare-board hud-frame">
      <div className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-5">
        <p className="microlabel-amber">Band A — piston</p>
        <p className="microlabel">Published fares</p>
      </div>

      <div className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6" role="img" aria-label={BOARD_LABEL}>
        {LINES.map((line, row) => (
          <div
            key={row}
            className="fb-row"
            data-kind={line.kind}
            aria-hidden="true"
            style={{ "--fb-cols": line.chars.length } as React.CSSProperties}
          >
            {line.chars.split("").map((char, col) => (
              <span
                key={col}
                data-flap
                data-col={col}
                data-row={row}
                className="fb-cell"
                data-blank={char === " " ? "true" : undefined}
              >
                {char}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[rgba(169,180,198,0.14)] px-4 py-3 sm:px-6">
        <p className="microlabel">No markup on pass-through</p>
        <a
          href="#schedule"
          className="fd-navlink font-mono text-[10px] uppercase [letter-spacing:0.18em] text-[var(--instrument-ink)]"
        >
          Full schedule
        </a>
      </div>

      <style>{`
        .fare-board {
          background: linear-gradient(165deg, rgba(10, 19, 34, 0.92), rgba(7, 11, 20, 0.96));
          border: 1px solid rgba(169, 180, 198, 0.16);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
        }
        .fare-board .fb-row {
          display: grid;
          grid-template-columns: repeat(var(--fb-cols, 27), minmax(0, 1.02rem));
          gap: 2px;
          margin-top: 2px;
          justify-content: center;
        }
        @media (max-width: 640px) {
          .fare-board .fb-row {
            grid-template-columns: repeat(var(--fb-cols, 27), minmax(0, 1fr));
          }
        }
        .fare-board .fb-row[data-kind="head"] {
          margin-bottom: 6px;
        }
        .fare-board .fb-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: clamp(1.15rem, 4.4vw, 1.6rem);
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: clamp(0.52rem, 2.2vw, 0.82rem);
          font-weight: 500;
          color: var(--t1, #f4f7fa);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 46%, rgba(0, 0, 0, 0.22) 50%, rgba(255, 255, 255, 0.015) 54%, rgba(255, 255, 255, 0.03) 100%),
            #0c1626;
          border-radius: 2px;
          box-shadow: inset 0 0 0 1px rgba(169, 180, 198, 0.1);
          user-select: none;
        }
        .fare-board .fb-row[data-kind="head"] .fb-cell {
          color: var(--t3, #74839e);
          font-size: clamp(0.5rem, 2vw, 0.62rem);
          height: clamp(0.95rem, 3.6vw, 1.2rem);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.16) 50%, rgba(255, 255, 255, 0.01) 100%),
            #0a1120;
        }
        .fare-board .fb-cell[data-blank] {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.14) 50%, rgba(255, 255, 255, 0.008) 100%),
            #0a1322;
          box-shadow: inset 0 0 0 1px rgba(169, 180, 198, 0.05);
        }
        .fare-board .fb-row[data-kind="row"] .fb-cell:nth-child(n + 11) {
          color: #fff;
        }
      `}</style>
    </div>
  );
}
