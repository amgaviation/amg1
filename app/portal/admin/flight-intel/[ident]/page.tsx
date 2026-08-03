import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRolePermission } from "@/lib/portal/permissions";
import { DetailRow, PageHeader, RecordRow, SectionCard } from "@/components/portal/ui/primitives";
import { LocalTime } from "@/components/portal/ui/local-time";
import { StatusBadge } from "@/components/portal/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  formatAltitudeBand,
  listActiveTfrs,
  listOpenTfrConflicts,
} from "@/lib/portal/foreflight/queries";

export const metadata = { title: "TFR Detail - AMG Operations" };

/**
 * One TFR in full: the published NOTAM text verbatim, its altitude band and
 * active windows, coordinator contact, and every mission it currently
 * conflicts with.
 */
export default async function TfrDetailPage({
  params,
}: {
  params: Promise<{ ident: string }>;
}) {
  await requireRolePermission("admin", "flight_intel");
  const { ident } = await params;
  const decoded = decodeURIComponent(ident);

  const [tfrs, conflicts] = await Promise.all([
    listActiveTfrs().catch(() => []),
    listOpenTfrConflicts(100).catch(() => []),
  ]);

  const tfr = tfrs.find((row) => row.ident === decoded);
  if (!tfr) notFound();

  const affected = conflicts.filter((conflict) => conflict.tfrIdent === decoded);

  return (
    <>
      <PageHeader
        eyebrow="Flight Intel"
        title={tfr.label ?? tfr.ident}
        description={tfr.tfrType ? `${tfr.tfrType} restriction` : "Temporary flight restriction"}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/admin/flight-intel">Back to board</Link>
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <SectionCard title="NOTAM Text" icon="fileText" description="As published, verbatim.">
            <pre className="deck-inset overflow-x-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-[var(--deck-text-2)]">
              {tfr.notamText?.trim() || "No NOTAM text was published for this restriction."}
            </pre>
          </SectionCard>

          {affected.length > 0 ? (
            <SectionCard
              title="Affected Missions"
              icon="alert"
              description="Missions whose route or endpoints intersect this restriction."
            >
              <div className="space-y-2.5">
                {affected.map((conflict) => (
                  <RecordRow
                    key={conflict.id}
                    href={`/portal/admin/trips/${conflict.missionId}`}
                    refLabel={conflict.missionRef}
                    title={`${conflict.departureAirport ?? "—"} → ${conflict.arrivalAirport ?? "—"}`}
                    tone={conflict.severity === "critical" ? "danger" : "warn"}
                    meta={conflict.detail ?? undefined}
                    trailing={
                      <StatusBadge
                        label={conflict.severity}
                        tone={conflict.severity === "critical" ? "danger" : "warn"}
                      />
                    }
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Active Windows" icon="calendar">
            {tfr.periods.length === 0 ? (
              <p className="text-sm text-[var(--deck-text-3)]">
                No discrete windows published — treat the restriction as continuously active.
              </p>
            ) : (
              <ol className="space-y-2">
                {tfr.periods.map((period, index) => (
                  <li
                    key={index}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--deck-line)] pb-2 last:border-0"
                  >
                    <span className="text-sm text-[var(--deck-text)]">
                      <LocalTime value={new Date(period.start * 1000).toISOString()} showZone />
                    </span>
                    <span className="deck-mono text-[var(--deck-text-3)]">
                      {period.end ? (
                        <>
                          until <LocalTime value={new Date(period.end * 1000).toISOString()} showZone />
                        </>
                      ) : (
                        "no published end"
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Restriction" icon="shield">
            <dl>
              <DetailRow label="Identifier">
                <span className="deck-mono">{tfr.ident}</span>
              </DetailRow>
              <DetailRow label="Altitude">{formatAltitudeBand(tfr)}</DetailRow>
              <DetailRow label="Type">{tfr.tfrType ?? "—"}</DetailRow>
              <DetailRow label="Stadium TFR">{tfr.stadiumTfr ? "Yes" : "No"}</DetailRow>
              <DetailRow label="ARTCC">{tfr.artccIdent ?? tfr.artcc ?? "—"}</DetailRow>
              <DetailRow label="Locale">{tfr.locale ?? "—"}</DetailRow>
              <DetailRow label="Issued">
                {tfr.dateIssued ? <LocalTime value={tfr.dateIssued} /> : "—"}
              </DetailRow>
              <DetailRow label="Last updated">
                {tfr.lastUpdatedAt ? <LocalTime value={tfr.lastUpdatedAt} /> : "—"}
              </DetailRow>
              <DetailRow label="Source">{tfr.source ?? "—"}</DetailRow>
            </dl>
          </SectionCard>

          {tfr.contactName || tfr.contactInformation ? (
            <SectionCard title="Coordinator" icon="users">
              <dl>
                <DetailRow label="Name">{tfr.contactName ?? "—"}</DetailRow>
                <DetailRow label="Contact">{tfr.contactInformation ?? "—"}</DetailRow>
                <DetailRow label="Type">{tfr.coordinatorType ?? "—"}</DetailRow>
              </dl>
            </SectionCard>
          ) : null}

          <SectionCard title="Sync" icon="history">
            <dl>
              <DetailRow label="First seen">
                <LocalTime value={tfr.firstSeenAt} />
              </DetailRow>
              <DetailRow label="Last seen">
                <LocalTime value={tfr.lastSeenAt} />
              </DetailRow>
            </dl>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
