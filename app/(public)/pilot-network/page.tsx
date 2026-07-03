import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, UserCheck } from "lucide-react";
import { CtaBand, PageHero, SectionHeading } from "@/components/site/oc/shared";
import { IMG } from "@/lib/site-media";

export const metadata: Metadata = {
  title: "Pilot Network | AMG Aviation Group",
  description:
    "AMG reviews pilot and crew profiles for aircraft experience, airport region, credential readiness, availability, and assignment suitability.",
};

const reviewPoints = [
  "Aircraft experience",
  "Airport region",
  "Credential readiness",
  "Availability",
  "Assignment suitability",
] as const;

const networkCards = [
  {
    title: "Profile Review",
    body: "AMG reviews pilot and crew profiles for aircraft experience, airport region, credential readiness, availability, and assignment suitability.",
    icon: UserCheck,
  },
  {
    title: "Aircraft Fit",
    body: "Potential support is considered against aircraft type, crew role, timing, location, and owner/operator requirements.",
    icon: ShieldCheck,
  },
  {
    title: "Regional Context",
    body: "Home airport and preferred coverage areas help AMG understand where a profile may be relevant.",
    icon: MapPin,
  },
] as const;

export default function PilotNetworkPage() {
  return (
    <>
      <PageHero
        eyebrow="Pilot Network"
        title="Pilot and crew profiles reviewed for real aircraft needs."
        lead="AMG reviews pilot and crew profiles for aircraft experience, airport region, credential readiness, availability, and assignment suitability."
        image={IMG.pilotNetwork}
        imageAlt="Flight crew walking the ramp toward an aircraft"
        primary={{ label: "Join Pilot Network", href: "/crew-network/apply" }}
        secondary={{ label: "Member Login", href: "/login" }}
      />

      <section className="oc-section bg-[var(--oc-ivory)]">
        <div className="oc-shell">
          <SectionHeading
            eyebrow="How Review Works"
            title="A profile is reviewed before assignment consideration."
            lead="The network is not a casual job board or a guarantee of assignment. AMG uses profile information to understand aircraft, location, credential, and timing fit."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {networkCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="oc-card rounded-lg p-6">
                  <Icon className="h-6 w-6 text-[var(--oc-blue)]" aria-hidden="true" />
                  <h2 className="mt-5 text-2xl font-semibold text-[var(--oc-ink)]">{card.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--oc-muted)]">{card.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="oc-section bg-[var(--oc-ivory-2)]">
        <div className="oc-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <SectionHeading
            eyebrow="Review Inputs"
            title="The details that shape assignment suitability."
            lead="AMG may request additional information through approved channels if a profile appears relevant to a support need."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {reviewPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 rounded-lg border border-[var(--oc-line)] bg-white p-4 text-sm font-semibold text-[var(--oc-ink)]">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--oc-blue)]" aria-hidden="true" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--oc-graphite)] py-14 text-white">
        <div className="oc-shell">
          <div className="rounded-lg border border-white/[0.12] bg-white/[0.05] p-6">
            <p className="text-sm leading-relaxed text-[var(--oc-aluminum)]">
              Submitting credentials does not guarantee assignment, compensation, contractor status, or future engagement.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/crew-network/apply" prefetch={false} className="oc-btn oc-btn-light">
                Join Pilot Network
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" prefetch={false} className="oc-btn oc-btn-ghost-dark">
                Member Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Pilot Network"
        title="Submit a profile for AMG review."
        body="AMG reviews aircraft experience, region, credential readiness, availability, and suitability before any assignment consideration."
        primaryLabel="Join Pilot Network"
        primaryHref="/crew-network/apply"
        secondaryLabel="Member Login"
        secondaryHref="/login"
      />
    </>
  );
}
