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
      { label: "Contact", href: "/contact", description: "Send a general inquiry to AMG." },
      { label: "AMG Connect", href: "/amg-connect", description: "Portal overview for clients, crews, partners, and AMG Operations." },
    ],
  },
  {
    label: "Services",
    href: "/capabilities",
    items: [
      { label: "Services Overview", href: "/capabilities#what-amg-supports", description: "Crew hiring, aircraft movement, maintenance repositioning, and recurring plans." },
      { label: "Request Process", href: "/capabilities#request-process", description: "How support is reviewed, quoted, coordinated, and closed out." },
      { label: "Aircraft Supported", href: "/aircraft-support", description: "Aircraft categories and support context." },
      { label: "Crew Network", href: "/crew-network", description: "Crew-related support and credential review context." },
    ],
  },
  {
    label: "Support Options",
    href: "/plans",
    items: [
      { label: "Support Plans", href: "/plans", description: "Compare on-demand, monthly owner, and fleet plans." },
      { label: "Plan Comparison", href: "/plans#plans-comparison", description: "Review included support areas and operational notes." },
      { label: "Request Support Option Review", href: "/request-support?category=subscription-program-inquiry", description: "Start a scoped support-plan review." },
    ],
  },
  {
    label: "AMG Connect",
    href: "/amg-connect",
    items: [
      { label: "Member Login", href: "/login", description: "Access AMG Connect." },
      { label: "Request Portal Access", href: "/login?mode=request", description: "Request a portal account for an approved role." },
      { label: "Start a Support Request", href: "/request-support", description: "Submit an aircraft support request." },
    ],
  },
];

export const PUBLIC_FOOTER_GROUPS = FOOTER_COLS;
