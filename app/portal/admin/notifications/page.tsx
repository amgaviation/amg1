import { requireRolePermission } from "@/lib/portal/permissions";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { NotificationsList } from "@/components/portal/ui/notifications-list";
import { SubmitButton } from "@/components/portal/ui/submit-button";
import { listNotifications } from "@/lib/portal/queries";
import { markAllNotificationsRead } from "@/app/portal/actions/notifications";

export const metadata = { title: "Notifications - Admin Portal" };

export default async function AdminNotificationsPage() {
  const user = await requireRolePermission("admin", "notifications");
  const notifications = await listNotifications(user.id);
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Notifications"
        description="Task assignments, request activity, and system updates addressed to you."
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
          emptyDescription="Assignments, mentions, and system updates addressed to you will appear here."
        />
      </SectionCard>
    </>
  );
}
