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

export const PUBLIC_NAV_GROUPS: PublicNavGroup[] = [
  {
    label: "Services",
    href: "/services",
    items: [
      { label: "Services Overview", href: "/services", description: "Aircraft movement, maintenance repositioning, crew support, and recurring coordination." },
      { label: "Aircraft Support", href: "/aircraft-support", description: "Aircraft movement, route, timing, crew, and aircraft-status context." },
      { label: "Support Plans", href: "/plans", description: "On-demand, recurring owner, and fleet/department support models." },
      { label: "Request Aircraft Support", href: "/booking-request", description: "Submit aircraft, timing, and support details for AMG review." },
    ],
  },
  {
    label: "AMG Connect",
    href: "/amg-connect",
    items: [
      { label: "AMG Connect Overview", href: "/amg-connect", description: "A marketing preview of request, document, quote, invoice, and status visibility." },
      { label: "Request AMG Connect Access", href: "/login?mode=request", description: "Request an AMG Connect account for an approved role." },
      { label: "Member Login", href: "/login", description: "Access AMG Connect." },
    ],
  },
  {
    label: "Network",
    href: "/pilot-network",
    items: [
      { label: "Pilot Network", href: "/pilot-network", description: "Profile review for aircraft experience, credential readiness, location, and fit." },
      { label: "Join Pilot Network", href: "/crew-network/apply", description: "Submit a profile for AMG review." },
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
    label: "Company",
    href: "/about",
    items: [
      { label: "About AMG", href: "/about" },
      { label: "Contact AMG", href: "/contact" },
      { label: "Pilot Network", href: "/pilot-network" },
    ],
  },
  {
    label: "Legal",
    href: "/legal",
    items: PUBLIC_LEGAL_FOOTER_LINKS,
  },
];

export const PUBLIC_SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/amgaviation/",
    ariaLabel: "Visit AMG Aviation Group on Instagram",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61577781473240",
    ariaLabel: "Visit AMG Aviation Group on Facebook",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/amg-aviation-group",
    ariaLabel: "Visit AMG Aviation Group on LinkedIn",
  },
] as const;
