/**
 * ForeFlight Advanced Aviation Developer Platform (AADP) response types.
 *
 * Hand-written from the published OpenAPI schema rather than generated: the
 * surface is five endpoints and twelve schemas, and the generated GeoJSON
 * unions are far noisier than the handful of shapes we actually consume.
 *
 * Pure types — safe to import anywhere (no "server-only", no fetch).
 */

/** Bounding box in the API's required [W, S, E, N] order (degrees). */
export type BoundingBox = [west: number, south: number, east: number, north: number];

export type Position = [longitude: number, latitude: number, ...rest: number[]];

export type PointGeometry = { type: "Point"; coordinates: Position };
export type LineStringGeometry = { type: "LineString"; coordinates: Position[] };
export type PolygonGeometry = { type: "Polygon"; coordinates: Position[][] };
export type MultiPointGeometry = { type: "MultiPoint"; coordinates: Position[] };
export type MultiPolygonGeometry = { type: "MultiPolygon"; coordinates: Position[][][] };

export type AerodromeGeometry =
  | PointGeometry
  | LineStringGeometry
  | PolygonGeometry
  | MultiPointGeometry;

/** Cursor envelope shared by the three paginated collection endpoints. */
type Paged = { metadata: { page_token?: string | null } };

// ─── Aerodromes ─────────────────────────────────────────────────────

export type AerodromeProperties = {
  aerodrome_element_type: "Aerodrome" | string;
  aerodrome_identifier: string;
  /** ISO 3166-1 alpha-3. */
  country: string;
  icao_identifier?: string;
  iata_identifier?: string | null;
  domestic_identifier?: string;
  name?: string;
  contact_details?: string;
  verified_status?: string;
};

export type RunwayProperties = {
  aerodrome_element_type: "Runway";
  aerodrome_identifier: string;
  runway_surface_identifier: string;
  runway_width: number;
  runway_surface_type: string;
  runways: {
    runway_identifier: string;
    /** 1 marks the approach end of the pair. */
    approach_end?: number;
    threshold_displacement?: number;
  }[];
};

export type HelipadProperties = {
  aerodrome_element_type: "Helipad";
  aerodrome_identifier: string;
  helipad_identifier: string;
  helipad_surface_type: string;
};

export type AerodromeFeature = {
  type: "Feature";
  id?: string | number;
  bbox?: number[];
  geometry: PointGeometry;
  properties: AerodromeProperties;
};

export type RunwayFeature = {
  type: "Feature";
  id?: string | number;
  bbox?: number[];
  geometry: AerodromeGeometry;
  properties: RunwayProperties;
};

export type HelipadFeature = {
  type: "Feature";
  id?: string | number;
  bbox?: number[];
  geometry: PointGeometry;
  properties: HelipadProperties;
};

export type AerodromeElementFeature = AerodromeFeature | RunwayFeature | HelipadFeature;

export type AerodromesResponse = Paged & {
  type: "FeatureCollection";
  features: AerodromeElementFeature[];
};

export function isAerodrome(feature: AerodromeElementFeature): feature is AerodromeFeature {
  return feature.properties.aerodrome_element_type === "Aerodrome";
}
export function isRunway(feature: AerodromeElementFeature): feature is RunwayFeature {
  return feature.properties.aerodrome_element_type === "Runway";
}
export function isHelipad(feature: AerodromeElementFeature): feature is HelipadFeature {
  return feature.properties.aerodrome_element_type === "Helipad";
}

// ─── Airspaces ──────────────────────────────────────────────────────

export type AirspaceFeature = {
  type: "Feature";
  id?: string | number;
  bbox?: number[];
  geometry: MultiPolygonGeometry;
  properties: {
    id: string;
    type: string;
    airspace_type?: string;
    multiple_code?: string;
    level?: string;
    lower_limit?: string;
    lower_limit_reference?: string;
    upper_limit?: string | null;
    upper_limit_reference?: string;
    time_code?: string;
    center_fix?: string;
    center_fix_type?: string;
    notes?: { title?: string; body?: string }[];
  };
};

export type AirspacesResponse = Paged & {
  type: "FeatureCollection";
  features: AirspaceFeature[];
};

// ─── Obstacles ──────────────────────────────────────────────────────

export type ObstacleFeature = {
  type: "Feature";
  bbox?: number[];
  geometry: PointGeometry;
  properties: {
    heightFtAgl: number;
    heightFtMsl: number;
    count: string | number;
    lightingType: string;
    obstacleType: string;
  };
};

export type ObstaclesResponse = Paged & {
  type: "FeatureCollection";
  features: ObstacleFeature[];
};

// ─── TFRs ───────────────────────────────────────────────────────────

/** One active window. Unix seconds, per the spec. */
export type TfrPeriod = { start: number; end: number };

export type TfrProperties = {
  ident: string;
  label: string;
  /** Full NOTAM prose. */
  text: string;
  type: string;
  dateIssued: string;
  lastUpdated: string;
  artcc: string;
  artccIdent: string;
  coordinatorType: string;
  locale: string;
  source: string;
  stadiumTFR: boolean;
  periods: TfrPeriod[];
  contactName?: string;
  contactInformation?: string;
  floor?: number;
  floorUnits?: string;
  ceiling?: number;
  ceilingUnits?: string;
  /**
   * Present in webhook delta payloads but absent from the GET /tfrs schema.
   * Declared optional so both shapes parse through one type.
   */
  tfrName?: string;
};

export type TfrFeature = {
  type: "Feature";
  bbox?: number[];
  geometry: PolygonGeometry;
  properties: TfrProperties;
};

/** Note: unlike the other collections, this one carries no `metadata` cursor. */
export type TfrsResponse = {
  type: "FeatureCollection";
  features: TfrFeature[];
};
