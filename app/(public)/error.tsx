"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="public-editorial-section min-h-[72svh] pt-[calc(var(--public-header-height)+4rem)]">
      <div className="oc-shell max-w-4xl">
        <p className="oc-eyebrow oc-eyebrow-light">Page unavailable</p>
        <h1 className="oc-display mt-5 text-5xl text-[var(--oc-paper)] sm:text-6xl">
          This public page could not load.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
          Try reloading the page. If the issue continues, contact AMG instead of resubmitting sensitive aircraft or credential details.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="oc-btn oc-btn-light">
            Try again
            <RotateCcw className="h-4 w-4" />
          </button>
          <Link href="/contact" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            Contact AMG
          </Link>
          <Link href="/" prefetch={false} className="oc-btn oc-btn-ghost-dark">
            Homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
