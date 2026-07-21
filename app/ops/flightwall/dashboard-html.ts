// AMG Aviation Group — FlightWall operations dashboard.
// Self-contained HTML (inline CSS/JS, embedded logo) for the kiosk display
// at /ops/flightwall. Kept as a plain exported string (not a bare .html file)
// so Next.js always bundles it correctly with the route. Edit the markup
// directly in this template literal — it is plain HTML/CSS/JS.
//
// window.FW_CONFIG default is replaced at request time by route.ts, which
// substitutes the FW_CONFIG_INJECT_MARKER comment with a real <script> tag
// built from public.flightwall_settings (see lib/flightwall/settings.ts).
export const FW_CONFIG_INJECT_MARKER = "<!--FW_CONFIG_INJECT-->";

export const dashboardHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>AMG Aviation Group — Operations Display</title>
<style>
  :root {
    /* AMG Aviation Group Brand & Voice Guide v1.0 — §03 Color System */
    --amg-navy: #050b14;
    --amg-blue: #1d4ed8;
    --jet-gray: #6b7280;
    --light-gray: #e5e7eb;
    --amg-white: #ffffff;
    --action-blue: #3b82f6;  /* interaction only — never brand artwork */
    --sky-blue: #38bdf8;     /* secondary highlight / route detail — sparing */
    --aviation-gold: #d4af37; /* premium/rare accent — max ~5% of layout */
    --aviation-red: #dc2626;  /* alert/critical only — never decorative */
    --status-good: #2f9e6e;  /* semantic status only — separate from brand accents */

    --bg: var(--amg-navy);
    --panel: #0a1220;
    --panel-2: #0d1626;
    --line: #1c2a3f;
    --text: var(--amg-white);
    --text-dim: var(--jet-gray);
    --text-mid: #9aa4b2;
  }
  :root[data-theme="light"] {
    --bg: var(--light-gray);
    --panel: #ffffff;
    --panel-2: #f4f6f8;
    --line: #d3d8de;
    --text: var(--amg-navy);
    --text-dim: #6b7280;
    --text-mid: #3f4a58;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    background: var(--bg);
    color: var(--text);
    /* §03 Type — display: Barlow Condensed; body: Inter — guide's own named
       fallbacks used here (CSP disallows font CDNs in this environment). */
    font-family: Inter, "Helvetica Neue", Arial, system-ui, sans-serif;
    overflow: hidden;
  }
  .display {
    font-family: "Barlow Condensed", "Arial Narrow", "Nimbus Sans Narrow", sans-serif;
    font-weight: 700;
  }
  .mono {
    font-family: Inter, "Helvetica Neue", Arial, system-ui, sans-serif;
    font-variant-numeric: tabular-nums;
  }
  .label {
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-dim);
    font-weight: 600;
  }
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
  }

  .wall {
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-rows: 56px 1fr 34px;
    padding: 14px;
    gap: 12px;
  }

  /* ---- top bar ---- */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .brand-logo { height: 22px; width: auto; display: block; }
  .brand-sub {
    font-size: 11px;
    letter-spacing: 0.2em;
    color: var(--text-dim);
    text-transform: uppercase;
    border-left: 1px solid var(--line);
    padding-left: 14px;
  }
  .top-mid {
    display: flex;
    align-items: baseline;
    gap: 26px;
  }
  .clock {
    font-family: "Barlow Condensed", "Arial Narrow", "Nimbus Sans Narrow", sans-serif;
    font-variant-numeric: tabular-nums;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.01em;
  }
  .clock .secs { color: var(--text-dim); font-size: 18px; }
  .date { font-size: 13px; color: var(--text-mid); }
  .conn {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--status-good);
  }
  .dot.warn { background: var(--sky-blue); }
  .dot.down { background: var(--aviation-red); }

  /* ---- main grid ---- */
  .main {
    display: grid;
    grid-template-columns: 1.55fr 1fr;
    gap: 12px;
    min-height: 0;
  }
  .col { display: grid; gap: 12px; min-height: 0; }
  .panel {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--line);
    flex: 0 0 auto;
  }
  .panel-head .count {
    font-size: 22px;
    font-weight: 700;
    color: var(--amg-blue);
  }
  .panel-body { flex: 1; min-height: 0; overflow: hidden; position: relative; }

  /* ---- radar ---- */
  .radar-wrap {
    display: grid;
    grid-template-columns: 1fr;
    height: 100%;
    min-height: 0;
  }
  .radar-scope {
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    background: var(--panel-2);
    min-height: 0;
  }
  canvas#radar { display: block; width: 100%; height: 100%; }
  .radar-caption {
    position: absolute;
    left: 14px;
    top: 10px;
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.08em;
    z-index: 1;
  }
  .radar-caption b { color: var(--sky-blue); font-weight: 600; }
  .map-attrib {
    /* CARTO/OSM basemap attribution — required by the tile provider terms */
    position: absolute;
    right: 8px;
    bottom: 5px;
    font-size: 9px;
    letter-spacing: 0.02em;
    color: var(--text-dim);
    opacity: 0.85;
    z-index: 1;
  }

  /* ---- remote focus modes (visibility is JS-driven; see applyFocus) ---- */
  .main[data-focus="financial"] .revenue-figure { font-size: clamp(56px, 8vw, 120px); }

  /* ---- generic data widgets (layout editor palette) ---- */
  .widget-row {
    display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
    padding: 8px 16px; border-bottom: 1px solid var(--line); font-size: 13px;
  }
  .widget-row .wsub { color: var(--text-dim); font-size: 11px; white-space: nowrap; }
  .widget-empty { padding: 12px 16px; font-size: 12px; color: var(--text-dim); }

  /* ---- tracked flight info card (top of Nearby Traffic while tracking) ---- */
  .flight-info {
    padding: 12px 16px;
    border-bottom: 1px solid var(--aviation-gold);
    background: color-mix(in srgb, var(--aviation-gold) 6%, transparent);
  }
  .fi-head { display: flex; align-items: baseline; gap: 10px; }
  .fi-callsign {
    font-family: "Barlow Condensed", "Arial Narrow", "Nimbus Sans Narrow", sans-serif;
    font-size: 22px; font-weight: 700; color: var(--aviation-gold); letter-spacing: 0.04em;
  }
  .fi-airline { font-size: 12px; color: var(--text-mid); }
  .fi-route { margin-top: 2px; font-size: 15px; font-weight: 600; letter-spacing: 0.06em; }
  .fi-sub { margin-top: 2px; font-size: 11px; color: var(--text-dim); }
  .fi-grid {
    margin-top: 8px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 12px;
  }
  .fi-cell { display: flex; flex-direction: column; gap: 1px; }
  .fi-k { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-dim); }
  .fi-v { font-size: 13px; font-weight: 600; }

  /* ---- flight list ---- */
  .flight-list { overflow-y: auto; height: 100%; }
  .flight-row {
    display: grid;
    grid-template-columns: 78px 1fr 64px 74px 64px;
    gap: 10px;
    align-items: center;
    padding: 9px 16px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }
  .flight-row:last-child { border-bottom: none; }
  .flight-row.watch { background: color-mix(in srgb, var(--aviation-gold) 8%, transparent); }
  .callsign { font-weight: 700; letter-spacing: 0.03em; }
  .flight-row.watch .callsign { color: var(--aviation-gold); }
  .col-h { color: var(--text-dim); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
  .num { text-align: right; color: var(--text-mid); }
  .dist { text-align: right; color: var(--text); }

  /* ---- ops stack right col ---- */
  .stat-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--line);
    flex: 0 0 auto;
  }
  .stat {
    background: var(--panel);
    padding: 14px 16px;
  }
  .stat .v {
    font-size: 26px;
    font-weight: 700;
    line-height: 1;
  }
  .stat .v.alert { color: var(--amg-blue); }
  .stat .l { margin-top: 6px; }

  .req-list, .mission-list { overflow-y: auto; height: 100%; }
  .req-row, .mission-row {
    padding: 9px 16px;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .req-row:last-child, .mission-row:last-child { border-bottom: none; }
  .req-name { flex: 1; font-size: 13px; }
  .req-route { color: var(--text-mid); font-size: 12px; }
  .req-age { color: var(--text-dim); font-size: 11px; white-space: nowrap; }

  .chip {
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 3px;
    font-weight: 700;
    white-space: nowrap;
  }
  .chip.enroute { background: color-mix(in srgb, var(--sky-blue) 18%, transparent); color: var(--sky-blue); }
  .chip.scheduled { background: color-mix(in srgb, var(--status-good) 18%, transparent); color: var(--status-good); }
  .chip.crew_assigned { background: color-mix(in srgb, var(--text-mid) 20%, transparent); color: var(--text-mid); }
  .chip.quoted { background: color-mix(in srgb, var(--jet-gray) 22%, transparent); color: var(--text-mid); }

  .mission-top { display: flex; justify-content: space-between; align-items: center; width: 100%; }
  .mission-label { font-size: 13px; font-weight: 600; }
  .mission-eta { font-size: 11px; color: var(--text-dim); }

  .revenue-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
  }
  .revenue-row:last-child { border-bottom: none; }
  .revenue-figure { font-size: 20px; font-weight: 700; color: var(--text); }

  /* ---- bottom ticker ---- */
  .ticker {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 16px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-mid);
    overflow: hidden;
    white-space: nowrap;
  }
  .metar-cat {
    font-weight: 800;
    letter-spacing: 0.04em;
    padding: 2px 7px;
    border-radius: 3px;
    font-size: 11px;
  }
  .metar-cat.vfr { background: color-mix(in srgb, var(--status-good) 20%, transparent); color: var(--status-good); }
  .metar-cat.mvfr { background: color-mix(in srgb, var(--sky-blue) 20%, transparent); color: var(--sky-blue); }
  .ticker .sep { color: var(--line); }
  .ticker .raw { color: var(--text-dim); font-family: ui-monospace, monospace; letter-spacing: 0.02em; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }

  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
  }
