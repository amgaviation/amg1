export type BillingInterval = "monthly" | "annual";

export type AircraftCategoryId =
  | "piston"
  | "very-light-jet"
  | "light-jet"
  | "midsize-jet"
  | "super-midsize-jet"
  | "heavy-jet"
  | "ultra-long-range-bizliner";

export type PistonSubtypeId = "single-engine-piston" | "multi-engine-piston";

export type PlanValue = number | string | null;

export type SupportPlan = {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice?: PlanValue;
  annualPrice?: PlanValue;
  billingNote?: string;
  includedFlights?: PlanValue;
  includedMaintenanceFlights?: PlanValue;
  supportScope?: string;
  highlights: string[];
  details: {
    includedSupport: string[];
    overageHandling: string;
    crewTravelLodging: string;
    maintenanceMovement: string;
    acceptanceReview: string;
    billingTerms: string;
    limitations: string;
  };
  comparison: {
    includedFlights?: string;
    includedMaintenanceFlights?: string;
    aircraftSupportScope?: string;
    crewCoordination?: string;
    maintenanceRepositioning?: string;
    ownerVisibility?: string;
    priorityHandling?: string;
    shortNoticeHandling?: string;
    crewTravelLodging?: string;
    overages?: string;
    annualBilling?: string;
    acceptanceReview?: string;
    bestFit?: string;
  };
  ctaLabel?: string;
  ctaHref?: string;
  featured?: boolean;
};

export type AircraftPlanCategory = {
  id: AircraftCategoryId;
  label: string;
  description: string;
  examples?: string[];
  crewDayRate: string;
  twoCrewNote?: string;
  subcategories?: {
    id: PistonSubtypeId;
    label: string;
    description: string;
    crewDayRate: string;
    plans: SupportPlan[];
  }[];
  plans?: SupportPlan[];
};

type TierTemplate = {
  id: string;
  name: string;
  badge?: string;
  description: string;
  includedFlights: string;
  includedMaintenanceFlights: string;
  supportScope: string;
  highlights: string[];
  priorityHandling: string;
  shortNoticeHandling: string;
  bestFit: string;
  featured?: boolean;
};

const ACCEPTANCE_REVIEW =
  "AMG does not present a request as accepted until support scope, aircraft status, crew availability, owner/operator approval, and operational conditions have been reviewed.";

const ANNUAL_BILLING =
  "Annual review available. Eligible AMG coordination/admin baseline pricing may be reduced; variable expenses and pass-through costs remain scope-based.";

const MONTHLY_BILLING =
  "Monthly plan review with variable expenses handled according to the approved support scope.";

const PISTON_TIERS: TierTemplate[] = [
  {
    id: "basic",
    name: "Basic Support",
    description: "Entry support for planned owner/operator activity and limited maintenance movement.",
    includedFlights: "Minimum 4-flight allowance",
    includedMaintenanceFlights: "1 maintenance flight",
    supportScope: "Planned support intake, aircraft status review, and owner/operator visibility.",
    highlights: [
      "Structured intake and support review",
      "Owner/operator communication",
      "Crew suitability review when requested",
      "Maintenance movement coordination",
    ],
    priorityHandling: "Standard review",
    shortNoticeHandling: "Reviewed by availability",
    bestFit: "Lower-tempo planned support",
  },
  {
    id: "core",
    name: "Core Support",
    badge: "Common piston fit",
    description: "Recurring support for owners needing a clearer coordination path and activity visibility.",
    includedFlights: "Reviewed allowance, 4-flight minimum",
    includedMaintenanceFlights: "Reviewed allowance, 1-flight minimum",
    supportScope: "Recurring support coordination with clearer reporting and maintenance movement planning.",
    highlights: [
      "Recurring owner/operator updates",
      "Crew coordination review",
      "Maintenance facility communication",
      "Usage and allowance visibility",
    ],
    priorityHandling: "Elevated review",
    shortNoticeHandling: "Available by scope",
    bestFit: "Recurring piston activity",
    featured: true,
  },
  {
    id: "priority",
    name: "Priority Support",
    description: "Higher-touch support for more frequent activity, short-notice needs, and maintenance movement.",
    includedFlights: "Reviewed during intake",
    includedMaintenanceFlights: "Reviewed during intake",
    supportScope: "Priority coordination across crew, maintenance movement, owner updates, and vendor timing.",
    highlights: [
      "Priority request review",
      "Crew travel and lodging coordination",
      "Maintenance repositioning support",
      "Expanded operating visibility",
    ],
    priorityHandling: "Priority review",
    shortNoticeHandling: "Available, subject to review",
    bestFit: "Frequent owner or maintenance needs",
  },
  {
    id: "premier",
    name: "Premier Support",
    description: "Expanded support path for owners requiring the highest recurring visibility and coordination cadence.",
    includedFlights: "Reviewed during intake",
    includedMaintenanceFlights: "Reviewed during intake",
    supportScope: "Expanded coordination structure for higher activity, complex timing, and owner/operator reporting.",
    highlights: [
      "Highest recurring review cadence",
      "Expanded support communication",
      "Complex maintenance movement planning",
      "Owner/operator reporting support",
    ],
    priorityHandling: "Highest plan review",
    shortNoticeHandling: "Reviewed for feasibility",
    bestFit: "High-tempo piston ownership",
  },
];

