import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { NotificationsList } from "@/components/portal/ui/notifications-list";
import { listNotifications, markNotificationsRead } from "@/lib/portal/queries";

export const metadata = { title: "Notifications - Partner Portal" };

export default async function PartnerNotificationsPage() {
  const user = await requireRole("partner");
  const notifications = await listNotifications(user.id);

  // Mark unread notifications as read (fire-and-forget on server side)
  const unread = notifications.filter((n) => !n.is_read).map((n) => n.id);
  if (unread.length > 0) {
    await markNotificationsRead(unread).catch(() => null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Service Partner"
        title="Notifications"
        description="Updates on service requests, quotes, and milestones assigned to your company."
      />

      <SectionCard title="Recent Notifications" icon="bell">
        <NotificationsList
          notifications={notifications}
          emptyDescription="AMG Operations will notify you here when service requests are assigned or updated."
        />
      </SectionCard>
    </>
  );
}
