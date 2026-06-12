export const COMPANY = {
  name: "AMG Aviation Group",
  shortName: "AMG",
  tagline: "Aircraft operations support for owners, crews, and flight departments.",
  email: "information@amgaviationgroup.com",
  phone: "",
  location: "United States based. Worldwide coordination.",
  disclaimer:
    "AMG Aviation Group provides aircraft operations support, coordination, and crew sourcing assistance for Part 91 aviation environments. AMG is not an air carrier, does not advertise charter service, and does not act as the legal operator of any aircraft unless separately documented in writing.",
  requestDisclaimer:
    "Submitting a Support Request does not constitute mission acceptance, crew confirmation, aircraft availability, a binding quote, or a contract. All services remain subject to operational review, crew availability, aircraft availability, aircraft status, maintenance status, insurance requirements, weather, airport restrictions, owner/operator approval, and final acceptance.",
} as const;

export const STATS = [
  { label: "Support Categories", value: 6, suffix: "" },
  { label: "Aircraft Classes", value: 8, suffix: "" },
  { label: "Standard Portal Entry", value: 1, suffix: "" },
  { label: "Acceptance Review", value: 100, suffix: "%" },
] as const;

export const SERVICES = [
  {
    id: "aircraft-management-support",
    title: "Aircraft Management Support",
    summary:
      "Administrative support for aircraft scheduling inputs, crew coordination, records organization, maintenance communication, and recurring owner updates.",
    useCase:
      "For owners or flight departments that need a structured support layer around aircraft readiness, communication, and recurring operating tasks.",
    requiredInfo:
      "Ownership or operating entity, aircraft base, current crew arrangement, management arrangement, records status, scheduling expectations, accounting needs, desired scope, start date, aircraft count, and current concerns.",
    notIncluded:
      "Operational control, guaranteed aircraft availability, aircraft-management accounting, maintenance invoices, insurance, fuel, parts, or mechanic labor.",
    requestCategory: "Aircraft Management Support",
    points: [
      "Scheduling and owner communication",
      "Crew coordination and assignment readiness",
      "Aircraft record and document organization",
      "Maintenance communication support",
    ],
  },
  {
    id: "contract-pilot-support",
    title: "Contract Pilot Support",
    summary:
      "Pilot sourcing and assignment review aligned with aircraft type, crew seat, insurance minimums, timing, route, and operating scope.",
    useCase:
      "For a mission, repositioning event, maintenance movement, or temporary coverage need that requires credential-reviewed pilot support.",
    requiredInfo:
      "Aircraft make/model, tail number, PIC/SIC need, type-rating requirements, insurance minimums, dates, origin, destination, duty estimate, legs, international requirements, positioning, lodging, operator requirements, and special notes.",
    notIncluded:
      "Guaranteed crew availability, operator approval, insurance acceptance, standby coverage, or legal operator responsibility.",
    requestCategory: "Contract Pilot Support",
    points: [
      "Crew profile and credential review",
      "Aircraft qualification matching",
      "Availability and suitability checks",
      "Owner/operator and insurance requirement coordination",
    ],
  },
  {
    id: "ferry-repositioning",
    title: "Ferry & Repositioning",
    summary:
      "Crew and logistics coordination for maintenance positioning, aircraft delivery, acquisition support, and approved aircraft movements.",
    useCase:
      "For aircraft movement related to maintenance, pre-buy activity, delivery, storage, owner repositioning, or facility transfer.",
    requiredInfo:
      "Current location, destination, desired movement date, airworthiness status, maintenance status, ferry-permit status, owner/operator authorization, facility contact, records availability, international/customs needs, crew qualifications, squawks, and special equipment.",
    notIncluded:
      "Ferry permits, special-flight permits, customs, overflight permits, maintenance release, or unusual-risk mission acceptance unless separately quoted and approved.",
    requestCategory: "Ferry and Repositioning",
    points: [
      "Crew sourcing for approved aircraft movements",
      "Route, timing, and airport limitation review",
      "Travel and lodging coordination",
      "Documentation and communication support",
    ],
  },
  {
    id: "maintenance-flight-support",
    title: "Maintenance Flight Support",
    summary:
      "Structured support for movements associated with inspections, maintenance events, acceptance flights, and return-to-service activity.",
    useCase:
      "For maintenance-related aircraft movement that requires owner, facility, crew, documentation, and aircraft-status coordination.",
    requiredInfo:
      "Facility, facility contact, maintenance event, aircraft release status, return-to-service status, FCF or acceptance-flight needs, proposed profile, responsible operator, pilot qualifications, documentation status, completion date, and known discrepancies.",
    notIncluded:
      "Maintenance approval, mechanic labor, maintenance invoices, parts, specialized maintenance representation, or aircraft airworthiness responsibility.",
    requestCategory: "Maintenance Flight Support",
    points: [
      "Facility communication support",
      "Maintenance-positioning coordination",
      "Acceptance and return-to-service support context",
      "Required document tracking where applicable",
    ],
  },
  {
    id: "flight-operations-coordination",
    title: "Flight Operations Coordination",
    summary:
      "Mission intake, scheduling inputs, crew logistics, travel, lodging, vendor communication, documentation, and owner updates.",
    useCase:
      "For an owner or flight department that needs one accountable coordination point for an approved Part 91 support requirement.",
    requiredInfo:
      "Mission dates, origin, destination, passenger count, crew requirements, aircraft status, FBO needs, ground transportation, lodging, international requirements, permits, catering, timing restrictions, and primary decision maker.",
    notIncluded:
      "Direct air-carrier service, guaranteed mission acceptance, fuel, airport fees, catering, permits, customs, or aircraft operating expenses.",
    requestCategory: "Flight Operations Coordination",
    points: [
      "Support request intake",
      "Route and timing coordination",
      "Crew logistics and vendor communication",
      "Operational status updates",
    ],
  },
  {
    id: "fleet-support-programs",
    title: "Fleet Support Program",
    summary:
      "Recurring support models for owners and flight departments managing multiple aircraft, frequent activity, or variable crew requirements.",
    useCase:
      "For aircraft activity frequent enough to need defined scope, recurring communication, usage visibility, and a support cadence.",
    requiredInfo:
      "Number of aircraft, aircraft types, bases, current staffing, expected monthly activity, maintenance activity, desired support functions, reporting needs, dedicated-contact requirement, after-hours requirement, and start date.",
    notIncluded:
      "Full aircraft-management accounting, aircraft expenses, vendor charges, dedicated dispatch unless quoted, or guaranteed crew availability.",
    requestCategory: "Fleet Support Program",
    points: [
      "Baseline coordination support",
      "Recurring service allowance",
      "Mission-variable cost visibility",
      "Monthly or annual support plan structure",
    ],
  },
] as const;

