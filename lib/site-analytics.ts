"use client";

import type { SiteEventName } from "@/lib/site-config";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Fires one of the four launch analytics events (spec §12) into GA when the
 * consent-gated loader has installed gtag; otherwise queues into dataLayer so
 * GTM setups still receive it. No-op when neither exists.
 */
export function trackSiteEvent(name: SiteEventName, params?: Record<string, string>) {
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params ?? {});
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, ...params });
    }
  } catch {
    // Analytics must never break navigation.
  }
}
