import Link from "next/link";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { CookiePreferencesButton } from "@/components/compliance/cookie-consent";
import { COMPANY } from "@/lib/content";
import { PUBLIC_FOOTER_GROUPS, PUBLIC_SOCIAL_LINKS } from "@/lib/navigation";

const FOOTER_NOTE =
  "Support requests are reviewed for aircraft status, crew availability, timing, owner/operator approval, and operational fit before acceptance.";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--oc-line-dark)] bg-[#050B14] text-[var(--oc-paper)]">
      <div className="oc-shell relative z-10 py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.png" alt="AMG Aviation Group" width="1088" height="221" className="h-9 w-auto" />
            <p className="mt-6 text-base leading-relaxed text-[var(--oc-aluminum)]">
              Private aircraft support coordination for aircraft movement, maintenance repositioning, crew support,
              and recurring owner or flight-department needs.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/booking-request" prefetch={false} className="oc-btn oc-btn-light">
                Request Aircraft Support
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/login" prefetch={false} className="oc-btn oc-btn-ghost-dark">
                Member Login
              </Link>
            </div>

            <div className="mt-7 grid gap-2 text-sm text-[var(--oc-aluminum)]">
              <a href="mailto:Information@amgaviationgroup.com" className="inline-flex min-h-9 items-center gap-2 transition-colors hover:text-white">
                <Mail className="h-4 w-4 text-[var(--oc-blue)]" aria-hidden="true" />
                Information@amgaviationgroup.com
              </a>
              <a href="tel:+19544081730" className="inline-flex min-h-9 items-center gap-2 transition-colors hover:text-white">
                <Phone className="h-4 w-4 text-[var(--oc-blue)]" aria-hidden="true" />
                954-408-1730
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {PUBLIC_SOCIAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.ariaLabel}
                  className="inline-flex min-h-9 items-center rounded-full border border-white/[0.14] px-3 text-xs font-semibold uppercase text-[var(--oc-aluminum)] transition-colors hover:border-[var(--oc-blue)] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7 sm:grid-cols-3 lg:grid-cols-4">
            {PUBLIC_FOOTER_GROUPS.map((col) => (
              <div key={col.label}>
                <Link
                  href={col.href}
                  prefetch={false}
                  className="oc-kicker inline-flex min-h-8 items-center text-[var(--oc-aluminum-2)] transition-colors hover:text-white"
                >
                  {col.label}
                </Link>
                <ul className="mt-4 flex flex-col gap-1.5">
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

        <div className="mt-12 rounded-lg border border-[var(--oc-line-dark)] bg-white/[0.035] p-5">
          <p className="max-w-4xl text-xs leading-relaxed text-[var(--oc-aluminum-2)]">{FOOTER_NOTE}</p>
        </div>

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
