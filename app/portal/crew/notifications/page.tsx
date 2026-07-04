import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { NotificationsList } from "@/components/portal/ui/notifications-list";
import { listNotifications, markNotificationsRead } from "@/lib/portal/queries";

export const metadata = { title: "Notifications - Crew Portal" };

export default async function CrewNotificationsPage() {
  const user = await requireRole("crew");
  const notifications = await listNotifications(user.id);

  const unread = notifications.filter((n) => !n.is_read).map((n) => n.id);
  if (unread.length > 0) {
    await markNotificationsRead(unread).catch(() => null);
  }

  return (
    <PortalShell role="crew" user={user}>
      <PageHeader
        eyebrow="Flight Crew"
        title="Notifications"
        description="Assignment offers, credential reviews, and operational updates from AMG."
      />

      <SectionCard title="Recent Notifications" icon="bell">
        <NotificationsList
          notifications={notifications}
          emptyDescription="AMG Operations will notify you here when assignments are offered, credentials are reviewed, or updates require your attention."
        />
      </SectionCard>
    </PortalShell>
  );
}
