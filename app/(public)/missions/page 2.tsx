import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MISSION_CASE_STUDIES } from "@/content/missions";
import { MissionCard } from "@/components/site/mission-card";

export const metadata: Metadata = {
  title: "Missions — Case Studies with Real Numbers",
  description:
    "Real coordinated missions: route, aircraft, timeline from request to wheels-up, and the itemized all-in cost. One new case study per month minimum.",
};

export default function MissionsPage() {
  const missions = [...MISSION_CASE_STUDIES].sort((a, b) => b.flownOn.localeCompare(a.flownOn));

  return (
    <>
      <section className="oc-shell pt-[calc(var(--public-header-height)+4rem)]">
        <div className="max-w-3xl">
          <p className="oc-eyebrow oc-eyebrow-light">Missions</p>
          <h1 className="oc-display mt-4 text-5xl text-[var(--oc-paper)] sm:text-6xl">
            Real missions, itemized.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--oc-aluminum)]">
            Every case study shows the route, the timeline from request to wheels-up, and the
            all-in cost — matching the invoice format. N-numbers available on request.
          </p>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-shell">
          {missions.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {missions.map((mission) => (
                <MissionCard key={mission.slug} mission={mission} />
              ))}
            </div>
          ) : (
            <div className="oc-card-dark mx-auto max-w-2xl p-8 text-center lg:p-10">
              <h2 className="oc-display text-3xl text-[var(--oc-paper)]">
                First case studies publish at launch.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--oc-aluminum)]">
                We publish only missions we actually flew — route, timeline, and itemized cost.
                Our launch gate is three of them, and at least one new case study lands here
                every month after. No stock stories, ever.
              </p>
            </div>
          )}

          <div className="mt-14 flex justify-center">
            <Link href="/request" prefetch={false} className="oc-btn oc-btn-light">
              Get a Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
