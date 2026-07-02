import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function PortalNotFound() {
  return (
    <main className="amg-portal min-h-screen px-5 py-8 text-foreground lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
        <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <SearchX className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">Record Unavailable</p>
              <h1 className="mt-2 font-display text-2xl font-bold uppercase text-foreground">
                This record is no longer available
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This record was deleted, archived, moved, or is no longer available to this portal view.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/portal"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-sm font-semibold text-slate-700 hover:border-primary/50 hover:bg-blue-50"
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
