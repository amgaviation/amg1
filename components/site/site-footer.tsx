import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CookiePreferencesButton } from "@/components/compliance/cookie-consent";
import { PhoneLink } from "@/components/site/tracked-link";
import { PUBLIC_FOOTER_GROUPS } from "@/lib/navigation";
import { AFFILIATIONS, OPERATIONAL_CONTROL_STATEMENT, SITE } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--oc-line-dark)] bg-[#070B14] text-[var(--oc-paper)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(11,94,212,0.09),transparent_30rem)]" aria-hidden="true" />
      <div className="oc-shell relative z-10 py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-short.png"
              alt="AMG Aviation Group"
              width="1110"
              height="242"
              className="h-9 w-auto"
            />
            <p className="mt-3 font-mono text-[10px] uppercase [letter-spacing:0.22em] text-[var(--t3)]">
              Aircraft support coordination
            </p>
            <p className="mt-6 text-base leading-relaxed text-[var(--oc-aluminum)]">
              Vetted contract pilots, maintenance ferries, and repositioning for owners who fly
              Part 91 — quoted within 24 business hours, tracked in one portal, priced flat.
            </p>
            <address className="mt-6 grid gap-1.5 not-italic text-sm text-[var(--oc-aluminum)]">
              <span>{SITE.streetAddress}</span>
              <PhoneLink source="footer" className="oc-mono w-fit transition-colors hover:text-white" />
              <a href={`mailto:${SITE.email}`} className="oc-mono w-fit transition-colors hover:text-white">
                {SITE.email}
              </a>
            </address>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {AFFILIATIONS.map((affiliation) => (
                <span
                  key={affiliation}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--oc-line-dark)] bg-white/[0.04] px-3 py-1.5 text-[0.7rem] font-semibold uppercase text-[var(--oc-aluminum)]"
                >
                  <span className="oc-dot" aria-hidden="true" />
                  {affiliation}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/request" prefetch={false} className="oc-btn oc-btn-light">
                Get a Quote
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/login" prefetch={false} className="oc-btn oc-btn-ghost-dark">
                Portal login
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7 sm:grid-cols-3">
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

        <p className="mt-12 max-w-4xl text-xs leading-relaxed text-[var(--oc-aluminum-2)]">
          {OPERATIONAL_CONTROL_STATEMENT}{" "}
          Details in{" "}
          <Link href="/legal" prefetch={false} className="underline underline-offset-2 transition-colors hover:text-white">
            Legal
          </Link>
          .
        </p>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--oc-line-dark)] pt-6 text-xs text-[var(--oc-aluminum-2)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </span>
          <span className="flex flex-wrap items-center gap-3">
            <CookiePreferencesButton className="text-[var(--oc-aluminum-2)] transition-colors hover:text-white" />
            <span>{SITE.cityState}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