const JET_TIERS: TierTemplate[] = [
  {
    id: "core",
    name: "Core Support",
    description: "Baseline recurring support for aircraft status, crew coordination, and owner/operator visibility.",
    includedFlights: "Minimum 4-flight allowance",
    includedMaintenanceFlights: "1 maintenance flight",
    supportScope: "Core operating support review for planned flight activity and maintenance movement.",
    highlights: [
      "Aircraft support scope review",
      "Crew coordination intake",
      "Owner/operator communication",
      "Maintenance movement planning",
    ],
    priorityHandling: "Standard review",
    shortNoticeHandling: "Reviewed by availability",
    bestFit: "Planned recurring support",
  },
  {
    id: "priority",
    name: "Priority Support",
    badge: "Featured",
    description: "Priority support for higher-tempo aircraft usage, crew movement, and maintenance timing.",
    includedFlights: "Reviewed allowance, 4-flight minimum",
    includedMaintenanceFlights: "Reviewed allowance, 1-flight minimum",
    supportScope: "Priority coordination for crew, maintenance, vendor timing, and operating visibility.",
    highlights: [
      "Priority request review",
      "Crew movement coordination",
      "Maintenance repositioning support",
      "Expanded owner/operator updates",
    ],
    priorityHandling: "Priority review",
    shortNoticeHandling: "Available, subject to scope",
    bestFit: "Frequent or timing-sensitive activity",
    featured: true,
  },
  {
    id: "premier",
    name: "Premier Support",
    description: "Expanded coordination for complex aircraft movement, multi-crew needs, and high-visibility ownership.",
    includedFlights: "Reviewed during intake",
    includedMaintenanceFlights: "Reviewed during intake",
    supportScope: "Premier support path for complex timing, crew logistics, vendor coordination, and reporting.",
    highlights: [
      "Highest recurring review cadence",
      "Multi-crew coordination support",
      "Complex maintenance movement planning",
      "Owner/operator visibility cadence",
    ],
    priorityHandling: "Highest plan review",
    shortNoticeHandling: "Reviewed for feasibility",
    bestFit: "Higher-complexity operations",
  },
];

function planFromTemplate(
  template: TierTemplate,
  aircraftLabel: string,
  crewDayRate: string,
  categoryId: string,
): SupportPlan {
  return {
    id: `${categoryId}-${template.id}`,
    name: template.name,
    badge: template.badge,
    description: template.description,
    monthlyPrice: "Plan Review Required",
    annualPrice: "Annual review available",
    billingNote: ANNUAL_BILLING,
    includedFlights: template.includedFlights,
    includedMaintenanceFlights: template.includedMaintenanceFlights,
    supportScope: template.supportScope,
    highlights: template.highlights,
    featured: template.featured,
    ctaLabel: "Request Plan Review",
    ctaHref: `/contact?category=subscription-program-inquiry&aircraft=${categoryId}&plan=${template.id}`,
    details: {
      includedSupport: [
        template.supportScope,
        "Support request intake, operating context review, and owner/operator communication.",
        "Crew coordination is reviewed against aircraft type, timing, availability, and approval requirements.",
      ],
      overageHandling:
        "Unused allowance may roll over within the contract year and may be credited toward the next invoice, additional trips, crew travel overages, next payment, or other approved AMG services. Unused allowance is not refundable.",
      crewTravelLodging: `Crew compensation is not automatically included. Public planning assumptions use ${crewDayRate}; lodging may use a fixed $125/flight estimate or pass-through actuals according to the approved support scope.`,
      maintenanceMovement:
        "Maintenance movement support is coordinated around aircraft status, facility timing, owner/operator approval, documentation, and crew availability.",
      acceptanceReview: ACCEPTANCE_REVIEW,
      billingTerms:
        "Plan pricing covers AMG coordination and support administration unless otherwise stated. Annual billing may reduce eligible AMG admin/ops baseline pricing only.",
      limitations:
        "Plans do not guarantee aircraft availability, crew availability, mission completion, maintenance facility availability, dispatch release, or operational acceptance.",
    },
    comparison: {
      includedFlights: template.includedFlights,
      includedMaintenanceFlights: template.includedMaintenanceFlights,
      aircraftSupportScope: template.supportScope,
      crewCoordination: "Reviewed",
      maintenanceRepositioning: "Available",
      ownerVisibility: "Included",
      priorityHandling: template.priorityHandling,
      shortNoticeHandling: template.shortNoticeHandling,
      crewTravelLodging: "Pass-through or approved scope",
      overages: "Credited or billed by scope",
      annualBilling: "Eligible baseline only",
      acceptanceReview: "Required",
      bestFit: template.bestFit,
    },
  };
}

