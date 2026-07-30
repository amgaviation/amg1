"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroPoster } from "./hero-poster";
import { useMotionPrefs } from "./use-motion-prefs";

/**
 * Gate in front of the canvas scene.
 *
 * The scene is a separate chunk (`ssr: false` + dynamic import) that is not
 * requested until the browser is idle, so the hero's headline — the LCP element
 * — is never queued behind it. Under reduced motion the chunk is never fetched
 * at all: the poster is the finished artwork, not a fallback.
 */
const HeroScene = dynamic(() => import("./hero-scene").then((m) => m.HeroScene), {
  ssr: false,
  loading: () => null,
});

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function HeroSceneMount() {
  const { ready, reduced, lowPower } = useMotionPrefs();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!ready || reduced) return;

    const idleWindow = window as IdleWindow;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const go = () => setMounted(true);

    if (typeof idleWindow.requestIdleCallback === "function") {
      idle = idleWindow.requestIdleCallback(go, { timeout: 2000 });
    } else {
      timer = setTimeout(go, 600);
    }

    return () => {
      if (idle !== undefined) idleWindow.cancelIdleCallback?.(idle);
      if (timer) clearTimeout(timer);
    };
  }, [ready, reduced]);

  return (
    <div
      className="s-hero-scene"
      style={{
        // Fades the scope out toward the copy so headline contrast never
        // depends on where a track happens to be.
        maskImage:
          "radial-gradient(120% 100% at 72% 50%, #000 0%, #000 52%, rgba(0,0,0,0.35) 78%, transparent 100%)",
      }}
    >
      {/* Poster hands over to the live scene once it is up. */}
      <HeroPoster
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: mounted ? 0 : 1,
          transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: mounted ? 1 : 0,
          transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {mounted ? <HeroScene lowPower={lowPower} /> : null}
      </div>
    </div>
  );
}
