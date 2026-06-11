export const COMPANY = {
  name: "AMG Aviation Group",
  shortName: "AMG",
  tagline: "Private aviation management, crew coordination, and owner support.",
  email: "information@amgaviationgroup.com",
  phone: "",
  location: "United States based. Worldwide coordination.",
  disclaimer:
    "AMG Aviation Group provides private aviation management and coordination support for Part 91 operations. AMG is not an air carrier and this website does not constitute an offer of charter air transportation.",
} as const;

export const STATS = [
  { label: "Operational focus", value: 24, suffix: "/7" },
  { label: "Aircraft categories", value: 4, suffix: "" },
  { label: "Portal roles", value: 3, suffix: "" },
  { label: "Mission support", value: 365, suffix: "" },
] as const;

export const SERVICES = [
  {
    id: "mission-control",
    title: "Mission Control",
    summary:
      "Trip requests, crew review, itinerary changes, passenger details, and operational notes managed in one organized workflow.",
    points: [
      "Owner trip request intake",
      "Crew approval for edits and cancellations",
      "Airport, FBO, catering, and ground detail tracking",
      "Mobile-first mission updates",
    ],
  },
  {
    id: "crew-operations",
    title: "Crew Operations",
    summary:
      "A dedicated crew portal gives pilots and operations staff the authority to manage schedules, assignments, manifests, and approvals.",
    points: [
      "Pilot and external user permissions",
      "Trip pool and assignment boards",
      "Availability and document tracking",
      "Weather and TFR-ready dispatch view",
    ],
  },
  {
    id: "aircraft-management",
    title: "Aircraft Management",
    summary:
      "A clean operational record for aircraft profiles, readiness, maintenance notes, documents, and owner-facing visibility.",
    points: [
      "Aircraft profiles and status",
      "Maintenance and document oversight",
      "Fleet readiness notes",
      "Owner and crew-specific access",
    ],
  },
  {
    id: "client-experience",
    title: "Client Experience",
    summary:
      "A refined private portal for clients to request trips, manage passenger profiles, view mission status, and message AMG.",
    points: [
      "Client dashboard and request flow",
      "Passenger profile management",
      "Messages and documents",
      "Discreet, private support channel",
    ],
  },
] as const;

export const CAPABILITIES = [
  {
    title: "Crew Authority",
    body: "Pilots and approved crew can manage the operation with role defaults and per-person permission overrides.",
  },
  {
    title: "Client Control",
    body: "Owners can request, edit, and cancel trips while crew are notified and can approve operational changes.",
  },
  {
    title: "Admin Visibility",
    body: "AMG administrators can review access requests, manage users, aircraft, documents, settings, and mission data.",
  },
  {
    title: "Mobile First",
    body: "Every public and portal surface is designed for fast, no-zoom use from a phone as well as desktop.",
  },
] as const;

export const FLEET = [
  {
    id: "light",
    name: "Light Jet",
    category: "Light Jet",
    image: "/images/light-jet.png",
    range: "1,800 nm",
    pax: "6-7 seats",
    speed: "440 kts",
    endurance: "3-4 hrs",
    altitude: "41,000 ft",
    baggage: "40-60 ft3",
    description:
      "Efficient short-haul lift for owner missions, day trips, repositioning, and smaller-market airport access.",
  },
  {
    id: "mid",
    name: "Midsize Jet",
    category: "Mid Jet",
    image: "/images/mid-jet.png",
    range: "3,000 nm",
    pax: "8-9 seats",
    speed: "460 kts",
    endurance: "5-6 hrs",
    altitude: "45,000 ft",
    baggage: "70-90 ft3",
    description:
      "A balanced cabin and range profile for regional business travel, family missions, and coast-to-coast planning.",
  },
  {
    id: "heavy",
    name: "Heavy Jet",
    category: "Heavy Jet",
    image: "/images/heavy-jet.png",
    range: "6,000 nm",
    pax: "12-16 seats",
    speed: "488 kts",
    endurance: "10-12 hrs",
    altitude: "51,000 ft",
    baggage: "150+ ft3",
    description:
      "Long-range capability with stand-up cabin comfort for international, multi-passenger, and complex itineraries.",
  },
  {
    id: "turboprop",
    name: "Turboprop",
    category: "Turboprop",
    image: "/images/turboprop.png",
    range: "1,500 nm",
    pax: "6-8 seats",
    speed: "310 kts",
    endurance: "4-5 hrs",
    altitude: "30,000 ft",
    baggage: "50-70 ft3",
    description:
      "Practical access to shorter runways and remote airports with strong operating efficiency.",
  },
] as const;

