import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { SectionHeading } from "@/components/site/oc/shared";

const MODELS = [
  { name: "On-Demand Support", summary: "For a single crew coverage, aircraft movement, or maintenance repositioning need. Scope and pricing are confirmed for each request.", points: ["Request-specific scope", "Availability and feasibility review", "No recurring commitment"], cta: "View On-Demand Support" },
  { name: "Recurring Owner Support", summary: "For an owner who needs ongoing support around one aircraft under a defined monthly scope.", points: ["Defined monthly support scope", "Priority review process", "Consistent owner communication"], cta: "View Recurring Support", featured: true },
  { name: "Fleet / Department Support", summary: "For owners and flight departments managing multiple aircraft or variable crew requirements.", points: ["Multi-aircraft coordination", "Role-based portal visibility", "Custom support structure"], cta: "View Department Support" },
];

export function SupportModels() {
  return (
    <section className="oc-section bg-[var(--oc-ivory)]">
      <div className="oc-shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="Support Options" title="Choose the support structure that fits the operation." lead="Use AMG for one request, recurring support for one aircraft, or a custom structure for a flight department." />
          <Link href="/plans" prefetch={false} data-analytics="support_option_comparison" className="oc-btn oc-btn-ghost shrink-0">Compare Support Options<ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3" data-stagger-container>
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
          <h3 className="text-lg font-semibold text-[var(--oc-ink)]">How pricing works</h3>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[var(--oc-muted)]">On-demand work is scoped for the individual request. Recurring owner support uses a defined monthly structure. Fleet and flight-department support is configured around aircraft count, frequency, and support scope. Final pricing is confirmed after AMG reviews the operating details.</p>
          <div className="mt-5 flex flex-wrap gap-3"><Link href="/plans" className="oc-btn oc-btn-primary">Compare Support Options</Link><Link href="/contact" className="oc-btn oc-btn-ghost">Speak With AMG</Link></div>
        </div>
      </div>
    </section>
  );
}
