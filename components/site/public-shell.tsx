"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import {
  SPLASH_COMPLETE_EVENT,
  SPLASH_DURATION_MS,
  SPLASH_SESSION_KEY,
} from "@/components/site/splash-intro";

function normalizePath(path: string) {
  const normalized = path.split(/[?#]/)[0].replace(/\/+$/, "");
  return normalized || "/";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = normalizePath(pathname) === "/";
  const [showSplash, setShowSplash] = useState(false);
  const [showNav, setShowNav] = useState(!isHome);

  useEffect(() => {
    if (!isHome || prefersReducedMotion()) {
      setShowSplash(false);
      setShowNav(true);
      return;
    }

    try {
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "true") {
        setShowSplash(false);
        setShowNav(true);
        return;
      }
    } catch {
      // Fall through and show the intro once for this render.
    }

    setShowSplash(true);
    setShowNav(false);
  }, [isHome]);

  useEffect(() => {
    if (!showSplash) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const finish = () => {
      try {
        window.sessionStorage.setItem(SPLASH_SESSION_KEY, "true");
      } catch {
        // The splash can still finish if session storage is unavailable.
      }
      setShowSplash(false);
      setShowNav(true);
    };
    const timeout = window.setTimeout(finish, SPLASH_DURATION_MS + 350);

    window.addEventListener(SPLASH_COMPLETE_EVENT, finish);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timeout);
      window.removeEventListener(SPLASH_COMPLETE_EVENT, finish);
    };
  }, [showSplash]);

  return (
    <div className="public-site amg-oc flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {showNav ? <SiteNav /> : null}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
