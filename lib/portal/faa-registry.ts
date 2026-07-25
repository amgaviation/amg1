import "server-only";

/**
 * FAA Aircraft Registry ingest.
 *
 * The registry is the actual list of every aircraft owner in the United States:
 * public domain, updated daily, no key, no cost, no vendor. For AMG's Part 91
 * segment it is strictly better than searching the open web, because it is not
 * a guess at who owns an aircraft — it is the record of who owns it.
 *
 * What it does not contain is email addresses. That is a real limitation and
 * the reason this feeds phone and direct mail rather than the email sequence:
 * a check of real aviation business sites found published addresses on none of
 * them, so there was no honest way to build email prospecting without a model
 * that reads rendered pages.
 *
 * Layout is the fixed field order documented in ardata.pdf inside the archive
 * and verified against the live file. Fields are comma-separated and
 * space-padded.
 */

// MASTER.txt column indexes (0-based).
const M_NNUM = 0;
const M_MFR_CODE = 2;
const M_YEAR = 4;
const M_TYPE_REGISTRANT = 5;
const M_NAME = 6;
const M_STREET = 7;
const M_STREET2 = 8;
const M_CITY = 9;
const M_STATE = 10;
const M_ZIP = 11;
const M_COUNTY = 13;
const M_TYPE_AIRCRAFT = 18;
const M_TYPE_ENGINE = 19;
const M_STATUS = 20;

// ACFTREF.txt column indexes (0-based).
const A_CODE = 0;
const A_MFR = 1;
const A_MODEL = 2;
const A_SEATS = 8;

/** Fixed-wing single and multi engine. Rotorcraft, gliders and balloons are out of scope. */
const FIXED_WING = new Set([4, 5]);

/** Reciprocating, turboprop, turbojet, turbofan. */
const TARGET_ENGINES = new Set([1, 2, 4, 5]);

/** Government registrants are not prospects. */
const REGISTRANT_GOVERNMENT = 5;
/** Corporation and LLC — the registrant types most likely to carry a flight budget. */
const REGISTRANT_CORPORATE = new Set([3, 7]);

export type EngineClass = "piston" | "turboprop" | "jet";

export type FaaProspect = {
  nNumber: string;
  ownerName: string;
  street: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  county: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  seats: number | null;
  engineClass: EngineClass;
  isCorporate: boolean;
  /** 0-100. Higher means a better fit for contract crew work. */
  score: number;
};

export type FaaFilter = {
  /** Two-letter state codes, uppercased. */
  states: string[];
  /** Engine classes to include. */
  engineClasses: EngineClass[];
  /** Only corporate and LLC registrants. */
  corporateOnly: boolean;
  /** Cap on returned rows, applied after scoring. */
  limit: number;
};

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function engineClassOf(typeEngine: number): EngineClass | null {
  if (typeEngine === 1) return "piston";
  if (typeEngine === 2) return "turboprop";
  if (typeEngine === 4 || typeEngine === 5) return "jet";
  return null;
}

/**
 * Fit score, so a 16,000-row state list surfaces the few hundred worth a call
 * first rather than being worked alphabetically.
 *
 * The weighting reflects who actually buys contract crew: turbine aircraft need
 * type-rated pilots and often carry an insurance second-pilot requirement,
 * corporate and LLC registrants have a budget and a person whose job this is,
 * and multi-seat airframes are flown on business rather than for recreation. An
 * older airframe scores slightly higher because maintenance downtime, and
 * therefore ferry work, rises with age.
 */
export function scoreProspect(input: {
  engineClass: EngineClass;
  isCorporate: boolean;
  seats: number | null;
  year: number | null;
}): number {
  let score = 0;

  if (input.engineClass === "jet") score += 34;
  else if (input.engineClass === "turboprop") score += 30;
  else score += 8;

  if (input.isCorporate) score += 16;

  const seats = input.seats ?? 0;
  if (seats >= 8) score += 10;
  else if (seats >= 5) score += 7;
  else if (seats >= 4) score += 3;

  if (input.year) {
    const age = new Date().getUTCFullYear() - input.year;
    if (age >= 25) score += 10;
    else if (age >= 15) score += 7;
    else if (age >= 8) score += 3;
  }

  return Math.max(0, score);
}

/**
 * Fleet size adjustment, applied after owners are collapsed.
 *
 * Deliberately not monotonic. A two-to-four aircraft owner is the best prospect
 * on this list: enough movement to need help, not enough to justify staff
 * pilots. Past roughly ten aircraft the owner is a commercial operator, a
 * lessor, or a flight department with its own crews, and is not buying contract
 * coverage from a small coordinator — the first version of this ranked a
 * 98-aircraft cargo operator top, which is the opposite of the target.
 */
export function fleetAdjustment(fleetSize: number): number {
  if (fleetSize <= 1) return 0;
  if (fleetSize <= 4) return 12;
  if (fleetSize <= 9) return 4;
  if (fleetSize <= 19) return -15;
  return -30;
}

