import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import {
  EmptyState,
  FilterTabs,
  Notice,
  PageHeader,
  RecordRow,
  SectionCard,
} from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { listMissionsForClient } from "@/lib/portal/queries";
import {
  MISSION_STATUS_LABEL,
  MISSION_STATUS_TONE,
  MISSION_TYPE_LABEL,
  URGENCY_LABEL,
  URGENCY_TONE,
  toneFor,
} from "@/lib/portal/constants";
import { formatDateTime, formatRoute } from "@/lib/portal/format";

export const metadata = { title: "Support Requests - Client Portal" };

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Quoted", value: "quoted" },
  { label: "Approved", value: "approved" },
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function ClientTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; status?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const missions = await listMissionsForClient(user.id);
  const filtered = params.status
    ? missions.filter((m) => m.status === params.status)
    : missions;

  return (
    <PortalShell role="client" user={user}>
      {params.success === "cancelled" ? (
        <Notice tone="success">Support request cancelled.</Notice>
      ) : null}

      <PageHeader
        eyebrow="Owner Services"
        title="Support Requests"
        description="All support requests associated with your aircraft and account."
        actions={
          <Button asChild>
            <Link href="/portal/client/trips/new">
              <Plus className="h-4 w-4" /> New Request
            </Link>
          </Button>
        }
      />

      <FilterTabs
        basePath="/portal/client/trips"
        current={params.status}
        options={STATUS_FILTERS}
      />

      <SectionCard>
        {filtered.length === 0 ? (
          <EmptyState
            icon="plane"
            title="No support requests"
            description="Submit a support request and AMG Operations will review the scope, aircraft context, crew availability, and operational conditions."
            action={
              <Button asChild>
                <Link href="/portal/client/trips/new">
                  <Plus className="h-4 w-4" /> New Support Request
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <RecordRow
                key={m.id}
                href={`/portal/client/trips/${m.id}`}
                refLabel={m.ref}
                title={formatRoute(m.departure_airport, m.arrival_airport)}
                meta={
                  <>
                    {MISSION_TYPE_LABEL[m.mission_type] ?? m.mission_type} ·{" "}
                    {m.tail_number ?? "Aircraft TBD"} ·{" "}
                    {formatDateTime(m.requested_departure)} · {m.passenger_count} pax
                  </>
                }
                trailing={
                  <>
                    <StatusBadge
                      label={MISSION_STATUS_LABEL[m.status] ?? m.status}
                      tone={toneFor(MISSION_STATUS_TONE, m.status)}
                    />
                    {m.urgency !== "standard" ? (
                      <StatusBadge
                        label={URGENCY_LABEL[m.urgency] ?? m.urgency}
                        tone={toneFor(URGENCY_TONE, m.urgency)}
                      />
                    ) : null}
                  </>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