export const HOW_AMG_WORKS = [
  {
    step: "01",
    title: "Request",
    body: "Provide the aircraft, route, timing, crew requirements, and requested support scope.",
  },
  {
    step: "02",
    title: "Review",
    body: "AMG reviews availability, qualifications, logistics, operating limitations, and mission conditions.",
  },
  {
    step: "03",
    title: "Coordinate",
    body: "Approved crew, travel, lodging, documentation, vendors, and communication are coordinated as required.",
  },
  {
    step: "04",
    title: "Support",
    body: "The mission proceeds under the applicable operating authority, approvals, and responsibilities of the aircraft owner or operator.",
  },
] as const;

export const CAPABILITIES = [
  {
    title: "Defined Scope",
    body: "Each request is reviewed around aircraft status, support type, crew need, timing, route, and responsible owner/operator authority.",
  },
  {
    title: "Crew Readiness",
    body: "Pilot support is evaluated against credentials, aircraft qualifications, availability, insurance requirements, and assignment suitability.",
  },
  {
    title: "Owner Communication",
    body: "AMG keeps owners and approved representatives informed without implying automatic acceptance or aircraft availability.",
  },
  {
    title: "Operational Accountability",
    body: "Support activity is organized through clear review, coordination, documentation, and communication checkpoints.",
  },
] as const;

