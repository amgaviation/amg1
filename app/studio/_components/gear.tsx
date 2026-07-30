"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useMotionPrefs } from "./use-motion-prefs";

/**
 * GEAR DOWN AND LOCKED — the signature interaction.
 *
 * Three landing-gear position indicators arm in sequence on load: nose, left,
 * right, each going dark → amber transit → solid green. When the third locks,
 * the hero's status strip flares and the CTA row settles. That is the whole
 * brand in four seconds: everything checks out, cleared to proceed.
 *
 * Two rules govern the implementation:
 *
 * 1. The *finished* state is what renders on the server. Three greens and an
 *    armed hero are the no-JS and reduced-motion truth; the sequence only ever
 *    rewinds that after mount, before paint. Nobody lands on an unlit panel
 *    because a bundle failed.
 * 2. It never gates content. The headline and both CTAs are painted and
 *    clickable from the first frame — the sequence adds a glow and a 6px
 *    settle, and nothing else.
 */

export type GearState = "off" | "transit" | "locked";

type GearContextValue = {
  states: [GearState, GearState, GearState];
  armed: boolean;
};

const FINISHED: GearContextValue = {
  states: ["locked", "locked", "locked"],
  armed: true,
};

const GearContext = createContext<GearContextValue>(FINISHED);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** ms after mount at which each event fires. */
const SCHEDULE: { at: number; apply: (s: [GearState, GearState, GearState]) => void }[] = [
  { at: 140, apply: (s) => (s[0] = "transit") },
  { at: 480, apply: (s) => ((s[0] = "locked"), (s[1] = "transit")) },
  { at: 820, apply: (s) => ((s[1] = "locked"), (s[2] = "transit")) },
  { at: 1160, apply: (s) => (s[2] = "locked") },
];

export function GearSequence({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ready, reduced } = useMotionPrefs();
  const [value, setValue] = useState<GearContextValue>(FINISHED);
  const played = useRef(false);

  // Rewind to "gear up" before the browser paints, so the arming sequence reads
  // as a sequence rather than as a flicker off an already-green panel.
  useIsomorphicLayoutEffect(() => {
    if (played.current || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setValue({ states: ["off", "off", "off"], armed: false });
  }, []);

  useEffect(() => {
    if (!ready || played.current) return;
    if (reduced) {
      setValue(FINISHED);
      played.current = true;
      return;
    }
    played.current = true;

    const states: [GearState, GearState, GearState] = ["off", "off", "off"];
    const timers = SCHEDULE.map(({ at, apply }) =>
      setTimeout(() => {
        apply(states);
        setValue({
          states: [...states] as [GearState, GearState, GearState],
          armed: states.every((s) => s === "locked"),
        });
      }, at),
    );

    return () => timers.forEach(clearTimeout);
  }, [ready, reduced]);

  return (
    <GearContext.Provider value={value}>
      <div className={className} data-armed={value.armed ? "true" : "false"}>
        {children}
      </div>
    </GearContext.Provider>
  );
}

export function useGear() {
  return useContext(GearContext);
}

const LAMPS = [
  { label: "Nose", title: "Nose gear" },
  { label: "Left", title: "Left main gear" },
  { label: "Right", title: "Right main gear" },
] as const;

/**
 * Readout wording is intentionally NOT "down and locked": that phrase is one of
 * the three candidate taglines and already sits directly beneath this panel in
 * the hero. Printing it twice, 40px apart, reads as a mistake.
 */
const READOUT: Record<GearState, string> = {
  off: "Gear in transit",
  transit: "Gear in transit",
  locked: "Cleared to proceed",
};

/**
 * The panel itself. Announced once, as a single status, rather than three
 * separate live regions firing over each other — a screen reader gets
 * "Landing gear: down and locked", which is the meaning, not the mechanism.
 */
export function GearPanel({ className }: { className?: string }) {
  const { states, armed } = useGear();
  const summary = armed ? READOUT.locked : READOUT.off;

  return (
    <div className={className}>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.5rem" }}
        role="group"
        aria-label="Landing gear position indicators"
      >
        {LAMPS.map((lamp, index) => (
          <div key={lamp.label} className="s-gear" data-state={states[index]} title={lamp.title}>
            <div className="s-gear-lamp">
              <span className="s-gear-dot" />
            </div>
            <span className="s-gear-label">{lamp.label}</span>
          </div>
        ))}
      </div>
      <p
        className="s-mono s-cleared"
        aria-live="polite"
        style={{
          marginTop: "0.85rem",
          padding: "0.5rem 0.75rem",
          border: "1px solid rgba(59,240,138,0.3)",
          background: "rgba(59,240,138,0.06)",
          fontSize: "0.6875rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--s-green)",
          textAlign: "center",
        }}
      >
        3 green · {summary}
      </p>
    </div>
  );
}
