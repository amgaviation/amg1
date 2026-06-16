"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Persistent Request Support action on small phones, where the header CTA
 * collapses into the menu. Appears once the user is past the hero and tucks
 * away near the footer so it never covers footer content. sm+ uses the nav CTA.
 */
export function MobileActionBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom = y + window.innerHeight > document.documentElement.scrollHeight - 200;
      setShow(y > 480 && !nearBottom);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--oc-line)] bg-[var(--oc-paper)]/95 p-3 backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none sm:hidden",
        show ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-2.5">
        <Link
          href="/contact"
          prefetch={false}
          tabIndex={show ? 0 : -1}
          className="oc-btn oc-btn-primary flex-1 justify-center"
        >
          Request Support
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/login"
          prefetch={false}
          tabIndex={show ? 0 : -1}
          className="oc-btn oc-btn-ghost shrink-0"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
