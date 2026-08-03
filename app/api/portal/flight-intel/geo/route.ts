import { NextResponse } from "next/server";
import { requireApprovedPortalApiUser, privateJson } from "@/lib/portal/api-guard";
import { can } from "@/lib/portal/permissions";
import { fetchAirspaces, fetchObstacles, foreFlightConfigured } from "@/lib/foreflight/client";
import { listActiveTfrs } from "@/lib/portal/foreflight/queries";
import type { BoundingBox } from "@/lib/foreflight/types";

/**
 * Viewport-scoped GeoJSON for map layers.
 *
 * Airspace and obstacle data is fetched live from ForeFlight (its own client
 * caches reference data via Next's fetch cache); TFRs come from the stored
 * snapshot the sweep maintains, so the map and the Flight Intel board always
 * agree.
 *
 * Bounded deliberately: obstacle density over a wide box is enormous, so the
 * caller must pass a viewport and the layer must be zoomed in enough to be
 * worth drawing. The client's own MAX_PAGES is the only other backstop.
 */
export const dynamic = "force-dynamic";

/** Largest viewport we will serve obstacles for, in square degrees. */
const MAX_OBSTACLE_AREA_DEG2 = 12;
/** Largest viewport we will serve airspace for. Polygons are fewer and larger. */
const MAX_AIRSPACE_AREA_DEG2 = 120;

function parseBoundingBox(raw: string | null): BoundingBox | null {
  if (!raw) return null;
  const parts = raw.split(",").map((value) => Number(value.trim()));
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) return null;
  const [west, south, east, north] = parts;
  if (south > north) return null;
  return [west, south, east, north];
}

function boxArea(box: BoundingBox): number {
  const [west, south, east, north] = box;
  return Math.abs(east - west) * Math.abs(north - south);
}

export async function GET(request: Request) {
  const guard = await requireApprovedPortalApiUser();
  if ("response" in guard) return guard.response;
  if (!(await can(guard.user.role, "flight_intel", "view"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const layer = url.searchParams.get("layer");
  const box = parseBoundingBox(url.searchParams.get("bbox"));

  if (layer !== "airspaces" && layer !== "obstacles" && layer !== "tfrs") {
    return NextResponse.json({ error: "Unknown layer" }, { status: 400 });
  }

  // TFRs are national and already stored — no viewport needed, and the client
  // filters by what is on screen.
  if (layer === "tfrs") {
    const tfrs = await listActiveTfrs().catch(() => []);
    return privateJson({
      type: "FeatureCollection",
      features: tfrs.map((tfr) => ({
        type: "Feature" as const,
        geometry: tfr.geometry,
        properties: {
          ident: tfr.ident,
          label: tfr.label,
          tfrType: tfr.tfrType,
          stadium: tfr.stadiumTfr,
        },
      })),
    });
  }

  if (!box) {
    return NextResponse.json({ error: "A bbox of W,S,E,N is required" }, { status: 400 });
  }
  if (!foreFlightConfigured()) {
    // An empty collection, not an error: the map should render without layers
    // rather than showing a failure banner over a working map.
    return privateJson({ type: "FeatureCollection", features: [], unconfigured: true });
  }

  const area = boxArea(box);
  const cap = layer === "obstacles" ? MAX_OBSTACLE_AREA_DEG2 : MAX_AIRSPACE_AREA_DEG2;
  if (area > cap) {
    return privateJson({
      type: "FeatureCollection",
      features: [],
      zoomIn: true,
      message: "Zoom in to load this layer.",
    });
  }

  try {
    const features =
      layer === "obstacles"
        ? await fetchObstacles({ boundingBox: box, maxPages: 10 })
        : await fetchAirspaces({ boundingBox: box, maxPages: 10 });
    return privateJson({ type: "FeatureCollection", features });
  } catch (error) {
    console.error("[flight-intel/geo] fetch failed", layer, error);
    // Degrade to an empty layer rather than breaking the map.
    return privateJson({ type: "FeatureCollection", features: [], error: true });
  }
}