function customPlan(aircraftLabel: string, categoryId: string, crewDayRate: string): SupportPlan {
  return {
    id: `${categoryId}-custom-fleet`,
    name: "Custom / Fleet",
    badge: "Plan Review",
    description:
      "Custom review for multiple aircraft, complex operating profiles, unusual maintenance movement, or fleet/department support.",
    monthlyPrice: "Custom Review",
    annualPrice: "Plan Review Required",
    billingNote: "Annual structure is reviewed against the approved support scope.",
    includedFlights: "Based on approved support scope",
    includedMaintenanceFlights: "Based on approved support scope",
    supportScope: "Custom support path for fleet, department, or complex owner/operator requirements.",
    highlights: [
      "Fleet or department support review",
      "Custom allowance structure",
      "Multi-aircraft operating visibility",
      "Scope-based billing terms",
    ],
    ctaLabel: "Request Plan Review",
    ctaHref: `/contact?category=subscription-program-inquiry&aircraft=${categoryId}&plan=custom-fleet`,
    details: {
      includedSupport: [
        `Custom ${aircraftLabel} support review for aircraft count, crew requirements, activity level, and maintenance movement.`,
        "Owner/operator reporting cadence and support responsibilities are defined before acceptance.",
        "Vendor, facility, and third-party services remain subject to the approved scope.",
      ],
      overageHandling:
        "Overages, unused allowance treatment, and rollover terms are defined in the reviewed support scope. Unused allowance is not refundable.",
      crewTravelLodging: `Crew compensation, travel, and lodging are reviewed separately. Planning assumptions begin at ${crewDayRate} and may change by aircraft, crew seat, timing, and operating requirement.`,
      maintenanceMovement:
        "Maintenance repositioning support is scoped around facility availability, aircraft status, documentation, and owner/operator approval.",
      acceptanceReview: ACCEPTANCE_REVIEW,
      billingTerms:
        "Custom billing may include eligible AMG coordination/admin baseline pricing and separate variable expenses or pass-through costs.",
      limitations:
        "Custom review does not guarantee aircraft availability, crew availability, mission completion, facility availability, or operational acceptance.",
    },
    comparison: {
      includedFlights: "Custom review",
      includedMaintenanceFlights: "Custom review",
      aircraftSupportScope: "Based on approved support scope",
      crewCoordination: "Custom review",
      maintenanceRepositioning: "Based on scope",
      ownerVisibility: "Defined by scope",
      priorityHandling: "Custom review",
      shortNoticeHandling: "Based on feasibility",
      crewTravelLodging: "Pass-through or approved scope",
      overages: "Defined by scope",
      annualBilling: "Reviewed",
      acceptanceReview: "Required",
      bestFit: "Fleet, department, or complex support",
    },
  };
}

function jetPlans(label: string, id: AircraftCategoryId, crewDayRate: string) {
  return [...JET_TIERS.map((tier) => planFromTemplate(tier, label, crewDayRate, id)), customPlan(label, id, crewDayRate)];
}

function pistonPlans(label: string, id: PistonSubtypeId, crewDayRate: string) {
  return [
    ...PISTON_TIERS.map((tier) => planFromTemplate(tier, label, crewDayRate, id)),
    customPlan(label, id, crewDayRate),
  ];
}

