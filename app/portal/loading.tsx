import { PortalIcon } from "@/components/portal/ui/icon";

export default function PortalLoading() {
  return (
    <main className="amg-portal min-h-screen px-5 py-8 text-foreground lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
        <div className="w-full max-w-xl rounded-lg border border-border bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <PortalIcon name="radar" className="h-5 w-5 animate-pulse text-primary" />
            </div>
            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">
                AMG Connect
              </p>
              <h1 className="mt-1 font-display text-xl font-bold uppercase text-foreground">
                Loading operations workspace
              </h1>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="h-3 w-5/6 rounded-full bg-slate-100" />
            <div className="h-3 w-2/3 rounded-full bg-slate-100" />
            <div className="h-20 rounded-lg border border-slate-200 bg-slate-50" />
          </div>
        </div>
      </div>
    </main>
  );
}
