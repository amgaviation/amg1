import { requireRole } from "@/lib/portal/session";
import { PageHeader, SectionCard } from "@/components/portal/ui/primitives";
import { PortalIcon } from "@/components/portal/ui/icon";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusDot } from "@/components/portal/ui/status-dot";
import { DEMO_NOTIFICATIONS, demoHoursAgo } from "@/lib/demo/data";

export const metadata = { title: "Notifications - Demo Portal" };

export default async function DemoNotificationsPage() {
  await requireRole("demo");

  return (
    <>
      <PageHeader
        eyebrow="Demo Sandbox"
        title="Notifications"
        description="A simulated feed of the events AMG Connect surfaces: AOG requests, approvals, payments, and expiring credentials."
      />

      <SectionCard title="Recent" icon="bell">
        <ol className="space-y-2.5">
          {DEMO_NOTIFICATIONS.map((notification) => (
            <li
              key={notification.id}
              className="flex items-start gap-3.5 rounded-[calc(var(--radius)-2px)] border border-[var(--deck-line)] bg-[var(--deck-panel)] p-4"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]">
                <PortalIcon name={notification.icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-sm font-semibold text-[var(--deck-text)]">{notification.title}</p>
                  <span className="deck-mono shrink-0 text-[var(--deck-text-3)]">
                    <LocalTime value={demoHoursAgo(notification.hoursAgo)} />
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--deck-text-2)]">{notification.body}</p>
              </div>
              <StatusDot tone={notification.tone} className="mt-1.5 shrink-0" />
            </li>
          ))}
        </ol>
      </SectionCard>
    </>
  );
}
