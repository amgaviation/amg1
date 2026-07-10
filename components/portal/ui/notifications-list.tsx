"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationRead } from "@/app/portal/actions/notifications";
import { EmptyState } from "@/components/portal/ui/primitives";
import { formatDateTime } from "@/lib/portal/format";
import { notificationHref } from "@/lib/portal/notification-links";
import type { NotificationRow } from "@/lib/portal/queries";
import { cn } from "@/lib/utils";

/** Shared notification feed used by every role's notifications page. */
export function NotificationsList({
  notifications,
  role,
  emptyDescription = "Updates on your requests, quotes, and account will appear here.",
}: {
  notifications: NotificationRow[];
  /** Viewing role — drives per-role deep links (client vs crew vs admin, etc.). */
  role: string;
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
        <NotificationItem
          key={n.id}
          notification={n}
          href={notificationHref(role, n.entity_type, n.entity_id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification: n,
  href,
}: {
  notification: NotificationRow;
  href: string | null;
}) {
  const [, startTransition] = useTransition();

  const body = (
    <>
      <div
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          n.is_read ? "bg-transparent" : "bg-[var(--deck-accent)]"
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
    </>
  );

  const rowClass = cn("flex gap-4 py-4 first:pt-0 last:pb-0", n.is_read && "opacity-65");

  // No sensible destination for this entity/role — render inert, as before.
  if (!href) {
    return <div className={rowClass}>{body}</div>;
  }

  return (
    <Link
      href={href}
      onClick={() => {
        // Mark THIS row read as we navigate; fire-and-forget so it never
        // blocks the click-through.
        if (!n.is_read) startTransition(() => void markNotificationRead(n.id));
      }}
      className={cn(
        rowClass,
        "-mx-2 rounded-lg px-2 transition-colors hover:bg-[var(--deck-accent-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
      )}
    >
      {body}
    </Link>
  );
}
