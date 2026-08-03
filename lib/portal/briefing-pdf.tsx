import "server-only";

import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { PDF_COLORS, logoDataUri } from "@/lib/portal/pdf-shared";
import { SUITABILITY_DISCLAIMER, SUITABILITY_LABEL } from "@/lib/portal/foreflight/runway-suitability";
import type { RouteBriefing } from "@/lib/portal/foreflight/route-briefing";

/**
 * Route briefing PDF.
 *
 * Structured for the order an operator actually reads before a trip:
 * restrictions first (they can stop the flight), then the fields and their
 * suitability, then airspace and obstacles as context, then who is flying it.
 *
 * Unlike the billing documents, the footer uses @react-pdf's `fixed` prop with
 * a page-number render function — a briefing runs to several pages and an
 * absolutely-positioned footer would print only on the last one.
 */

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 56,
    fontSize: 9.5,
    color: PDF_COLORS.text,
    fontFamily: "Helvetica",
    lineHeight: 1.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: `1 solid ${PDF_COLORS.rule}`,
    paddingBottom: 16,
    marginBottom: 18,
  },
  logo: { width: 130, height: 40, objectFit: "contain" },
  brandFallback: { fontSize: 16, fontWeight: 700, color: PDF_COLORS.heading },
  docTitle: { fontSize: 21, fontWeight: 700, textAlign: "right", color: PDF_COLORS.heading },
  docMeta: { marginTop: 6, textAlign: "right", color: PDF_COLORS.muted, fontSize: 9 },
  routeLine: { fontSize: 15, fontWeight: 700, color: PDF_COLORS.heading, marginBottom: 2 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: PDF_COLORS.mutedLight,
    borderBottom: `1 solid ${PDF_COLORS.rule}`,
    paddingBottom: 5,
    marginBottom: 8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "50%", marginBottom: 5, paddingRight: 10 },
  label: { color: PDF_COLORS.mutedLight, fontSize: 8 },
  value: { color: PDF_COLORS.text },
  strong: { fontWeight: 700 },
  muted: { color: PDF_COLORS.muted },
  alert: {
    borderLeft: `3 solid ${PDF_COLORS.danger}`,
    backgroundColor: "#fdf3f2",
    padding: 9,
    marginBottom: 7,
  },
  alertWarn: {
    borderLeft: `3 solid ${PDF_COLORS.warn}`,
    backgroundColor: "#fdf8ee",
    padding: 9,
    marginBottom: 7,
  },
  alertTitle: { fontWeight: 700, color: PDF_COLORS.heading },
  notamText: {
    marginTop: 5,
    fontSize: 7.5,
    color: PDF_COLORS.muted,
    fontFamily: "Courier",
    lineHeight: 1.3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.fill,
    paddingVertical: 5,
    paddingHorizontal: 7,
    fontSize: 8,
    textTransform: "uppercase",
    color: PDF_COLORS.muted,
  },
  row: {
    flexDirection: "row",
    borderBottom: `1 solid ${PDF_COLORS.ruleLight}`,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  airportCard: {
    border: `1 solid ${PDF_COLORS.rule}`,
    borderRadius: 4,
    padding: 10,
    marginBottom: 9,
  },
  disclaimer: {
    marginTop: 6,
    fontSize: 7.5,
    color: PDF_COLORS.mutedLight,
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 26,
    borderTop: `1 solid ${PDF_COLORS.rule}`,
    paddingTop: 7,
    color: PDF_COLORS.mutedLight,
    fontSize: 7.5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function dt(value: string | null | undefined): string {
  if (!value) return "—";
  return `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(new Date(value))}Z`;
}

function ft(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${Math.round(value).toLocaleString("en-US")} ft`;
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function BriefingDocument({ briefing, logoPath }: { briefing: RouteBriefing; logoPath: string }) {
  const logo = logoDataUri(logoPath);
  const m = briefing.mission;
  const route = `${m.departureAirport ?? "—"} → ${m.arrivalAirport ?? "—"}`;

  return (
    <Document title={`Route Briefing ${m.ref}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            {logo ? (
              <Image src={logo} style={styles.logo} />
            ) : (
              <Text style={styles.brandFallback}>AMG Aviation Group</Text>
            )}
            <Text style={[styles.muted, { marginTop: 8, fontSize: 8.5 }]}>
              Operational planning briefing
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Route Briefing</Text>
            <Text style={styles.docMeta}>{m.ref}</Text>
            <Text style={styles.docMeta}>Generated {dt(briefing.generatedAt)}</Text>
          </View>
        </View>

        <Text style={styles.routeLine}>{route}</Text>
        <Text style={styles.muted}>
          {m.client}
          {m.tailNumber ? ` · ${m.tailNumber}` : ""}
          {m.aircraftType ? ` (${m.aircraftType})` : ""}
        </Text>

        {/* ── Trip ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip</Text>
          <View style={styles.grid}>
            <Cell label="Departure" value={dt(m.requestedDeparture)} />
            <Cell label="Arrival" value={dt(m.requestedArrival)} />
            <Cell label="Alternate" value={m.alternateAirport ?? "—"} />
            <Cell label="Passengers" value={m.passengerCount ?? "—"} />
            <Cell label="Status" value={m.status.replace(/_/g, " ")} />
            <Cell label="International" value={m.isInternational ? "Yes" : "No"} />
            {m.fboPreference ? <Cell label="FBO" value={m.fboPreference} /> : null}
            {m.urgency && m.urgency !== "standard" ? <Cell label="Urgency" value={m.urgency} /> : null}
          </View>
          {m.specialHandling ? (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.label}>Special handling</Text>
              <Text style={styles.value}>{m.specialHandling}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Restrictions first: they can stop the flight ─────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Airspace Restrictions</Text>
          {briefing.tfrs.length === 0 ? (
            <Text style={styles.muted}>
              No active TFRs intersect this route for the planned window.
            </Text>
          ) : (
            briefing.tfrs.map((conflict) => (
              <View
                key={conflict.id}
                style={conflict.severity === "critical" ? styles.alert : styles.alertWarn}
              >
                <Text style={styles.alertTitle}>
                  {conflict.tfrIdent} — {severityLabel(conflict.severity)} ·{" "}
                  {conflict.conflictType === "terminal" ? "Terminal" : "Enroute"}
                </Text>
                <Text style={[styles.value, { marginTop: 3 }]}>{conflict.detail ?? ""}</Text>
                {conflict.altitudeBand ? (
                  <Text style={[styles.muted, { marginTop: 2, fontSize: 8.5 }]}>
                    {conflict.altitudeBand}
                    {conflict.tfr?.artccIdent ? ` · ${conflict.tfr.artccIdent}` : ""}
                    {conflict.tfr?.contactInformation ? ` · ${conflict.tfr.contactInformation}` : ""}
                  </Text>
                ) : null}
                {conflict.tfr?.notamText ? (
                  <Text style={styles.notamText}>{conflict.tfr.notamText.trim().slice(0, 1200)}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* ── Airports ─────────────────────────────────────────── */}
        <View style={styles.section} break={briefing.tfrs.length > 2}>
          <Text style={styles.sectionTitle}>Airports</Text>
          {briefing.airports.map((airport) => (
            <View key={`${airport.role}-${airport.code}`} style={styles.airportCard} wrap={false}>
              <Text style={styles.strong}>
                {airport.code} · {airport.role}
                {airport.detail ? ` — ${airport.detail.name}` : ""}
              </Text>
              {!airport.detail ? (
                <Text style={[styles.muted, { marginTop: 3 }]}>
                  Not in the airport directory — no runway, suitability, or obstacle data.
                </Text>
              ) : (
                <>
                  {airport.suitability ? (
                    <Text style={[styles.value, { marginTop: 3 }]}>
                      Runway suitability: {SUITABILITY_LABEL[airport.suitability.result.verdict]} —{" "}
                      {airport.suitability.result.summary}
                    </Text>
                  ) : null}

                  {airport.detail.runways.length ? (
                    <View style={{ marginTop: 6 }}>
                      <View style={styles.tableHeader}>
                        <Text style={{ flex: 2 }}>Runway</Text>
                        <Text style={{ flex: 1.2, textAlign: "right" }}>Length</Text>
                        <Text style={{ flex: 1.2, textAlign: "right" }}>Width</Text>
                        <Text style={{ flex: 2 }}>Surface</Text>
                      </View>
                      {airport.detail.runways.slice(0, 6).map((runway) => (
                        <View key={runway.runwaySurfaceIdentifier} style={styles.row}>
                          <Text style={{ flex: 2 }}>
                            {runway.runwayIdentifiers.map((r) => r.runway_identifier).join(" / ") ||
                              runway.runwaySurfaceIdentifier}
                          </Text>
                          <Text style={{ flex: 1.2, textAlign: "right" }}>{ft(runway.lengthFt)}</Text>
                          <Text style={{ flex: 1.2, textAlign: "right" }}>{ft(runway.widthFt)}</Text>
                          <Text style={{ flex: 2 }}>{runway.surfaceType ?? "—"}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.muted, { marginTop: 3 }]}>No runway data on file.</Text>
                  )}

                  {airport.obstacles.length ? (
                    <Text style={[styles.muted, { marginTop: 6, fontSize: 8.5 }]}>
                      Tallest obstacles within ~15 nm:{" "}
                      {airport.obstacles
                        .slice(0, 5)
                        .map((o) => `${o.type} ${Math.round(o.heightFtAgl)}' AGL`)
                        .join(", ")}
                    </Text>
                  ) : null}

                  {airport.detail.contactDetails ? (
                    <Text style={[styles.muted, { marginTop: 4, fontSize: 8.5 }]}>
                      {airport.detail.contactDetails}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          ))}
          <Text style={styles.disclaimer}>{SUITABILITY_DISCLAIMER}</Text>
        </View>

        {/* ── Airspace ─────────────────────────────────────────── */}
        {briefing.airspace.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Airspace Along Route</Text>
            <View style={styles.tableHeader}>
              <Text style={{ flex: 2 }}>Identifier</Text>
              <Text style={{ flex: 1.6 }}>Type</Text>
              <Text style={{ flex: 1.4 }}>Floor</Text>
              <Text style={{ flex: 1.4 }}>Ceiling</Text>
            </View>
            {briefing.airspace.slice(0, 25).map((airspace) => (
              <View key={airspace.id} style={styles.row}>
                <Text style={{ flex: 2 }}>{airspace.id}</Text>
                <Text style={{ flex: 1.6 }}>{airspace.type}</Text>
                <Text style={{ flex: 1.4 }}>{airspace.lowerLimit ?? "—"}</Text>
                <Text style={{ flex: 1.4 }}>{airspace.upperLimit ?? "—"}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── Crew ─────────────────────────────────────────────── */}
        {briefing.crew.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Crew</Text>
            {briefing.crew.map((member, index) => (
              <View key={index} style={styles.row}>
                <Text style={{ flex: 2 }}>{member.name}</Text>
                <Text style={{ flex: 1 }}>{(member.role ?? "").toUpperCase()}</Text>
                <Text style={{ flex: 2 }}>{member.email ?? "—"}</Text>
                <Text style={{ flex: 1.5 }}>{member.phone ?? "—"}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── What could not be built ──────────────────────────── */}
        {briefing.gaps.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Gaps</Text>
            {briefing.gaps.map((gap, index) => (
              <Text key={index} style={styles.muted}>
                • {gap}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>
            AMG Aviation Group · Route briefing {m.ref} · Planning aid only, not a dispatch release
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Severity words for the restriction blocks; distinct from runway suitability. */
function severityLabel(severity: string): string {
  if (severity === "critical") return "Critical";
  if (severity === "warning") return "Warning";
  return "Advisory";
}

export async function renderRouteBriefingPdf(
  briefing: RouteBriefing,
  logoPath = "/images/logo-navy.png"
): Promise<Buffer> {
  return renderToBuffer(<BriefingDocument briefing={briefing} logoPath={logoPath} />);
}
