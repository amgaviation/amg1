import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { COMPANY, FOOTER_COLS } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-900/10 bg-[var(--amg-ink)] text-white">
      <div className="absolute inset-0 z-0 opacity-12" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/jet-interior.png" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <Reveal className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto]" data-scroll-animate>
          <div className="max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.png" alt="AMG Aviation Group" width="1088" height="221" className="h-10 w-auto" />
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              {COMPANY.tagline}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <a
              href={`mailto:${COMPANY.email}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 font-display text-xs font-semibold uppercase text-accent transition-colors hover:border-accent hover:text-foreground"
            >
              {COMPANY.email}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <span className="text-xs uppercase text-slate-400">{COMPANY.location}</span>
          </div>
        </Reveal>

        <RevealGroup className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4" data-stagger-container>
          {FOOTER_COLS.map((col) => (
            <RevealItem key={col.heading} data-stagger-item>
              <h2 className="eyebrow mb-5 text-[0.7rem] text-accent">
                {col.heading}
              </h2>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex min-h-11 items-center gap-2 py-1 text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12 rounded-lg border border-white/10 bg-white/7 p-4">
          <p className="text-xs leading-relaxed text-slate-300">
            {COMPANY.requestDisclaimer}
          </p>
        </Reveal>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
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
