"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@/lib/supabase/client";
import {
  type AdminPin,
  type CrewAirportRollup,
  type ClientAggregates,
  type MapVariant,
  type MapBlip,
  blipsFor,
  activeStatesFor,
  blipStatus,
  minutesLeft,
  fmtHours,
} from "@/lib/portal/crew-map-view";
import { MapLegend } from "@/components/portal/crew-map/widgets";
import { cn } from "@/lib/utils";

/**
 * Live crew map — a tile-free vector US choropleth (states drawn from a vendored
 * GeoJSON, no external basemap). Active states are shaded #308aff; crew appear as
 * glowing count blips whose colour reflects how soon their session expires. The
 * tier (admin identities / crew counts / client state aggregates) is enforced by
 * the RPCs server-side. Re-fetches on the DB "presence_changed" broadcast.
 */

const ACCENT = "#308aff";
const CONUS: [[number, number], [number, number]] = [
  [-125, 24],
  [-66.9, 49.5],
];

type ThemeColors = {
  canvas: string;
  panel: string;
  line: string;
  lineStrong: string;
};

function readThemeColors(root: HTMLElement | null): ThemeColors {
  const fallback: ThemeColors = { canvas: "#f4f6fb", panel: "#ffffff", line: "#e4e8f0", lineStrong: "#d3d9e6" };
  if (!root) return fallback;
  const s = getComputedStyle(root);
  const get = (name: string, fb: string) => (s.getPropertyValue(name).trim() || fb);
  return {
    canvas: get("--deck-canvas", fallback.canvas),
    panel: get("--deck-panel", fallback.panel),
    line: get("--deck-line", fallback.line),
    lineStrong: get("--deck-line-strong", fallback.lineStrong),
  };
}

function blipSizePx(count: number, max: number): number {
  const t = max > 1 ? Math.min(1, Math.log(1 + count) / Math.log(1 + max)) : count > 0 ? 1 : 0;
  return Math.round(34 + t * 34); // 34–68px glow
}

