import Link from "next/link";
import { requireRole } from "@/lib/portal/session";
import { ProfileSetupNotice } from "@/components/portal/profile-setup-notice";
import {
  EmptyState,
  PageHeader,
  QuickLink,
  RecordRow,
  SectionCard,
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
  const dueSoon = open
    .filter(
      (a) =>
        a.required_datetime &&
        new Date(a.required_datetime).getTime() > Date.now() &&
        new Date(a.required_datetime).getTime() < Date.now() + 14 * 86_400_000
    )
    .sort((a, b) => String(a.required_datetime).localeCompare(String(b.required_datetime)))
    .slice(0, 4);

  return (
    <>
      <ProfileSetupNotice userId={user.id} role={user.role} />
      <PageHeader
        eyebrow={profile?.partner_type ?? "Service Partner"}
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={
          awaitingQuote.length > 0
            ? `${awaitingQuote.length} service request${awaitingQuote.length === 1 ? "" : "s"} awaiting your response.`
            : "AMG service requests, quotes, documents, and communication for your assigned work."
        }
      />


      {awaitingQuote.length > 0 ? (
        <SectionCard
          title="Awaiting Your Response"
          icon="alert"
          description="Accept, decline, or submit a quote for newly assigned work."
        >
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
                    <span className="text-xs font-semibold text-[var(--deck-accent-ink)]">
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

      {dueSoon.length > 0 ? (
        <SectionCard
          title="Upcoming Due Dates"
          icon="calendar"
          description="Assigned work with a required date inside the next 14 days."
        >
          <div className="space-y-3">
            {dueSoon.map((item) => (
              <RecordRow
                key={item.id}
                href={`/portal/partner/requests/${item.id}`}
                refLabel={item.ref}
                title={item.service_type}
                meta={<>{item.location ?? "Location TBD"} · Required {formatDateTime(item.required_datetime)}</>}
                tone="warn"
                trailing={
                  <StatusBadge
                    label={PARTNER_STATUS_LABEL[item.status] ?? item.status}
                    tone={toneFor(PARTNER_STATUS_TONE, item.status)}
                  />
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Your Workspace" icon="building" bodyClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink href="/portal/partner/invoices" icon="wallet" label="Invoices" description="Bill AMG for completed work" />
        <QuickLink href="/portal/partner/documents?upload=1" icon="upload" label="Documents" description={docs.length > 0 ? `${docs.length} on file` : "Upload supporting files"} />
        <QuickLink href="/portal/partner/messages?new=1" icon="messageSquare" label="Message AMG" description={unread > 0 ? `${unread} unread` : "Task-scoped threads"} />
        <QuickLink href="/portal/partner/profile" icon="building" label="Company Profile" description={profile?.partner_type ?? "Complete your service profile"} />
      </SectionCard>
    </>
  );
}
