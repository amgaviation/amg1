"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const SPLASH_SESSION_KEY = "amgHomeSplashSeen";
const SPLASH_COMPLETE_EVENT = "amg:splash-complete";
const SPLASH_DURATION_MS = 3600;
const LOGO_SRC = "/images/logo-white.png";

function markSplashComplete() {
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
  } catch {
    // Storage can be unavailable; complete the intro for this render.
  }
  window.dispatchEvent(new CustomEvent(SPLASH_COMPLETE_EVENT));
}

export { SPLASH_COMPLETE_EVENT, SPLASH_DURATION_MS, SPLASH_SESSION_KEY };

export function SplashIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    try {
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true") return;
    } catch {
      // Storage can be unavailable; show the intro for this render.
    }

    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => {
      markSplashComplete();
      setVisible(false);
    }, SPLASH_DURATION_MS + 350);

    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="amg-splash-intro"
      aria-label="AMG Aviation Group opening animation"
      onAnimationEnd={(event) => {
        if (event.animationName !== "wipeUp") return;
        markSplashComplete();
        setVisible(false);
      }}
    >
      <div className="amg-splash-mark">
        <div className="amg-splash-logo">
          <Image
            src={LOGO_SRC}
            alt="AMG Aviation Group"
            fill
            priority
            sizes="(max-width: 640px) 62vw, 22rem"
            className="object-contain"
          />
        </div>
        <p className="amg-splash-tagline">Private aircraft support, coordinated.</p>
      </div>
    </div>
  );
}
