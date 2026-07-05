"use client";

/**
 * Reveal handshake between the preloader and entrance animations.
 * The preloader (or its skip path) calls markRevealed(); sections call
 * onReveal() which fires immediately if the reveal already happened —
 * mount/effect ordering between siblings can't drop the event.
 */
export const REVEAL_EVENT = "amg:reveal";

declare global {
  interface Window {
    __amgRevealed?: boolean;
  }
}

export function onReveal(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.__amgRevealed) {
    callback();
    return () => {};
  }
  const handler = () => callback();
  window.addEventListener(REVEAL_EVENT, handler, { once: true });
  return () => window.removeEventListener(REVEAL_EVENT, handler);
}

export function markRevealed() {
  window.__amgRevealed = true;
  // Deferred so listeners never run inside a GSAP render tick — a tween
  // created synchronously inside another component's timeline .call()
  // inherits that component's gsap.context selector scope and would fail
  // to resolve targets outside it.
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(REVEAL_EVENT));
  }, 0);
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
