/**
 * AMG Aviation Group — Public site content
 * All company copy, services, fleet, plans, and contact info live here.
 */

export const COMPANY = {
  name: "AMG Aviation Group",
  shortName: "AMG",
  tagline: "Personalized aviation management and mission coordination.",
  email: "information@amgaviationgroup.com",
  phone: "+1 (800) 555-0199",
  location: "Headquartered in the United States",
  disclaimer:
    "AMG Aviation Group operates exclusively under FAR Part 91 for private flight operations. AMG is not an air carrier, does not hold an Air Carrier Certificate, and does not provide certificated air transportation services. Nothing on this website constitutes a charter offering.",
} as const;

export const STATS = [
  { label: "Missions Coordinated", value: 500, suffix: "+" },
  { label: "Years of Expertise", value: 15, suffix: "+" },
  { label: "Managed Aircraft", value: 120, suffix: "+" },
  { label: "Pilot Network", value: 2000, suffix: "+" },
] as const;

export const SERVICES = [
  {
    id: "management",
    title: "Aircraft Management",
    summary:
      "End-to-end oversight of your aircraft — maintenance tracking, crew coordination, regulatory compliance, and cost transparency.",
    points: [
      "Maintenance & airworthiness oversight",
      "Crew scheduling & training coordination",
      "Transparent operating cost reporting",
      "Insurance & regulatory compliance",
    ],
  },
  {
    id: "mission",
    title: "Mission Coordination",
    summary:
      "Seamless trip planning and dispatch support for every leg, handled by a dedicated coordination team available around the clock.",
    points: [
      "24/7 flight planning & dispatch support",
      "Ground handling & FBO arrangements",
      "Catering, transport & itinerary logistics",
      "Real-time mission status updates",
    ],
  },
  {
    id: "crew",
    title: "Crew Solutions",
    summary:
      "Access a vetted network of professional pilots and cabin crew matched to your aircraft type and operational standards.",
    points: [
      "Type-rated pilot sourcing",
      "Recurrent training tracking",
      "Crew currency & qualification records",
      "Cabin crew & support staff coordination",
    ],
  },
  {
    id: "advisory",
    title: "Ownership Advisory",
    summary:
      "Strategic guidance across acquisition, fleet optimization, and lifecycle planning to protect and maximize your investment.",
    points: [
      "Acquisition & disposition guidance",
      "Fleet utilization analysis",
      "Lifecycle & residual value planning",
      "Operating structure consultation",
    ],
  },
] as const;

export const CAPABILITIES = [
  {
    title: "Operational Control",
    body: "A centralized operations desk gives you a single, accountable point of contact for every aircraft and every mission.",
  },
  {
    title: "Safety First",
    body: "Conservative, safety-led decision-making rooted in FAR Part 91 best practices and continuous risk assessment.",
  },
  {
    title: "Cost Transparency",
    body: "Clear, itemized reporting so you always understand exactly what you are paying for and why.",
  },
  {
    title: "Global Reach",
    body: "Coordination support spanning domestic and international destinations through trusted ground partners.",
  },
] as const;

export const FLEET = [
  {
    id: "light",
    name: "Light Jets",
    category: "Light Jet",
    image: "/images/light-jet.png",
    range: "1,800 nm",
    pax: "6–7 pax",
    speed: "440 kts",
    description:
      "Efficient and agile for short to mid-range missions with quick access to smaller airfields.",
  },
  {
    id: "mid",
    name: "Midsize Jets",
    category: "Mid Jet",
    image: "/images/mid-jet.png",
    range: "3,000 nm",
    pax: "8–9 pax",
    speed: "460 kts",
    description:
      "The ideal balance of cabin comfort and range for transcontinental business travel.",
  },
  {
    id: "heavy",
    name: "Heavy Jets",
    category: "Heavy Jet",
    image: "/images/heavy-jet.png",
    range: "6,000 nm",
    pax: "12–16 pax",
    speed: "488 kts",
    description:
      "Long-range capability with a spacious stand-up cabin for intercontinental missions.",
  },
  {
    id: "turboprop",
    name: "Turboprops",
    category: "Turboprop",
    image: "/images/turboprop.png",
    range: "1,500 nm",
    pax: "6–8 pax",
    speed: "310 kts",
    description:
      "Versatile and economical, with the ability to operate from shorter, remote runways.",
  },
] as const;

export const VALUES = [
  {
    title: "Discretion",
    body: "Your privacy is paramount. Every mission is handled with the utmost confidentiality and care.",
  },
  {
    title: "Precision",
    body: "Meticulous planning and attention to detail at every stage of the operation.",
  },
  {
    title: "Integrity",
    body: "Honest counsel and transparent reporting, always in your best interest.",
  },
  {
    title: "Excellence",
    body: "An uncompromising standard of service that defines every interaction.",
  },
] as const;

export const TEAM = [
  {
    name: "Marcus Greer",
    title: "Founder & Managing Director",
    bio: "Over two decades in private aviation operations and fleet management, leading AMG's vision for personalized service.",
    initials: "MG",
  },
  {
    name: "Elena Vasquez",
    title: "Director of Operations",
    bio: "Oversees mission coordination and the operations desk, ensuring flawless execution across every flight.",
    initials: "EV",
  },
  {
    name: "James Whitfield",
    title: "Chief Pilot & Safety Officer",
    bio: "A career aviator responsible for safety standards, crew qualification, and operational compliance.",
    initials: "JW",
  },
  {
    name: "Sophia Chen",
    title: "Head of Client Relations",
    bio: "The dedicated bridge between clients and operations, delivering a seamless ownership experience.",
    initials: "SC",
  },
] as const;

export const PILOT_REQUIREMENTS = [
  "Valid ATP or Commercial certificate with applicable type ratings",
  "Current first or second-class medical certificate",
  "Minimum 3,000 total flight hours (turbine PIC preferred)",
  "Clean FAA record and verifiable references",
  "Commitment to AMG's safety-first operating culture",
] as const;

export const PILOT_BENEFITS = [
  {
    title: "Premium Assignments",
    body: "Fly well-maintained aircraft on professionally coordinated missions.",
  },
  {
    title: "Currency Support",
    body: "We help track your recurrent training, currency, and qualification records.",
  },
  {
    title: "Flexible Scheduling",
    body: "Match assignments to your availability and preferred aircraft types.",
  },
  {
    title: "Professional Network",
    body: "Join a community of vetted aviation professionals at the top of their field.",
  },
] as const;

export const PLANS = [
  {
    id: "essentials",
    name: "Essentials",
    monthly: 1500,
    annual: 15000,
    description: "Core management for single-aircraft owners.",
    features: [
      "Single aircraft management",
      "Maintenance tracking",
      "Standard mission coordination",
      "Monthly cost reporting",
      "Business-hours support",
    ],
    highlighted: false,
  },
  {
    id: "preferred",
    name: "Preferred",
    monthly: 3500,
    annual: 35000,
    description: "Enhanced oversight for active operators.",
    features: [
      "Up to 3 aircraft managed",
      "Priority mission coordination",
      "Dedicated account manager",
      "24/7 operations support",
      "Crew sourcing & scheduling",
      "Quarterly fleet review",
    ],
    highlighted: true,
  },
  {
    id: "elite",
    name: "Elite",
    monthly: 7500,
    annual: 75000,
    description: "White-glove management for fleets.",
    features: [
      "Unlimited fleet management",
      "Full ownership advisory",
      "Dedicated operations team",
      "Custom reporting & analytics",
      "Global ground coordination",
      "On-demand crew network access",
    ],
    highlighted: false,
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
