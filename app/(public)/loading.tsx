export default function PublicLoading() {
  return (
    <section
      className="public-editorial-section min-h-[calc(100svh+var(--public-header-height))] pt-[calc(var(--public-header-height)+4rem)]"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="oc-shell">
        <p className="oc-eyebrow oc-eyebrow-light">Loading</p>
        <p className="oc-display mt-5 max-w-3xl text-5xl text-[var(--oc-paper)] sm:text-6xl">
          Preparing AMG public content.
        </p>
        <div className="mt-10 max-w-3xl border-y border-[var(--oc-line-dark)] py-6">
          <div className="h-2 w-40 animate-pulse rounded-full bg-[var(--oc-blue)] motion-reduce:animate-none" />
          <div className="mt-5 grid gap-3">
            <div className="h-3 w-full rounded-full bg-white/[0.12]" />
            <div className="h-3 w-4/5 rounded-full bg-white/[0.10]" />
            <div className="h-3 w-2/3 rounded-full bg-white/[0.08]" />
          </div>
        </div>
      </div>
    </section>
  );
}
