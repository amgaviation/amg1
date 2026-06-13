import Link from "next/link";
import { ArrowRight, Plane, Plus, FileText, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { StatCard, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  listMissionsForClient,
  listAircraftForClient,
  listQuotesForClient,
  listSubscriptionsForClient,
  countUnread,
} from "@/lib/portal/queries";
import {
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  URGENCY_LABEL,
  URGENCY_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatRoute, formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Dashboard — Client Portal" };

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
    ["submitted", "under_review", "awaiting_client_info", "quoted", "approved", "crew_assigned", "scheduled", "in_progress"].includes(m.status)
  );
  const upcoming = missions.filter((m) =>
    ["crew_assigned", "scheduled"].includes(m.status)
  ).slice(0, 3);
  const completed = missions.filter((m) => m.status === "completed").slice(0, 3);
  const openQuotes = quotes.filter((q) => q.status === "sent");
  const activeSubscriptions = subscriptions.filter((subscription) => ["active", "renewal_pending"].includes(subscription.status));

  return (
    <PortalShell role="client" user={user} unread={unread}>
      {params.success === "created" ? (
        <Notice tone="success">Trip request submitted. AMG Operations will review shortly.</Notice>
      ) : null}

      <div className="flex flex-col gap-1">
        <p className="eyebrow text-[0.62rem] text-accent">Owner Services</p>
        <h1 className="font-display text-3xl font-extrabold uppercase leading-none">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">{user.companyName ?? user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active missions" value={active.length} href="/portal/client/trips" />
        <StatCard label="Aircraft on file" value={aircraft.length} href="/portal/client/aircraft" />
        <StatCard
          label="Open quotes"
          value={openQuotes.length}
          tone={openQuotes.length > 0 ? "accent" : "default"}
          href="/portal/client/quotes"
          detail={openQuotes.length > 0 ? "Awaiting your review" : undefined}
        />
        <StatCard label="Subscriptions" value={activeSubscriptions.length} href="/portal/client/subscriptions" tone={activeSubscriptions.length ? "accent" : "default"} />
        <StatCard label="Unread messages" value={unread} tone={unread > 0 ? "warn" : "default"} href="/portal/client/messages" />
      </div>

      <SectionCard
        title="Quick Actions"
        icon="plane"
        bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {[
          { href: "/portal/client/trips/new?type=passenger_trip", label: "Request Trip", icon: <Plane className="h-4 w-4" /> },
          { href: "/portal/client/trips/new?type=ferry", label: "Ferry Request", icon: <Plane className="h-4 w-4" /> },
          { href: "/portal/client/trips/new?type=maintenance_reposition", label: "Maintenance Reposition", icon: <Plane className="h-4 w-4" /> },
          { href: "/portal/client/trips/new?type=crew_reposition", label: "Crew Request", icon: <Plus className="h-4 w-4" /> },
          { href: "/portal/client/documents?upload=1", label: "Upload Document", icon: <FileText className="h-4 w-4" /> },
          { href: "/portal/client/subscriptions", label: "View Subscription", icon: <FileText className="h-4 w-4" /> },
          { href: "/portal/client/messages?new=1", label: "Contact Operations", icon: <MessageSquare className="h-4 w-4" /> },
        ].map((item) => (
          <Button key={item.href} asChild variant="outline" className="h-auto justify-start gap-3 rounded-lg py-3">
            <Link href={item.href}>
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </Button>
        ))}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Upcoming Missions"
          icon="plane"
          actions={
            <Button asChild size="sm" variant="ghost" className="rounded-full text-xs">
              <Link href="/portal/client/trips">View all</Link>
            </Button>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState icon="plane" title="No upcoming missions" description="Submit a trip request to get started." action={<Button asChild size="sm"><Link href="/portal/client/trips/new">New request</Link></Button>} />
          ) : (
            <div className="space-y-3">
              {upcoming.map((m) => (
                <Link key={m.id} href={`/portal/client/trips/${m.id}`} className="block rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-accent/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-accent">{m.ref}</p>
                      <p className="mt-1 text-sm font-semibold">{formatRoute(m.departure_airport, m.arrival_airport)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{m.tail_number ?? "Aircraft TBD"} · {formatDateTime(m.requested_departure)}</p>
                    </div>
                    <StatusBadge label={MISSION_STATUS_LABEL[m.status] ?? m.status} tone={toneFor(MISSION_STATUS_TONE, m.status)} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Aircraft Status"
          icon="planeTakeoff"
          actions={
            <Button asChild size="sm" variant="ghost" className="rounded-full text-xs">
              <Link href="/portal/client/aircraft">View all</Link>
            </Button>
          }
        >
          {aircraft.length === 0 ? (
            <EmptyState icon="planeTakeoff" title="No aircraft on file" description="Contact AMG Operations to associate your aircraft." />
          ) : (
            <div className="space-y-3">
              {aircraft.slice(0, 4).map((ac) => (
                <div key={ac.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <p className="font-mono font-semibold text-accent">{ac.tail_number}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[ac.make, ac.model].filter(Boolean).join(" ")} · {ac.home_base ?? "—"}
                    </p>
                  </div>
                  <StatusBadge
                    label={ac.maintenance_status.replace(/_/g, " ")}
                    tone={ac.maintenance_status === "in_service" ? "success" : ac.maintenance_status === "aog" ? "danger" : "warn"}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {activeSubscriptions.length > 0 ? (
        <SectionCard title="Subscription Summary" icon="clipboard" actions={<Button asChild size="sm" variant="ghost" className="rounded-full text-xs"><Link href="/portal/client/subscriptions">View all</Link></Button>}>
          <div className="grid gap-3 lg:grid-cols-2">
            {activeSubscriptions.slice(0, 2).map((subscription) => (
              <Link key={subscription.id} href={`/portal/client/subscriptions/${subscription.id}`} className="rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-accent/60">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{subscription.plan?.name ?? "AMG Support Subscription"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{subscription.tier?.name ?? "Custom"} · {subscription.aircraft?.tail_number ?? "Account-level"}</p>
                  </div>
                  <span className="text-xs text-accent">Renews {subscription.renewal_date ?? "TBD"}</span>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>{subscription.included_flights} flights</span>
                  <span>{subscription.included_mx_repositions} MX repos</span>
                  <span>{subscription.included_admin_hours} admin hrs</span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {openQuotes.length > 0 ? (
        <SectionCard title="Quotes Awaiting Review" icon="receipt" actions={<Button asChild size="sm" variant="ghost" className="rounded-full text-xs"><Link href="/portal/client/quotes">View all</Link></Button>}>
          <div className="space-y-3">
            {openQuotes.slice(0, 3).map((q) => (
              <Link key={q.id} href={`/portal/client/quotes/${q.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-accent/30 bg-accent/5 p-4 transition-colors hover:border-accent/60">
                <div>
                  <p className="font-mono text-xs text-accent">{q.ref}</p>
                  <p className="mt-0.5 text-sm font-semibold">{q.mission ? `Mission ${q.mission.ref}` : "General estimate"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${q.total.toLocaleString()}</p>
                  <p className="text-xs text-accent">Review →</p>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {completed.length > 0 ? (
        <SectionCard title="Recently Completed" icon="history">
          <div className="space-y-2">
            {completed.map((m) => (
              <Link key={m.id} href={`/portal/client/trips/${m.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/40 px-4 py-3 text-sm hover:border-accent/40">
                <span className="font-mono text-xs text-muted-foreground">{m.ref}</span>
                <span className="font-medium">{formatRoute(m.departure_airport, m.arrival_airport)}</span>
                <StatusBadge label="Completed" tone="success" />
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </PortalShell>
  );
}
