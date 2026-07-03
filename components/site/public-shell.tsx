"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

function normalizePath(path: string) {
  const normalized = path.split(/[?#]/)[0].replace(/\/+$/, "");
  return normalized || "/";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({
    block: "start",
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
  return true;
}

function normalizeBrowserPath(path: string) {
  return normalizePath(path || "/");
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!window.location.hash) return;

    let frame = 0;
    let attempts = 0;
    const maxAttempts = 45;

    const scrollWhenReady = () => {
      attempts += 1;
      if (scrollToHash(window.location.hash) || attempts >= maxAttempts) return;
      frame = window.requestAnimationFrame(scrollWhenReady);
    };

    frame = window.requestAnimationFrame(scrollWhenReady);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, children]);

  useEffect(() => {
    const onHashChange = () => {
      scrollToHash(window.location.hash);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash) return;
      if (normalizeBrowserPath(url.pathname) !== normalizeBrowserPath(window.location.pathname)) return;

      event.preventDefault();
      event.stopPropagation();
      window.history.pushState(null, "", url.href);
      scrollToHash(url.hash);
    };

    const onPopState = () => {
      if (window.location.hash) scrollToHash(window.location.hash);
    };

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return (
    <div className="public-site amg-oc flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
