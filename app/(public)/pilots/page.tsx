import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { TrackedLink } from "@/components/site/tracked-link";
import { DAY_RATES, SITE, SITE_EVENTS } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Pilots — Fly Vetted Missions, Paid in 7 Days",
  description:
    "Join AMG's contract pilot network: we source the clients, paper the agreements, and pay you within 7 days of mission completion — no exclusivity, no invoice-chasing.",
};

const VETTING = [
  "Certificate and medical minimums per aircraft band",
  "Type-experience thresholds",
  "Insurance-history questionnaire",
  "Reference call",
] as const;

const WHAT_YOU_GET = [
  {
    title: "Mission flow",
    body: `Ferries, repositioning, crew coverage, and second-pilot work across ${SITE.region}.`,
  },
  {
    title: "Paid in 7 days",
    body: "Within 7 days of mission completion — whether or not the owner has paid us yet.",
  },
  {
    title: "Zero client-chasing",
    body: "We source the clients, paper the agreements, and handle every invoice and receipt.",
  },
  {
    title: "No exclusivity",
    body: "Fly for whoever you want. Day rates are set within our published market ranges.",
  },
] as const;

export default function PilotsPage() {
  return (
    <>
      <section className="oc-shell pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">Pilot Network</p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
            Fly vetted missions. Get paid in 7 days.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            Join AMG&apos;s contract pilot network: we source the clients, paper the agreements,
            and pay you within 7 days of mission completion — whether or not the owner has paid
            us yet.
          </p>
          <div className="mt-9">
            <TrackedLink
              href="/pilots/apply"
              event={SITE_EVENTS.pilotsApplyClick}
              eventParams={{ source: "hero" }}
              className="oc-btn oc-btn-light"
            >
              Apply to the Network
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* What we ask — the vetting standard, published, framed as pride. */}
      <section className="oc-section">
        <div className="oc-shell grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="oc-panel-navy rounded-xl p-8 lg:p-10">
            <p className="oc-eyebrow oc-eyebrow-light">What we ask</p>
            <h2 className="oc-display mt-4 text-3xl text-[var(--oc-paper)]">
              The file behind every pilot is real.
            </h2>
            <ul className="mt-6 grid gap-4">
              {VETTING.map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-[var(--oc-aluminum)]">
                  <span className="oc-dot mt-2 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-base leading-relaxed text-[var(--oc-aluminum)]">
              Owners trust the network because the vetting is verifiable. Yours will be dated,
              verified, and yours to point to.
            </p>
          </div>

          <div className="grid gap-4">
            {WHAT_YOU_GET.map((item) => (
              <div key={item.title} className="oc-card-dark p-6">
                <h3 className="oc-display text-xl text-[var(--oc-paper)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">{item.body}</p>
              </div>
            ))}
            <p className="px-1 text-sm text-[var(--oc-aluminum-2)]">
              Current published ranges: {DAY_RATES.bands.map((b) => `${b.band} ${b.range}`).join(" · ")} —{" "}
              <Link href="/pricing" prefetch={false} className="font-semibold text-[var(--oc-blue)] underline-offset-2 hover:underline">
                see the pricing page
                <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Credential handling statement (spec §8, mandatory). */}
      <section className="oc-section pt-0">
        <div className="oc-shell">
          <div className="oc-card-dark mx-auto max-w-3xl p-8 lg:p-10">
            <p className="oc-eyebrow oc-eyebrow-light">How we handle your credentials</p>
            <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">
              Credentials upload only through our secure portal — never email. We collect
              certificates, medical, experience summary, and insurance history. Access is limited
              to AMG&apos;s founder and mission coordinators. Records are retained while
              you&apos;re active in the network plus 12 months, and deleted on request.
              Questions:{" "}
              <a href={`mailto:${SITE.email}`} className="oc-mono text-[var(--oc-paper)] underline-offset-2 hover:underline">
                {SITE.email}
              </a>
              .
            </p>
          </div>

          <div className="mt-14 flex justify-center">
            <TrackedLink
              href="/pilots/apply"
              event={SITE_EVENTS.pilotsApplyClick}
              eventParams={{ source: "footer_cta" }}
              className="oc-btn oc-btn-light"
            >
              Apply to the Network
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
