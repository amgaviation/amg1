"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { PORTAL_THEME_COOKIE, type PortalTheme } from "@/lib/portal/theme";

/**
 * Light/dark switch for the portal. The source of truth pre-hydration is the
 * `data-portal-theme` attribute rendered by the portal layout from the theme
 * cookie; this component reads it on mount, flips it in place, and rewrites
 * the cookie so SSR and client stay in agreement.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<PortalTheme | null>(null);

  useEffect(() => {
    const host = document.querySelector("[data-portal-theme]");
    setTheme(host?.getAttribute("data-portal-theme") === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next: PortalTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document
      .querySelectorAll("[data-portal-theme]")
      .forEach((el) => el.setAttribute("data-portal-theme", next));
    document.cookie = `${PORTAL_THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        className ??
        "rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)] p-2 text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:text-[var(--deck-text)]"
      }
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
