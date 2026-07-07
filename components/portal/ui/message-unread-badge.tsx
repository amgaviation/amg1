import { StatusBadge } from "@/components/portal/ui/status-badge";

/**
 * Subtle unread-count chip for message thread list rows. Shared by every
 * role's messages page; renders nothing once the thread is fully read.
 */
export function MessageUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <StatusBadge label={`${count} new`} tone="accent" />;
}
