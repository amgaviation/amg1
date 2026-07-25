"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tipsForPath, type PortalTip } from "@/lib/portal/tips";

/**
 * Horizon help system.
 *
 * HelpMenu — a "?" button in the top bar that lists every tip for the
 * current page on demand.
 *
 * IdleTipCoach — after ~30s without pointer/keyboard/scroll activity on a
 * page, one contextual tip slides in bottom-right. It never interrupts
 * typing (suppressed while a field or dialog has focus), rotates through
 * tips across idles, can be turned off permanently ("Turn off tips",
 * localStorage), and respects prefers-reduced-motion.
 */

const TIPS_OFF_KEY = "amg-portal-tips-off";
const TIP_INDEX_KEY = "amg-portal-tip-index";
const IDLE_MS = 30_000;

function tipsDisabled(): boolean {
  try {
    return window.localStorage.getItem(TIPS_OFF_KEY) === "1";
  } catch {
    return false;
  }
}

export function HelpMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const tips = tipsForPath(pathname);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setDisabled(tipsDisabled());
  }, [open]);

  function toggleTips() {
    try {
      if (tipsDisabled()) {
        window.localStorage.removeItem(TIPS_OFF_KEY);
        setDisabled(false);
      } else {
        window.localStorage.setItem(TIPS_OFF_KEY, "1");
        setDisabled(true);
      }
    } catch {
      /* storage blocked — leave as-is */
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Help and tips for this page"
        className="rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-2.5 text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-line-strong)] hover:text-[var(--deck-text)] lg:p-1.5"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="deck-card absolute right-0 z-50 mt-2 w-80 overflow-hidden shadow-[var(--deck-shadow-pop)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--deck-line)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--deck-text)]">On this page</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close help"
                className="rounded-md p-1 text-[var(--deck-text-3)] hover:text-[var(--deck-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto p-4">
              {tips.map((tip) => (
                <div key={tip.title}>
                  <p className="text-sm font-semibold text-[var(--deck-text)]">{tip.title}</p>
                  <p className="mt-0.5 text-[0.8125rem] leading-5 text-[var(--deck-text-2)]">{tip.body}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--deck-line)] px-4 py-2.5">
              <button
                type="button"
                onClick={toggleTips}
                className="text-xs font-medium text-[var(--deck-text-3)] underline-offset-2 hover:text-[var(--deck-text)] hover:underline"
              >
                {disabled ? "Turn idle tips back on" : "Turn off idle tips"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function IdleTipCoach() {
  const pathname = usePathname();
  const [tip, setTip] = useState<PortalTip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownThisIdle = useRef(false);

  const dismiss = useCallback(() => setTip(null), []);

  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    shownThisIdle.current = false;
    timer.current = setTimeout(() => {
      if (tipsDisabled() || document.visibilityState !== "visible") return;
      // Never interrupt someone mid-form or mid-dialog.
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      const tips = tipsForPath(window.location.pathname);
      if (!tips.length) return;
      let index = 0;
      try {
        index = Number(window.localStorage.getItem(TIP_INDEX_KEY) ?? "0") % tips.length;
        window.localStorage.setItem(TIP_INDEX_KEY, String(index + 1));
      } catch {
        /* rotate best-effort */
      }
      shownThisIdle.current = true;
      setTip(tips[index]);
    }, IDLE_MS);
  }, []);

  useEffect(() => {
    // Any activity ends the idle period; the card stays until dismissed or
    // the user starts working again.
    const onActivity = () => {
      if (shownThisIdle.current) {
        shownThisIdle.current = false;
        setTip(null);
      }
      arm();
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];
    for (const event of events) window.addEventListener(event, onActivity, { passive: true });
    arm();
    return () => {
      for (const event of events) window.removeEventListener(event, onActivity);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [arm]);

  // Route change: hide any visible tip and restart the idle clock.
  useEffect(() => {
    setTip(null);
    arm();
  }, [pathname, arm]);

  if (!tip) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className={cn(
        "deck-card fixed bottom-5 left-5 z-40 w-[20rem] max-w-[calc(100vw-2.5rem)] p-4 shadow-[var(--deck-shadow-pop)]",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-200"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]">
          <Lightbulb className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--deck-text)]">{tip.title}</p>
          <p className="mt-1 text-[0.8125rem] leading-5 text-[var(--deck-text-2)]">{tip.body}</p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md bg-[var(--deck-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--deck-on-accent)] transition-opacity hover:opacity-90"
            >
              Got it
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.setItem(TIPS_OFF_KEY, "1");
                } catch {
                  /* ignore */
                }
                dismiss();
              }}
              className="text-xs font-medium text-[var(--deck-text-3)] underline-offset-2 hover:text-[var(--deck-text)] hover:underline"
            >
              Turn off tips
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss tip"
          className="shrink-0 rounded-md p-1 text-[var(--deck-text-3)] hover:text-[var(--deck-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
