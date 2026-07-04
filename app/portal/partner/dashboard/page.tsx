import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import {
  EmptyState,
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
  getPartnerProfile,
  listDocumentsForUser,
  listPartnerAssignments,
} from "@/lib/portal/queries";
import { PARTNER_STATUS_LABEL, PARTNER_STATUS_TONE, toneFor } from "@/lib/portal/constants";
import { formatDateTime, formatMoney } from "@/lib/portal/format";

export const metadata = { title: "Dashboard - Partner Portal" };

export default async function PartnerDashboardPage() {
  const user = await requireRole("partner");
  const [assignments, profile, docs, unread] = await Promise.all([
    listPartnerAssignments(user.id),
    getPartnerProfile(user.id),
    listDocumentsForUser({ userId: user.id, role: user.role }),
    countUnread(user.id),
  ]);
  const open = assignments.filter((a) =>
    ["assigned", "accepted", "quoted", "in_progress"].includes(a.status)
  );
  const awaitingQuote = assignments.filter((a) => a.status === "assigned");
  const completed = assignments.filter((a) => a.status === "completed");
  const completedValue = completed.reduce((sum, a) => sum + Number(a.quote_amount ?? 0), 0);
  const openValue = open.reduce((sum, a) => sum + Number(a.quote_amount ?? 0), 0);

  return (
    <PortalShell role="partner" user={user} unread={unread}>
      <PageHeader
        eyebrow={profile?.partner_type ?? "Service Partner"}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="AMG service requests, quotes, supporting documents, and operations communication for brokers, vendors, and facility partners."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Open requests"
          value={open.length}
          icon="clipboard"
          href="/portal/partner/requests"
          tone={open.length ? "accent" : "default"}
          detail={openValue > 0 ? `${formatMoney(openValue)} quoted` : undefined}
        />
        <StatCard
          label="Completed work"
          value={completed.length}
          icon="check"
          detail={completedValue > 0 ? `${formatMoney(completedValue)} lifetime` : "AMG-confirmed jobs"}
        />
        <StatCard label="Documents" value={docs.length} icon="fileText" href="/portal/partner/documents" />
        <StatCard
          label="Unread messages"
          value={unread}
          icon="messageSquare"
          href="/portal/partner/messages"
          tone={unread ? "warn" : "default"}
        />
        <StatCard
          label="Company profile"
          value={profile ? "Live" : "Setup"}
          icon="building"
          href="/portal/partner/profile"
          detail={profile?.partner_type ?? "Complete your service profile"}
        />
      </div>

      {awaitingQuote.length > 0 ? (
        <SectionCard title="Awaiting Your Response" icon="alert">
          <div className="space-y-3">
            {awaitingQuote.slice(0, 4).map((item) => (
              <RecordRow
                key={item.id}
                href={`/portal/partner/requests/${item.id}`}
                refLabel={item.ref}
                title={item.service_type}
                meta={
                  <>
                    {item.location ?? "Location TBD"} · Required{" "}
                    {formatDateTime(item.required_datetime)}
                  </>
                }
                tone="warn"
                trailing={
                  <>
                    <StatusBadge label="Assigned" tone="warn" />
                    <span className="text-xs font-semibold text-[var(--deck-gold-deep)]">
                      Respond →
                    </span>
                  </>
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Quick Actions"
        icon="zap"
        bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <QuickLink href="/portal/partner/requests" icon="clipboard" label="Review Requests" />
        <QuickLink href="/portal/partner/profile" icon="building" label="Update Profile" />
        <QuickLink href="/portal/partner/documents?upload=1" icon="upload" label="Upload Document" />
        <QuickLink href="/portal/partner/messages?new=1" icon="messageSquare" label="Message AMG" />
      </SectionCard>

      <SectionCard
        title="Active Service Requests"
        icon="clipboard"
        actions={
          <Button asChild size="sm" variant="ghost">
            <Link href="/portal/partner/requests">View all</Link>
          </Button>
        }
      >
        {open.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No active requests"
            description="New AMG service tasks will appear here when assigned."
          />
        ) : (
          <div className="space-y-3">
            {open.slice(0, 6).map((item) => (
              <RecordRow
                key={item.id}
                href={`/portal/partner/requests/${item.id}`}
                refLabel={item.ref}
                title={`${item.service_type} — ${item.mission?.ref ?? "Mission TBD"}`}
                meta={
                  <>
                    {item.location ?? "Location TBD"} · {formatDateTime(item.created_at)}
                    {item.quote_amount ? <> · Quote {formatMoney(item.quote_amount)}</> : null}
                  </>
                }
                trailing={
                  <StatusBadge
                    label={PARTNER_STATUS_LABEL[item.status] ?? item.status}
                    tone={toneFor(PARTNER_STATUS_TONE, item.status)}
                  />
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
