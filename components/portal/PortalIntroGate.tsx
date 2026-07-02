"use client";

import { useCallback, useEffect, useState } from "react";
import { AMGConnectLoginIntro } from "@/components/portal/AMGConnectLoginIntro";
import {
  PORTAL_INTRO_PENDING_KEY,
  PORTAL_INTRO_PENDING_COOKIE,
  PORTAL_INTRO_SEEN_KEY,
  clearPortalIntroBrowserState,
} from "@/lib/portal/intro";

export function PortalIntroGate({
  children,
  initialIntroPending = false,
}: {
  children: React.ReactNode;
  initialIntroPending?: boolean;
}) {
  const [introActive, setIntroActive] = useState(initialIntroPending);

  useEffect(() => {
    let shouldPlay = initialIntroPending;

    try {
      const params = new URLSearchParams(window.location.search);
      shouldPlay =
        shouldPlay ||
        params.get("intro") === "1" ||
        window.sessionStorage.getItem(PORTAL_INTRO_PENDING_KEY) === "1";
    } catch {
      shouldPlay = initialIntroPending;
    }

    if (shouldPlay) {
      setIntroActive(true);
      window.sessionStorage.removeItem(PORTAL_INTRO_PENDING_KEY);
      window.sessionStorage.setItem(PORTAL_INTRO_SEEN_KEY, String(Date.now()));
      document.cookie = `${PORTAL_INTRO_PENDING_COOKIE}=; Max-Age=0; Path=/portal; SameSite=Lax`;
      document.cookie = `${PORTAL_INTRO_PENDING_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
  }, [initialIntroPending]);

  useEffect(() => {
    if (!introActive) return;

    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [introActive]);

  const completeIntro = useCallback(() => {
    clearPortalIntroBrowserState();
    setIntroActive(false);
  }, []);

  return (
    <>
      <div
        aria-hidden={introActive ? "true" : undefined}
        className={introActive ? "pointer-events-none select-none" : undefined}
      >
        {children}
      </div>
      {introActive ? <AMGConnectLoginIntro onComplete={completeIntro} /> : null}
    </>
  );
}
