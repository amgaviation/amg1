/**
 * Central media map for the AMG Operations Command public site.
 * Single source of truth so aircraft categories always resolve to a correct,
 * matching image (no piston/prop imagery on jet cards) and pages share a
 * consistent set of crops.
 */

const BASE = "/images/amg-custom";
const GENERATED = "/images/amg-generated";

export const IMG = {
  generatedHeroPoster: `${GENERATED}/posters/amg-hero-hangar-dusk-poster.jpg`,
  generatedHeroVideo: "/videos/amg-generated/amg-hero-hangar-dusk-loop.mp4",
  generatedCrewMap: `${GENERATED}/backgrounds/crew-network-map-bg.jpg`,
  generatedConnectDashboard: `${GENERATED}/portal/amg-connect-dashboard-bg.jpg`,
  generatedDispatch: `${GENERATED}/backgrounds/operational-clarity-dispatch.jpg`,
  homeHangarDusk: `${BASE}/home-hangar-dusk.jpg`,
  heroOperations: `${BASE}/hero-aircraft-operations.jpg`,
  aircraftSupportMain: `${BASE}/aircraft-support-main.jpg`,
  servicesHero: `${BASE}/services-hero.jpg`,
  aboutOperations: `${BASE}/about-amg-operations.jpg`,
  contactSupport: `${BASE}/crew-credentials.jpg`,
  crewCredentials: `${BASE}/crew-credentials.jpg`,
  pilotNetwork: `${BASE}/pilot-network.jpg`,
  pilotPreflight: `${BASE}/pilot-preflight.jpg`,
  cockpitDetail: `${BASE}/cockpit-detail.jpg`,
  mapNetwork: `${BASE}/map-network.jpg`,
  ctaRunway: `${BASE}/services-hero.jpg`,
  runway: `${BASE}/runway.jpg`,
  plansSelector: `${BASE}/plans-aircraft-class-selector.jpg`,
  plansCrewLogistics: `${BASE}/plans-crew-logistics.jpg`,
} as const;

/** Service id (from content.ts SERVICES) -> editorial image. */
export const SERVICE_IMAGES: Record<string, string> = {
  "aircraft-management-support": `${BASE}/service-aircraft-management-support.jpg`,
  "contract-pilot-support": `${BASE}/service-contract-pilot-support.jpg`,
  "ferry-repositioning": `${BASE}/runway.jpg`,
  "maintenance-flight-support": `${BASE}/service-maintenance-flight-support.jpg`,
  "flight-operations-coordination": `${BASE}/service-flight-operations-coordination.jpg`,
  "fleet-support-programs": `${BASE}/service-fleet-support-program.jpg`,
};

/** Aircraft category id (from content.ts AIRCRAFT_CATEGORIES) -> matching image. */
export const AIRCRAFT_IMAGES: Record<string, string> = {
  "single-engine-piston": `${GENERATED}/aircraft/aircraft-piston-turboprop.jpg`,
  "multi-engine-piston": `${GENERATED}/aircraft/aircraft-piston-turboprop.jpg`,
  turboprop: `${GENERATED}/aircraft/aircraft-piston-turboprop.jpg`,
  "single-engine-jet-vlj": `${GENERATED}/aircraft/aircraft-single-engine-jet-vlj.jpg`,
  "light-jet": `${GENERATED}/aircraft/aircraft-light-jet.jpg`,
  "midsize-jet": `${GENERATED}/aircraft/aircraft-midsize-jet.jpg`,
  "super-midsize-jet": `${GENERATED}/aircraft/aircraft-super-midsize-heavy.jpg`,
  "large-cabin-heavy-jet": `${GENERATED}/aircraft/aircraft-super-midsize-heavy.jpg`,
  helicopter: `${BASE}/aircraft-helicopter.jpg`,
};

export function getAircraftImage(id: string): string {
  return AIRCRAFT_IMAGES[id] ?? IMG.aircraftSupportMain;
}

export function getServiceImage(id: string): string {
  return SERVICE_IMAGES[id] ?? IMG.servicesHero;
}
