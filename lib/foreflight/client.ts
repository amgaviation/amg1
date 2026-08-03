import "server-only";

import type {
  AerodromeElementFeature,
  AerodromesResponse,
  AirspaceFeature,
  AirspacesResponse,
  BoundingBox,
  ObstacleFeature,
  ObstaclesResponse,
  TfrFeature,
  TfrsResponse,
} from "@/lib/foreflight/types";

/**
 * ForeFlight Advanced Aviation Developer Platform client.
 *
 * No SDK exists for this API and none is warranted — five GET-shaped endpoints
 * over an API key. This follows the repo's existing zero-HTTP-dependency
 * convention (see lib/email/resend-provider.ts, lib/website-editor/github.ts)
 * and centralizes the four things that are genuinely easy to get wrong:
 *
 *  1. The `x-api-key` header, read from env in exactly one place.
 *  2. `bounding_box` serialization. The API takes it as a STRING in [W,S,E,N]
 *     order; a transposed box returns plausible-looking data for the wrong part
 *     of the world, which fails silently rather than loudly.
 *  3. Pagination. The spec requires every other parameter to match across paged
 *     calls, so the page loop carries the original params forward rather than
 *     trusting each caller to remember.
 *  4. Error normalization, so a bad key surfaces as a legible message instead
 *     of a JSON parse failure.
 *
 * Caching follows the data's nature: aerodromes/airspaces/obstacles are chart-
 * cycle reference data and use Next's `revalidate`; TFRs are live and never
 * cache.
 */

const BASE_URL = "https://aadp.foreflight.com";

/** Reference data changes on the chart cycle — a day of staleness is fine. */
const REFERENCE_REVALIDATE_SECONDS = 86_400;

export class ForeFlightError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly path: string
  ) {
    super(`ForeFlight ${path} failed (${status}): ${detail}`);
    this.name = "ForeFlightError";
  }
}

export class ForeFlightNotConfiguredError extends Error {
  constructor() {
    super("FOREFLIGHT_API_KEY is not configured");
    this.name = "ForeFlightNotConfiguredError";
  }
}

/** Whether the integration has credentials. Safe to call from status surfaces. */
export function foreFlightConfigured(): boolean {
  return Boolean(process.env.FOREFLIGHT_API_KEY);
}

export function foreFlightStatus() {
  return {
    provider: "foreflight-aadp",
    baseUrl: BASE_URL,
    configured: foreFlightConfigured(),
  };
}

function apiKey(): string {
  const key = process.env.FOREFLIGHT_API_KEY;
  if (!key) throw new ForeFlightNotConfiguredError();
  return key;
}

/**
 * Serialize a bounding box to the API's expected string form.
 * Exported for the verify script, which asserts the ordering contract.
 */
