import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DataTable } from "@/components/portal/ui/data-table";
import {
  DetailRow,
  EmptyState,
  Notice,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import { getAirportDetail, type AirportRunway } from "@/lib/portal/airports";
import { getAirportFleetSuitability } from "@/lib/portal/foreflight/suitability-queries";
import {
  SUITABILITY_DISCLAIMER,
  SUITABILITY_LABEL,
  SUITABILITY_TONE,
} from "@/lib/portal/foreflight/runway-suitability";

export const metadata = { title: "Airport - AMG Operations" };

function ft(value: number | null): string {
  return value === null ? "—" : `${Math.round(value).toLocaleString("en-US")} ft`;
}

function runwayLabel(runway: AirportRunway): string {
  const ends = runway.runwayIdentifiers.map((r) => r.runway_identifier).filter(Boolean);
  return ends.length ? ends.join(" / ") : runway.runwaySurfaceIdentifier;
}

export default async function AirportDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await requireRolePermission("admin", "flight_intel");
  const { code } = await params;
  const airport = await getAirportDetail(decodeURIComponent(code));
  if (!airport) notFound();

  const fleet = await getAirportFleetSuitability(airport.code).catch(() => []);
  const longest = airport.runways.reduce<number | null>(
    (best, runway) => (runway.lengthFt !== null && (best === null || runway.lengthFt > best) ? runway.lengthFt : best),
    null
  );
  const paved = airport.runways.some((r) => /asph|concrete|paved|bitum/i.test(r.surfaceType ?? ""));
  const notSynced = airport.dataSource !== "foreflight";

  return (
    <>
      <PageHeader
        eyebrow="Flight Intel"
        title={`${airport.code} — ${airport.name}`}
        description={[airport.city, airport.state, airport.country].filter(Boolean).join(", ")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/admin/flight-intel">Flight Intel</Link>
          </Button>
        }
      />

      {notSynced ? (
        <Notice tone="info">
          This field has not been covered by an aerodrome sync yet, so runway and helipad data
          may be missing. Coordinates and identifiers come from the base airport directory.
        </Notice>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Longest Runway" icon="planeTakeoff" value={ft(longest)} detail={`${airport.runways.length} runway surface${airport.runways.length === 1 ? "" : "s"} on file.`} />
        <StatCard label="Surface" icon="settings" value={paved ? "Paved" : airport.runways.length ? "Unpaved" : "—"} detail={airport.runways[0]?.surfaceType ?? "No surface data."} />
        <StatCard label="Helipads" icon="mapPin" value={airport.helipads.length} detail="Published helipad surfaces." />
        <StatCard label="Elevation" icon="trendingUp" value={airport.elevationFt === null ? "—" : ft(airport.elevationFt)} detail="Field elevation above sea level." />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <SectionCard title="Runways" icon="planeTakeoff">
            {airport.runways.length === 0 ? (
              <EmptyState
                icon="planeTakeoff"
                title="No runway data on file."
                description="Runway geometry arrives with the weekly aerodrome sync. Until then, suitability cannot be evaluated for this field."
              />
            ) : (
              <DataTable<AirportRunway>
                rows={airport.runways}
                getKey={(row) => row.runwaySurfaceIdentifier}
                columns={[
                  {
                    header: "Runway",
                    cell: (row) => <span className="deck-mono text-[var(--deck-accent-ink)]">{runwayLabel(row)}</span>,
                    priority: "primary",
                  },
                  { header: "Length", cell: (row) => ft(row.lengthFt), align: "right", priority: "secondary" },
                  { header: "Width", cell: (row) => ft(row.widthFt), align: "right" },
                  { header: "Surface", cell: (row) => row.surfaceType ?? "—" },
                  {
                    header: "Displaced Threshold",
                    cell: (row) => {
                      const displaced = row.runwayIdentifiers
                        .filter((r) => (r.threshold_displacement ?? 0) > 0)
                        .map((r) => `${r.runway_identifier}: ${Math.round(r.threshold_displacement!)} ft`);
                      return displaced.length ? displaced.join(", ") : "—";
                    },
                    hideOnMobile: true,
                  },
                ]}
              />
            )}
          </SectionCard>

          <SectionCard
            title="Fleet Suitability"
            icon="shield"
            description={SUITABILITY_DISCLAIMER}
          >
            {fleet.length === 0 ? (
              <p className="text-sm text-[var(--deck-text-3)]">No aircraft minimums are configured.</p>
            ) : (
              <div className="space-y-2">
                {fleet.map(({ minimums, result }) => (
                  <div
                    key={minimums.typeCode}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--deck-line)] pb-2.5 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--deck-text)]">{minimums.displayName}</p>
                      <p className="text-xs text-[var(--deck-text-3)]">
                        Advisory minimum {ft(minimums.minRunwayFt)}
                      </p>
                    </div>
                    <StatusBadge
                      label={SUITABILITY_LABEL[result.verdict]}
                      tone={SUITABILITY_TONE[result.verdict]}
                    />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {airport.helipads.length > 0 ? (
            <SectionCard title="Helipads" icon="mapPin">
              <div className="space-y-2">
                {airport.helipads.map((helipad) => (
                  <div
                    key={helipad.helipadIdentifier}
                    className="flex items-center justify-between gap-4 border-b border-[var(--deck-line)] pb-2 last:border-0"
                  >
                    <span className="deck-mono text-[var(--deck-text)]">{helipad.helipadIdentifier}</span>
                    <span className="text-sm text-[var(--deck-text-3)]">{helipad.surfaceType ?? "—"}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-5">
          <SectionCard title="Identification" icon="building">
            <dl>
              {/* `code` is the canonical identifier — ICAO for US fields. */}
              <DetailRow label="Code">
                <span className="deck-mono">{airport.code}</span>
              </DetailRow>
              <DetailRow label="IATA">{airport.iata ?? "—"}</DetailRow>
              <DetailRow label="Country">{airport.country ?? "—"}</DetailRow>
              <DetailRow label="Coordinates">
                <span className="deck-mono text-xs">
                  {airport.latitude.toFixed(4)}, {airport.longitude.toFixed(4)}
                </span>
              </DetailRow>
              <DetailRow label="Verified">{airport.verifiedStatus ?? "—"}</DetailRow>
            </dl>
          </SectionCard>

          {airport.contactDetails ? (
            <SectionCard title="Contact" icon="users">
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--deck-text-2)]">
                {airport.contactDetails}
              </p>
            </SectionCard>
          ) : null}

          <SectionCard title="Data Source" icon="history">
            <dl>
              <DetailRow label="Source">{airport.dataSource === "foreflight" ? "ForeFlight" : "Base directory"}</DetailRow>
              <DetailRow label="Last synced">
                {airport.foreflightSyncedAt ? <LocalTime value={airport.foreflightSyncedAt} /> : "Never"}
              </DetailRow>
            </dl>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