export function CrewMap({
  variant,
  initialAdmin,
  initialCrew,
  initialClient,
}: {
  variant: MapVariant;
  initialAdmin?: AdminPin[];
  initialCrew?: CrewAirportRollup[];
  initialClient?: ClientAggregates;
}) {
  const router = useRouter();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const labelMarkersRef = useRef<maplibregl.Marker[]>([]);
  const refreshAt = useRef(0);
  const [ready, setReady] = useState(false);
  const [, setMoveTick] = useState(0);
  const [fit, setFit] = useState<"usa" | "active">("usa");
  const [hovered, setHovered] = useState<MapBlip | null>(null);

  const [admin, setAdmin] = useState<AdminPin[]>(initialAdmin ?? []);
  const [crew, setCrew] = useState<CrewAirportRollup[]>(initialCrew ?? []);
  const [client, setClient] = useState<ClientAggregates | undefined>(initialClient);
  const supabase = useMemo(() => createClient(), []);

  const blips = useMemo(() => blipsFor(variant, { admin, crew, client }), [variant, admin, crew, client]);
  const activeStates = useMemo(
    () => activeStatesFor(variant, { admin, crew, client }),
    [variant, admin, crew, client]
  );
  const onlineTotal =
    variant === "admin" ? admin.length : variant === "crew" ? crew.reduce((s, a) => s + a.active_count, 0) : client?.online_count ?? 0;

  // ── Init the vector map (once) ──────────────────────────────────────────
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const root = mapEl.current.closest(".amg-portal") as HTMLElement | null;
    const colors = readThemeColors(root);
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "bg", type: "background", paint: { "background-color": colors.canvas } }],
      },
      bounds: CONUS,
      fitBoundsOptions: { padding: 28 },
      dragRotate: false,
      attributionControl: false,
      maxZoom: 9,
      minZoom: 2.5,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    const onMove = () => setMoveTick((t) => (t + 1) % 100000);
    map.on("move", onMove);

    map.on("load", async () => {
      try {
        const res = await fetch("/geo/us-states.geojson");
        const geo = await res.json();
        if (!mapRef.current) return;
        map.addSource("states", { type: "geojson", data: geo });
        map.addLayer({
          id: "states-fill",
          type: "fill",
          source: "states",
          paint: { "fill-color": colors.panel, "fill-opacity": 0.55 },
        });
        map.addLayer({
          id: "states-active",
          type: "fill",
          source: "states",
          filter: ["in", ["get", "code"], ["literal", []]],
          paint: { "fill-color": ACCENT, "fill-opacity": 0.16 },
        });
        map.addLayer({
          id: "states-line",
          type: "line",
          source: "states",
          paint: { "line-color": colors.lineStrong, "line-width": 0.7, "line-opacity": 0.7, "line-dasharray": [2, 2] },
        });
        map.addLayer({
          id: "states-active-line",
          type: "line",
          source: "states",
          filter: ["in", ["get", "code"], ["literal", []]],
          paint: { "line-color": ACCENT, "line-width": 1.1, "line-opacity": 0.5 },
        });
        setReady(true);
      } catch {
        setReady(true); // still show blips even if the outline fails
      }
    });

    // Re-paint canvas layers on portal theme change (markers are CSS-var driven).
    const obs = new MutationObserver(() => {
      const c = readThemeColors(root);
      if (!mapRef.current) return;
      map.setPaintProperty("bg", "background-color", c.canvas);
      if (map.getLayer("states-fill")) map.setPaintProperty("states-fill", "fill-color", c.panel);
      if (map.getLayer("states-line")) map.setPaintProperty("states-line", "line-color", c.lineStrong);
    });
    if (root) obs.observe(root, { attributes: true, attributeFilter: ["data-portal-theme"] });

    return () => {
      obs.disconnect();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Refetch this tier's data (keeps existing data on error) ─────────────
  async function refetch() {
    const db = supabase as any;
    if (variant === "admin") {
      const { data, error } = await db.rpc("rpc_map_admin");
      if (error) return;
      setAdmin((data ?? []) as AdminPin[]);
    } else if (variant === "crew") {
      const { data, error } = await db.rpc("rpc_map_crew");
      if (error) return;
      setCrew((data ?? []) as CrewAirportRollup[]);
    } else {
      const { data, error } = await db.rpc("rpc_map_client");
      if (error) return;
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setClient({
          total_online_hours: Number(row.total_online_hours ?? 0),
          online_count: Number(row.online_count ?? 0),
          by_state: (row.by_state ?? []) as ClientAggregates["by_state"],
          type_ratings_online: (row.type_ratings_online ?? []) as string[],
        });
      }
    }
  }

  // ── Live updates: refetch blips + throttled refresh of server widgets ───
  useEffect(() => {
    const channel = supabase
      .channel("crew-presence")
      .on("broadcast", { event: "presence_changed" }, () => {
        refetch();
        const now = Date.now();
        if (now - refreshAt.current > 4000) {
          refreshAt.current = now;
          router.refresh();
        }
      })
      .subscribe();
    const t = setTimeout(refetch, 800);
    return () => {
      clearTimeout(t);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  // ── Shade active states ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const filter = ["in", ["get", "code"], ["literal", activeStates]] as any;
    if (map.getLayer("states-active")) map.setFilter("states-active", filter);
    if (map.getLayer("states-active-line")) map.setFilter("states-active-line", filter);
  }, [activeStates, ready]);

  // ── State-name labels ───────────────────────────────────────────────────
  // In the client tier the crew blips sit on state centroids, so hide the
  // abbreviation under any state that has a blip (otherwise they collide).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;
    (async () => {
      const { US_STATE_CENTROIDS } = await import("@/lib/portal/us-geo");
      if (cancelled || !mapRef.current) return;
      labelMarkersRef.current.forEach((m) => m.remove());
      labelMarkersRef.current = [];
      const hide = variant === "client" ? new Set(activeStates) : new Set<string>();
      for (const [code, c] of Object.entries(US_STATE_CENTROIDS)) {
        if (hide.has(code)) continue;
        const el = document.createElement("div");
        el.className = "crew-state-label";
        el.textContent = code;
        labelMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat(c as [number, number]).addTo(map));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, variant, activeStates]);

  // ── Draw crew/state blips ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const max = blips.reduce((m, b) => Math.max(m, b.count), 0);
    for (const b of blips) {
      const el = document.createElement("div");
      el.className = cn("crew-blip", `is-${blipStatus(b.soonestExpiresAt)}`);
      el.style.setProperty("--blip-size", `${blipSizePx(b.count, max)}px`);
      el.innerHTML = `<span class="crew-blip-glow"></span><span class="crew-blip-dot">${b.count}</span>`;
      el.addEventListener("mouseenter", () => setHovered(b));
      el.addEventListener("mouseleave", () => setHovered((h) => (h?.key === b.key ? null : h)));
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setHovered((h) => (h?.key === b.key ? null : b));
      });
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([b.lng, b.lat]).addTo(map));
    }
    // clear a stale hover if its blip disappeared
    setHovered((h) => (h && blips.some((b) => b.key === h.key) ? h : null));
  }, [blips, ready]);

  // ── Fit toggle ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (fit === "usa" || blips.length === 0) {
      map.fitBounds(CONUS, { padding: 28, duration: 600 });
      return;
    }
    const lngs = blips.map((b) => b.lng);
    const lats = blips.map((b) => b.lat);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 90, maxZoom: 7, duration: 600 });
  }, [fit, ready, blips]);

  // ── Hover card position ─────────────────────────────────────────────────
  const cardPos = useMemo(() => {
    const map = mapRef.current;
    const container = mapEl.current;
    if (!map || !container || !hovered) return null;
    const p = map.project([hovered.lng, hovered.lat]);
    const W = container.clientWidth;
    const H = container.clientHeight;
    const cardW = 260;
    let left = p.x + 18;
    if (left + cardW > W - 8) left = p.x - cardW - 18;
    left = Math.max(8, Math.min(left, W - cardW - 8));
    let top = p.y - 20;
    top = Math.max(8, Math.min(top, H - 150));
    return { left, top };
  }, [hovered]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--deck-line)] bg-[var(--deck-canvas)]">
      <div ref={mapEl} className="h-[60vh] min-h-[24rem] w-full" />

      {/* overlay: online badge + LIVE */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
        <div className="rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)]/90 px-3 py-1.5 text-xs font-semibold text-[var(--deck-text)] shadow-sm backdrop-blur">
          <span className="deck-num">{onlineTotal}</span> crew online
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-[var(--deck-success-line)] bg-[var(--deck-success-tint)] px-2.5 py-1 text-[0.62rem] font-bold uppercase text-[var(--deck-success)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--deck-success)]" />
          Live
        </span>
      </div>

      {/* overlay: legend + fit toggle */}
      <div className="absolute right-14 top-3 flex flex-col items-end gap-2">
        <div className="inline-flex overflow-hidden rounded-lg border border-[var(--deck-line)] bg-[var(--deck-panel)]/90 text-xs shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setFit("usa")}
            className={cn(
              "px-2.5 py-1 font-semibold transition-colors",
              fit === "usa" ? "bg-[var(--deck-accent)] text-white" : "text-[var(--deck-text-2)] hover:text-[var(--deck-text)]"
            )}
          >
            Full USA
          </button>
          <button
            type="button"
            onClick={() => setFit("active")}
            className={cn(
              "px-2.5 py-1 font-semibold transition-colors",
              fit === "active" ? "bg-[var(--deck-accent)] text-white" : "text-[var(--deck-text-2)] hover:text-[var(--deck-text)]"
            )}
          >
            Active states
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)]/90 px-3 py-1.5 shadow-sm backdrop-blur">
        <MapLegend />
      </div>

      {/* hover / tap card */}
      {hovered && cardPos ? <HoverCard blip={hovered} variant={variant} pos={cardPos} /> : null}
    </div>
  );
}

