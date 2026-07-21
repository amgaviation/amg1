import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * FlightWall live-position proxy — pass-through bridge to the public
 * adsb.lol API so the browser-based dashboard (Fire TV Stick) can fetch
 * nearby aircraft without hitting adsb.lol's missing CORS headers directly.
 *
 * Public, non-sensitive flight-position data: no auth, no rate limiting
 * beyond the short cache header below. Never 500s — a failed/timed-out
 * upstream call degrades to an empty aircraft list.
 */

const UPSTREAM_TIMEOUT_MS = 8_000;
const DEFAULT_RADIUS_NM = 30;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
} as const;

const CACHE_HEADERS = {
  // Short enough that a 1 s dashboard poll cadence gets fresh positions;
  // still collapses bursts from multiple viewers onto one upstream call.
  "Cache-Control": "public, max-age=1, stale-while-revalidate=5",
} as const;

const RESPONSE_HEADERS = { ...CORS_HEADERS, ...CACHE_HEADERS } as const;

type ParsedParams = { lat: number; lon: number; radiusNm: number };

function parseParams(url: URL): ParsedParams | null {
  const latRaw = url.searchParams.get("lat");
  const lonRaw = url.searchParams.get("lon");
  const radiusRaw = url.searchParams.get("radius_nm");

  if (latRaw === null || lonRaw === null) return null;

  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;

  let radiusNm = DEFAULT_RADIUS_NM;
  if (radiusRaw !== null) {
    if (!/^-?\d+$/.test(radiusRaw)) return null;
    radiusNm = Number(radiusRaw);
    if (!Number.isInteger(radiusNm) || radiusNm < 1 || radiusNm > 250) return null;
  }

  return { lat, lon, radiusNm };
}

async function fetchUpstream({ lat, lon, radiusNm }: ParsedParams): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstreamUrl = `https://api.adsb.lol/v2/point/${lat.toFixed(4)}/${lon.toFixed(4)}/${radiusNm}`;
    const response = await fetch(upstreamUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`upstream status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = parseParams(url);

  if (!params) {
    return NextResponse.json(
      { error: "invalid_params" },
      { status: 400, headers: RESPONSE_HEADERS }
    );
  }

  try {
    const body = await fetchUpstream(params);
    return NextResponse.json(body, { status: 200, headers: RESPONSE_HEADERS });
  } catch (error) {
    console.error("[flightwall] flights upstream failed", error);
    return NextResponse.json(
      { ac: [], error: "upstream_unavailable" },
      { status: 200, headers: RESPONSE_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: RESPONSE_HEADERS });
}