export const AIRCRAFT_CATEGORIES = [
  {
    id: "single-engine-piston",
    name: "Single-Engine Piston",
    category: "Single-Engine Piston",
    examples: "Cirrus SR22, Beechcraft Bonanza, Cessna 182",
    crew: "Typically single-pilot, subject to aircraft, insurance, and owner/operator requirements.",
    support: "Owner support, repositioning, document organization, and pilot qualification review for piston aircraft operations.",
    useCases: "Owner travel support, maintenance positioning, purchase support, currency-sensitive assignments, and local or regional repositioning.",
    pricing: "Standard subscription class",
    factors: ["Airport limitations", "Aircraft status", "Pilot qualification", "Owner/operator approval"],
  },
  {
    id: "multi-engine-piston",
    name: "Multi-Engine Piston",
    category: "Multi-Engine Piston",
    examples: "Baron, Seneca, Diamond DA42/DA62",
    crew: "Usually single-pilot or two-pilot by requirement, aircraft, insurance, and mission profile.",
    support: "Crew sourcing, maintenance movements, aircraft documentation, and mission review for piston twins.",
    useCases: "Training-adjacent movements, owner repositioning, maintenance flights, and regional operations.",
    pricing: "Standard subscription class",
    factors: ["Multi-engine currency", "Aircraft status", "Runway performance", "Insurance requirements"],
  },
  {
    id: "turboprop",
    name: "Turboprop",
    category: "Turboprop",
    examples: "TBM, Pilatus PC-12, King Air",
    crew: "Single-pilot or two-pilot depending on aircraft, insurance, operator standards, and mission profile.",
    support: "Regional support, maintenance positioning, crew sourcing, and operating-condition review.",
    useCases: "Regional owner travel, maintenance positioning, weather-sensitive operations, and remote-airport planning.",
    pricing: "Standard subscription class",
    factors: ["Route profile", "Maintenance status", "Crew availability", "Weather"],
  },
  {
    id: "single-engine-jet-vlj",
    name: "Single-Engine Jet / VLJ",
    category: "Single-Engine Jet / VLJ",
    examples: "Cirrus Vision Jet SF50",
    crew: "Typically single-pilot, subject to type, currency, insurance, and owner/operator requirements.",
    support: "Aircraft-specific support for owner missions, ferry movement, and crew qualification review.",
    useCases: "Owner-flown support, contract pilot review, short repositioning, and maintenance movement support.",
    pricing: "Standard subscription class",
    factors: ["Aircraft type", "Insurance requirements", "Airport restrictions", "Pilot currency"],
  },
  {
    id: "light-jet",
    name: "Light Jet",
    category: "Light Jet",
    examples: "Citation M2, Citation CJ series, HondaJet, Phenom 100",
    crew: "Often single-pilot-capable by type but subject to insurance, operator, and mission requirements.",
    support: "Short-haul support, repositioning coordination, owner communication, and assignment readiness.",
    useCases: "Owner missions, temporary crew coverage, maintenance positioning, and regional support.",
    pricing: "Standard subscription class",
    factors: ["Crew pairing", "Timing", "Aircraft readiness", "Operating limitations"],
  },
  {
    id: "midsize-jet",
    name: "Midsize Jet",
    category: "Midsize Jet",
    examples: "Citation Latitude, Hawker 800XP, Learjet 60",
    crew: "Commonly two-pilot operations, subject to aircraft, insurance, and owner/operator standards.",
    support: "Crew sourcing, support request review, and coordination for domestic or regional operating needs.",
    useCases: "Owner trips, repositioning, maintenance support, standby review, and expanded crew logistics.",
    pricing: "Standard subscription class",
    factors: ["Crew requirement", "Aircraft status", "Route complexity", "Owner/operator approval"],
  },
  {
    id: "super-midsize-jet",
    name: "Super-Midsize Jet",
    category: "Super-Midsize Jet",
    examples: "Challenger 350, Praetor 600, Citation X/X+",
    crew: "Two-pilot operations are typical, with proposal review based on crew, route, and operating scope.",
    support: "Expanded crew, travel, documentation, and logistics support for more complex movements.",
    useCases: "Longer domestic missions, complex repositioning, international planning inputs, and higher-touch crew logistics.",
    pricing: "Custom proposal only",
    factors: ["Mission complexity", "Crew availability", "International considerations", "Vendor coordination"],
  },
  {
    id: "large-cabin-heavy-jet",
    name: "Large-Cabin / Heavy Jet",
    category: "Large-Cabin / Heavy Jet",
    examples: "Gulfstream, Global, large-cabin Falcon",
    crew: "Two-pilot operations with possible cabin, international, and support requirements by mission.",
    support: "Longer-range support coordination where crew, aircraft status, facilities, and approvals require tighter control.",
    useCases: "Owner travel support, crew sourcing review, maintenance movement, international support planning, and vendor coordination.",
    pricing: "Standard subscription class",
    factors: ["Operating authority", "Insurance", "Airport restrictions", "Final acceptance"],
  },
  {
    id: "helicopter",
    name: "Helicopter",
    category: "Helicopter",
    examples: "Reviewed by aircraft, operator, mission profile, and risk context",
    crew: "Custom review only; not a standard subscription class.",
    support: "Helicopter requests may be reviewed when the scope, approvals, aircraft status, and crew requirements are clear.",
    useCases: "Specialized movement, owner/operator support, or unusual mission review where AMG can determine an appropriate support path.",
    pricing: "Custom review only",
    factors: ["Mission profile", "Aircraft status", "Operator approval", "Risk review"],
  },
] as const;

