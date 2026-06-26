"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export const SPLASH_SESSION_KEY  = "amgHomeSplashSeen";
export const SPLASH_COMPLETE_EVENT = "amg:splash-complete";
export const SPLASH_DURATION_MS  = 4800;

function markSplashComplete() {
  try { window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true"); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(SPLASH_COMPLETE_EVENT));
}

/*
  Phase timeline
  ──────────────
  idle    → nothing rendered yet
  text    → dark screen, brand name + blurred tagline fade in
  sharpen → tagline unblurs to crisp
  window  → airplane window grows from center
  expand  → window scales to fill viewport (site revealed underneath)
  done    → overlay removed
*/
type Phase = "idle" | "text" | "sharpen" | "window" | "expand" | "done";

export function SplashIntro() {
  const [visible,  setVisible]  = useState(false);
  const [phase,    setPhase]    = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const push = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true") return;
    } catch { /* fall through */ }

    setVisible(true);
    push(80,   () => setPhase("text"));
    push(1100, () => setPhase("sharpen"));
    push(2100, () => setPhase("window"));
    push(3000, () => setPhase("expand"));
    push(4400, () => {
      markSplashComplete();
      setPhase("done");
    });
    push(4800, () => setVisible(false));

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible || phase === "done") return null;

  const showText   = phase !== "idle";
  const sharpened  = phase === "sharpen" || phase === "window" || phase === "expand";
  const showWindow = phase === "window" || phase === "expand";
  const expanding  = phase === "expand";

  return (
    <div className="amg-si-root" aria-label="AMG Aviation Group intro" role="status">

      {/* ── Dark backdrop ── */}
      <div className={`amg-si-bg${expanding ? " amg-si-bg--fade" : ""}`} />

      {/* ── Brand text (center, behind window) ── */}
      <div className={`amg-si-text${showText ? " amg-si-text--in" : ""}${showWindow ? " amg-si-text--hidden" : ""}`}>
        <p className="amg-si-brand">AMG AVIATION GROUP</p>
        <p className={`amg-si-headline${sharpened ? " amg-si-headline--sharp" : ""}`}>
          Private aircraft support,<br />coordinated.
        </p>
      </div>

      {/* ── Airplane window ── */}
      <div className={`amg-si-window-wrap${showWindow ? " amg-si-window-wrap--in" : ""}${expanding ? " amg-si-window-wrap--expand" : ""}`}>
        {/* Porthole frame */}
        <div className="amg-si-porthole">
          {/* Inner glass — shows sky then logo */}
          <div className="amg-si-glass">
            <div className={`amg-si-glass-inner${sharpened ? " amg-si-glass-inner--sky" : ""}`}>
              <Image
                src="/images/logo-white.png"
                alt="AMG Aviation Group"
                width={340}
                height={80}
                priority
                className={`amg-si-window-logo${showWindow ? " amg-si-window-logo--in" : ""}`}
              />
            </div>
          </div>
          {/* Porthole rim reflection */}
          <div className="amg-si-rim" aria-hidden="true" />
        </div>
      </div>

    </div>
  );
}
