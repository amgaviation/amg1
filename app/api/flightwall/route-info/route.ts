import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * FlightWall route lookup — proxies api.adsbdb.com (public, no key) so the
 * dashboard can show origin/destination for a tracked callsign. adsb.lol's
 * position feed has no route data; adsbdb maps callsigns to filed routes.
 * Same degrade-to-empty philosophy as the flights proxy: never 500s, a miss
 * or upstream failure returns { route: null }.
 */

const UPSTREAM_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 30 * 60 * 1000; // routes don't change mid-flight
const cache = new Map<string, { at: number; route: RouteInfo | null }>();

type RouteInfo = {
  callsign: string;
  airline: string | null;
  origin: { icao: string; iata: string | null; name: string; lat: number; lon: number } | null;
  destination: { icao: string; iata: string | null; name: string; lat: number; lon: number } | null;
};

function airportFrom(raw: any) {
  if (!raw || typeof raw.icao_code !== "string") return null;
  return {
    icao: raw.icao_code,
    iata: typeof raw.iata_code === "string" ? raw.iata_code : null,
    name: typeof raw.name === "string" ? raw.name : raw.icao_code,
    lat: typeof raw.latitude === "number" ? raw.latitude : 0,
    lon: typeof raw.longitude === "number" ? raw.longitude : 0,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callsign = (url.searchParams.get("callsign") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{2,10}$/.test(callsign)) {
    return NextResponse.json({ route: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const hit = cache.get(callsign);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json({ route: hit.route }, { headers: { "Cache-Control": "public, max-age=300" } });
  }

  let route: RouteInfo | null = null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(callsign)}`, {
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      const fr = data?.response?.flightroute;
      if (fr) {
        route = {
          callsign,
          airline: typeof fr.airline?.name === "string" ? fr.airline.name : null,
          origin: airportFrom(fr.origin),
          destination: airportFrom(fr.destination),
        };
      }
    }
  } catch (error) {
    // miss/timeout — cache the null so we don't hammer the upstream
  } finally {
    clearTimeout(timeout);
  }

  cache.set(callsign, { at: Date.now(), route });
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return NextResponse.json({ route }, { headers: { "Cache-Control": "public, max-age=300" } });
}