export const FLEET = AIRCRAFT_CATEGORIES;

export const VALUES = [
  {
    title: "Clarity",
    body: "Responsibilities, support scope, and acceptance conditions are kept visible before work proceeds.",
  },
  {
    title: "Responsiveness",
    body: "Owners, crews, and vendors need quick coordination without vague promises or buried assumptions.",
  },
  {
    title: "Suitability",
    body: "Crew, aircraft, route, timing, and operating conditions are reviewed before a support request is accepted.",
  },
  {
    title: "Discretion",
    body: "Aircraft, owner, passenger, and operational details stay limited to approved roles and support needs.",
  },
] as const;

export const TEAM = [
  {
    name: "AMG Operations",
    title: "Mission Coordination",
    bio: "The central support desk for request review, scheduling, aircraft readiness communication, owner updates, and crew coordination.",
    initials: "AO",
  },
  {
    name: "Crew Network",
    title: "Assignment Readiness",
    bio: "Credential-reviewed pilots and aviation professionals considered for assignment suitability, aircraft qualification, and availability.",
    initials: "CN",
  },
  {
    name: "Client Services",
    title: "Owner Communication",
    bio: "The owner-facing support channel for aircraft needs, support requests, passenger context, documents, and operational updates.",
    initials: "CS",
  },
  {
    name: "Admin Desk",
    title: "Access & Records",
    bio: "The administrative layer for access requests, permissions, documents, aircraft data, and support record organization.",
    initials: "AD",
  },
] as const;

export const PILOT_REQUIREMENTS = [
  "Crew profile and identity review",
  "Aircraft qualifications and recent experience",
  "Availability and assignment suitability",
  "Current documents and credentials where applicable",
  "Owner/operator, insurance, and mission-specific approval",
] as const;

export const PILOT_BENEFITS = [
  {
    title: "Credential Review",
    body: "Profiles are organized around qualifications, aircraft experience, documents, and support suitability.",
  },
  {
    title: "Assignment Context",
    body: "AMG reviews each potential assignment around aircraft, route, timing, crew need, and operating requirements.",
  },
  {
    title: "Operational Communication",
    body: "Approved users receive clear support context without turning the network into a casual job board.",
  },
  {
    title: "No Automatic Engagement",
    body: "Profile submission and approval do not guarantee assignment, compensation, or future engagement.",
  },
] as const;

