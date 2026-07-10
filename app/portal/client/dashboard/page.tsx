import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { ProfileSetupNotice } from "@/components/portal/profile-setup-notice";
import {
  EmptyState,
  Notice,
  PageHeader,
  RecordRow,
  SectionCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { StatusDot } from "@/components/portal/ui/status-dot";
import { Button } from "@/components/ui/button";
import {
  listAircraftForClient,
  listDocumentsForUser,
  listInvoicesForClient,
  listMissionsForClient,
  listQuotesForClient,
  listSubscriptionsForClient,
} from "@/lib/portal/queries";
import { listPassengersForOwner } from "@/lib/portal/passengers";
import {
  CLIENT_MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatMoney, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Home - Client Portal" };

const ACTIVE_STATUSES = [
  "submitted",
  "under_review",
  "awaiting_client_info",
  "quoted",
  "approved",
  "crew_assigned",
  "scheduled",
  "in_progress",
];

/**
 * Client home. Leads with what the owner needs to do — respond to an
 * information request, review a quote, settle an invoice — then what AMG is
 * supporting next, then current request state. One primary action: New
 * Support Request (also persistent in the shell).
 */
export default async function ClientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;

  const [missions, aircraft, quotes, subscriptions, invoices, passengers, documents] =
    await Promise.all([
      listMissionsForClient(user.id),
      listAircraftForClient(user.id),
      listQuotesForClient(user.id),
      listSubscriptionsForClient(user.id),
      listInvoicesForClient(user.id),
      listPassengersForOwner(user.id),
      listDocumentsForUser({ userId: user.id, role: "client" }),
    ]);

  const active = missions.filter((m) => ACTIVE_STATUSES.includes(m.status));
  const awaitingInfo = missions.filter((m) => m.status === "awaiting_client_info");
  const openQuotes = quotes.filter((q) => ["sent", "viewed"].includes(q.status));
  const dueInvoices = invoices.filter((invoice) =>
    ["sent", "viewed", "partially_paid", "overdue"].includes(invoice.status)
  );
  const balanceDue = dueInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount_due ?? 0),
    0
  );
  const activeSubscriptions = subscriptions.filter((subscription) =>
    ["active", "renewal_pending"].includes(subscription.status)
  );
  const nextDeparture = missions
    .filter(
      (m) =>
        ["approved", "crew_assigned", "scheduled", "in_progress"].includes(m.status) &&
        m.requested_departure &&
        new Date(m.requested_departure) > new Date()
    )
    .sort((a, b) => String(a.requested_departure).localeCompare(String(b.requested_departure)))[0];
  const daysToDeparture = nextDeparture?.requested_departure
    ? Math.max(0, Math.ceil((new Date(nextDeparture.requested_departure).getTime() - Date.now()) / 86_400_000))
    : null;

  const actionCount = awaitingInfo.length + openQuotes.length + (balanceDue > 0 ? 1 : 0);

  return (
    <>
      <ProfileSetupNotice userId={user.id} role={user.role} />
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
        description={
          actionCount > 0
            ? `${actionCount} item${actionCount === 1 ? "" : "s"} need${actionCount === 1 ? "s" : ""} your attention.`
            : "Nothing needs your attention right now."
        }
        actions={
          <Button asChild size="sm">
            <Link href="/portal/client/trips/new">New Support Request</Link>
          </Button>
        }
      />

      {/* First-run checklist for new accounts */}
      {missions.length === 0 ? (
        <SectionCard
          title="Getting Started"
          icon="sparkles"
          description="Three steps and AMG Operations has everything needed to support your first trip."
        >
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              {
                done: passengers.length > 0,
                href: "/portal/client/passengers",
                title: "Save your passengers",
                body: "Add the people who fly with you so manifests are one tap on every request.",
              },
              {
                done: documents.length > 0,
                href: "/portal/client/documents",
                title: "Upload key documents",
                body: "Insurance, registration, or operating preferences give AMG a head start.",
              },
              {
                done: false,
                href: "/portal/client/trips/new",
                title: "Submit your first request",
                body: "Trip, ferry, maintenance reposition, or crew support — AMG reviews every detail.",
              },
            ].map((step, index) => (
              <Link
                key={step.href}
                href={step.href}
                className={`deck-inset deck-card-hover block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)] ${step.done ? "opacity-70" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`deck-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      step.done
                        ? "bg-[var(--deck-success-tint)] text-[var(--deck-success)]"
                        : "bg-[var(--deck-accent-tint)] text-[var(--deck-accent-ink)]"
                    }`}
                  >
                    {step.done ? "✓" : index + 1}
                  </span>
                  <p className="text-sm font-semibold text-[var(--deck-text)]">{step.title}</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--deck-text-3)]">{step.body}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* 1 — What needs the owner's action */}
      <SectionCard
        title="Needs Your Action"
        icon="alert"
        description="Requests waiting on you, quotes to review, and balances due."
      >
        {actionCount === 0 ? (
          <div className="flex items-center gap-2 py-1">
            <StatusDot tone="success" label="All caught up" pulse />
          </div>
        ) : (
          <div className="space-y-2.5">
            {awaitingInfo.map((m) => (
              <RecordRow
                key={m.id}
                href={`/portal/client/trips/${m.id}`}
                refLabel={m.ref}
                title={formatRoute(m.departure_airport, m.arrival_airport)}
                tone="warn"
                meta={
                  <>
                    <span className="font-medium text-[var(--deck-text-2)]">
                      AMG needs more information to keep this request moving
                    </span>
                    {" · "}
                    {formatDateTime(m.requested_departure)}
                  </>
                }
                trailing={<StatusBadge label="Respond" tone="warn" />}
              />
            ))}
            {openQuotes.map((q) => (
              <RecordRow
                key={q.id}
                href={`/portal/client/quotes/${q.id}`}
                refLabel={q.ref}
                title={q.mission ? `Quote for ${q.mission.ref}` : "Quote for your review"}
                tone="gold"
                meta={
                  <span className="font-medium text-[var(--deck-text-2)]">
                    Review and approve or request changes
                  </span>
                }
                trailing={
                  <span className="deck-num text-sm font-bold text-[var(--deck-text)]">
                    {formatMoney(q.total)}
                  </span>
                }
              />
            ))}
            {balanceDue > 0 ? (
              <RecordRow
                href="/portal/client/billing"
                title={`Balance due: ${formatMoney(balanceDue)}`}
                tone="warn"
                meta={
                  <span className="font-medium text-[var(--deck-text-2)]">
                    {dueInvoices.length} open invoice{dueInvoices.length === 1 ? "" : "s"} in Billing
                  </span>
                }
                trailing={<StatusBadge label="Pay" tone="warn" />}
              />
            ) : null}
          </div>
        )}
      </SectionCard>

      {/* 2 — Next supported mission */}
      {nextDeparture ? (
        <Link
          href={`/portal/client/trips/${nextDeparture.id}`}
          className="deck-card deck-card-hover deck-chrome-surface block overflow-hidden p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--deck-accent)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="deck-eyebrow-chrome">Next Departure</p>
              <p className="deck-num mt-2 text-3xl font-bold text-[var(--deck-chrome-text)]">
                {nextDeparture.departure_airport} → {nextDeparture.arrival_airport}
              </p>
              <p className="mt-2 text-sm text-[var(--deck-chrome-muted)]">
                {nextDeparture.tail_number ?? "Aircraft TBD"} ·{" "}
                {formatDateTime(nextDeparture.requested_departure)} ·{" "}
                {CLIENT_MISSION_STATUS_LABEL[nextDeparture.status] ?? nextDeparture.status}
              </p>
            </div>
            <div className="text-right">
              <p className="deck-num text-5xl font-bold text-[var(--deck-chrome-accent)]">{daysToDeparture}</p>
              <p className="deck-eyebrow-chrome mt-1">
                day{daysToDeparture === 1 ? "" : "s"} out
              </p>
            </div>
          </div>
        </Link>
      ) : null}

      {/* 3 — Current request state */}
      <SectionCard
        title="Your Support Requests"
        icon="plane"
        actions={
          <Button asChild size="sm" variant="ghost">
            <Link href="/portal/client/trips">View all</Link>
          </Button>
        }
      >
        {active.length === 0 ? (
          <EmptyState
            icon="plane"
            title="No active requests"
            description="Submit a support request and AMG Operations takes it from there."
            action={
              <Button asChild size="sm">
                <Link href="/portal/client/trips/new">New Support Request</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {active.slice(0, 5).map((m) => (
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
                    label={CLIENT_MISSION_STATUS_LABEL[m.status] ?? m.status}
                    tone={toneFor(MISSION_STATUS_TONE, m.status)}
                  />
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* 4 — Standing context: aircraft + subscription */}
      <div className="grid gap-5 xl:grid-cols-2">
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
              description="Add your aircraft so requests start with the right context."
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

        <SectionCard
          title="Subscription"
          icon="creditCard"
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link href="/portal/client/subscriptions">View all</Link>
            </Button>
          }
        >
          {activeSubscriptions.length === 0 ? (
            <p className="text-sm text-[var(--deck-text-3)]">
              No active support subscription on this account.
            </p>
          ) : (
            <div className="space-y-3">
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
                    <span className="text-xs font-semibold text-[var(--deck-accent-ink)]">
                      Renews {subscription.renewal_date ?? "TBD"}
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
