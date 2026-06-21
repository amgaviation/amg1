import Link from "next/link";
import { ArrowUpRight, FileCheck2, ShieldAlert } from "lucide-react";

const FACTS = [
  "AMG Connect supports requests, documents, messages, quotes, invoices, and status views by role.",
  "Public crew-region markers are representative airport regions, not live crew locations or guaranteed availability.",
  "Website support requests do not become accepted work until AMG confirms scope and availability.",
];

export function ProofSection() {
  return (
    <section className="bg-[var(--oc-ivory)] py-12 lg:py-16">
      <div className="oc-shell">
        <div className="rounded-3xl border border-[var(--oc-line)] bg-white p-6 shadow-[0_18px_58px_rgba(11,26,43,0.08)] lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="oc-eyebrow text-[var(--oc-blue)]">Proof Without Guesswork</p>
              <h2 className="oc-display mt-4 text-3xl text-[var(--oc-ink)] sm:text-4xl">Trust signals must be real.</h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--oc-muted)]">
                I did not add pilot counts, state coverage, response times, flight totals, logos, or testimonials because the repository does not provide approved public data for those claims.
              </p>
              <Link href="/contact" prefetch={false} className="oc-btn oc-btn-ghost mt-6">Send approved proof points<ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-3">
              {FACTS.map((fact) => (
                <div key={fact} className="flex gap-3 rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                  <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--oc-blue)]" />
                  <span>{fact}</span>
                </div>
              ))}
              <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Owner approval required before publishing customer names, testimonials, network metrics, years-in-business claims, or operational volume numbers.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
