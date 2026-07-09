"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@/lib/supabase/client";
import type { AdminPin, CrewAirportRollup, ClientAggregates, MapVariant } from "@/lib/portal/crew-map";

/**
 * Live crew map. Renders the tier the caller is allowed to see (the RPCs
 * enforce it server-side): admin gets identifiable pins, crew gets per-airport
 * counts, client gets a coordinate-free aggregate panel. Re-fetches its own
 * tier's RPC whenever the DB broadcasts a "presence_changed" ping.
 */

const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

const US_CENTER: [number, number] = [-98.5, 39.5];

function fmtDuration(toIso: string): string {
  const ms = new Date(toIso).getTime() - Date.now();
  if (ms <= 0) return "expiring";
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function timeActive(sinceIso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(sinceIso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
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
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [admin, setAdmin] = useState<AdminPin[]>(initialAdmin ?? []);
  const [crew, setCrew] = useState<CrewAirportRollup[]>(initialCrew ?? []);
  const [client, setClient] = useState<ClientAggregates | undefined>(initialClient);
  const supabase = useMemo(() => createClient(), []);

  // Init map (client-only).
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: DARK_STYLE,
      center: US_CENTER,
      zoom: 3.4,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Refetch this tier's data. On any RPC error (transient network blip, auth not
  // yet hydrated, a momentary insufficient_privilege) keep the existing state
  // instead of blanking the map to zero — a failed ping must not erase good data.
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

  // Live updates: the DB broadcasts a ping on every presence change; refetch.
  useEffect(() => {
    const channel = supabase
      .channel("crew-presence")
      .on("broadcast", { event: "presence_changed" }, () => {
        refetch();
      })
      .subscribe();
    // Also refresh once shortly after mount to catch anything since SSR.
    const t = setTimeout(refetch, 800);
    return () => {
      clearTimeout(t);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  // Draw markers for admin / crew tiers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || variant === "client") return;
    const draw = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (variant === "admin") {
        for (const pin of admin) {
          const el = document.createElement("div");
          el.className = "crew-pin";
          const popup = new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
            `<div class="crew-pop">
               <strong>${escapeHtml(pin.full_name ?? "Crew")}</strong>
               <span>${escapeHtml(pin.airport_code)} · active ${timeActive(pin.started_at)}</span>
               ${pin.total_time != null ? `<span>${Number(pin.total_time).toLocaleString()} hrs total</span>` : ""}
               ${pin.type_ratings?.length ? `<span>${escapeHtml(pin.type_ratings.slice(0, 6).join(", "))}</span>` : ""}
               ${pin.phone ? `<span>${escapeHtml(pin.phone)}</span>` : ""}
               ${pin.email ? `<span>${escapeHtml(pin.email)}</span>` : ""}
             </div>`
          );
          markersRef.current.push(
            new maplibregl.Marker({ element: el }).setLngLat([pin.longitude, pin.latitude]).setPopup(popup).addTo(map)
          );
        }
      } else {
        for (const ap of crew) {
          const el = document.createElement("div");
          el.className = "crew-count";
          el.textContent = String(ap.active_count);
          el.title = `${ap.name ?? ap.airport_code} · ${ap.active_count} online`;
          markersRef.current.push(
            new maplibregl.Marker({ element: el }).setLngLat([ap.longitude, ap.latitude]).addTo(map)
          );
        }
      }
    };
    if (map.loaded()) {
      draw();
    } else {
      map.once("load", draw);
      return () => {
        map.off("load", draw);
      };
    }
  }, [admin, crew, variant]);

  const onlineTotal =
    variant === "admin" ? admin.length : variant === "crew" ? crew.reduce((s, a) => s + a.active_count, 0) : client?.online_count ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="relative overflow-hidden rounded-lg border border-[var(--deck-line)]">
        <div ref={mapEl} className="h-[62vh] min-h-[26rem] w-full" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-[var(--deck-line)] bg-[var(--deck-panel)]/90 px-3 py-1.5 text-xs font-semibold text-[var(--deck-text)] backdrop-blur">
          <span className="deck-num">{onlineTotal}</span> crew online
        </div>
      </div>

      {/* Side panel */}
      <aside className="grid content-start gap-3">
        {variant === "client" && client ? (
          <>
            <div className="deck-inset p-4">
              <p className="text-[0.66rem] font-bold uppercase [letter-spacing:0.14em] text-[var(--deck-text-3)]">
                Combined flight experience
              </p>
              <p className="deck-num mt-1 text-4xl font-bold text-[var(--deck-text)]">
                {Math.round(client.total_online_hours).toLocaleString()}
                <span className="ml-1.5 text-base font-semibold text-[var(--deck-text-3)]">hrs</span>
              </p>
              <p className="mt-1 text-sm text-[var(--deck-text-2)]">
                across {client.online_count} crew available now
              </p>
            </div>
            <div className="deck-inset p-4">
              <p className="text-[0.66rem] font-bold uppercase [letter-spacing:0.14em] text-[var(--deck-text-3)]">By state</p>
              <ul className="mt-2 grid gap-1.5">
                {client.by_state.length ? (
                  client.by_state.map((s) => (
                    <li key={s.state} className="flex items-center justify-between text-sm text-[var(--deck-text)]">
                      <span>{s.state}</span>
                      <span className="deck-num text-[var(--deck-text-2)]">
                        {s.count} · {Math.round(s.hours).toLocaleString()} hrs
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[var(--deck-text-3)]">No crew online right now.</li>
                )}
              </ul>
            </div>
            <div className="deck-inset p-4">
              <p className="text-[0.66rem] font-bold uppercase [letter-spacing:0.14em] text-[var(--deck-text-3)]">
                Type ratings online
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {client.type_ratings_online.length ? (
                  client.type_ratings_online.map((t) => (
                    <span key={t} className="rounded-full border border-[var(--deck-line-strong)] bg-[var(--deck-panel)] px-2.5 py-1 text-xs text-[var(--deck-text)]">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--deck-text-3)]">—</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="deck-inset p-4 text-sm text-[var(--deck-text-2)]">
            {variant === "admin"
              ? "Each pin is an available crew member. Click a pin for contact, ratings, and how long they've been active. Updates live."
              : "Each marker shows how many crew are available at that airport right now. Updates live."}
          </div>
        )}
      </aside>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
