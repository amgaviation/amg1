import { MISSION_CASE_STUDIES } from "@/content/missions";

export type PublicNavItem = {
  label: string;
  href: string;
  description?: string;
};

/**
 * Flat public nav per the Website Build Specification sitemap. /missions
 * appears only once real case studies exist (no placeholder proof ships).
 */
export const PUBLIC_NAV_LINKS: PublicNavItem[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "How It Works", href: "/how-it-works" },
  ...(MISSION_CASE_STUDIES.length ? [{ label: "Missions", href: "/missions" }] : []),
  { label: "Team", href: "/team" },
  { label: "Pilots", href: "/pilots" },
  { label: "For Shops", href: "/for-shops" },
];

export const PUBLIC_LEGAL_FOOTER_LINKS: PublicNavItem[] = [
  { label: "Legal", href: "/legal" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Accessibility", href: "/accessibility" },
];

export const PUBLIC_FOOTER_GROUPS: { label: string; href: string; items: PublicNavItem[] }[] = [
  {
    label: "Site",
    href: "/",
    items: [
      ...PUBLIC_NAV_LINKS,
      { label: "Get a Quote", href: "/request" },
    ],
  },
  {
    label: "Support",
    href: "/request",
    items: [
      { label: "Request Support", href: "/request" },
      { label: "Apply to the pilot network", href: "/pilots/apply" },
    ],
  },
  {
    label: "Legal",
    href: "/legal",
    items: PUBLIC_LEGAL_FOOTER_LINKS,
  },
];
