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
      <section className="oc-shell pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">Legal</p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
            What AMG is — and is not.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
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
          <h2 className="oc-display text-3xl text-[var(--oc-paper)]">Plan terms, summarized</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PLAN_TERMS.map((term) => (
              <div key={term.title} className="oc-card-dark p-6">
                <h3 className="text-base font-semibold text-[var(--oc-paper)]">{term.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-aluminum)]">{term.body}</p>
              </div>
            ))}
          </div>

          <div className="oc-card-dark mt-10 p-8">
            <h2 className="oc-display text-2xl text-[var(--oc-paper)]">
              Privacy & pilot-credential data
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--oc-aluminum)]">
              Pilot credentials — certificates, medical, experience summary, insurance history —
              are collected only through the secure portal over encrypted transport, never by
              email. Access is limited to AMG&apos;s founder and mission coordinators. Records
              are retained while a pilot is active in the network plus 12 months, and deleted on
              request. Client data lives in AMG Connect and is used to coordinate missions, not
              sold or shared. Questions:{" "}
              <a href={`mailto:${SITE.email}`} className="oc-mono text-[var(--oc-paper)] underline-offset-2 hover:underline">
                {SITE.email}
              </a>
              .
            </p>
          </div>

          <h2 className="oc-display mt-14 text-3xl text-[var(--oc-paper)]">Full notices & agreements</h2>
          <p className="mt-3 max-w-2xl text-sm text-[var(--oc-aluminum)]">
            The complete Owner Services Agreement and Contract Pilot Agreement are provided at
            engagement. The notices below apply sitewide.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {legalDocuments.map((document) => (
              <Link
                key={document.slug}
                href={document.legacyPath ?? `/legal/${document.slug}`}
                prefetch={false}
                className="oc-card-dark group p-5 transition hover:border-[var(--oc-blue)]"
              >
                <span className="flex items-start justify-between gap-3 text-base font-semibold text-[var(--oc-paper)]">
                  {document.title}
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--oc-blue)] opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-[var(--oc-aluminum)]">
                  {document.description}
                </span>
                <span className="mt-4 block text-xs uppercase text-[var(--oc-aluminum-2)]">
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
