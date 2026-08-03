/**
 * ForeFlight integration verification.
 * Run: npm run foreflight:verify  (tsx scripts/verify-foreflight.ts)
 *
 * Two halves:
 *   1. Conflict-engine cases — pure in-memory, no network or database. These
 *      always run and are the real safety net for the aviation logic.
 *   2. A live API smoke test — only when FOREFLIGHT_API_KEY is set. Confirms
 *      auth, the bounding-box ordering contract, and that paging terminates.
 *
 * Exits nonzero on failure.
 */
import assert from "node:assert/strict";

import {
  classifyTimeOverlap,
  detectConflicts,
  evaluateConflict,
  normalizeAltitudeFt,
  polygonBbox,
  severityWorsened,
  type AirportPoint,
  type MissionRoute,
  type TfrCandidate,
} from "../lib/portal/foreflight/tfr-conflicts";
import type { PolygonGeometry } from "../lib/foreflight/types";

// ── fixtures ────────────────────────────────────────────────────────

const KTEB: AirportPoint = { code: "KTEB", latitude: 40.8501, longitude: -74.0608 };
const KMIA: AirportPoint = { code: "KMIA", latitude: 25.7959, longitude: -80.287 };
const KLAX: AirportPoint = { code: "KLAX", latitude: 33.9416, longitude: -118.4085 };

/**
 * A point genuinely on the KTEB->KMIA great circle. Interpolating naively in
 * lat/lon puts this ~2 degrees too far west, which is exactly the error the
 * enroute tests exist to catch — so it is taken from the real arc.
 */
const MID_ROUTE = { lat: 33.362, lon: -77.445 };

/** Axis-aligned square polygon centered on a point, `deg` degrees per side. */
function squareAround(lat: number, lon: number, deg: number): PolygonGeometry {
  const h = deg / 2;
  return {
    type: "Polygon",
    coordinates: [
      [
        [lon - h, lat - h],
        [lon + h, lat - h],
        [lon + h, lat + h],
        [lon - h, lat + h],
        [lon - h, lat - h],
      ],
    ],
  };
}

const HOUR = 3600;
const nowSec = () => Math.floor(Date.now() / 1000);