export const aircraftPlanCategories: AircraftPlanCategory[] = [
  {
    id: "piston",
    label: "Piston",
    description: "Structured support for owner-flown and crew-supported piston aircraft.",
    crewDayRate: "$600-$800/day",
    examples: ["Cirrus SR22", "Beechcraft Bonanza", "Piper Seneca", "Diamond DA62"],
    subcategories: [
      {
        id: "single-engine-piston",
        label: "Single Engine Piston",
        description: "Owner-flown and crew-supported single engine piston support.",
        crewDayRate: "$600/day",
        plans: pistonPlans("Single Engine Piston", "single-engine-piston", "$600/day"),
      },
      {
        id: "multi-engine-piston",
        label: "Multi Engine Piston",
        description: "Structured support for piston twins and multi-engine owner/operator needs.",
        crewDayRate: "$800/day",
        plans: pistonPlans("Multi Engine Piston", "multi-engine-piston", "$800/day"),
      },
    ],
  },
  {
    id: "very-light-jet",
    label: "Very Light Jet",
    description:
      "Support for VLJ, single-pilot jet, and entry-level turbine operations where aircraft status, pilot qualifications, mission profile, and owner/operator approval remain central to acceptance.",
    crewDayRate: "$1,200-$1,500/day",
    examples: ["Cirrus Vision Jet", "Embraer Phenom 100", "Cessna Citation M2", "HondaJet Elite / HA-420", "Eclipse 500 / 550"],
    plans: jetPlans("Very Light Jet", "very-light-jet", "$1,200-$1,500/day"),
  },
  {
    id: "light-jet",
    label: "Light Jet",
    description: "Operational support for light jet missions, crew movement, owner/operator visibility, and maintenance repositioning.",
    crewDayRate: "$1,500/day",
    examples: ["Embraer Phenom 300 / 300E", "Cessna Citation XLS+ / Excel", "Cessna Citation CJ3+ / CJ4", "Learjet 45 / 75", "Hawker 400XP"],
    plans: jetPlans("Light Jet", "light-jet", "$1,500/day"),
  },
  {
    id: "midsize-jet",
    label: "Midsize Jet",
    description: "Expanded support for higher-tempo aircraft usage, crew coordination, maintenance movement, and operating visibility.",
    crewDayRate: "$1,500/day",
    examples: ["Cessna Citation Latitude", "Hawker 800XP / 850XP", "Learjet 60 / 60XR", "Embraer Praetor 500", "Gulfstream G150"],
    plans: jetPlans("Midsize Jet", "midsize-jet", "$1,500/day"),
  },
  {
    id: "super-midsize-jet",
    label: "Super-Midsize Jet",
    description:
      "Structured support for longer-range aircraft, higher operating complexity, crew coordination, vendor timing, and owner/operator communication.",
    crewDayRate: "$1,500+/day",
    examples: ["Bombardier Challenger 350 / 3500", "Gulfstream G280", "Cessna Citation Sovereign+", "Cessna Citation Longitude", "Dassault Falcon 2000 Series"],
    plans: jetPlans("Super-Midsize Jet", "super-midsize-jet", "$1,500+/day"),
  },
  {
    id: "heavy-jet",
    label: "Heavy Jet",
    description:
      "Support for complex aircraft movement, multi-crew requirements, longer-range operations, maintenance coordination, and operational oversight.",
    crewDayRate: "$1,500+/day",
    twoCrewNote: "Two-crew aircraft automatically double crew rate, lodging, and travel assumptions unless otherwise approved.",
    examples: ["Bombardier Challenger 604 / 605 / 650", "Gulfstream G450 / GIV", "Dassault Falcon 900 Series", "Embraer Legacy 600 / 650", "Bombardier Challenger 850"],
    plans: jetPlans("Heavy Jet", "heavy-jet", "$1,500+/day"),
  },
  {
    id: "ultra-long-range-bizliner",
    label: "Ultra-Long-Range & Bizliner",
    description:
      "Support for high-complexity aircraft movement, international or extended-range planning considerations, multi-crew requirements, vendor coordination, and owner/operator visibility.",
    crewDayRate: "$1,500+/day",
    twoCrewNote: "Two-crew aircraft automatically double crew rate, lodging, and travel assumptions unless otherwise approved.",
    examples: ["Gulfstream G650 / G650ER", "Gulfstream G550", "Bombardier Global 6000 / 7500", "Gulfstream G700 / G800"],
    plans: jetPlans("Ultra-Long-Range & Bizliner", "ultra-long-range-bizliner", "$1,500+/day"),
  },
];

export const comparisonRows = [
  { key: "includedFlights", label: "Included flights" },
  { key: "includedMaintenanceFlights", label: "Included maintenance flights" },
  { key: "aircraftSupportScope", label: "Aircraft support scope" },
  { key: "crewCoordination", label: "Crew coordination" },
  { key: "maintenanceRepositioning", label: "Maintenance repositioning support" },
  { key: "ownerVisibility", label: "Owner/operator visibility" },
  { key: "priorityHandling", label: "Priority handling" },
  { key: "shortNoticeHandling", label: "Short-notice handling" },
  { key: "crewTravelLodging", label: "Crew travel/lodging handling" },
  { key: "overages", label: "Overages" },
  { key: "annualBilling", label: "Annual billing option" },
  { key: "acceptanceReview", label: "Acceptance review required" },
  { key: "bestFit", label: "Best fit" },
] as const;