</style>

<!--FW_CONFIG_INJECT-->
<script>
  // Injected server-side by app/ops/flightwall/route.ts from
  // public.flightwall_settings (edited at /portal/admin/settings/flightwall).
  // Falls back to these defaults if the route ever serves the file directly.
  window.FW_CONFIG = window.FW_CONFIG || {
    homeLat: 40.85, homeLon: -74.06, rangeNm: 30, watchlistTails: [],
    panelOrder: ["map", "requests", "missions", "revenue", "metar"],
    showMap: true, showRequests: true, showMissions: true, showRevenue: true, showMetar: true,
    flightsPollSeconds: 30, opsPollSeconds: 30, metarStation: "KTEB",
    mapRegion: "florida", mapCenterLat: 27.9, mapCenterLon: -83.2, mapZoom: 6, mapStyle: "auto"
  };
</script>
<div class="wall" role="img" aria-label="AMG Aviation Group operations display showing live aircraft radar and mission support activity">
  <h2 class="sr-only">Live wall dashboard: aircraft radar scope with nearby flight list, plus AMG Aviation Group operations — new requests, mission board, and revenue.</h2>

  <div class="topbar">
    <div class="brand">
      <img class="brand-logo" src="data:image/png;base64,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" alt="AMG Aviation Group" />
      <span class="brand-sub">Operations Display</span>
    </div>
    <div class="top-mid">
      <div class="clock" id="clock">--:--<span class="secs">:--</span></div>
      <div class="date" id="date">—</div>
    </div>
    <div class="conn">
      <span class="dot" id="connDot"></span>
      <span id="connLabel">Live</span>
    </div>
  </div>

  <div class="main">
    <div class="col">
      <div class="panel" data-panel="map" style="flex: 1.35;">
        <div class="panel-head">
          <span class="label" id="mapRangeLabel">Traffic Map</span>
          <span class="label" id="contactCount">0 contacts</span>
        </div>
        <div class="panel-body">
          <div class="radar-wrap">
            <div class="radar-scope">
              <canvas id="radar" width="600" height="600" aria-hidden="true"></canvas>
              <div class="radar-caption" id="mapCaption"></div>
              <div class="map-attrib">&copy; OpenStreetMap &middot; &copy; CARTO</div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel" data-panel="nearby" style="flex: 1;">
        <div class="panel-head">
          <span class="label">Nearby Traffic</span>
        </div>
        <div class="panel-body">
          <div class="flight-info" id="flightInfo" style="display:none"></div>
          <div class="flight-row" style="border-bottom: 1px solid var(--line);">
            <span class="col-h">Callsign</span>
            <span class="col-h">Route / Type</span>
            <span class="col-h num">Alt FT</span>
            <span class="col-h num">GS KT</span>
            <span class="col-h num">NM</span>
          </div>
          <div class="flight-list mono" id="flightList"></div>
        </div>
      </div>
    </div>

    <div class="col">
      <div class="panel" style="flex: 0 0 auto;">
        <div class="stat-strip">
          <div class="stat">
            <div class="v mono" id="statNewReq">0</div>
            <div class="l label">New Requests</div>
          </div>
          <div class="stat">
            <div class="v mono" id="statActive">0</div>
            <div class="l label">Active Missions</div>
          </div>
          <div class="stat">
            <div class="v mono" id="statMtd">$0</div>
            <div class="l label">Revenue MTD</div>
          </div>
        </div>
      </div>

      <div class="panel" data-panel="requests" style="flex: 1;">
        <div class="panel-head">
          <span class="label">Latest Requests</span>
          <span class="count mono" id="reqCount">0</span>
        </div>
        <div class="panel-body">
          <div class="req-list" id="reqList"></div>
        </div>
      </div>

      <div class="panel" data-panel="missions" style="flex: 1.2;">
        <div class="panel-head">
          <span class="label">Mission Board</span>
          <span class="count mono" id="missionCount">0</span>
        </div>
        <div class="panel-body">
          <div class="mission-list" id="missionList"></div>
        </div>
      </div>

      <div class="panel" data-panel="revenue" style="flex: 0.75;">
        <div class="panel-head">
          <span class="label">Revenue</span>
        </div>
        <div class="panel-body">
          <div class="revenue-row">
            <span class="label" style="margin:0;">Today</span>
            <span class="revenue-figure mono" id="revToday">$0</span>
          </div>
          <div class="revenue-row">
            <span class="label" style="margin:0;">Month to Date</span>
            <span class="revenue-figure mono" id="revMtd">$0</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="ticker mono" data-panel="metar">
    <span class="metar-cat vfr" id="metarCat">VFR</span>
    <span id="metarStation">KTEB</span>
    <span class="sep">│</span>
    <span class="raw" id="metarRaw">—</span>
    <span class="sep">│</span>
    <span id="tickerMsg">Awaiting live data…</span>
  </div>
</div>