export function serializeBoundingBox(box: BoundingBox): string {
  const [west, south, east, north] = box;
  for (const value of box) {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid bounding box (non-finite value): ${JSON.stringify(box)}`);
    }
  }
  if (south > north) {
    throw new Error(`Invalid bounding box: south (${south}) is above north (${north})`);
  }
  return `[${west},${south},${east},${north}]`;
}

type QueryValue = string | number | boolean | undefined;

async function ffGet<T>(
  path: string,
  params: Record<string, QueryValue>,
  freshness: "reference" | "live"
): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "x-api-key": apiKey(), accept: "application/json" },
      ...(freshness === "live"
        ? { cache: "no-store" as const }
        : { next: { revalidate: REFERENCE_REVALIDATE_SECONDS } }),
    });
  } catch (cause) {
    throw new ForeFlightError(0, cause instanceof Error ? cause.message : String(cause), path);
  }

  if (!response.ok) {
    // The documented 400 shape is { errors: [{ message, path }] }; 403 is a
    // bare body. Read as text first so neither case throws while building the
    // error we are already reporting.
    const raw = await response.text().catch(() => "");
    let detail = raw.slice(0, 500);
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.errors)) {
        detail = parsed.errors
          .map((e: { message?: string; path?: string[] }) =>
            e.path?.length ? `${e.path.join(".")}: ${e.message}` : e.message
          )
          .join("; ");
      }
    } catch {
      // Non-JSON body — the raw text is already the best detail we have.
    }
    throw new ForeFlightError(response.status, detail || response.statusText, path);
  }

  return (await response.json()) as T;
}

/**
 * Hard ceiling on pages per call. The API documents no rate limit, so this is
 * a runaway guard: a mis-specified bounding box (say, the whole globe for
 * obstacles) would otherwise page indefinitely.
 */
const MAX_PAGES = 100;

/**
 * Walk every page of a paginated collection, carrying the original parameters
 * forward on each request as the spec requires.
 */
async function collectPages<TFeature, TResponse extends { features: TFeature[]; metadata: { page_token?: string | null } }>(
  path: string,
  params: Record<string, QueryValue>,
  maxPages = MAX_PAGES
): Promise<TFeature[]> {
  const features: TFeature[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const page = await ffGet<TResponse>(path, { ...params, page_token: pageToken }, "reference");
    features.push(...(page.features ?? []));
    pageToken = page.metadata?.page_token ?? undefined;
    pages += 1;
  } while (pageToken && pages < maxPages);

  return features;
}

// ─── Endpoints ──────────────────────────────────────────────────────

export type AerodromeQuery = {
  boundingBox: BoundingBox;
  /** ISO 3166-1 alpha-3 codes. */
  countries?: string[];
  identifiers?: string[];
  excludeRunways?: boolean;
  excludeHelipads?: boolean;
  excludeAerodromes?: boolean;
  pageSize?: number;
  maxPages?: number;
};

/**
 * Aerodrome elements (airports, heliports, runways, helipads).
 *
 * `bounding_box` is required even when filtering by identifier — there is no
 * pure "look up KTEB" call — which is why the portal syncs this into its own
 * table rather than querying per request.
 */
export async function fetchAerodromes(query: AerodromeQuery): Promise<AerodromeElementFeature[]> {
  return collectPages<AerodromeElementFeature, AerodromesResponse>(
    "/api/v1/aerodromes",
    {
      bounding_box: serializeBoundingBox(query.boundingBox),
      countries: query.countries?.length ? query.countries.join(",") : undefined,
      aerodrome_identifiers: query.identifiers?.length ? query.identifiers.join(",") : undefined,
      exclude_runways: query.excludeRunways,
      exclude_helipads: query.excludeHelipads,
      exclude_aerodromes: query.excludeAerodromes,
      page_size: query.pageSize,
    },
    query.maxPages
  );
}

export async function fetchAirspaces(query: {
  boundingBox: BoundingBox;
  pageSize?: number;
  maxPages?: number;
}): Promise<AirspaceFeature[]> {
  return collectPages<AirspaceFeature, AirspacesResponse>(
    "/api/v1/airspaces",
    { bounding_box: serializeBoundingBox(query.boundingBox), page_size: query.pageSize },
    query.maxPages
  );
}

export async function fetchObstacles(query: {
  boundingBox: BoundingBox;
  pageSize?: number;
  maxPages?: number;
}): Promise<ObstacleFeature[]> {
  return collectPages<ObstacleFeature, ObstaclesResponse>(
    "/api/v1/obstacles",
    { bounding_box: serializeBoundingBox(query.boundingBox), page_size: query.pageSize },
    query.maxPages
  );
}

/**
 * Every active TFR in the US. Takes no parameters and is not paginated, which
 * is what makes a scheduled poll viable: one call yields complete national
 * state, so conflict detection can compare full snapshots rather than relying
 * on webhook deltas that only start from registration time.
 */
export async function fetchActiveTfrs(): Promise<TfrFeature[]> {
  const response = await ffGet<TfrsResponse>("/api/v1/tfrs", {}, "live");
  return response.features ?? [];
}
