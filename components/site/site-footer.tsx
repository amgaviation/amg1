import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CookiePreferencesButton } from "@/components/compliance/cookie-consent";
import { COMPANY } from "@/lib/content";
import { PUBLIC_FOOTER_GROUPS } from "@/lib/navigation";

const FOOTER_NOTE =
  "AMG support requests are subject to aircraft status, crew availability, owner/operator approval, operating conditions, support-scope review, and final acceptance. AMG Aviation Group does not present a request as accepted until the applicable review is complete.";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#000000] text-white">
      <div className="oc-shell relative z-10 py-16 lg:py-20">
        {/* Main grid */}
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Brand column */}
          <div className="max-w-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.png" alt="AMG Aviation Group" width="1088" height="221" className="h-7 w-auto opacity-90" />
            <p className="mt-6 text-[0.85rem] leading-relaxed text-white/40">
              Private aircraft support coordination for crew coverage, aircraft movement, maintenance repositioning, and recurring owner or flight-department needs.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/request-support"
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-widest text-black transition-all duration-200 hover:bg-white/88 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]"
              >
                Start a Support Request
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/login"
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-5 py-2.5 text-[0.7rem] font-semibold uppercase tracking-widest text-white/45 transition-all duration-200 hover:border-white/[0.2] hover:text-white/80"
              >
                Member Login
              </Link>
            </div>
          </div>

          {/* Nav link columns */}
          <div className="grid grid-cols-2 gap-7 sm:grid-cols-4">
            {PUBLIC_FOOTER_GROUPS.map((col) => (
              <div key={col.heading}>
                <h2 className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/25">
                  {col.heading}
                </h2>
                <ul className="mt-4 flex flex-col gap-1">
                  {col.links.map((link) => (
                    <li key={`${col.heading}-${link.label}`}>
                      <Link
                        href={link.href}
                        prefetch={false}
                        className="inline-flex min-h-9 items-center text-[0.82rem] leading-snug text-white/35 transition-colors duration-200 hover:text-white/80"
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

        {/* Disclaimer band */}
        <div className="mt-12 grid gap-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <p className="max-w-4xl text-xs leading-relaxed text-white/25">{FOOTER_NOTE}</p>
          <a
            href={`mailto:${COMPANY.email}`}
            className="font-mono text-[0.8rem] text-white/30 transition-colors duration-200 hover:text-white/70"
          >
            {COMPANY.email}
          </a>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-white/25 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </span>
          <span className="flex flex-wrap items-center gap-4">
            <CookiePreferencesButton className="text-white/25 transition-colors duration-200 hover:text-white/60" />
            <span>{COMPANY.location}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
