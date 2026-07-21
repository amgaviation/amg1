import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * FlightWall tracked-aircraft history — proxies the public OpenSky Network
 * REST API (anonymous tier) for a given ICAO24 hex:
 *   - current flight track waypoints (drawn as the full flight path)
 *   - recent flights (last ~3 days: departure/arrival airports + times)
 *
 * Anonymous OpenSky is rate-limited, so responses cache in memory for
 * 5 minutes per hex and every failure degrades to nulls — the wall keeps
 * its client-side breadcrumb trail regardless.
 */

const UPSTREAM_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; body: HistoryBody }>();

type HistoryBody = {
  path: [number, number][] | null;
  flights:
    | { dep: string | null; arr: string | null; firstSeen: number; lastSeen: number }[]
    | null;
};

async function fetchJson(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hex = (url.searchParams.get("hex") ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{6}$/.test(hex)) {
    return NextResponse.json({ path: null, flights: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const hit = cache.get(hex);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.body, { headers: { "Cache-Control": "public, max-age=60" } });
  }

  const now = Math.floor(Date.now() / 1000);
  const [track, flights] = await Promise.all([
    fetchJson(`https://opensky-network.org/api/tracks/all?icao24=${hex}&time=0`),
    // 30 days is the maximum interval OpenSky allows per request
    fetchJson(`https://opensky-network.org/api/flights/aircraft?icao24=${hex}&begin=${now - 30 * 86400}&end=${now}`),
  ]);

  const body: HistoryBody = { path: null, flights: null };
  if (track && Array.isArray(track.path)) {
    // OpenSky waypoint: [time, lat, lon, baro_alt, heading, on_ground]
    const path = track.path
      .filter((p: unknown[]) => typeof p?.[1] === "number" && typeof p?.[2] === "number")
      .map((p: number[]) => [p[1], p[2]] as [number, number]);
    body.path = path.length >= 2 ? path : null;
  }
  if (Array.isArray(flights)) {
    body.flights = flights
      .slice(-15)
      .reverse()
      .map((f: any) => ({
        dep: typeof f.estDepartureAirport === "string" ? f.estDepartureAirport : null,
        arr: typeof f.estArrivalAirport === "string" ? f.estArrivalAirport : null,
        firstSeen: typeof f.firstSeen === "number" ? f.firstSeen : 0,
        lastSeen: typeof f.lastSeen === "number" ? f.lastSeen : 0,
      }));
    if (body.flights.length === 0) body.flights = null;
  }

  cache.set(hex, { at: Date.now(), body });
  if (cache.size > 100) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=60" } });
}
