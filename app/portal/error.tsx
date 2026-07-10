"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function PortalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="amg-portal min-h-screen px-5 py-8 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
        <section className="deck-card w-full max-w-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)]">
              <AlertTriangle className="h-5 w-5 text-[var(--deck-danger)]" />
            </div>
            <div>
              <p className="deck-eyebrow !text-[var(--deck-danger)]">Portal Unavailable</p>
              <h1 className="deck-title mt-2 text-2xl">
                This workspace could not be loaded
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--deck-text-2)]">
                AMG Connect could not load this portal view. Retry the request, or return to
                your portal home while Operations reviews the issue.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--deck-navy)] px-5 text-sm font-semibold text-[var(--deck-on-ink)] transition-colors hover:bg-[var(--deck-navy-2)]"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <Link
              href="/portal"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-5 text-sm font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              Return to portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
