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
  { label: "Operational desk", value: 24, suffix: "/7" },
  { label: "Support paths", value: 6, suffix: "" },
  { label: "Portal roles", value: 4, suffix: "" },
  { label: "Review factors", value: 9, suffix: "+" },
] as const;

export const SERVICES = [
  {
    id: "aircraft-management-support",
    title: "Aircraft Management Support",
    summary:
      "Owner-focused oversight for scheduling, crew coordination, records, maintenance communication, and recurring operational needs.",
    useCase:
      "Useful when an owner or flight department needs a structured support layer around aircraft readiness, communication, and recurring operating tasks.",
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
      "Qualified pilot sourcing and mission assignment aligned with aircraft type, crew requirements, timing, and operational scope.",
    useCase:
      "Useful when a mission, repositioning event, or temporary coverage need requires credential-reviewed pilot support.",
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
      "Crew and operational coordination for maintenance positioning, aircraft delivery, acquisition support, and approved aircraft movements.",
    useCase:
      "Useful when an aircraft needs to move for maintenance, pre-buy activity, delivery, storage, or owner-approved repositioning.",
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
      "Structured support for aircraft movements associated with inspections, maintenance events, acceptance flights, and return-to-service activity.",
    useCase:
      "Useful when a maintenance event requires coordination among owner, facility, crew, documentation, and aircraft status inputs.",
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
      "Mission intake, scheduling, crew logistics, travel, lodging, documentation, and operational communication.",
    useCase:
      "Useful when a flight department or owner needs a central coordination point for an approved Part 91 support requirement.",
    points: [
      "Support request intake",
      "Route and timing coordination",
      "Crew logistics and vendor communication",
      "Operational status updates",
    ],
  },
  {
    id: "fleet-support-programs",
    title: "Fleet Support Programs",
    summary:
      "Recurring support models for owners and flight departments managing multiple aircraft, frequent missions, or variable crew requirements.",
    useCase:
      "Useful when aircraft activity is frequent enough to require defined scope, recurring communication, and support visibility.",
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
    id: "piston",
    name: "Piston",
    category: "Piston",
    image: "/images/turboprop.png",
    support: "Owner support, repositioning, document organization, and qualified crew review where applicable.",
    factors: ["Airport limitations", "Aircraft status", "Pilot qualification", "Owner approval"],
  },
  {
    id: "turboprop",
    name: "Turboprop",
    category: "Turboprop",
    image: "/images/turboprop.png",
    support: "Regional support, maintenance positioning, crew sourcing, and operating-condition review.",
    factors: ["Route profile", "Maintenance status", "Crew availability", "Weather"],
  },
  {
    id: "single-engine-jet",
    name: "Single-Engine Jet",
    category: "Single-Engine Jet",
    image: "/images/light-jet.png",
    support: "Aircraft-specific support for owner missions, ferry movement, and crew qualification review.",
    factors: ["Aircraft type", "Insurance requirements", "Airport restrictions", "Pilot currency"],
  },
  {
    id: "light-jet",
    name: "Light Jet",
    category: "Light Jet",
    image: "/images/light-jet.png",
    support: "Short-haul support, repositioning coordination, owner communication, and assignment readiness.",
    factors: ["Crew pairing", "Timing", "Aircraft readiness", "Operating limitations"],
  },
  {
    id: "midsize-jet",
    name: "Midsize Jet",
    category: "Midsize Jet",
    image: "/images/mid-jet.png",
    support: "Crew sourcing, support request review, and coordination for domestic or regional operating needs.",
    factors: ["Crew requirement", "Aircraft status", "Route complexity", "Owner/operator approval"],
  },
  {
    id: "super-midsize-jet",
    name: "Super-Midsize Jet",
    category: "Super-Midsize Jet",
    image: "/images/heavy-jet.png",
    support: "Expanded crew, travel, documentation, and logistics support for more complex movements.",
    factors: ["Mission complexity", "Crew availability", "International considerations", "Vendor coordination"],
  },
  {
    id: "large-cabin-jet",
    name: "Large-Cabin Jet",
    category: "Large-Cabin Jet",
    image: "/images/heavy-jet.png",
    support: "Longer-range support coordination where crew, aircraft status, facilities, and approvals require tighter control.",
    factors: ["Operating authority", "Insurance", "Airport restrictions", "Final acceptance"],
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
    image: "/images/jet-interior.png",
    actions: ["Support requests", "Passenger context", "Aircraft documents", "AMG messages"],
  },
  {
    id: "crew",
    title: "Crew Portal",
    href: "/portal/crew",
    access: "Pilots, maintenance, aircraft managers, and external support users",
    image: "/images/operations.png",
    actions: ["Assignment review", "Manifest context", "Aircraft readiness", "Document tracking"],
  },
  {
    id: "admin",
    title: "Admin Portal",
    href: "/portal/admin",
    access: "AMG operations and administrators",
    image: "/images/jet-sky.png",
    actions: ["Access review", "User permissions", "Support records", "Operational settings"],
  },
  {
    id: "partner",
    title: "Partner Portal",
    href: "/portal/partner",
    access: "Approved aviation service partners and vendors",
    image: "/images/jet-sky.png",
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
    heading: "Portal",
    links: [
      { label: "Portal System", href: "/portal" },
      { label: "Client Portal", href: "/portal/client" },
      { label: "Crew Portal", href: "/portal/crew" },
      { label: "Partner Portal", href: "/portal/partner" },
      { label: "Admin Login", href: "/login" },
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
  { label: "Pilot Network", href: "/pilot-network" },
  { label: "Plans", href: "/plans" },
  { label: "Team", href: "/team" },
  { label: "Contact", href: "/contact" },
] as const;
