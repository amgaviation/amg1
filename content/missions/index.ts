/**
 * Mission case studies (spec §6). The /missions page and the homepage proof
 * section render ONLY what exists here — no placeholders ever ship. The
 * Business Plan §10 launch gate requires three real entries before the site
 * goes public; until then both surfaces render their gated empty state.
 *
 * Template per entry (~250–350 words of copy across fields):
 * {
 *   slug: "pc12-kapf-kgso-maintenance-ferry",
 *   aircraft: "PC-12",
 *   route: "KAPF → KGSO",
 *   missionType: "Maintenance ferry",
 *   situation: "2–3 sentences, the owner's problem in the owner's terms.",
 *   timeline: [
 *     { milestone: "Request received", when: "Mon 09:14" },
 *     { milestone: "Quote delivered", when: "Mon 16:40 (7.5 business hrs)" },
 *     { milestone: "Crew confirmed", when: "Tue 14:05" },
 *     { milestone: "Mission flown", when: "Thu" },
 *   ],
 *   costBreakdown: [
 *     { label: "Contract pilot (1 day)", amount: "$600" },
 *     { label: "Airline return", amount: "$240" },
 *     { label: "AMG coordination", amount: "$295" },
 *   ],
 *   totalCost: "$1,135 all-in",
 *   pilotLine: "Flown by a network pilot with 3,100 hrs, PC-12/King Air.",
 *   ownerWord: null, // attributed quote if granted; null renders "reference available on request"
 *   flownOn: "2026-08-14", // ISO date, newest first on the grid
 * }
 */

export type MissionCaseStudy = {
  slug: string;
  aircraft: string;
  route: string;
  missionType: string;
  situation: string;
  timeline: { milestone: string; when: string }[];
  costBreakdown: { label: string; amount: string }[];
  totalCost: string;
  pilotLine: string;
  ownerWord: string | null;
  flownOn: string;
};

export const MISSION_CASE_STUDIES: MissionCaseStudy[] = [
  // Launch gate: three real proof missions publish here (Business Plan §10).
];

export function getMissionCaseStudy(slug: string) {
  return MISSION_CASE_STUDIES.find((m) => m.slug === slug) ?? null;
}
