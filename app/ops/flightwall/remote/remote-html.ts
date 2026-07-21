// AMG FlightWall remote control — self-contained HTML (inline CSS/JS) for
// /ops/flightwall/remote. Phone-friendly button deck that drives the wall
// display live through /api/flightwall/remote (the display polls the same
// state). Same access gate as the dashboard: trusted house IP or admin login.
export const remoteHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>FlightWall Remote — AMG Aviation Group</title>
<style>
  :root {
    --bg: #050b14;
    --panel: #0a1220;
    --panel-2: #0d1626;
    --line: #1c2a3f;
    --text: #ffffff;
    --dim: #6b7280;
    --mid: #9aa4b2;
    --blue: #1d4ed8;
    --sky: #38bdf8;
    --gold: #d4af37;
    --good: #2f9e6e;
    --red: #dc2626;
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: Inter, "Helvetica Neue", Arial, system-ui, sans-serif;
  }
  .wrap { max-width: 560px; margin: 0 auto; padding: 18px 14px 40px; }
  header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
  h1 { font-size: 18px; margin: 0; letter-spacing: 0.02em; }
  .sub { font-size: 11px; color: var(--dim); letter-spacing: 0.18em; text-transform: uppercase; }
  .status { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--mid); margin-bottom: 14px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dim); }
  .dot.ok { background: var(--good); }
  .dot.err { background: var(--red); }
  section {
    background: var(--panel); border: 1px solid var(--line); border-radius: 8px;
    padding: 14px; margin-bottom: 12px;
  }
  .label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--dim); margin-bottom: 10px; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .grid.g2 { grid-template-columns: repeat(2, 1fr); }
  button {
    appearance: none; border: 1px solid var(--line); border-radius: 7px;
    background: var(--panel-2); color: var(--text); font: inherit; font-size: 13px;
    padding: 12px 8px; cursor: pointer; letter-spacing: 0.02em;
  }
  button:active { transform: scale(0.985); }
  button.active { border-color: var(--sky); color: var(--sky); box-shadow: inset 0 0 0 1px var(--sky); }
  button.gold.active { border-color: var(--gold); color: var(--gold); box-shadow: inset 0 0 0 1px var(--gold); }
  button.danger { border-color: #47222b; color: #f0a9b0; }
  .row { display: flex; gap: 8px; }
  input[type="text"] {
    flex: 1; min-width: 0; background: var(--panel-2); border: 1px solid var(--line);
    border-radius: 7px; color: var(--text); font: inherit; font-size: 14px;
    padding: 12px; text-transform: uppercase; letter-spacing: 0.06em;
  }
  input[type="text"]:focus { outline: none; border-color: var(--sky); }
  .tracknote { margin-top: 8px; font-size: 12px; color: var(--mid); min-height: 16px; }
  .tracknote b { color: var(--gold); font-weight: 600; }
  .foot { font-size: 11px; color: var(--dim); text-align: center; margin-top: 18px; line-height: 1.7; }
  .foot a { color: var(--mid); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <p class="sub">AMG Operations</p>
      <h1>FlightWall Remote</h1>
    </div>
    <div class="status"><span class="dot" id="connDot"></span><span id="connLabel">Connecting…</span></div>
  </header>

  <section>
    <p class="label">Display View</p>
    <div class="grid">
      <button data-focus="none">Full Wall</button>
      <button data-focus="map">Map</button>
      <button data-focus="requests">Requests</button>
      <button data-focus="missions">Missions</button>
      <button data-focus="revenue">Revenue</button>
      <button data-focus="financial" class="gold">Financial</button>
    </div>
  </section>

  <section>
    <p class="label">Track Aircraft</p>
    <div class="row">
      <input type="text" id="tailInput" placeholder="Tail # e.g. N721AM" maxlength="10" autocapitalize="characters" autocomplete="off" />
      <button id="trackBtn" class="gold" style="flex:0 0 auto; padding: 12px 18px;">Track</button>
      <button id="clearTrackBtn" style="flex:0 0 auto; padding: 12px 14px;">Clear</button>
    </div>
    <p class="tracknote" id="trackNote"></p>
  </section>

  <section>
    <p class="label">Map Region</p>
    <div class="grid">
      <button data-region="">Saved Default</button>
      <button data-region="florida">Florida</button>
      <button data-region="usa">USA</button>
      <button data-region="northeast">Northeast</button>
      <button data-region="southeast">Southeast</button>
      <button data-region="gulf">Gulf Coast</button>
    </div>
    <p class="label" style="margin-top: 14px;">Go To Airport</p>
    <div class="row">
      <input type="text" id="airportInput" placeholder="ICAO / IATA e.g. KMIA or MIA" maxlength="4" autocapitalize="characters" autocomplete="off" />
      <button id="airportBtn" style="flex:0 0 auto; padding: 12px 18px;">Go</button>
    </div>
    <p class="tracknote" id="airportNote"></p>
    <p class="label" style="margin-top: 14px;">Map Zoom</p>
    <div class="grid">
      <button id="zoomOut">− Zoom Out</button>
      <button id="zoomReset">Auto</button>
      <button id="zoomIn">+ Zoom In</button>
    </div>
  </section>

  <section>
    <p class="label">Theme</p>
    <div class="grid">
      <button data-theme="auto">Auto</button>
      <button data-theme="dark">Dark</button>
      <button data-theme="light">Light</button>
    </div>
  </section>

  <section>
    <p class="label">Display</p>
    <div class="grid g2">
      <button id="refreshBtn" class="danger">Reload Display</button>
      <button id="resetBtn">Reset Remote</button>
    </div>
  </section>

  <p class="foot">
    The wall display applies changes within a few seconds.<br />
    <a href="/ops/flightwall" target="_blank" rel="noopener">Open dashboard</a> ·
    <a href="/portal/admin/settings/flightwall">Dashboard settings</a>
  </p>
</div>

<script>
(function () {
  "use strict";
  const API = "/api/flightwall/remote";
  const SAVED_ZOOM = window.FW_REMOTE_DEFAULT_ZOOM || 6;
  const REGION_ZOOMS = window.FW_REGION_ZOOMS || {};
  const AIRPORTS = window.FW_AIRPORTS || []; // [icao, iata, name, lat, lon, tier]
  const AIRPORT_ZOOM = 9; // display's default zoom for an airport view
  let state = { focus: "none", trackTail: null, theme: "auto", region: null, airport: null, zoom: null, refreshNonce: 0 };
  let pending = false;

  function findAirport(code) {
    if (!code) return null;
    for (let i = 0; i < AIRPORTS.length; i++) {
      if (AIRPORTS[i][0] === code || AIRPORTS[i][1] === code) return AIRPORTS[i];
    }
    return null;
  }

  // What the display is actually zoomed to when no override is set — the
  // zoom buttons step one level from HERE (stepping from the saved default
  // while a region/airport view is active caused multi-level jumps).
  function effectiveZoom() {
    if (state.zoom !== null && state.zoom !== undefined) return state.zoom;
    if (state.airport) return AIRPORT_ZOOM;
    if (state.region && REGION_ZOOMS[state.region]) return REGION_ZOOMS[state.region];
    return SAVED_ZOOM;
  }

  function setConn(ok, label) {
    document.getElementById("connDot").className = "dot " + (ok ? "ok" : "err");
    document.getElementById("connLabel").textContent = label;
  }

  function render() {
    document.querySelectorAll("[data-focus]").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-focus") === state.focus);
    });
    document.querySelectorAll("[data-theme]").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-theme") === state.theme);
    });
    document.querySelectorAll("[data-region]").forEach((b) => {
      b.classList.toggle("active", (b.getAttribute("data-region") || null) === state.region && !state.airport);
    });
    document.getElementById("zoomReset").classList.toggle("active", state.zoom === null);
    document.getElementById("airportBtn").classList.toggle("active", !!state.airport);
    const ap = findAirport(state.airport);
    document.getElementById("airportNote").innerHTML = state.airport
      ? (ap ? 'Viewing <b>' + ap[0] + "</b> — " + ap[2] : 'Viewing <b>' + state.airport + "</b>")
      : "";
    document.getElementById("trackBtn").classList.toggle("active", !!state.trackTail);
    document.getElementById("trackNote").innerHTML = state.trackTail
      ? 'Tracking <b>' + state.trackTail + "</b> — map follows it when it appears in the feed."
      : "Not tracking. The map uses its configured view.";
  }

  async function send(patch) {
    pending = true;
    try {
      const res = await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (!res.ok) throw new Error("status " + res.status);
      const data = await res.json();
      if (data.state) state = data.state;
      setConn(true, "Connected");
    } catch (err) {
      setConn(false, "Send failed — retrying");
    } finally {
      pending = false;
      render();
    }
  }

  async function poll() {
    if (pending) return;
    try {
      const res = await fetch(API, { credentials: "include" });
      if (!res.ok) throw new Error("status " + res.status);
      const data = await res.json();
      if (data.state && !pending) { state = data.state; render(); }
      setConn(true, "Connected");
    } catch (err) {
      setConn(false, "Offline");
    }
  }

  document.querySelectorAll("[data-focus]").forEach((b) => {
    b.addEventListener("click", () => send({ focus: b.getAttribute("data-focus") }));
  });
  document.querySelectorAll("[data-theme]").forEach((b) => {
    b.addEventListener("click", () => send({ theme: b.getAttribute("data-theme") }));
  });
  document.querySelectorAll("[data-region]").forEach((b) => {
    b.addEventListener("click", () => {
      const r = b.getAttribute("data-region");
      // a region view replaces any airport view and clears the zoom override
      // so each preset opens at its own natural zoom; "Saved Default" clears
      // everything back to the saved settings view
      send(r ? { region: r, airport: null, zoom: null } : { region: null, airport: null, zoom: null });
    });
  });

  document.getElementById("airportBtn").addEventListener("click", () => {
    const code = document.getElementById("airportInput").value.trim().toUpperCase();
    if (!code) return;
    const ap = findAirport(code);
    if (!ap) {
      document.getElementById("airportNote").textContent = "Unknown code “" + code + "” — try the ICAO (K···) or IATA code of a major US airport.";
      return;
    }
    send({ airport: ap[0], region: null, zoom: null });
  });
  document.getElementById("airportInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("airportBtn").click();
  });

  document.getElementById("trackBtn").addEventListener("click", () => {
    const tail = document.getElementById("tailInput").value.trim().toUpperCase();
    if (tail) send({ trackTail: tail, focus: "map" });
  });
  document.getElementById("tailInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("trackBtn").click();
  });
  document.getElementById("clearTrackBtn").addEventListener("click", () => {
    document.getElementById("tailInput").value = "";
    send({ trackTail: null });
  });

  document.getElementById("zoomIn").addEventListener("click", () => {
    send({ zoom: Math.min(12, effectiveZoom() + 1) });
  });
  document.getElementById("zoomOut").addEventListener("click", () => {
    send({ zoom: Math.max(3, effectiveZoom() - 1) });
  });
  document.getElementById("zoomReset").addEventListener("click", () => send({ zoom: null }));

  document.getElementById("refreshBtn").addEventListener("click", () => {
    send({ refreshNonce: (state.refreshNonce || 0) + 1 });
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("tailInput").value = "";
    document.getElementById("airportInput").value = "";
    send({ focus: "none", trackTail: null, theme: "auto", region: null, airport: null, zoom: null });
  });

  poll();
  setInterval(poll, 5000);
})();
</script>
</body>
</html>
`;
