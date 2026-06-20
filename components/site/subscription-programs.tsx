"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ClipboardCheck, Plane, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  aircraftPlanCategories,
  comparisonRows,
  type AircraftCategoryId,
  type BillingInterval,
  type PistonSubtypeId,
  type SupportPlan,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const REQUEST_REVIEW_HREF = "/request-support?category=subscription-program-inquiry";
const CONTACT_HREF = "/contact";

type PlansHeroContent = {
  eyebrow: string;
  title: string;
  lead?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
};

function displayValue(value: unknown, fallback = "Reviewed during intake") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function getPlanPrice(plan: SupportPlan, billing: BillingInterval) {
  return billing === "annual"
    ? displayValue(plan.annualPrice, "Annual review available")
    : displayValue(plan.monthlyPrice, "Plan Review Required");
}

export function SubscriptionPrograms({ hero }: { hero?: PlansHeroContent }) {
  const [billing, setBilling] = useState<BillingInterval>("monthly");
  const [categoryId, setCategoryId] = useState<AircraftCategoryId>("piston");
  const [pistonSubtypeId, setPistonSubtypeId] = useState<PistonSubtypeId>("single-engine-piston");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const category = useMemo(
    () => aircraftPlanCategories.find((item) => item.id === categoryId) ?? aircraftPlanCategories[0],
    [categoryId],
  );

  const pistonSubtype = category.subcategories?.find((item) => item.id === pistonSubtypeId) ?? category.subcategories?.[0];
  const plans = pistonSubtype?.plans ?? category.plans ?? [];
  const activeContextLabel = pistonSubtype?.label ?? category.label;
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  function selectCategory(nextCategoryId: AircraftCategoryId) {
    setCategoryId(nextCategoryId);
    setSelectedPlanId(null);
  }

  function selectPistonSubtype(nextSubtypeId: PistonSubtypeId) {
    setPistonSubtypeId(nextSubtypeId);
    setSelectedPlanId(null);
  }

  return (
    <div className="overflow-hidden bg-[var(--oc-ivory)] text-[var(--oc-ink)]">
      <PlansHero content={hero} />

      <section className="oc-shell py-16 lg:py-24" aria-labelledby="plan-builder-heading">
        <Card className="oc-card gap-0 rounded-2xl border-[var(--oc-line)] p-0">
          <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <div>
              <p className="oc-eyebrow text-[var(--oc-blue)]">Plan Builder</p>
              <h2 id="plan-builder-heading" className="oc-display mt-4 max-w-3xl text-3xl text-[var(--oc-ink)] sm:text-4xl">
                Select the aircraft category and billing view.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--oc-muted)]">
                Annual billing may reduce eligible AMG coordination/admin baseline pricing. Variable expenses and
                pass-through costs are handled according to the approved support scope.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <fieldset>
                <legend className="text-sm font-semibold text-[var(--oc-ink)]">Billing interval</legend>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[var(--oc-line)] bg-white/[0.55] p-1">
                  {(["monthly", "annual"] as const).map((interval) => (
                    <button
                      key={interval}
                      type="button"
                      onClick={() => setBilling(interval)}
                      aria-pressed={billing === interval}
                      className={cn(
                        "min-h-11 rounded-lg px-4 text-sm font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2",
                        billing === interval
                          ? "bg-[var(--oc-navy)] text-white shadow-sm"
                          : "text-[var(--oc-muted)] hover:bg-white hover:text-[var(--oc-ink)]",
                      )}
                    >
                      {interval}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]/75 p-4">
                <p className="oc-eyebrow text-[0.68rem] text-[var(--oc-muted)]">Current view</p>
                <p className="mt-2 text-base font-semibold text-[var(--oc-ink)]">{activeContextLabel}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">
                  Crew planning assumption: {pistonSubtype?.crewDayRate ?? category.crewDayRate}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 min-w-0">
          <CategoryControls
            categoryId={categoryId}
            pistonSubtypeId={pistonSubtypeId}
            onCategoryChange={selectCategory}
            onPistonSubtypeChange={selectPistonSubtype}
          />

          <div className="mt-7 rounded-2xl border border-[var(--oc-line)] bg-white/[0.58] p-5 shadow-[var(--oc-shadow)] backdrop-blur-xl sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="oc-eyebrow text-[var(--oc-blue)]">{category.label}</p>
                <h3 className="oc-display mt-3 text-3xl text-[var(--oc-ink)] sm:text-4xl">{activeContextLabel}</h3>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--oc-muted)]">
                  {pistonSubtype?.description ?? category.description}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4 lg:max-w-sm">
                <p className="text-xs font-semibold uppercase text-[var(--oc-ink)]">Aircraft examples</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--oc-muted)]">
                  {(category.examples ?? []).slice(0, 5).join(", ")}
                </p>
              </div>
            </div>
            {category.twoCrewNote ? (
              <p className="mt-5 rounded-xl border border-[var(--oc-line)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
                {category.twoCrewNote}
              </p>
            ) : null}
          </div>

          <div className="mt-7 grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                selected={selectedPlanId === plan.id}
                onToggle={() => setSelectedPlanId((current) => (current === plan.id ? null : plan.id))}
              />
            ))}
          </div>

          <PlanDetailsPanel plan={selectedPlan} />
        </div>
      </section>

      <PlanComparisonMatrix plans={plans} contextLabel={activeContextLabel} />
      <PlansOperationalNotes />
      <PlansCTA />
    </div>
  );
}

