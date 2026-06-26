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
    <main className="amg-portal min-h-screen bg-[#050B14] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-lg border border-red-400/30 bg-[#07111F]/92 p-6 shadow-[0_18px_58px_rgba(0,0,0,0.24)]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-100" />
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-red-100">
                Portal Unavailable
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold uppercase text-white">
                This workspace could not be loaded
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
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
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 px-5 text-sm font-semibold text-slate-200 hover:border-primary/50 hover:text-white"
            >
              Return to portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
