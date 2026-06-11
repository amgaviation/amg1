import Link from "next/link";
import { COMPANY } from "@/lib/content";

const FOOTER_COLS = [
  {
    heading: "Company",
    links: [
      { label: "About AMG", href: "/about" },
      { label: "Our Team", href: "/team" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Capabilities",
    links: [
      { label: "Services", href: "/services" },
      { label: "Aircraft", href: "/aircraft" },
      { label: "Pilot Network", href: "/pilot-network" },
    ],
  },
  {
    heading: "Administrative",
    links: [
      { label: "Plans & Pricing", href: "/plans" },
      { label: "Member Login", href: "/login" },
      { label: "Support", href: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.png" alt="AMG Aviation Group" className="h-10 w-auto" />
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {COMPANY.tagline} Operating under FAR Part 91 for private flight
              operations.
            </p>
            <a
              href={`mailto:${COMPANY.email}`}
              className="mt-6 inline-block text-sm text-accent hover:text-accent/80"
            >
              {COMPANY.email}
            </a>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="eyebrow mb-5 text-[0.7rem] text-accent">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-border p-4">
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            {COMPANY.disclaimer}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>
            &copy; {new Date().getFullYear()} {COMPANY.name}. All rights
            reserved.
          </span>
          <span>{COMPANY.email}</span>
        </div>
      </div>
    </footer>
  );
}