export const PLANS = [
  {
    id: "baseline",
    name: "Baseline Support",
    monthly: "Coordination foundation",
    description: "For owners who need a defined communication and coordination layer around recurring aircraft needs.",
    features: [
      "Baseline coordination",
      "Support request review",
      "Owner communication",
      "Document visibility",
      "Mission-variable costs reviewed separately",
    ],
    highlighted: false,
  },
  {
    id: "active",
    name: "Active Support",
    monthly: "Monthly support plan",
    description: "For aircraft with more frequent crew, scheduling, ferry, or maintenance-positioning support needs.",
    features: [
      "Expanded service allowance",
      "Crew sourcing coordination",
      "Travel and lodging coordination support",
      "Priority support review",
      "Selected variable items tracked separately",
    ],
    highlighted: true,
  },
  {
    id: "fleet",
    name: "Fleet Support",
    monthly: "Annual support plan",
    description: "For owners or flight departments managing multiple aircraft, recurring activity, or variable crew needs.",
    features: [
      "Fleet-level support credit",
      "Recurring support cadence",
      "Multi-aircraft coordination visibility",
      "Role-based portal access",
      "Scope reviewed before acceptance",
    ],
    highlighted: false,
  },
] as const;

export const PORTAL_ROLES = [
  {
    id: "client",
    title: "Client Portal",
    href: "/portal/client",
    access: "Aircraft owners and approved representatives",
    actions: ["Support requests", "Passenger context", "Aircraft documents", "AMG messages"],
  },
  {
    id: "crew",
    title: "Crew Portal",
    href: "/portal/crew",
    access: "Pilots, maintenance, aircraft managers, and external support users",
    actions: ["Assignment review", "Manifest context", "Aircraft readiness", "Document tracking"],
  },
  {
    id: "admin",
    title: "Admin Portal",
    href: "/portal/admin",
    access: "AMG operations and administrators",
    actions: ["Access review", "User permissions", "Support records", "Operational settings"],
  },
  {
    id: "partner",
    title: "Partner Portal",
    href: "/portal/partner",
    access: "Approved aviation service partners and vendors",
    actions: ["Vendor tasks", "Quote requests", "Service confirmations", "Partner documents"],
  },
] as const;

export const CONTACT_CARDS = [
  {
    title: "Operations Support",
    body: "Aircraft management support, flight operations coordination, ferry and repositioning assistance, or maintenance flight support.",
  },
  {
    title: "Pilot Network",
    body: "Credential submission, crew profile questions, aircraft qualification updates, or assignment suitability inquiries.",
  },
  {
    title: "Client / Owner Support",
    body: "Owner communication, support request status, aircraft profile details, passenger context, or portal access.",
  },
  {
    title: "General Inquiries",
    body: "Questions about AMG Aviation Group, support scope, administrative notices, or next steps.",
  },
] as const;

export const DESTINATIONS = [
  "Miami",
  "New York",
  "Los Angeles",
  "Aspen",
  "Nassau",
  "London",
  "Paris",
  "Geneva",
  "Toronto",
  "Mexico City",
  "Sao Paulo",
  "Milan",
  "Tokyo",
  "Singapore",
  "Cape Town",
  "San Juan",
] as const;

export const FOOTER_COLS = [
  {
    heading: "Company",
    links: [
      { label: "About AMG", href: "/about" },
      { label: "Our Team", href: "/team" },
      { label: "Contact", href: "/contact" },
      { label: "Pilot Network", href: "/pilot-network" },
    ],
  },
  {
    heading: "Capabilities",
    links: SERVICES.map((service) => ({
      label: service.title,
      href: "/services",
    })),
  },
  {
    heading: "Access",
    links: [
      { label: "Member Login", href: "/login" },
      { label: "Request Support", href: "/contact" },
      { label: "Pilot Network", href: "/pilot-network" },
      { label: "Subscription Programs", href: "/plans" },
    ],
  },
  {
    heading: "Administrative",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Operational Disclaimer", href: "/operational-disclaimer" },
      { label: "Mission Acceptance Policy", href: "/mission-acceptance" },
      { label: "Credential Submission Notice", href: "/credential-submission" },
    ],
  },
] as const;

export const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Aircraft", href: "/aircraft" },
  { label: "Plans", href: "/plans" },
  { label: "Pilot Network", href: "/pilot-network" },
  { label: "Contact", href: "/contact" },
] as const;
