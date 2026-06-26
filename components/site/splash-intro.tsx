"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export const SPLASH_SESSION_KEY   = "amgHomeSplashSeen";
export const SPLASH_COMPLETE_EVENT = "amg:splash-complete";
export const SPLASH_DURATION_MS   = 4800;

function markSplashComplete() {
  try { window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true"); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(SPLASH_COMPLETE_EVENT));
}

/*
  Phase timeline
  ──────────────
  idle    → dark screen visible, nothing animated yet
  text    → brand name + blurred headline fade in
  sharpen → headline sharpens from blur to crisp
  window  → airplane porthole grows from center
  expand  → porthole scales to fill viewport
  done    → overlay removed from DOM
*/
type Phase = "idle" | "text" | "sharpen" | "window" | "expand" | "done";

export function SplashIntro() {
  // Start visible=true so the dark overlay is on screen from first paint
  // (no flash of content underneath). The effect will immediately hide it
  // if the session key is already set (i.e. user has seen it this session).
  const [visible, setVisible] = useState(true);
  const [phase,   setPhase]   = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const push = (ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  useEffect(() => {
    // Bail immediately (hide overlay) if already seen this session in production
    if (process.env.NODE_ENV === "production") {
      try {
        if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true") {
          setVisible(false);
          return;
        }
      } catch { /* fall through */ }
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }

    // Run the animation sequence
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
  const showWindow = phase === "window"  || phase === "expand";
  const expanding  = phase === "expand";

  return (
    <div className="amg-si-root" aria-label="AMG Aviation Group intro" role="status">

      {/* Dark backdrop — fades out during expand */}
      <div className={`amg-si-bg${expanding ? " amg-si-bg--fade" : ""}`} />

      {/* Brand text — fades in, then hides before window appears */}
      <div className={[
        "amg-si-text",
        showText   ? "amg-si-text--in"     : "",
        showWindow ? "amg-si-text--hidden"  : "",
      ].join(" ")}>
        <p className="amg-si-brand">AMG AVIATION GROUP</p>
        <p className={`amg-si-headline${sharpened ? " amg-si-headline--sharp" : ""}`}>
          Private aircraft support,<br />coordinated.
        </p>
      </div>

      {/* Airplane porthole — grows from nothing to fill screen */}
      <div className={[
        "amg-si-window-wrap",
        showWindow ? "amg-si-window-wrap--in"     : "",
        expanding  ? "amg-si-window-wrap--expand" : "",
      ].join(" ")}>
        <div className="amg-si-porthole">
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
          <div className="amg-si-rim" aria-hidden="true" />
        </div>
      </div>

    </div>
  );
}
