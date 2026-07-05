import { cn } from "@/lib/utils";

/**
 * Standard list-page toolbar: search form on the left, filter pills in the
 * middle, primary actions on the right. Server-safe — pass a GET <form> or
 * inputs as `search`, a <FilterTabs> as `filters`, buttons/links as `actions`.
 * Wraps cleanly on mobile.
 */
export function PageToolbar({
  search,
  filters,
  actions,
  className,
}: {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {filters ? <div className="min-w-0">{filters}</div> : null}
        {search ? <div className="min-w-0 flex-1">{search}</div> : null}
      </div>
      {actions ? (
        <div data-portal-action-bar className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
