"use client";

import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[var(--deck-panel-2)] ${className}`} />;
}

export function RecordDetailLoading({ label }: { label: string }) {
  return (
    <main className="amg-portal min-h-screen px-4 py-6 text-[var(--deck-text)] sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-[96rem] gap-5">
        <section className="deck-card p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid min-w-0 gap-3">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-9 w-72 max-w-full" />
              <SkeletonBlock className="h-4 w-[34rem] max-w-full" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-7 w-24 rounded-[0.25rem]" />
                <SkeletonBlock className="h-7 w-28 rounded-[0.25rem]" />
              </div>
            </div>
            <SkeletonBlock className="h-11 w-36 rounded-md" />
          </div>
        </section>

        <div className="deck-card flex flex-wrap gap-2 p-2" aria-label={`${label} loading`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-9 w-28" />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <section key={index} className="deck-card p-5">
              <SkeletonBlock className="h-4 w-40" />
              <div className="mt-5 grid gap-3">
                {Array.from({ length: 5 }).map((__, row) => (
                  <SkeletonBlock key={row} className="h-5 w-full" />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 text-sm text-[var(--deck-text-3)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--deck-accent-ink)]" />
          Loading {label.toLowerCase()}...
        </div>
      </div>
    </main>
  );
}

export function RecordDetailError({
  label,
  href,
  reset,
}: {
  label: string;
  href: string;
  reset: () => void;
}) {
  return (
    <main className="amg-portal flex min-h-screen items-center justify-center px-4 py-10 text-[var(--deck-text)]">
      <section className="deck-card w-full max-w-xl border-[var(--deck-danger-line)] p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-md border border-[var(--deck-danger-line)] bg-[var(--deck-danger-tint)] p-2 text-[var(--deck-danger)]">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="deck-eyebrow !text-[var(--deck-danger)]">{label}</p>
            <h2 className="deck-title mt-2 text-2xl">
              Record unavailable
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--deck-text-2)]">
              AMG could not load this record. Return to the list or retry the request.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[var(--deck-line)] pt-4">
          <Button type="button" variant="outline" asChild>
            <Link href={href}>Back</Link>
          </Button>
          <Button type="button" onClick={reset}>
            Retry
          </Button>
        </div>
      </section>
    </main>
  );
}
