import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { NotificationsList } from "@/components/portal/ui/notifications-list";
import { listNotifications, markNotificationsRead } from "@/lib/portal/queries";

export const metadata = { title: "Notifications - Client Portal" };

export default async function ClientNotificationsPage() {
  const user = await requireRole("client");
  const notifications = await listNotifications(user.id);

  // Mark unread notifications as read (fire-and-forget on server side)
  const unread = notifications.filter((n) => !n.is_read).map((n) => n.id);
  if (unread.length > 0) {
    await markNotificationsRead(unread).catch(() => null);
  }

  return (
    <PortalShell role="client" user={user}>
      <PageHeader
        eyebrow="Owner Services"
        title="Notifications"
        description="Updates from AMG Operations on your requests, quotes, and account."
      />

      <SectionCard title="Recent Notifications" icon="bell">
        <NotificationsList
          notifications={notifications}
          emptyDescription="AMG Operations will notify you here when your support requests are updated, quotes are sent, or actions are needed."
        />
      </SectionCard>
    </PortalShell>
  );
}
