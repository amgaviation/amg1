import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { NotificationsList } from "@/components/portal/ui/notifications-list";
import { listNotifications, markNotificationsRead } from "@/lib/portal/queries";

export const metadata = { title: "Notifications - Admin Portal" };

export default async function AdminNotificationsPage() {
  const user = await requireRole("admin");
  const notifications = await listNotifications(user.id);

  // Mark unread notifications as read (fire-and-forget on server side)
  const unread = notifications.filter((n) => !n.is_read).map((n) => n.id);
  if (unread.length > 0) {
    await markNotificationsRead(unread).catch(() => null);
  }

  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Notifications"
        description="Task assignments, request activity, and system updates addressed to you."
      />

      <SectionCard title="Recent Notifications" icon="bell">
        <NotificationsList
          notifications={notifications}
          emptyDescription="Assignments, mentions, and system updates addressed to you will appear here."
        />
      </SectionCard>
    </>
  );
}