function statusMeta(blip: MapBlip): { text: string; color: string } {
  if (blip.kind === "state") return { text: "Vetted crew available now", color: "var(--deck-accent)" };
  const s = blipStatus(blip.soonestExpiresAt);
  if (s === "critical") return { text: "Session ending soon", color: "var(--deck-danger)" };
  if (s === "warning") return { text: "Session expiring soon", color: "var(--deck-warn)" };
  return { text: "Available for assignment", color: "var(--deck-accent)" };
}

function HoverCard({ blip, variant, pos }: { blip: MapBlip; variant: MapVariant; pos: { left: number; top: number } }) {
  const st = statusMeta(blip);
  const soonest = minutesLeft(blip.soonestExpiresAt);
  return (
    <div
      className="pointer-events-none absolute z-20 w-[260px]"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="deck-card rounded-xl border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] p-3.5 shadow-[var(--deck-shadow-card-hover)]">
        <p className="text-sm font-semibold leading-tight text-[var(--deck-text)]">{blip.title}</p>
        {blip.sub ? <p className="mt-0.5 text-xs text-[var(--deck-text-3)]">{blip.sub}</p> : null}

        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: st.color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: st.color }} />
          {st.text}
        </p>

        <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-[var(--deck-line)] pt-2.5">
          <CardStat label="Crew" value={blip.count} />
          {blip.hours != null ? <CardStat label="Hours" value={fmtHours(blip.hours)} /> : null}
          {blip.kind === "airport" && soonest != null ? (
            <CardStat label="Soonest" value={`${Math.max(0, soonest)}m`} />
          ) : blip.kind === "state" ? (
            <CardStat label="State" value={blip.state ?? "—"} />
          ) : null}
        </div>

        {variant === "admin" && blip.crew.length ? (
          <ul className="mt-2.5 grid gap-1 border-t border-[var(--deck-line)] pt-2.5">
            {blip.crew.slice(0, 3).map((c, i) => {
              const m = minutesLeft(c.expiresAt);
              return (
                <li key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-[var(--deck-text)]">{c.name}</span>
                  <span className="deck-num shrink-0 text-[var(--deck-text-3)]">{m != null ? `${Math.max(0, m)}m` : "—"}</span>
                </li>
              );
            })}
            {blip.crew.length > 3 ? (
              <li className="text-[0.7rem] text-[var(--deck-text-3)]">+{blip.crew.length - 3} more crew</li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function CardStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[0.58rem] font-bold uppercase text-[var(--deck-text-3)]">{label}</p>
      <p className="deck-num mt-0.5 text-sm font-semibold text-[var(--deck-text)]">{value}</p>
    </div>
  );
}
