/**
 * Runway suitability — advisory only.
 *
 * ⚠️ These figures are PLANNING DEFAULTS, not dispatch authority. Actual
 * required field length depends on weight, temperature, pressure altitude,
 * wind, runway slope, and contamination — none of which this module models.
 * Every surface that renders a result must say so, and the operator's AFM
 * performance data is always the authority. The purpose here is to catch the
 * obvious mistake early (a Global 6000 sent to a 3,200 ft strip), not to
 * approve a departure.
 *
 * Pure functions — no DB, no network — so the verify script exercises them
 * directly against fixtures.
 */

export type SuitabilityVerdict = "suitable" | "marginal" | "unsuitable" | "unknown";

export type AircraftMinimums = {
  typeCode: string;
  displayName: string;
  /** Advisory minimum runway length, feet. */
  minRunwayFt: number;
  /** Advisory minimum runway width, feet. */
  minWidthFt: number | null;
  /** Lowercase surface substrings this type should not operate from. */
  unsuitableSurfaces: string[];
  aliases: string[];
};

export type RunwayFacts = {
  longestRunwayFt: number | null;
  widestRunwayFt: number | null;
  surfaceType: string | null;
};

export type SuitabilityResult = {
  verdict: SuitabilityVerdict;
  /** Human-readable summary safe to render directly. */
  summary: string;
  reasons: string[];
  minimums: AircraftMinimums | null;
  marginFt: number | null;
};

/**
 * Margin band, as a fraction of the type's minimum, within which a runway is
 * "legal on paper but leaves little room". Below the minimum is unsuitable;
 * within 15% above it is marginal, because the published minimum already
 * assumes near-ideal conditions.
 */
const MARGINAL_BAND = 0.15;

/** Surfaces no business jet should be dispatched to without a deliberate call. */
export const SOFT_SURFACES = ["turf", "grass", "dirt", "gravel", "sand", "water", "snow", "ice"];

/**
 * Normalize free-text make/model into a comparable token.
 *
 * `aircraft.make` and `aircraft.model` are unconstrained text — real rows hold
 * "Gulfstream"/"G550", "GULFSTREAM G-550", "G550", and worse — so matching has
 * to be tolerant of case, punctuation, and word order.
 */
export function normalizeTypeToken(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Match an aircraft's free-text make/model against a minimums catalog.
 *
 * Longest alias first, so "CL350" doesn't win over "CL3500" on a substring
 * test. Returns null when nothing matches — deliberately, because guessing a
 * type would produce a confidently wrong runway warning, which is worse than
 * no warning at all.
 */
export function matchAircraftMinimums(
  make: string | null | undefined,
  model: string | null | undefined,
  catalog: AircraftMinimums[]
): AircraftMinimums | null {
  const haystack = normalizeTypeToken(`${make ?? ""}${model ?? ""}`);
  if (!haystack) return null;

  const candidates = catalog
    .flatMap((entry) =>
      [entry.typeCode, ...entry.aliases].map((alias) => ({ entry, token: normalizeTypeToken(alias) }))
    )
    .filter((candidate) => candidate.token.length >= 3)
    .sort((a, b) => b.token.length - a.token.length);

  for (const candidate of candidates) {
    if (haystack.includes(candidate.token)) return candidate.entry;
  }
  return null;
}

function formatFt(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} ft`;
}

/**
 * Evaluate an airport's runways against an aircraft's advisory minimums.
 *
 * Returns `unknown` — never a pass — when the type cannot be matched or the
 * airport has no runway data. A missing check must read as "not evaluated",
 * because silently returning "suitable" would be a false assurance about the
 * exact thing an operator is relying on this for.
 */
export function evaluateSuitability(
  facts: RunwayFacts,
  minimums: AircraftMinimums | null
): SuitabilityResult {
  if (!minimums) {
    return {
      verdict: "unknown",
      summary: "Aircraft type not matched — runway suitability not evaluated.",
      reasons: ["No advisory minimums are on file for this aircraft type."],
      minimums: null,
      marginFt: null,
    };
  }

  if (facts.longestRunwayFt === null) {
    return {
      verdict: "unknown",
      summary: `No runway data on file — suitability for the ${minimums.displayName} not evaluated.`,
      reasons: ["This airport has not been covered by an aerodrome sync yet."],
      minimums,
      marginFt: null,
    };
  }

  const reasons: string[] = [];
  const margin = facts.longestRunwayFt - minimums.minRunwayFt;
  let verdict: SuitabilityVerdict = "suitable";

  if (margin < 0) {
    verdict = "unsuitable";
    reasons.push(
      `Longest runway is ${formatFt(facts.longestRunwayFt)}, below the ${formatFt(minimums.minRunwayFt)} advisory minimum for the ${minimums.displayName}.`
    );
  } else if (margin < minimums.minRunwayFt * MARGINAL_BAND) {
    verdict = "marginal";
    reasons.push(
      `Longest runway is ${formatFt(facts.longestRunwayFt)} against a ${formatFt(minimums.minRunwayFt)} advisory minimum — only ${formatFt(margin)} of margin.`
    );
  }

  if (minimums.minWidthFt !== null && facts.widestRunwayFt !== null && facts.widestRunwayFt < minimums.minWidthFt) {
    if (verdict === "suitable") verdict = "marginal";
    reasons.push(
      `Widest runway is ${formatFt(facts.widestRunwayFt)}, below the ${formatFt(minimums.minWidthFt)} advisory width for this type.`
    );
  }

  const surface = (facts.surfaceType ?? "").toLowerCase();
  if (surface && minimums.unsuitableSurfaces.some((bad) => surface.includes(bad))) {
    verdict = "unsuitable";
    reasons.push(`Surface is ${facts.surfaceType} — not an approved surface for this type.`);
  }

  const summary =
    verdict === "suitable"
      ? `Longest runway ${formatFt(facts.longestRunwayFt)} clears the ${formatFt(minimums.minRunwayFt)} advisory minimum for the ${minimums.displayName}.`
      : reasons[0];

  return { verdict, summary, reasons, minimums, marginFt: margin };
}

export const SUITABILITY_DISCLAIMER =
  "Advisory planning figures only — actual required field length depends on weight, temperature, pressure altitude, wind, and runway condition. Verify against AFM performance data before dispatch.";

export const SUITABILITY_TONE: Record<SuitabilityVerdict, "success" | "warn" | "danger" | "neutral"> = {
  suitable: "success",
  marginal: "warn",
  unsuitable: "danger",
  unknown: "neutral",
};

export const SUITABILITY_LABEL: Record<SuitabilityVerdict, string> = {
  suitable: "Suitable",
  marginal: "Marginal",
  unsuitable: "Below minimums",
  unknown: "Not evaluated",
};
