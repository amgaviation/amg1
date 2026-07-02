import { NAV_LINKS } from "@/lib/content";

export type PublicNavItem = {
  label: string;
  href: string;
  description?: string;
};

export type PublicNavGroup = {
  label: string;
  href: string;
  items: PublicNavItem[];
};

export const PUBLIC_NAV_LINKS = NAV_LINKS;

export const PUBLIC_DIRECT_NAV_LINKS: PublicNavItem[] = [
  { label: "Tarmac", href: "/tarmac" },
];

export const PUBLIC_NAV_GROUPS: PublicNavGroup[] = [
  {
    label: "Company",
    href: "/about",
    items: [
      { label: "About AMG", href: "/about", description: "Company overview, values, and AMG support structure." },
      { label: "Tarmac", href: "/tarmac", description: "Brand architecture preview for Tarmac and Stark Aviation under AMG." },
      { label: "Team / support structure", href: "/team", description: "The roles behind AMG support requests." },
      { label: "Pilot Application", href: "/crew-network/apply", description: "Apply for AMG Crew Network review." },
      { label: "Contact", href: "/contact", description: "Send a general inquiry to AMG." },
    ],
  },
  {
    label: "Services",
    href: "/capabilities",
    items: [
      { label: "Services overview", href: "/capabilities", description: "Crew coverage, aircraft movement, maintenance repositioning, and recurring support." },
      { label: "Aircraft support", href: "/aircraft-support", description: "Aircraft categories and support context." },
      { label: "Aircraft management support", href: "/capabilities#aircraft-management-support", description: "Administrative visibility around aircraft, records, and communication." },
      { label: "Contract pilot support", href: "/capabilities#contract-pilot-support", description: "Aircraft-specific pilot coverage and suitability review." },
      { label: "Ferry & repositioning", href: "/capabilities#ferry-repositioning", description: "Aircraft movement review for delivery, maintenance, and repositioning." },
      { label: "Maintenance flight support", href: "/capabilities#maintenance-flight-support", description: "Maintenance-related movement, records, and facility timing coordination." },
      { label: "Flight ops coordination", href: "/capabilities#flight-ops-coordination", description: "Logistics, vendors, schedules, and stakeholder communication." },
      { label: "Fleet support", href: "/capabilities#fleet-support", description: "Recurring support across multiple aircraft and timing windows." },
      { label: "Crew network", href: "/crew-network", description: "Crew-related support and credential review context." },
    ],
  },
  {
    label: "Support plans",
    href: "/plans",
    items: [
      { label: "Support plans", href: "/plans", description: "Compare on-demand, recurring owner, and fleet support structures." },
      { label: "Plan comparison", href: "/plans#plans-comparison", description: "Review included support areas and operational notes." },
      { label: "Request a plan review", href: "/booking-request?category=subscription-program-inquiry", description: "Start a scoped support-plan review." },
    ],
  },
  {
    label: "AMG Connect",
    href: "/amg-connect",
    items: [
      { label: "Member login", href: "/login", description: "Access AMG Connect." },
      { label: "Request Portal Access", href: "/login?mode=request", description: "Request a portal account for an approved role." },
      { label: "Request aircraft support", href: "/booking-request", description: "Submit an aircraft support request." },
    ],
  },
];

export const PUBLIC_LEGAL_FOOTER_LINKS: PublicNavItem[] = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Privacy Choices", href: "/privacy-choices" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Mission Acceptance Policy", href: "/mission-acceptance" },
  { label: "Credential Submission Notice", href: "/credential-submission" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "All Legal Notices", href: "/legal" },
];

export const PUBLIC_FOOTER_GROUPS: PublicNavGroup[] = [
  ...PUBLIC_NAV_GROUPS,
  {
    label: "Legal",
    href: "/legal",
    items: PUBLIC_LEGAL_FOOTER_LINKS,
  },
];
