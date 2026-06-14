"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Gauge, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

const aircraftClasses = [
  "Single-Engine Piston",
  "Multi-Engine Piston",
  "Turboprop",
  "Single-Engine Jet / VLJ",
  "Light Jet",
  "Midsize Jet",
  "Large-Cabin / Heavy Jet",
  "Super-Midsize Jet",
  "Helicopter",
] as const;

const standardClasses = new Set<string>([
  "Single-Engine Piston",
  "Multi-Engine Piston",
  "Turboprop",
  "Single-Engine Jet / VLJ",
  "Light Jet",
  "Midsize Jet",
  "Large-Cabin / Heavy Jet",
]);

const pistonClasses = new Set<string>(["Single-Engine Piston", "Multi-Engine Piston"]);

const allowanceCopy = {
  Basic: {
    monthly: ["2 client-flight duty days", "1 MX movement"],
    annual: ["28 client-flight duty days", "5 MX movements"],
    priority: "Standard priority; rush fee waived when requested at least 48 hours in advance.",
    benefits: [
      "Crew sourcing",
      "Crew compensation within selected allowance",
      "Standard intake administration",
      "Standard scheduling communication",
      "Monthly usage report",
      "Annual planning call",
      "Maintenance coordination available separately",
    ],
    travel: "Crew travel and lodging are pass-through or separately quoted. No included travel allowance.",
  },
  Core: {
    monthly: ["3 client-flight duty days", "1 MX movement"],
    annual: ["36 client-flight duty days", "7 MX movements"],
    priority: "Elevated priority; rush fee waived when requested at least 24 hours in advance.",
    benefits: [
      "Everything in Basic",
      "Standard mission coordination",
      "Improved booking priority",
      "More detailed mission communication",
      "Monthly usage report",
      "Annual planning call",
      "After-hours support available separately",
    ],
    travel: "Lodging allowance up to $125 per applicable crew duty day. Crew positioning travel is pass-through unless included in the proposal.",
  },
  Priority: {
    monthly: ["5 client-flight duty days", "2 MX movements"],
    annual: ["60 client-flight duty days", "12 MX movements"],
    priority: "High priority; rush fee waived when requested at least 12 hours in advance.",
    benefits: [
      "Everything in Core",
      "Enhanced mission coordination",
      "Maintenance coordination",
      "Dedicated support contact",
      "After-hours support",
      "Higher booking priority",
      "Applicable lodging/travel allowance",
    ],
    travel: "Lodging allowance up to $125 per applicable crew duty day. Domestic crew positioning allowance up to $1,000 per applicable trip when included in the proposal.",
  },
  Premier: {
    monthly: ["7 client-flight duty days", "3 MX movements"],
    annual: ["90 client-flight duty days", "15 MX movements"],
    priority: "Highest priority; rush fee waived when requested at least 8 hours in advance.",
    benefits: [
      "Everything in Priority",
      "Highest booking priority",
      "Comprehensive coordination",
      "Highest service responsiveness",
      "Highest included usage",
      "Enhanced planning support",
      "Applicable lodging/travel allowance",
    ],
    travel: "Lodging allowance up to $125 per applicable crew duty day. Domestic positioning may be included up to $1,000 per trip, and international positioning may be included up to $3,000 total only when stated in the executed proposal.",
  },
} as const;

type Billing = "monthly" | "annual";
type Tier = keyof typeof allowanceCopy;

function tiersForAircraft(aircraftClass: string): Tier[] {
  if (!standardClasses.has(aircraftClass)) return [];
  return pistonClasses.has(aircraftClass)
    ? ["Basic", "Core", "Priority", "Premier"]
    : ["Basic", "Core", "Priority"];
}

