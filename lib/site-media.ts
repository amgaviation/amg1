/**
 * Central media map for the AMG Operations Command public site.
 * Single source of truth so aircraft categories always resolve to a correct,
 * matching image (no piston/prop imagery on jet cards) and pages share a
 * consistent set of crops. All assets live in /public/images/amg-custom.
 */

const BASE = "/images/amg-custom";

export const IMG = {
  heroOperations: `${BASE}/hero-aircraft-operations.jpg`,
  aircraftSupportMain: `${BASE}/aircraft-support-main.jpg`,
  servicesHero: `${BASE}/services-hero.jpg`,
  aboutOperations: `${BASE}/about-amg-operations.jpg`,
  contactSupport: `${BASE}/contact-support.jpg`,
  crewCredentials: `${BASE}/crew-credentials.jpg`,
  pilotNetwork: `${BASE}/pilot-network.jpg`,
  pilotPreflight: `${BASE}/pilot-preflight.jpg`,
  cockpitDetail: `${BASE}/cockpit-detail.jpg`,
  mapNetwork: `${BASE}/map-network.jpg`,
  ctaRunway: `${BASE}/global-cta-runway.jpg`,
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
  "single-engine-piston": `${BASE}/aircraft-single-engine-piston.jpg`,
  "multi-engine-piston": `${BASE}/aircraft-multi-engine-piston.jpg`,
  turboprop: `${BASE}/aircraft-turboprop.jpg`,
  "single-engine-jet-vlj": `${BASE}/aircraft-single-engine-jet-vlj.jpg`,
  "light-jet": `${BASE}/aircraft-light-jet.jpg`,
  "midsize-jet": `${BASE}/aircraft-midsize-jet.jpg`,
  "super-midsize-jet": `${BASE}/aircraft-super-midsize-jet.jpg`,
  "large-cabin-heavy-jet": `${BASE}/aircraft-large-cabin-heavy-jet.jpg`,
  helicopter: `${BASE}/aircraft-helicopter.jpg`,
};

export function getAircraftImage(id: string): string {
  return AIRCRAFT_IMAGES[id] ?? IMG.aircraftSupportMain;
}

export function getServiceImage(id: string): string {
  return SERVICE_IMAGES[id] ?? IMG.servicesHero;
}
