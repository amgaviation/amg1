/**
 * Central media map for the AMG flight-deck public site.
 * Single source of truth so aircraft categories always resolve to a correct,
 * matching image and pages share one consistent, color-graded asset set.
 *
 * All assets are Higgsfield-generated for the flight-deck rebuild
 * (deep airspace navy grade, instrument-green ramp light, unmarked liveries).
 * The photographic top-down jet (mission deck) and hangar viewport (ops)
 * are referenced exclusively from components/flightdeck/* so the media
 * uniqueness audit can track them there.
 */

const FD = "/images/flightdeck";
const FD_VIDEO = "/videos/flightdeck";

export const IMG = {
  generatedHeroPoster: `${FD}/runway-dusk.webp`,
  generatedHeroVideo: `${FD_VIDEO}/jet-cruise-dusk.mp4`,
  generatedHangarDoor: `${FD}/runway-dusk.webp`,
  homeIntroCockpitDesktopAvif: `${FD}/cockpit-dusk.webp`,
  homeIntroCockpitDesktopWebp: `${FD}/cockpit-dusk.webp`,
  homeIntroCockpitMobileAvif: `${FD}/cockpit-dusk.webp`,
  homeIntroCockpitMobileWebp: `${FD}/cockpit-dusk.webp`,
  homeIntroCockpitShellDesktopWebp: `${FD}/cockpit-dusk.webp`,
  homeIntroCockpitShellMobileWebp: `${FD}/cockpit-dusk.webp`,
  homeIntroSkyDesktopAvif: `${FD}/stratosphere.webp`,
  homeIntroSkyDesktopWebp: `${FD}/stratosphere.webp`,
  homeIntroSkyMobileAvif: `${FD}/stratosphere.webp`,
  homeIntroSkyMobileWebp: `${FD}/stratosphere.webp`,
  homeIntroSkyDesktopVideo: `${FD_VIDEO}/jet-cruise-dusk.mp4`,
  homeIntroSkyMobileVideo: `${FD_VIDEO}/jet-cruise-dusk.mp4`,
  generatedCrewMap: `${FD}/stratosphere.webp`,
  generatedConnectDashboard: `${FD}/stratosphere.webp`,
  generatedDispatch: `${FD}/cockpit-dusk.webp`,
  homeHangarDusk: `${FD}/runway-dusk.webp`,
  heroOperations: `${FD}/cockpit-dusk.webp`,
  aircraftSupportMain: `${FD}/heavy-jet.webp`,
  servicesHero: `${FD}/runway-dusk.webp`,
  aboutOperations: `${FD}/crew-walk.webp`,
  contactSupport: `${FD}/cabin-night.webp`,
  crewCredentials: `${FD}/cockpit-dusk.webp`,
  pilotNetwork: `${FD}/crew-walk.webp`,
  pilotPreflight: `${FD}/cockpit-dusk.webp`,
  cockpitDetail: `${FD}/cockpit-dusk.webp`,
  mapNetwork: `${FD}/stratosphere.webp`,
  ctaRunway: `${FD}/runway-dusk.webp`,
  runway: `${FD}/runway-dusk.webp`,
  plansSelector: `${FD}/midsize-jet.webp`,
  plansCrewLogistics: `${FD}/crew-walk.webp`,
  portalClientDashboard: `${FD}/stratosphere.webp`,
  portalClientRequests: `${FD}/stratosphere.webp`,
  portalClientAircraft: `${FD}/stratosphere.webp`,
  portalClientDocuments: `${FD}/stratosphere.webp`,
  portalClientQuotesInvoices: `${FD}/stratosphere.webp`,
  portalCrewDashboard: `${FD}/stratosphere.webp`,
  portalAdminDashboard: `${FD}/stratosphere.webp`,
  portalAdminRequests: `${FD}/stratosphere.webp`,
  portalMobileClient: `${FD}/stratosphere.webp`,
} as const;

/** Service id (from content.ts SERVICES) -> editorial image. */
export const SERVICE_IMAGES: Record<string, string> = {
  "aircraft-management-support": `${FD}/cabin-night.webp`,
  "contract-pilot-support": `${FD}/cockpit-dusk.webp`,
  "ferry-repositioning": `${FD}/runway-dusk.webp`,
  "maintenance-flight-support": `${FD}/midsize-jet.webp`,
  "flight-operations-coordination": `${FD}/crew-walk.webp`,
  "fleet-support-programs": `${FD}/heavy-jet.webp`,
};

/** Aircraft category id (from content.ts AIRCRAFT_CATEGORIES) -> matching image. */
export const AIRCRAFT_IMAGES: Record<string, string> = {
  "single-engine-piston": `${FD}/piston-single.webp`,
  "multi-engine-piston": `${FD}/piston-twin.webp`,
  piston: `${FD}/piston-single.webp`,
  turboprop: `${FD}/turboprop.webp`,
  "single-engine-jet-vlj": `${FD}/vlj.webp`,
  "single-engine-jet": `${FD}/vlj.webp`,
  "light-jet": `${FD}/light-jet.webp`,
  "midsize-jet": `${FD}/midsize-jet.webp`,
  "super-midsize-jet": `${FD}/supermid-jet.webp`,
  "large-cabin-heavy-jet": `${FD}/heavy-jet.webp`,
  heavy: `${FD}/heavy-jet.webp`,
  helicopter: `${FD}/helicopter.webp`,
};

export function getAircraftImage(id: string): string {
  return AIRCRAFT_IMAGES[id] ?? IMG.aircraftSupportMain;
}

export function getServiceImage(id: string): string {
  return SERVICE_IMAGES[id] ?? IMG.servicesHero;
}
