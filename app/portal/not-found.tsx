import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function PortalNotFound() {
  return (
    <main className="amg-portal min-h-screen px-5 py-8 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
        <section className="deck-card w-full max-w-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--deck-line-strong)] bg-[var(--deck-panel-2)]">
              <SearchX className="h-5 w-5 text-[var(--deck-text-2)]" />
            </div>
            <div>
              <p className="deck-eyebrow">Record Unavailable</p>
              <h1 className="deck-title mt-2 text-2xl">
                This record is no longer available
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--deck-text-2)]">
                This record was deleted, archived, moved, or is no longer available to this
                portal view.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/portal"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-5 text-sm font-semibold text-[var(--deck-text-2)] transition-colors hover:border-[var(--deck-accent-line)] hover:bg-[var(--deck-accent-tint)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
