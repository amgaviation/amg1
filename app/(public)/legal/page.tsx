import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { legalDocuments } from "@/lib/compliance/legal-pages";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Legal — What AMG Is, and Is Not",
  description:
    "Plain-English summary of AMG's role as a crew-sourcing and coordination agent, plan terms, decline categories, and privacy and pilot-credential data handling.",
};

/**
 * Spec §11 — the one page holding what used to be scattered per-page
 * disclaimers. Counsel review required before launch (see launch checklist).
 * Copy is audited (Phase 6) — presentation only here, every string intact.
 */
const PLAN_TERMS = [
  {
    title: "Cancellation",
    body: "Monthly plans cancel anytime, effective at the end of the billing period. Annual plans refund unused whole months minus one.",
  },
  {
    title: "Missed-window remedy",
    body: "If AMG misses a committed quote or sourcing window on a Standard or Priority plan, that month's plan fee is credited — automatically, without being asked.",
  },
  {
    title: "When AMG declines a mission",
    body: "Four reason categories: insurance, safety, aircraft condition, and legality. If we decline, we state which category and why.",
  },
  {
    title: "Fees and pass-throughs",
    body: "AMG's fees are flat, published coordination fees and plan fees. Pilot compensation, travel, lodging, and per diem pass through at cost with receipts and zero markup.",
  },
] as const;

export default function LegalPage() {
  return (
    <>
      <section className="pub-hero oc-shell pb-12 pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl" data-stagger-container>
          <p className="oc-eyebrow" data-stagger-item>
            Legal // plain English, one page
          </p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl" data-stagger-item>
            What AMG is — and is not.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]" data-stagger-item>
            AMG Aviation Group is a crew-sourcing and coordination agent. We source qualified
            contract pilots, verify their credentials and insurability, produce itemized quotes,
            paper the agreements, and track each mission in AMG Connect. We are not an air
            carrier. We never supply aircraft, never bundle aircraft with crew, and never take
            operational control of any flight — the aircraft owner (or the PIC acting under the
            owner&apos;s authority) holds go/no-go authority and operational control at all
            times, and our agreements say so in writing.
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell">
          <div className="flex items-baseline justify-between gap-4" data-scroll-animate>
            <h2 className="oc-display text-3xl text-[var(--oc-paper)]">Plan terms, summarized</h2>
            <p className="microlabel hidden sm:block">Published, not fine print</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2" data-stagger-container>
            {PLAN_TERMS.map((term, index) => (
              <div key={term.title} data-stagger-item className="group pub-card-hover oc-card-dark p-6">
                <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                  PT-{String(index + 1).padStart(2, "0")}
                </span>
                <div className="pub-rule mb-3 mt-2" aria-hidden="true" />
                <h3 className="text-base font-semibold text-[var(--oc-paper)]">{term.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">{term.body}</p>
              </div>
            ))}
          </div>

          <div className="hud-frame oc-card-dark mt-10 p-8" data-scroll-animate>
            <h2 className="oc-display text-2xl text-[var(--oc-paper)]">
              Privacy & pilot-credential data
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--oc-aluminum)]">
              Pilot credentials — certificates, medical, experience summary, insurance history —
              are collected only through the secure portal over encrypted transport, never by
              email. Access is limited to AMG&apos;s founder and mission coordinators. Records
              are retained while a pilot is active in the network plus 12 months, and deleted on
              request. Clients see only their own records plus a qualification summary for the
              pilot assigned to their mission — never the raw credential documents. Client data
              lives in AMG Connect and is used to coordinate missions, not sold or shared.
              Questions:{" "}
              <a href={`mailto:${SITE.email}`} className="oc-mono text-[var(--oc-paper)] underline-offset-2 hover:underline">
                {SITE.email}
              </a>
              .
            </p>
          </div>

          <div className="mt-14 flex items-baseline justify-between gap-4" data-scroll-animate>
            <h2 className="oc-display text-3xl text-[var(--oc-paper)]">Full notices & agreements</h2>
            <p className="microlabel hidden sm:block">The registry // applies sitewide</p>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-[var(--oc-aluminum)]" data-scroll-animate>
            The complete Owner Services Agreement and Contract Pilot Agreement are provided at
            engagement. The notices below apply sitewide.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-stagger-container>
            {legalDocuments.map((document, index) => (
              <Link
                key={document.slug}
                href={document.legacyPath ?? `/legal/${document.slug}`}
                prefetch={false}
                data-stagger-item
                className="group pub-card-hover oc-card-dark flex flex-col p-5"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[10px] [letter-spacing:0.16em] text-[var(--amber)]">
                    REG-{String(index + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--oc-blue)] opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="pub-rule mb-3 mt-2" aria-hidden="true" />
                <span className="block text-base font-semibold text-[var(--oc-paper)]">
                  {document.title}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-[var(--oc-aluminum)]">
                  {document.description}
                </span>
                <span className="mt-auto block pt-4 font-mono text-[10px] uppercase [letter-spacing:0.16em] text-[var(--oc-aluminum-2)]">
                  Updated {document.lastUpdated}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
