import { PortalIcon } from "@/components/portal/ui/icon";

/**
 * Persistent strip rendered above every Demo Portal page. The demo role
 * exists to showcase AMG Connect, so the banner says plainly that everything
 * below it is simulated — no viewer should mistake the sandbox for live
 * operations, and no screenshot of it should pass as real financials.
 */
export function DemoModeBanner() {
  return (
    <div className="relative overflow-hidden rounded-[calc(var(--radius)-2px)] border border-[var(--deck-info-line)] bg-[var(--deck-info-tint)] px-4 py-3 pl-5 text-sm text-[var(--deck-info)]">
      <span className="absolute inset-y-0 left-0 w-1 bg-[var(--deck-info)]" aria-hidden />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <PortalIcon name="layers" className="h-4 w-4" />
          Demo Mode
        </span>
        <span>
          Every record in this workspace is simulated sample data for demonstration —
          no live client, crew, or financial information appears here.
        </span>
      </div>
    </div>
  );
}
