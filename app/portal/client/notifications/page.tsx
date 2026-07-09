import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { NotificationsList } from "@/components/portal/ui/notifications-list";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listNotifications } from "@/lib/portal/queries";
import { markAllNotificationsRead } from "@/app/portal/actions/notifications";

export const metadata = { title: "Notifications - Client Portal" };

export default async function ClientNotificationsPage() {
  const user = await requireRolePermission("client", "notifications");
  const notifications = await listNotifications(user.id);
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <>
      <PageHeader
        eyebrow="Owner Services"
        title="Notifications"
        description="Updates from AMG Operations on your requests, quotes, and account."
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
          emptyDescription="AMG Operations will notify you here when your support requests are updated, quotes are sent, or actions are needed."
        />
      </SectionCard>
    </>
  );
}