<script>
(function () {
  "use strict";

  // ---- CONFIG ----
  // Hosted same-origin at /ops/flightwall — both data routes are relative and
  // called with the browser's own session cookie. No token lives in this file.
  // Live-editable at /portal/admin/settings/flightwall — window.FW_CONFIG is
  // injected server-side from public.flightwall_settings.
  const FW_CFG = window.FW_CONFIG || {};
  const FLIGHTS_PROXY_URL = "/api/flightwall/flights";
  const OWN_LAT = typeof FW_CFG.homeLat === "number" ? FW_CFG.homeLat : 40.85;
  const OWN_LON = typeof FW_CFG.homeLon === "number" ? FW_CFG.homeLon : -74.06;
  const RANGE_NM = typeof FW_CFG.rangeNm === "number" ? FW_CFG.rangeNm : 30;
  const WATCHLIST = Array.isArray(FW_CFG.watchlistTails) ? FW_CFG.watchlistTails : [];

  // Map view — region preset resolved to center+zoom server-side (see
  // /portal/admin/settings/flightwall). The view is independent of home:
  // the wall can show all of Florida while distance/"nearby" numbers stay
  // relative to the ops base at homeLat/homeLon.
  const MAP_LAT = typeof FW_CFG.mapCenterLat === "number" ? FW_CFG.mapCenterLat : 27.9;
  const MAP_LON = typeof FW_CFG.mapCenterLon === "number" ? FW_CFG.mapCenterLon : -83.2;
  const MAP_ZOOM = Math.max(3, Math.min(12, typeof FW_CFG.mapZoom === "number" ? Math.round(FW_CFG.mapZoom) : 6));
  const MAP_STYLE = FW_CFG.mapStyle === "dark" || FW_CFG.mapStyle === "light" ? FW_CFG.mapStyle : "auto";
  const MAP_REGION_LABELS = {
    florida: "Florida", usa: "Continental USA", northeast: "Northeast Corridor",
    southeast: "Southeast US", gulf: "Gulf Coast", custom: "Custom View"
  };
  const MAP_REGION_LABEL = MAP_REGION_LABELS[FW_CFG.mapRegion] || "Custom View";
  const REGION_PRESETS = {
    florida: { lat: 27.9, lon: -83.2, zoom: 6 },
    usa: { lat: 39.5, lon: -98.35, zoom: 4 },
    northeast: { lat: 41.0, lon: -73.9, zoom: 6 },
    southeast: { lat: 31.2, lon: -83.4, zoom: 5 },
    gulf: { lat: 28.8, lon: -89.5, zoom: 5 }
  };

  // Live view state — starts at the saved settings view. The remote
  // (/ops/flightwall/remote) can override region/zoom, focus a panel, or
  // track a specific aircraft; state arrives via /api/flightwall/remote.
  let viewLat = MAP_LAT, viewLon = MAP_LON, viewZoom = MAP_ZOOM;
  let remote = { focus: "none", trackTail: null, theme: "auto", region: null, airport: null, zoom: null, refreshNonce: null };

  // Major-airport reference data ([icao, iata, name, lat, lon, tier]) —
  // subtle map layer + "go to airport" resolution. Injected server-side.
  const AIRPORTS = window.FW_AIRPORTS || [];
  const AIRPORT_VIEW_ZOOM = 9;
  function findAirportByCode(code) {
    if (!code) return null;
    for (let i = 0; i < AIRPORTS.length; i++) {
      if (AIRPORTS[i][0] === code || AIRPORTS[i][1] === code) return AIRPORTS[i];
    }
    return null;
  }

  // Tracked-flight state: breadcrumb trail accumulated while tracking, plus
  // filed-route info from /api/flightwall/route-info (adsbdb).
  let trackTrail = [];
  let routeInfo = null;
  let routeInfoFor = null;
  // OpenSky-backed history for the tracked airframe (full current-flight
  // track + recent flights with dep/arr airports and times)
  let historyPath = null;
  let historyFlights = null;
  let historyFor = null;

  // AMG business bridge — same-origin, gated server-side by trusted-IP-or-
  // admin-session (lib/flightwall/access.ts); the browser sends its portal
  // session cookie via credentials:'include', no bearer token needed here.
  const BRIDGE_URL = "/api/flightwall/summary";

  // ---- helpers ported from firmware/amg-flightwall providers.cpp + flight_radar_scene.cpp ----
  function haversineNm(lat1, lon1, lat2, lon2) {
    const R = 3440.065; // nm
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // adsb.lol "ac" record -> our FlightContact shape (mirrors FlightProvider::fetch)
  function mapAircraft(ac) {
    let callsign = (ac.flight || "").trim();
    if (!callsign) callsign = ac.r || "";
    if (!callsign) return null;
    if (typeof ac.lat !== "number" || typeof ac.lon !== "number") return null;
    const altitude_ft = typeof ac.alt_baro === "number" ? ac.alt_baro : 0; // "ground" string -> 0
    return {
      callsign,
      reg: (ac.r || "").toUpperCase(),
      hex: typeof ac.hex === "string" ? ac.hex.toLowerCase() : "",
      fixAt: Date.now(),
      type: ac.t || "",
      lat: ac.lat,
      lon: ac.lon,
      altitude_ft,
      ground_speed_kt: Math.round(ac.gs || 0),
      heading_deg: ac.track || 0,
      distance_nm: haversineNm(OWN_LAT, OWN_LON, ac.lat, ac.lon),
      watchlisted: WATCHLIST.includes((ac.r || "").toUpperCase()) || WATCHLIST.includes(callsign.toUpperCase())
    };
  }

  const kMaxContacts = 10;     // "Nearby Traffic" list rows
  const kMaxMapContacts = 300; // aircraft drawn on the basemap (perf cap)

  // ---- demo AMG data (business bridge is a separate, optional concern) ----
  const FIXTURE = {
    metar: {
      station: FW_CFG.metarStation || "KTEB",
      flight_category: "VFR",
      raw: (FW_CFG.metarStation || "KTEB") + " — live METAR not yet connected"
    },
    amg: {
      requests: { new_count: 3, latest: [
        { label: "KTEB → KPBI", name: "J. Sorensen", age_min: 18 },
        { label: "KOPF → KASE", name: "R. Chu", age_min: 47 },
        { label: "KBOS → KMIA", name: "L. Ahmadi", age_min: 92 }
      ] },
      missions: { active_count: 4, items: [
        { label: "N721AM · KTEB–KPBI", status: "enroute", eta_min: 96 },
        { label: "N88TF · KOPF–KASE", status: "scheduled", eta_min: 640 },
        { label: "N44QS · KBOS–KMIA", status: "crew_assigned", eta_min: 1180 },
        { label: "N12FW · KTEB–KLAS", status: "quoted", eta_min: -1 }
      ] },
      revenue: { today_cents: 4820000, mtd_cents: 61340000, currency: "usd" }
    }
  };

  const root = document.documentElement;
  function applyOSTheme(mq) { if (!root.hasAttribute("data-theme")) root.dataset.themeAuto = mq.matches ? "dark" : "light"; }
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  applyOSTheme(mq); mq.addEventListener("change", applyOSTheme);

  function fmtMoney(cents) {
    const v = Math.round(cents / 100);
    return "$" + v.toLocaleString("en-US");
  }
  function fmtAge(min) {
    if (min < 60) return min + "m ago";
    return Math.round(min / 60) + "h ago";
  }
  function fmtEta(min) {
    if (min == null || min < 0) return "—";
    if (min < 60) return min + "m";
    const h = Math.floor(min / 60), m = min % 60;
    return h + "h " + m + "m";
  }

  // ---- clock ----
  function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    document.getElementById("clock").innerHTML = hh + ":" + mm + '<span class="secs">:' + ss + "</span>";
    document.getElementById("date").textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }
  tickClock(); setInterval(tickClock, 1000);

  document.getElementById("mapRangeLabel").textContent = "Traffic Map · " + MAP_REGION_LABEL;
  document.getElementById("mapCaption").innerHTML =
    MAP_REGION_LABEL + ' <b>· N up</b> · base ' +
    Math.abs(OWN_LAT).toFixed(2) + (OWN_LAT >= 0 ? "N" : "S") + " " +
    Math.abs(OWN_LON).toFixed(2) + (OWN_LON >= 0 ? "E" : "W");

  // ---- radar ----
  const canvas = document.getElementById("radar");
  const ctx = canvas.getContext("2d");
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let liveContacts = [];

  function styleColor(varName) { return getComputedStyle(root).getPropertyValue(varName).trim(); }

  function sizeCanvas() {
    const box = canvas.parentElement.getBoundingClientRect();
    canvas.style.width = box.width + "px";
    canvas.style.height = box.height + "px";
    canvas.width = box.width * dpr;
    canvas.height = box.height * dpr;
  }

  // FlightRadar-style real basemap: CARTO raster tiles (OpenStreetMap data)
  // drawn on the canvas via standard Web-Mercator slippy-tile math, with the
  // live traffic overlay on top. *.basemaps.cartocdn.com is already
  // allowlisted in the site CSP img-src (same provider as the portal crew
  // map). View center + zoom come from portal settings (Florida by default).
  const TILE = 256;
  const TILE_SUBS = ["a", "b", "c", "d"];
  const TILE_CACHE_MAX = 220;
  const tileCache = new Map(); // url -> { img, ok }
  let drawQueued = false;

  function isDarkTheme() {
    const forced = root.getAttribute("data-theme");
    return (forced || root.dataset.themeAuto || "dark") !== "light";
  }
  function basemapStyle() {
    if (MAP_STYLE === "dark") return "dark_all";
    if (MAP_STYLE === "light") return "light_all";
    return isDarkTheme() ? "dark_all" : "light_all";
  }

  function lonToWorldX(lon, z) { return ((lon + 180) / 360) * Math.pow(2, z) * TILE; }
  function latToWorldY(lat, z) {
    const clamped = Math.max(-85.0511, Math.min(85.0511, lat));
    const r = (clamped * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z) * TILE;
  }
  function worldXToLon(x, z) { return (x / (Math.pow(2, z) * TILE)) * 360 - 180; }
  function worldYToLat(y, z) {
    const n = Math.PI - (2 * Math.PI * y) / (Math.pow(2, z) * TILE);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  function scheduleDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => { drawQueued = false; drawRadar(); });
  }

  // Lazily loads (and caches) one basemap tile; redraws when it arrives.
  function tileImage(style, z, x, y) {
    const n = Math.pow(2, z);
    const wx = ((x % n) + n) % n; // wrap around the antimeridian
    if (y < 0 || y >= n) return null;
    const retina = dpr > 1 ? "@2x" : "";
    const sub = TILE_SUBS[(wx + y) % TILE_SUBS.length];
    const url = "https://" + sub + ".basemaps.cartocdn.com/" + style + "/" + z + "/" + wx + "/" + y + retina + ".png";
    let entry = tileCache.get(url);
    if (entry) return entry;
    if (tileCache.size >= TILE_CACHE_MAX) {
      tileCache.delete(tileCache.keys().next().value);
    }
    const img = new Image();
    entry = { img: img, ok: false };
    tileCache.set(url, entry);
    img.crossOrigin = "anonymous";
    img.onload = () => { entry.ok = true; scheduleDraw(); };
    img.src = url;
    return entry;
  }

  // device-pixel position of a lat/lon in the current view
  function project(lat, lon, wCss, hCss) {
    const cwx = lonToWorldX(viewLon, viewZoom);
    const cwy = latToWorldY(viewLat, viewZoom);
    return {
      x: (lonToWorldX(lon, viewZoom) - cwx + wCss / 2) * dpr,
      y: (latToWorldY(lat, viewZoom) - cwy + hCss / 2) * dpr
    };
  }

  // nm from map center to the far corner of the viewport — drives the ADS-B
  // fetch radius so every visible part of the map has traffic on it
  // (adsb.lol caps point queries at 250 nm).
  function viewportRadiusNm() {
    const wCss = canvas.width / dpr, hCss = canvas.height / dpr;
    if (!wCss || !hCss) return 200;
    const cwx = lonToWorldX(viewLon, viewZoom);
    const cwy = latToWorldY(viewLat, viewZoom);
    const cornerLat = worldYToLat(cwy - hCss / 2, viewZoom);
    const cornerLon = worldXToLon(cwx - wCss / 2, viewZoom);
    const nm = haversineNm(viewLat, viewLon, cornerLat, cornerLon);
    return Math.max(30, Math.min(250, Math.ceil(nm * 1.05)));
  }

  function drawRadar() {
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    const wCss = w / dpr, hCss = h / dpr;
    const style = basemapStyle();

    ctx.fillStyle = styleColor("--panel-2");
    ctx.fillRect(0, 0, w, h);

    // ---- basemap tiles ----
    const cwx = lonToWorldX(viewLon, viewZoom);
    const cwy = latToWorldY(viewLat, viewZoom);
    const tlx = cwx - wCss / 2, tly = cwy - hCss / 2;
    const x0 = Math.floor(tlx / TILE), x1 = Math.floor((tlx + wCss) / TILE);
    const y0 = Math.floor(tly / TILE), y1 = Math.floor((tly + hCss) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const entry = tileImage(style, viewZoom, tx, ty);
        if (!entry || !entry.ok) continue;
        ctx.drawImage(entry.img, (tx * TILE - tlx) * dpr, (ty * TILE - tly) * dpr, TILE * dpr, TILE * dpr);
      }
    }

    const skyBlue = styleColor("--sky-blue");
    const gold = styleColor("--aviation-gold");
    const dim = styleColor("--text-dim");
    const amgBlue = styleColor("--amg-blue");
    // readable over dark map imagery regardless of panel theme tokens
    const labelColor = style === "dark_all" ? "#c8d2de" : "#3f4a58";

    // ---- scale bar (bottom-left), round nm length near 1/4 panel width ----
    const metersPerPx = (Math.cos((viewLat * Math.PI) / 180) * 40075016.686) / (Math.pow(2, viewZoom) * TILE);
    const nmPerPx = metersPerPx / 1852;
    const targetNm = nmPerPx * (wCss / 4);
    const steps = [5, 10, 25, 50, 100, 200, 400, 800];
    let barNm = steps[0];
    for (let i = 0; i < steps.length; i++) { if (steps[i] <= targetNm) barNm = steps[i]; }
    const barPx = (barNm / nmPerPx) * dpr;
    const barX = 12 * dpr, barY = h - 14 * dpr;
    ctx.strokeStyle = dim; ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(barX, barY); ctx.lineTo(barX + barPx, barY);
    ctx.moveTo(barX, barY - 4 * dpr); ctx.lineTo(barX, barY + 4 * dpr);
    ctx.moveTo(barX + barPx, barY - 4 * dpr); ctx.lineTo(barX + barPx, barY + 4 * dpr);
    ctx.stroke();
    ctx.fillStyle = dim;
    ctx.font = (10 * dpr) + "px Inter, sans-serif";
    ctx.fillText(barNm + " nm", barX, barY - 8 * dpr);

    // ---- airport reference layer (subtle — aircraft always draw over it) ----
    if (viewZoom >= 5 && AIRPORTS.length) {
      const apStroke = style === "dark_all" ? "rgba(148,163,184,0.5)" : "rgba(71,85,105,0.5)";
      const apText = style === "dark_all" ? "rgba(148,163,184,0.7)" : "rgba(71,85,105,0.75)";
      ctx.font = (8.5 * dpr) + "px Inter, sans-serif";
      for (let i = 0; i < AIRPORTS.length; i++) {
        const ap = AIRPORTS[i];
        const tier = ap[5];
        if (tier === 2 && viewZoom < 7) continue;
        const pp = project(ap[3], ap[4], wCss, hCss);
        if (pp.x < 0 || pp.x > w || pp.y < 0 || pp.y > h) continue;
        const r = (tier === 1 ? 3 : 2.4) * dpr;
        ctx.beginPath();
        ctx.moveTo(pp.x, pp.y - r); ctx.lineTo(pp.x + r, pp.y);
        ctx.lineTo(pp.x, pp.y + r); ctx.lineTo(pp.x - r, pp.y);
        ctx.closePath();
        ctx.strokeStyle = apStroke;
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
        if (viewZoom >= (tier === 1 ? 6 : 8)) {
          ctx.fillStyle = apText;
          ctx.fillText(ap[0], pp.x + 5 * dpr, pp.y - 4 * dpr);
        }
      }
    }

    // ---- tracked flight path ----
    // full current-flight track from OpenSky (thin), our own breadcrumbs
    // since tracking began (brighter), dashed line to filed destination
    if (historyPath && historyPath.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < historyPath.length; i++) {
        const hp = project(historyPath[i][0], historyPath[i][1], wCss, hCss);
        if (i === 0) ctx.moveTo(hp.x, hp.y); else ctx.lineTo(hp.x, hp.y);
      }
      ctx.strokeStyle = gold;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1.1 * dpr;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (trackTrail.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < trackTrail.length; i++) {
        const tp = project(trackTrail[i][0], trackTrail[i][1], wCss, hCss);
        if (i === 0) ctx.moveTo(tp.x, tp.y); else ctx.lineTo(tp.x, tp.y);
      }
      ctx.strokeStyle = gold;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.6 * dpr;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const trackedNow = findTracked();
    if (trackedNow && routeInfo && routeInfo.destination && routeInfo.destination.lat) {
      const from = project(trackedNow.lat, trackedNow.lon, wCss, hCss);
      const to = project(routeInfo.destination.lat, routeInfo.destination.lon, wCss, hCss);
      ctx.beginPath();
      ctx.setLineDash([6 * dpr, 5 * dpr]);
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = gold;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // ---- home base marker ----
    const home = project(OWN_LAT, OWN_LON, wCss, hCss);
    if (home.x >= 0 && home.x <= w && home.y >= 0 && home.y <= h) {
      ctx.beginPath(); ctx.arc(home.x, home.y, 4 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = amgBlue; ctx.fill();
      ctx.beginPath(); ctx.arc(home.x, home.y, 8 * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = amgBlue; ctx.lineWidth = 1 * dpr; ctx.stroke();
    }

    // ---- aircraft (FR24 look) ----
    // Positions are dead-reckoned between fixes: each contact advances along
    // its heading at its groundspeed for the time since its last fix, so the
    // 1 Hz redraw shows continuous motion even when the data feed is slower.
    // When a specific flight is being tracked, the map shows ONLY that
    // aircraft — no other regional traffic competes for attention.
    const trackedContact = findTracked();
    const drawContacts = remote.trackTail && trackedContact ? [trackedContact] : liveContacts;
    const showLabels = viewZoom >= 7 || drawContacts.length <= 30;
    const nowMs = Date.now();
    drawContacts.forEach((c) => {
      let dLat = c.lat, dLon = c.lon;
      const ageH = Math.min(nowMs - (c.fixAt || nowMs), 60000) / 3600000;
      const dNm = (c.ground_speed_kt || 0) * ageH;
      if (dNm > 0.003) {
        const hr = ((c.heading_deg || 0) * Math.PI) / 180;
        dLat = c.lat + (dNm / 60) * Math.cos(hr);
        dLon = c.lon + (dNm / (60 * Math.cos((c.lat * Math.PI) / 180))) * Math.sin(hr);
      }
      const p = project(dLat, dLon, wCss, hCss);
      const x = p.x, y = p.y;
      if (x < -20 * dpr || x > w + 20 * dpr || y < -20 * dpr || y > h + 20 * dpr) return;
      const tracked = !!remote.trackTail && (c.reg === remote.trackTail || c.callsign.toUpperCase() === remote.trackTail);
      const highlight = c.watchlisted || tracked;
      const color = highlight ? gold : skyBlue;
      const heading = (c.heading_deg || 0) * (Math.PI / 180);

      // short trail behind the aircraft, opposite its heading
      const trailLen = 12 * dpr;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.sin(heading) * trailLen, y + Math.cos(heading) * trailLen);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // aircraft glyph: top-down plane silhouette pointing along heading
      // (0deg = north = up) — nose, swept wings, fuselage, tailplane
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(heading);
      const s = (highlight ? 7 : 5.5) * dpr;
      ctx.beginPath();
      ctx.moveTo(0, -s);                                             // nose
      ctx.quadraticCurveTo(s * 0.24, -s * 0.72, s * 0.20, -s * 0.22); // right forward fuselage
      ctx.lineTo(s * 0.95, s * 0.18);                                // right wing leading edge
      ctx.lineTo(s * 0.95, s * 0.42);                                // right wingtip
      ctx.lineTo(s * 0.18, s * 0.26);                                // right wing trailing edge
      ctx.lineTo(s * 0.15, s * 0.62);                                // aft fuselage
      ctx.lineTo(s * 0.46, s * 0.88);                                // right stabilizer leading edge
      ctx.lineTo(s * 0.46, s * 1.02);                                // right stab tip
      ctx.lineTo(0, s * 0.90);                                       // tail cone
      ctx.lineTo(-s * 0.46, s * 1.02);                               // mirror left side
      ctx.lineTo(-s * 0.46, s * 0.88);
      ctx.lineTo(-s * 0.15, s * 0.62);
      ctx.lineTo(-s * 0.18, s * 0.26);
      ctx.lineTo(-s * 0.95, s * 0.42);
      ctx.lineTo(-s * 0.95, s * 0.18);
      ctx.lineTo(-s * 0.20, -s * 0.22);
      ctx.quadraticCurveTo(-s * 0.24, -s * 0.72, 0, -s);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      if (highlight) {
        ctx.beginPath();
        ctx.arc(x, y, (tracked ? 13 : 11) * dpr, 0, Math.PI * 2);
        ctx.strokeStyle = gold;
        ctx.lineWidth = (tracked ? 1.6 : 1) * dpr;
        ctx.stroke();
      }

      if (showLabels || highlight) {
        ctx.fillStyle = labelColor;
        ctx.font = (9 * dpr) + "px Inter, sans-serif";
        ctx.fillText(c.callsign, x + 8 * dpr, y - 6 * dpr);
        ctx.fillStyle = dim;
        ctx.font = (8 * dpr) + "px Inter, sans-serif";
        ctx.fillText(Math.round(c.altitude_ft / 100) + "00ft", x + 8 * dpr, y + 4 * dpr);
      }
    });
  }

  sizeCanvas();
  window.addEventListener("resize", () => { sizeCanvas(); scheduleDraw(); });
  mq.addEventListener("change", scheduleDraw); // auto basemap style follows OS theme
  drawRadar();

  // ---- render flight list ----
  function renderFlights(contacts) {
    // Map draws everything in view (up to the perf cap); the "Nearby
    // Traffic" list stays the nearest few relative to home base.
    liveContacts = contacts.slice(0, kMaxMapContacts);
    applyView(); // fresh positions may recenter the view onto a tracked aircraft
    const tracked = findTracked();
    if (tracked) {
      const last = trackTrail[trackTrail.length - 1];
      if (!last || last[0] !== tracked.lat || last[1] !== tracked.lon) {
        trackTrail.push([tracked.lat, tracked.lon]);
        if (trackTrail.length > 600) trackTrail.shift();
      }
    }
    renderTrackInfo();
    loadRouteInfo();
    loadHistory();
    scheduleDraw();
    const list = document.getElementById("flightList");
    list.innerHTML = "";
    // While tracking a flight, the list narrows to just that aircraft (its
    // full detail is in the info card above) — no regional traffic mixed in.
    const listSource = remote.trackTail && tracked ? [tracked] : contacts;
    const sorted = [...listSource].sort((a, b) => a.distance_nm - b.distance_nm).slice(0, kMaxContacts);
    sorted.forEach((c) => {
      const row = document.createElement("div");
      row.className = "flight-row" + (c.watchlisted ? " watch" : "");
      row.innerHTML =
        '<span class="callsign">' + c.callsign + "</span>" +
        '<span style="color:var(--text-mid);">' + c.type + "</span>" +
        '<span class="num">' + c.altitude_ft.toLocaleString() + "</span>" +
        '<span class="num">' + c.ground_speed_kt + "</span>" +
        '<span class="dist">' + c.distance_nm.toFixed(1) + "</span>";
      list.appendChild(row);
    });
    document.getElementById("contactCount").textContent =
      remote.trackTail && tracked ? "Tracking " + tracked.callsign
        : contacts.length + " contact" + (contacts.length === 1 ? "" : "s");
  }

  // ---- render AMG ops ----
  function renderAmg(amg) {
    document.getElementById("statNewReq").textContent = amg.requests.new_count;
    document.getElementById("statNewReq").className = "v mono" + (amg.requests.new_count > 0 ? " alert" : "");
    document.getElementById("statActive").textContent = amg.missions.active_count;
    document.getElementById("statMtd").textContent = fmtMoney(amg.revenue.mtd_cents);

    document.getElementById("reqCount").textContent = amg.requests.latest.length;
    const reqList = document.getElementById("reqList");
    reqList.innerHTML = "";
    amg.requests.latest.forEach((r) => {
      const row = document.createElement("div");
      row.className = "req-row";
      row.innerHTML =
        '<div class="req-name">' + r.name + '<div class="req-route">' + r.label + "</div></div>" +
        '<span class="req-age mono">' + fmtAge(r.age_min) + "</span>";
      reqList.appendChild(row);
    });

    document.getElementById("missionCount").textContent = amg.missions.active_count;
    const mList = document.getElementById("missionList");
    mList.innerHTML = "";
    amg.missions.items.forEach((m) => {
      const row = document.createElement("div");
      row.className = "mission-row";
      row.innerHTML =
        '<div class="mission-top">' +
          '<span class="mission-label">' + m.label + "</span>" +
          '<span class="chip ' + m.status + '">' + m.status.replace("_", " ") + "</span>" +
        "</div>";
      const eta = document.createElement("div");
      eta.className = "mission-eta mono";
      eta.textContent = "ETA " + fmtEta(m.eta_min);
      row.querySelector(".mission-top").after(eta);
      mList.appendChild(row);
    });

    document.getElementById("revToday").textContent = fmtMoney(amg.revenue.today_cents);
    document.getElementById("revMtd").textContent = fmtMoney(amg.revenue.mtd_cents);
  }

  function renderMetar(metar) {
    const catEl = document.getElementById("metarCat");
    catEl.textContent = metar.flight_category;
    catEl.className = "metar-cat " + metar.flight_category.toLowerCase();
    document.getElementById("metarStation").textContent = metar.station;
    document.getElementById("metarRaw").textContent = metar.raw;
  }

  function setConn(state) {
    const dot = document.getElementById("connDot");
    const label = document.getElementById("connLabel");
    dot.className = "dot" + (state === "down" ? " down" : state === "warn" ? " warn" : "");
    label.textContent = state === "down" ? "Offline" : state === "warn" ? "Demo Data" : "Live";
  }

  const messages = [
    "Live traffic via adsb.lol · nearest " + kMaxContacts + " contacts sorted by range",
    "Watchlisted tail numbers highlighted in gold on the map and list",
    BRIDGE_URL ? "Mission board reflects live AMG Connect pipeline" : "AMG ops panel showing demo data — set BRIDGE_URL to go live"
  ];
  let msgIdx = 0;
  setInterval(() => {
    msgIdx = (msgIdx + 1) % messages.length;
    document.getElementById("tickerMsg").textContent = messages[msgIdx];
  }, 8000);
  document.getElementById("tickerMsg").textContent = messages[0];

  async function loadFlights() {
    // Centered on the MAP view (not home) with a radius covering the visible
    // basemap, so the whole configured region shows traffic like FlightRadar.
    const url = FLIGHTS_PROXY_URL + "?lat=" + viewLat.toFixed(4) + "&lon=" + viewLon.toFixed(4) + "&radius_nm=" + viewportRadiusNm();
    const res = await fetch(url);
    if (!res.ok) throw new Error("bad status " + res.status);
    const data = await res.json();
    const contacts = (data.ac || [])
      .map(mapAircraft)
      .filter(Boolean)
      .sort((a, b) => a.distance_nm - b.distance_nm);
    renderFlights(contacts);
  }

  async function loadLive() {
    let flightsOk = true;
    try {
      await loadFlights();
    } catch (err) {
      flightsOk = false;
      document.getElementById("tickerMsg").textContent = "Flight feed unreachable — retrying…";
    }
    setConn(flightsOk ? (BRIDGE_URL ? "ok" : "warn") : "down");

    if (!BRIDGE_URL) {
      renderAmg(FIXTURE.amg);
      renderMetar(FIXTURE.metar);
      return;
    }
    try {
      const res = await fetch(BRIDGE_URL, { credentials: "include" });
      if (!res.ok) throw new Error("bad status " + res.status);
      const data = await res.json();
      if (data.metar) renderMetar(data.metar);
      if (data.requests || data.missions || data.revenue) renderAmg(data);
    } catch (err) {
      renderAmg(FIXTURE.amg);
      renderMetar(FIXTURE.metar);
    }
  }

  // ---- panel visibility + order (from FW_CONFIG) ----
  // map is always the left column and metar always the bottom ticker — those
  // two positions are structural. The three right-column business panels
  // (requests/missions/revenue) reorder freely per FW_CONFIG.panelOrder.
  // ---- wall layout (free-form, from the portal layout editor) ----
  // FW_CFG.layout = {left:[keys], right:[keys]} places EVERY panel — the
  // map, nearby list, and metar included, nothing is positionally fixed.
  // Unknown keys render as generic data widgets fed by /api/flightwall/widgets.
  const BUILTIN_PANEL_KEYS = ["map", "nearby", "requests", "missions", "revenue", "metar"];
  const WIDGET_LABELS_JS = window.FW_WIDGET_LABELS || {};
  let placedKeys = null; // Set of keys on the wall (null = legacy mode)
  let genericWidgetKeys = [];

  function createWidgetPanel(key) {
    const panel = document.createElement("div");
    panel.className = "panel";
    panel.setAttribute("data-panel", key);
    panel.style.flex = "1";
    panel.innerHTML =
      '<div class="panel-head"><span class="label">' + (WIDGET_LABELS_JS[key] || key) + "</span>" +
      '<span class="count mono" data-widget-count>—</span></div>' +
      '<div class="panel-body"><div class="widget-list" data-widget-list>' +
      '<div class="widget-empty">Loading…</div></div></div>';
    return panel;
  }

  function applyLayoutVisibility() {
    if (placedKeys) {
      document.querySelectorAll("[data-panel]").forEach((el) => {
        el.style.display = placedKeys.has(el.getAttribute("data-panel")) ? "" : "none";
      });
      return;
    }
    const showFlags = {
      map: FW_CFG.showMap !== false,
      nearby: FW_CFG.showMap !== false,
      requests: FW_CFG.showRequests !== false,
      missions: FW_CFG.showMissions !== false,
      revenue: FW_CFG.showRevenue !== false,
      metar: FW_CFG.showMetar !== false
    };
    document.querySelectorAll("[data-panel]").forEach((el) => {
      const key = el.getAttribute("data-panel");
      el.style.display = showFlags[key] === false ? "none" : "";
    });
  }

  (function buildLayout() {
    const layout = FW_CFG.layout && Array.isArray(FW_CFG.layout.left) && Array.isArray(FW_CFG.layout.right)
      ? FW_CFG.layout
      : null;

    if (!layout) {
      // legacy mode: original columns + show flags + right-column ordering
      applyLayoutVisibility();
      const order = Array.isArray(FW_CFG.panelOrder) ? FW_CFG.panelOrder : [];
      const reorderable = order.filter((p) => p === "requests" || p === "missions" || p === "revenue");
      if (reorderable.length > 0) {
        const rightCol = document.getElementById("reqList")?.closest(".col");
        if (rightCol) {
          reorderable.forEach((key) => {
            const el = rightCol.querySelector('[data-panel="' + key + '"]');
            if (el) rightCol.appendChild(el);
          });
        }
      }
      return;
    }

    placedKeys = new Set(layout.left.concat(layout.right));
    genericWidgetKeys = layout.left.concat(layout.right).filter((k) => BUILTIN_PANEL_KEYS.indexOf(k) === -1);

    const main = document.querySelector(".main");
    const cols = main.querySelectorAll(":scope > .col");
    const leftCol = cols[0], rightCol = cols[1];

    // metar leaves the fixed bottom bar and becomes a normal panel
    const tickerEl = document.querySelector('.ticker[data-panel="metar"]');
    let metarPanel = null;
    if (tickerEl) {
      metarPanel = document.createElement("div");
      metarPanel.className = "panel";
      metarPanel.setAttribute("data-panel", "metar");
      metarPanel.style.flex = "0 0 auto";
      const head = document.createElement("div");
      head.className = "panel-head";
      head.innerHTML = '<span class="label">Weather</span>';
      metarPanel.appendChild(head);
      tickerEl.removeAttribute("data-panel");
      tickerEl.style.border = "0";
      metarPanel.appendChild(tickerEl);
      document.querySelector(".wall").style.gridTemplateRows = "56px 1fr";
    }

    const builtinNodes = {};
    document.querySelectorAll("[data-panel]").forEach((el) => {
      builtinNodes[el.getAttribute("data-panel")] = el;
    });
    if (metarPanel) builtinNodes.metar = metarPanel;

    function nodeFor(key) {
      return builtinNodes[key] || createWidgetPanel(key);
    }
    layout.left.forEach((key) => leftCol.appendChild(nodeFor(key)));
    layout.right.forEach((key) => rightCol.appendChild(nodeFor(key)));
    applyLayoutVisibility();
  })();

  // generic widget data: count + latest rows from the portal database
  async function loadWidgets() {
    if (!genericWidgetKeys.length) return;
    try {
      const res = await fetch("/api/flightwall/widgets?keys=" + genericWidgetKeys.join(","), { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      const widgets = (data && data.widgets) || {};
      genericWidgetKeys.forEach((key) => {
        const panel = document.querySelector('[data-panel="' + key + '"]');
        if (!panel) return;
        const countEl = panel.querySelector("[data-widget-count]");
        const listEl = panel.querySelector("[data-widget-list]");
        const w = widgets[key];
        if (!w) {
          if (countEl) countEl.textContent = "—";
          if (listEl) listEl.innerHTML = '<div class="widget-empty">Unavailable</div>';
          return;
        }
        if (countEl) countEl.textContent = w.count === null ? "—" : String(w.count);
        if (listEl) {
          listEl.innerHTML = "";
          if (!w.rows.length) {
            listEl.innerHTML = '<div class="widget-empty">No records</div>';
          } else {
            w.rows.forEach((row) => {
              const div = document.createElement("div");
              div.className = "widget-row";
              const label = document.createElement("span");
              label.textContent = row.label;
              const sub = document.createElement("span");
              sub.className = "wsub";
              sub.textContent = row.sub;
              div.appendChild(label);
              div.appendChild(sub);
              listEl.appendChild(div);
            });
          }
        }
      });
    } catch (err) {
      // widget feed unreachable — panels keep their last data
    }
  }

  // ---- remote control (/ops/flightwall/remote via /api/flightwall/remote) ----
  const REMOTE_URL = "/api/flightwall/remote";
  let baselineNonce = null;

  function findTracked() {
    if (!remote.trackTail) return null;
    for (let i = 0; i < liveContacts.length; i++) {
      const c = liveContacts[i];
      if (c.reg === remote.trackTail || c.callsign.toUpperCase() === remote.trackTail) return c;
    }
    return null;
  }

  // Filed-route lookup for the tracked flight (origin/destination/airline).
  function loadRouteInfo() {
    if (!remote.trackTail) return;
    const c = findTracked();
    const cs = (c ? c.callsign.toUpperCase() : remote.trackTail);
    if (routeInfoFor === cs) return;
    routeInfoFor = cs;
    fetch("/api/flightwall/route-info?callsign=" + encodeURIComponent(cs))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        routeInfo = d && d.route ? d.route : null;
        renderTrackInfo();
        scheduleDraw(); // destination line becomes drawable
      })
      .catch(function () {});
  }

  // Full-track + recent-flights history via /api/flightwall/history (OpenSky).
  function loadHistory() {
    if (!remote.trackTail) return;
    const c = findTracked();
    if (!c || !c.hex || historyFor === c.hex) return;
    historyFor = c.hex;
    fetch("/api/flightwall/history?hex=" + encodeURIComponent(c.hex))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        historyPath = Array.isArray(d.path) ? d.path : null;
        historyFlights = Array.isArray(d.flights) ? d.flights : null;
        renderTrackInfo();
        scheduleDraw();
      })
      .catch(function () {});
  }

  function fmtHistTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts * 1000);
    return (d.getUTCMonth() + 1) + "/" + d.getUTCDate() + " " +
      String(d.getUTCHours()).padStart(2, "0") + ":" + String(d.getUTCMinutes()).padStart(2, "0") + "Z";
  }

  function fiCell(k, v) {
    return '<div class="fi-cell"><span class="fi-k">' + k + '</span><span class="fi-v mono">' + v + "</span></div>";
  }

  // Tracked-flight card at the top of the Nearby Traffic panel.
  function renderTrackInfo() {
    const el = document.getElementById("flightInfo");
    if (!el) return;
    if (!remote.trackTail) {
      el.style.display = "none";
      el.innerHTML = "";
      return;
    }
    const c = findTracked();
    let html = '<div class="fi-head"><span class="fi-callsign">' + remote.trackTail + "</span>";
    if (routeInfo && routeInfo.airline) html += '<span class="fi-airline">' + routeInfo.airline + "</span>";
    html += "</div>";
    if (routeInfo && (routeInfo.origin || routeInfo.destination)) {
      const o = routeInfo.origin, dst = routeInfo.destination;
      html += '<div class="fi-route mono">' + (o ? o.icao : "????") + " → " + (dst ? dst.icao : "????") + "</div>";
      html += '<div class="fi-sub">' + (o ? o.name : "Unknown origin") + " → " + (dst ? dst.name : "Unknown destination") + "</div>";
    } else {
      html += '<div class="fi-sub">No filed route found for this callsign.</div>';
    }
    if (c) {
      html += '<div class="fi-grid">' +
        fiCell("Type", c.type || "—") +
        fiCell("Reg", c.reg || "—") +
        fiCell("Altitude", c.altitude_ft.toLocaleString() + " ft") +
        fiCell("Speed", c.ground_speed_kt + " kt") +
        fiCell("Heading", Math.round(c.heading_deg || 0) + "°") +
        fiCell("From base", c.distance_nm.toFixed(0) + " nm");
      if (routeInfo && routeInfo.destination && routeInfo.destination.lat && c.ground_speed_kt > 40) {
        const dn = haversineNm(c.lat, c.lon, routeInfo.destination.lat, routeInfo.destination.lon);
        const etaMin = Math.round((dn / c.ground_speed_kt) * 60);
        html += fiCell("To dest", dn.toFixed(0) + " nm") + fiCell("ETA est", fmtEta(etaMin));
      }
      if (historyFlights && historyFlights.length && historyFlights[0].firstSeen) {
        html += fiCell("Departed", fmtHistTime(historyFlights[0].firstSeen));
      }
      html += "</div>";
    } else {
      html += '<div class="fi-sub">Waiting for the aircraft to appear in the live feed…</div>';
    }
    if (historyFlights && historyFlights.length) {
      html += '<div class="fi-sub" style="margin-top:8px; letter-spacing:0.14em; text-transform:uppercase;">Recent flights (30 days)</div>';
      historyFlights.slice(0, 12).forEach(function (f) {
        html += '<div class="fi-sub mono">' +
          (f.dep || "????") + " → " + (f.arr || "????") +
          " · " + fmtHistTime(f.firstSeen) + " – " + fmtHistTime(f.lastSeen) +
          "</div>";
      });
    }
    el.innerHTML = html;
    el.style.display = "";
  }

  // Recomputes the live view from saved settings + remote overrides + any
  // tracked aircraft. Returns true when the viewport actually moved.
  function applyView() {
    const preset = remote.region ? REGION_PRESETS[remote.region] : null;
    let lat = preset ? preset.lat : MAP_LAT;
    let lon = preset ? preset.lon : MAP_LON;
    let zoom = remote.zoom !== null && remote.zoom !== undefined
      ? remote.zoom
      : (preset ? preset.zoom : MAP_ZOOM);
    // airport view overrides region/saved; a tracked aircraft overrides both
    const airport = remote.airport ? findAirportByCode(remote.airport) : null;
    if (airport) {
      lat = airport[3];
      lon = airport[4];
      zoom = remote.zoom !== null && remote.zoom !== undefined ? remote.zoom : AIRPORT_VIEW_ZOOM;
    }
    const tracked = findTracked();
    if (tracked) {
      lat = tracked.lat;
      lon = tracked.lon;
      zoom = Math.max(zoom, 8);
    }
    const changed = lat !== viewLat || lon !== viewLon || zoom !== viewZoom;
    viewLat = lat; viewLon = lon; viewZoom = zoom;
    if (changed) scheduleDraw();
    return changed;
  }

  // Focus/expand: hide every panel except the target ("financial" = revenue
  // with wall-sized figures; "map" keeps the nearby list). JS-driven so it
  // works with any free-form layout.
  function applyFocus() {
    const main = document.querySelector(".main");
    if (!main) return;
    const focus = remote.focus || "none";
    main.setAttribute("data-focus", focus);
    const cols = main.querySelectorAll(":scope > .col");
    if (focus === "none") {
      applyLayoutVisibility();
      main.style.gridTemplateColumns = "";
      cols.forEach((c) => { c.style.display = ""; });
      return;
    }
    const target = focus === "financial" ? "revenue" : focus;
    document.querySelectorAll("[data-panel]").forEach((el) => {
      const key = el.getAttribute("data-panel");
      const show = key === target || (target === "map" && key === "nearby");
      el.style.display = show ? "" : "none";
    });
    cols.forEach((c) => {
      const panels = c.querySelectorAll("[data-panel]");
      let any = false;
      panels.forEach((el) => { if (el.style.display !== "none") any = true; });
      c.style.display = any ? "" : "none";
    });
    main.style.gridTemplateColumns = "1fr";
  }

  function applyRemote(prev) {
    // theme override (auto = fall back to OS preference handling)
    if (remote.theme === "dark" || remote.theme === "light") {
      root.setAttribute("data-theme", remote.theme);
    } else {
      root.removeAttribute("data-theme");
    }

    applyFocus();

    // switching tracked aircraft resets the trail + route/history lookups
    if (prev && prev.trackTail !== remote.trackTail) {
      trackTrail = [];
      routeInfo = null;
      routeInfoFor = null;
      historyPath = null;
      historyFlights = null;
      historyFor = null;
      renderTrackInfo();
      loadRouteInfo();
      loadHistory();
    }

    const moved = applyView();
    // focus changes resize the canvas box; re-measure either way (cheap)
    sizeCanvas();
    scheduleDraw();
    const viewChanged = prev && (prev.region !== remote.region || prev.airport !== remote.airport || prev.zoom !== remote.zoom || prev.trackTail !== remote.trackTail);
    if (moved || viewChanged) {
      loadFlights().catch(function () {});
    }
  }

  async function pollRemote() {
    try {
      const res = await fetch(REMOTE_URL, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.state) return;
      const prev = remote;
      remote = data.state;
      // a bumped nonce is the remote's "Reload Display" button
      if (baselineNonce === null) {
        baselineNonce = remote.refreshNonce || 0;
      } else if ((remote.refreshNonce || 0) !== baselineNonce) {
        location.reload();
        return;
      }
      applyRemote(prev);
    } catch (err) {
      // remote channel unreachable — display keeps its last state
    }
  }
  pollRemote();
  setInterval(pollRemote, 4000);

  const FLIGHTS_POLL_MS = (typeof FW_CFG.flightsPollSeconds === "number" ? FW_CFG.flightsPollSeconds : 30) * 1000;
  const OPS_POLL_MS = (typeof FW_CFG.opsPollSeconds === "number" ? FW_CFG.opsPollSeconds : 30) * 1000;

  // 1 Hz animation tick — dead reckoning gives every aircraft continuous
  // 1-second position updates regardless of the data poll cadence.
  setInterval(function () { if (liveContacts.length) scheduleDraw(); }, 1000);

  // generic layout widgets refresh on the business-data cadence
  loadWidgets();
  setInterval(loadWidgets, OPS_POLL_MS);

  loadLive();
  // Flights refresh at their own cadence inside loadFlights(); loadLive()
  // itself is called on the slower of the two configured intervals so the
  // AMG business panel (usually the less time-sensitive of the two) doesn't
  // over-poll — flights stay fresh via loadFlights()'s own interval below.
  setInterval(loadLive, Math.max(FLIGHTS_POLL_MS, OPS_POLL_MS));
  if (FLIGHTS_POLL_MS < OPS_POLL_MS) {
    setInterval(loadFlights, FLIGHTS_POLL_MS);
  }
})();
</script>

</head>
<body></body>
</html>
`;
