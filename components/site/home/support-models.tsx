import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { SectionHeading } from "@/components/site/oc/shared";

const MODELS = [
  { name: "On-Demand", summary: "For one crew assignment, ferry flight, reposition, or maintenance move. AMG prices the individual job after the operating details are checked.", points: ["Pay per request", "Crew and aircraft details checked first", "No monthly commitment"], cta: "View On-Demand Plan" },
  { name: "Monthly Owner Plan", summary: "For an owner or representative who wants ongoing help around one aircraft and a more consistent communication rhythm.", points: ["Defined monthly scope", "Priority review path", "Consistent owner communication"], cta: "View Owner Plan", featured: true },
  { name: "Fleet / Department Plan", summary: "For flight departments, owner groups, or operators managing multiple aircraft or changing crew needs.", points: ["Multi-aircraft coordination", "Role-based portal visibility", "Custom plan structure"], cta: "View Fleet Plan" },
];

export function SupportModels() {
  return (
    <section className="bg-[var(--oc-ivory)] py-14 lg:py-20">
      <div className="oc-shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Plans & Pricing" title="Choose pay-per-job help, monthly owner support, or a fleet plan." lead="Pricing depends on the aircraft, timing, service type, frequency, and work needed. AMG confirms final pricing after the details are reviewed." />
          <Link href="/plans" prefetch={false} data-analytics="support_option_comparison" className="oc-btn oc-btn-ghost shrink-0">Compare Plans<ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-9 grid gap-5 lg:grid-cols-3" data-stagger-container>
          {MODELS.map((m) => (
            <article key={m.name} data-stagger-item className={`group flex h-full flex-col rounded-[1.25rem] p-7 lg:p-8 ${m.featured ? "oc-panel-navy text-[var(--oc-paper)]" : "oc-card text-[var(--oc-ink)]"}`}>
              <h3 className="oc-display text-2xl sm:text-[1.7rem]">{m.name}</h3>
              <p className={`mt-3 text-[15px] leading-relaxed ${m.featured ? "text-[var(--oc-aluminum)]" : "text-[var(--oc-muted)]"}`}>{m.summary}</p>
              <ul className="mt-6 grid gap-2.5">
                {m.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-sm"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${m.featured ? "text-[var(--oc-blue-soft)]" : "text-[var(--oc-blue)]"}`} /><span>{p}</span></li>)}
              </ul>
              <Link href="/plans" prefetch={false} data-analytics="support_option_selection" className={`oc-kicker mt-auto inline-flex items-center gap-2 pt-7 ${m.featured ? "text-[var(--oc-blue-soft)]" : "text-[var(--oc-blue)]"}`}>{m.cta}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-[var(--oc-line)] bg-white/75 p-6">
          <h3 className="text-lg font-semibold text-[var(--oc-ink)]">How pricing is set</h3>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[var(--oc-muted)]">Single jobs are priced around the specific request. Monthly owner support uses a defined scope for one aircraft. Fleet and department plans are shaped around aircraft count, request frequency, crew needs, and portal visibility. No price is final until the operating details are checked.</p>
          <div className="mt-5 flex flex-wrap gap-3"><Link href="/plans" className="oc-btn oc-btn-primary">Compare Plans</Link><Link href="/contact" className="oc-btn oc-btn-ghost">Talk to an Expert</Link></div>
        </div>
      </div>
    </section>
  );
}