function PlansHero({ content }: { content?: PlansHeroContent }) {
  const primary = content?.primary ?? { label: "Request Plan Review", href: REQUEST_REVIEW_HREF };
  const secondary = content?.secondary ?? { label: "Compare Plans", href: "#plans-comparison" };

  return (
    <section className="relative isolate overflow-hidden bg-[var(--oc-navy)] pb-12 pt-[calc(var(--public-header-height)+4rem)] text-white lg:pb-16 lg:pt-[calc(var(--public-header-height)+6rem)]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--oc-navy),var(--oc-graphite)_58%,oklch(0.25_0.04_240))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
      <div className="oc-shell">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="max-w-4xl">
            <p className="oc-eyebrow oc-eyebrow-light inline-flex items-center gap-3">
              <span className="h-px w-10 bg-[var(--oc-aluminum-2)]" />
              {content?.eyebrow ?? "AMG Support Plans"}
            </p>
            <h1 className="oc-display mt-5 max-w-4xl text-[clamp(2.75rem,7vw,5.65rem)] text-[var(--oc-paper)]">
              {content?.title ?? "Aircraft Support Plans Built Around Reality"}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[var(--oc-aluminum)]">
              {content?.lead ??
                "AMG plans are structured around aircraft category, support frequency, crew coordination needs, maintenance movement requirements, and owner/operator visibility."}
            </p>
            <p className="mt-5 max-w-3xl rounded-xl border border-white/[0.14] bg-white/[0.08] p-4 text-sm leading-relaxed text-[var(--oc-aluminum)] backdrop-blur-md">
              AMG does not present a request as accepted until the support scope, aircraft status, crew availability,
              owner/operator approval, and operational conditions have been reviewed.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="min-h-11 rounded-full bg-white px-6 text-[var(--oc-navy)] hover:bg-white/90">
                <Link href={primary.href} prefetch={false}>
                  {primary.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11 rounded-full border-white/[0.28] bg-white/[0.05] px-6 text-white hover:bg-white/[0.12] hover:text-white">
                <a href={secondary.href}>{secondary.label}</a>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/[0.12] bg-white/[0.08] p-5 backdrop-blur-xl">
            {["Aircraft category", "Support frequency", "Maintenance movement", "Crew coordination"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.07] p-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--oc-sky)]" />
                <span className="text-sm font-medium text-[var(--oc-paper)]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryControls({
  categoryId,
  pistonSubtypeId,
  onCategoryChange,
  onPistonSubtypeChange,
}: {
  categoryId: AircraftCategoryId;
  pistonSubtypeId: PistonSubtypeId;
  onCategoryChange: (value: AircraftCategoryId) => void;
  onPistonSubtypeChange: (value: PistonSubtypeId) => void;
}) {
  const pistonCategory = aircraftPlanCategories.find((item) => item.id === "piston");

  return (
    <div>
      <div role="tablist" aria-label="Aircraft categories" className="flex gap-2 overflow-x-auto pb-2">
        {aircraftPlanCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={categoryId === category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2",
              categoryId === category.id
                ? "border-[var(--oc-navy)] bg-[var(--oc-navy)] text-white"
                : "border-[var(--oc-line)] bg-white/70 text-[var(--oc-muted)] hover:border-[var(--oc-blue)] hover:text-[var(--oc-ink)]",
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {categoryId === "piston" && pistonCategory?.subcategories ? (
        <div className="mt-4 inline-grid w-full grid-cols-1 gap-2 rounded-2xl border border-[var(--oc-line)] bg-white/[0.62] p-2 sm:w-auto sm:grid-cols-2">
          {pistonCategory.subcategories.map((subcategory) => (
            <button
              key={subcategory.id}
              type="button"
              aria-pressed={pistonSubtypeId === subcategory.id}
              onClick={() => onPistonSubtypeChange(subcategory.id)}
              className={cn(
                "min-h-11 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2",
                pistonSubtypeId === subcategory.id
                  ? "bg-[var(--oc-blue)] text-white"
                  : "text-[var(--oc-muted)] hover:bg-white hover:text-[var(--oc-ink)]",
              )}
            >
              {subcategory.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlanCard({
  plan,
  billing,
  selected,
  onToggle,
}: {
  plan: SupportPlan;
  billing: BillingInterval;
  selected: boolean;
  onToggle: () => void;
}) {
  const detailsId = `plan-details-${plan.id}`;

  return (
    <article
      className={cn(
        "oc-card flex h-full min-h-[560px] flex-col rounded-2xl border p-5 transition-colors",
        plan.featured ? "border-[var(--oc-blue)]" : "border-[var(--oc-line)]",
        selected && "border-[var(--oc-navy)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Badge variant="outline" className="border-[var(--oc-line)] bg-white/70 text-[var(--oc-ink)]">
          {plan.badge ?? "Support Plan"}
        </Badge>
        <Plane className="h-5 w-5 text-[var(--oc-blue)]" aria-hidden="true" />
      </div>
      <h3 className="oc-display mt-5 text-3xl text-[var(--oc-ink)]">{plan.name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{plan.description}</p>

      <div className="mt-6 rounded-xl border border-[var(--oc-line)] bg-white/70 p-4">
        <p className="text-xs font-semibold uppercase text-[var(--oc-muted)]">
          {billing === "monthly" ? "Monthly pricing" : "Annual billing"}
        </p>
        <p className="mt-2 text-2xl font-semibold text-[var(--oc-ink)]">{getPlanPrice(plan, billing)}</p>
        <p className="mt-3 text-xs leading-relaxed text-[var(--oc-muted)]">
          {billing === "annual" ? plan.billingNote : "Pricing covers AMG coordination/admin baseline unless otherwise stated."}
        </p>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div className="rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]/70 p-3">
          <dt className="font-semibold text-[var(--oc-ink)]">Included flights</dt>
          <dd className="mt-1 text-[var(--oc-muted)]">{displayValue(plan.includedFlights)}</dd>
        </div>
        <div className="rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]/70 p-3">
          <dt className="font-semibold text-[var(--oc-ink)]">Maintenance flights</dt>
          <dd className="mt-1 text-[var(--oc-muted)]">{displayValue(plan.includedMaintenanceFlights)}</dd>
        </div>
      </dl>

      <p className="mt-5 text-sm leading-relaxed text-[var(--oc-muted)]">{plan.supportScope}</p>
      <ul className="mt-5 grid gap-2 text-sm text-[var(--oc-ink)]/82">
        {plan.highlights.slice(0, 5).map((highlight) => (
          <li key={highlight} className="flex gap-2">
            <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <button
          type="button"
          aria-expanded={selected}
          aria-controls={detailsId}
          onClick={onToggle}
          className="flex min-h-11 w-full items-center justify-between rounded-full border border-[var(--oc-line-strong)] px-4 text-sm font-semibold text-[var(--oc-ink)] transition-colors hover:border-[var(--oc-blue)] hover:text-[var(--oc-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oc-blue)] focus-visible:ring-offset-2"
        >
          View support details
          <ChevronDown className={cn("h-4 w-4 transition-transform", selected && "rotate-180")} aria-hidden="true" />
        </button>
        <Button asChild className="mt-3 min-h-11 w-full rounded-full bg-[var(--oc-navy)] text-white hover:bg-[var(--oc-blue)]">
          <Link href={plan.ctaHref ?? REQUEST_REVIEW_HREF} prefetch={false}>
            {plan.ctaLabel ?? "Request Plan Review"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function PlanDetailsPanel({ plan }: { plan: SupportPlan | null }) {
  if (!plan) return null;

  return (
    <section id={`plan-details-${plan.id}`} className="mt-6 rounded-2xl border border-[var(--oc-line)] bg-white/[0.72] p-5 shadow-[var(--oc-shadow)] backdrop-blur-xl sm:p-6" aria-live="polite">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="oc-eyebrow text-[var(--oc-blue)]">Support details</p>
          <h3 className="oc-display mt-2 text-3xl text-[var(--oc-ink)]">{plan.name}</h3>
        </div>
        <Badge variant="outline" className="border-[var(--oc-line)] bg-[var(--oc-ivory)] text-[var(--oc-ink)]">
          Acceptance review required
        </Badge>
      </div>
      <Separator className="my-5 bg-[var(--oc-line)]" />
      <div className="grid gap-5 lg:grid-cols-3">
        <DetailBlock title="Included support" items={plan.details.includedSupport} />
        <DetailBlock title="Crew, travel, lodging" body={plan.details.crewTravelLodging} />
        <DetailBlock title="Maintenance movement" body={plan.details.maintenanceMovement} />
        <DetailBlock title="Overage handling" body={plan.details.overageHandling} />
        <DetailBlock title="Billing terms" body={plan.details.billingTerms} />
        <DetailBlock title="Limitations" body={plan.details.limitations} />
      </div>
      <p className="mt-5 rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)] p-4 text-sm leading-relaxed text-[var(--oc-muted)]">
        {plan.details.acceptanceReview}
      </p>
    </section>
  );
}

function DetailBlock({ title, body, items }: { title: string; body?: string; items?: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[var(--oc-ink)]">{title}</h4>
      {items ? (
        <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-[var(--oc-muted)]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{body}</p>
      )}
    </div>
  );
}

function PlanComparisonMatrix({ plans, contextLabel }: { plans: SupportPlan[]; contextLabel: string }) {
  return (
    <section id="plans-comparison" className="oc-shell py-16 lg:py-24" aria-labelledby="comparison-heading">
      <div className="max-w-3xl">
        <p className="oc-eyebrow text-[var(--oc-blue)]">Comparison Matrix</p>
        <h2 id="comparison-heading" className="oc-display mt-4 text-4xl text-[var(--oc-ink)] sm:text-5xl">
          Compare {contextLabel} support levels.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-[var(--oc-muted)]">
          Values reflect public support scope language. Final allowances, variable expenses, and acceptance remain tied
          to the reviewed aircraft and approved support scope.
        </p>
      </div>

      <div className="mt-9 hidden overflow-hidden rounded-2xl border border-[var(--oc-line)] bg-white/[0.72] shadow-[var(--oc-shadow)] backdrop-blur-xl lg:block">
        <table className="w-full table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--oc-line)]">
              <th className="w-[18%] p-4 text-sm font-semibold text-[var(--oc-ink)]">Support area</th>
              {plans.map((plan) => (
                <th key={plan.id} className="p-4 text-sm font-semibold text-[var(--oc-ink)]">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.key} className="border-b border-[var(--oc-line)] last:border-b-0">
                <th className="bg-[var(--oc-ivory)]/55 p-4 align-top text-sm font-semibold text-[var(--oc-ink)]">
                  {row.label}
                </th>
                {plans.map((plan) => (
                  <td key={`${plan.id}-${row.key}`} className="p-4 align-top text-sm leading-relaxed text-[var(--oc-muted)]">
                    {displayValue(plan.comparison[row.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 lg:hidden">
        {plans.map((plan) => (
          <Card key={plan.id} className="rounded-2xl border-[var(--oc-line)] bg-white/[0.74]">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold text-[var(--oc-ink)]">{plan.name}</h3>
              <dl className="mt-4 grid gap-3">
                {comparisonRows.map((row) => (
                  <div key={row.key} className="rounded-xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]/65 p-3">
                    <dt className="text-xs font-semibold uppercase text-[var(--oc-ink)]">{row.label}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-[var(--oc-muted)]">
                      {displayValue(plan.comparison[row.key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function PlansOperationalNotes() {
  return (
    <section className="oc-shell pb-16 lg:pb-24" aria-labelledby="operational-notes-heading">
      <div className="rounded-2xl border border-[var(--oc-line)] bg-[var(--oc-ivory)]/80 p-6 shadow-[var(--oc-shadow)] sm:p-8">
        <p className="oc-eyebrow text-[var(--oc-blue)]">Operational Notes</p>
        <h2 id="operational-notes-heading" className="oc-display mt-3 text-3xl text-[var(--oc-ink)] sm:text-4xl">
          Clear operating responsibility before acceptance.
        </h2>
        <div className="mt-6 grid gap-5 text-sm leading-relaxed text-[var(--oc-muted)] lg:grid-cols-3">
          <p>
            AMG does not present a request as accepted until the support scope, aircraft status, crew availability,
            owner/operator approval, and operational conditions have been reviewed.
          </p>
          <p>
            Plan pricing covers AMG coordination and support administration unless otherwise stated. Crew compensation,
            travel, lodging, aircraft operating expenses, vendor charges, maintenance facility costs, and third-party
            services may be billed separately or passed through according to the approved support scope.
          </p>
          <p>
            AMG plans do not guarantee aircraft availability, crew availability, mission completion, maintenance
            facility availability, or operational acceptance.
          </p>
        </div>
      </div>
    </section>
  );
}

function PlansCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--oc-navy)] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,oklch(0.78_0.12_233_/_18%),transparent_28rem)]" />
      <div className="oc-shell py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">Plan Review</p>
          <h2 className="oc-display mt-4 text-4xl text-[var(--oc-paper)] sm:text-5xl">
            Need help choosing the right support level?
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            AMG can review your aircraft category, expected flight volume, maintenance movement needs, crew
            requirements, and owner/operator preferences before recommending a support path.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="min-h-11 rounded-full bg-white px-6 text-[var(--oc-navy)] hover:bg-white/90">
              <Link href={REQUEST_REVIEW_HREF} prefetch={false}>
                Request Plan Review
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 rounded-full border-white/[0.28] bg-white/[0.05] px-6 text-white hover:bg-white/[0.12] hover:text-white">
              <Link href={CONTACT_HREF} prefetch={false}>
                Contact AMG
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
