import Link from "next/link";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import {
  EmptyState,
  FilterTabs,
  Notice,
  PageHeader,
  RecordRow,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { foreFlightConfigured } from "@/lib/foreflight/client";
import {
  currentOrNextPeriod,
  formatAltitudeBand,
  getTfrSyncStatus,
  listActiveTfrs,
  listOpenTfrConflicts,
  type StoredTfr,
} from "@/lib/portal/foreflight/queries";

export const metadata = { title: "Flight Intel - AMG Operations" };

const FILTERS = [
  { label: "All active", value: "" },
  { label: "Affecting missions", value: "conflicts" },
  { label: "Excluding stadium", value: "no_stadium" },
];

function periodLabel(tfr: StoredTfr): React.ReactNode {
  const period = currentOrNextPeriod(tfr.periods);
  if (!period) return <span className="text-[var(--deck-text-3)]">Continuous</span>;
  const nowSec = Math.floor(Date.now() / 1000);
  const live = period.start <= nowSec && (!period.end || period.end >= nowSec);
  return (
    <span className={live ? "font-medium text-[var(--deck-danger)]" : undefined}>
      {live ? "Active until " : "Begins "}
      <LocalTime value={new Date((live && period.end ? period.end : period.start) * 1000).toISOString()} />
    </span>
  );
}

/**
 * Flight Intelligence — the national TFR picture plus every mission the
 * current snapshot conflicts with. Data is refreshed by the tfr-sync cron;
 * this page only reads what that sweep stored.
 */
export default async function FlightIntelPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireRolePermission("admin", "flight_intel");
  const { view } = await searchParams;

  const configured = foreFlightConfigured();
  const [tfrs, conflicts, sync] = await Promise.all([
    listActiveTfrs().catch(() => []),
    listOpenTfrConflicts(50).catch(() => []),
    getTfrSyncStatus().catch(() => ({ lastSeenAt: null, activeCount: 0 })),
  ]);

  const conflictIdents = new Set(conflicts.map((conflict) => conflict.tfrIdent));
  const filtered =
    view === "conflicts"
      ? tfrs.filter((tfr) => conflictIdents.has(tfr.ident))
      : view === "no_stadium"
        ? tfrs.filter((tfr) => !tfr.stadiumTfr)
        : tfrs;

  const critical = conflicts.filter((conflict) => conflict.severity === "critical");
  const stadium = tfrs.filter((tfr) => tfr.stadiumTfr).length;

  return (
    <>
      <PageHeader
        eyebrow="AMG Operations"
        title="Flight Intel"
        description="Active US temporary flight restrictions from ForeFlight, and the missions they affect."
      />

      {!configured ? (
        <Notice tone="warn">
          ForeFlight is not configured. Set <code className="font-mono">FOREFLIGHT_API_KEY</code> in the
          environment to begin syncing TFRs — the board stays empty until then.
        </Notice>
      ) : null}

      {configured && !sync.lastSeenAt ? (
        <Notice tone="info">
          No TFR sync has completed yet. The board populates after the first run of the
          half-hourly <code className="font-mono">tfr-sync</code> cron.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active TFRs" icon="shield" value={sync.activeCount} detail="Currently published across the US." />
        <StatCard
          label="Missions Affected"
          icon="alert"
          value={conflicts.length}
          detail="Open, unacknowledged route or terminal conflicts."
          tone={conflicts.length ? "warn" : "default"}
        />
        <StatCard
          label="Critical"
          icon="alert"
          value={critical.length}
          detail="A restriction sits over a departure or arrival field."
          tone={critical.length ? "danger" : "default"}
        />
        <StatCard label="Stadium TFRs" icon="calendar" value={stadium} detail="Recurring event restrictions in the active set." />
      </div>

      {conflicts.length > 0 ? (
        <SectionCard
          title="Mission Conflicts"
          icon="alert"
          description="Ranked by severity. Terminal conflicts affect a departure or arrival airport directly."
        >
          <div className="space-y-2.5">
            {conflicts.slice(0, 12).map((conflict) => (
              <RecordRow
                key={conflict.id}
                href={`/portal/admin/trips/${conflict.missionId}`}
                refLabel={conflict.missionRef}
                title={`${conflict.departureAirport ?? "—"} → ${conflict.arrivalAirport ?? "—"}`}
                tone={conflict.severity === "critical" ? "danger" : "warn"}
                meta={conflict.detail ?? conflict.tfrIdent}
                trailing={
                  <>
                    <StatusBadge
                      label={conflict.severity}
                      tone={conflict.severity === "critical" ? "danger" : "warn"}
                    />
                    <span className="deck-mono text-[var(--deck-text-3)]">{conflict.conflictType}</span>
                  </>
                }
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Active TFRs"
        icon="shield"
        description="Full NOTAM text, altitude band, and active windows as published."
        actions={
          sync.lastSeenAt ? (
            <span className="deck-mono text-[var(--deck-text-3)]">
              Synced <LocalTime value={sync.lastSeenAt} />
            </span>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <FilterTabs basePath="/portal/admin/flight-intel" param="view" current={view} options={FILTERS} />
          {filtered.length === 0 ? (
            <EmptyState
              icon="shield"
              title={tfrs.length ? "No TFRs match this filter." : "No active TFRs recorded."}
              description={
                tfrs.length
                  ? "Clear the filter to see the full active set."
                  : "Either no restrictions are currently published, or the sync has not run yet."
              }
            />
          ) : (
            <DataTable<StoredTfr>
              rows={filtered}
              getKey={(row) => row.ident}
              columns={[
                {
                  header: "TFR",
                  cell: (row) => (
                    <span className="deck-mono text-[var(--deck-accent-ink)]">{row.ident}</span>
                  ),
                  priority: "primary",
                },
                {
                  header: "Description",
                  cell: (row) => (
                    <span className="line-clamp-2">{row.label ?? row.tfrType ?? "—"}</span>
                  ),
                  priority: "secondary",
                },
                { header: "Type", cell: (row) => row.tfrType ?? "—", hideOnMobile: true },
                { header: "Altitude", cell: (row) => formatAltitudeBand(row) },
                { header: "Window", cell: (row) => periodLabel(row) },
                { header: "ARTCC", cell: (row) => row.artccIdent ?? row.artcc ?? "—", hideOnMobile: true },
                {
                  header: "Flags",
                  cell: (row) =>
                    conflictIdents.has(row.ident) ? (
                      <StatusBadge label="Affects mission" tone="danger" />
                    ) : row.stadiumTfr ? (
                      <StatusBadge label="Stadium" tone="neutral" />
                    ) : (
                      <span className="text-[var(--deck-text-3)]">—</span>
                    ),
                },
                {
                  header: "",
                  cell: (row) => (
                    <Link
                      href={`/portal/admin/flight-intel/${encodeURIComponent(row.ident)}`}
                      className="font-semibold text-[var(--deck-accent-ink)] hover:underline"
                    >
                      Detail
                    </Link>
                  ),
                },
              ]}
            />
          )}
        </div>
      </SectionCard>
    </>
  );
}
