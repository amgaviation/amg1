import { PortalIcon } from "@/components/portal/ui/icon";

export default function PortalLoading() {
  return (
    <main className="amg-portal min-h-screen px-5 py-8 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-6xl items-center justify-center">
        <div className="deck-card w-full max-w-xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--deck-gold-line)] bg-[var(--deck-gold-tint)]">
              <PortalIcon
                name="radar"
                className="h-5 w-5 animate-pulse text-[var(--deck-gold-deep)]"
              />
            </div>
            <div>
              <p className="deck-eyebrow">AMG Connect</p>
              <h1 className="deck-title mt-1 text-xl">Loading operations workspace</h1>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-[var(--deck-panel-2)]" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-[var(--deck-panel-2)]" />
            <div className="deck-inset h-20 animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
