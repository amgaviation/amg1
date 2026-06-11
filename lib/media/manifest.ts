export type MediaAsset = {
  id: string;
  page: string;
  section: string;
  type: "image" | "video" | "poster" | "diagram";
  status: "placeholder" | "generated" | "approved" | "published";
  aspectRatio: string;
  desktopDimensions: string;
  mobileDimensions: string;
  artDirection: string;
  sceneDescription: string;
  cameraDirection?: string;
  motionDirection?: string;
  lightingDirection?: string;
  colorDirection: string;
  negativePrompt: string;
  altText: string;
  fallbackAsset: string;
  sourcePath?: string;
  posterAssetId?: string;
  objectPosition?: string;
};

export const MEDIA_ASSETS = [
  {
    id: "AMG-HOME-HERO-VIDEO-001",
    page: "home",
    section: "hero",
    type: "video",
    status: "placeholder",
    aspectRatio: "16:9",
    desktopDimensions: "3840x2160",
    mobileDimensions: "1440x1920",
    artDirection: "Cinematic private aviation operations, confident and restrained, not charter-marketplace luxury.",
    sceneDescription: "A business jet on a clean ramp at dusk with AMG-blue operational interface reflections and subtle motion in the sky.",
    cameraDirection: "Slow stabilized push-in from three-quarter front angle, premium editorial framing.",
    motionDirection: "Seamless 4-second loop with barely perceptible ramp and cloud movement.",
    lightingDirection: "Dusk blue hour, soft hangar spill, clean specular highlights on fuselage.",
    colorDirection: "AMG Navy #050B14, AMG Blue #1D4ED8, Light Gray #E5E7EB, sparing Sky Blue #38BDF8.",
    negativePrompt: "No airline logos, no competitor branding, no gold, no red emergency styling, no distorted engines, no impossible aircraft geometry, no unsafe cockpit behavior.",
    altText: "Private aircraft staged for operational support at dusk.",
    fallbackAsset: "/images/hero-jet.png",
    sourcePath: "",
    objectPosition: "center center"
  },
  {
    id: "AMG-HOME-CAPABILITY-FERRY-IMAGE-001",
    page: "home",
    section: "core-capabilities",
    type: "image",
    status: "placeholder",
    aspectRatio: "4:3",
    desktopDimensions: "1800x1350",
    mobileDimensions: "1200x1500",
    artDirection: "Editorial maintenance repositioning and ferry operations support.",
    sceneDescription: "Jet parked near a maintenance hangar with flight planning tablet and clean ramp environment.",
    lightingDirection: "Bright overcast daylight, crisp reflections, documentary realism.",
    colorDirection: "Navy, mineral gray, white, AMG blue accents only.",
    negativePrompt: "No mechanics in unsafe positions, no airline branding, no copied Jesko imagery, no orange/gold/red palette.",
    altText: "Aircraft prepared for maintenance repositioning support.",
    fallbackAsset: "/images/operations.png",
    sourcePath: "",
    objectPosition: "center center"
  },
  {
    id: "AMG-HOME-OPS-COORDINATION-VIDEO-001",
    page: "home",
    section: "operational-approach",
    type: "video",
    status: "placeholder",
    aspectRatio: "21:9",
    desktopDimensions: "2560x1080",
    mobileDimensions: "1400x1800",
    artDirection: "High-end operations coordination without generic SaaS dashboards.",
    sceneDescription: "Abstract flight operations desk with route lines, aircraft documents, and discreet communications cues.",
    cameraDirection: "Slow lateral macro move across documents and glass display surfaces.",
    motionDirection: "2-4 second seamless loop with subtle UI glints and route-line movement.",
    lightingDirection: "Controlled studio light with navy shadows and cool blue highlights.",
    colorDirection: "AMG Navy, AMG Blue, Jet Gray, Light Gray, minimal Sky Blue.",
    negativePrompt: "No fake emergency states, no illegible cockpit UI, no stock-photo handshake, no neon cyberpunk.",
    altText: "Aviation operations coordination materials and route planning display.",
    fallbackAsset: "/images/jet-sky.png",
    sourcePath: "",
    objectPosition: "center center"
  },
  {
    id: "AMG-ABOUT-HERO-IMAGE-001",
    page: "about",
    section: "hero",
    type: "image",
    status: "placeholder",
    aspectRatio: "16:9",
    desktopDimensions: "2400x1350",
    mobileDimensions: "1200x1500",
    artDirection: "AMG operational credibility, quiet aviation support team presence.",
    sceneDescription: "Private aviation operations team reviewing mission details near a hangar lounge without visible personal data.",
    lightingDirection: "Natural daylight, premium but realistic.",
    colorDirection: "White, light gray, navy, AMG blue.",
    negativePrompt: "No exaggerated luxury party scene, no visible private information, no copied competitor composition.",
    altText: "Aviation operations team reviewing aircraft support details.",
    fallbackAsset: "/images/jet-interior.png",
    sourcePath: "",
    objectPosition: "center center"
  },
  {
    id: "AMG-AIRCRAFT-LIGHT-JET-IMAGE-001",
    page: "aircraft",
    section: "light-jet",
    type: "image",
    status: "placeholder",
    aspectRatio: "4:3",
    desktopDimensions: "1800x1350",
    mobileDimensions: "1200x1500",
    artDirection: "Aircraft support range, accurate light jet proportions, inspection-ready clarity.",
    sceneDescription: "Light jet on clean ramp with no airline or charter branding, viewed in crisp profile.",
    lightingDirection: "Clear morning light, realistic reflections.",
    colorDirection: "Neutral aircraft white, navy environment, AMG blue micro accents.",
    negativePrompt: "No incorrect tail numbers, no warped wings, no impossible engine placement, no logo plagiarism.",
    altText: "Light jet shown as an aircraft support category.",
    fallbackAsset: "/images/light-jet.png",
    sourcePath: "",
    objectPosition: "center center"
  },
  {
    id: "AMG-PILOT-NETWORK-HERO-VIDEO-001",
    page: "pilot-network",
    section: "hero",
    type: "video",
    status: "placeholder",
    aspectRatio: "16:9",
    desktopDimensions: "2560x1440",
    mobileDimensions: "1440x1920",
    artDirection: "Crew readiness and credential review, professional and non-regulatory.",
    sceneDescription: "Pilot briefing materials, headset, tablet, and aircraft ramp view without visible faces or sensitive data.",
    cameraDirection: "Slow push across briefing table toward aircraft window view.",
    motionDirection: "Seamless 3-second loop with subtle paper and display reflections.",
    lightingDirection: "Cool morning hangar light.",
    colorDirection: "Navy, light gray, AMG blue, sparing sky blue.",
    negativePrompt: "No cockpit hands flying, no unsafe behavior, no false airline branding, no distorted instruments.",
    altText: "Pilot readiness materials prepared for aircraft support assignment review.",
    fallbackAsset: "/images/operations.png",
    sourcePath: "",
    objectPosition: "center center"
  },
  {
    id: "AMG-CONTACT-OPERATIONS-IMAGE-001",
    page: "contact",
    section: "operations-request",
    type: "image",
    status: "placeholder",
    aspectRatio: "3:2",
    desktopDimensions: "1800x1200",
    mobileDimensions: "1200x1500",
    artDirection: "Operations request intake, precise Part 91 support tone.",
    sceneDescription: "Minimal aircraft operations desk with phone, route notes, and ramp outside window.",
    lightingDirection: "Soft daylight, editorial, uncluttered.",
    colorDirection: "White, light gray, navy, AMG blue.",
    negativePrompt: "No fake emergency, no cluttered call-center scene, no red or gold accents.",
    altText: "Aircraft operations support request desk.",
    fallbackAsset: "/images/jet-sky.png",
    sourcePath: "",
    objectPosition: "center center"
  }
] satisfies MediaAsset[];

export function getMediaAsset(id: string): MediaAsset {
  const asset = MEDIA_ASSETS.find((item) => item.id === id);
  if (!asset) throw new Error(`Unknown media asset: ${id}`);
  return asset;
}
