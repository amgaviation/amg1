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
    <section id="support-options" className="public-editorial-section public-support-models" aria-labelledby="support-options-heading">
      <div className="oc-shell grid gap-12 lg:grid-cols-[0.74fr_1.26fr] lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--public-header-height)+3rem)] lg:self-start">
          <SectionHeading
            eyebrow="Support Options"
            title={<span id="support-options-heading">Choose the support structure that fits the operation.</span>}
            lead="Use AMG for one request, recurring support for one aircraft, or a custom structure for a flight department."
            tone="light"
          />
          <p className="mt-6 max-w-md text-sm leading-relaxed text-[var(--oc-aluminum-2)]">
            On-demand work is scoped for the individual request. Recurring owner support uses a defined monthly structure. Fleet and flight-department support is configured around aircraft count, frequency, and support scope.
          </p>
          <Link href="/plans" prefetch={false} data-analytics="support_option_comparison" className="oc-btn oc-btn-light mt-8 shrink-0">
            Compare Support Options
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5" data-stagger-container>
          {MODELS.map((m) => (
            <article key={m.name} data-stagger-item className="public-support-model">
              <h3>{m.name}</h3>
              <p>{m.summary}</p>
              <ul className="mt-6 grid gap-2.5">
                {m.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" /><span>{p}</span></li>)}
              </ul>
              <Link href="/plans" prefetch={false} data-analytics="support_option_selection" className="oc-kicker mt-auto inline-flex min-h-11 items-center gap-2 pt-7 text-[var(--oc-blue)]">
                {m.cta}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
