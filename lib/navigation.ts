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

/**
 * Primary top navigation — simple, conversion-focused.
 * The header CTA pair (Request Aircraft Support / Member Login) lives in
 * PUBLIC_NAV_CTAS below.
 */
export const PUBLIC_NAV_LINKS: PublicNavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Support Plans", href: "/plans" },
  { label: "AMG Connect", href: "/amg-connect" },
  { label: "Pilot Network", href: "/pilot-network" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const PUBLIC_NAV_CTAS = {
  primary: { label: "Request Aircraft Support", href: "/booking-request" },
  secondary: { label: "Member Login", href: "/login" },
} as const;

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

export const PUBLIC_NAV_GROUPS: PublicNavGroup[] = [
  {
    label: "Explore",
    href: "/services",
    items: [
      { label: "Services", href: "/services" },
      { label: "Aircraft Support", href: "/aircraft-support" },
      { label: "Support Plans", href: "/plans" },
      { label: "Pilot Network", href: "/pilot-network" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  {
    label: "Company",
    href: "/about",
    items: [
      { label: "About AMG", href: "/about" },
      { label: "AMG Connect", href: "/amg-connect" },
      { label: "Contact", href: "/contact" },
      { label: "Crew Application", href: "/crew-network/apply" },
    ],
  },
  {
    label: "Get Started",
    href: "/booking-request",
    items: [
      { label: "Request Aircraft Support", href: "/booking-request" },
      { label: "Request a Plan Review", href: "/booking-request?category=subscription-program-inquiry" },
      { label: "Member Login", href: "/login" },
      { label: "Request Portal Access", href: "/login?mode=request" },
    ],
  },
];

export const PUBLIC_FOOTER_GROUPS: PublicNavGroup[] = [
  ...PUBLIC_NAV_GROUPS,
  {
    label: "Legal",
    href: "/legal",
    items: PUBLIC_LEGAL_FOOTER_LINKS,
  },
];
