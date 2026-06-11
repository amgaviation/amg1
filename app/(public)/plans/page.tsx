import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/content";

export const metadata: Metadata = {
  title: "AMG Aviation Group — Support Plans",
  description:
    "AMG Aviation Group support plan structure for baseline coordination, service allowance, mission-variable costs, support credits, and monthly or annual support planning.",
};

export default function PlansPage() {
  return (
    <>
      <PageHero
        eyebrow="Support Plans"
        title="Simple structure before variable mission costs"
        description="AMG support plans define baseline coordination, selected service level, support allowance, and review process. Crew, travel, lodging, and other mission-variable costs remain selected or reviewed separately."
        image="/images/jet-interior.png"
      />
      <section className="py-28">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-3 lg:px-10">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "hover-lift rounded-xl border bg-card p-8",
                plan.highlighted ? "border-accent" : "border-border"
              )}
            >
              <p className="eyebrow text-accent">{plan.monthly}</p>
              <h2 className="mt-4 font-display text-4xl font-extrabold uppercase tracking-wide text-foreground">{plan.name}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">{plan.description}</p>
              <ul className="mt-8 grid gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-foreground/85">
                    <Check className="h-5 w-5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground">
                Start Support Request
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
