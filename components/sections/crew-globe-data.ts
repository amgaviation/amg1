import type { GlobeMarker } from "@/components/ui/3d-globe";
import { CREW_LOCATION_SEEDS } from "@/lib/crew-location-seeds";

const markerSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="65%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.45" stop-color="#7fb7ff"/>
      <stop offset="1" stop-color="#2f6bae"/>
    </radialGradient>
  </defs>
  <circle cx="16" cy="16" r="13" fill="url(#g)" opacity="0.95"/>
  <circle cx="16" cy="16" r="5" fill="#f8fafc"/>
</svg>
`);

export const CREW_MARKER_SRC = `data:image/svg+xml,${markerSvg}`;

export type CrewGlobeMarker = GlobeMarker & {
  id: string;
  city: string;
  state?: string;
  country: string;
  region?: string;
  baseAirport?: string;
  role?: string;
  aircraftExperience?: string[];
};

export const crewGlobeMarkers: CrewGlobeMarker[] = CREW_LOCATION_SEEDS.filter(
  (seed) => typeof seed.lat === "number" && typeof seed.lng === "number",
).map((seed) => ({
  id: seed.id,
  lat: seed.lat as number,
  lng: seed.lng as number,
  src: CREW_MARKER_SRC,
  label: seed.publicLabel,
  city: seed.city,
  state: seed.state,
  country: seed.country,
  region: seed.region,
  baseAirport: seed.baseAirport,
  role: seed.role,
  aircraftExperience: seed.aircraftExperience,
  size: 0.07,
}));

export const crewRegionCount = new Set(
  crewGlobeMarkers.map((marker) => marker.region).filter(Boolean),
).size;

export const featuredCrewRegions = [
  "South Florida",
  "Northeast",
  "Texas",
  "West Coast",
  "Southeast",
  "Mountain West",
];
