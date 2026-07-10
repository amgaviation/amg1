import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { NotificationsList } from "@/components/portal/ui/notifications-list";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listNotifications } from "@/lib/portal/queries";
import { markAllNotificationsRead } from "@/app/portal/actions/notifications";

export const metadata = { title: "Notifications - Crew Portal" };

export default async function CrewNotificationsPage() {
  const user = await requireRolePermission("crew", "notifications");
  const notifications = await listNotifications(user.id);
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <>
      <PageHeader
        eyebrow="Flight Crew"
        title="Notifications"
        description="Assignment offers, credential reviews, and operational updates from AMG."
        actions={
          hasUnread ? (
            <form action={markAllNotificationsRead}>
              <SubmitButton variant="outline" size="sm" pendingText="Marking…">
                Mark all read
              </SubmitButton>
            </form>
          ) : null
        }
      />

      <SectionCard title="Recent Notifications" icon="bell">
        <NotificationsList
          role={user.role}
          notifications={notifications}
          emptyDescription="AMG Operations will notify you here when assignments are offered, credentials are reviewed, or updates require your attention."
        />
      </SectionCard>
    </>
  );
}
