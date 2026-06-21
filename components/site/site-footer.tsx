import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CookiePreferencesButton } from "@/components/compliance/cookie-consent";
import { COMPANY } from "@/lib/content";
import { PUBLIC_FOOTER_GROUPS } from "@/lib/navigation";

const FOOTER_NOTE =
  "AMG support requests are subject to aircraft status, crew availability, owner/operator approval, operating conditions, support-scope review, and final acceptance. AMG Aviation Group does not present a request as accepted until the applicable review is complete.";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--oc-line-dark)] bg-[#050B14] text-[var(--oc-paper)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(59,130,246,0.16),transparent_30rem)]" aria-hidden="true" />
      <div className="oc-shell relative z-10 py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.png" alt="AMG Aviation Group" width="1088" height="221" className="h-9 w-auto" />
            <p className="mt-6 text-base leading-relaxed text-[var(--oc-aluminum)]">
              Private aircraft support coordination for crew coverage, aircraft movement, maintenance repositioning, and recurring owner or flight-department needs.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/request-support" prefetch={false} className="oc-btn oc-btn-light">
                Start Your Request
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/login" prefetch={false} className="oc-btn oc-btn-ghost-dark">
                Member Login
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-7 sm:grid-cols-4">
            {PUBLIC_FOOTER_GROUPS.map((col) => (
              <div key={col.heading}>
                <h2 className="oc-kicker text-[var(--oc-aluminum-2)]">{col.heading}</h2>
                <ul className="mt-4 flex flex-col gap-1.5">
                  {col.links.map((link) => (
                    <li key={`${col.heading}-${link.label}`}>
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

        <div className="mt-12 grid gap-6 rounded-lg border border-[var(--oc-line-dark)] bg-white/[0.035] p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <p className="max-w-4xl text-xs leading-relaxed text-[var(--oc-aluminum-2)]">{FOOTER_NOTE}</p>
          <a
            href={`mailto:${COMPANY.email}`}
            className="oc-mono inline-flex min-h-9 items-center text-sm text-[var(--oc-aluminum)] transition-colors hover:text-white"
          >
            {COMPANY.email}
          </a>
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
