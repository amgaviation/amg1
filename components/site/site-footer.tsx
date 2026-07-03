import Link from "next/link";
import { ArrowUpRight, Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import { CookiePreferencesButton } from "@/components/compliance/cookie-consent";
import { COMPANY, SOCIAL_LINKS } from "@/lib/content";
import { PUBLIC_FOOTER_GROUPS, PUBLIC_NAV_CTAS } from "@/lib/navigation";

const FOOTER_NOTE =
  "AMG support requests are subject to aircraft status, crew availability, owner/operator approval, operating conditions, support-scope review, and final acceptance. AMG Aviation Group does not present a request as accepted until the applicable review is complete.";

const SOCIAL_ICONS = {
  Facebook,
  Instagram,
  LinkedIn: Linkedin,
} as const;

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--oc-line-dark)] bg-[var(--amg-bg-footer)] text-[var(--oc-paper)]">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(46,107,240,0.14),transparent_32rem)]"
        aria-hidden="true"
      />
      <div className="oc-shell relative z-10 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
          <div className="max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.png" alt="AMG Aviation Group" width="1088" height="221" className="h-8 w-auto" />
            <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--oc-aluminum)]">
              Aviation operations and support coordination for private aircraft owners, Part 91 operators, flight
              departments, crews, and aviation partners.
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              <a
                href={`mailto:${COMPANY.email}`}
                className="inline-flex min-h-9 items-center gap-2.5 text-sm text-[var(--oc-aluminum)] transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-[var(--oc-sky)]" aria-hidden="true" />
                {COMPANY.email}
              </a>
              <a
                href={`tel:${COMPANY.phone.replace(/[^0-9+]/g, "")}`}
                className="inline-flex min-h-9 items-center gap-2.5 text-sm text-[var(--oc-aluminum)] transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-[var(--oc-sky)]" aria-hidden="true" />
                {COMPANY.phone}
              </a>
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              {SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS];
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`AMG Aviation Group on ${social.label}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.14] text-[var(--oc-aluminum)] transition-colors hover:border-[var(--oc-sky)]/60 hover:text-white"
                  >
                    {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                  </a>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={PUBLIC_NAV_CTAS.primary.href} prefetch={false} className="oc-btn oc-btn-primary">
                {PUBLIC_NAV_CTAS.primary.label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href={PUBLIC_NAV_CTAS.secondary.href} prefetch={false} className="oc-btn oc-btn-ghost-dark">
                {PUBLIC_NAV_CTAS.secondary.label}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {PUBLIC_FOOTER_GROUPS.map((col) => (
              <div key={col.label}>
                <h2 className="oc-kicker text-[var(--oc-aluminum-2)]">{col.label}</h2>
                <ul className="mt-4 flex flex-col gap-1">
                  {col.items.map((link) => (
                    <li key={`${col.label}-${link.label}`}>
                      <Link
                        href={link.href}
                        prefetch={false}
                        className="inline-flex min-h-9 items-center text-sm leading-snug text-[var(--oc-aluminum)] transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-14 max-w-4xl text-xs leading-relaxed text-[var(--oc-aluminum-2)]/80">{FOOTER_NOTE}</p>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--oc-line-dark)] pt-6 text-xs text-[var(--oc-aluminum-2)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </span>
          <span className="flex flex-wrap items-center gap-3">
            <CookiePreferencesButton className="text-[var(--oc-aluminum-2)] transition-colors hover:text-white" />
            <span>{COMPANY.location}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
