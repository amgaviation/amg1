import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/portal/session";
import { PortalShell } from "@/components/portal/shell/portal-shell";
import { PageHeader, SectionCard, EmptyState, Notice } from "@/components/portal/ui/primitives";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { listMissionsForClient } from "@/lib/portal/queries";
import { MISSION_STATUS_LABEL, MISSION_STATUS_TONE, MISSION_TYPE_LABEL, URGENCY_LABEL, URGENCY_TONE, toneFor } from "@/lib/portal/constants";
import { formatRoute, formatDateTime } from "@/lib/portal/format";

export const metadata = { title: "Trip Requests — Client Portal" };

export default async function ClientTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; status?: string }>;
}) {
  const user = await requireRole("client");
  const params = await searchParams;
  const missions = await listMissionsForClient(user.id);
  const filtered = params.status ? missions.filter((m) => m.status === params.status) : missions;

  return (
    <PortalShell role="client" user={user}>
      {params.success === "cancelled" ? <Notice tone="success">Trip request cancelled.</Notice> : null}

      <PageHeader
        eyebrow="Owner Services"
        title="Trip Requests"
        description="All support requests associated with your aircraft and account."
        actions={
          <Button asChild className="rounded-full">
            <Link href="/portal/client/trips/new">
              <Plus className="h-4 w-4" /> New Request
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "" },
          { label: "Active", value: "submitted" },
          { label: "Under Review", value: "under_review" },
          { label: "Quoted", value: "quoted" },
          { label: "Approved", value: "approved" },
          { label: "Scheduled", value: "scheduled" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ].map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/portal/client/trips?status=${f.value}` : "/portal/client/trips"}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              params.status === f.value || (!params.status && !f.value)
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground hover:border-accent/40"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <SectionCard>
        {filtered.length === 0 ? (
          <EmptyState
            icon="plane"
            title="No trip requests"
            description="Submit a request and AMG Operations will coordinate everything."
            action={<Button asChild><Link href="/portal/client/trips/new"><Plus className="h-4 w-4" /> New Request</Link></Button>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <Link
                key={m.id}
                href={`/portal/client/trips/${m.id}`}
                className="grid gap-4 rounded-lg border border-border bg-background/50 p-4 transition-colors hover:border-accent/60 sm:grid-cols-[1fr_auto]"
              >
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-accent">{m.ref}</span>
                    <span className="text-xs text-muted-foreground">{MISSION_TYPE_LABEL[m.mission_type] ?? m.mission_type}</span>
                    {m.urgency !== "standard" ? (
                      <StatusBadge label={URGENCY_LABEL[m.urgency] ?? m.urgency} tone={toneFor(URGENCY_TONE, m.urgency)} />
                    ) : null}
                  </div>
                  <p className="font-semibold">{formatRoute(m.departure_airport, m.arrival_airport)}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.tail_number ?? "Aircraft TBD"} · {formatDateTime(m.requested_departure)} · {m.passenger_count} pax
                  </p>
                </div>
                <div className="flex items-start">
                  <StatusBadge label={MISSION_STATUS_LABEL[m.status] ?? m.status} tone={toneFor(MISSION_STATUS_TONE, m.status)} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PortalShell>
  );
}
