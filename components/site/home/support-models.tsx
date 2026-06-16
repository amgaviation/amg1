import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { SectionHeading } from "@/components/site/oc/shared";

const MODELS = [
  {
    label: "Model 01",
    name: "On-Demand Support",
    summary: "For a specific movement, repositioning, or coverage need handled request by request.",
    points: ["Mission-by-mission intake", "Crew sourcing and logistics", "No recurring commitment"],
    featured: false,
  },
  {
    label: "Model 02",
    name: "Recurring Owner Support",
    summary: "For owners who want a defined coordination cadence around one aircraft's recurring needs.",
    points: ["Defined monthly scope", "Priority support review", "Owner communication and visibility"],
    featured: true,
  },
  {
    label: "Model 03",
    name: "Fleet / Department Support",
    summary: "For flight departments and owners running multiple aircraft or higher activity.",
    points: ["Multi-aircraft coordination", "Role-based portal access", "Reporting and support cadence"],
    featured: false,
  },
];

export function SupportModels() {
  return (
    <section className="oc-section bg-[var(--oc-ivory)]">
      <div className="oc-shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Support Models"
            title="Engage AMG the way the aircraft needs."
            lead="Three ways to work with AMG — from a single mission to standing support across a department. Detailed allowances live in Plans."
          />
          <Link href="/plans" prefetch={false} className="oc-btn oc-btn-ghost shrink-0">
            Compare plans
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3" data-stagger-container>
          {MODELS.map((m) => (
            <article
              key={m.name}
              data-stagger-item
              className={`group flex h-full flex-col rounded-[1.25rem] p-7 lg:p-8 ${
                m.featured
                  ? "oc-panel-navy text-[var(--oc-paper)]"
                  : "oc-card text-[var(--oc-ink)]"
              }`}
            >
              <p className={`oc-kicker ${m.featured ? "text-[var(--oc-aluminum)]" : "text-[var(--oc-muted)]"}`}>
                {m.label}
              </p>
              <h3 className="oc-display mt-3 text-2xl sm:text-[1.7rem]">{m.name}</h3>
              <p className={`mt-3 text-[15px] leading-relaxed ${m.featured ? "text-[var(--oc-aluminum)]" : "text-[var(--oc-muted)]"}`}>
                {m.summary}
              </p>
              <ul className="mt-6 grid gap-2.5">
                {m.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${m.featured ? "text-[var(--oc-blue-soft)]" : "text-[var(--oc-blue)]"}`} />
                    <span className={m.featured ? "text-[var(--oc-paper)]/90" : "text-[var(--oc-ink)]/80"}>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/plans"
                prefetch={false}
                className={`oc-kicker mt-auto inline-flex items-center gap-2 pt-7 ${
                  m.featured ? "text-[var(--oc-blue-soft)]" : "text-[var(--oc-blue)]"
                }`}
              >
                View plan details
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
