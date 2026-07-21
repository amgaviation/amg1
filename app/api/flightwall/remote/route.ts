import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { hasFlightwallDashboardAccess } from "@/lib/flightwall/access";
import { MAP_REGION_PRESETS } from "@/lib/flightwall/settings";

export const dynamic = "force-dynamic";

/**
 * FlightWall remote-control state channel.
 *
 * GET  — the wall display polls this (~4 s) and applies the state live.
 * POST — the remote page (/ops/flightwall/remote) merges command updates.
 *
 * Both verbs sit behind the same gate as the dashboard itself: trusted house
 * IP (FLIGHTWALL_TRUSTED_IPS) or an authenticated portal admin session.
 * State is a whitelisted, validated shape — unknown keys are dropped, so a
 * compromised browser on the house network can at worst change what the TV
 * shows.
 */

type RemoteState = {
  focus: "none" | "map" | "requests" | "missions" | "revenue" | "financial";
  trackTail: string | null;
  theme: "auto" | "dark" | "light";
  region: string | null; // preset key override, null = use saved settings
  airport: string | null; // ICAO/IATA center override (resolved by the display)
  zoom: number | null; // zoom override, null = use saved settings
  trackRadiusNm: number | null; // tracking view radius (nm); null = default 100
  refreshNonce: number; // change forces the display to reload
};

const DEFAULT_STATE: RemoteState = {
  focus: "none",
  trackTail: null,
  theme: "auto",
  region: null,
  airport: null,
  zoom: null,
  trackRadiusNm: null,
  refreshNonce: 0,
};

const FOCUS_VALUES = new Set(["none", "map", "requests", "missions", "revenue", "financial"]);
const THEME_VALUES = new Set(["auto", "dark", "light"]);
const NO_STORE = { "Cache-Control": "no-store, private" } as const;

function sanitize(raw: unknown): RemoteState {
  const src = (raw ?? {}) as Record<string, unknown>;
  const out: RemoteState = { ...DEFAULT_STATE };
  if (typeof src.focus === "string" && FOCUS_VALUES.has(src.focus)) {
    out.focus = src.focus as RemoteState["focus"];
  }
  if (typeof src.trackTail === "string") {
    const tail = src.trackTail.trim().toUpperCase();
    out.trackTail = /^[A-Z0-9-]{2,10}$/.test(tail) ? tail : null;
  }
  if (typeof src.theme === "string" && THEME_VALUES.has(src.theme)) {
    out.theme = src.theme as RemoteState["theme"];
  }
  if (typeof src.region === "string" && MAP_REGION_PRESETS[src.region]) {
    out.region = src.region;
  }
  if (typeof src.airport === "string") {
    const code = src.airport.trim().toUpperCase();
    out.airport = /^[A-Z0-9]{3,4}$/.test(code) ? code : null;
  }
  if (typeof src.zoom === "number" && Number.isFinite(src.zoom)) {
    const z = Math.round(src.zoom);
    if (z >= 3 && z <= 12) out.zoom = z;
  }
  if (typeof src.trackRadiusNm === "number" && Number.isFinite(src.trackRadiusNm)) {
    const r = Math.round(src.trackRadiusNm / 50) * 50; // snap to 50 nm steps
    if (r >= 50 && r <= 600) out.trackRadiusNm = r;
  }
  if (typeof src.refreshNonce === "number" && Number.isFinite(src.refreshNonce)) {
    out.refreshNonce = Math.max(0, Math.min(1_000_000_000, Math.round(src.refreshNonce)));
  }
  return out;
}

async function readState(): Promise<RemoteState> {
  // flightwall_remote is newer than the generated Supabase types — cast the
  // client, matching the existing repo-wide workaround.
  const supabase = (await createServiceClient()) as any;
  const { data } = await supabase.from("flightwall_remote").select("state").eq("id", true).maybeSingle();
  return sanitize(data?.state);
}

export async function GET() {
  if (!(await hasFlightwallDashboardAccess())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  try {
    return NextResponse.json({ state: await readState() }, { headers: NO_STORE });
  } catch (error) {
    console.error("[flightwall] remote state read failed", error);
    // Degrade to defaults — the display keeps running on its saved settings.
    return NextResponse.json({ state: DEFAULT_STATE }, { headers: NO_STORE });
  }
}

export async function POST(request: Request) {
  if (!(await hasFlightwallDashboardAccess())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: NO_STORE });
  }

  try {
    // Merge over current so the remote can send partial updates (e.g. just
    // {focus:"map"}) without clobbering the rest of the state.
    const current = await readState();
    const next = sanitize({ ...current, ...(body as Record<string, unknown>) });
    const supabase = (await createServiceClient()) as any;
    const { error } = await supabase
      .from("flightwall_remote")
      .update({ state: next, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) throw error;
    return NextResponse.json({ state: next }, { headers: NO_STORE });
  } catch (error) {
    console.error("[flightwall] remote state write failed", error);
    return NextResponse.json({ error: "write_failed" }, { status: 500, headers: NO_STORE });
  }
}
