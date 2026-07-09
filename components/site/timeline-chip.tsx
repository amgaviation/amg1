"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Time-stamp chip for the /how-it-works timeline. The final value is rendered
 * server-side (and for no-JS / reduced-motion / screen readers), so the content
 * is always correct and accessible. When the chip's step first arrives on the
 * spine (`active` flips true), the alphanumeric characters run a short (~400ms)
 * mono shuffle and settle left-to-right into the final value — trigger-once.
 */
const DIGITS = "0123456789";
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomGlyph(ch: string) {
  if (/[0-9]/.test(ch)) return DIGITS[Math.floor(Math.random() * DIGITS.length)];
  if (/[a-z]/i.test(ch)) return ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return ch;
}

export function TimelineChip({ value, active }: { value: string; active: boolean }) {
  const [display, setDisplay] = useState(value);
  const played = useRef(false);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const chars = value.split("");
    const frames = 12; // ~12 × 34ms ≈ 400ms
    let frame = 0;

    const id = window.setInterval(() => {
      frame += 1;
      const locked = Math.floor((frame / frames) * chars.length);
      setDisplay(
        chars.map((ch, i) => (i < locked ? ch : randomGlyph(ch))).join("")
      );
      if (frame >= frames) {
        window.clearInterval(id);
        setDisplay(value);
      }
    }, 34);

    return () => window.clearInterval(id);
  }, [active, value]);

  return (
    <span className="tl-chip" aria-label={value}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
