import {
  crewAirportGlobeMarkers,
  crewAirportMarkerStats,
  type CrewAirportCoverageMarker,
} from "@/lib/crew-airport-globe-markers";

export type CrewGlobeMarker = CrewAirportCoverageMarker;

export const crewGlobeMarkers = crewAirportGlobeMarkers;

export const crewRegionCount = new Set(
  crewAirportGlobeMarkers
    .map((marker) => {
      const parts = marker.sourceLocation.split(",");
      return parts[parts.length - 1]?.trim();
    })
    .filter(Boolean),
).size;

export const crewGlobeStats = crewAirportMarkerStats;

export const publicCrewCoverageMetrics = [
  { label: "Crew Count", value: "70" },
  { label: "Total Crew Flight Hours", value: "837,028 Hours" },
  { label: "States With Crew Coverage", value: "48" },
] as const;

export const featuredCrewRegions = [
  "Florida",
  "Texas",
  "Northeast",
  "Midwest",
  "West Coast",
  "Mountain West",
];