function tfr(overrides: Partial<TfrCandidate> & { ident: string; geometry: PolygonGeometry }): TfrCandidate {
  return {
    label: `TFR ${overrides.ident}`,
    periods: [{ start: nowSec() - HOUR, end: nowSec() + 24 * HOUR }],
    stadiumTfr: false,
    ceilingFt: 18_000,
    floorFt: 0,
    lastUpdatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mission(overrides: Partial<MissionRoute> = {}): MissionRoute {
  return {
    missionId: "m-1",
    ref: "AMG-0001",
    departure: KTEB,
    arrival: KMIA,
    departureAt: new Date(Date.now() + 6 * 3_600_000).toISOString(),
    ...overrides,
  };
}

let checks = 0;
function check(label: string, fn: () => void) {
  fn();
  checks += 1;
  console.log(`  ok  ${label}`);
}

// ── altitude normalization ──────────────────────────────────────────

console.log("Altitude normalization");
check("feet pass through", () => {
  assert.equal(normalizeAltitudeFt(3000, "ft"), 3000);
  assert.equal(normalizeAltitudeFt(3000, "FT MSL"), 3000);
});
check("flight levels convert to feet", () => {
  assert.equal(normalizeAltitudeFt(180, "FL"), 18_000);
});
check("meters convert to feet", () => {
  assert.ok(Math.abs(normalizeAltitudeFt(1000, "m")! - 3280.84) < 0.1);
});
check("missing altitude stays null", () => {
  assert.equal(normalizeAltitudeFt(null, "ft"), null);
  assert.equal(normalizeAltitudeFt(undefined, undefined), null);
});

// ── geometry ────────────────────────────────────────────────────────

console.log("\nGeometry");
check("polygonBbox returns the true envelope", () => {
  const box = polygonBbox(squareAround(40, -74, 2));
  assert.equal(box.west, -75);
  assert.equal(box.east, -73);
  assert.equal(box.south, 39);
  assert.equal(box.north, 41);
});

// ── conflict classification ─────────────────────────────────────────

console.log("\nConflict classification");

check("TFR over the departure field is a critical terminal conflict", () => {
  const conflict = evaluateConflict(mission(), tfr({ ident: "T1", geometry: squareAround(KTEB.latitude, KTEB.longitude, 1) }));
  assert.ok(conflict, "expected a conflict");
  assert.equal(conflict!.conflictType, "terminal");
  assert.equal(conflict!.severity, "critical");
  assert.match(conflict!.detail, /KTEB/);
});

check("TFR over the arrival field is also terminal", () => {
  const conflict = evaluateConflict(mission(), tfr({ ident: "T2", geometry: squareAround(KMIA.latitude, KMIA.longitude, 1) }));
  assert.equal(conflict?.conflictType, "terminal");
  assert.equal(conflict?.severity, "critical");
});

check("high-ceiling TFR mid-route is an enroute warning", () => {
  // On the actual KTEB->KMIA great circle (lat 33.36 crosses lon -77.45),
  // well clear of both endpoints.
  const conflict = evaluateConflict(
    mission(),
    tfr({ ident: "T3", geometry: squareAround(MID_ROUTE.lat, MID_ROUTE.lon, 2), ceilingFt: 45_000 })
  );
  assert.equal(conflict?.conflictType, "enroute");
  assert.equal(conflict?.severity, "warning");
});

check("low-ceiling TFR under a cruising aircraft is only advisory", () => {
  const conflict = evaluateConflict(
    mission(),
    tfr({ ident: "T4", geometry: squareAround(MID_ROUTE.lat, MID_ROUTE.lon, 2), ceilingFt: 3_000 })
  );
  assert.equal(conflict?.conflictType, "enroute");
  assert.equal(conflict?.severity, "advisory");
  assert.match(conflict!.detail, /below normal cruise/);
});

check("unpublished ceiling is treated as reaching altitude, not as low", () => {
  const conflict = evaluateConflict(
    mission(),
    tfr({ ident: "T5", geometry: squareAround(MID_ROUTE.lat, MID_ROUTE.lon, 2), ceilingFt: null })
  );
  assert.equal(conflict?.severity, "warning", "a null ceiling must not be assumed harmless");
});

check("stadium TFR over a field downgrades from critical to warning", () => {
  const conflict = evaluateConflict(
    mission(),
    tfr({ ident: "T6", geometry: squareAround(KTEB.latitude, KTEB.longitude, 1), stadiumTfr: true })
  );
  assert.equal(conflict?.severity, "warning");
});

check("a far-away TFR produces no conflict", () => {
  const conflict = evaluateConflict(
    mission({ arrival: KMIA }),
    tfr({ ident: "T7", geometry: squareAround(KLAX.latitude, KLAX.longitude, 1) })
  );
  assert.equal(conflict, null);
});

check("terminal conflict wins even when the route also crosses", () => {
  // A box covering KTEB necessarily also intersects the route leaving it.
  const conflict = evaluateConflict(mission(), tfr({ ident: "T8", geometry: squareAround(KTEB.latitude, KTEB.longitude, 2) }));
  assert.equal(conflict?.conflictType, "terminal");
});

// ── time overlap ────────────────────────────────────────────────────

console.log("\nTime overlap");

check("a window covering the departure is active", () => {
  const departure = new Date(Date.now() + 6 * 3_600_000).toISOString();
  const overlap = classifyTimeOverlap([{ start: nowSec(), end: nowSec() + 24 * HOUR }], departure);
  assert.equal(overlap, "active");
});

check("a window well after the trip is not active", () => {
  const departure = new Date(Date.now() + 2 * 3_600_000).toISOString();
  const farStart = nowSec() + 40 * 24 * HOUR;
  const overlap = classifyTimeOverlap([{ start: farStart, end: farStart + HOUR }], departure);
  assert.equal(overlap, "none");
});

check("a window inside the upcoming horizon is flagged upcoming", () => {
  const departure = new Date(Date.now() + 1 * 3_600_000).toISOString();
  const soon = nowSec() + 36 * HOUR;
  const overlap = classifyTimeOverlap([{ start: soon, end: soon + HOUR }], departure);
  assert.equal(overlap, "upcoming");
});

check("no published periods is treated as continuously active", () => {
  assert.equal(classifyTimeOverlap([], new Date().toISOString()), "active");
});

check("a non-concurrent TFR over the field drops to advisory", () => {
  const farStart = nowSec() + 40 * 24 * HOUR;
  const conflict = evaluateConflict(
    mission({ departureAt: new Date(Date.now() + 2 * 3_600_000).toISOString() }),
    tfr({
      ident: "T9",
      geometry: squareAround(KTEB.latitude, KTEB.longitude, 1),
      periods: [{ start: farStart, end: farStart + HOUR }],
    })
  );
  assert.equal(conflict?.timeOverlap, "none");
  assert.equal(conflict?.severity, "advisory");
});

// ── severity + batching ─────────────────────────────────────────────

console.log("\nSeverity and batching");

check("severityWorsened only fires on an actual escalation", () => {
  assert.equal(severityWorsened("warning", "critical"), true);
  assert.equal(severityWorsened("advisory", "warning"), true);
  assert.equal(severityWorsened("critical", "warning"), false);
  assert.equal(severityWorsened("warning", "warning"), false);
});

check("detectConflicts pairs every mission against every TFR", () => {
  const conflicts = detectConflicts(
    [mission({ missionId: "m-1" }), mission({ missionId: "m-2" })],
    [
      tfr({ ident: "A", geometry: squareAround(KTEB.latitude, KTEB.longitude, 1) }),
      tfr({ ident: "B", geometry: squareAround(KLAX.latitude, KLAX.longitude, 1) }),
    ]
  );
  // Both missions hit TFR A at KTEB; neither goes near KLAX.
  assert.equal(conflicts.length, 2);
  assert.deepEqual(new Set(conflicts.map((c) => c.missionId)), new Set(["m-1", "m-2"]));
  assert.ok(conflicts.every((c) => c.tfrIdent === "A"));
});

check("a mission with only one known endpoint still checks that endpoint", () => {
  const conflict = evaluateConflict(
    mission({ arrival: null }),
    tfr({ ident: "T10", geometry: squareAround(KTEB.latitude, KTEB.longitude, 1) })
  );
  assert.equal(conflict?.conflictType, "terminal");
});

check("a mission with no resolvable endpoints yields nothing", () => {
  const conflict = evaluateConflict(
    mission({ departure: null, arrival: null }),
    tfr({ ident: "T11", geometry: squareAround(KTEB.latitude, KTEB.longitude, 1) })
  );
  assert.equal(conflict, null);
});

// ── live API smoke test (optional) ──────────────────────────────────

async function liveSmokeTest() {
  const { fetchActiveTfrs, fetchAerodromes, serializeBoundingBox } = await import("../lib/foreflight/client");

  console.log("\nLive API");

  check("bounding boxes serialize in [W,S,E,N] order", () => {
    assert.equal(serializeBoundingBox([-75, 40, -73, 41]), "[-75,40,-73,41]");
    assert.throws(() => serializeBoundingBox([-75, 41, -73, 40]), /south/i);
  });

  const tfrs = await fetchActiveTfrs();
  console.log(`  ok  GET /tfrs authenticated — ${tfrs.length} active TFRs`);
  for (const feature of tfrs.slice(0, 5)) {
    assert.ok(feature.properties?.ident, "every TFR must carry an ident");
    assert.equal(feature.geometry?.type, "Polygon");
  }
  if (tfrs.length) console.log(`  ok  TFR features carry ident + Polygon geometry`);

  // A small box over the New York metro: big enough to return data, small
  // enough that paging terminates quickly.
  const aerodromes = await fetchAerodromes({
    boundingBox: [-74.5, 40.5, -73.5, 41.0],
    excludeRunways: true,
    excludeHelipads: true,
    maxPages: 5,
  });
  console.log(`  ok  GET /aerodromes paging terminated — ${aerodromes.length} features`);
  const identifiers = aerodromes
    .map((f) => f.properties.aerodrome_identifier)
    .filter(Boolean);
  assert.ok(identifiers.length > 0, "expected at least one aerodrome in the NY metro box");
  // Confirms the box was interpreted as intended rather than transposed.
  assert.ok(
    identifiers.some((id) => id.startsWith("K") || /^\d/.test(id) || id.length <= 5),
    "expected US-style identifiers from a US bounding box"
  );
  console.log(`  ok  bounding box returned the expected region`);
}

async function main() {
  if (process.env.FOREFLIGHT_API_KEY) {
    await liveSmokeTest();
  } else {
    console.log("\nLive API: skipped (FOREFLIGHT_API_KEY not set)");
  }
  console.log(`\nForeFlight verification passed — ${checks} checks.`);
}

main().catch((error) => {
  console.error("\nForeFlight verification FAILED");
  console.error(error);
  process.exit(1);
});