export const VALUES = [
  {
    title: "Discretion",
    body: "Aircraft, passenger, and mission details stay private and are only surfaced to the roles that need them.",
  },
  {
    title: "Precision",
    body: "Every request moves through a clear operational path from submission to crew review to scheduled mission.",
  },
  {
    title: "Authority",
    body: "Crew have the tools and permissions to keep the operation safe, current, and accountable.",
  },
  {
    title: "Clarity",
    body: "Clients see what matters. Crew see what they need. Admins see the whole operation.",
  },
] as const;

export const TEAM = [
  {
    name: "AMG Operations",
    title: "Mission Coordination",
    bio: "The central team responsible for trip review, scheduling, aircraft readiness, owner communication, and crew coordination.",
    initials: "AO",
  },
  {
    name: "Flight Crew",
    title: "Operational Authority",
    bio: "Approved pilots and crew manage assignments, manifests, mission details, and operational approvals.",
    initials: "FC",
  },
  {
    name: "Client Services",
    title: "Owner Support",
    bio: "A private support channel for passenger profiles, trip preferences, documents, and owner-facing updates.",
    initials: "CS",
  },
  {
    name: "Admin Desk",
    title: "Access & Records",
    bio: "Administrators oversee account approvals, permissions, documents, aircraft data, and portal settings.",
    initials: "AD",
  },
] as const;

export const PILOT_REQUIREMENTS = [
  "Verified identity and AMG-approved account access",
  "Pilot, maintenance, manager, or external support role assignment",
  "Permission defaults that can be overridden per person",
  "Current documents and qualifications where applicable",
  "Agreement to AMG operational communication standards",
] as const;

export const PILOT_BENEFITS = [
  {
    title: "Full Mission Context",
    body: "See trip details, assignment status, aircraft data, passenger notes, and operational updates in one place.",
  },
  {
    title: "Approval Workflow",
    body: "Review owner edits, cancellations, access requests, and crew assignments without digging through messages.",
  },
  {
    title: "Mobile Dispatch",
    body: "Use a phone-friendly crew interface built for quick checks, fast updates, and no pinching to zoom.",
  },
  {
    title: "Role Permissions",
    body: "Separate pilot, maintenance, aircraft manager, and external user access without rebuilding the system.",
  },
] as const;

export const PLANS = [
  {
    id: "owner",
    name: "Owner Access",
    monthly: "Client portal",
    description: "For aircraft owners and approved client representatives.",
    features: [
      "Request new trips",
      "Edit and cancel owner missions",
      "Manage passenger profiles",
      "View mission status",
      "Message AMG Operations",
    ],
    highlighted: false,
  },
  {
    id: "crew",
    name: "Crew Operations",
    monthly: "Operational portal",
    description: "For pilots and crew with operational authority.",
    features: [
      "Manage assigned trips",
      "Approve owner changes",
      "Review manifests",
      "Track availability and documents",
      "Manage aircraft and crew data by permission",
    ],
    highlighted: true,
  },
  {
    id: "admin",
    name: "Admin Control",
    monthly: "AMG command center",
    description: "For AMG staff managing the whole system.",
    features: [
      "Approve access requests",
      "Manage users and permissions",
      "Monitor trip pool and assignments",
      "Manage settings and documents",
      "Audit client and crew activity",
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
    actions: ["Request trip", "Manage passengers", "View missions", "Message AMG"],
  },
  {
    id: "crew",
    title: "Crew Portal",
    href: "/portal/crew",
    access: "Pilots, maintenance, aircraft managers, and external crew users",
    image: "/images/operations.png",
    actions: ["Approve changes", "Manage assignments", "Review manifests", "Track documents"],
  },
  {
    id: "admin",
    title: "Admin Portal",
    href: "/portal/admin",
    access: "AMG operations and administrators",
    image: "/images/jet-sky.png",
    actions: ["Approve access", "Manage users", "Configure permissions", "Monitor operations"],
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
  "Dubai",
  "Toronto",
  "Mexico City",
  "Sao Paulo",
  "Milan",
  "Tokyo",
  "Singapore",
  "Cape Town",
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
