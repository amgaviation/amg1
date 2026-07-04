import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import {
  EmptyState,
  Notice,
  PageHeader,
  QuickLink,
  RecordRow,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  countUnread,
  listAircraftForClient,
  listMissionsForClient,
  listQuotesForClient,
  listSubscriptionsForClient,
} from "@/lib/portal/queries";
import {
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatMoney, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Overview - Client Portal" };

export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;

  const [missions, aircraft, quotes, subscriptions, unread] = await Promise.all([
    listMissionsForClient(user.id),
    listAircraftForClient(user.id),
    listQuotesForClient(user.id),
    listSubscriptionsForClient(user.id),
    countUnread(user.id),
  ]);

  const active = missions.filter((m) =>
    [
      "submitted",
      "under_review",
      "awaiting_client_info",
      "quoted",
      "approved",
      "crew_assigned",
      "scheduled",
      "in_progress",
    ].includes(m.status)
  );
  const upcoming = missions
    .filter((m) => ["crew_assigned", "scheduled"].includes(m.status))
    .slice(0, 3);
  const completed = missions.filter((m) => m.status === "completed").slice(0, 3);
  const openQuotes = quotes.filter((q) => q.status === "sent");
  const activeSubscriptions = subscriptions.filter((subscription) =>
    ["active", "renewal_pending"].includes(subscription.status)
  );

  return (
    <PortalShell role="client" user={user} unread={unread}>
      {params.success === "created" ? (
        <Notice tone="success">
          Request received. AMG Operations will review the submitted details against support
          scope, aircraft context, crew availability, owner/operator approval, and operational
          conditions.
        </Notice>
      ) : null}

      <PageHeader
        eyebrow="Owner Services"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={user.companyName ?? user.email}
        actions={
          <Button asChild size="sm">
            <Link href="/portal/client/trips/new">New Request</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active requests" value={active.length} icon="plane" href="/portal/client/trips" />
        <StatCard label="Aircraft on file" value={aircraft.length} icon="planeTakeoff" href="/portal/client/aircraft" />
        <StatCard
          label="Open quotes"
          value={openQuotes.length}
          icon="receipt"
          tone={openQuotes.length > 0 ? "accent" : "default"}
          href="/portal/client/quotes"
          detail={openQuotes.length > 0 ? "Awaiting your review" : undefined}
        />
        <StatCard
          label="Subscriptions"
          value={activeSubscriptions.length}
          icon="creditCard"
          href="/portal/client/subscriptions"
          tone={activeSubscriptions.length ? "accent" : "default"}
        />
        <StatCard
          label="Unread messages"
          value={unread}
          icon="messageSquare"
          tone={unread > 0 ? "warn" : "default"}
          href="/portal/client/messages"
        />
      </div>

      <SectionCard
        title="Quick Actions"
        icon="zap"
        bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <QuickLink href="/portal/client/trips/new?type=passenger_trip" icon="plane" label="Request Trip" />
        <QuickLink href="/portal/client/trips/new?type=ferry" icon="planeTakeoff" label="Ferry Request" />
        <QuickLink href="/portal/client/trips/new?type=maintenance_reposition" icon="wrench" label="Maintenance Reposition" />
        <QuickLink href="/portal/client/trips/new?type=crew_reposition" icon="users" label="Crew Request" />
        <QuickLink href="/portal/client/documents?upload=1" icon="upload" label="Upload Document" />
        <QuickLink href="/portal/client/messages?new=1" icon="messageSquare" label="Contact Operations" />
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Upcoming Missions"
          icon="plane"
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/client/trips">View all</Link>
            </Button>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState
              icon="plane"
              title="No upcoming missions"
              description="Submit a trip request to get started."
              action={
                <Button asChild size="sm">
                  <Link href="/portal/client/trips/new">New request</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {upcoming.map((m) => (
                <RecordRow
                  key={m.id}
                  href={`/portal/client/trips/${m.id}`}
                  refLabel={m.ref}
                  title={formatRoute(m.departure_airport, m.arrival_airport)}
                  meta={
                    <>
                      {m.tail_number ?? "Aircraft TBD"} · {formatDateTime(m.requested_departure)}
                    </>
                  }
                  trailing={
                    <StatusBadge
                      label={MISSION_STATUS_LABEL[m.status] ?? m.status}
                      tone={toneFor(MISSION_STATUS_TONE, m.status)}
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Aircraft Status"
          icon="planeTakeoff"
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/client/aircraft">View all</Link>
            </Button>
          }
        >
          {aircraft.length === 0 ? (
            <EmptyState
              icon="planeTakeoff"
              title="No aircraft on file"
              description="Contact AMG Operations to associate your aircraft."
            />
          ) : (
            <div className="space-y-3">
              {aircraft.slice(0, 4).map((ac) => (
                <RecordRow
                  key={ac.id}
                  refLabel={ac.tail_number}
                  title={[ac.make, ac.model].filter(Boolean).join(" ") || "Aircraft"}
                  meta={<>Home base {ac.home_base ?? "—"}</>}
                  trailing={
                    <StatusBadge
                      label={ac.maintenance_status.replace(/_/g, " ")}
                      tone={
                        ac.maintenance_status === "in_service"
                          ? "success"
                          : ac.maintenance_status === "aog"
                            ? "danger"
                            : "warn"
                      }
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {activeSubscriptions.length > 0 ? (
        <SectionCard
          title="Subscription Summary"
          icon="creditCard"
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/client/subscriptions">View all</Link>
            </Button>
          }
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {activeSubscriptions.slice(0, 2).map((subscription) => (
              <RecordRow
                key={subscription.id}
                href={`/portal/client/subscriptions/${subscription.id}`}
                title={subscription.plan?.name ?? "AMG Support Subscription"}
                meta={
                  <>
                    {subscription.tier?.name ?? "Custom"} ·{" "}
                    {subscription.aircraft?.tail_number ?? "Account-level"} ·{" "}
                    {subscription.included_flights} flights · {subscription.included_mx_repositions}{" "}
                    MX repos · {subscription.included_admin_hours} admin hrs
                  </>
                }
                trailing={
                  <span className="text-xs font-semibold text-[var(--deck-gold-deep)]">
                    Renews {subscription.renewal_date ?? "TBD"}
                  </span>
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {openQuotes.length > 0 ? (
        <SectionCard
          title="Quotes Awaiting Review"
          icon="receipt"
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/client/quotes">View all</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {openQuotes.slice(0, 3).map((q) => (
              <RecordRow
                key={q.id}
                href={`/portal/client/quotes/${q.id}`}
                refLabel={q.ref}
                title={q.mission ? `Mission ${q.mission.ref}` : "General estimate"}
                tone="gold"
                trailing={
                  <>
                    <span className="deck-num text-sm font-bold text-[var(--deck-text)]">
                      {formatMoney(q.total)}
                    </span>
                    <span className="text-xs font-semibold text-[var(--deck-gold-deep)]">
                      Review →
                    </span>
                  </>
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {completed.length > 0 ? (
        <SectionCard title="Recently Completed" icon="history">
          <div className="space-y-3">
            {completed.map((m) => (
              <RecordRow
                key={m.id}
                href={`/portal/client/trips/${m.id}`}
                refLabel={m.ref}
                title={formatRoute(m.departure_airport, m.arrival_airport)}
                trailing={<StatusBadge label="Completed" tone="success" />}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}
    </PortalShell>
  );
}