export function SubscriptionPrograms() {
  const [aircraftClass, setAircraftClass] = useState<(typeof aircraftClasses)[number]>("Single-Engine Piston");
  const [billing, setBilling] = useState<Billing>("monthly");
  const tiers = tiersForAircraft(aircraftClass);
  const customOnly = tiers.length === 0;

  return (
    <div className="cinematic-band mx-auto max-w-7xl px-6 py-24 lg:px-10" data-scroll-animate>
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="lg:sticky lg:top-[calc(var(--public-header-height)+2rem)] lg:self-start">
          <div className="glass-panel portal-entry-card rounded-lg p-6">
            <div className="flex items-center justify-between gap-5 border-b border-white/10 pb-5">
              <p className="eyebrow text-accent">Program Builder</p>
              <Gauge className="h-5 w-5 text-accent" />
            </div>
            <h2 className="mt-6 display-heading text-4xl text-foreground sm:text-5xl">
              Select Aircraft and Billing
            </h2>
            <div className="mt-6 grid gap-5">
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Aircraft class
                <select
                  value={aircraftClass}
                  onChange={(event) => setAircraftClass(event.target.value as (typeof aircraftClasses)[number])}
                  className="support-field px-4 text-base"
                >
                  {aircraftClasses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="grid gap-3">
                <legend className="text-sm font-medium text-foreground">Billing preference</legend>
                <div className="grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-background/70 p-1">
                  {(["monthly", "annual"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setBilling(item)}
                      className={cn(
                        "min-h-11 rounded-full px-4 font-display text-xs font-semibold uppercase tracking-widest transition-colors",
                        billing === item
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Pricing is based on aircraft class, crew requirements, selected allowances, and operating scope. Two-pilot requirements affect proposal pricing.
            </p>
            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs uppercase text-muted-foreground">Current selection</p>
              <p className="mt-2 font-display text-2xl font-bold uppercase leading-none text-foreground">
                {aircraftClass}
              </p>
            </div>
          </div>
        </aside>

        <div>
          {customOnly ? (
            <section className="glass-panel portal-card rounded-lg border-accent/40 p-8">
              <p className="eyebrow text-accent">Custom Proposal Only</p>
              <h3 className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-foreground">
                {aircraftClass}
              </h3>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                This aircraft class requires custom review before AMG can define scope, allowances, crew requirements, risk factors, and pricing.
              </p>
              <Link href="/contact?category=subscription-program-inquiry" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground">
                Request Tailored Proposal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          ) : (
            <div className="grid gap-5 xl:grid-cols-3" data-stagger-container>
              {tiers.map((tier) => {
                const item = allowanceCopy[tier];
                return (
                  <article
                    key={tier}
                    data-stagger-item
                    className={cn(
                      "portal-card glass-panel rounded-lg border p-6",
                      tier === "Priority" ? "border-accent" : "border-white/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="eyebrow text-[0.68rem] text-accent">{aircraftClass}</p>
                      <Plane className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="mt-4 font-display text-4xl font-extrabold uppercase leading-none text-foreground">
                      {tier}
                    </h3>
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      Request Tailored Proposal
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Pricing based on aircraft class, crew requirements, selected allowances, and operating scope.
                    </p>
                    <div className="mt-6 rounded-lg border border-white/10 bg-background/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-foreground/80">
                        {billing === "monthly" ? "Monthly" : "Annual"} allowance
                      </p>
                      <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        {item[billing].map((allowance) => (
                          <li key={allowance} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                            {allowance}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{item.priority}</p>
                    <ul className="mt-5 grid gap-2 border-t border-white/10 pt-5 text-sm text-foreground/85">
                      {item.benefits.map((benefit) => (
                        <li key={benefit} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 text-xs leading-relaxed text-muted-foreground">{item.travel}</p>
                    <Link href={`/contact?category=subscription-program-inquiry&tier=${tier.toLowerCase()}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-display text-xs font-semibold uppercase tracking-widest text-foreground hover:border-accent hover:text-accent">
                      Request Proposal
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <section className="mt-16 grid gap-5 lg:grid-cols-3" data-stagger-container>
        <div className="glass-panel rounded-lg p-6" data-stagger-item>
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">Included Events</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            One included Client Flight means one crew duty day. Multiple legs during the same duty day remain one event. Trips exceeding 12 hours or involving overnight activity may consume additional duty days.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            One included MX Flight means one maintenance-related aircraft movement. Base to MRO is one movement; MRO to base is one movement; a round trip is two movements.
          </p>
        </div>
        <div className="glass-panel rounded-lg p-6" data-stagger-item>
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">Credits and Annual Billing</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Unused eligible credits remain available while the subscription is active and in good standing. Credits expire upon cancellation, termination, non-renewal, or default; they have no cash value and cannot be refunded or transferred.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Annual subscriptions receive a 10% reduction on eligible AMG administrative and coordination fees only, not crew compensation, travel, lodging, pass-through expenses, vendor charges, airport costs, or aircraft expenses.
          </p>
        </div>
        <div className="glass-panel rounded-lg p-6" data-stagger-item>
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground">Major Exclusions</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Owner/operator expenses include fuel, oil, insurance, maintenance invoices, parts, mechanic labor, aircraft subscriptions, and databases. Pass-through items include landing, ramp, parking, hangar, handling, deicing, catering, cleaning, customs, immigration, handlers, and overflight permits.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Flight attendants, dedicated dispatch, full management accounting, specialized maintenance representation, AOG support, ferry permits, special permits, and unusual-risk missions require a separate quote.
          </p>
        </div>
      </section>
    </div>
  );
}
