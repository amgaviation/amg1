"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import {
  SPLASH_COMPLETE_EVENT,
  SPLASH_DURATION_MS,
  SplashIntro,
} from "@/components/site/splash-intro";

function normalizePath(path: string) {
  const normalized = path.split(/[?#]/)[0].replace(/\/+$/, "");
  return normalized || "/";
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = normalizePath(pathname) === "/";

  // SplashIntro fully owns its own visibility logic (sessionStorage + iframe check).
  // PublicShell only tracks whether the nav should be hidden while the splash plays.
  const [navHidden, setNavHidden] = useState(isHome);

  useEffect(() => {
    if (!isHome) {
      setNavHidden(false);
      return;
    }

    // Show nav once splash finishes (or after its max duration as a fallback).
    const finish = () => setNavHidden(false);
    const timeout = window.setTimeout(finish, SPLASH_DURATION_MS + 350);
    window.addEventListener(SPLASH_COMPLETE_EVENT, finish, { once: true });

    // Lock scroll while splash is active.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timeout);
      window.removeEventListener(SPLASH_COMPLETE_EVENT, finish);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome]);

  return (
    <div className="public-site amg-oc flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {isHome ? <SplashIntro /> : null}
      {!navHidden ? <SiteNav /> : null}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