/** Aircraft reference table, keyed by MFR MDL CODE. */
export type AircraftRef = Map<string, { make: string; model: string; seats: number | null }>;

export function parseAircraftRef(text: string): AircraftRef {
  const ref: AircraftRef = new Map();
  const lines = text.split("\n");
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",");
    const code = clean(cols[A_CODE]);
    if (!code) continue;
    const seats = Number.parseInt(clean(cols[A_SEATS]), 10);
    ref.set(code, {
      make: clean(cols[A_MFR]),
      model: clean(cols[A_MODEL]),
      seats: Number.isFinite(seats) && seats > 0 ? seats : null,
    });
  }
  return ref;
}

/**
 * Turn one MASTER.txt line into a prospect, or null if it does not match.
 *
 * Exported so the filter can be exercised directly against a line from the real
 * file rather than only through a 193 MB import.
 */
export function parseMasterLine(line: string, ref: AircraftRef, filter: FaaFilter): FaaProspect | null {
  if (!line || line.length < 40) return null;
  const cols = line.split(",");
  if (cols.length < 21) return null;

  // Only currently valid registrations. Expired, cancelled and pending rows are
  // aircraft nobody is flying, and their addresses are the most stale.
  if (!clean(cols[M_STATUS]).startsWith("V")) return null;

  const state = clean(cols[M_STATE]).toUpperCase();
  if (!filter.states.includes(state)) return null;

  const typeAircraft = Number.parseInt(clean(cols[M_TYPE_AIRCRAFT]), 10);
  if (!FIXED_WING.has(typeAircraft)) return null;

  const typeEngine = Number.parseInt(clean(cols[M_TYPE_ENGINE]), 10);
  if (!TARGET_ENGINES.has(typeEngine)) return null;

  const engineClass = engineClassOf(typeEngine);
  if (!engineClass || !filter.engineClasses.includes(engineClass)) return null;

  const registrant = Number.parseInt(clean(cols[M_TYPE_REGISTRANT]), 10);
  if (registrant === REGISTRANT_GOVERNMENT) return null;
  const isCorporate = REGISTRANT_CORPORATE.has(registrant);
  if (filter.corporateOnly && !isCorporate) return null;

  const ownerName = clean(cols[M_NAME]);
  if (!ownerName) return null;

  const aircraft = ref.get(clean(cols[M_MFR_CODE]));
  const yearRaw = Number.parseInt(clean(cols[M_YEAR]), 10);
  const year = Number.isFinite(yearRaw) && yearRaw > 1900 ? yearRaw : null;
  const street = [clean(cols[M_STREET]), clean(cols[M_STREET2])].filter(Boolean).join(", ") || null;

  return {
    nNumber: `N${clean(cols[M_NNUM])}`,
    ownerName,
    street,
    city: clean(cols[M_CITY]) || null,
    state,
    zip: clean(cols[M_ZIP]) || null,
    county: clean(cols[M_COUNTY]) || null,
    year,
    make: aircraft?.make ?? null,
    model: aircraft?.model ?? null,
    seats: aircraft?.seats ?? null,
    engineClass,
    isCorporate,
    score: scoreProspect({ engineClass, isCorporate, seats: aircraft?.seats ?? null, year }),
  };
}

/**
 * Collapse multiple aircraft owned by the same registrant into one prospect.
 *
 * An owner with a fleet appears once per tail. Emailing or calling them three
 * times because they own three aircraft is the fastest way to look like a
 * machine, so the best-scoring aircraft wins and the rest are folded into the
 * note as additional context — which is itself a useful signal, since a
 * three-aircraft owner has more movement to coordinate than a one-aircraft one.
 */
export function dedupeByOwner(prospects: FaaProspect[]): (FaaProspect & { fleetSize: number; fleet: string[] })[] {
  const byOwner = new Map<string, FaaProspect[]>();
  for (const p of prospects) {
    const key = `${p.ownerName.toLowerCase()}|${(p.zip ?? "").slice(0, 5)}`;
    const bucket = byOwner.get(key);
    if (bucket) bucket.push(p);
    else byOwner.set(key, [p]);
  }

  const out: (FaaProspect & { fleetSize: number; fleet: string[] })[] = [];
  for (const bucket of byOwner.values()) {
    bucket.sort((a, b) => b.score - a.score);
    const best = bucket[0];
    const fleet = bucket.map((p) =>
      [p.nNumber, [p.make, p.model].filter(Boolean).join(" ") || null, p.year].filter(Boolean).join(" · "),
    );
    const adjusted = Math.max(0, Math.min(100, best.score + fleetAdjustment(bucket.length)));
    out.push({ ...best, score: adjusted, fleetSize: bucket.length, fleet });
  }

  return out.sort((a, b) => b.score - a.score);
}
