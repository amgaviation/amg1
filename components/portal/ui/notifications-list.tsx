import { EmptyState } from "@/components/portal/ui/primitives";
import { formatDateTime } from "@/lib/portal/format";
import type { NotificationRow } from "@/lib/portal/queries";
import { cn } from "@/lib/utils";

/** Shared notification feed used by every role's notifications page. */
export function NotificationsList({
  notifications,
  emptyDescription = "Updates on your requests, quotes, and account will appear here.",
}: {
  notifications: NotificationRow[];
  emptyDescription?: string;
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState icon="bell" title="No notifications" description={emptyDescription} />
    );
  }
  return (
    <div className="divide-y divide-[var(--deck-line)]">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn(
            "flex gap-4 py-4 first:pt-0 last:pb-0",
            n.is_read && "opacity-65"
          )}
        >
          <div
            className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              n.is_read ? "bg-transparent" : "bg-[var(--deck-gold)]"
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--deck-text)]">{n.title}</p>
            {n.body ? (
              <p className="mt-1 text-sm leading-5 text-[var(--deck-text-2)]">{n.body}</p>
            ) : null}
            <p className="deck-mono mt-1.5 text-[var(--deck-text-3)]">
              {formatDateTime(n.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
