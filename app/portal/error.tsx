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
    <main className="amg-portal min-h-screen px-5 py-8 text-foreground lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-lg border border-red-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-red-700">
                Portal Unavailable
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold uppercase text-foreground">
                This workspace could not be loaded
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                AMG Connect could not load this portal view. Retry the request, or return to your portal home while Operations reviews the issue.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <Link
              href="/portal"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-slate-700 hover:border-primary/50 hover:bg-blue-50"
            >
              Return to portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
