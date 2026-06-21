import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Figure } from "@/components/site/oc/shared";
import { COMPANY } from "@/lib/content";
import { IMG } from "@/lib/site-media";

const REVIEW_FACTORS = [
  "Aircraft status",
  "Crew qualifications",
  "Owner/operator approval",
  "Route and airport constraints",
  "Weather and timing",
  "Support scope",
] as const;

export function CompanyPositioning() {
  return (
    <section className="public-editorial-section public-company-section" aria-labelledby="company-positioning-heading">
      <div className="oc-shell grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <div data-scroll-animate>
          <p className="oc-eyebrow oc-eyebrow-light">AMG Aviation Group</p>
          <h2 id="company-positioning-heading" className="oc-display mt-5 max-w-4xl text-[clamp(2.7rem,7vw,6.5rem)] text-[var(--oc-paper)]">
            Support for the people responsible for the aircraft.
          </h2>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
            {COMPANY.tagline} AMG coordinates crew coverage, aircraft movement, maintenance repositioning, and recurring support for owners, representatives, and flight departments.
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[var(--oc-aluminum-2)]">
            Every request is reviewed before acceptance. AMG does not sell seats, operate as a charter marketplace, or replace the authority of the aircraft owner or operator.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/about" prefetch={false} className="oc-btn oc-btn-light">
              About AMG
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Contact AMG
            </Link>
            <Link href="/request-support" prefetch={false} className="oc-btn oc-btn-ghost-dark">
              Start a Request
            </Link>
          </div>
        </div>

        <div className="public-review-panel" data-scroll-animate>
          <Figure
            src={IMG.aboutOperations}
            alt="Private aviation operations desk used for aircraft support coordination"
            sizes="(max-width: 1024px) 100vw, 46vw"
            className="aspect-[4/5]"
            position="center"
          />
          <div className="public-review-panel__content">
            <p className="oc-eyebrow oc-eyebrow-light">Review before acceptance</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {REVIEW_FACTORS.map((factor) => (
                <li key={factor} className="public-review-factor">
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
