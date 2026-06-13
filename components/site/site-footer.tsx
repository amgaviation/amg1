import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { COMPANY, FOOTER_COLS } from "@/lib/content";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

export function SiteFooter() {
  return (
    <footer className="cinematic-band relative border-t border-white/10 bg-card/40">
      <div className="absolute inset-0 -z-10 opacity-15" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/jet-interior.png" alt="" className="h-full w-full object-cover" data-parallax="0.03" />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        <Reveal className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto]" data-scroll-animate>
          <div className="max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-white.png" alt="AMG Aviation Group" width="1088" height="221" className="h-10 w-auto" />
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {COMPANY.tagline}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <a
              href={`mailto:${COMPANY.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 font-display text-xs font-semibold uppercase text-accent transition-colors hover:border-accent hover:text-foreground"
              data-cursor="EMAIL"
            >
              {COMPANY.email}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <span className="text-xs uppercase text-muted-foreground">{COMPANY.location}</span>
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
                      className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      data-cursor="OPEN"
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

        <Reveal className="glass-panel mt-12 rounded-lg p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {COMPANY.requestDisclaimer}
          </p>
        </Reveal>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
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
