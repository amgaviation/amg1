type RouteSkeletonProps = {
  variant?: "list" | "detail";
};

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[var(--deck-panel-2)] ${className}`} />;
}

export function RouteSkeleton({ variant = "list" }: RouteSkeletonProps) {
  return (
    <main
      className="amg-portal min-h-screen px-4 py-6 text-[var(--deck-text)] sm:px-6 lg:px-8"
      aria-busy="true"
    >
      <div className="mx-auto grid w-full max-w-[96rem] gap-5">
        <section className="deck-card p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid min-w-0 flex-1 gap-3">
              <Shimmer className="h-3 w-28" />
              <Shimmer className="h-9 w-72 max-w-full" />
              <Shimmer className="h-4 w-[30rem] max-w-full" />
            </div>
            <Shimmer className="h-11 w-36" />
          </div>
        </section>
        {variant === "list" ? (
          <section className="deck-card p-5">
            <div className="flex flex-wrap gap-2">
              <Shimmer className="h-9 w-56" />
              <Shimmer className="h-9 w-28" />
              <Shimmer className="h-9 w-28" />
            </div>
            <div className="mt-5 grid gap-3">
              {Array.from({ length: 8 }).map((_, row) => (
                <Shimmer key={row} className="h-10 w-full" />
              ))}
            </div>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, card) => (
              <section key={card} className="deck-card p-5">
                <Shimmer className="h-4 w-40" />
                <div className="mt-5 grid gap-3">
                  {Array.from({ length: 4 }).map((__, row) => (
                    <Shimmer key={row} className="h-5 w-full" />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        <span className="sr-only">Loading</span>
      </div>
    </main>
  );
}
