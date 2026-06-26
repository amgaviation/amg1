import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { EmptyState, PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { listNotifications, markNotificationsRead } from "@/lib/portal/queries";
import { formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Notifications — Crew Portal" };

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
        {notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No notifications"
            description="AMG Operations will notify you here when assignments are offered, credentials are reviewed, or updates require your attention."
          />
        ) : (
          <div className="divide-y divide-white/10">
            {notifications.map((n) => (
              <div key={n.id} className={`flex gap-4 py-4 first:pt-0 last:pb-0 ${!n.is_read ? "opacity-100" : "opacity-70"}`}>
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? "bg-primary" : "bg-transparent"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  {n.body && (
                    <p className="mt-1 text-sm leading-5 text-slate-300">{n.body}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
