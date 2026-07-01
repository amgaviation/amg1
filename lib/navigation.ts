import { FOOTER_COLS, NAV_LINKS } from "@/lib/content";

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

export const PUBLIC_NAV_GROUPS: PublicNavGroup[] = [
  {
    label: "Company",
    href: "/about",
    items: [
      { label: "About AMG", href: "/about", description: "Company overview, values, and AMG support structure." },
      { label: "Team / support structure", href: "/team", description: "The roles behind AMG support requests." },
      { label: "Pilot Application", href: "/crew-network/apply", description: "Apply for AMG Crew Network review." },
      { label: "Contact", href: "/contact", description: "Send a general inquiry to AMG." },
    ],
  },
  {
    label: "Services",
    href: "/services",
    items: [
      { label: "Services overview", href: "/services", description: "Crew coverage, aircraft movement, maintenance repositioning, and recurring support." },
      { label: "Aircraft support", href: "/aircraft", description: "Aircraft categories and support context." },
      { label: "Crew network", href: "/pilot-network", description: "Crew-related support and credential review context." },
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

export const PUBLIC_FOOTER_GROUPS = FOOTER_COLS;
