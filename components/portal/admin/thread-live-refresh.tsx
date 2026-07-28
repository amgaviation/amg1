"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the open communication thread live so inbound replies (which arrive via
 * the email webhook, not a user action) appear without a manual reload — the
 * point of running the whole conversation inside the portal instead of Gmail.
 *
 * Deliberately conservative: it only refreshes while the tab is visible and only
 * when no field is focused, so a half-typed reply is never yanked out from under
 * the user. router.refresh() is a soft refresh — it re-runs the server component
 * and preserves scroll position.
 */
export function ThreadLiveRefresh({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable)
      ) {
        return;
      }
      router.refresh();
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
